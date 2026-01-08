import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedSubscriptionPlans1766151243000 implements MigrationInterface {
  name = "SeedSubscriptionPlans1766151243000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Plan Izzzi
    const izzziPlanId = "10000000-0000-0000-0000-000000000001";
    await queryRunner.query(`
      INSERT INTO "subscription_plans" (
        "id", "name", "display_price", "price_subtext", 
        "base_price_cents", "trial_period_days", "is_free", 
        "variant", "is_active", "display_order", 
        "created_at", "updated_at"
      ) VALUES (
        '${izzziPlanId}',
        'izzzi',
        '0€',
        '/ mois',
        0,
        120,
        true,
        'default',
        true,
        1,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "pricing_tiers" (
        "id", "plan_id", "billing_period", "min_classes", 
        "max_classes", "price_per_class_cents", "created_at"
      ) VALUES (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'monthly',
        1,
        20,
        0,
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "pricing_tiers" (
        "id", "plan_id", "billing_period", "min_classes", 
        "max_classes", "price_per_class_cents", "created_at"
      ) VALUES (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'annual',
        1,
        20,
        0,
        NOW()
      )
    `);

    // Features pour Izzzi (main section)
    await queryRunner.query(`
      INSERT INTO "plan_features" (
        "id", "plan_id", "feature_text", "feature_subtext", 
        "section", "display_order", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        '4 mois d''essai illimités',
        '(matières, classes, retours)',
        'main',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Puis 5 retours visibles par matière',
        '(les autres sont enregistrés mais masqués)',
        'main',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Anonymat garanti pour tous les retours',
        NULL,
        'main',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Relance manuelle possible',
        '(bouton à cliquer)',
        'main',
        4,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Export des retours en CSV à tout moment',
        NULL,
        'main',
        5,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'QR code généré automatiquement',
        NULL,
        'main',
        6,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'IA avancée',
        '(alertes négatives & alertes positives)',
        'main',
        7,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Page de suivi des alertes',
        '(notifications, commentaires possibles)',
        'main',
        8,
        NOW()
      )
    `);

    // Features additionnelles pour Izzzi
    await queryRunner.query(`
      INSERT INTO "plan_features" (
        "id", "plan_id", "feature_text", "feature_subtext", 
        "section", "display_order", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Au-delà des 4 mois :',
        NULL,
        'additional',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Vos classes restent actives',
        NULL,
        'additional',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${izzziPlanId}',
        'Les retours visibles sont limités à 5 par matière',
        NULL,
        'additional',
        3,
        NOW()
      )
    `);

    // Plan Super Izzzi
    const superIzzziPlanId = "10000000-0000-0000-0000-000000000002";
    await queryRunner.query(`
      INSERT INTO "subscription_plans" (
        "id", "name", "display_price", "price_subtext", 
        "base_price_cents", "trial_period_days", "is_free", 
        "variant", "is_active", "display_order", 
        "created_at", "updated_at"
      ) VALUES (
        '${superIzzziPlanId}',
        'super-izzzi',
        '19€',
        'par mois / par classe',
        1900,
        0,
        false,
        'premium',
        true,
        2,
        NOW(),
        NOW()
      )
    `);

    // Features pour Super Izzzi (main section)
    await queryRunner.query(`
      INSERT INTO "plan_features" (
        "id", "plan_id", "feature_text", "feature_subtext", 
        "section", "display_order", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Tout ce qu''il y a dans le plan gratuit, et en plus :',
        NULL,
        'main',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Nombre de retours illimité',
        NULL,
        'main',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'IA générative pour répondre aux alertes',
        '(un mail prêt à envoyer en un clic)',
        'main',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Levée d''anonymat activable par l''étudiant',
        '(Bientôt disponible)',
        'main',
        4,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Formulaires personnalisables',
        '(Bientôt disponible)',
        'main',
        5,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Envoi automatique du formulaire',
        '(Bientôt disponible)',
        'main',
        6,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Branding personnalisé (couleurs, logo)',
        '(Au début et à la fin du cours. Bientôt disponible)',
        'main',
        7,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'Suppression du logo izzzi',
        '(Bientôt disponible)',
        'main',
        8,
        NOW()
      )
    `);

    // Pricing tiers pour Super Izzzi - Mensuel
    await queryRunner.query(`
      INSERT INTO "pricing_tiers" (
        "id", "plan_id", "billing_period", "min_classes", 
        "max_classes", "price_per_class_cents", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'monthly',
        1,
        5,
        2500,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'monthly',
        6,
        10,
        2200,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'monthly',
        11,
        15,
        2000,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'monthly',
        16,
        20,
        1700,
        NOW()
      )
    `);

    // Pricing tiers pour Super Izzzi - Annuel
    await queryRunner.query(`
      INSERT INTO "pricing_tiers" (
        "id", "plan_id", "billing_period", "min_classes", 
        "max_classes", "price_per_class_cents", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'annual',
        1,
        5,
        1900,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'annual',
        6,
        10,
        1700,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'annual',
        11,
        15,
        1500,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${superIzzziPlanId}',
        'annual',
        16,
        20,
        1300,
        NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete pricing tiers first
    await queryRunner.query(`
      DELETE FROM "pricing_tiers" 
      WHERE "plan_id" IN (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002'
      )
    `);

    // Delete plan features
    await queryRunner.query(`
      DELETE FROM "plan_features" 
      WHERE "plan_id" IN (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002'
      )
    `);

    // Delete subscription plans
    await queryRunner.query(`
      DELETE FROM "subscription_plans" 
      WHERE "id" IN (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000002'
      )
    `);
  }
}
