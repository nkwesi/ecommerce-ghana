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
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id' })
    productId: string;

    @ManyToOne(() => Product, (product) => product.variants)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ length: 100, unique: true })
    @Index()
    sku: string;

    @Column({ name: 'size_code', length: 20 })
    sizeCode: string;

    @Column({ name: 'size_model', length: 50, default: 'STANDARD_V1' })
    sizeModel: string;

    @Column({ length: 50 })
    color: string;

    @Column({ name: 'color_hex', length: 7, nullable: true })
    colorHex: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ name: 'compare_at_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
    compareAtPrice: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'simple-array', nullable: true })
    images: string[];

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
