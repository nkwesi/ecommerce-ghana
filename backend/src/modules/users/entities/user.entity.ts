import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

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

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
