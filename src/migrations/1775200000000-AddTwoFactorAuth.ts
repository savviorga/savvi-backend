import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTwoFactorAuth1775200000000 implements MigrationInterface {
  name = 'AddTwoFactorAuth1775200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."users"
      ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance"."two_factor_challenges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "purpose" character varying(20) NOT NULL,
        "code_hash" character varying(64) NOT NULL,
        "token_hash" character varying(64),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "send_count" integer NOT NULL DEFAULT 1,
        "last_sent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_two_factor_challenges_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_finance_two_factor_challenges_user_id" FOREIGN KEY ("user_id")
          REFERENCES "finance"."users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_two_factor_challenges_user_id"
      ON "finance"."two_factor_challenges" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_finance_two_factor_challenges_token_hash"
      ON "finance"."two_factor_challenges" ("token_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "finance"."two_factor_challenges"`,
    );
    await queryRunner.query(
      `ALTER TABLE "finance"."users" DROP COLUMN IF EXISTS "twoFactorEnabled"`,
    );
  }
}
