import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveColorAndDescriptionFromSubjects1766027436197 implements MigrationInterface {
  name = "RemoveColorAndDescriptionFromSubjects1766027436197";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove color column (it has NOT NULL constraint, so we need to handle existing data first)
    // Set a default value for existing rows if any
    await queryRunner.query(`
      UPDATE "subjects" 
      SET "color" = '#000000' 
      WHERE "color" IS NULL;
    `);
    
    // Now we can drop the column
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "color"`);
    
    // Remove description column (it's nullable, so we can drop it directly)
    await queryRunner.query(`ALTER TABLE "subjects" DROP COLUMN IF EXISTS "description"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add description column
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN "description" text;
    `);
    
    // Re-add color column with NOT NULL constraint
    await queryRunner.query(`
      ALTER TABLE "subjects" 
      ADD COLUMN "color" character varying(7) NOT NULL DEFAULT '#000000';
    `);
  }
}
