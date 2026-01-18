import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment, WebhookEvent } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { InventoryReservation } from '../inventory/entities/inventory-reservation.entity';
import { PaymentsService } from './payments.service';
import { WebhookController } from './webhook.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, WebhookEvent, Order, InventoryReservation]),
    ],
    controllers: [WebhookController],
    providers: [PaymentsService],
    exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule { }
