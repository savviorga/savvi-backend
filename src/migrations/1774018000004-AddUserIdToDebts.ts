import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Asocia cada deuda del planificador al usuario propietario (schema finance).
 */
export class AddUserIdToDebts1774018000004 implements MigrationInterface {
  name = "AddUserIdToDebts1774018000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = "finance";

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schema}' AND table_name = 'debts'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'debts' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."debts" ADD COLUMN "user_id" uuid NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE uid uuid;
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schema}' AND table_name = 'users'
        ) THEN
          SELECT id INTO uid FROM "${schema}"."users" ORDER BY "createdAt" ASC LIMIT 1;
          IF uid IS NOT NULL THEN
            UPDATE "${schema}"."debts" SET "user_id" = uid WHERE "user_id" IS NULL;
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DELETE FROM "${schema}"."debts" WHERE "user_id" IS NULL;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'debts' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."debts" ALTER COLUMN "user_id" SET NOT NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."debts" DROP CONSTRAINT IF EXISTS "fk_debts_user_id";
      ALTER TABLE "${schema}"."debts"
        ADD CONSTRAINT "fk_debts_user_id"
        FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS "idx_finance_debts_user_id" ON "${schema}"."debts" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = "finance";
    await queryRunner.query(`
      ALTER TABLE "${schema}"."debts" DROP CONSTRAINT IF EXISTS "fk_debts_user_id";
      DROP INDEX IF EXISTS "${schema}"."idx_finance_debts_user_id";
      ALTER TABLE "${schema}"."debts" DROP COLUMN IF EXISTS "user_id";
    `);
  }
}
