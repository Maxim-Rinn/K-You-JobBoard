// Charger les variables d'environnement depuis le fichier .env
require('dotenv').config();
// Importer le pool de connexion PostgreSQL
const db = require('./index');
// Importer bcryptjs pour le hachage sécurisé des mots de passe
const bcrypt = require('bcryptjs');

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