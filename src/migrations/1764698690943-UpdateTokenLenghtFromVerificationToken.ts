import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTokenLenghtFromVerificationToken1764698690943 implements MigrationInterface {
    name = 'UpdateTokenLenghtFromVerificationToken1764698690943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b00b1be0e5a820594d7c07a3df"`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" ADD "token" character varying(100) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b00b1be0e5a820594d7c07a3df" ON "verification_tokens" ("token") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b00b1be0e5a820594d7c07a3df"`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" ADD "token" character varying(10) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b00b1be0e5a820594d7c07a3df" ON "verification_tokens" ("token") `);
    }

}
