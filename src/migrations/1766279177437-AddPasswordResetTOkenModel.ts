import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetTOkenModel1766279177437
  implements MigrationInterface
{
  name = "AddPasswordResetTOkenModel1766279177437";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" character varying(255) NOT NULL, "userId" character varying(255) NOT NULL, "tokenHash" character varying(64) NOT NULL, "email" character varying(255) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "usedAt" TIMESTAMP, "ipAddress" character varying(50), "userAgent" text, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_token_user_id" ON "password_reset_tokens" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_token_hash" ON "password_reset_tokens" ("tokenHash") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_token_email" ON "password_reset_tokens" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_token_expires_at" ON "password_reset_tokens" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_password_reset_token_is_used" ON "password_reset_tokens" ("isUsed") `,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "created_at" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "updated_at" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_password_reset_token_is_used"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_password_reset_token_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_password_reset_token_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_password_reset_token_hash"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_password_reset_token_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
  }
}
