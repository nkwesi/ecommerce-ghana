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
import { User } from '../../users/entities/user.entity';

export type AddressType = 'home' | 'work' | 'shipping';

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    @Index()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 20, default: 'home' })
    type: AddressType;

    @Column({ name: 'line_1', length: 255 })
    line1: string;

    @Column({ name: 'line_2', length: 255, nullable: true })
    line2: string;

    @Column({ length: 100 })
    city: string;

    @Column({ length: 100 })
    region: string;

    @Column({ length: 100, default: 'Ghana' })
    country: string;

    @Column({ length: 20 })
    phone: string;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
