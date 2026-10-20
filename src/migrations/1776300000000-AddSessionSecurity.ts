import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - `users.tokenVersion`: va en el JWT; al subirla se invalidan todas las
 *   sesiones del usuario (cambio de contraseña, recuperación, 2FA, email).
 * - `two_factor_challenges.payload`: dato asociado al reto (el email nuevo en
 *   un cambio de email). (SAV-10)
 */
export class AddSessionSecurity1776300000000 implements MigrationInterface {
  name = 'AddSessionSecurity1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."users"
      ADD COLUMN IF NOT EXISTS "tokenVersion" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."two_factor_challenges"
      ADD COLUMN IF NOT EXISTS "payload" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."two_factor_challenges" DROP COLUMN IF EXISTS "payload"
    `);
    await queryRunner.query(`
      ALTER TABLE "finance"."users" DROP COLUMN IF EXISTS "tokenVersion"
    `);
  }
}
