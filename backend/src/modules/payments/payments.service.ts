import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Payment, PaymentStatus, WebhookEvent } from './entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { InventoryReservation, ReservationStatus } from '../inventory/entities/inventory-reservation.entity';

export interface PaystackWebhookEvent {
    event: string;
    data: {
        id?: number | string;
        reference: string;
        amount?: number;
        currency?: string;
        status?: string;
        gateway_response?: string;
        metadata?: Record<string, unknown>;
    };
}

interface PaystackTransaction {
    id?: number | string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    gateway_response?: string;
    metadata?: Record<string, unknown>;
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly webhookSecret: string;
    private readonly paystackSecretKey: string;
    private readonly paymentMode: string;

    constructor(
        @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
        @InjectRepository(WebhookEvent) private webhookEventRepository: Repository<WebhookEvent>,
        @InjectRepository(Order) private orderRepository: Repository<Order>,
        @InjectRepository(InventoryReservation) private reservationRepository: Repository<InventoryReservation>,
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        this.webhookSecret = this.configService.get<string>('app.paystackWebhookSecret', '');
        this.paystackSecretKey = this.configService.get<string>('app.paystackSecretKey', '');
        this.paymentMode = this.configService.get<string>('app.paymentMode', 'demo');
    }

    verifyWebhookSignature(payload: Buffer | string, signature: string): boolean {
        if (!this.webhookSecret || !signature) return false;
        const expected = crypto.createHmac('sha512', this.webhookSecret).update(payload).digest('hex');
        const received = Buffer.from(signature, 'utf8');
        const expectedBuffer = Buffer.from(expected, 'utf8');
        return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
    }

    async processWebhook(event: PaystackWebhookEvent): Promise<void> {
        const eventId = `paystack:${event.event}:${event.data.id ?? event.data.reference}`;
        const existing = await this.webhookEventRepository.findOne({ where: { eventId } });
        if (existing?.isSuccessful) {
            this.logger.log(`Webhook ${eventId} already processed`);
            return;
        }

        const webhookEvent = existing ?? this.webhookEventRepository.create({
            eventId,
            eventType: event.event,
            provider: 'paystack',
            payload: event.data,
        });

        try {
            if (event.event === 'charge.success') {
                await this.handlePaymentSuccess(event);
            } else if (event.event === 'charge.failed') {
                await this.handlePaymentFailure(event);
            } else {
                this.logger.log(`Ignoring Paystack event ${event.event}`);
            }
            webhookEvent.isSuccessful = true;
        } catch (error) {
            webhookEvent.isSuccessful = false;
            webhookEvent.errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
            await this.webhookEventRepository.save(webhookEvent);
            throw error;
        }

        await this.webhookEventRepository.save(webhookEvent);
    }

    private async handlePaymentSuccess(
        event: PaystackWebhookEvent,
        verifiedTransaction?: PaystackTransaction,
    ): Promise<void> {
        const transaction = verifiedTransaction ?? (this.paymentMode === 'paystack'
            ? await this.verifyPaystackTransaction(event.data.reference)
            : {
                ...event.data,
                amount: event.data.amount ?? 0,
                currency: event.data.currency ?? '',
                status: event.data.status ?? 'success',
            });

        if (transaction.status !== 'success') {
            throw new Error(`Payment is not successful: ${event.data.reference} (${transaction.status})`);
        }

        await this.dataSource.transaction(async (manager) => {
            const payment = await manager.findOne(Payment, { where: { paymentIntentId: event.data.reference } });
            if (!payment) throw new Error(`Payment not found: ${event.data.reference}`);
            if (payment.status === PaymentStatus.SUCCEEDED) return;

            if (!Number.isSafeInteger(transaction.amount) || payment.amountPesewas !== transaction.amount) {
                throw new Error(`Payment amount mismatch for ${event.data.reference}`);
            }
            if (transaction.currency !== payment.currency) {
                throw new Error(`Payment currency mismatch for ${event.data.reference}`);
            }

            const order = await manager.findOne(Order, { where: { id: payment.orderId } });
            if (!order) throw new Error(`Order not found: ${payment.orderId}`);
            if (transaction.reference !== payment.paymentIntentId) {
                throw new Error(`Payment reference mismatch for ${event.data.reference}`);
            }
            if (transaction.metadata?.orderId && transaction.metadata.orderId !== order.id) {
                throw new Error(`Payment order mismatch for ${event.data.reference}`);
            }

            payment.status = PaymentStatus.SUCCEEDED;
            order.status = OrderStatus.PAID;
            await manager.save(Payment, payment);
            await manager.save(Order, order);
            await manager.update(
                InventoryReservation,
                { orderId: order.id, status: ReservationStatus.ACTIVE },
                { status: ReservationStatus.CONVERTED },
            );
            this.logger.log(`Payment confirmed for ${order.orderNumber}`);
        });
    }

    private async handlePaymentFailure(event: PaystackWebhookEvent): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            const payment = await manager.findOne(Payment, { where: { paymentIntentId: event.data.reference } });
            if (!payment || payment.status === PaymentStatus.SUCCEEDED) return;
            const order = await manager.findOne(Order, { where: { id: payment.orderId } });
            if (!order) throw new Error(`Order not found: ${payment.orderId}`);

            payment.status = PaymentStatus.FAILED;
            payment.failureReason = event.data.gateway_response || 'Payment failed';
            order.status = OrderStatus.CANCELLED;
            await manager.save(Payment, payment);
            await manager.save(Order, order);
            await manager.update(
                InventoryReservation,
                { orderId: order.id, status: ReservationStatus.ACTIVE },
                { status: ReservationStatus.CANCELLED },
            );
        });
    }

    async findByOrderId(orderId: string): Promise<Payment | null> {
        return this.paymentRepository.findOne({ where: { orderId } });
    }

    async reconcileOrderPayment(orderId: string): Promise<PaymentStatus> {
        const payment = await this.findByOrderId(orderId);
        if (!payment) throw new Error(`Payment not found for order: ${orderId}`);
        if (payment.status !== PaymentStatus.PENDING || payment.paymentProvider !== 'paystack') {
            return payment.status;
        }

        const transaction = await this.verifyPaystackTransaction(payment.paymentIntentId);
        if (transaction.status === 'success') {
            await this.handlePaymentSuccess(
                { event: 'charge.success', data: transaction },
                transaction,
            );
            return PaymentStatus.SUCCEEDED;
        }
        if (['failed', 'abandoned', 'reversed'].includes(transaction.status)) {
            await this.handlePaymentFailure({
                event: 'charge.failed',
                data: transaction,
            });
            return PaymentStatus.FAILED;
        }
        return PaymentStatus.PENDING;
    }

    private async verifyPaystackTransaction(reference: string): Promise<PaystackTransaction> {
        if (!this.paystackSecretKey) throw new Error('Paystack secret key is not configured');
        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${this.paystackSecretKey}` } },
        );
        const result = await response.json() as {
            status?: boolean;
            message?: string;
            data?: PaystackTransaction;
        };
        if (!response.ok || !result.status || !result.data) {
            throw new Error(result.message || `Unable to verify payment ${reference}`);
        }
        if (result.data.reference !== reference) {
            throw new Error(`Payment reference mismatch for ${reference}`);
        }
        return result.data;
    }

    async simulatePaymentSuccess(reference: string): Promise<void> {
        const payment = await this.paymentRepository.findOne({ where: { paymentIntentId: reference } });
        if (!payment) throw new Error(`Payment not found: ${reference}`);
        await this.processWebhook({
            event: 'charge.success',
            data: {
                id: `demo-${Date.now()}`,
                reference,
                amount: payment.amountPesewas,
                currency: payment.currency,
                status: 'success',
            },
        });
    }

    async simulatePaymentFailure(reference: string, reason: string): Promise<void> {
        await this.processWebhook({
            event: 'charge.failed',
            data: { id: `demo-${Date.now()}`, reference, status: 'failed', gateway_response: reason },
        });
    }
}
