import { Controller, Get, Post, Put, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('orders/recent')
    async getRecentOrders(@Query('limit') limit?: string) {
        return this.adminService.getRecentOrders(limit ? parseInt(limit) : 10);
    }

    @Get('orders')
    async getAllOrders(
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.getAllOrders({
            status,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });
    }

    @Get('users')
    async getAllUsers(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.getAllUsers(
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @Get('products')
    async getAllProducts(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.adminService.getAllProducts({
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });
    }

    @Get('products/:id')
    async getProductById(@Param('id') id: string) {
        return this.adminService.getProductById(id);
    }

    @Post('products')
    async createProduct(@Body() createProductDto: CreateProductDto) {
        return this.adminService.createProduct(createProductDto);
    }

    @Put('products/:id')
    async updateProduct(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        return this.adminService.updateProduct(id, updateProductDto);
    }

    @Delete('products/:id')
    async deleteProduct(@Param('id') id: string) {
        return this.adminService.deleteProduct(id);
    }

    @Get('categories')
    async getCategories() {
        return this.adminService.getCategories();
    }
}
