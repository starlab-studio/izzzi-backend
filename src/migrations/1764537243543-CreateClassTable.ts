import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassTable1764000000000 implements MigrationInterface {
  name = "CreateClassTable1764537243543";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "class" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "code" character varying(100) NOT NULL,
        "number_of_students" integer NOT NULL,
        "student_emails" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "description" text,
        "access_token" character varying(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "organization_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        CONSTRAINT "UQ_class_code" UNIQUE ("code"),
        CONSTRAINT "PK_class" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "class"`);
  }
}
