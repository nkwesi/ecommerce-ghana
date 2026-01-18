import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShippingAddress } from './entities/shipping-address.entity';
import { OrdersController, AdminOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CheckoutService } from './checkout.service';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, ShippingAddress]),
        InventoryModule,
        forwardRef(() => ProductsModule),
        forwardRef(() => PaymentsModule),
    ],
    controllers: [OrdersController, AdminOrdersController],
    providers: [OrdersService, CheckoutService],
    exports: [OrdersService, CheckoutService],
})
export class OrdersModule { }
