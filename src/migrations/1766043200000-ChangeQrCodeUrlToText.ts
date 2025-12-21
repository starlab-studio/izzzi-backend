import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeQrCodeUrlToText1766043200000 implements MigrationInterface {
  name = "ChangeQrCodeUrlToText1766043200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change qr_code_url column from varchar(500) to text to support data URLs
    await queryRunner.query(`
      ALTER TABLE "quizzes" 
      ALTER COLUMN "qr_code_url" TYPE text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to varchar(500)
    await queryRunner.query(`
      ALTER TABLE "quizzes" 
      ALTER COLUMN "qr_code_url" TYPE character varying(500);
    `);
  }
}

