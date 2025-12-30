import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1764824271452 implements MigrationInterface {
    name = 'InitMigration1764824271452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "files" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "files"`);
    }

}
