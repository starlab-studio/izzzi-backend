import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassStudentsTable1766015562000
  implements MigrationInterface
{
  name = "CreateClassStudentsTable1766015562000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create class_students table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "class_students" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "class_id" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_class_students" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_class_students_class_email" UNIQUE ("class_id", "email")
      )
    `);

    // Create index on class_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_class_students_class_id" ON "class_students" ("class_id")
    `);

    // Migrate data from classes.student_emails (JSONB) to class_students
    await queryRunner.query(`
      INSERT INTO "class_students" ("id", "class_id", "email", "is_active", "created_at", "updated_at")
      SELECT 
        uuid_generate_v4() as "id",
        c."id" as "class_id",
        jsonb_array_elements_text(c."student_emails")::text as "email",
        true as "is_active",
        COALESCE(c."created_at", now()) as "created_at",
        COALESCE(c."updated_at", now()) as "updated_at"
      FROM "classes" c
      WHERE c."student_emails" IS NOT NULL 
        AND jsonb_array_length(c."student_emails") > 0
      ON CONFLICT ("class_id", "email") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_class_students_class_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "class_students"`);
  }
}
