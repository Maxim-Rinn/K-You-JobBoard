// =====================================================================
//  server.js : le point de départ de tout le backend
// ---------------------------------------------------------------------
//  Quand on tape "npm run dev", Node lit ce fichier de HAUT en BAS, une ligne après l'autre. 
//
//
//  Image à garder en tête : ce fichier, c'est l'ouverture d'un restaurant le matin.
//    1. on lit les consignes du jour         (le fichier .env)
//    2. on sort le matériel                  (la librairie Express)
//    3. on installe la salle                 (l'application "app")
//       3 bis. on installe les contrôles     (les middlewares)
//    4. on écrit le menu                     (les routes)
//       4 bis. on branche les boutiques      (les fichiers routes/)
//    5. on choisit la porte d'entrée         (le port)
//    6. on ouvre la porte aux clients        (app.listen)
// =====================================================================


// ---------------------------------------------------------------------
// 1. Lire les consignes du jour : le fichier .env
// ---------------------------------------------------------------------
require('dotenv').config();


// ---------------------------------------------------------------------
// 2. Sortir le matériel : la librairie Express
// --------------------------------------------------------------------- 
const express = require('express');
const path = require('path');


// ---------------------------------------------------------------------
// 3. Installer la salle : créer l'application
// ---------------------------------------------------------------------
const app = express();


// ---------------------------------------------------------------------
// 3 bis. Installer les contrôles à l'entrée : les middlewares
// ---------------------------------------------------------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// ---------------------------------------------------------------------
// 4. Écrire le menu : une première route de test
// ---------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


// ---------------------------------------------------------------------
// 4 bis. Brancher les "boutiques" : les fichiers du dossier routes
// ---------------------------------------------------------------------
app.use('/api/ads', require('./routes/ads'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/people', require('./routes/people'));
app.use('/api/applications', require('./routes/applications'));


// ---------------------------------------------------------------------
// 4 ter. Les filets de sécurité : TOUJOURS après toutes les routes
// ---------------------------------------------------------------------
// Importer les deux filets depuis middlewares/errors.js
const { notFound, errorHandler } = require('./middlewares/errors');

// Filet n°1 : seulement pour les adresses qui commencent par /api
app.use('/api', notFound);

// Filet n°2 : TOUJOURS en tout dernier
app.use(errorHandler);


// ---------------------------------------------------------------------
// 5. Choisir la porte d'entrée : le port
// ---------------------------------------------------------------------
const PORT = process.env.PORT || 3000;


// ---------------------------------------------------------------------
// 6. Ouvrir la porte aux clients : démarrer le serveur
// ---------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
