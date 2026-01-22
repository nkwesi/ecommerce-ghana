import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class AdminService {
    constructor(
        private readonly usersService: UsersService,
        private readonly ordersService: OrdersService,
        private readonly productsService: ProductsService,
    ) { }

    async getDashboardStats() {
        const [orderStats, { users, total: totalUsers }, { products, total: totalProducts }] = await Promise.all([
            this.ordersService.getOrderStats(),
            this.usersService.findAllUsers(1, 0),
            this.productsService.findAll({ limit: 1 }),
        ]);

        const totalOrders = orderStats.reduce((sum, s) => sum + s.count, 0);

        return {
            totalUsers,
            totalProducts,
            totalOrders,
            ordersByStatus: orderStats,
        };
    }

    async getRecentOrders(limit = 10) {
        return this.ordersService.findAll({ limit });
    }

    async getAllOrders(options: { status?: string; limit?: number; offset?: number }) {
        return this.ordersService.findAll(options as any);
    }

    async getAllUsers(limit = 50, offset = 0) {
        return this.usersService.findAllUsers(limit, offset);
    }

    async getAllProducts(options: { limit?: number; offset?: number }) {
        return this.productsService.findAll(options);
    }

    async getProductById(id: string) {
        const product = await this.productsService.findById(id);
        if (!product) {
            throw new NotFoundException(`Product not found: ${id}`);
        }
        return product;
    }

    async createProduct(data: CreateProductDto) {
        return this.productsService.createProduct(data);
    }

    async updateProduct(id: string, data: UpdateProductDto) {
        const product = await this.productsService.updateProduct(id, data);
        if (!product) {
            throw new NotFoundException(`Product not found: ${id}`);
        }
        return product;
    }

    async deleteProduct(id: string) {
        // Soft delete by setting isActive to false
        const product = await this.productsService.updateProduct(id, { isActive: false });
        if (!product) {
            throw new NotFoundException(`Product not found: ${id}`);
        }
        return { message: 'Product deleted successfully', id };
    }

    async getCategories() {
        return this.productsService.findAllCategories();
    }
}

