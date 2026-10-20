import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La cuenta de una transacción pasa de texto libre (`account`) a una FK
 * (`account_id`) hacia `accounts` (SAV-9):
 * - Se enlazan las filas cuyo texto ya era el id de una cuenta del usuario, y
 *   las que tenían el nombre de una única cuenta del usuario.
 * - El texto viejo se conserva en `legacy_account` para mostrarlo si no se pudo
 *   enlazar.
 * - `type` se normaliza y solo admite ingreso/egreso/transferencia en filas
 *   nuevas o editadas (CHECK NOT VALID: no falla con datos viejos).
 */
export class LinkTransactionsToAccounts1776200000000
  implements MigrationInterface
{
  name = 'LinkTransactionsToAccounts1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      ADD COLUMN IF NOT EXISTS "account_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "finance"."transactions" t
      SET "account_id" = a."id"
      FROM "finance"."accounts" a
      WHERE t."account_id" IS NULL
        AND a."user_id" = t."user_id"
        AND a."id"::text = trim(t."account")
    `);

    await queryRunner.query(`
      UPDATE "finance"."transactions" t
      SET "account_id" = m."id"
      FROM (
        SELECT "user_id", lower(trim("name")) AS name_key, min("id"::text)::uuid AS "id"
        FROM "finance"."accounts"
        GROUP BY "user_id", lower(trim("name"))
        HAVING count(*) = 1
      ) m
      WHERE t."account_id" IS NULL
        AND m."user_id" = t."user_id"
        AND m.name_key = lower(trim(t."account"))
    `);

    await queryRunner.query(`
      ALTER TABLE "finance"."transactions" RENAME COLUMN "account" TO "legacy_account"
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions" ALTER COLUMN "legacy_account" DROP NOT NULL
    `);
    // Ya enlazadas: el texto viejo no aporta nada.
    await queryRunner.query(`
      UPDATE "finance"."transactions"
      SET "legacy_account" = NULL
      WHERE "account_id" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      ADD CONSTRAINT "FK_finance_transactions_account_id"
      FOREIGN KEY ("account_id") REFERENCES "finance"."accounts" ("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_account_id"
      ON "finance"."transactions" ("account_id")
    `);

    await queryRunner.query(`
      UPDATE "finance"."transactions"
      SET "type" = lower(trim("type"))
      WHERE "type" <> lower(trim("type"))
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      ADD CONSTRAINT "CHK_finance_transactions_type"
      CHECK ("type" IN ('ingreso', 'egreso', 'transferencia')) NOT VALID
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      DROP CONSTRAINT IF EXISTS "CHK_finance_transactions_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions"
      DROP CONSTRAINT IF EXISTS "FK_finance_transactions_account_id"
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "finance"."IDX_finance_transactions_account_id"`,
    );
    await queryRunner.query(`
      UPDATE "finance"."transactions"
      SET "legacy_account" = COALESCE("account_id"::text, "legacy_account", '')
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions" RENAME COLUMN "legacy_account" TO "account"
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions" ALTER COLUMN "account" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."transactions" DROP COLUMN IF EXISTS "account_id"
    `);
  }
}
