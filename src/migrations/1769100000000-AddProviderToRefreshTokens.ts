import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProviderToRefreshTokens1769100000000
  implements MigrationInterface
{
  name = "AddProviderToRefreshTokens1769100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "provider" character varying(45)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "provider"`
    );
  }
}
