import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Añade la columna "type" (ingreso | egreso) a la tabla categories.
 * Valor por defecto 'egreso' para filas existentes.
 */
export class AddCategoryType1731612000000 implements MigrationInterface {
  name = "AddCategoryType1731612000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration runs early (by filename timestamp) but `categories` is
    // created later by init migrations. No-op if the table doesn't exist yet.
    await queryRunner.query(`SET search_path TO finance`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'finance'
            AND table_name = 'categories'
        ) THEN
          ALTER TABLE "finance"."categories"
          ADD COLUMN IF NOT EXISTS "type" character varying(10) NOT NULL DEFAULT 'egreso';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET search_path TO finance`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'finance'
            AND table_name = 'categories'
        ) THEN
          ALTER TABLE "finance"."categories"
          DROP COLUMN IF EXISTS "type";
        END IF;
      END $$;
    `);
  }
}
