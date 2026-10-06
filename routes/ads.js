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


// ----- Routes admin (Robin) -----


// module.exports = ce que ce fichier "donne" à celui qui fait
// require('./routes/ads'). Sans cette ligne, server.js recevrait un
// objet vide et Express planterait au démarrage.
module.exports = router;
