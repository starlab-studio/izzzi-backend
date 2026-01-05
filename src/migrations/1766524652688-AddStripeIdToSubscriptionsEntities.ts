import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStripeIdToSubscriptionsEntities1766524652688
  implements MigrationInterface
{
  name = "AddStripeIdToSubscriptionsEntities1766524652688";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_subscriptions_plan_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" DROP CONSTRAINT "FK_plan_features_plan_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" DROP CONSTRAINT "FK_pricing_tiers_plan_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_subscription_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" DROP CONSTRAINT "FK_student_quiz_tokens_quiz_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" DROP CONSTRAINT "FK_student_quiz_tokens_class_student_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" DROP CONSTRAINT "FK_responses_quiz_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_quizzes_subject_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "FK_quizzes_template_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" DROP CONSTRAINT "FK_quiz_template_pairs_during"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" DROP CONSTRAINT "FK_quiz_template_pairs_after"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" DROP CONSTRAINT "FK_quiz_template_questions_template_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" DROP CONSTRAINT "FK_quiz_reminders_quiz_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_answers_response_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" DROP CONSTRAINT "FK_answers_question_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP CONSTRAINT "FK_ai_analyses_quiz_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP CONSTRAINT "FK_ai_analyses_subject_id"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_email_logs_recipient_email"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_email_logs_recipient_user_id"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_class_students_class_id"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_analyses_quiz_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ai_analyses_subject_id"`);
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" DROP CONSTRAINT "UQ_student_quiz_tokens_quiz_student"`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" DROP CONSTRAINT "UQ_class_students_class_email"`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_billing_period_enum" AS ENUM('monthly', 'annual')`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "billing_period" TYPE "public"."subscriptions_billing_period_enum" USING "billing_period"::"public"."subscriptions_billing_period_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "billing_period" SET NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('trial', 'active', 'past_due', 'cancelled', 'expired')`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'trial'`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."plan_features_section_enum" AS ENUM('main', 'additional')`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "section" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "section" TYPE "public"."plan_features_section_enum" USING "section"::"public"."plan_features_section_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "section" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "section" SET DEFAULT 'main'`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pricing_tiers_billing_period_enum" AS ENUM('monthly', 'annual')`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ALTER COLUMN "billing_period" TYPE "public"."pricing_tiers_billing_period_enum" USING "billing_period"::"public"."pricing_tiers_billing_period_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ALTER COLUMN "billing_period" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "variant"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_plans_variant_enum" AS ENUM('default', 'premium')`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "variant" "public"."subscription_plans_variant_enum" NOT NULL DEFAULT 'default'`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('draft', 'open', 'paid', 'void', 'uncollectible')`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "status" "public"."invoices_status_enum" NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ALTER COLUMN "submitted_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."quizzes_type_enum" AS ENUM('during_course', 'after_course')`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD "type" "public"."quizzes_type_enum" NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."quizzes_status_enum" AS ENUM('draft', 'active', 'closed')`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD "status" "public"."quizzes_status_enum" NOT NULL DEFAULT 'draft'`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "updated_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_templates_type_enum" AS ENUM('during_course', 'after_course')`
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quiz_templates' AND column_name = 'type'
        ) THEN
          -- Column exists, update NULL values and convert
          UPDATE "quiz_templates" SET "type" = 'during_course' WHERE "type" IS NULL;
          ALTER TABLE "quiz_templates" ALTER COLUMN "type" DROP DEFAULT;
          ALTER TABLE "quiz_templates" ALTER COLUMN "type" TYPE "public"."quiz_templates_type_enum" USING "type"::"text"::"public"."quiz_templates_type_enum";
          ALTER TABLE "quiz_templates" ALTER COLUMN "type" SET NOT NULL;
        ELSE
          -- Column doesn't exist, create it
          ALTER TABLE "quiz_templates" ADD COLUMN "type" "public"."quiz_templates_type_enum" NOT NULL DEFAULT 'during_course';
          ALTER TABLE "quiz_templates" ALTER COLUMN "type" DROP DEFAULT;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ALTER COLUMN "updated_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_template_questions_type_enum" AS ENUM('stars', 'radio', 'checkbox', 'textarea')`
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quiz_template_questions' AND column_name = 'type'
        ) THEN
          -- Column exists, update NULL values and convert
          UPDATE "quiz_template_questions" SET "type" = 'radio' WHERE "type" IS NULL;
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "type" DROP DEFAULT;
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "type" TYPE "public"."quiz_template_questions_type_enum" USING "type"::"text"::"public"."quiz_template_questions_type_enum";
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "type" SET NOT NULL;
        ELSE
          -- Column doesn't exist, create it
          ALTER TABLE "quiz_template_questions" ADD COLUMN "type" "public"."quiz_template_questions_type_enum" NOT NULL DEFAULT 'radio';
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "type" DROP DEFAULT;
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_template_questions_category_enum" AS ENUM('global', 'course', 'instructor')`
    );
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'quiz_template_questions' AND column_name = 'category'
        ) THEN
          -- Column exists, update NULL values and convert
          UPDATE "quiz_template_questions" SET "category" = 'course' WHERE "category" IS NULL;
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "category" DROP DEFAULT;
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "category" TYPE "public"."quiz_template_questions_category_enum" USING "category"::"text"::"public"."quiz_template_questions_category_enum";
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "category" SET NOT NULL;
          ALTER TABLE "quiz_template_questions" ALTER COLUMN "category" SET DEFAULT 'course';
        ELSE
          -- Column doesn't exist, create it
          ALTER TABLE "quiz_template_questions" ADD COLUMN "category" "public"."quiz_template_questions_category_enum" NOT NULL DEFAULT 'course';
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" DROP COLUMN "status"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quiz_reminders_status_enum" AS ENUM('scheduled', 'sending', 'sent', 'failed', 'cancelled')`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ADD "status" "public"."quiz_reminders_status_enum" NOT NULL DEFAULT 'scheduled'`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "email_logs" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(`ALTER TABLE "email_logs" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."email_logs_type_enum" AS ENUM('registration_confirmation', 'password_reset', 'class_created', 'class_archived', 'quiz_reminder', 'ai_alert')`
    );
    await queryRunner.query(
      `ALTER TABLE "email_logs" ADD "type" "public"."email_logs_type_enum" NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "email_logs" DROP COLUMN "status"`);
    await queryRunner.query(
      `CREATE TYPE "public"."email_logs_status_enum" AS ENUM('pending', 'sent', 'failed', 'bounced')`
    );
    await queryRunner.query(
      `ALTER TABLE "email_logs" ADD "status" "public"."email_logs_status_enum" NOT NULL DEFAULT 'pending'`
    );
    await queryRunner.query(
      `ALTER TABLE "email_logs" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'::jsonb`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."classes_status_enum" RENAME TO "classes_status_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."classes_status_enum" AS ENUM('active', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" TYPE "public"."classes_status_enum" USING "status"::"text"::"public"."classes_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'active'`
    );
    await queryRunner.query(`DROP TYPE "public"."classes_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "class_students" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ALTER COLUMN "updated_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ALTER COLUMN "id" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP COLUMN "sentiment"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_analyses_sentiment_enum" AS ENUM('positive', 'negative', 'neutral', 'mixed')`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD "sentiment" "public"."ai_analyses_sentiment_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP COLUMN "alert_type"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_analyses_alert_type_enum" AS ENUM('none', 'positive', 'negative')`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD "alert_type" "public"."ai_analyses_alert_type_enum" NOT NULL DEFAULT 'none'`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ALTER COLUMN "created_at" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "stripe_product_id" character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ADD COLUMN IF NOT EXISTS "stripe_price_id" character varying(255)`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ADD COLUMN IF NOT EXISTS "is_coming_soon" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "quantity" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0ddf8494c8665a57c670287ccd" ON "invoices" ("stripe_invoice_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fc58694383911bfe974a0dd546" ON "student_quiz_tokens" ("quiz_id", "class_student_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f59840870af609bdd27dcb2759" ON "student_quiz_tokens" ("token") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b6e28e5db6effdcd2306a4be0d" ON "responses" ("quiz_id", "fingerprint") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_230aec62d33852189398557cb7" ON "responses" ("quiz_id") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dc45722fc081ebfa5fe520d1f0" ON "quizzes" ("access_token") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3fc8420d4a27af9d5bedef232" ON "quiz_reminders" ("quiz_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_677120094cf6d3f12df0b9dc5d" ON "answers" ("question_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58449ba215a0c2b566a9dfd241" ON "answers" ("response_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_377fa6c130567ce3c8b22099e4" ON "email_logs" ("recipient_user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8772b876965dcf666c4382f9d5" ON "email_logs" ("recipient_email") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cf6c961d4c81f453413d1a8bbe" ON "class_students" ("class_id", "email") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d474f458be78e142bae14884ff" ON "ai_analyses" ("subject_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49bd925b0455175ed7604400f8" ON "ai_analyses" ("quiz_id") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49bd925b0455175ed7604400f8"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d474f458be78e142bae14884ff"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cf6c961d4c81f453413d1a8bbe"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8772b876965dcf666c4382f9d5"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_377fa6c130567ce3c8b22099e4"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_58449ba215a0c2b566a9dfd241"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_677120094cf6d3f12df0b9dc5d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3fc8420d4a27af9d5bedef232"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc45722fc081ebfa5fe520d1f0"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_230aec62d33852189398557cb7"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6e28e5db6effdcd2306a4be0d"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f59840870af609bdd27dcb2759"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc58694383911bfe974a0dd546"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ddf8494c8665a57c670287ccd"`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP COLUMN "alert_type"`
    );
    await queryRunner.query(`DROP TYPE "public"."ai_analyses_alert_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD "alert_type" character varying NOT NULL DEFAULT 'none'`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" DROP COLUMN "sentiment"`
    );
    await queryRunner.query(`DROP TYPE "public"."ai_analyses_sentiment_enum"`);
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD "sentiment" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ALTER COLUMN "updated_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."classes_status_enum_old" AS ENUM('active', 'archived')`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" TYPE "public"."classes_status_enum_old" USING "status"::"text"::"public"."classes_status_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "status" SET DEFAULT 'active'`
    );
    await queryRunner.query(`DROP TYPE "public"."classes_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."classes_status_enum_old" RENAME TO "classes_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "classes" ALTER COLUMN "student_emails" SET DEFAULT '[]'`
    );
    await queryRunner.query(
      `ALTER TABLE "email_logs" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "email_logs" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."email_logs_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "email_logs" ADD "status" character varying NOT NULL DEFAULT 'pending'`
    );
    await queryRunner.query(`ALTER TABLE "email_logs" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."email_logs_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "email_logs" ADD "type" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "email_logs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" DROP COLUMN "status"`
    );
    await queryRunner.query(`DROP TYPE "public"."quiz_reminders_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ADD "status" character varying NOT NULL DEFAULT 'scheduled'`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" DROP COLUMN "category"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."quiz_template_questions_category_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ADD "category" character varying NOT NULL DEFAULT 'course'`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" DROP COLUMN "type"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."quiz_template_questions_type_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ADD "type" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ALTER COLUMN "updated_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "quiz_templates" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."quiz_templates_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ADD "type" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_templates" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "updated_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."quizzes_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD "status" character varying NOT NULL DEFAULT 'draft'`
    );
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."quizzes_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD "type" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ALTER COLUMN "submitted_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD "status" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN "variant"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_plans_variant_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ADD "variant" character varying NOT NULL DEFAULT 'default'`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_plans" DROP COLUMN IF EXISTS "stripe_product_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" DROP COLUMN "billing_period"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."pricing_tiers_billing_period_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ADD "billing_period" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" DROP COLUMN IF EXISTS "stripe_price_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" DROP COLUMN "section"`
    );
    await queryRunner.query(`DROP TYPE "public"."plan_features_section_enum"`);
    await queryRunner.query(
      `ALTER TABLE "plan_features" ADD "section" character varying NOT NULL DEFAULT 'main'`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" DROP COLUMN IF EXISTS "is_coming_soon"`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" SET DEFAULT now()`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "created_at" SET DEFAULT now()`
    );
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "status" character varying NOT NULL DEFAULT 'trial'`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN "billing_period"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_billing_period_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD "billing_period" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "quantity"`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "class_students" ADD CONSTRAINT "UQ_class_students_class_email" UNIQUE ("class_id", "email")`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ADD CONSTRAINT "UQ_student_quiz_tokens_quiz_student" UNIQUE ("quiz_id", "class_student_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_analyses_subject_id" ON "ai_analyses" ("subject_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_analyses_quiz_id" ON "ai_analyses" ("quiz_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_class_students_class_id" ON "class_students" ("class_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_logs_recipient_user_id" ON "email_logs" ("recipient_user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_logs_recipient_email" ON "email_logs" ("recipient_email") `
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD CONSTRAINT "FK_ai_analyses_subject_id" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "ai_analyses" ADD CONSTRAINT "FK_ai_analyses_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_answers_question_id" FOREIGN KEY ("question_id") REFERENCES "quiz_template_questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "answers" ADD CONSTRAINT "FK_answers_response_id" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_reminders" ADD CONSTRAINT "FK_quiz_reminders_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_questions" ADD CONSTRAINT "FK_quiz_template_questions_template_id" FOREIGN KEY ("template_id") REFERENCES "quiz_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" ADD CONSTRAINT "FK_quiz_template_pairs_after" FOREIGN KEY ("after_course_template_id") REFERENCES "quiz_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_template_pairs" ADD CONSTRAINT "FK_quiz_template_pairs_during" FOREIGN KEY ("during_course_template_id") REFERENCES "quiz_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_quizzes_template_id" FOREIGN KEY ("template_id") REFERENCES "quiz_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "FK_quizzes_subject_id" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "responses" ADD CONSTRAINT "FK_responses_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ADD CONSTRAINT "FK_student_quiz_tokens_class_student_id" FOREIGN KEY ("class_student_id") REFERENCES "class_students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "student_quiz_tokens" ADD CONSTRAINT "FK_student_quiz_tokens_quiz_id" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "pricing_tiers" ADD CONSTRAINT "FK_pricing_tiers_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "plan_features" ADD CONSTRAINT "FK_plan_features_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
