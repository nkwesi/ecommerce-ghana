import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, Category } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Store } from '../inventory/entities/store.entity';
import { StoreInventory } from '../inventory/entities/store-inventory.entity';
import { BulkProductImportService } from './bulk-product-import.service';

@Module({
  imports: [
    UsersModule,
    OrdersModule,
    ProductsModule,
    TypeOrmModule.forFeature([
      Product,
      Category,
      ProductVariant,
      Store,
      StoreInventory,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, BulkProductImportService],
})
export class AdminModule {}
