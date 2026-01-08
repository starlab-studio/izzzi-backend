import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerificationTokenModel1764698178815
  implements MigrationInterface
{
  name = "AddVerificationTokenModel1764698178815";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."verification_tokens_type_enum" AS ENUM('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'TWO_FACTOR_AUTH', 'MAGIC_LINK')`,
    );
    await queryRunner.query(
      `CREATE TABLE "verification_tokens" ("id" uuid NOT NULL, "email" character varying(255) NOT NULL, "token" character varying(10) NOT NULL, "type" "public"."verification_tokens_type_enum" NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "used_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_f2d4d7a2aa57ef199e61567db22" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fbfe417685621eaf16df51c418" ON "verification_tokens" ("email", "type") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b00b1be0e5a820594d7c07a3df" ON "verification_tokens" ("token") `,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ADD "failed_login_attempts" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ADD "last_failed_login_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ADD "locked_until" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ADD "is_locked" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ADD "is_email_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ADD "email_verified_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "UQ_9b7ca6d30b94fef571cff876884" UNIQUE ("name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ALTER COLUMN "created_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ALTER COLUMN "updated_at" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ALTER COLUMN "updated_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ALTER COLUMN "created_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT "UQ_9b7ca6d30b94fef571cff876884"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" DROP COLUMN "email_verified_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" DROP COLUMN "is_email_verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" DROP COLUMN "is_locked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" DROP COLUMN "locked_until"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" DROP COLUMN "last_failed_login_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identities" DROP COLUMN "failed_login_attempts"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b00b1be0e5a820594d7c07a3df"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fbfe417685621eaf16df51c418"`,
    );
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
    await queryRunner.query(
      `DROP TYPE "public"."verification_tokens_type_enum"`,
    );
  }
}
