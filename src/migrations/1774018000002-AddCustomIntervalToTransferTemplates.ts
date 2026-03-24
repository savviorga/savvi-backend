import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomIntervalToTransferTemplates1774018000002
  implements MigrationInterface
{
  name = "AddCustomIntervalToTransferTemplates1774018000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance.transfer_templates
      ADD COLUMN IF NOT EXISTS custom_interval_days integer NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance.transfer_templates
      DROP COLUMN IF EXISTS custom_interval_days;
    `);
  }
}
