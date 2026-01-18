import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Store } from './store.entity';

/**
 * StoreInventory represents the physical stock at each store.
 * This table is READ-ONLY for the e-commerce platform.
 * Stock levels are synced from the external POS/inventory system.
 */
@Entity('store_inventory')
@Index(['sku', 'storeId'])
export class StoreInventory {
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

    @Column({ type: 'integer', default: 0 })
    quantity: number;

    @Column({ name: 'last_synced_at', type: 'timestamp', nullable: true })
    lastSyncedAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
