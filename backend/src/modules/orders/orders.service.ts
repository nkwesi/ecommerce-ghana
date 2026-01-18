import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ShippingAddress } from './entities/shipping-address.entity';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepository: Repository<OrderItem>,
        @InjectRepository(ShippingAddress)
        private shippingAddressRepository: Repository<ShippingAddress>,
    ) { }

    /**
     * Find order by order number.
     */
    async findByOrderNumber(orderNumber: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { orderNumber },
            relations: ['items', 'shippingAddresses'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderNumber}`);
        }

        return order;
    }

    /**
     * Find order by ID.
     */
    async findById(id: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['items', 'shippingAddresses'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${id}`);
        }

        return order;
    }

    /**
     * Find orders by customer email.
     */
    async findByEmail(email: string): Promise<Order[]> {
        return this.orderRepository.find({
            where: { customerEmail: email },
            order: { createdAt: 'DESC' },
            relations: ['items'],
        });
    }

    /**
     * Update order status.
     */
    async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
        const order = await this.findById(orderId);

        order.status = status;

        // Set timestamps for specific statuses
        if (status === OrderStatus.SHIPPED) {
            order.shippedAt = new Date();
        } else if (status === OrderStatus.DELIVERED) {
            order.deliveredAt = new Date();
        }

        await this.orderRepository.save(order);

        this.logger.log(`Order ${order.orderNumber} status updated to ${status}`);

        return order;
    }

    /**
     * Add tracking number to order.
     */
    async addTrackingNumber(orderId: string, trackingNumber: string): Promise<Order> {
        const order = await this.findById(orderId);

        order.trackingNumber = trackingNumber;
        await this.orderRepository.save(order);

        this.logger.log(`Added tracking ${trackingNumber} to order ${order.orderNumber}`);

        return order;
    }

    /**
     * Get all orders (admin).
     */
    async findAll(options?: {
        status?: OrderStatus;
        limit?: number;
        offset?: number;
    }): Promise<{ orders: Order[]; total: number }> {
        const query = this.orderRepository.createQueryBuilder('o')
            .leftJoinAndSelect('o.items', 'items')
            .orderBy('o.createdAt', 'DESC');

        if (options?.status) {
            query.where('o.status = :status', { status: options.status });
        }

        if (options?.limit) {
            query.take(options.limit);
        }
        if (options?.offset) {
            query.skip(options.offset);
        }

        const [orders, total] = await query.getManyAndCount();
        return { orders, total };
    }

    /**
     * Get orders grouped by status (for dashboard).
     */
    async getOrderStats(): Promise<{ status: OrderStatus; count: number }[]> {
        const result = await this.orderRepository
            .createQueryBuilder('o')
            .select('o.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('o.status')
            .getRawMany();

        return result.map((r) => ({
            status: r.status,
            count: parseInt(r.count),
        }));
    }

    /**
     * Mark an item as fulfilled.
     */
    async markItemFulfilled(orderItemId: string): Promise<void> {
        await this.orderItemRepository.update(orderItemId, {
            isFulfilled: true,
            fulfilledAt: new Date(),
        });
    }
}
