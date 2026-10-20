import { MigrationInterface, QueryRunner } from 'typeorm';

/** Contador de contraseñas incorrectas y bloqueo temporal del login (SAV-5). */
export class AddLoginLockoutToUsers1776000000000 implements MigrationInterface {
  name = 'AddLoginLockoutToUsers1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."users"
      ADD COLUMN IF NOT EXISTS "failedLoginAttempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "finance"."users"
      DROP COLUMN IF EXISTS "lockedUntil",
      DROP COLUMN IF EXISTS "failedLoginAttempts"
    `);
  }
}
