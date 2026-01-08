import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFaqTables1766503858535 implements MigrationInterface {
  name = "CreateFaqTables1766503858535";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "faq_tabs" ("id" SERIAL NOT NULL, "label_tab" character varying(255) NOT NULL, "order_index" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_b3f4860332d05cf32ddc529f641" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "faq_items" ("id" SERIAL NOT NULL, "question" text NOT NULL, "answer_paragraph" text NOT NULL, "answer_list" text, "views" integer NOT NULL DEFAULT '0', "is_featured" boolean NOT NULL DEFAULT false, "order_index" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "faq_category_id" integer NOT NULL, CONSTRAINT "PK_72fbce3e53149fa821abbf674ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "faq_categories" ("id" SERIAL NOT NULL, "label_category" character varying(255) NOT NULL, "order_index" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "faq_tab_id" integer NOT NULL, CONSTRAINT "PK_c3a7f838a99baed5cbcbc5372db" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "faq_categories"`);
    await queryRunner.query(`DROP TABLE "faq_items"`);
    await queryRunner.query(`DROP TABLE "faq_tabs"`);
  }
}
