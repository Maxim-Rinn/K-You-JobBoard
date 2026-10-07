// =====================================================================
//  db/index.js : la connexion à PostgreSQL, partagée par toutes les routes
// =====================================================================

// Importer la classe Pool de la librairie pg
const { Pool } = require('pg');

// Créer le pool : sans argument, pg lit tout seul PGHOST, PGPORT,
// PGDATABASE, PGUSER et PGPASSWORD dans process.env (le .env)
const pool = new Pool();

// Rendre le pool disponible pour les routes
module.exports = pool;
