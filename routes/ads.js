// =====================================================================
//  routes/ads.js : les routes des annonces (préfixe /api/ads)
// ---------------------------------------------------------------------
//  Ce fichier est une "boutique" du centre commercial : server.js
//  envoie ici toutes les demandes qui commencent par /api/ads.
//  Ici, on écrit donc les adresses SANS le préfixe :
//    router.get('/')     répondra à  GET /api/ads
//    router.get('/:id')  répondra à  GET /api/ads/12
//
//  Qui code quoi dans ce fichier :
//    - Max   : GET /, GET /:id, POST /:id/applications (routes publiques)
//    - Robin : POST /, PUT /:id, DELETE /:id (CRUD admin)
//  Chacun reste dans sa partie pour éviter les conflits Git.
// =====================================================================

// On importe Express pour avoir accès à son Router.
const express = require('express');

// Un Router est un "mini-standard téléphonique" : il regroupe les
// routes d'une seule ressource. server.js le branchera sur /api/ads.
const router = express.Router();


// ----- Routes publiques (Max) -----

// La connexion à la base (on remonte d'un dossier : routes/ -> racine -> db/)
const pool = require('../db');

// GET /api/ads : la liste des annonces actives, les plus récentes d'abord
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT ads.id, ads.title, ads.short_description, ads.location,
           ads.work_mode, ads.created_at,
           companies.name  AS company_name,
           categories.name AS category_name
    FROM ads
    JOIN companies  ON companies.id  = ads.company_id
    JOIN categories ON categories.id = ads.category_id
    WHERE ads.is_active = TRUE
    ORDER BY ads.created_at DESC
  `);

  res.json(result.rows);
});


// ----- Routes admin (Robin) -----


// module.exports = ce que ce fichier "donne" à celui qui fait
// require('./routes/ads'). Sans cette ligne, server.js recevrait un
// objet vide et Express planterait au démarrage.
module.exports = router;
