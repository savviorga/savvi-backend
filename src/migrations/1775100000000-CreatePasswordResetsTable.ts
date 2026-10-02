import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetsTable1775100000000
  implements MigrationInterface
{
  name = 'CreatePasswordResetsTable1775100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance"."password_resets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "code_hash" character varying(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "verified_at" TIMESTAMP WITH TIME ZONE,
        "reset_token_hash" character varying(64),
        "reset_token_expires_at" TIMESTAMP WITH TIME ZONE,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_password_resets_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_finance_password_resets_user_id" FOREIGN KEY ("user_id")
          REFERENCES "finance"."users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_password_resets_user_id"
      ON "finance"."password_resets" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_password_resets_reset_token_hash"
      ON "finance"."password_resets" ("reset_token_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "finance"."password_resets"`);
  }
}
