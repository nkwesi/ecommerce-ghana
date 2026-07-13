import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

/**
 * Seed script for development data.
 * Run: npx ts-node src/database/seed.ts
 */

// Sample data
const categories = [
    { id: uuidv4(), name: 'Women', slug: 'women', description: 'Modern womenswear', sortOrder: 1 },
    { id: uuidv4(), name: 'Men', slug: 'men', description: 'Modern menswear', sortOrder: 2 },
    { id: uuidv4(), name: 'Essentials', slug: 'essentials', description: 'Everyday wardrobe essentials', sortOrder: 3 },
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
    image: string,
    skuBase: string,
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
            images: [`/products/${image}`],
        },
        variants: variants.map((v, i) => ({
            id: uuidv4(),
            productId,
            sku: `${skuBase.toUpperCase().replace(/-/g, '')}-${v.color.slice(0, 3).toUpperCase()}-${v.size}`,
            sizeCode: v.size,
            sizeModel: 'STANDARD_V1',
            color: v.color,
            colorHex: v.colorHex,
            price: v.price,
            isActive: true,
        })),
    };
}

const sizes = ['S', 'M', 'L', 'XL'];
const expand = (productSizes: string[], productColors: { name: string; hex: string }[], price: number) =>
    productColors.flatMap((color) => productSizes.map((size) => ({
        size, color: color.name, colorHex: color.hex, price,
    })));

const products = [
    createProduct(
        'The Ama Midi Dress', 'the-ama-midi-dress',
        'A clean, sculpted midi with an easy drape. Designed for warm afternoons and polished evenings.',
        categories[0].id, 390,
        expand(sizes, [{ name: 'Midnight', hex: '#171717' }, { name: 'Cocoa', hex: '#6b4435' }], 390),
        'dress.png', 'ama-midi',
    ),
    createProduct(
        'Relaxed Poplin Shirt', 'relaxed-poplin-shirt',
        'Breathable cotton poplin cut with a relaxed shoulder and a crisp, versatile finish.',
        categories[1].id, 245,
        expand(sizes, [{ name: 'Cloud', hex: '#f1eee8' }, { name: 'Sky', hex: '#8aa7be' }], 245),
        'shirt.png', 'poplin-shirt',
    ),
    createProduct(
        'Osu Tailored Blazer', 'osu-tailored-blazer',
        'An unlined tailored layer with a confident silhouette and lightweight construction.',
        categories[0].id, 620,
        expand(sizes, [{ name: 'Sand', hex: '#c5aa86' }, { name: 'Ink', hex: '#24252a' }], 620),
        'blazer.png', 'osu-blazer',
    ),
    createProduct(
        'Everyday Weight Tee', 'everyday-weight-tee',
        'A substantial cotton tee with a soft hand feel, neat neckline, and easy everyday shape.',
        categories[2].id, 135,
        expand(sizes, [{ name: 'Black', hex: '#171717' }, { name: 'Ivory', hex: '#eee9df' }, { name: 'Clay', hex: '#a55f45' }], 135),
        'tee.png', 'weight-tee',
    ),
    createProduct(
        'Wide-Leg Trouser', 'wide-leg-trouser',
        'Fluid high-rise trousers made to move, with a clean waistband and full-length leg.',
        categories[0].id, 320,
        expand(['8', '10', '12', '14', '16'], [{ name: 'Espresso', hex: '#3a2925' }, { name: 'Olive', hex: '#6d7052' }], 320),
        'pants.png', 'wide-trouser',
    ),
    createProduct(
        'Soft Knit Cardigan', 'soft-knit-cardigan',
        'A breathable fine knit for cool evenings, finished with tonal buttons and a relaxed cuff.',
        categories[0].id, 285,
        expand(sizes, [{ name: 'Oat', hex: '#d4c5ad' }, { name: 'Wine', hex: '#6c2638' }], 285),
        'cardigan.png', 'knit-cardigan',
    ),
    createProduct(
        'Utility Overshirt', 'utility-overshirt',
        'A structured cotton overshirt with practical pockets and enough room for layering.',
        categories[1].id, 410,
        expand(sizes, [{ name: 'Forest', hex: '#3e4d3b' }, { name: 'Stone', hex: '#8a8175' }], 410),
        'jacket.png', 'utility-shirt',
    ),
    createProduct(
        'Column Midi Skirt', 'column-midi-skirt',
        'A minimal column skirt with a comfortable back vent and an elegant, close fit.',
        categories[0].id, 260,
        expand(['8', '10', '12', '14', '16'], [{ name: 'Black', hex: '#171717' }, { name: 'Merlot', hex: '#682b3a' }], 260),
        'skirt.png', 'column-skirt',
    ),
    createProduct(
        'Textured Crew Knit', 'textured-crew-knit',
        'A refined crew-neck knit with a subtle texture and comfortable midweight feel.',
        categories[1].id, 310,
        expand(sizes, [{ name: 'Charcoal', hex: '#4d4d4d' }, { name: 'Cream', hex: '#e8dfcf' }], 310),
        'sweater.png', 'crew-knit',
    ),
    createProduct(
        'Draped Neck Top', 'draped-neck-top',
        'A softly draped top that dresses up denim and pairs effortlessly with tailoring.',
        categories[0].id, 195,
        expand(sizes, [{ name: 'Pearl', hex: '#e6ddd0' }, { name: 'Cocoa', hex: '#735044' }], 195),
        'top.png', 'draped-top',
    ),
    createProduct(
        'Lightweight City Coat', 'lightweight-city-coat',
        'A polished, light layer with a long line and understated details for everyday wear.',
        categories[0].id, 720,
        expand(sizes, [{ name: 'Camel', hex: '#b58c64' }, { name: 'Black', hex: '#171717' }], 720),
        'coat.png', 'city-coat',
    ),
    createProduct(
        'Tailored Weekend Shorts', 'tailored-weekend-shorts',
        'Clean-cut cotton shorts designed for easy weekends and warm days in the city.',
        categories[1].id, 210,
        expand(['30', '32', '34', '36', '38'], [{ name: 'Khaki', hex: '#b8a27e' }, { name: 'Navy', hex: '#273448' }], 210),
        'shorts.png', 'weekend-shorts',
    ),
];

async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    const useSsl = process.env.DATABASE_SSL
        ? process.env.DATABASE_SSL === 'true'
        : Boolean(databaseUrl);
    const ca = process.env.DATABASE_CA_CERT_BASE64
        ? Buffer.from(process.env.DATABASE_CA_CERT_BASE64, 'base64').toString('utf8')
        : undefined;

    const AppDataSource = new DataSource({
        type: 'postgres',
        ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: process.env.DATABASE_HOST || 'localhost',
                port: parseInt(process.env.DATABASE_PORT || '5432'),
                database: process.env.DATABASE_NAME || 'ecommerce_ghana',
                username: process.env.DATABASE_USER || 'postgres',
                password: process.env.DATABASE_PASSWORD || 'postgres',
            }),
        ssl: useSsl
            ? {
                rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
                ...(ca ? { ca } : {}),
            }
            : false,
        // Schema changes belong in reviewed migrations, including during seeding.
        synchronize: false,
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
                    product.images.join(','),
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
        console.log('Seed completed successfully.');
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error('Seed failed:', error);
        throw error;
    } finally {
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}

seed();
