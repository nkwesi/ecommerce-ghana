import { Controller, Post, Body, HttpStatus, Res, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { OrdersService } from '../orders/orders.service';
import type { Response } from 'express';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly ordersService: OrdersService,
    ) { }

    @Post('save-from-order')
    async saveFromOrder(
        @Body('orderId') orderId: string,
        @Res() res: Response,
    ) {
        if (!orderId) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'OrderId is required' });
        }

        try {
            const order = await this.ordersService.findById(orderId);

            // Create or update user from order details
            const user = await this.usersService.createOrUpdate(order.customerEmail, {
                fullName: order.customerName,
                phoneNumber: order.customerPhone,
                // We could also pull address from order.shippingAddresses[0]
                address: order.shippingAddresses?.[0]
                    ? `${order.shippingAddresses[0].addressLine1}, ${order.shippingAddresses[0].city}`
                    : undefined,
            });

            return res.status(HttpStatus.OK).json({
                message: 'Account saved successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                }
            });
        } catch (error) {
            if (error instanceof NotFoundException) {
                return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to save account' });
        }
    }
}
