import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationsModel1763042348423 implements MigrationInterface {
  name = "AddNotificationsModel1763042348423";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "sender" character varying(65) NOT NULL, "mode" character varying(65) NOT NULL, "name" character varying(65), "target" character varying(65) NOT NULL, "subject" character varying(255), "template" text, "message" character varying(1000), "status" character varying(65) NOT NULL DEFAULT 'pending', "retryCount" integer NOT NULL, "delivered_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
