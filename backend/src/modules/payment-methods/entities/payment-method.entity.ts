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

export type CardType = 'VISA' | 'MASTERCARD' | 'MTN_MOMO' | 'VODAFONE_CASH' | 'AIRTELTIGO';

@Entity('payment_methods')
export class PaymentMethod {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    @Index()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 20 })
    type: CardType;

    @Column({ name: 'last_4', length: 4 })
    last4: string;

    @Column({ length: 7, nullable: true })
    expiry: string;

    @Column({ name: 'holder_name', length: 255 })
    holderName: string;

    @Column({ name: 'is_primary', default: false })
    isPrimary: boolean;

    @Column({ name: 'is_mobile_money', default: false })
    isMobileMoney: boolean;

    @Column({ type: 'text', nullable: true })
    tokenizedData: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
