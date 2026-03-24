import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTransferTemplatesTable1774018000000
  implements MigrationInterface
{
  name = "CreateTransferTemplatesTable1774018000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS finance.transfer_templates (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        user_id uuid NOT NULL,
        from_account_id uuid NOT NULL,
        name character varying(200) NOT NULL,
        payee_name character varying(200) NOT NULL,
        payee_account character varying(100),
        payee_bank character varying(100),
        last_amount numeric(12,2),
        recurrence_type character varying(20) NOT NULL DEFAULT 'reminder',
        frequency character varying(20) NOT NULL DEFAULT 'monthly',
        day_of_month smallint NOT NULL DEFAULT 1,
        next_due_date date NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone DEFAULT now() NOT NULL,
        CONSTRAINT pk_transfer_templates_id PRIMARY KEY (id),
        CONSTRAINT fk_transfer_templates_user FOREIGN KEY (user_id) REFERENCES finance.users(id) ON DELETE CASCADE,
        CONSTRAINT fk_transfer_templates_account FOREIGN KEY (from_account_id) REFERENCES finance.accounts(id)
      );

      CREATE INDEX IF NOT EXISTS idx_transfer_templates_next_due
        ON finance.transfer_templates (next_due_date)
        WHERE is_active = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS finance.transfer_templates CASCADE;`,
    );
  }
}

