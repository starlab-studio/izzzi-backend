import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingQuantityToSubscriptions1766529692000
  implements MigrationInterface
{
  name = "AddPendingQuantityToSubscriptions1766529692000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN "pending_quantity" integer NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN "pending_quantity"
    `);
  }
}
