import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { databaseConfig, redisConfig, appConfig } from './config';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TasksModule } from './modules/tasks/tasks.module';

// Entities
import { Product, Category } from './modules/products/entities/product.entity';
import { ProductVariant } from './modules/products/entities/product-variant.entity';
import { Store } from './modules/inventory/entities/store.entity';
import { StoreInventory } from './modules/inventory/entities/store-inventory.entity';
import { InventoryReservation } from './modules/inventory/entities/inventory-reservation.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { ShippingAddress } from './modules/orders/entities/shipping-address.entity';
import { Payment, WebhookEvent } from './modules/payments/entities/payment.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, appConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        database: configService.get<string>('database.database'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        entities: [
          Product,
          Category,
          ProductVariant,
          Store,
          StoreInventory,
          InventoryReservation,
          Order,
          OrderItem,
          ShippingAddress,
          Payment,
          WebhookEvent,
        ],
        synchronize: configService.get('NODE_ENV') === 'development', // Auto-create tables in dev
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    ProductsModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    TasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
