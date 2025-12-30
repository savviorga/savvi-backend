import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1759125617618 implements MigrationInterface {
    name = 'InitMigration1759125617618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "date" date NOT NULL, "type" character varying(50) NOT NULL, "amount" numeric(12,2) NOT NULL, "category" character varying(100) NOT NULL, "account" character varying(100) NOT NULL, "description" text, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "transactions"`);
    }

}
