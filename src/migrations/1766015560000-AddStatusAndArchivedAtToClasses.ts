import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusAndArchivedAtToClasses1766015560000
  implements MigrationInterface
{
  name = "AddStatusAndArchivedAtToClasses1766015560000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for status if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "classes_status_enum" AS ENUM('active', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add status column with default value
    await queryRunner.query(`
      ALTER TABLE "classes" 
      ADD COLUMN IF NOT EXISTS "status" "classes_status_enum" NOT NULL DEFAULT 'active';
    `);

    // Add archived_at column
    await queryRunner.query(`
      ALTER TABLE "classes" 
      ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP NULL;
    `);

    // Update existing records: set status to 'archived' if is_active is false
    await queryRunner.query(`
      UPDATE "classes" 
      SET "status" = 'archived', "archived_at" = "updated_at"
      WHERE "is_active" = false AND "status" = 'active';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classes" DROP COLUMN IF EXISTS "archived_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "classes" DROP COLUMN IF EXISTS "status"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "classes_status_enum"`);
  }
}
