import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { databaseConfig, redisConfig, appConfig } from './config';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { AdminModule } from './modules/admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { Product, Category } from './modules/products/entities/product.entity';
import { ProductVariant } from './modules/products/entities/product-variant.entity';
import { Store } from './modules/inventory/entities/store.entity';
import { StoreInventory } from './modules/inventory/entities/store-inventory.entity';
import { InventoryReservation } from './modules/inventory/entities/inventory-reservation.entity';
import { Order } from './modules/orders/entities/order.entity';
import { OrderItem } from './modules/orders/entities/order-item.entity';
import { ShippingAddress } from './modules/orders/entities/shipping-address.entity';
import {
  Payment,
  WebhookEvent,
} from './modules/payments/entities/payment.entity';
import { User } from './modules/users/entities/user.entity';
import { Address } from './modules/addresses/entities/address.entity';
import { PaymentMethod } from './modules/payment-methods/entities/payment-method.entity';

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
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('database.url');
        const isDevelopment =
          configService.get('app.nodeEnv') === 'development';

        return {
          type: 'postgres',
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: configService.get<string>('database.host'),
                port: configService.get<number>('database.port'),
                database: configService.get<string>('database.database'),
                username: configService.get<string>('database.username'),
                password: configService.get<string>('database.password'),
              }),
          ssl: configService.get('database.ssl'),
          extra: { max: configService.get<number>('database.poolMax', 10) },
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
            User,
            Address,
            PaymentMethod,
          ],
          // Remote databases are migration-only, even when a developer runs the
          // API with NODE_ENV=development.
          synchronize: isDevelopment && !databaseUrl,
          migrationsRun: false,
          logging: isDevelopment,
        };
      },
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    ProductsModule,
    InventoryModule,
    OrdersModule,
    PaymentsModule,
    TasksModule,
    UsersModule,
    AuthModule,
    AddressesModule,
    PaymentMethodsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
