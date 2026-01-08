import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedQuizTemplates1767000000000 implements MigrationInterface {
  name = "SeedQuizTemplates1767000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Template 1: Basique - During Course
    const basicDuringId = "00000000-0000-0000-0000-000000000001";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${basicDuringId}',
        'during_course',
        'Basique - Pendant le cours',
        'Questionnaire court pour feedback en cours de module',
        NULL,
        true,
        1,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${basicDuringId}',
        'Comment évaluez-vous ce cours jusqu''à présent ?',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicDuringId}',
        'Le rythme du cours est :',
        'radio',
        '["Trop lent", "Adapté", "Trop rapide"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicDuringId}',
        'Quels aspects souhaiteriez-vous améliorer ?',
        'checkbox',
        '["Clarté des explications", "Exemples pratiques", "Supports de cours", "Interactivité"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicDuringId}',
        'Avez-vous des commentaires supplémentaires ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        4,
        NOW()
      )
    `);

    // Template 1: Basique - After Course
    const basicAfterId = "00000000-0000-0000-0000-000000000002";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${basicAfterId}',
        'after_course',
        'Basique - Après le cours',
        'Questionnaire complet pour évaluer l''ensemble du cours',
        NULL,
        true,
        1,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'Globalement, vous avez trouvé ce cours...',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'Le ratio théorie/pratique',
        'radio',
        '["Juste comme il faut", "J''aurai aimé plus de théorie", "J''aurai aimé plus de pratique"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'L''ambiance durant le cours était',
        'radio',
        '["sympa et cool, juste comme il faut", "un peu trop détendue à mon goût", "froide"]',
        '{"required": true}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'Le nombre d''heures',
        'radio',
        '["juste ce qu''il faut", "trop court", "trop long"]',
        '{"required": true}',
        4,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'La pertinence des infos par rapport à ce que vous imaginiez de ce cours',
        'radio',
        '["Comme je l''imaginais", "Bien au-delà", "Bien en deçà"]',
        '{"required": true}',
        5,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'Comment évaluez-vous la pédagogie de l''intervenant ?',
        'stars',
        NULL,
        '{"required": true}',
        6,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'La clarté des informations et des notions',
        'stars',
        NULL,
        '{"required": true}',
        7,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'Niveau vitesse',
        'radio',
        '["juste comme il faut", "trop rapide", "trop lente"]',
        '{"required": true}',
        8,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${basicAfterId}',
        'Avez-vous des commentaires supplémentaires ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        9,
        NOW()
      )
    `);

    // Template 2: Cours techniques - During Course
    const techDuringId = "00000000-0000-0000-0000-000000000003";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${techDuringId}',
        'during_course',
        'Cours techniques - Pendant le cours',
        'Questionnaire adapté aux cours techniques (ReactJS, HTML/CSS, Gitlab...)',
        NULL,
        true,
        2,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${techDuringId}',
        'Comment évaluez-vous la progression du cours jusqu''à présent ?',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techDuringId}',
        'Le niveau de difficulté des exercices pratiques est :',
        'radio',
        '["Trop facile", "Adapté", "Trop difficile"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techDuringId}',
        'Quels aspects techniques souhaiteriez-vous approfondir ?',
        'checkbox',
        '["Syntaxe et concepts", "Exercices pratiques", "Cas d''usage réels", "Bonnes pratiques", "Débogage"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techDuringId}',
        'Avez-vous des questions ou des points à clarifier ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        4,
        NOW()
      )
    `);

    // Template 2: Cours techniques - After Course
    const techAfterId = "00000000-0000-0000-0000-000000000004";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${techAfterId}',
        'after_course',
        'Cours techniques - Après le cours',
        'Questionnaire complet pour évaluer un cours technique',
        NULL,
        true,
        2,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${techAfterId}',
        'Globalement, vous avez trouvé ce cours technique...',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techAfterId}',
        'Le contenu technique était :',
        'radio',
        '["Trop basique", "Adapté à mon niveau", "Trop avancé"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techAfterId}',
        'Quels éléments techniques avez-vous le plus appréciés ?',
        'checkbox',
        '["Exemples de code", "Exercices pratiques", "Documentation fournie", "Projets réalisés", "Support technique"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techAfterId}',
        'Comment évaluez-vous l''expertise technique de l''intervenant ?',
        'stars',
        NULL,
        '{"required": true}',
        4,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techAfterId}',
        'L''intervenant était-il capable de répondre à vos questions techniques ?',
        'radio',
        '["Toujours", "Souvent", "Parfois", "Rarement", "Jamais"]',
        '{"required": true}',
        5,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${techAfterId}',
        'Avez-vous des suggestions pour améliorer ce cours technique ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        6,
        NOW()
      )
    `);

    // Template 3: Soft skills - During Course
    const softDuringId = "00000000-0000-0000-0000-000000000005";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${softDuringId}',
        'during_course',
        'Soft skills - Pendant le cours',
        'Questionnaire adapté aux cours de soft skills (présentation, communication...)',
        NULL,
        true,
        3,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${softDuringId}',
        'Comment évaluez-vous votre progression dans ce cours jusqu''à présent ?',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softDuringId}',
        'Le rythme des exercices pratiques est :',
        'radio',
        '["Trop lent", "Adapté", "Trop rapide"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softDuringId}',
        'Quels aspects souhaiteriez-vous améliorer ?',
        'checkbox',
        '["Techniques enseignées", "Mises en situation", "Retours personnalisés", "Support pédagogique"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softDuringId}',
        'Avez-vous des questions ou des besoins spécifiques ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        4,
        NOW()
      )
    `);

    // Template 3: Soft skills - After Course
    const softAfterId = "00000000-0000-0000-0000-000000000006";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${softAfterId}',
        'after_course',
        'Soft skills - Après le cours',
        'Questionnaire complet pour évaluer un cours de soft skills',
        NULL,
        true,
        3,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${softAfterId}',
        'Globalement, vous avez trouvé ce cours de soft skills...',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softAfterId}',
        'Le contenu du cours était :',
        'radio',
        '["Trop théorique", "Équilibré", "Trop pratique"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softAfterId}',
        'Quels éléments avez-vous le plus appréciés ?',
        'checkbox',
        '["Mises en situation", "Retours personnalisés", "Conseils pratiques", "Support pédagogique", "Exemples concrets"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softAfterId}',
        'Comment évaluez-vous la capacité de l''intervenant à transmettre les compétences ?',
        'stars',
        NULL,
        '{"required": true}',
        4,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softAfterId}',
        'L''intervenant était-il à l''écoute de vos besoins ?',
        'radio',
        '["Toujours", "Souvent", "Parfois", "Rarement", "Jamais"]',
        '{"required": true}',
        5,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softAfterId}',
        'Avez-vous des commentaires ou suggestions ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        6,
        NOW()
      )
    `);

    // Template 4: Cours logiciel - During Course
    const softwareDuringId = "00000000-0000-0000-0000-000000000007";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${softwareDuringId}',
        'during_course',
        'Cours logiciel - Pendant le cours',
        'Questionnaire adapté aux cours logiciel (Figma, Webflow, Hubspot...)',
        NULL,
        true,
        4,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${softwareDuringId}',
        'Comment évaluez-vous votre maîtrise de l''outil jusqu''à présent ?',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareDuringId}',
        'La progression dans l''apprentissage de l''outil est :',
        'radio',
        '["Trop lente", "Adaptée", "Trop rapide"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareDuringId}',
        'Quels aspects de l''outil souhaiteriez-vous approfondir ?',
        'checkbox',
        '["Fonctionnalités de base", "Fonctionnalités avancées", "Astuces et raccourcis", "Intégrations", "Bonnes pratiques"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareDuringId}',
        'Avez-vous des questions sur l''utilisation de l''outil ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        4,
        NOW()
      )
    `);

    // Template 4: Cours logiciel - After Course
    const softwareAfterId = "00000000-0000-0000-0000-000000000008";
    await queryRunner.query(`
      INSERT INTO "quiz_templates" (
        "id", "type", "name", "description", "preview_image_url", 
        "is_active", "display_order", "created_at", "updated_at"
      ) VALUES (
        '${softwareAfterId}',
        'after_course',
        'Cours logiciel - Après le cours',
        'Questionnaire complet pour évaluer un cours logiciel',
        NULL,
        true,
        4,
        NOW(),
        NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "quiz_template_questions" (
        "id", "template_id", "text", "type", "options", 
        "validation_rules", "order_index", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        '${softwareAfterId}',
        'Globalement, vous avez trouvé ce cours logiciel...',
        'stars',
        NULL,
        '{"required": true}',
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareAfterId}',
        'Le niveau de maîtrise de l''outil atteint est :',
        'radio',
        '["Débutant", "Intermédiaire", "Avancé"]',
        '{"required": true}',
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareAfterId}',
        'Quels éléments du cours avez-vous le plus appréciés ?',
        'checkbox',
        '["Démonstrations pratiques", "Exercices guidés", "Ressources fournies", "Support technique", "Projets réalisés"]',
        '{"required": false}',
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareAfterId}',
        'Comment évaluez-vous l''expertise de l''intervenant sur l''outil ?',
        'stars',
        NULL,
        '{"required": true}',
        4,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareAfterId}',
        'L''intervenant était-il capable de vous aider en cas de difficulté avec l''outil ?',
        'radio',
        '["Toujours", "Souvent", "Parfois", "Rarement", "Jamais"]',
        '{"required": true}',
        5,
        NOW()
      ),
      (
        uuid_generate_v4(),
        '${softwareAfterId}',
        'Avez-vous des suggestions pour améliorer ce cours logiciel ?',
        'textarea',
        NULL,
        '{"required": false, "min_length": 0, "max_length": 1000}',
        6,
        NOW()
      )
    `);

    // Create template pairs
    await queryRunner.query(`
      INSERT INTO "quiz_template_pairs" (
        "id", "name", "description", "during_course_template_id", 
        "after_course_template_id", "is_active", "display_order", "created_at"
      ) VALUES
      (
        uuid_generate_v4(),
        'Basique',
        'Adapté à tous les cours',
        '${basicDuringId}',
        '${basicAfterId}',
        true,
        1,
        NOW()
      ),
      (
        uuid_generate_v4(),
        'Adapté aux cours techniques',
        'Ex : ReactJS, HTML/CSS, Gitlab ...',
        '${techDuringId}',
        '${techAfterId}',
        true,
        2,
        NOW()
      ),
      (
        uuid_generate_v4(),
        'Adapté aux soft skills',
        'Ex : Améliorer ses compétences de présentation ...',
        '${softDuringId}',
        '${softAfterId}',
        true,
        3,
        NOW()
      ),
      (
        uuid_generate_v4(),
        'Adapté aux cours logiciel',
        'Ex : Figma, Webflow, Hubspot ...',
        '${softwareDuringId}',
        '${softwareAfterId}',
        true,
        4,
        NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete template pairs first (due to foreign keys)
    await queryRunner.query(`
      DELETE FROM "quiz_template_pairs" 
      WHERE "during_course_template_id" IN (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000008'
      ) OR "after_course_template_id" IN (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000008'
      )
    `);

    // Delete questions
    await queryRunner.query(`
      DELETE FROM "quiz_template_questions" 
      WHERE "template_id" IN (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000008'
      )
    `);

    // Delete templates
    await queryRunner.query(`
      DELETE FROM "quiz_templates" 
      WHERE "id" IN (
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000008'
      )
    `);
  }
}
