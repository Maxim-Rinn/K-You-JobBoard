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

// La connexion à la base, bcrypt pour hacher les mots de passe,
// et jsonwebtoken pour créer les jetons de connexion (JWT)
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Le contrôle « est connecté » de l'issue #7, pour GET /me
// (on remonte d'un dossier : routes/ -> racine, puis on entre dans middlewares/)
const requireAuth = require('../middlewares/auth');


// POST /api/auth/register : créer un compte
//   201 : compte créé (sans le password_hash dans la réponse)
//   400 : champ manquant ou mot de passe trop court
//   409 : email déjà utilisé
router.post('/register', async (req, res) => {
  // 1. Les champs du formulaire arrivent dans le corps de la requête POST
  //    (req.body, rempli par express.json() dans server.js).
  //    Sans corps JSON, req.body est undefined : "|| {}" évite un plantage (500)
  const { first_name, last_name, email, password, phone } = req.body || {};

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
  try {
    const result = await pool.query(`
      INSERT INTO people (first_name, last_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, 'user')
      RETURNING id, first_name, last_name, email, phone, role
    `, [first_name, last_name, cleanEmail, phone, hash]);

    // 8. 201 = "créé" ; on renvoie la personne (un objet, pas un tableau)
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // 23505 = l'email a été pris entre notre SELECT et notre INSERT
    // (deux inscriptions simultanées) : même réponse qu'à l'étape 5
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    throw error; // autre erreur : le filet 500 de server.js s'en charge
  }
});


// POST /api/auth/login : se connecter
//   200 : { token, user } — le jeton à renvoyer ensuite dans chaque requête
//   400 : email ou mot de passe manquant
//   401 : email inconnu OU mauvais mot de passe (même message dans les deux cas)
router.post('/login', async (req, res) => {
  // 1. Récupérer l'email et le mot de passe envoyés par le formulaire
  //    ("|| {}" : sans corps JSON, req.body est undefined, voir /register)
  const { email, password } = req.body || {};

  // 2. Les deux doivent être du texte, sinon 400
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email et mot de passe obligatoires' });
  }

  // 3. Normaliser l'email EXACTEMENT comme à l'inscription
  const cleanEmail = email.toLowerCase().trim();

  // 4. Chercher la personne (on a besoin de son hash pour comparer)
  const result = await pool.query(
    'SELECT id, first_name, last_name, email, role, password_hash FROM people WHERE email = $1',
    [cleanEmail]
  );

  // 5. Personne avec cet email : 401, avec un message volontairement vague
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  const user = result.rows[0];

  // 6. Comparer le mot de passe saisi avec le hash stocké : compare() re-hache
  //    le mot de passe avec le sel du hash et répond true ou false.
  //    (hash() fabriquerait un NOUVEAU hash, toujours "vrai" : tout passerait)
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  // 7. Fabriquer le jeton : on y met l'id et le rôle, signés avec JWT_SECRET,
  //    une clé réservée aux jetons (jamais le mot de passe de la base).
  //    Il expire au bout de 2 heures.
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

  // 8. Répondre : le jeton + la personne (SANS le password_hash)
  res.json({
    token,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    },
  });
});


// GET /api/auth/me : qui suis-je ? (sert à préremplir le formulaire Apply)
//   200 : la personne connectée (SANS le password_hash)
//   401 : pas de jeton, ou jeton faux / expiré (répondu par requireAuth)
//   404 : le compte n'existe plus
router.get('/me', requireAuth, async (req, res) => {
  // 1. Chercher la personne grâce à l'id rangé dans le jeton par requireAuth.
  //    Colonnes listées une par une (pas de SELECT *) : le password_hash
  //    ne doit JAMAIS partir vers le navigateur.
  //    L'id vient de req.user (donc du jeton signé), jamais de l'URL ni du corps.
  const result = await pool.query(`
    SELECT id, first_name, last_name, email, phone, role,
           main_stack, secondary_stack, work_mode
    FROM people
    WHERE id = $1
  `, [req.user.id]);

  // 2. Aucune ligne : le jeton est valide (2 h), mais le compte a été
  //    supprimé entre-temps (ex : par un admin) -> 404
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Compte introuvable' });
  }

  // 3. Un seul compte par id : on renvoie l'objet, pas le tableau
  res.json(result.rows[0]);
});


module.exports = router;
