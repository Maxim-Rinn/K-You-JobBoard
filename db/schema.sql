-- =============================================================
--  db/schema.sql : création des tables du Job Board
--  Lancement : psql -U postgres -h localhost -d jobboard -f db/schema.sql
-- =============================================================

-- 0. Repartir de zéro : supprimer les 5 tables si elles existent,
--    dans un ordre qui ne provoque pas d'erreur. Pour supprimer mettre dans le sens inverse de la création, car il y a des dépendances entre les tables (foreign keys).
DROP TABLE IF EXISTS applications CASCADE; -- CASCADE pour forcer la suppression même s'il y a des dépendances.
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
-- Le nombre après VARCHAR indique le nombre maximum de caractères autorisés. TEXT n'a pas de limite.

-- 1. Les entreprises
CREATE TABLE companies (
    id          SERIAL PRIMARY KEY,   -- identifiant qui s'incrémente tout seul
    name        VARCHAR(100) NOT NULL UNIQUE,   -- obligatoire, deux entreprises ne peuvent pas avoir le même
    description TEXT,   -- texte libre, facultatif
    website     VARCHAR(200),   -- facultatif
    city        VARCHAR(100),   -- facultatif
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- date de création, remplie automatiquement
    tech_stack  TEXT,   -- facultatif, liste de technologies séparées par des virgules
    tech_team_composition TEXT,   -- facultatif, description de la composition de l'équipe technique
    tech_team_avg_age INTEGER  -- facultatif, âge moyen de l'équipe technique
);


-- 2. Les catégories (CDI, stage, alternance...)
CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE            -- obligatoire et unique
);


-- 3. Les personnes : candidats, recruteurs et admins
CREATE TABLE people (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,  -- obligatoire
    last_name     VARCHAR(100) NOT NULL,  -- obligatoire
    email         VARCHAR(255) NOT NULL UNIQUE,  -- obligatoire, un seul compte par email
    phone         VARCHAR(30),  -- facultatif
    password_hash VARCHAR(255) NOT NULL,  -- réfléchissez : obligatoire ou pas ?
    role          VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'recruiter', 'admin')),  -- 'user' par défaut, et seulement user, recruiter ou admin
    company_id    INTEGER REFERENCES companies(id) ON DELETE SET NULL,  -- l'entreprise d'un recruteur ; si elle est supprimée, la personne reste mais sans entreprise
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    main_stack    TEXT,  -- obligatoire plus tard dans l'inscription, liste de technologies séparées par des virgules
    secondary_stack TEXT, -- obligatoire plus tard dans l'inscription, liste de technologies séparées par des virgules
    environnement VARCHAR(50)  -- facultatif, ex : "Présentiel", "Télétravail", "Hybride"
);


-- 4. Les annonces
CREATE TABLE ads (
    id                SERIAL PRIMARY KEY,
    title             VARCHAR(100) NOT NULL,  -- obligatoire
    short_description VARCHAR(255) NOT NULL,  -- obligatoire, affichée sur la liste (courte)
    full_description  TEXT NOT NULL,  -- obligatoire, longueur illimitée
    location          VARCHAR(150) NOT NULL,  -- obligatoire
    contract_type     VARCHAR(50) NOT NULL,  -- obligatoire, ex : "CDI", "Stage", "Alternance"
    working_time      VARCHAR(50),  -- facultatif, ex : "35h/semaine"
    salary_min        DECIMAL(10, 2),  -- montant avec centimes, facultatif
    salary_max        DECIMAL(10, 2),  -- idem
    is_active         BOOLEAN DEFAULT TRUE,  -- vrai/faux, active par défaut
    company_id        INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,  -- obligatoire ; entreprise supprimée => annonces supprimées
    category_id       INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,  -- obligatoire ; impossible de supprimer une catégorie utilisée
    contact_id        INTEGER REFERENCES people(id) ON DELETE SET NULL,  -- facultatif ; contact supprimé => l'annonce reste, sans contact
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    work_mode         VARCHAR(50), -- facultatif, ex : "Présentiel", "Télétravail", "Hybride"
    recruitment_process TEXT, -- facultatif, description du processus de recrutement
    required_stack    TEXT NOT NULL,-- obligatoire, liste de technologies principales séparées par des virgules
    optional_stack    TEXT -- facultatif, liste de technologies secondaires séparées par des virgules
);


-- 5. Les candidatures : qui a postulé à quelle annonce
CREATE TABLE applications (
    id         SERIAL PRIMARY KEY,
    ad_id      INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,     -- obligatoire ; annonce supprimée => candidatures supprimées
    person_id  INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,     -- obligatoire ; personne supprimée => candidatures supprimées
    message    TEXT NOT NULL,     -- obligatoire, longueur illimitée
    status     VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'reviewed', 'accepted', 'rejected')),     -- 'sent' par défaut ; sent, reviewed, accepted ou rejected
    email_sent BOOLEAN DEFAULT FALSE,     -- vrai/faux, faux par défaut
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ad_id, person_id)  -- une personne ne postule qu'une fois à la même annonce
);