import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783975376752 implements MigrationInterface {
    name = 'InitialSchema1783975376752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "size_code" character varying(20) NOT NULL, "size_model" character varying(50) NOT NULL DEFAULT 'STANDARD_V1', "color" character varying(50) NOT NULL, "color_hex" character varying(7), "price" numeric(10,2) NOT NULL, "compare_at_price" numeric(10,2), "is_active" boolean NOT NULL DEFAULT true, "images" text, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_46f236f21640f9da218a063a866" UNIQUE ("sku"), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_46f236f21640f9da218a063a86" ON "product_variants" ("sku") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "parent_id" uuid, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_420d9f679d41281f282f5bc7d0" ON "categories" ("slug") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "slug" character varying(255) NOT NULL, "category_id" uuid, "base_price" numeric(10,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "is_featured" boolean NOT NULL DEFAULT false, "images" text, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_464f927ae360106b783ed0b410" ON "products" ("slug") `);
        await queryRunner.query(`CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "code" character varying(50) NOT NULL, "address" text, "city" character varying(100), "postal_code" character varying(20), "country_code" character varying(2) NOT NULL DEFAULT 'GH', "is_fulfillment_enabled" boolean NOT NULL DEFAULT true, "latitude" numeric(10,7), "longitude" numeric(10,7), "phone" character varying(20), "email" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_72bdebc754d6a689b3c169cab8a" UNIQUE ("code"), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_72bdebc754d6a689b3c169cab8" ON "stores" ("code") `);
        await queryRunner.query(`CREATE TABLE "store_inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "store_id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "last_synced_at" TIMESTAMP, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d518ea4316b1bd792bb31166398" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fce3c044d050a13a38edcdf443" ON "store_inventory" ("sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_3680cbc14368d5bc5f93d86916" ON "store_inventory" ("sku", "store_id") `);
        await queryRunner.query(`CREATE TYPE "public"."inventory_reservations_status_enum" AS ENUM('active', 'converted', 'expired', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "inventory_reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "store_id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "quantity" integer NOT NULL, "expires_at" TIMESTAMP NOT NULL, "order_id" uuid, "session_id" character varying(255) NOT NULL, "status" "public"."inventory_reservations_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_af438c0ce596eea6c4d472a0489" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_396aa9c122b5ee9040959aa3ac" ON "inventory_reservations" ("sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_4fce449d8632c522204f5203d5" ON "inventory_reservations" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_53be5aeb5c78a2848967096ff4" ON "inventory_reservations" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e70a9f9a00b4595c0ffc39095e" ON "inventory_reservations" ("sku", "store_id", "status", "expires_at") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "variant_id" uuid NOT NULL, "sku_snapshot" character varying(100) NOT NULL, "product_name_snapshot" character varying(255) NOT NULL, "size_snapshot" character varying(20) NOT NULL, "color_snapshot" character varying(50) NOT NULL, "quantity" integer NOT NULL, "unit_price" numeric(10,2) NOT NULL, "total_price" numeric(10,2) NOT NULL, "fulfillment_store_id" uuid, "is_fulfilled" boolean NOT NULL DEFAULT false, "fulfilled_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shipping_addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "full_name" character varying(255) NOT NULL, "address_line1" character varying(255) NOT NULL, "address_line2" character varying(255), "city" character varying(100) NOT NULL, "region" character varying(100), "postal_code" character varying(20), "country_code" character varying(2) NOT NULL DEFAULT 'GH', "phone" character varying(20) NOT NULL, "delivery_instructions" text, CONSTRAINT "PK_cced78984eddbbe24470f226692" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_number" character varying(50) NOT NULL, "customer_email" character varying(255) NOT NULL, "customer_name" character varying(255) NOT NULL, "customer_phone" character varying(20), "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "subtotal" numeric(10,2) NOT NULL, "tax_amount" numeric(10,2) NOT NULL DEFAULT '0', "shipping_cost" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'GHS', "country_code" character varying(2) NOT NULL DEFAULT 'GH', "tracking_number" character varying(100), "shipped_at" TIMESTAMP, "delivered_at" TIMESTAMP, "notes" text, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_75eba1c6b1a66b09f2a97e6927b" UNIQUE ("order_number"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_75eba1c6b1a66b09f2a97e6927" ON "orders" ("order_number") `);
        await queryRunner.query(`CREATE INDEX "IDX_5302146a0d25a517bac354fd52" ON "orders" ("customer_email") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "payment_provider" character varying(50) NOT NULL DEFAULT 'demo', "payment_intent_id" character varying(255) NOT NULL, "checkout_url" character varying(500), "amount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'GHS', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "refund_amount" numeric(10,2), "refunded_at" TIMESTAMP, "metadata" jsonb, "failure_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0bd2a15bde4058590f0caea36b3" UNIQUE ("payment_intent_id"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0bd2a15bde4058590f0caea36b" ON "payments" ("payment_intent_id") `);
        await queryRunner.query(`CREATE TABLE "webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" character varying(255) NOT NULL, "event_type" character varying(100) NOT NULL, "provider" character varying(50) NOT NULL, "processed_at" TIMESTAMP NOT NULL DEFAULT now(), "payload" jsonb, "is_successful" boolean NOT NULL DEFAULT true, "error_message" text, CONSTRAINT "UQ_eca7d9af1d5bb2184a201ed250d" UNIQUE ("event_id"), CONSTRAINT "PK_4cba37e6a0acb5e1fc49c34ebfd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eca7d9af1d5bb2184a201ed250" ON "webhook_events" ("event_id") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('CUSTOMER', 'ADMIN', 'SUPER_ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "full_name" character varying(255), "phone_number" character varying(20), "address" text, "is_active" boolean NOT NULL DEFAULT true, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CUSTOMER', "password" character varying, "currency" character varying(3) NOT NULL DEFAULT 'GHS', "language" character varying(10) NOT NULL DEFAULT 'en-US', "two_factor_enabled" boolean NOT NULL DEFAULT false, "marketing_opt_in" boolean NOT NULL DEFAULT true, "order_notifications" boolean NOT NULL DEFAULT true, "preferences" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "type" character varying(20) NOT NULL DEFAULT 'home', "line_1" character varying(255) NOT NULL, "line_2" character varying(255), "city" character varying(100) NOT NULL, "region" character varying(100) NOT NULL, "country" character varying(100) NOT NULL DEFAULT 'Ghana', "phone" character varying(20) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_16aac8a9f6f9c1dd6bcb75ec02" ON "addresses" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying(20) NOT NULL, "last_4" character varying(4) NOT NULL, "expiry" character varying(7), "holder_name" character varying(255) NOT NULL, "is_primary" boolean NOT NULL DEFAULT false, "is_mobile_money" boolean NOT NULL DEFAULT false, "tokenizedData" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d7d7fb15569674aaadcfbc0428" ON "payment_methods" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_inventory" ADD CONSTRAINT "FK_5e68b7ed564877449f5d37e7da9" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" ADD CONSTRAINT "FK_c9899f959654d1ebae9955ec5a3" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" ADD CONSTRAINT "FK_d1fbda1ce7dadb95a9b17cd3876" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_d7d7fb15569674aaadcfbc0428c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_d7d7fb15569674aaadcfbc0428c"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`);
        await queryRunner.query(`ALTER TABLE "shipping_addresses" DROP CONSTRAINT "FK_d1fbda1ce7dadb95a9b17cd3876"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "inventory_reservations" DROP CONSTRAINT "FK_c9899f959654d1ebae9955ec5a3"`);
        await queryRunner.query(`ALTER TABLE "store_inventory" DROP CONSTRAINT "FK_5e68b7ed564877449f5d37e7da9"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7d7fb15569674aaadcfbc0428"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16aac8a9f6f9c1dd6bcb75ec02"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eca7d9af1d5bb2184a201ed250"`);
        await queryRunner.query(`DROP TABLE "webhook_events"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0bd2a15bde4058590f0caea36b"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5302146a0d25a517bac354fd52"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_75eba1c6b1a66b09f2a97e6927"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "shipping_addresses"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e70a9f9a00b4595c0ffc39095e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53be5aeb5c78a2848967096ff4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4fce449d8632c522204f5203d5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_396aa9c122b5ee9040959aa3ac"`);
        await queryRunner.query(`DROP TABLE "inventory_reservations"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_reservations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3680cbc14368d5bc5f93d86916"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fce3c044d050a13a38edcdf443"`);
        await queryRunner.query(`DROP TABLE "store_inventory"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72bdebc754d6a689b3c169cab8"`);
        await queryRunner.query(`DROP TABLE "stores"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_464f927ae360106b783ed0b410"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_420d9f679d41281f282f5bc7d0"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46f236f21640f9da218a063a86"`);
        await queryRunner.query(`DROP TABLE "product_variants"`);
    }

}
