import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true })
    @Index()
    email: string;

    @Column({ name: 'full_name', length: 255, nullable: true })
    fullName: string;

    @Column({ name: 'phone_number', length: 20, nullable: true })
    phoneNumber: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role: UserRole;

    @Column({ nullable: true, select: false })
    password: string;

    // Settings fields
    @Column({ length: 3, default: 'GHS' })
    currency: string;

    @Column({ length: 10, default: 'en-US' })
    language: string;

    @Column({ name: 'two_factor_enabled', default: false })
    twoFactorEnabled: boolean;

    @Column({ name: 'marketing_opt_in', default: true })
    marketingOptIn: boolean;

    @Column({ name: 'order_notifications', default: true })
    orderNotifications: boolean;

    @Column({ type: 'jsonb', nullable: true })
    preferences: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

