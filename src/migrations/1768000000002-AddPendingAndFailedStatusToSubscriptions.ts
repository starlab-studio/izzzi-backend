import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingAndFailedStatusToSubscriptions1768000000002
  implements MigrationInterface
{
  name = "AddPendingAndFailedStatusToSubscriptions1768000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Renommer l'enum existant
    await queryRunner.query(`
      ALTER TYPE "public"."subscriptions_status_enum" RENAME TO "subscriptions_status_enum_old"
    `);

    // Créer le nouvel enum avec les nouvelles valeurs
    await queryRunner.query(`
      CREATE TYPE "public"."subscriptions_status_enum" AS ENUM(
        'trial', 
        'active', 
        'past_due', 
        'cancelled', 
        'expired', 
        'pending', 
        'failed'
      )
    `);

    // Modifier la colonne pour utiliser le nouvel enum
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" 
      USING "status"::"text"::"public"."subscriptions_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "status" SET DEFAULT 'trial'
    `);

    // Supprimer l'ancien enum
    await queryRunner.query(`
      DROP TYPE "public"."subscriptions_status_enum_old"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Renommer l'enum actuel
    await queryRunner.query(`
      ALTER TYPE "public"."subscriptions_status_enum" RENAME TO "subscriptions_status_enum_old"
    `);

    // Recréer l'ancien enum sans pending et failed
    await queryRunner.query(`
      CREATE TYPE "public"."subscriptions_status_enum" AS ENUM(
        'trial', 
        'active', 
        'past_due', 
        'cancelled', 
        'expired'
      )
    `);

    // Modifier la colonne pour utiliser l'ancien enum
    // Note: Les subscriptions avec status 'pending' ou 'failed' devront être mises à jour manuellement
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" 
      USING CASE 
        WHEN "status"::text IN ('pending', 'failed') THEN 'trial'::text
        ELSE "status"::text
      END::"public"."subscriptions_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ALTER COLUMN "status" SET DEFAULT 'trial'
    `);

    // Supprimer l'ancien enum
    await queryRunner.query(`
      DROP TYPE "public"."subscriptions_status_enum_old"
    `);
  }
}
