import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserSubscriptionModel1766603301318
  implements MigrationInterface
{
  name = "UpdateUserSubscriptionModel1766603301318";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasPendingQuantity = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscriptions' 
            AND column_name = 'pending_quantity'
        `);

    if (hasPendingQuantity.length === 0) {
      await queryRunner.query(
        `ALTER TABLE "subscriptions" ADD "pending_quantity" integer`
      );
    }

    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'::jsonb`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."classes_status_enum" RENAME TO "classes_status_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."classes_status_enum" AS ENUM('active', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" TYPE "public"."classes_status_enum" USING "status"::"text"::"public"."classes_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'active'`
    );
    await queryRunner.query(`DROP TYPE "public"."classes_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."classes_status_enum_old" AS ENUM('active', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" TYPE "public"."classes_status_enum_old" USING "status"::"text"::"public"."classes_status_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'active'`
    );
    await queryRunner.query(`DROP TYPE "public"."classes_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."classes_status_enum_old" RENAME TO "classes_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "pending_quantity"`
    );
  }
}
