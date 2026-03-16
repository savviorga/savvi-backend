import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Crea el schema "finance" y la tabla "accounts" dentro de él.
 * TypeORM está configurado con schema: 'finance', pero las migraciones
 * anteriores creaban tablas sin schema (en public). Esta migración asegura
 * que existan finance y finance.accounts.
 */
export class CreateFinanceSchemaAndAccounts1765970000000
  implements MigrationInterface
{
  name = "CreateFinanceSchemaAndAccounts1765970000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "finance"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance"."accounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "icon" character varying,
        "color" character varying,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_accounts_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "finance"."accounts"`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS "finance"`);
  }
}
