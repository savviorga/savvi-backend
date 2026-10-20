import { MigrationInterface, QueryRunner } from 'typeorm';

/** Consumo de IA por usuario para cuotas y panel de uso (SAV-7). */
export class CreateAiUsageTable1776100000000 implements MigrationInterface {
  name = 'CreateAiUsageTable1776100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance"."ai_usage" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "endpoint" character varying(40) NOT NULL,
        "model" character varying(80),
        "calls" integer NOT NULL DEFAULT 1,
        "input_tokens" integer NOT NULL DEFAULT 0,
        "cached_tokens" integer NOT NULL DEFAULT 0,
        "output_tokens" integer NOT NULL DEFAULT 0,
        "cost_usd" numeric(12,6) NOT NULL DEFAULT 0,
        "unpriced_calls" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_ai_usage_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_finance_ai_usage_user_id" FOREIGN KEY ("user_id")
          REFERENCES "finance"."users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_ai_usage_user_created"
      ON "finance"."ai_usage" ("user_id", "created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "finance"."ai_usage"`);
  }
}
