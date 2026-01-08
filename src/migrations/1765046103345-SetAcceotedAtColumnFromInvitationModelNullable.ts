import { MigrationInterface, QueryRunner } from "typeorm";

export class SetAcceotedAtColumnFromInvitationModelNullable1765046103345
  implements MigrationInterface
{
  name = "SetAcceotedAtColumnFromInvitationModelNullable1765046103345";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "accepted_at" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" ALTER COLUMN "accepted_at" SET NOT NULL`,
    );
  }
}
