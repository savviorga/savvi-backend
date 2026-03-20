import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsCreditToAccounts1773820000000 implements MigrationInterface {
  name = "AddIsCreditToAccounts1773820000000";

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
          ADD COLUMN IF NOT EXISTS "isCredit" boolean NOT NULL DEFAULT false;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'accounts'
        ) THEN
          ALTER TABLE "public"."accounts"
          ADD COLUMN IF NOT EXISTS "isCredit" boolean NOT NULL DEFAULT false;
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
          DROP COLUMN IF EXISTS "isCredit";
        END IF;

        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'accounts'
        ) THEN
          ALTER TABLE "public"."accounts"
          DROP COLUMN IF EXISTS "isCredit";
        END IF;
      END $$;
    `);
  }
}

