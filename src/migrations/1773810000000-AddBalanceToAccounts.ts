import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBalanceToAccounts1773810000000 implements MigrationInterface {
  name = 'AddBalanceToAccounts1773810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "balance" numeric(12,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP COLUMN IF EXISTS "balance"
    `);
  }
}

