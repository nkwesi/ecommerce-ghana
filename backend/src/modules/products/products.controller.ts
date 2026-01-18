import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { InventoryService } from '../inventory/inventory.service';

@Controller('api/v1/products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService,
        private readonly inventoryService: InventoryService,
    ) { }

    /**
     * Get all products.
     */
    @Get()
    async findAll(
        @Query('category') category?: string,
        @Query('featured') featured?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const result = await this.productsService.findAll({
            categorySlug: category,
            featured: featured === 'true',
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });

        return {
            products: result.products.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                basePrice: p.basePrice,
                images: p.images,
                category: p.category
                    ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
                    : null,
                variantCount: p.variants?.length ?? 0,
                priceRange: this.getPriceRange(p.variants),
            })),
            total: result.total,
        };
    }

    /**
     * Get a product by slug.
     */
    @Get(':slug')
    async findOne(@Param('slug') slug: string) {
        const { product, stockByVariant } = await this.productsService.findBySlug(slug);

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            basePrice: product.basePrice,
            images: product.images,
            category: product.category
                ? {
                    id: product.category.id,
                    name: product.category.name,
                    slug: product.category.slug,
                }
                : null,
            variants: product.variants
                .filter((v) => v.isActive)
                .map((v) => ({
                    id: v.id,
                    sku: v.sku,
                    sizeCode: v.sizeCode,
                    color: v.color,
                    colorHex: v.colorHex,
                    price: v.price,
                    compareAtPrice: v.compareAtPrice,
                    images: v.images,
                    stock: stockByVariant.get(v.id) ?? 0,
                    inStock: (stockByVariant.get(v.id) ?? 0) > 0,
                })),
        };
    }

    /**
     * Get stock for a specific variant.
     */
    @Get(':slug/variants/:variantId/stock')
    async getVariantStock(
        @Param('slug') slug: string,
        @Param('variantId') variantId: string,
    ) {
        const variant = await this.productsService.findVariantById(variantId);
        const stock = await this.inventoryService.getSellableStock(variant.sku);

        return {
            variantId,
            sku: variant.sku,
            sellableStock: stock.sellableStock,
            inStock: stock.sellableStock > 0,
        };
    }

    /**
     * Get all categories.
     */
    @Get('/categories')
    async getCategories() {
        const categories = await this.productsService.findAllCategories();
        return categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
        }));
    }

    private getPriceRange(variants: { price: number }[]): { min: number; max: number } {
        if (!variants || variants.length === 0) {
            return { min: 0, max: 0 };
        }

        const prices = variants.map((v) => Number(v.price));
        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
        };
    }
}
