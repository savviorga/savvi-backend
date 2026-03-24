import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAmountAutoCalculatedToBudgets1774019000000
  implements MigrationInterface
{
  name = 'AddAmountAutoCalculatedToBudgets1774019000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "budgets"
      ADD COLUMN IF NOT EXISTS "amountAutoCalculated" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "budgets" DROP COLUMN IF EXISTS "amountAutoCalculated"
    `);
  }
}
