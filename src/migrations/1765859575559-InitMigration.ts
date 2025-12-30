import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1765859575559 implements MigrationInterface {
    name = 'InitMigration1765859575559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "ref_id" character varying(50) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "ref_id"`);
    }

}
