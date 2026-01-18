import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('shipping_addresses')
export class ShippingAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.shippingAddresses)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'full_name', length: 255 })
    fullName: string;

    @Column({ name: 'address_line1', length: 255 })
    addressLine1: string;

    @Column({ name: 'address_line2', length: 255, nullable: true })
    addressLine2: string;

    @Column({ length: 100 })
    city: string;

    @Column({ length: 100, nullable: true })
    region: string;

    @Column({ name: 'postal_code', length: 20, nullable: true })
    postalCode: string;

    @Column({ name: 'country_code', length: 2, default: 'GH' })
    countryCode: string;

    @Column({ length: 20 })
    phone: string;

    @Column({ name: 'delivery_instructions', type: 'text', nullable: true })
    deliveryInstructions: string;
}
