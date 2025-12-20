import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenModel1766272237033 implements MigrationInterface {
  name = "AddRefreshTokenModel1766272237033";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" character varying(255) NOT NULL, "tokenHash" character varying(64) NOT NULL, "userId" character varying(255) NOT NULL, "deviceInfo" text, "ipAddress" character varying(50), "isRevoked" boolean NOT NULL DEFAULT false, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "revokedAt" TIMESTAMP, "lastUsedAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_token_hash" ON "refresh_tokens" ("tokenHash") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_token_user_id" ON "refresh_tokens" ("userId") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_token_revoked" ON "refresh_tokens" ("isRevoked") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_token_expires_at" ON "refresh_tokens" ("expiresAt") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_refresh_token_expires_at"`
    );
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_revoked"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_hash"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
