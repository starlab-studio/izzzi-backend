import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubjectAssignments1765035015480 implements MigrationInterface {
    name = 'AddSubjectAssignments1765035015480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subject_assignments" ("subject_id" uuid NOT NULL, "class_id" uuid NOT NULL, "order_index" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_659f93c02601202ace2234767ea" PRIMARY KEY ("subject_id", "class_id"))`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD COLUMN "created_by" uuid`);
        await queryRunner.query(`UPDATE "subjects" SET "created_by" = "user_id" WHERE "created_by" IS NULL AND "user_id" IS NOT NULL`);
        await queryRunner.query(`UPDATE "subjects" s SET "created_by" = o."owner_id" FROM "organizations" o WHERE s."organization_id" = o."id" AND s."created_by" IS NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_at" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "updated_at" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "subjects" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "subjects" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`DROP TABLE "subject_assignments"`);
    }

}
