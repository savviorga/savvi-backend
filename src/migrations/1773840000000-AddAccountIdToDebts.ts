import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountIdToDebts1773840000000 implements MigrationInterface {
  name = "AddAccountIdToDebts1773840000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'finance'
            AND table_name = 'debts'
        ) THEN
          ALTER TABLE "finance"."debts"
          ADD COLUMN IF NOT EXISTS "accountId" uuid;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'debts'
        ) THEN
          ALTER TABLE "public"."debts"
          ADD COLUMN IF NOT EXISTS "accountId" uuid;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'finance'
            AND table_name = 'debts'
        ) THEN
          ALTER TABLE "finance"."debts"
          DROP COLUMN IF EXISTS "accountId";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'debts'
        ) THEN
          ALTER TABLE "public"."debts"
          DROP COLUMN IF EXISTS "accountId";
        END IF;
      END $$;
    `);
  }
}

