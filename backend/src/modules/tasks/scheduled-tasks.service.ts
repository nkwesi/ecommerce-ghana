import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReservationService } from '../inventory/reservation.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ScheduledTasksService {
    private readonly logger = new Logger(ScheduledTasksService.name);

    constructor(
        private readonly reservationService: ReservationService,
        private readonly inventoryService: InventoryService,
    ) { }

    /**
     * Expire old reservations every minute.
     * This releases held stock back to the pool.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleReservationExpiry() {
        const expired = await this.reservationService.expireReservations();
        if (expired > 0) {
            this.logger.log(`Expired ${expired} reservations`);
        }
    }

    /**
     * Sync inventory from external system every 5 minutes.
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleInventorySync() {
        try {
            await this.inventoryService.syncFromExternalSystem();
        } catch (error) {
            this.logger.error(`Inventory sync failed: ${error.message}`);
        }
    }

    /**
     * Daily analytics at 2 AM.
     */
    @Cron('0 2 * * *')
    async handleDailyAnalytics() {
        this.logger.log('Running daily analytics...');
        // TODO: Implement daily analytics
    }
}
