// =====================================================================
//  routes/auth.js : inscription et connexion (préfixe /api/auth)
// ---------------------------------------------------------------------
//  server.js envoie ici les demandes qui commencent par /api/auth.
//  Routes prévues (Max) :
//    POST /register  ->  POST /api/auth/register  (créer un compte)
//    POST /login     ->  POST /api/auth/login     (se connecter)
//    GET  /me        ->  GET  /api/auth/me        (qui suis-je ?)
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();


module.exports = router;
