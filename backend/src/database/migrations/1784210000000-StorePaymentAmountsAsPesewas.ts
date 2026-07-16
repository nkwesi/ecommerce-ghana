import { MigrationInterface, QueryRunner } from 'typeorm';

export class StorePaymentAmountsAsPesewas1784210000000 implements MigrationInterface {
    name = 'StorePaymentAmountsAsPesewas1784210000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount_pesewas" bigint`);
        await queryRunner.query(`UPDATE "payments" SET "amount_pesewas" = ROUND("amount" * 100)`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "amount_pesewas" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount" numeric(10,2)`);
        await queryRunner.query(`UPDATE "payments" SET "amount" = "amount_pesewas" / 100.0`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "amount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount_pesewas"`);
    }
}
