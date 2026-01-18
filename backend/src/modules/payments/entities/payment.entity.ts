import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentStatus {
    PENDING = 'pending',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'payment_provider', length: 50, default: 'polar' })
    paymentProvider: string;

    @Column({ name: 'payment_intent_id', length: 255, unique: true })
    @Index()
    paymentIntentId: string;

    @Column({ name: 'checkout_url', length: 500, nullable: true })
    checkoutUrl: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 3, default: 'GHS' })
    currency: string;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;

    @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
    refundAmount: number;

    @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
    refundedAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ name: 'failure_reason', type: 'text', nullable: true })
    failureReason: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

/**
 * Track processed webhook events for idempotency
 */
@Entity('webhook_events')
export class WebhookEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'event_id', length: 255, unique: true })
    @Index()
    eventId: string;

    @Column({ name: 'event_type', length: 100 })
    eventType: string;

    @Column({ length: 50 })
    provider: string;

    @Column({ name: 'processed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    processedAt: Date;

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, any>;

    @Column({ name: 'is_successful', default: true })
    isSuccessful: boolean;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;
}
