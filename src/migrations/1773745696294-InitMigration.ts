import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773745696294 implements MigrationInterface {
    name = 'InitMigration1773745696294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "debt_payments" DROP CONSTRAINT "FK_debt_payments_debt"`);
        await queryRunner.query(`ALTER TABLE "debt_payments" ADD CONSTRAINT "FK_d2a2d5006c00bb3998be54ec542" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "debt_payments" DROP CONSTRAINT "FK_d2a2d5006c00bb3998be54ec542"`);
        await queryRunner.query(`ALTER TABLE "debt_payments" ADD CONSTRAINT "FK_debt_payments_debt" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
