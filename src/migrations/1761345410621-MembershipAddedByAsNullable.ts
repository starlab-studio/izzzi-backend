import { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipAddedByAsNullable1761345410621
  implements MigrationInterface
{
  name = "MembershipAddedByAsNullable1761345410621";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" ALTER COLUMN "added_by" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memberships" ALTER COLUMN "added_by" SET NOT NULL`,
    );
  }
}
