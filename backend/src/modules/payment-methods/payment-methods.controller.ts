import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    Headers,
    UnauthorizedException,
} from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto';

@Controller('payment-methods')
export class PaymentMethodsController {
    constructor(private readonly paymentMethodsService: PaymentMethodsService) { }

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

    @Get()
    async findAll(@Headers('authorization') auth: string) {
        const userId = this.getUserIdFromToken(auth);
        return this.paymentMethodsService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.paymentMethodsService.findById(id, userId);
    }

    @Post()
    async create(
        @Body() dto: CreatePaymentMethodDto,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.paymentMethodsService.create(userId, dto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdatePaymentMethodDto,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.paymentMethodsService.update(id, userId, dto);
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        await this.paymentMethodsService.delete(id, userId);
        return { success: true };
    }

    @Patch(':id/primary')
    async setPrimary(
        @Param('id') id: string,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.paymentMethodsService.setPrimary(id, userId);
    }
}
