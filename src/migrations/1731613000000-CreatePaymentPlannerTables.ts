import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea tablas debts y debt_payments para el Planificador de pagos.
 */
export class CreatePaymentPlannerTables1731613000000
  implements MigrationInterface
{
  name = 'CreatePaymentPlannerTables1731613000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "debts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(200) NOT NULL,
        "payee" character varying(200) NOT NULL,
        "totalAmount" numeric(12,2) NOT NULL,
        "remainingAmount" numeric(12,2) NOT NULL,
        "dueDate" date NOT NULL,
        "notes" text,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "debt_payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "debtId" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "paidAt" date NOT NULL,
        "transactionId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debt_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_debt_payments_debt" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "debt_payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "debts"`);
  }
}
