import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNumberOfStudentsAndStudentEmailsToClass1764591932350 implements MigrationInterface {
  name = "AddNumberOfStudentsAndStudentEmailsToClass1764591932350";

  public async up(queryRunner: QueryRunner): Promise<void> {

    const hasNumberOfStudents = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'class' AND column_name = 'number_of_students'
    `)) as Array<{ column_name: string }>;

    const hasStudentEmails = (await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'class' AND column_name = 'student_emails'
    `)) as Array<{ column_name: string }>;

    if (!hasNumberOfStudents.length) {
      await queryRunner.query(`
        ALTER TABLE "class" 
        ADD COLUMN "number_of_students" integer NOT NULL DEFAULT 0
      `);
    }

    if (!hasStudentEmails.length) {
      await queryRunner.query(`
        ALTER TABLE "class" 
        ADD COLUMN "student_emails" jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN IF EXISTS "number_of_students"`);
    await queryRunner.query(`ALTER TABLE "class" DROP COLUMN IF EXISTS "student_emails"`);
  }
}