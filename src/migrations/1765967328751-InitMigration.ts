import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1765967328751 implements MigrationInterface {
    name = 'InitMigration1765967328751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "files"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "files" json`);
    }

}
