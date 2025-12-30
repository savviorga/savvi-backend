import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1765858404352 implements MigrationInterface {
    name = 'InitMigration1765858404352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "size" bigint NOT NULL, "bucket" character varying(255) NOT NULL, "key_s3" character varying(512) NOT NULL, "module" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "documents"`);
    }

}
