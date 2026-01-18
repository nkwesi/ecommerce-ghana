import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreInventory } from './entities/store-inventory.entity';
import { Store } from './entities/store.entity';
import { ReservationService, StockInfo } from './reservation.service';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        @InjectRepository(StoreInventory)
        private storeInventoryRepository: Repository<StoreInventory>,
        @InjectRepository(Store)
        private storeRepository: Repository<Store>,
        private reservationService: ReservationService,
    ) { }

    /**
     * Get sellable stock for a SKU.
     * Delegates to ReservationService for accurate calculation.
     */
    async getSellableStock(sku: string): Promise<StockInfo> {
        return this.reservationService.getSellableStock(sku);
    }

    /**
     * Get stock for multiple SKUs at once.
     */
    async getBulkSellableStock(skus: string[]): Promise<Map<string, StockInfo>> {
        const result = new Map<string, StockInfo>();

        // TODO: Optimize with batch query
        for (const sku of skus) {
            result.set(sku, await this.getSellableStock(sku));
        }

        return result;
    }

    /**
     * Sync inventory from external system (POS/ERP).
     * This is a placeholder - implement based on your actual inventory system.
     */
    async syncFromExternalSystem(): Promise<void> {
        this.logger.log('Starting inventory sync from external system...');

        // TODO: Implement integration with your POS/inventory system
        // Example structure:
        // 1. Fetch inventory data from external API
        // 2. Update store_inventory table
        // 3. Set last_synced_at timestamp

        this.logger.log('Inventory sync completed');
    }

    /**
     * Manually update inventory for a SKU at a store.
     * Used for admin overrides or testing.
     */
    async updateInventory(
        storeId: string,
        sku: string,
        quantity: number,
    ): Promise<StoreInventory> {
        let inventory = await this.storeInventoryRepository.findOne({
            where: { storeId, sku },
        });

        if (!inventory) {
            inventory = this.storeInventoryRepository.create({
                storeId,
                sku,
                quantity,
                lastSyncedAt: new Date(),
            });
        } else {
            inventory.quantity = quantity;
            inventory.lastSyncedAt = new Date();
        }

        return this.storeInventoryRepository.save(inventory);
    }

    /**
     * Get all stores with their stock for a SKU.
     */
    async getStoreStockForSku(sku: string): Promise<{
        store: Store;
        inventory: StoreInventory;
        sellableStock: number;
    }[]> {
        const stockInfo = await this.getSellableStock(sku);
        const inventories = await this.storeInventoryRepository.find({
            where: { sku },
            relations: ['store'],
        });

        return inventories.map((inv) => {
            const breakdown = stockInfo.storeBreakdown.find(
                (b) => b.storeId === inv.storeId,
            );

            return {
                store: inv.store,
                inventory: inv,
                sellableStock: breakdown?.sellable ?? 0,
            };
        });
    }

    /**
     * Get low stock items below threshold.
     */
    async getLowStockItems(threshold: number = 5): Promise<{
        sku: string;
        totalSellable: number;
        stores: { storeName: string; sellable: number }[];
    }[]> {
        // Get all unique SKUs
        const skus = await this.storeInventoryRepository
            .createQueryBuilder('si')
            .select('DISTINCT si.sku', 'sku')
            .getRawMany();

        const lowStock = [];

        for (const { sku } of skus) {
            const stockInfo = await this.getSellableStock(sku);

            if (stockInfo.sellableStock < threshold) {
                lowStock.push({
                    sku,
                    totalSellable: stockInfo.sellableStock,
                    stores: stockInfo.storeBreakdown.map((s) => ({
                        storeName: s.storeName,
                        sellable: s.sellable,
                    })),
                });
            }
        }

        return lowStock;
    }
}
