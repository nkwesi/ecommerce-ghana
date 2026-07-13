import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Supabase exposes the public schema through its Data API. The storefront uses
 * the Nest backend instead, so RLS is enabled without public policies to deny
 * direct anon/authenticated API access to every application table.
 */
export class EnableRowLevelSecurity1783979000000 implements MigrationInterface {
    name = 'EnableRowLevelSecurity1783979000000';

    private readonly tables = [
        'migrations',
        'webhook_events',
        'products',
        'product_variants',
        'categories',
        'stores',
        'store_inventory',
        'inventory_reservations',
        'orders',
        'order_items',
        'shipping_addresses',
        'payments',
        'users',
        'addresses',
        'payment_methods',
    ];

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`ALTER TABLE "public"."${table}" ENABLE ROW LEVEL SECURITY`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of [...this.tables].reverse()) {
            await queryRunner.query(`ALTER TABLE "public"."${table}" DISABLE ROW LEVEL SECURITY`);
        }
    }
}
