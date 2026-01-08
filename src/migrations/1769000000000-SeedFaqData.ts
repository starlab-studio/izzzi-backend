import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedFaqData1769000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Main Tab
    await queryRunner.query(`
      INSERT INTO "faq_tabs" ("label_tab", "order_index", "is_active", "created_at", "updated_at")
      VALUES ('Aide', 1, true, NOW(), NOW());
    `);

    // Get Tab ID
    const tabs = (await queryRunner.query(
      `SELECT id FROM "faq_tabs" WHERE "label_tab" = 'Aide' LIMIT 1`,
    )) as Array<{ id: string }>;
    const tabId = tabs[0]?.id;
    if (!tabId) {
      throw new Error("Tab 'Aide' not found");
    }

    const categories = [
      {
        label: "Questions fréquentes",
        order: 1,
        items: [
          {
            question: "À quoi sert izzzi ?",
            answer:
              "Izzzi permet de collecter les retours des étudiants en temps réel pour améliorer l'enseignement.",
          },
          {
            question:
              'Quelle est la différence entre une "matière" et une "classe" ?',
            answer: {
              paragraph: "Voici la différence :",
              list: [
                "Une classe correspond à un groupe d'étudiants.",
                "Une matière est un enseignement, associé à un intervenant. Une même classe peut regrouper plusieurs matières.",
              ],
            },
          },
          {
            question: "Que peut-on faire avec les retours ?",
            answer: {
              paragraph:
                "Tous les retours sont centralisés dans un dashboard clair et interactif. Vous pouvez :",
              list: [
                "les filtrer par matière ou type de réponse",
                "les exporter en un clic",
                "générer un QR code pour faciliter l'accès au formulaire",
                "relancer les étudiants depuis la plateforme",
                "recevoir des alertes automatiques en cas de signaux faibles (positifs ou négatifs) dans les retours",
              ],
            },
          },
          {
            question: "Les retours sont-ils vraiment anonymes ?",
            answer:
              "Oui. Par défaut, tous les retours sont anonymes. Dans l'offre Super Izzzi, l'étudiant peut toutefois choisir de lever l'anonymat s'il le souhaite pour un message.",
          },
        ],
      },
      {
        label: "Usage",
        order: 2,
        items: [
          {
            question: "Comment créer un nouveau cours ?",
            answer:
              "Pour créer un nouveau cours, rendez-vous dans votre dashboard et cliquez sur 'Nouveau cours'. Vous pourrez ensuite configurer les paramètres et inviter vos étudiants.",
          },
          {
            question: "Comment partager un questionnaire avec mes étudiants ?",
            answer:
              "Une fois votre cours créé, vous pouvez générer un QR code ou un lien de partage directement depuis votre dashboard. Les étudiants peuvent scanner le QR code ou cliquer sur le lien pour accéder au questionnaire.",
          },
          {
            question: "Puis-je utiliser izzzi pendant le cours ?",
            answer:
              "Oui, izzzi est conçu pour être utilisé en temps réel pendant vos cours. Les étudiants peuvent donner leurs retours instantanément, et vous pouvez voir les résultats en direct.",
          },
        ],
      },
      {
        label: "Fonctionnalités",
        order: 3,
        items: [
          {
            question: "Quelles sont les fonctionnalités du dashboard ?",
            answer: {
              paragraph: "Le dashboard vous permet de :",
              list: [
                "Visualiser tous vos retours en temps réel",
                "Filtrer par matière, classe ou période",
                "Exporter les données en PDF ou Excel",
                "Générer des QR codes pour vos questionnaires",
                "Recevoir des alertes automatiques",
              ],
            },
          },
          {
            question: "Comment fonctionnent les alertes automatiques ?",
            answer:
              "Les alertes se déclenchent automatiquement quand izzzi détecte des signaux faibles dans les retours (positifs ou négatifs). Vous recevez une notification par email pour vous permettre d'agir rapidement.",
          },
          {
            question: "Puis-je personnaliser les questionnaires ?",
            answer:
              "Actuellement, les questionnaires sont standardisés pour garantir une cohérence dans l'analyse. La personnalisation des questionnaires est prévue dans une prochaine mise à jour.",
          },
        ],
      },
      {
        label: "Données & confidentialité",
        order: 4,
        items: [
          {
            question: "Les retours sont-ils vraiment anonymes ?",
            answer:
              "Oui. Par défaut, tous les retours sont anonymes. Dans l'offre Super Izzzi, l'étudiant peut toutefois choisir de lever l'anonymat s'il le souhaite pour un message.",
          },
          {
            question: "Comment sont stockées mes données ?",
            answer:
              "Vos données sont stockées de manière sécurisée sur des serveurs européens conformes au RGPD. Nous ne partageons jamais vos données avec des tiers sans votre consentement explicite.",
          },
          {
            question: "Puis-je supprimer mes données ?",
            answer:
              "Oui, vous pouvez demander la suppression de vos données à tout moment en contactant notre équipe. Nous nous engageons à traiter votre demande dans les plus brefs délais.",
          },
        ],
      },
      {
        label: "Gestion administrative",
        order: 5,
        items: [
          {
            question: "Comment gérer les accès de mon équipe ?",
            answer:
              "En tant qu'administrateur, vous pouvez inviter des membres de votre équipe et définir leurs permissions. Chaque membre peut avoir des droits différents selon son rôle.",
          },
          {
            question: "Comment facturer l'utilisation de izzzi ?",
            answer:
              "La facturation se fait selon le nombre d'utilisateurs actifs et de questionnaires envoyés. Vous pouvez consulter votre consommation en temps réel dans votre espace administrateur.",
          },
          {
            question: "Puis-je intégrer izzzi avec mon LMS existant ?",
            answer:
              "Oui, izzzi propose des intégrations avec les principaux LMS (Moodle, Canvas, etc.). Contactez notre équipe pour configurer l'intégration selon vos besoins.",
          },
        ],
      },
    ];

    for (const cat of categories) {
      // Insert Category
      await queryRunner.query(
        `
        INSERT INTO "faq_categories" ("label_category", "order_index", "is_active", "created_at", "updated_at", "faq_tab_id")
        VALUES ($1, $2, true, NOW(), NOW(), $3)
      `,
        [cat.label, cat.order, tabId],
      );

      // Get Category ID
      const savedCats = (await queryRunner.query(
        `SELECT id FROM "faq_categories" WHERE "label_category" = $1 AND "faq_tab_id" = $2`,
        [cat.label, tabId],
      )) as Array<{ id: string }>;
      const catId = savedCats[0]?.id;
      if (!catId) {
        throw new Error(`Category '${cat.label}' not found`);
      }

      // Insert Items
      let itemIndex = 0;
      for (const item of cat.items) {
        itemIndex++;
        let answerParagraph = "";
        let answerList: string | null = null;

        if (typeof item.answer === "string") {
          answerParagraph = item.answer;
        } else {
          answerParagraph = item.answer.paragraph;
          answerList = JSON.stringify(item.answer.list);
        }

        await queryRunner.query(
          `
           INSERT INTO "faq_items" ("question", "answer_paragraph", "answer_list", "views", "is_featured", "order_index", "is_active", "created_at", "updated_at", "faq_category_id")
           VALUES ($1, $2, $3, 0, false, $4, true, NOW(), NOW(), $5)
         `,
          [item.question, answerParagraph, answerList, itemIndex, catId],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "faq_items"`);
    await queryRunner.query(`DELETE FROM "faq_categories"`);
    await queryRunner.query(
      `DELETE FROM "faq_tabs" WHERE "label_tab" = 'Aide'`,
    );
  }
}
