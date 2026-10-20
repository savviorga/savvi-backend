import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Transferencias entre cuentas propias (SAV-24): `to_account_id` es la cuenta
 * destino. Solo aplica a `transferencia` y debe ser distinta de la de origen.
 * Una transferencia sin destino (las viejas, o un pago a un tercero) sigue
 * contando como salida de la cuenta de origen.
 */
export class AddTransferDestinationToTransactions1776400000000
  implements MigrationInterface
{
  name = 'AddTransferDestinationToTransactions1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      ADD COLUMN IF NOT EXISTS "to_account_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      ADD CONSTRAINT "FK_finance_transactions_to_account_id"
      FOREIGN KEY ("to_account_id") REFERENCES "finance"."accounts" ("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_to_account_id"
      ON "finance"."transactions" ("to_account_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      ADD CONSTRAINT "CHK_finance_transactions_to_account"
      CHECK (
        "to_account_id" IS NULL
        OR ("type" = 'transferencia' AND "to_account_id" IS DISTINCT FROM "account_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      DROP CONSTRAINT IF EXISTS "CHK_finance_transactions_to_account"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "finance"."IDX_finance_transactions_to_account_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      DROP CONSTRAINT IF EXISTS "FK_finance_transactions_to_account_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions" DROP COLUMN IF EXISTS "to_account_id"
    `);
  }
}
