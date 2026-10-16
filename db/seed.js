// Charger les variables d'environnement depuis le fichier .env
require('dotenv').config();
// Importer le pool de connexion PostgreSQL
const db = require('./index');
// Importer bcryptjs pour le hachage sécurisé des mots de passe
const bcrypt = require('bcrypt');

async function seed() {
  try {
    console.log('Nettoyage et remplissage de la base de données...');

    // 1. REINITIALISATION DE LA BASE DE DONNEES
    // TRUNCATE vide le contenu des tables spécifiées.
    // RESTART IDENTITY : remet le compteur d'ID auto-incrémenté (SERIAL) à 1 pour chaque table.
    // CASCADE : supprime automatiquement les enregistrements liés par une clé étrangère.
    await db.query(`
      TRUNCATE TABLE applications, ads, people, categories, companies RESTART IDENTITY CASCADE;
    `);

    // 2. CREATION DES ENTREPRISES (Table 'companies')
    // RETURNING id permet de récupérer immédiatement les ID générés par PostgreSQL
    // afin de pouvoir les réutiliser comme clés étrangères ci-dessous.
    const companiesRes = await db.query(`
      INSERT INTO companies (name, description, website, city, tech_stack, tech_team_composition, tech_team_avg_age)
      VALUES 
        ('TechCorp', 'ESN spécialisée dans le cloud et les architectures web.', 'https://techcorp.fr', 'Paris', 'Node.js, PostgreSQL, React', '15 développeurs', 29),
        ('DevStudio', 'Agence de développement sur-mesure.', 'https://devstudio.io', 'Lyon', 'Vue.js, Python, Django', '8 développeurs', 32)
      RETURNING id;
    `);

    // Stockage des ID d'entreprises générés
    const companyTechCorpId = companiesRes.rows[0].id;
    const companyDevStudioId = companiesRes.rows[1].id;

    // 3. CREATION DES CATEGORIES (Table 'categories')
    const categoriesRes = await db.query(`
      INSERT INTO categories (name)
      VALUES 
        ('CDI'),
        ('CDD'),
        ('Stage'),
        ('Alternance')
      RETURNING id;
    `);

    // Stockage des ID des catégories utiles
    const catCdiId = categoriesRes.rows[0].id;   // ID pour CDI
    const catStageId = categoriesRes.rows[2].id; // ID pour Stage

    // 4. CREATION DES COMPTES UTILISATEURS (Table 'people')
    // Hachage des mots de passe avec bcrypt (10 tours de salt pour la sécurité)
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashRecruiter = await bcrypt.hash('recruiter123', 10);
    const hashUser = await bcrypt.hash('user123', 10);

    // Les symboles $1, $2, etc., sont des requêtes préparées anti-injection SQL
    const peopleRes = await db.query(`
      INSERT INTO people (
        first_name, last_name, email, phone, password_hash, role, company_id, main_stack, secondary_stack, work_mode
      )
      VALUES 
        ('Admin', 'System', 'admin@jobboard.fr', '0102030405', $1, 'admin', NULL, 'Node.js, PostgreSQL', 'Docker, Git', 'Télétravail'),
        ('Sophie', 'Martin', 'recruiter@techcorp.fr', '0601020304', $2, 'recruiter', $4, 'Management, RH', 'Sourcing', 'Hybride'),
        ('Jean', 'Dupont', 'candidat@jobboard.fr', '0611223344', $3, 'user', NULL, 'JavaScript, React', 'Node.js, Express', 'Présentiel')
      RETURNING id;
    `, [hashAdmin, hashRecruiter, hashUser, companyTechCorpId]);

    // Stockage des ID des personnes
    const recruiterId = peopleRes.rows[1].id;
    const userId = peopleRes.rows[2].id;

    // 5. CREATION DES ANNONCES (Table 'ads')
    // Utilisation des clés étrangères récupérées aux étapes précédentes (company_id, category_id, contact_id)
    const adsRes = await db.query(`
      INSERT INTO ads (
        title, short_description, full_description, location, working_time,
        salary_min, salary_max, is_active, company_id, category_id, contact_id,
        work_mode, recruitment_process, required_stack, optional_stack
      )
      VALUES 
        (
          'Développeur Node.js / Express Backend',
          'Poste CDI pour renforcer notre équipe backend',
          'Nous recherchons un développeur backend passionné par Node.js et PostgreSQL pour participer à la refonte de notre plateforme.',
          'Paris', '35h/semaine', 42000.00, 50000.00, TRUE, $1, $2, $3,
          'Hybride', '1. entretien RH, 2. test technique, 3. entretien final',
          'Node.js, Express, PostgreSQL', 'Docker, Jest'
        ),
        (
          'Stagiaire Développeur Frontend React',
          'Stage de 6 mois en développement web frontend',
          'DevStudio recherche un stagiaire motivé pour travailler sur des applications React de nos clients.',
          'Lyon', '35h/semaine', 1000.00, 1200.00, TRUE, $4, $5, NULL,
          'Présentiel', '1. entretien avec le lead dev',
          'React, JavaScript, HTML/CSS', 'TypeScript, Tailwind'
        )
      RETURNING id;
    `, [companyTechCorpId, catCdiId, recruiterId, companyDevStudioId, catStageId]);

    const ad1Id = adsRes.rows[0].id;

    // 5 bis. ANNONCES SUPPLÉMENTAIRES (pour tester la pagination, la recherche et le filtre par catégorie)
    // Au total : 54 annonces ACTIVES (2 ci-dessus + 52 ici) = 6 pages de 10, et 2 annonces
    // DÉSACTIVÉES qui ne doivent apparaître nulle part sur le site.

    // 3 entreprises de plus, pour varier les noms d'entreprise dans les annonces
    const extraCompaniesRes = await db.query(`
      INSERT INTO companies (name, description, website, city, tech_stack, tech_team_composition, tech_team_avg_age)
      VALUES
        ('NovaSoft', 'Éditeur de logiciels de gestion pour les PME.', 'https://novasoft.example', 'Strasbourg', 'Java, Angular, PostgreSQL', '20 développeurs', 31),
        ('DataPulse', 'Cabinet de conseil en data et business intelligence.', 'https://datapulse.example', 'Lille', 'Python, SQL, Power BI', '12 data analysts', 28),
        ('CyberShield', 'Société de services en cybersécurité.', 'https://cybershield.example', 'Nantes', 'Linux, SIEM, Python', '10 consultants', 30)
      RETURNING id;
    `);

    // Les entreprises utilisables dans les annonces
    const allCompanyIds = [
      companyTechCorpId,
      companyDevStudioId,
      ...extraCompaniesRes.rows.map((row) => row.id),
    ];

    // Les 4 catégories, dans l'ordre d'insertion : CDI, CDD, Stage, Alternance
    const allCategoryIds = categoriesRes.rows.map((row) => row.id);

    // Modèles de métiers : [titre, description courte, technologies demandées, technologies optionnelles]
    const jobTemplates = [
      ['Développeur Front-end React', 'Créer les interfaces de nos applications web', 'React, JavaScript, HTML/CSS', 'TypeScript, Tailwind'],
      ['Développeur Back-end Node.js', 'Concevoir et maintenir nos API REST', 'Node.js, Express, PostgreSQL', 'Docker, Jest'],
      ['Développeur Full-stack JavaScript', 'Travailler sur toute la chaîne, du front à la base de données', 'JavaScript, Node.js, React', 'MongoDB, Docker'],
      ['Développeur Python Django', 'Développer des applications web métier avec Django', 'Python, Django, PostgreSQL', 'Celery, Docker'],
      ['Ingénieur DevOps', 'Automatiser les déploiements et superviser la production', 'Docker, Linux, CI/CD', 'Kubernetes, Terraform'],
      ['Analyste SOC', 'Surveiller et analyser les alertes de sécurité', 'SIEM, Linux, Réseaux', 'Python, Splunk'],
      ['Consultant GRC cybersécurité', 'Accompagner nos clients sur la conformité et les risques', 'ISO 27001, Analyse de risques, RGPD', 'EBIOS RM'],
      ['Data Analyst', 'Transformer les données en tableaux de bord utiles', 'SQL, Python, Power BI', 'dbt, Tableau'],
      ['Développeur mobile Flutter', 'Développer notre application mobile iOS et Android', 'Flutter, Dart', 'Firebase'],
      ['UX/UI Designer', 'Concevoir des parcours simples et accessibles', 'Figma, Design system', 'Webflow'],
      ['Administrateur systèmes et réseaux', "Garantir la disponibilité de l'infrastructure", 'Linux, Réseaux, Bash', 'Ansible'],
      ['Testeur QA automatisation', 'Écrire et maintenir les tests automatisés', 'Cypress, JavaScript', 'Selenium'],
      ['Chef de projet digital', 'Piloter les projets web de la conception à la livraison', 'Gestion de projet, Agile', 'Jira'],
    ];

    const cities = ['Paris', 'Lyon', 'Strasbourg', 'Lille', 'Nantes', 'Bordeaux', 'Toulouse', 'Marseille'];
    const workModes = ['Présentiel', 'Hybride', 'Télétravail'];
    const processes = [
      '1. entretien RH, 2. entretien technique',
      '1. entretien avec le manager, 2. cas pratique, 3. entretien final',
      '1. échange téléphonique, 2. entretien avec l\'équipe',
    ];

    const DAY = 24 * 60 * 60 * 1000;
    const extraAdsCount = 54; // 52 actives + 2 désactivées

    for (let i = 0; i < extraAdsCount; i++) {
      const [jobTitle, shortDesc, required, optional] = jobTemplates[i % jobTemplates.length];
      const companyId = allCompanyIds[i % allCompanyIds.length];
      const categoryId = allCategoryIds[i % allCategoryIds.length];
      const categoryIndex = i % allCategoryIds.length; // 0 CDI, 1 CDD, 2 Stage, 3 Alternance
      const city = cities[i % cities.length];
      const workMode = workModes[i % workModes.length];

      // Les 2 dernières annonces sont désactivées (invisibles pour le public)
      const isActive = i < extraAdsCount - 2;

      // Salaire selon le type de contrat : stage et alternance = montants mensuels plus bas
      const isLowPay = categoryIndex >= 2;
      const salaryMin = isLowPay ? 900 + (i % 4) * 100 : 32000 + (i % 6) * 2000;
      const salaryMax = isLowPay ? salaryMin + 300 : salaryMin + 8000;

      // Chaque annonce a un jour de décalage : l'ordre d'affichage (plus récentes d'abord) est lisible
      const createdAt = new Date(Date.now() - (i + 1) * DAY);

      const title = jobTitle + (isLowPay ? (categoryIndex === 2 ? ' (stage)' : ' (alternance)') : '');

      // Seule TechCorp a un recruteur rattaché dans le seed
      const contactId = companyId === companyTechCorpId ? recruiterId : null;

      await db.query(`
        INSERT INTO ads (
          title, short_description, full_description, location, working_time,
          salary_min, salary_max, is_active, company_id, category_id, contact_id,
          work_mode, recruitment_process, required_stack, optional_stack, created_at
        )
        VALUES ($1, $2, $3, $4, '35h/semaine', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
      `, [
        title,
        shortDesc,
        `${shortDesc}. Vous rejoignez une équipe à taille humaine à ${city}, avec un accompagnement au quotidien. Technologies principales : ${required}. Annonce n°${i + 3} du jeu de données de test.`,
        city,
        salaryMin,
        salaryMax,
        isActive,
        companyId,
        categoryId,
        contactId,
        workMode,
        processes[i % processes.length],
        required,
        optional,
        createdAt,
      ]);
    }

    // 6. CREATION D'UNE CANDIDATURE TEST (Table 'applications')
    // Associe le candidat (userId) à la première annonce (ad1Id)
    await db.query(`
      INSERT INTO applications (ad_id, person_id, message, status)
      VALUES ($1, $2, 'Bonjour, je souhaite postuler à votre offre de développeur Node.js.', 'sent');
    `, [ad1Id, userId]);

    console.log('Base de données initialisée avec succès !');
  } catch (error) {
    // Capture et affichage des erreurs SQL/explication s'il y en a une
    console.error('Erreur pendant le seeding :', error);
    process.exitCode = 1; // Indique un échec au terminal/npm
  } finally {
    // Le bloc 'finally' s'exécute TOUJOURS à la fin.
    // db.end() ferme la connexion avec PostgreSQL pour rendre la main au terminal.
    await db.end();
  }
}

// Lancement de la fonction d'initialisation
seed();