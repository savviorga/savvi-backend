import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToTransferTemplates1775300000000
  implements MigrationInterface
{
  name = 'AddDescriptionToTransferTemplates1775300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance.transfer_templates
      ADD COLUMN IF NOT EXISTS description text NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE finance.transfer_templates
      DROP COLUMN IF EXISTS description;
    `);
  }
}
