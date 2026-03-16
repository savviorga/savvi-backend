import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Añade la columna "type" (ingreso | egreso) a la tabla categories.
 * Valor por defecto 'egreso' para filas existentes.
 */
export class AddCategoryType1731612000000 implements MigrationInterface {
  name = "AddCategoryType1731612000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "type" character varying(10) NOT NULL DEFAULT 'egreso'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "type"
    `);
  }
}
