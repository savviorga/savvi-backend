import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecurringToDebts1773700000000 implements MigrationInterface {
  name = 'AddRecurringToDebts1773700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "debts"
        ADD COLUMN IF NOT EXISTS "isRecurring" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "recurrenceType" character varying(20),
        ADD COLUMN IF NOT EXISTS "recurrenceDay" smallint
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "debts"
        DROP COLUMN IF EXISTS "recurrenceDay",
        DROP COLUMN IF EXISTS "recurrenceType",
        DROP COLUMN IF EXISTS "isRecurring"
    `);
  }
}
