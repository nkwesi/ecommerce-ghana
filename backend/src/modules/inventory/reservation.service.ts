import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InventoryReservation, ReservationStatus } from './entities/inventory-reservation.entity';
import { StoreInventory } from './entities/store-inventory.entity';
import { Store } from './entities/store.entity';

export interface StockInfo {
    sku: string;
    physicalStock: number;
    reservedStock: number;
    safetyBuffer: number;
    sellableStock: number;
    storeBreakdown: {
        storeId: string;
        storeName: string;
        physical: number;
        reserved: number;
        sellable: number;
    }[];
}

export interface CreateReservationResult {
    reservation: InventoryReservation;
    store: Store;
}

@Injectable()
export class ReservationService {
    private readonly logger = new Logger(ReservationService.name);
    private readonly reservationMinutes: number;
    private readonly safetyBuffer: number;

    constructor(
        @InjectRepository(InventoryReservation)
        private reservationRepository: Repository<InventoryReservation>,
        @InjectRepository(StoreInventory)
        private storeInventoryRepository: Repository<StoreInventory>,
        @InjectRepository(Store)
        private storeRepository: Repository<Store>,
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        this.reservationMinutes = this.configService.get<number>('app.defaultReservationMinutes', 10);
        this.safetyBuffer = this.configService.get<number>('app.stockSafetyBuffer', 1);
    }

    /**
     * Get sellable stock for a SKU across all stores or a specific store.
     * SELLABLE = physical - active_reservations - safety_buffer
     */
    async getSellableStock(sku: string, storeId?: string): Promise<StockInfo> {
        // Get physical stock from all fulfillment-enabled stores
        const query = this.storeInventoryRepository
            .createQueryBuilder('si')
            .innerJoin('si.store', 'store')
            .where('si.sku = :sku', { sku })
            .andWhere('store.isFulfillmentEnabled = :enabled', { enabled: true })
            .andWhere('store.isActive = :active', { active: true });

        if (storeId) {
            query.andWhere('si.storeId = :storeId', { storeId });
        }

        const inventories = await query.select([
            'si.storeId',
            'si.quantity',
            'store.id',
            'store.name',
        ]).getRawMany();

        // Get active reservations for this SKU
        const activeReservations = await this.reservationRepository
            .createQueryBuilder('r')
            .select('r.storeId', 'storeId')
            .addSelect('SUM(r.quantity)', 'reserved')
            .where('r.sku = :sku', { sku })
            .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
            .andWhere('r.expiresAt > :now', { now: new Date() })
            .groupBy('r.storeId')
            .getRawMany();

        const reservationMap = new Map<string, number>();
        for (const r of activeReservations) {
            reservationMap.set(r.storeId, parseInt(r.reserved) || 0);
        }

        let totalPhysical = 0;
        let totalReserved = 0;
        const storeBreakdown: StockInfo['storeBreakdown'] = [];

        for (const inv of inventories) {
            const physical = inv.si_quantity || 0;
            const reserved = reservationMap.get(inv.si_storeId) || 0;
            const sellable = Math.max(0, physical - reserved - this.safetyBuffer);

            totalPhysical += physical;
            totalReserved += reserved;

            storeBreakdown.push({
                storeId: inv.si_storeId,
                storeName: inv.store_name,
                physical,
                reserved,
                sellable,
            });
        }

        const totalSellable = Math.max(0, totalPhysical - totalReserved - (this.safetyBuffer * storeBreakdown.length));

        return {
            sku,
            physicalStock: totalPhysical,
            reservedStock: totalReserved,
            safetyBuffer: this.safetyBuffer * storeBreakdown.length,
            sellableStock: totalSellable,
            storeBreakdown,
        };
    }

    /**
     * Create a reservation for a SKU.
     * Uses optimistic locking to prevent overselling.
     */
    async createReservation(
        sku: string,
        quantity: number,
        sessionId: string,
    ): Promise<CreateReservationResult> {
        return this.dataSource.transaction(async (manager) => {
            // Find best store with sufficient stock (highest stock first)
            const stores = await manager
                .createQueryBuilder(StoreInventory, 'si')
                .innerJoinAndSelect('si.store', 'store')
                .where('si.sku = :sku', { sku })
                .andWhere('store.isFulfillmentEnabled = :enabled', { enabled: true })
                .andWhere('store.isActive = :active', { active: true })
                .orderBy('si.quantity', 'DESC')
                .setLock('pessimistic_write')
                .getMany();

            for (const inv of stores) {
                // Get active reservations for this store
                const reserved = await manager
                    .createQueryBuilder(InventoryReservation, 'r')
                    .select('COALESCE(SUM(r.quantity), 0)', 'total')
                    .where('r.sku = :sku', { sku })
                    .andWhere('r.storeId = :storeId', { storeId: inv.storeId })
                    .andWhere('r.status = :status', { status: ReservationStatus.ACTIVE })
                    .andWhere('r.expiresAt > :now', { now: new Date() })
                    .getRawOne();

                const reservedQty = parseInt(reserved.total) || 0;
                const sellable = inv.quantity - reservedQty - this.safetyBuffer;

                if (sellable >= quantity) {
                    // Create the reservation
                    const expiresAt = new Date(Date.now() + this.reservationMinutes * 60 * 1000);

                    const reservation = manager.create(InventoryReservation, {
                        storeId: inv.storeId,
                        sku,
                        quantity,
                        expiresAt,
                        sessionId,
                        status: ReservationStatus.ACTIVE,
                    });

                    const saved = await manager.save(InventoryReservation, reservation);

                    this.logger.log(
                        `Created reservation ${saved.id} for ${quantity}x ${sku} at store ${inv.store.name}`,
                    );

                    return { reservation: saved, store: inv.store };
                }
            }

            throw new Error(`Insufficient stock for SKU ${sku}. Requested: ${quantity}`);
        });
    }

    /**
     * Expire old reservations. Called by cron job every minute.
     */
    async expireReservations(): Promise<number> {
        const result = await this.reservationRepository.update(
            {
                status: ReservationStatus.ACTIVE,
                expiresAt: LessThan(new Date()),
            },
            {
                status: ReservationStatus.EXPIRED,
            },
        );

        if ((result.affected ?? 0) > 0) {
            this.logger.log(`Expired ${result.affected} reservations`);
        }

        return result.affected ?? 0;
    }

    /**
     * Convert reservations to permanent after payment success.
     */
    async convertReservations(orderId: string): Promise<void> {
        await this.reservationRepository.update(
            { orderId },
            { status: ReservationStatus.CONVERTED },
        );

        this.logger.log(`Converted reservations for order ${orderId}`);
    }

    /**
     * Cancel reservations (on payment failure or cart removal).
     */
    async cancelReservations(orderId?: string, sessionId?: string): Promise<void> {
        const where: any = { status: ReservationStatus.ACTIVE };

        if (orderId) {
            where.orderId = orderId;
        } else if (sessionId) {
            where.sessionId = sessionId;
        } else {
            throw new Error('Must provide either orderId or sessionId');
        }

        await this.reservationRepository.update(where, {
            status: ReservationStatus.CANCELLED,
        });

        this.logger.log(
            `Cancelled reservations for ${orderId ? `order ${orderId}` : `session ${sessionId}`}`,
        );
    }

    /**
     * Link reservations to an order (called during checkout).
     */
    async linkReservationsToOrder(sessionId: string, orderId: string): Promise<void> {
        await this.reservationRepository.update(
            {
                sessionId,
                status: ReservationStatus.ACTIVE,
            },
            { orderId },
        );

        this.logger.log(`Linked reservations from session ${sessionId} to order ${orderId}`);
    }

    /**
     * Get active reservations for a session.
     */
    async getSessionReservations(sessionId: string): Promise<InventoryReservation[]> {
        return this.reservationRepository.find({
            where: {
                sessionId,
                status: ReservationStatus.ACTIVE,
            },
            relations: ['store'],
        });
    }

    /**
     * Release a single reservation (when removing from cart).
     */
    async releaseReservation(reservationId: string): Promise<void> {
        await this.reservationRepository.update(
            { id: reservationId, status: ReservationStatus.ACTIVE },
            { status: ReservationStatus.CANCELLED },
        );

        this.logger.log(`Released reservation ${reservationId}`);
    }
}
