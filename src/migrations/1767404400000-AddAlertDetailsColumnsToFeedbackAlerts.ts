import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAlertDetailsColumnsToFeedbackAlerts1767404400000
  implements MigrationInterface
{
  name = "AddAlertDetailsColumnsToFeedbackAlerts1767404400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(
      `CREATE TYPE "feedback_alerts_type_enum" AS ENUM('negative', 'alert', 'positive')`
    );
    await queryRunner.query(
      `CREATE TYPE "feedback_alerts_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`
    );

    // Add new columns
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "type" "feedback_alerts_type_enum" NOT NULL DEFAULT 'alert'`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "title" character varying(255) NOT NULL DEFAULT ''`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "content" text NOT NULL DEFAULT ''`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "priority" "feedback_alerts_priority_enum" NOT NULL DEFAULT 'medium'`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "number" character varying(50) NOT NULL DEFAULT ''`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "timestamp" TIMESTAMP NOT NULL DEFAULT NOW()`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ADD "evidence" jsonb`
    );

    // Remove default values after adding columns (they were just for migration)
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ALTER COLUMN "type" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ALTER COLUMN "title" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ALTER COLUMN "content" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ALTER COLUMN "priority" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ALTER COLUMN "number" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" ALTER COLUMN "timestamp" DROP DEFAULT`
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_alerts_type" ON "feedback_alerts" ("type")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_alerts_priority" ON "feedback_alerts" ("priority")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_alerts_timestamp" ON "feedback_alerts" ("timestamp")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_feedback_alerts_subject_type" ON "feedback_alerts" ("subject_id", "type")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feedback_alerts_subject_type"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feedback_alerts_timestamp"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_feedback_alerts_priority"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_feedback_alerts_type"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "evidence"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "timestamp"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "number"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "priority"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "content"`
    );
    await queryRunner.query(
      `ALTER TABLE "feedback_alerts" DROP COLUMN "title"`
    );
    await queryRunner.query(`ALTER TABLE "feedback_alerts" DROP COLUMN "type"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "feedback_alerts_priority_enum"`);
    await queryRunner.query(`DROP TYPE "feedback_alerts_type_enum"`);
  }
}
