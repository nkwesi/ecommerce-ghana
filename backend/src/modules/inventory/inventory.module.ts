import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoreInventory } from './entities/store-inventory.entity';
import { InventoryReservation } from './entities/inventory-reservation.entity';
import { InventoryService } from './inventory.service';
import { ReservationService } from './reservation.service';
import { InventoryController } from './inventory.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Store, StoreInventory, InventoryReservation]),
    ],
    controllers: [InventoryController],
    providers: [InventoryService, ReservationService],
    exports: [InventoryService, ReservationService],
})
export class InventoryModule { }
