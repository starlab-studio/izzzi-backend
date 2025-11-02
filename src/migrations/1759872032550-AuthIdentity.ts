import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthIdentity1759872032550 implements MigrationInterface {
    name = 'AuthIdentity1759872032550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth_identity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying NOT NULL, "provider_user_id" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_3eeca3f18e671626194e553eb89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "auth_identity" ADD CONSTRAINT "FK_2325ca218e23aa2ef1acf60187e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_identity" DROP CONSTRAINT "FK_2325ca218e23aa2ef1acf60187e"`);
        await queryRunner.query(`DROP TABLE "auth_identity"`);
    }

}
