import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFormTypeToFeedbackAlerts1768000000003
  implements MigrationInterface
{
  name = "AddFormTypeToFeedbackAlerts1768000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for form_type
    await queryRunner.query(
      `CREATE TYPE "feedback_alerts_form_type_enum" AS ENUM('during_course', 'after_course')`
    );

    // Add form_type column (nullable initially for existing data)
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "form_type" "feedback_alerts_form_type_enum"`
    );

    // Create index for form_type
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_alerts_form_type" ON "feedback_alerts" ("form_type")`
    );

    // Create composite index for subject_id and form_type
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_alerts_subject_form_type" ON "feedback_alerts" ("subject_id", "form_type")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feedback_alerts_subject_form_type"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feedback_alerts_form_type"`
    );

    // Drop column
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "form_type"`
    );

    // Drop enum type
    await queryRunner.query(`DROP TYPE "feedback_alerts_form_type_enum"`);
  }
}
