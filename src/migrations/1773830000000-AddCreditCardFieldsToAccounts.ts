import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditCardFieldsToAccounts1773830000000 implements MigrationInterface {
  name = "AddCreditCardFieldsToAccounts1773830000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'finance'
            AND table_name = 'accounts'
        ) THEN
          ALTER TABLE "finance"."accounts"
          ADD COLUMN IF NOT EXISTS "creditLimit" numeric(12,2),
          ADD COLUMN IF NOT EXISTS "aprRate" numeric(8,4),
          ADD COLUMN IF NOT EXISTS "gracePeriodDays" integer,
          ADD COLUMN IF NOT EXISTS "statementDay" smallint,
          ADD COLUMN IF NOT EXISTS "dueDay" smallint,
          ADD COLUMN IF NOT EXISTS "minPaymentPercent" numeric(6,2),
          ADD COLUMN IF NOT EXISTS "minPaymentAmount" numeric(12,2);
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'accounts'
        ) THEN
          ALTER TABLE "public"."accounts"
          ADD COLUMN IF NOT EXISTS "creditLimit" numeric(12,2),
          ADD COLUMN IF NOT EXISTS "aprRate" numeric(8,4),
          ADD COLUMN IF NOT EXISTS "gracePeriodDays" integer,
          ADD COLUMN IF NOT EXISTS "statementDay" smallint,
          ADD COLUMN IF NOT EXISTS "dueDay" smallint,
          ADD COLUMN IF NOT EXISTS "minPaymentPercent" numeric(6,2),
          ADD COLUMN IF NOT EXISTS "minPaymentAmount" numeric(12,2);
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
            AND table_name = 'accounts'
        ) THEN
          ALTER TABLE "finance"."accounts"
          DROP COLUMN IF EXISTS "creditLimit",
          DROP COLUMN IF EXISTS "aprRate",
          DROP COLUMN IF EXISTS "gracePeriodDays",
          DROP COLUMN IF EXISTS "statementDay",
          DROP COLUMN IF EXISTS "dueDay",
          DROP COLUMN IF EXISTS "minPaymentPercent",
          DROP COLUMN IF EXISTS "minPaymentAmount";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'accounts'
        ) THEN
          ALTER TABLE "public"."accounts"
          DROP COLUMN IF EXISTS "creditLimit",
          DROP COLUMN IF EXISTS "aprRate",
          DROP COLUMN IF EXISTS "gracePeriodDays",
          DROP COLUMN IF EXISTS "statementDay",
          DROP COLUMN IF EXISTS "dueDay",
          DROP COLUMN IF EXISTS "minPaymentPercent",
          DROP COLUMN IF EXISTS "minPaymentAmount";
        END IF;
      END $$;
    `);
  }
}

