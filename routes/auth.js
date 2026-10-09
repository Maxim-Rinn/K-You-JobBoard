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

// La connexion à la base, et bcrypt pour hacher les mots de passe
const pool = require('../db');
const bcrypt = require('bcrypt');


// POST /api/auth/register : créer un compte
//   201 : compte créé (sans le password_hash dans la réponse)
//   400 : champ manquant ou mot de passe trop court
//   409 : email déjà utilisé
router.post('/register', async (req, res) => {
  // 1. Les champs du formulaire arrivent dans le corps de la requête POST
  //    (req.body, rempli par express.json() dans server.js)
  const { first_name, last_name, email, password, phone } = req.body;

  // 2. Champs obligatoires : s'il en manque un, 400 et on s'arrête.
  //    email et password doivent être du texte : sinon .trim() ou .length
  //    planteraient plus bas (ex : "email": 42) et on renverrait 500
  if (!first_name || !last_name || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  // 3. Mot de passe d'au moins 8 caractères
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' });
  }

  // 4. Normaliser l'email : enlever les espaces autour, puis tout en minuscules,
  //    pour que " Max@Mail.com " et "max@mail.com" soient le même compte
  const cleanEmail = email.trim().toLowerCase();

  // 5. L'email est-il déjà pris ? Au moins une ligne trouvée = conflit, 409
  const existing = await pool.query('SELECT id FROM people WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé' });
  }

  // 6. Hacher le mot de passe (10 = le "coût" : plus c'est haut, plus c'est lent)
  //    bcrypt prend du temps : il faut attendre son résultat
  const hash = await bcrypt.hash(password, 10);

  // 7. Créer la personne. Le rôle 'user' est écrit EN DUR : un "role" envoyé
  //    par le client est ignoré, sinon n'importe qui pourrait devenir admin.
  //    On stocke cleanEmail (normalisé) et hash (jamais le mot de passe en clair).
  //    RETURNING renvoie la ligne créée, SANS le password_hash
  const result = await pool.query(`
    INSERT INTO people (first_name, last_name, email, phone, password_hash, role)
    VALUES ($1, $2, $3, $4, $5, 'user')
    RETURNING id, first_name, last_name, email, phone, role
  `, [first_name, last_name, cleanEmail, phone, hash]);

  // 8. 201 = "créé" ; on renvoie la personne (un objet, pas un tableau)
  res.status(201).json(result.rows[0]);
});


module.exports = router;
