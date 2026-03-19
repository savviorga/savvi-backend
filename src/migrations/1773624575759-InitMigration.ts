import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1773624575759 implements MigrationInterface {
    name = 'InitMigration1773624575759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure all unqualified table names are created in the expected schema.
        await queryRunner.query(`SET search_path TO finance, public`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "transactions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "date" date NOT NULL, "type" character varying(50) NOT NULL, "amount" numeric(12,2) NOT NULL, "category" character varying(100) NOT NULL, "account" character varying(100) NOT NULL, "description" text, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "accounts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "icon" character varying, "color" character varying, "description" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "icon" character varying, "color" character varying, "description" text, "budgetLimit" numeric(12,2), "isActive" boolean NOT NULL DEFAULT true, "isDefault" boolean NOT NULL DEFAULT false, "type" character varying(10) NOT NULL DEFAULT 'egreso', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "parentId" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "documents" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "size" bigint NOT NULL, "bucket" character varying(255) NOT NULL, "key_s3" character varying(512) NOT NULL, "module" character varying(100) NOT NULL, "ref_id" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_9a6f051e66982b5f0318981bcaa"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_9a6f051e66982b5f0318981bcaa"`);
        await queryRunner.query(`DROP TABLE "documents"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
    }

}
