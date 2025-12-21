import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInstructorFieldsToSubjects1766015561000 implements MigrationInterface {
  name = "AddInstructorFieldsToSubjects1766015561000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add instructor_name column
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN IF NOT EXISTS "instructor_name" character varying(255) NULL;
    `);

    // Add instructor_email column
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN IF NOT EXISTS "instructor_email" character varying(255) NULL;
    `);

    // Add first_course_date column
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN IF NOT EXISTS "first_course_date" DATE NULL;
    `);

    // Add last_course_date column
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN IF NOT EXISTS "last_course_date" DATE NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "last_course_date"`);
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "first_course_date"`);
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "instructor_email"`);
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "instructor_name"`);
  }
}

