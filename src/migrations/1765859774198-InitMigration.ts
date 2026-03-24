import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1765859774198 implements MigrationInterface {
    name = 'InitMigration1765859774198'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "id" uuid NOT NULL DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id")`);
    }

}
