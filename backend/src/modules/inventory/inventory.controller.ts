import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ReservationService } from './reservation.service';

@Controller('api/v1/inventory')
export class InventoryController {
    constructor(
        private readonly inventoryService: InventoryService,
        private readonly reservationService: ReservationService,
    ) { }

    /**
     * Get sellable stock for a SKU.
     */
    @Get('stock/:sku')
    async getStock(@Param('sku') sku: string) {
        const stock = await this.inventoryService.getSellableStock(sku);
        return {
            sku: stock.sku,
            sellableStock: stock.sellableStock,
            inStock: stock.sellableStock > 0,
        };
    }

    /**
     * Get detailed stock info (admin).
     */
    @Get('stock/:sku/detail')
    async getStockDetail(@Param('sku') sku: string) {
        return this.inventoryService.getSellableStock(sku);
    }

    /**
     * Create a reservation (add to cart).
     */
    @Post('reserve')
    async createReservation(
        @Body() body: { sku: string; quantity: number; sessionId: string },
    ) {
        try {
            const result = await this.reservationService.createReservation(
                body.sku,
                body.quantity,
                body.sessionId,
            );

            return {
                success: true,
                reservationId: result.reservation.id,
                expiresAt: result.reservation.expiresAt,
                store: {
                    id: result.store.id,
                    name: result.store.name,
                },
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: error.message,
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    /**
     * Release a reservation (remove from cart).
     */
    @Post('reserve/:id/release')
    async releaseReservation(@Param('id') id: string) {
        await this.reservationService.releaseReservation(id);
        return { success: true };
    }

    /**
     * Get active reservations for a session.
     */
    @Get('reservations')
    async getSessionReservations(@Query('sessionId') sessionId: string) {
        if (!sessionId) {
            throw new HttpException('sessionId required', HttpStatus.BAD_REQUEST);
        }

        const reservations = await this.reservationService.getSessionReservations(
            sessionId,
        );

        return reservations.map((r) => ({
            id: r.id,
            sku: r.sku,
            quantity: r.quantity,
            expiresAt: r.expiresAt,
            store: r.store ? { id: r.store.id, name: r.store.name } : null,
        }));
    }

    /**
     * Get low stock items (admin).
     */
    @Get('low-stock')
    async getLowStock(@Query('threshold') threshold?: string) {
        const thresholdNum = threshold ? parseInt(threshold) : 5;
        return this.inventoryService.getLowStockItems(thresholdNum);
    }
}
