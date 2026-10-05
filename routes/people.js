// =====================================================================
//  routes/people.js : les personnes (préfixe /api/people)
// ---------------------------------------------------------------------
//  Qui code quoi dans ce fichier :
//    - Max   : PUT /:id  ->  un utilisateur modifie SON propre compte
//    - Robin : CRUD admin (GET / , POST / , GET /:id , DELETE /:id ...)
//  Chacun reste dans sa partie pour éviter les conflits Git.
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();


// ----- Compte de l'utilisateur connecté (Max) -----


// ----- Routes admin (Robin) -----


module.exports = router;
