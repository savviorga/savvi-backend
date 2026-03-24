import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBudgetDetailsTable1774018000005 implements MigrationInterface {
  name = "CreateBudgetDetailsTable1774018000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance"."budget_details" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "budgetId" uuid NOT NULL,
        "label" character varying(200) NOT NULL,
        "description" text,
        "estimatedAmount" numeric(12,2),
        "sortOrder" smallint NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_budget_details_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_budget_details_budget"
          FOREIGN KEY ("budgetId") REFERENCES "finance"."budgets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_budget_details_budget_id"
      ON "finance"."budget_details" ("budgetId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "finance"."budget_details"`,
    );
  }
}
