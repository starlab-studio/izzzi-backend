import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingQuantityToSubscriptions1766529692000
  implements MigrationInterface
{
  name = "AddPendingQuantityToSubscriptions1766529692000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_subscriptions"
      ADD COLUMN "pending_quantity" integer NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_subscriptions"
      DROP COLUMN "pending_quantity"
    `);
  }
}
