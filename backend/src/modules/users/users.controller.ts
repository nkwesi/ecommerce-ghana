import { Controller, Post, Patch, Delete, Body, HttpStatus, Res, Headers, UnauthorizedException, Get, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { OrdersService } from '../orders/orders.service';
import { UpdateProfileDto, UpdatePreferencesDto, Toggle2FADto, ChangePasswordDto, DeleteAccountDto } from './dto/user.dto';
import type { Response } from 'express';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly ordersService: OrdersService,
    ) { }

    private getUserIdFromToken(authHeader: string): string {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No valid auth token');
        }
        const token = authHeader.replace('Bearer ', '');
        const match = token.match(/mock-jwt-token-for-(.+)/);
        if (!match) {
            throw new UnauthorizedException('Invalid token format');
        }
        return match[1];
    }

    @Get('me')
    async getMe(@Headers('authorization') auth: string) {
        const userId = this.getUserIdFromToken(auth);
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            currency: user.currency,
            language: user.language,
            twoFactorEnabled: user.twoFactorEnabled,
            marketingOptIn: user.marketingOptIn,
            orderNotifications: user.orderNotifications,
        };
    }

    @Patch('profile')
    async updateProfile(
        @Headers('authorization') auth: string,
        @Body() dto: UpdateProfileDto,
    ) {
        const userId = this.getUserIdFromToken(auth);
        const user = await this.usersService.update(userId, dto);
        return {
            success: true,
            user: {
                id: user?.id,
                email: user?.email,
                fullName: user?.fullName,
                phoneNumber: user?.phoneNumber,
            }
        };
    }

    @Patch('preferences')
    async updatePreferences(
        @Headers('authorization') auth: string,
        @Body() dto: UpdatePreferencesDto,
    ) {
        const userId = this.getUserIdFromToken(auth);
        const user = await this.usersService.update(userId, dto);
        return {
            success: true,
            preferences: {
                currency: user?.currency,
                language: user?.language,
                marketingOptIn: user?.marketingOptIn,
                orderNotifications: user?.orderNotifications,
            }
        };
    }

    @Patch('2fa')
    async toggle2FA(
        @Headers('authorization') auth: string,
        @Body() dto: Toggle2FADto,
    ) {
        const userId = this.getUserIdFromToken(auth);
        const user = await this.usersService.update(userId, { twoFactorEnabled: dto.enabled });
        return {
            success: true,
            twoFactorEnabled: user?.twoFactorEnabled,
        };
    }

    @Post('change-password')
    async changePassword(
        @Headers('authorization') auth: string,
        @Body() dto: ChangePasswordDto,
    ) {
        const userId = this.getUserIdFromToken(auth);
        // In production, verify current password and hash new password
        // For mock, just return success
        return {
            success: true,
            message: 'Password changed successfully',
        };
    }

    @Delete('account')
    async deleteAccount(
        @Headers('authorization') auth: string,
        @Body() dto: DeleteAccountDto,
    ) {
        if (dto.confirmation !== 'DELETE') {
            throw new BadRequestException('Please type DELETE to confirm');
        }

        const userId = this.getUserIdFromToken(auth);
        await this.usersService.delete(userId);
        return {
            success: true,
            message: 'Account deleted successfully',
        };
    }

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

            const user = await this.usersService.createOrUpdate(order.customerEmail, {
                fullName: order.customerName,
                phoneNumber: order.customerPhone,
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
            if (error instanceof Error && error.message.includes('not found')) {
                return res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
            }
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to save account' });
        }
    }
}
