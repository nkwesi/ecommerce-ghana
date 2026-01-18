import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutService, CustomerInfo, ShippingInfo } from './checkout.service';
import { OrderStatus } from './entities/order.entity';

@Controller('api/v1')
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly checkoutService: CheckoutService,
    ) { }

    /**
     * Process checkout.
     */
    @Post('checkout')
    async checkout(
        @Body()
        body: {
            sessionId: string;
            customer: CustomerInfo;
            shipping: ShippingInfo;
        },
    ) {
        try {
            const result = await this.checkoutService.processCheckout(
                body.sessionId,
                body.customer,
                body.shipping,
            );

            return {
                success: true,
                order: {
                    id: result.order.id,
                    orderNumber: result.order.orderNumber,
                    total: result.order.total,
                    currency: result.order.currency,
                    status: result.order.status,
                },
                payment: {
                    intentId: result.paymentIntentId,
                    checkoutUrl: result.checkoutUrl,
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
     * Get order by order number (public - requires email verification).
     */
    @Get('orders/:orderNumber')
    async getOrder(
        @Param('orderNumber') orderNumber: string,
        @Query('email') email?: string,
    ) {
        const order = await this.ordersService.findByOrderNumber(orderNumber);

        // Simple email verification
        if (email && order.customerEmail.toLowerCase() !== email.toLowerCase()) {
            throw new HttpException('Email does not match', HttpStatus.FORBIDDEN);
        }

        return {
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customerName,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingCost: order.shippingCost,
            total: order.total,
            currency: order.currency,
            trackingNumber: order.trackingNumber,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
                productName: item.productNameSnapshot,
                sku: item.skuSnapshot,
                size: item.sizeSnapshot,
                color: item.colorSnapshot,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                isFulfilled: item.isFulfilled,
            })),
            shippingAddress: order.shippingAddresses[0]
                ? {
                    fullName: order.shippingAddresses[0].fullName,
                    addressLine1: order.shippingAddresses[0].addressLine1,
                    addressLine2: order.shippingAddresses[0].addressLine2,
                    city: order.shippingAddresses[0].city,
                    region: order.shippingAddresses[0].region,
                    phone: order.shippingAddresses[0].phone,
                }
                : null,
        };
    }
}

@Controller('api/v1/admin/orders')
export class AdminOrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    /**
     * Get all orders (admin).
     */
    @Get()
    async getOrders(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const result = await this.ordersService.findAll({
            status: status as OrderStatus,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });

        return {
            orders: result.orders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerEmail: order.customerEmail,
                customerName: order.customerName,
                status: order.status,
                total: order.total,
                currency: order.currency,
                itemCount: order.items?.length ?? 0,
                createdAt: order.createdAt,
            })),
            total: result.total,
        };
    }

    /**
     * Get order details (admin).
     */
    @Get(':id')
    async getOrderDetail(@Param('id') id: string) {
        const order = await this.ordersService.findById(id);

        return {
            id: order.id,
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            status: order.status,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            shippingCost: order.shippingCost,
            total: order.total,
            currency: order.currency,
            trackingNumber: order.trackingNumber,
            notes: order.notes,
            createdAt: order.createdAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            items: order.items.map((item) => ({
                id: item.id,
                productName: item.productNameSnapshot,
                sku: item.skuSnapshot,
                size: item.sizeSnapshot,
                color: item.colorSnapshot,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                fulfillmentStoreId: item.fulfillmentStoreId,
                isFulfilled: item.isFulfilled,
                fulfilledAt: item.fulfilledAt,
            })),
            shippingAddress: order.shippingAddresses[0] ?? null,
        };
    }

    /**
     * Update order status (admin).
     */
    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: OrderStatus },
    ) {
        const order = await this.ordersService.updateStatus(id, body.status);
        return { success: true, status: order.status };
    }

    /**
     * Add tracking number (admin).
     */
    @Patch(':id/tracking')
    async addTracking(
        @Param('id') id: string,
        @Body() body: { trackingNumber: string },
    ) {
        const order = await this.ordersService.addTrackingNumber(
            id,
            body.trackingNumber,
        );
        return { success: true, trackingNumber: order.trackingNumber };
    }

    /**
     * Get order stats (admin dashboard).
     */
    @Get('stats/summary')
    async getStats() {
        return this.ordersService.getOrderStats();
    }
}
