import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuizTables1766015564000 implements MigrationInterface {
  name = "CreateQuizTables1766015564000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create quiz_templates table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "preview_image_url" character varying(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_templates" PRIMARY KEY ("id")
      )
    `);

    // Create quiz_template_questions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_template_questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "text" text NOT NULL,
        "type" character varying NOT NULL,
        "options" jsonb,
        "validation_rules" jsonb,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_template_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_template_questions_template_id" FOREIGN KEY ("template_id") REFERENCES "quiz_templates"("id") ON DELETE CASCADE
      )
    `);

    // Create quiz_template_pairs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_template_pairs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "description" text,
        "during_course_template_id" uuid NOT NULL,
        "after_course_template_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_template_pairs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_template_pairs_during" FOREIGN KEY ("during_course_template_id") REFERENCES "quiz_templates"("id"),
        CONSTRAINT "FK_quiz_template_pairs_after" FOREIGN KEY ("after_course_template_id") REFERENCES "quiz_templates"("id")
      )
    `);

    // Create quizzes table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quizzes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subject_id" uuid NOT NULL,
        "template_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'draft',
        "access_token" character varying(255) NOT NULL,
        "qr_code_url" character varying(500),
        "public_url" character varying(500),
        "activated_at" TIMESTAMP,
        "closed_at" TIMESTAMP,
        "response_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quizzes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_quizzes_access_token" UNIQUE ("access_token"),
        CONSTRAINT "FK_quizzes_subject_id" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_quizzes_template_id" FOREIGN KEY ("template_id") REFERENCES "quiz_templates"("id")
      )
    `);

    // Create student_quiz_tokens table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_quiz_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "class_student_id" uuid NOT NULL,
        "token" character varying(255) NOT NULL,
        "has_responded" boolean NOT NULL DEFAULT false,
        "responded_at" TIMESTAMP,
        "email_sent_at" TIMESTAMP,
        "reminder_count" integer NOT NULL DEFAULT 0,
        "last_reminder_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_quiz_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_student_quiz_tokens_token" UNIQUE ("token"),
        CONSTRAINT "UQ_student_quiz_tokens_quiz_student" UNIQUE ("quiz_id", "class_student_id"),
        CONSTRAINT "FK_student_quiz_tokens_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_student_quiz_tokens_class_student_id" FOREIGN KEY ("class_student_id") REFERENCES "class_students"("id") ON DELETE CASCADE
      )
    `);

    // Create responses table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "fingerprint" character varying(255),
        "submitted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completion_time_seconds" integer,
        "ip_address" character varying(45),
        "user_agent" text,
        "is_complete" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_responses_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE
      )
    `);

    // Create answers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "answers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "response_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "value_stars" integer,
        "value_radio" character varying(255),
        "value_checkbox" jsonb,
        "value_text" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_answers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_answers_response_id" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_answers_question_id" FOREIGN KEY ("question_id") REFERENCES "quiz_template_questions"("id")
      )
    `);

    // Create quiz_reminders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "quiz_reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "scheduled_at" TIMESTAMP NOT NULL,
        "sent_at" TIMESTAMP,
        "status" character varying NOT NULL DEFAULT 'scheduled',
        "recipient_count" integer NOT NULL DEFAULT 0,
        "success_count" integer NOT NULL DEFAULT 0,
        "failure_count" integer NOT NULL DEFAULT 0,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quiz_reminders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quiz_reminders_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_reminders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "answers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "responses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_quiz_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quizzes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_template_pairs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_template_questions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "quiz_templates"`);
  }
}
