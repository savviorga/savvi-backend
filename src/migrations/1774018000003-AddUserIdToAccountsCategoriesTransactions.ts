import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Asocia cuentas, categorías y transacciones al usuario propietario (schema finance).
 * Filas existentes: se asignan al usuario más antiguo; si no hay usuarios, se borran huérfanas.
 */
export class AddUserIdToAccountsCategoriesTransactions1774018000003
  implements MigrationInterface
{
  name = "AddUserIdToAccountsCategoriesTransactions1774018000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const schema = "finance";

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schema}' AND table_name = 'accounts'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'accounts' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."accounts" ADD COLUMN "user_id" uuid NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schema}' AND table_name = 'categories'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'categories' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."categories" ADD COLUMN "user_id" uuid NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schema}' AND table_name = 'transactions'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'transactions' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."transactions" ADD COLUMN "user_id" uuid NULL;
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
            UPDATE "${schema}"."accounts" SET "user_id" = uid WHERE "user_id" IS NULL;
            UPDATE "${schema}"."categories" SET "user_id" = uid WHERE "user_id" IS NULL;
            UPDATE "${schema}"."transactions" SET "user_id" = uid WHERE "user_id" IS NULL;
          END IF;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DELETE FROM "${schema}"."accounts" WHERE "user_id" IS NULL;
      DELETE FROM "${schema}"."categories" WHERE "user_id" IS NULL;
      DELETE FROM "${schema}"."transactions" WHERE "user_id" IS NULL;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'accounts' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."accounts" ALTER COLUMN "user_id" SET NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'categories' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."categories" ALTER COLUMN "user_id" SET NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schema}' AND table_name = 'transactions' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE "${schema}"."transactions" ALTER COLUMN "user_id" SET NOT NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."accounts" DROP CONSTRAINT IF EXISTS "fk_accounts_user_id";
      ALTER TABLE "${schema}"."accounts"
        ADD CONSTRAINT "fk_accounts_user_id"
        FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS "idx_finance_accounts_user_id" ON "${schema}"."accounts" ("user_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."categories" DROP CONSTRAINT IF EXISTS "fk_categories_user_id";
      ALTER TABLE "${schema}"."categories"
        ADD CONSTRAINT "fk_categories_user_id"
        FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS "idx_finance_categories_user_id" ON "${schema}"."categories" ("user_id");
    `);

    await queryRunner.query(`
      ALTER TABLE "${schema}"."transactions" DROP CONSTRAINT IF EXISTS "fk_transactions_user_id";
      ALTER TABLE "${schema}"."transactions"
        ADD CONSTRAINT "fk_transactions_user_id"
        FOREIGN KEY ("user_id") REFERENCES "${schema}"."users"("id") ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS "idx_finance_transactions_user_id" ON "${schema}"."transactions" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const schema = "finance";
    await queryRunner.query(`
      ALTER TABLE "${schema}"."transactions" DROP CONSTRAINT IF EXISTS "fk_transactions_user_id";
      DROP INDEX IF EXISTS "${schema}"."idx_finance_transactions_user_id";
      ALTER TABLE "${schema}"."transactions" DROP COLUMN IF EXISTS "user_id";

      ALTER TABLE "${schema}"."categories" DROP CONSTRAINT IF EXISTS "fk_categories_user_id";
      DROP INDEX IF EXISTS "${schema}"."idx_finance_categories_user_id";
      ALTER TABLE "${schema}"."categories" DROP COLUMN IF EXISTS "user_id";

      ALTER TABLE "${schema}"."accounts" DROP CONSTRAINT IF EXISTS "fk_accounts_user_id";
      DROP INDEX IF EXISTS "${schema}"."idx_finance_accounts_user_id";
      ALTER TABLE "${schema}"."accounts" DROP COLUMN IF EXISTS "user_id";
    `);
  }
}
