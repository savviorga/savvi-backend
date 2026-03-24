import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRemindersTable1774018000001
  implements MigrationInterface
{
  name = "CreateRemindersTable1774018000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS finance.reminders (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        template_id uuid NOT NULL,
        scheduled_at timestamp without time zone NOT NULL,
        sent_at timestamp without time zone,
        status character varying(20) NOT NULL DEFAULT 'scheduled',
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        CONSTRAINT pk_reminders_id PRIMARY KEY (id),
        CONSTRAINT fk_reminders_template
          FOREIGN KEY (template_id)
          REFERENCES finance.transfer_templates(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at
        ON finance.reminders (scheduled_at)
        WHERE status = 'scheduled';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS finance.reminders CASCADE;`);
  }
}

