import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeedbackAlertAndAlertCommentTable1767357363171
  implements MigrationInterface
{
  name = "AddFeedbackAlertAndAlertCommentTable1767357363171";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "feedback_alerts" ("id" uuid NOT NULL, "alert_id" character varying(255) NOT NULL, "subject_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "is_processed" boolean NOT NULL DEFAULT false, "processed_by_user_id" uuid, "processed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_527e991e055d0f77473aa89f4ed" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0fa529d1fa08b4341623363cf4" ON "feedback_alerts" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2018771ad118aa03d72fd4fe1" ON "feedback_alerts" ("subject_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_651692c658b35d293d9f205c0d" ON "feedback_alerts" ("alert_id", "subject_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_comments" ("id" uuid NOT NULL, "alert_id" character varying(255) NOT NULL, "subject_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, "comment" text NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_d268cdf56821f36b69a3d8ae6d0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80f03503387a4dff7bbb07df12" ON "alert_comments" ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b246c1681af59ca0ad53daf22" ON "alert_comments" ("subject_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20c27113cb2b0cfe81765da593" ON "alert_comments" ("alert_id", "subject_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."classes_status_enum" RENAME TO "classes_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."classes_status_enum" AS ENUM('active', 'archived')`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" TYPE "public"."classes_status_enum" USING "status"::"text"::"public"."classes_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."classes_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."classes_status_enum_old" AS ENUM('active', 'archived')`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" TYPE "public"."classes_status_enum_old" USING "status"::"text"::"public"."classes_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."classes_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."classes_status_enum_old" RENAME TO "classes_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20c27113cb2b0cfe81765da593"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b246c1681af59ca0ad53daf22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80f03503387a4dff7bbb07df12"`,
    );
    await queryRunner.query(`DROP TABLE "alert_comments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_651692c658b35d293d9f205c0d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2018771ad118aa03d72fd4fe1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0fa529d1fa08b4341623363cf4"`,
    );
    await queryRunner.query(`DROP TABLE "feedback_alerts"`);
  }
}
