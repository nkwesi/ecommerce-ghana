import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Product, Category } from '../modules/products/entities/product.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { Store } from '../modules/inventory/entities/store.entity';
import { StoreInventory } from '../modules/inventory/entities/store-inventory.entity';
import { InventoryReservation } from '../modules/inventory/entities/inventory-reservation.entity';
import { Order } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { ShippingAddress } from '../modules/orders/entities/shipping-address.entity';
import { Payment, WebhookEvent } from '../modules/payments/entities/payment.entity';
import { User } from '../modules/users/entities/user.entity';
import { Address } from '../modules/addresses/entities/address.entity';
import { PaymentMethod } from '../modules/payment-methods/entities/payment-method.entity';

const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('MIGRATION_DATABASE_URL or DATABASE_URL is required');

const ca = process.env.DATABASE_CA_CERT_BASE64
    ? Buffer.from(process.env.DATABASE_CA_CERT_BASE64, 'base64').toString('utf8')
    : undefined;

export default new DataSource({
    type: 'postgres',
    url: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'false'
        ? false
        : {
            rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
            ...(ca ? { ca } : {}),
        },
    entities: [
        Product, Category, ProductVariant, Store, StoreInventory,
        InventoryReservation, Order, OrderItem, ShippingAddress,
        Payment, WebhookEvent, User, Address, PaymentMethod,
    ],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
});
