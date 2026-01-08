import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContactRequestsTable1735869600000
  implements MigrationInterface
{
  name = "CreateContactRequestsTable1735869600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "contact_request_status_enum" AS ENUM (
        'pending',
        'in_progress',
        'resolved',
        'archived'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "contact_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(20),
        "organization_name" varchar(255),
        "number_of_classes" int,
        "message" text NOT NULL,
        "status" "contact_request_status_enum" NOT NULL DEFAULT 'pending',
        "notes" text,
        "processed_by" uuid,
        "processed_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_requests" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_contact_requests_status" ON "contact_requests" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_contact_requests_created_at" ON "contact_requests" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_contact_requests_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_contact_requests_status"`);
    await queryRunner.query(`DROP TABLE "contact_requests"`);
    await queryRunner.query(`DROP TYPE "contact_request_status_enum"`);
  }
}
