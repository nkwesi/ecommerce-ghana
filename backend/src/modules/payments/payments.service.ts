import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, WebhookEvent } from './entities/payment.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { InventoryReservation, ReservationStatus } from '../inventory/entities/inventory-reservation.entity';
import * as crypto from 'crypto';

export interface PolarWebhookEvent {
    id: string;
    type: string;
    data: {
        paymentIntentId: string;
        amount?: number;
        currency?: string;
        status?: string;
        failureReason?: string;
        refundAmount?: number;
        metadata?: Record<string, any>;
    };
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);
    private readonly webhookSecret: string;

    constructor(
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(WebhookEvent)
        private webhookEventRepository: Repository<WebhookEvent>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(InventoryReservation)
        private reservationRepository: Repository<InventoryReservation>,
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        this.webhookSecret = this.configService.get<string>('app.polarWebhookSecret', '');
    }

    /**
     * Verify webhook signature from Polar.
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        if (!this.webhookSecret) {
            this.logger.warn('Webhook secret not configured - skipping verification');
            return true; // Allow in development
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature),
        );
    }

    /**
     * Process webhook event from Polar.
     * CRITICAL: All payment state changes happen here, never from frontend.
     */
    async processWebhook(event: PolarWebhookEvent): Promise<void> {
        // Check for idempotency
        const existingEvent = await this.webhookEventRepository.findOne({
            where: { eventId: event.id },
        });

        if (existingEvent) {
            this.logger.log(`Webhook event ${event.id} already processed, skipping`);
            return;
        }

        // Store the event for idempotency
        const webhookEvent = this.webhookEventRepository.create({
            eventId: event.id,
            eventType: event.type,
            provider: 'polar',
            payload: event.data,
        });

        try {
            switch (event.type) {
                case 'payment.succeeded':
                    await this.handlePaymentSuccess(event);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailure(event);
                    break;
                case 'refund.processed':
                    await this.handleRefund(event);
                    break;
                default:
                    this.logger.log(`Unhandled webhook event type: ${event.type}`);
            }

            webhookEvent.isSuccessful = true;
        } catch (error) {
            webhookEvent.isSuccessful = false;
            webhookEvent.errorMessage = error.message;
            this.logger.error(`Error processing webhook ${event.id}: ${error.message}`);
        }

        await this.webhookEventRepository.save(webhookEvent);
    }

    /**
     * Handle successful payment.
     * CRITICAL: This is the ONLY place where orders become "paid".
     */
    private async handlePaymentSuccess(event: PolarWebhookEvent): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            // 1. Find and update payment
            const payment = await manager.findOne(Payment, {
                where: { paymentIntentId: event.data.paymentIntentId },
            });

            if (!payment) {
                throw new Error(`Payment not found: ${event.data.paymentIntentId}`);
            }

            payment.status = PaymentStatus.SUCCEEDED;
            await manager.save(Payment, payment);

            // 2. Update order status
            const order = await manager.findOne(Order, {
                where: { id: payment.orderId },
            });

            if (!order) {
                throw new Error(`Order not found: ${payment.orderId}`);
            }

            order.status = OrderStatus.PAID;
            await manager.save(Order, order);

            // 3. Convert reservations (make inventory deduction permanent)
            await manager.update(
                InventoryReservation,
                { orderId: order.id, status: ReservationStatus.ACTIVE },
                { status: ReservationStatus.CONVERTED },
            );

            this.logger.log(
                `Payment successful for order ${order.orderNumber}, status updated to PAID`,
            );

            // 4. TODO: Send confirmation email
            // await this.emailService.sendOrderConfirmation(order);

            // 5. TODO: Notify store for fulfillment
            // await this.notificationService.notifyStore(order);
        });
    }

    /**
     * Handle failed payment.
     */
    private async handlePaymentFailure(event: PolarWebhookEvent): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            // 1. Find and update payment
            const payment = await manager.findOne(Payment, {
                where: { paymentIntentId: event.data.paymentIntentId },
            });

            if (!payment) {
                throw new Error(`Payment not found: ${event.data.paymentIntentId}`);
            }

            payment.status = PaymentStatus.FAILED;
            payment.failureReason = event.data.failureReason ?? 'Unknown error';
            await manager.save(Payment, payment);

            // 2. Update order status
            const order = await manager.findOne(Order, {
                where: { id: payment.orderId },
            });

            if (!order) {
                throw new Error(`Order not found: ${payment.orderId}`);
            }

            order.status = OrderStatus.CANCELLED;
            await manager.save(Order, order);

            // 3. Cancel reservations (release stock)
            await manager.update(
                InventoryReservation,
                { orderId: order.id },
                { status: ReservationStatus.CANCELLED },
            );

            this.logger.log(
                `Payment failed for order ${order.orderNumber}, reservations released`,
            );

            // 4. TODO: Send failure notification to customer
        });
    }

    /**
     * Handle refund processed.
     */
    private async handleRefund(event: PolarWebhookEvent): Promise<void> {
        const payment = await this.paymentRepository.findOne({
            where: { paymentIntentId: event.data.paymentIntentId },
        });

        if (!payment) {
            throw new Error(`Payment not found: ${event.data.paymentIntentId}`);
        }

        payment.status = PaymentStatus.REFUNDED;
        payment.refundAmount = event.data.refundAmount ?? 0;
        payment.refundedAt = new Date();
        await this.paymentRepository.save(payment);

        this.logger.log(`Refund processed for payment ${payment.id}`);

        // TODO: Handle partial refunds
    }

    /**
     * Get payment by order ID.
     */
    async findByOrderId(orderId: string): Promise<Payment | null> {
        return this.paymentRepository.findOne({
            where: { orderId },
        });
    }

    /**
     * Simulate payment success (for testing).
     */
    async simulatePaymentSuccess(paymentIntentId: string): Promise<void> {
        const mockEvent: PolarWebhookEvent = {
            id: `evt_mock_${Date.now()}`,
            type: 'payment.succeeded',
            data: {
                paymentIntentId,
                status: 'succeeded',
            },
        };

        await this.processWebhook(mockEvent);
    }

    /**
     * Simulate payment failure (for testing).
     */
    async simulatePaymentFailure(
        paymentIntentId: string,
        reason: string,
    ): Promise<void> {
        const mockEvent: PolarWebhookEvent = {
            id: `evt_mock_${Date.now()}`,
            type: 'payment.failed',
            data: {
                paymentIntentId,
                status: 'failed',
                failureReason: reason,
            },
        };

        await this.processWebhook(mockEvent);
    }
}
