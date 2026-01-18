import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

/**
 * OrderItem stores SNAPSHOTS of product data at purchase time.
 * This is critical - we never reference live product data for historical orders.
 * If product details change after purchase, the order record remains accurate.
 */
@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'variant_id', type: 'uuid' })
    variantId: string;

    // CRITICAL: Snapshot fields - these preserve data at purchase time
    @Column({ name: 'sku_snapshot', length: 100 })
    skuSnapshot: string;

    @Column({ name: 'product_name_snapshot', length: 255 })
    productNameSnapshot: string;

    @Column({ name: 'size_snapshot', length: 20 })
    sizeSnapshot: string;

    @Column({ name: 'color_snapshot', length: 50 })
    colorSnapshot: string;

    @Column({ type: 'integer' })
    quantity: number;

    @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
    totalPrice: number;

    @Column({ name: 'fulfillment_store_id', type: 'uuid', nullable: true })
    fulfillmentStoreId: string;

    // Fulfillment status for individual items
    @Column({ name: 'is_fulfilled', default: false })
    isFulfilled: boolean;

    @Column({ name: 'fulfilled_at', type: 'timestamp', nullable: true })
    fulfilledAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
