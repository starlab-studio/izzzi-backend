import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClassTable1765068372989 implements MigrationInterface {
  name = "UpdateClassTable1765068372989";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const classTableExists = (await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'class'
            )
        `)) as Array<{ exists: boolean }>;

    const classesTableExists = (await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'classes'
            )
        `)) as Array<{ exists: boolean }>;

    if (classTableExists[0]?.exists && !classesTableExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE "class" RENAME TO "classes"`);

      await queryRunner.query(
        `ALTER TABLE "classes" RENAME CONSTRAINT "UQ_class_code" TO "UQ_classes_code"`,
      );
      await queryRunner.query(
        `ALTER TABLE "classes" RENAME CONSTRAINT "PK_class" TO "PK_classes"`,
      );
    } else if (!classTableExists[0]?.exists && !classesTableExists[0]?.exists) {
      await queryRunner.query(
        `CREATE TABLE "classes" ("id" uuid NOT NULL, "name" character varying(255) NOT NULL, "code" character varying(100) NOT NULL, "description" text, "number_of_students" integer NOT NULL, "student_emails" jsonb NOT NULL DEFAULT '[]'::jsonb, "access_token" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP, "updated_at" TIMESTAMP, CONSTRAINT "UQ_cf7491878e0fca8599438629988" UNIQUE ("code"), CONSTRAINT "PK_e207aa15404e9b2ce35910f9f7f" PRIMARY KEY ("id"))`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const classesTableExists = (await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'classes'
            )
        `)) as Array<{ exists: boolean }>;

    if (classesTableExists[0]?.exists) {
      await queryRunner.query(`ALTER TABLE "classes" RENAME TO "class"`);
      await queryRunner.query(
        `ALTER TABLE "class" RENAME CONSTRAINT "UQ_classes_code" TO "UQ_class_code"`,
      );
      await queryRunner.query(
        `ALTER TABLE "class" RENAME CONSTRAINT "PK_classes" TO "PK_class"`,
      );
    }
  }
}
