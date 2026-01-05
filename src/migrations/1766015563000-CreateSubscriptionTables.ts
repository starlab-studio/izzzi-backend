import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionTables1766015563000
  implements MigrationInterface
{
  name = "CreateSubscriptionTables1766015563000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_plans table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "display_price" character varying(50) NOT NULL,
        "price_subtext" character varying(100),
        "base_price_cents" integer NOT NULL DEFAULT 0,
        "trial_period_days" integer NOT NULL DEFAULT 0,
        "is_free" boolean NOT NULL DEFAULT false,
        "variant" character varying NOT NULL DEFAULT 'default',
        "is_active" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscription_plans" PRIMARY KEY ("id")
      )
    `);

    // Create plan_features table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plan_features" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "feature_text" character varying(500) NOT NULL,
        "feature_subtext" character varying(500),
        "section" character varying NOT NULL DEFAULT 'main',
        "display_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan_features" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plan_features_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE
      )
    `);

    // Create pricing_tiers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pricing_tiers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plan_id" uuid NOT NULL,
        "billing_period" character varying NOT NULL,
        "min_classes" integer NOT NULL,
        "max_classes" integer NOT NULL,
        "price_per_class_cents" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pricing_tiers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_pricing_tiers_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE
      )
    `);

    // Create subscriptions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "plan_id" uuid NOT NULL,
        "billing_period" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'trial',
        "trial_start_date" TIMESTAMP,
        "trial_end_date" TIMESTAMP,
        "current_period_start" TIMESTAMP,
        "current_period_end" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        "stripe_subscription_id" character varying(255),
        "stripe_customer_id" character varying(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id")
      )
    `);

    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        "subscription_id" uuid,
        "stripe_invoice_id" character varying(255) NOT NULL,
        "stripe_customer_id" character varying(255) NOT NULL,
        "invoice_number" character varying(100),
        "amount_cents" integer NOT NULL,
        "tax_cents" integer NOT NULL DEFAULT 0,
        "currency" character varying(3) NOT NULL DEFAULT 'EUR',
        "status" character varying NOT NULL,
        "pdf_url" character varying(500),
        "hosted_invoice_url" character varying(500),
        "issued_at" TIMESTAMP,
        "paid_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invoices_stripe_invoice_id" UNIQUE ("stripe_invoice_id"),
        CONSTRAINT "FK_invoices_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pricing_tiers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plan_features"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plans"`);
  }
}
