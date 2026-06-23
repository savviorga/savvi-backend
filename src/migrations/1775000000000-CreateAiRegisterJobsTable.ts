import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiRegisterJobsTable1775000000000 implements MigrationInterface {
  name = 'CreateAiRegisterJobsTable1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance"."ai_register_jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "file_key" character varying(512) NOT NULL,
        "file_name" character varying(255) NOT NULL,
        "file_size" bigint NOT NULL,
        "mime_type" character varying(120) NOT NULL,
        "user_text" text,
        "status" character varying(20) NOT NULL DEFAULT 'queued',
        "error" text,
        "extracted_payload" jsonb,
        "created_transaction_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_ai_register_jobs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_ai_register_jobs_user_id"
      ON "finance"."ai_register_jobs" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "finance"."ai_register_jobs"
    `);
  }
}
