import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { ShippingAddress } from './shipping-address.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_number', length: 50, unique: true })
    @Index()
    orderNumber: string;

    @Column({ name: 'customer_email', length: 255 })
    @Index()
    customerEmail: string;

    @Column({ name: 'customer_name', length: 255 })
    customerName: string;

    @Column({ name: 'customer_phone', length: 20, nullable: true })
    customerPhone: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
    taxAmount: number;

    @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
    shippingCost: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total: number;

    @Column({ length: 3, default: 'GHS' })
    currency: string;

    @Column({ name: 'country_code', length: 2, default: 'GH' })
    countryCode: string;

    @Column({ name: 'tracking_number', length: 100, nullable: true })
    trackingNumber: string;

    @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
    shippedAt: Date;

    @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
    deliveredAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => ShippingAddress, (address) => address.order, { cascade: true })
    shippingAddresses: ShippingAddress[];

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
