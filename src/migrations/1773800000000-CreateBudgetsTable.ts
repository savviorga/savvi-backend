import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea tabla budgets para presupuestos por categoría y mes.
 */
export class CreateBudgetsTable1773800000000 implements MigrationInterface {
  name = 'CreateBudgetsTable1773800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "categoryId" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "period" character varying(20) NOT NULL DEFAULT 'monthly',
        "year" integer NOT NULL,
        "month" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budgets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budgets_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_budgets_category_month" ON "budgets" ("categoryId", "period", "year", "month")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_budgets_category_month"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
  }
}

