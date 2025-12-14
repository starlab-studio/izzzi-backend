import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleFieldToUserModel1765729270474 implements MigrationInterface {
    name = 'AddRoleFieldToUserModel1765729270474'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'PLATFORM_ADMIN')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
