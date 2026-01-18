import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed script for development data.
 * Run: npx ts-node src/database/seed.ts
 */

// Sample data
const categories = [
    { id: uuidv4(), name: 'Mens Wear', slug: 'mens-wear', description: 'Mens clothing collection', sortOrder: 1 },
    { id: uuidv4(), name: 'Womens Wear', slug: 'womens-wear', description: 'Womens clothing collection', sortOrder: 2 },
    { id: uuidv4(), name: 'Traditional', slug: 'traditional', description: 'Traditional Ghanaian clothing', sortOrder: 3 },
];

const stores = [
    {
        id: uuidv4(),
        name: 'Accra Mall Store',
        code: 'ACC-MALL',
        address: 'Accra Mall, Spintex Road',
        city: 'Accra',
        countryCode: 'GH',
        isFulfillmentEnabled: true,
        isActive: true,
        latitude: 5.6267,
        longitude: -0.1578,
        phone: '+233201234567',
        email: 'accramall@store.gh',
    },
    {
        id: uuidv4(),
        name: 'Kumasi City Mall',
        code: 'KUM-CITY',
        address: 'Kumasi City Mall, Ahodwo',
        city: 'Kumasi',
        countryCode: 'GH',
        isFulfillmentEnabled: true,
        isActive: true,
        latitude: 6.6747,
        longitude: -1.5631,
        phone: '+233207654321',
        email: 'kumasi@store.gh',
    },
    {
        id: uuidv4(),
        name: 'Oxford Street Store',
        code: 'OXF-OSU',
        address: 'Oxford Street, Osu',
        city: 'Accra',
        countryCode: 'GH',
        isFulfillmentEnabled: true,
        isActive: true,
        latitude: 5.5549,
        longitude: -0.1835,
        phone: '+233209876543',
        email: 'osu@store.gh',
    },
];

function createProduct(
    name: string,
    slug: string,
    description: string,
    categoryId: string,
    basePrice: number,
    variants: { size: string; color: string; colorHex: string; price: number }[],
) {
    const productId = uuidv4();
    return {
        product: {
            id: productId,
            name,
            slug,
            description,
            categoryId,
            basePrice,
            isActive: true,
            isFeatured: basePrice > 200,
            images: [`/images/${slug}-1.jpg`, `/images/${slug}-2.jpg`],
        },
        variants: variants.map((v, i) => ({
            id: uuidv4(),
            productId,
            sku: `${slug.toUpperCase().replace(/-/g, '')}-${v.size}-${v.color.replace(/\s+/g, '').toUpperCase()}`,
            sizeCode: v.size,
            sizeModel: 'STANDARD_V1',
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            isActive: true,
        })),
    };
}

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const colors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Navy Blue', hex: '#000080' },
    { name: 'Kente Gold', hex: '#DAA520' },
    { name: 'Ankara Red', hex: '#C41E3A' },
];

const products = [
    createProduct(
        'Classic Kente Print Shirt',
        'classic-kente-print-shirt',
        'Authentic Ghanaian Kente print shirt with modern fit. Perfect for special occasions.',
        categories[2].id,
        250,
        sizes.map((size) => ({
            size,
            color: 'Kente Gold',
            colorHex: '#DAA520',
            price: 250,
        })),
    ),
    createProduct(
        'Premium Cotton T-Shirt',
        'premium-cotton-tshirt',
        'High-quality 100% cotton t-shirt. Comfortable for everyday wear.',
        categories[0].id,
        85,
        sizes.flatMap((size) =>
            colors.slice(0, 3).map((c) => ({
                size,
                color: c.name,
                colorHex: c.hex,
                price: 85,
            })),
        ),
    ),
    createProduct(
        'African Print Maxi Dress',
        'african-print-maxi-dress',
        'Elegant African print maxi dress. Beautiful ankara patterns.',
        categories[1].id,
        320,
        ['S', 'M', 'L'].flatMap((size) =>
            [colors[0], colors[4]].map((c) => ({
                size,
                color: c.name,
                colorHex: c.hex,
                price: 320,
            })),
        ),
    ),
    createProduct(
        'Slim Fit Chinos',
        'slim-fit-chinos',
        'Modern slim fit chinos in premium fabric. Perfect for office or casual.',
        categories[0].id,
        180,
        ['30', '32', '34', '36', '38'].flatMap((size) =>
            [colors[0], { name: 'Khaki', hex: '#C3B091' }, colors[2]].map((c) => ({
                size,
                color: c.name,
                colorHex: c.hex,
                price: 180,
            })),
        ),
    ),
    createProduct(
        'Adinkra Symbol Hoodie',
        'adinkra-symbol-hoodie',
        'Cozy hoodie featuring traditional Adinkra symbols. Ghana heritage collection.',
        categories[2].id,
        220,
        sizes.map((size) => ({
            size,
            color: 'Black',
            colorHex: '#000000',
            price: 220,
        })),
    ),
];

async function seed() {
    const AppDataSource = new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'ecommerce_ghana',
        username: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres',
        synchronize: true,
        logging: false,
        entities: ['src/**/*.entity.ts'],
    });

    await AppDataSource.initialize();
    console.log('Connected to database');

    const queryRunner = AppDataSource.createQueryRunner();

    try {
        await queryRunner.startTransaction();

        // Clear existing data
        await queryRunner.query('DELETE FROM inventory_reservations');
        await queryRunner.query('DELETE FROM order_items');
        await queryRunner.query('DELETE FROM shipping_addresses');
        await queryRunner.query('DELETE FROM payments');
        await queryRunner.query('DELETE FROM webhook_events');
        await queryRunner.query('DELETE FROM orders');
        await queryRunner.query('DELETE FROM store_inventory');
        await queryRunner.query('DELETE FROM product_variants');
        await queryRunner.query('DELETE FROM products');
        await queryRunner.query('DELETE FROM categories');
        await queryRunner.query('DELETE FROM stores');

        // Insert categories
        for (const cat of categories) {
            await queryRunner.query(
                `INSERT INTO categories (id, name, slug, description, sort_order, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
                [cat.id, cat.name, cat.slug, cat.description, cat.sortOrder],
            );
        }
        console.log(`Inserted ${categories.length} categories`);

        // Insert stores
        for (const store of stores) {
            await queryRunner.query(
                `INSERT INTO stores (id, name, code, address, city, country_code, is_fulfillment_enabled, is_active, latitude, longitude, phone, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
                [
                    store.id,
                    store.name,
                    store.code,
                    store.address,
                    store.city,
                    store.countryCode,
                    store.isFulfillmentEnabled,
                    store.isActive,
                    store.latitude,
                    store.longitude,
                    store.phone,
                    store.email,
                ],
            );
        }
        console.log(`Inserted ${stores.length} stores`);

        // Insert products and variants
        let variantCount = 0;
        for (const { product, variants } of products) {
            await queryRunner.query(
                `INSERT INTO products (id, name, slug, description, category_id, base_price, is_active, is_featured, images, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                [
                    product.id,
                    product.name,
                    product.slug,
                    product.description,
                    product.categoryId,
                    product.basePrice,
                    product.isActive,
                    product.isFeatured,
                    `{${product.images.join(',')}}`,
                ],
            );

            for (const variant of variants) {
                await queryRunner.query(
                    `INSERT INTO product_variants (id, product_id, sku, size_code, size_model, color, color_hex, price, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
                    [
                        variant.id,
                        variant.productId,
                        variant.sku,
                        variant.sizeCode,
                        variant.sizeModel,
                        variant.color,
                        variant.colorHex,
                        variant.price,
                        variant.isActive,
                    ],
                );
                variantCount++;

                // Add inventory to each store (random quantities)
                for (const store of stores) {
                    const quantity = Math.floor(Math.random() * 20) + 5; // 5-25 units
                    await queryRunner.query(
                        `INSERT INTO store_inventory (id, store_id, sku, quantity, last_synced_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                        [uuidv4(), store.id, variant.sku, quantity],
                    );
                }
            }
        }
        console.log(`Inserted ${products.length} products with ${variantCount} variants`);
        console.log(`Created inventory for ${stores.length} stores`);

        await queryRunner.commitTransaction();
        console.log('✅ Seed completed successfully!');
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('❌ Seed failed:', error);
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}

seed();
