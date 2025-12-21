import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubjectsTable1764623568324 implements MigrationInterface {
  name = "CreateSubjectsTable1764623568324";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "description" text, "color" character varying(7) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subjects"`);
  }
}
