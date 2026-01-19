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
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('addresses')
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    // Helper to extract user ID from token (mock implementation)
    private getUserIdFromToken(authHeader: string): string {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('No valid auth token');
        }
        // Mock: Extract user ID from token format "mock-jwt-token-for-{userId}"
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
        return this.addressesService.findAllByUser(userId);
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.addressesService.findById(id, userId);
    }

    @Post()
    async create(
        @Body() dto: CreateAddressDto,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.addressesService.create(userId, dto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateAddressDto,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.addressesService.update(id, userId, dto);
    }

    @Delete(':id')
    async delete(
        @Param('id') id: string,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        await this.addressesService.delete(id, userId);
        return { success: true };
    }

    @Patch(':id/default')
    async setDefault(
        @Param('id') id: string,
        @Headers('authorization') auth: string,
    ) {
        const userId = this.getUserIdFromToken(auth);
        return this.addressesService.setDefault(id, userId);
    }
}
