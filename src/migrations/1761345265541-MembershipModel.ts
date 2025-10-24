import { MigrationInterface, QueryRunner } from "typeorm";

export class MembershipModel1761345265541 implements MigrationInterface {
    name = 'MembershipModel1761345265541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "role" character varying(45) NOT NULL, "added_by" uuid NOT NULL, CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "memberships"`);
    }

}
