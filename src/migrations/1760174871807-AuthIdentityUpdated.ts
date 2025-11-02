import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthIdentityUpdated1760174871807 implements MigrationInterface {
  name = "AuthIdentityUpdated1760174871807";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_identity" DROP CONSTRAINT "FK_2325ca218e23aa2ef1acf60187e"`
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identity" RENAME COLUMN "userId" TO "user_id"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "auth_identity" RENAME COLUMN "user_id" TO "userId"`
    );
    await queryRunner.query(
      `ALTER TABLE "auth_identity" ADD CONSTRAINT "FK_2325ca218e23aa2ef1acf60187e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
