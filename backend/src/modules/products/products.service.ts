import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, Category } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(ProductVariant)
        private variantRepository: Repository<ProductVariant>,
        private inventoryService: InventoryService,
    ) { }

    /**
     * Get all active products with their variants.
     */
    async findAll(options?: {
        categorySlug?: string;
        featured?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<{ products: Product[]; total: number }> {
        const query = this.productRepository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.variants', 'v', 'v.isActive = :active', { active: true })
            .leftJoinAndSelect('p.category', 'c')
            .where('p.isActive = :active', { active: true });

        if (options?.categorySlug) {
            query.andWhere('c.slug = :slug', { slug: options.categorySlug });
        }

        if (options?.featured) {
            query.andWhere('p.isFeatured = :featured', { featured: true });
        }

        query.orderBy('p.createdAt', 'DESC');

        if (options?.limit) {
            query.take(options.limit);
        }
        if (options?.offset) {
            query.skip(options.offset);
        }

        const [products, total] = await query.getManyAndCount();
        return { products, total };
    }

    /**
     * Get a product by slug with variants and stock info.
     */
    async findBySlug(slug: string): Promise<{
        product: Product;
        stockByVariant: Map<string, number>;
    }> {
        const product = await this.productRepository.findOne({
            where: { slug, isActive: true },
            relations: ['variants', 'category'],
        });

        if (!product) {
            throw new NotFoundException(`Product not found: ${slug}`);
        }

        // Get stock for each variant
        const stockByVariant = new Map<string, number>();
        for (const variant of product.variants) {
            if (variant.isActive) {
                const stock = await this.inventoryService.getSellableStock(variant.sku);
                stockByVariant.set(variant.id, stock.sellableStock);
            }
        }

        return { product, stockByVariant };
    }

    /**
     * Get a variant by ID.
     */
    async findVariantById(variantId: string): Promise<ProductVariant> {
        const variant = await this.variantRepository.findOne({
            where: { id: variantId },
            relations: ['product'],
        });

        if (!variant) {
            throw new NotFoundException(`Variant not found: ${variantId}`);
        }

        return variant;
    }

    /**
     * Get a variant by SKU.
     */
    async findVariantBySku(sku: string): Promise<ProductVariant> {
        const variant = await this.variantRepository.findOne({
            where: { sku },
            relations: ['product'],
        });

        if (!variant) {
            throw new NotFoundException(`Variant not found: ${sku}`);
        }

        return variant;
    }

    /**
     * Get all categories.
     */
    async findAllCategories(): Promise<Category[]> {
        return this.categoryRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC' },
        });
    }

    // Admin methods
    async createProduct(data: Partial<Product>): Promise<Product> {
        const product = this.productRepository.create(data);
        return this.productRepository.save(product);
    }

    async updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
        await this.productRepository.update(id, data);
        return this.productRepository.findOne({ where: { id } });
    }

    async createVariant(data: Partial<ProductVariant>): Promise<ProductVariant> {
        const variant = this.variantRepository.create(data);
        return this.variantRepository.save(variant);
    }

    async updateVariant(id: string, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
        await this.variantRepository.update(id, data);
        return this.variantRepository.findOne({ where: { id } });
    }
}
