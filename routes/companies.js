// =====================================================================
//  routes/companies.js : les entreprises (préfixe /api/companies)
// ---------------------------------------------------------------------
//  CRUD admin (Robin) :
//    GET    /     ->  liste paginée     (GET    /api/companies?page=&limit=)
//    POST   /     ->  créer             (POST   /api/companies)
//    GET    /:id  ->  lire une          (GET    /api/companies/3)
//    PUT    /:id  ->  modifier          (PUT    /api/companies/3)
//    DELETE /:id  ->  supprimer         (DELETE /api/companies/3)
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();


module.exports = router;
