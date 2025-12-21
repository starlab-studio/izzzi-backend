import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAiAndEmailLogTables1766015565000 implements MigrationInterface {
  name = "CreateAiAndEmailLogTables1766015565000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_analyses table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_analyses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "model" character varying(100) NOT NULL,
        "summary_text" text NOT NULL,
        "global_score" decimal(3,2),
        "sentiment" character varying,
        "alert_type" character varying NOT NULL DEFAULT 'none',
        "alert_message" text,
        "key_points" jsonb,
        "recommendations" jsonb,
        "confidence" decimal(3,2),
        "tokens_used" integer,
        "triggered_email" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_analyses_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_analyses_subject_id" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE
      )
    `);

    // Create email_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "recipient_email" character varying(255) NOT NULL,
        "recipient_user_id" uuid,
        "subject" character varying(255) NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "provider_message_id" character varying(255),
        "error_message" text,
        "metadata" jsonb,
        "sent_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_logs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_analyses_quiz_id" ON "ai_analyses" ("quiz_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_analyses_subject_id" ON "ai_analyses" ("subject_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_email_logs_recipient_email" ON "email_logs" ("recipient_email")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_email_logs_recipient_user_id" ON "email_logs" ("recipient_user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_email_logs_recipient_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_email_logs_recipient_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_analyses_subject_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_analyses_quiz_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_analyses"`);
  }
}

