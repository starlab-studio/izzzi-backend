import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameAndPasswordToAuthIdenties1762103038701 implements MigrationInterface {
    name = 'AddUsernameAndPasswordToAuthIdenties1762103038701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_identities" ADD "username" character varying`);
        await queryRunner.query(`ALTER TABLE "auth_identities" ADD "password" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e7dee09f55cd4323549a858a8d" ON "auth_identities" ("provider", "username") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e7dee09f55cd4323549a858a8d"`);
        await queryRunner.query(`ALTER TABLE "auth_identities" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "auth_identities" DROP COLUMN "username"`);
    }

}
