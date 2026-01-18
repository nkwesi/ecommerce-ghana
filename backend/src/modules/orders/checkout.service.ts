import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShippingAddress } from './entities/shipping-address.entity';
import { ReservationService } from '../inventory/reservation.service';
import { InventoryReservation, ReservationStatus } from '../inventory/entities/inventory-reservation.entity';
import { ProductsService } from '../products/products.service';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CartItem {
    variantId: string;
    quantity: number;
}

export interface CustomerInfo {
    email: string;
    name: string;
    phone?: string;
}

export interface ShippingInfo {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    phone: string;
    deliveryInstructions?: string;
}

export interface CheckoutResult {
    order: Order;
    paymentIntentId: string;
    checkoutUrl: string;
}

@Injectable()
export class CheckoutService {
    private readonly logger = new Logger(CheckoutService.name);
    private readonly vatRate: number;
    private readonly currency: string;
    private readonly countryCode: string;

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(ShippingAddress)
        private shippingAddressRepository: Repository<ShippingAddress>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        private dataSource: DataSource,
        private configService: ConfigService,
        private reservationService: ReservationService,
        private productsService: ProductsService,
    ) {
        this.vatRate = this.configService.get<number>('app.vatRate', 0.125);
        this.currency = this.configService.get<string>('app.currency', 'GHS');
        this.countryCode = this.configService.get<string>('app.countryCode', 'GH');
    }

    /**
     * Process checkout - ATOMIC TRANSACTION
     * Creates reservations, order, order items, and payment intent.
     */
    async processCheckout(
        sessionId: string,
        customer: CustomerInfo,
        shipping: ShippingInfo,
    ): Promise<CheckoutResult> {
        return this.dataSource.transaction(async (manager) => {
            // Step 1: Get active reservations for this session
            const reservations = await manager.find(InventoryReservation, {
                where: {
                    sessionId,
                    status: ReservationStatus.ACTIVE,
                },
                relations: ['store'],
            },
            );

            if (reservations.length === 0) {
                throw new BadRequestException('No items in cart');
            }

            // Step 2: Validate all reservations are still valid
            const now = new Date();
            for (const reservation of reservations) {
                if (reservation.expiresAt < now) {
                    throw new BadRequestException(
                        `Reservation for ${reservation.sku} has expired. Please add items to cart again.`,
                    );
                }
            }

            // Step 3: Calculate order totals
            let subtotal = 0;
            const itemsData: Partial<OrderItem>[] = [];

            for (const reservation of reservations) {
                const variant = await this.productsService.findVariantBySku(reservation.sku);
                const itemTotal = Number(variant.price) * reservation.quantity;
                subtotal += itemTotal;

                itemsData.push({
                    variantId: variant.id,
                    skuSnapshot: variant.sku,
                    productNameSnapshot: variant.product?.name ?? 'Unknown Product',
                    sizeSnapshot: variant.sizeCode,
                    colorSnapshot: variant.color,
                    quantity: reservation.quantity,
                    unitPrice: variant.price,
                    totalPrice: itemTotal,
                    fulfillmentStoreId: reservation.storeId,
                });
            }

            const taxAmount = subtotal * this.vatRate;
            const shippingCost = this.calculateShipping(subtotal);
            const total = subtotal + taxAmount + shippingCost;

            // Step 4: Generate order number
            const orderNumber = await this.generateOrderNumber();

            // Step 5: Create order
            const order = manager.create(Order, {
                orderNumber,
                customerEmail: customer.email,
                customerName: customer.name,
                customerPhone: customer.phone,
                status: OrderStatus.PENDING,
                subtotal,
                taxAmount,
                shippingCost,
                total,
                currency: this.currency,
                countryCode: this.countryCode,
            });

            const savedOrder = await manager.save(Order, order);

            // Step 6: Create order items
            for (const itemData of itemsData) {
                const orderItem = manager.create(OrderItem, {
                    ...itemData,
                    orderId: savedOrder.id,
                });
                await manager.save(OrderItem, orderItem);
            }

            // Step 7: Create shipping address
            const shippingAddress = manager.create(ShippingAddress, {
                orderId: savedOrder.id,
                fullName: shipping.fullName,
                addressLine1: shipping.addressLine1,
                addressLine2: shipping.addressLine2,
                city: shipping.city,
                region: shipping.region,
                postalCode: shipping.postalCode,
                countryCode: this.countryCode,
                phone: shipping.phone,
                deliveryInstructions: shipping.deliveryInstructions,
            });
            await manager.save(ShippingAddress, shippingAddress);

            // Step 8: Link reservations to order
            for (const reservation of reservations) {
                await manager.update(InventoryReservation,
                    { id: reservation.id },
                    { orderId: savedOrder.id },
                );
            }

            // Step 9: Create payment intent (mock for now)
            const paymentIntentId = `pi_mock_${uuidv4().replace(/-/g, '')}`;
            const checkoutUrl = `http://localhost:3000/checkout/payment?order=${savedOrder.orderNumber}&intent=${paymentIntentId}`;

            const payment = manager.create(Payment, {
                orderId: savedOrder.id,
                paymentProvider: 'polar',
                paymentIntentId,
                checkoutUrl,
                amount: total,
                currency: this.currency,
                status: PaymentStatus.PENDING,
            });
            await manager.save(Payment, payment);

            this.logger.log(
                `Created order ${orderNumber} for ${customer.email}, total: ${this.currency} ${total}`,
            );

            return {
                order: savedOrder,
                paymentIntentId,
                checkoutUrl,
            };
        });
    }

    /**
     * Generate a human-readable order number.
     * Format: GH-YYYYMMDD-XXXX (e.g., GH-20260118-0001)
     */
    private async generateOrderNumber(): Promise<string> {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

        // Get count of orders today
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const count = await this.orderRepository
            .createQueryBuilder('o')
            .where('o.createdAt >= :start', { start: startOfDay })
            .andWhere('o.createdAt <= :end', { end: endOfDay })
            .getCount();

        const sequence = String(count + 1).padStart(4, '0');
        return `GH-${dateStr}-${sequence}`;
    }

    /**
     * Calculate shipping cost based on order subtotal.
     */
    private calculateShipping(subtotal: number): number {
        // Free shipping over 500 GHS, otherwise 25 GHS flat rate
        if (subtotal >= 500) {
            return 0;
        }
        return 25;
    }
}
