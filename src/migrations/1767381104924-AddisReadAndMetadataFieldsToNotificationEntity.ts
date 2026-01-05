import { MigrationInterface, QueryRunner } from "typeorm";

export class AddisReadAndMetadataFieldsToNotificationEntity1767381104924
  implements MigrationInterface
{
  name = "AddisReadAndMetadataFieldsToNotificationEntity1767381104924";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "is_read" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "notifications" ADD "metadata" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "metadata"`
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "is_read"`
    );
  }
}
