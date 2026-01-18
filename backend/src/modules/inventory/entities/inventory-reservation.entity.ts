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
import { Store } from './store.entity';

export enum ReservationStatus {
    ACTIVE = 'active',
    CONVERTED = 'converted',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

/**
 * InventoryReservations are the CRITICAL mechanism to prevent overselling.
 * 
 * When a customer adds an item to cart, a reservation is created.
 * This temporarily "holds" the stock until:
 * - Payment succeeds (status → converted)
 * - Reservation expires (status → expired, 10 min default)
 * - Customer removes from cart (status → cancelled)
 * 
 * SELLABLE STOCK = store_inventory.quantity - SUM(active_reservations.quantity)
 */
@Entity('inventory_reservations')
@Index(['sku', 'storeId', 'status', 'expiresAt'])
export class InventoryReservation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'store_id' })
    storeId: string;

    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ length: 100 })
    @Index()
    sku: string;

    @Column({ type: 'integer' })
    quantity: number;

    @Column({ name: 'expires_at', type: 'timestamp' })
    @Index()
    expiresAt: Date;

    @Column({ name: 'order_id', type: 'uuid', nullable: true })
    orderId: string;

    @Column({ name: 'session_id', length: 255 })
    @Index()
    sessionId: string;

    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.ACTIVE,
    })
    status: ReservationStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
