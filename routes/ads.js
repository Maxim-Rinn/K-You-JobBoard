// =====================================================================
//  routes/ads.js : les routes des annonces (préfixe /ads)
// ---------------------------------------------------------------------
//  Ce fichier est une "boutique" du centre commercial : server.js
//  envoie ici toutes les demandes qui commencent par /ads.
//  Ici, on écrit donc les adresses SANS le préfixe :
//    router.get('/')     répondra à  GET /ads
//    router.get('/:id')  répondra à  GET /ads/12
//
//  Qui code quoi dans ce fichier :
//    - Max   : GET /, GET /:id, POST /:id/applications (routes publiques)
//    - Robin : POST /, PUT /:id, DELETE /:id (CRUD admin)
//  Chacun reste dans sa partie pour éviter les conflits Git.
// =====================================================================

// On importe Express pour avoir accès à son Router.
const express = require('express');

// Un Router est un "mini-standard téléphonique" : il regroupe les
// routes d'une seule ressource. server.js le branchera sur /ads.
const router = express.Router();


// ----- Routes publiques (Max) -----

// La connexion à la base (on remonte d'un dossier : routes/ -> racine -> db/)
const pool = require('../db');

// Contrôles d'accès (issue #7) : d'abord « connecté », puis « admin »
const requireAuth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// Candidature (issue #5) : « connecté OU visiteur », et hachage du mot de passe
// quand un visiteur se crée un compte en postulant
const optionalAuth = require('../middlewares/optionalAuth');
const bcrypt = require('bcrypt');

// GET /ads?page=1&limit=10 : les annonces actives, page par page
router.get('/', async (req, res) => {
  // 1. Lire page et limit dans l'URL. Valeurs par défaut : page 1, 10 par page.
  //    On empêche les valeurs absurdes : page au moins 1, limit entre 1 et 50.
  const page  = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  // 2. Combien d'annonces sauter avant la page demandée
  const offset = (page - 1) * limit;

  // 3. Les annonces de la page (requête paramétrée : $1 = limit, $2 = offset)
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
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  // 4. Le nombre total d'annonces actives (pour calculer le nombre de pages)
  const count = await pool.query('SELECT COUNT(*) FROM ads WHERE is_active = TRUE');
  const totalItems = Number(count.rows[0].count);

  // 5. La réponse : les annonces + les infos de pagination.
  //    Même format que les listes de Robin (companies, categories…) :
  //    { data: [...], pagination: { page, limit, totalItems, totalPages } }
  res.json({
    data: result.rows,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

// GET /ads/:id : le détail complet d'une annonce (page "Learn more")
//   200 : l'annonce (un objet) avec son entreprise et sa catégorie
//   400 : id qui n'est pas un entier positif (ex : /ads/abc, /ads/0)
//   404 : annonce inexistante ou désactivée
router.get('/:id', async (req, res) => {
  // 1. Le :id de l'URL est rangé dans req.params, toujours sous forme de texte :
  //    parseInt le transforme en nombre entier ('abc' donne NaN)
  const id = parseInt(req.params.id);

  // 2. On vérifie l'id AVANT d'interroger la base : sinon PostgreSQL planterait
  //    sur 'abc' et on renverrait une erreur 500 au lieu d'un 400
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  // 3. L'annonce + infos de son entreprise et de sa catégorie (deux JOIN).
  //    $1 = la 1re valeur de [id] : la valeur est envoyée à part de la requête,
  //    donc aucune injection SQL possible.
  //    is_active = TRUE : une annonce désactivée n'est pas visible du public.
  const result = await pool.query(`
    SELECT ads.*,
           companies.name    AS company_name,
           companies.website AS company_website,
           companies.city    AS company_city,
           categories.name   AS category_name
    FROM ads
    JOIN companies  ON companies.id  = ads.company_id
    JOIN categories ON categories.id = ads.category_id
    WHERE ads.id = $1 AND ads.is_active = TRUE
  `, [id]);

  // 4. result.rows est toujours un tableau : vide (length 0) = rien trouvé, donc 404
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Annonce introuvable' });
  }

  // 5. Un id est unique, donc une seule ligne : on renvoie rows[0] (un objet,
  //    pas le tableau), rangé dans "data" comme dans toutes les routes de l'API
  res.json({ data: result.rows[0] });
});


// POST /ads/:id/applications : postuler à une annonce (issue #5)
//   Connecté (jeton)  : seul { message } est demandé, on utilise son compte.
//   Visiteur          : { first_name, last_name, email, password, phone?, message }
//                       -> on crée son compte PUIS sa candidature (décision d'équipe :
//                       tout candidat a un compte).
//   201 : la candidature créée
//   400 : id invalide, champ manquant ou mot de passe trop court
//   401 : jeton envoyé mais faux ou expiré (répondu par optionalAuth)
//   404 : annonce inexistante ou désactivée
//   409 : email déjà utilisé (le visiteur doit se connecter) ou déjà postulé
router.post('/:id/applications', optionalAuth, async (req, res) => {
  // 1. L'id de l'annonce, vérifié AVANT la base (comme dans GET /:id)
  const adId = parseInt(req.params.id);
  if (!Number.isInteger(adId) || adId < 1) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  // 2. Le corps de la requête. Sans corps JSON, req.body est undefined :
  //    "|| {}" évite un plantage (et donc un 500) au moment de lire les champs
  const body = req.body || {};
  const { message } = body;

  // 3. Le message est obligatoire pour tout le monde (connecté ou visiteur)
  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Le message est obligatoire' });
  }

  // 4. L'annonce existe-t-elle, et est-elle visible ? Sinon 404
  //    (on ne postule pas à une annonce désactivée, même si on connaît son id)
  const ad = await pool.query('SELECT id FROM ads WHERE id = $1 AND is_active = TRUE', [adId]);
  if (ad.rows.length === 0) {
    return res.status(404).json({ error: 'Annonce introuvable' });
  }

  // ---- Cas 1 : CONNECTÉ. optionalAuth a rempli req.user grâce au jeton ----
  if (req.user) {
    try {
      const result = await pool.query(`
        INSERT INTO applications (ad_id, person_id, message)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [adId, req.user.id, message.trim()]);
      return res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      // 23505 = violation d'une contrainte UNIQUE : ici UNIQUE(ad_id, person_id).
      // On laisse la base refuser le doublon plutôt que de faire un SELECT avant :
      // c'est elle qui fait foi, même si deux requêtes arrivent en même temps.
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Vous avez déjà postulé à cette annonce' });
      }
      throw error; // autre erreur : le filet 500 de server.js s'en charge
    }
  }

  // ---- Cas 2 : VISITEUR. Mêmes règles que POST /auth/register ----
  const { first_name, last_name, email, password, phone } = body;

  // 5. Champs obligatoires du compte (email et password doivent être du texte,
  //    sinon .trim() et .length planteraient plus bas)
  if (!first_name || !last_name || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' });
  }

  // 6. Email normalisé, puis déjà pris ? -> 409 : il a un compte, qu'il se connecte
  const cleanEmail = email.trim().toLowerCase();
  const existing = await pool.query('SELECT id FROM people WHERE email = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Cet email est déjà utilisé : connectez-vous pour postuler' });
  }

  // 7. Hacher le mot de passe AVANT d'ouvrir la transaction (bcrypt est lent :
  //    inutile de garder une connexion à la base occupée pendant ce temps)
  const hash = await bcrypt.hash(password, 10);

  // 8. TRANSACTION : créer le compte ET la candidature, ou RIEN du tout.
  //    Sans elle, si le 2e INSERT échouait, le compte resterait créé sans
  //    candidature, et le visiteur qui réessaie recevrait « email déjà utilisé ».
  //    Une transaction utilise UNE connexion fixe : on l'emprunte au pool.
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // début : rien n'est encore définitif

    // Le compte. Rôle 'user' écrit en dur : un "role" envoyé par le client est ignoré
    const person = await client.query(`
      INSERT INTO people (first_name, last_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5, 'user')
      RETURNING id
    `, [first_name, last_name, cleanEmail, phone, hash]);

    // La candidature, avec l'id du compte qu'on vient de créer
    const application = await client.query(`
      INSERT INTO applications (ad_id, person_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [adId, person.rows[0].id, message.trim()]);

    await client.query('COMMIT'); // tout a marché : on rend les deux INSERT définitifs
    res.status(201).json({ data: application.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK'); // un problème : on annule TOUT, la base est intacte
    // 23505 ici = l'email a été pris entre notre SELECT et notre INSERT
    // (deux inscriptions simultanées) : même réponse qu'à l'étape 6
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé : connectez-vous pour postuler' });
    }
    throw error;
  } finally {
    // Toujours rendre la connexion au pool, succès ou échec,
    // sinon le pool se vide et le serveur finit par ne plus répondre
    client.release();
  }
});


// ----- Routes admin (Robin) -----
// POST /ads - Créer une nouvelle annonce (Admin)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const {
            title,
            short_description,
            full_description,
            location,
            company_id,
            category_id,
            required_stack,
            working_time,
            salary_min,
            salary_max,
            is_active = true,
            contact_id,
            work_mode,
            recruitment_process,
            optional_stack
        } = req.body;

        // Validation des champs obligatoires
        if (!title || !short_description || !full_description || !location || !company_id || !category_id || !required_stack) {
            return res.status(400).json({
                error: "Les champs title, short_description, full_description, location, company_id, category_id et required_stack sont obligatoires"
            });
        }

        // Requête d'insertion paramétrée
        const queryText = `
            INSERT INTO ads (
                title, short_description, full_description, location,
                company_id, category_id, required_stack, working_time,
                salary_min, salary_max, is_active, contact_id,
                work_mode, recruitment_process, optional_stack
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;

        const values = [
            title.trim(),
            short_description.trim(),
            full_description.trim(),
            location.trim(),
            company_id,
            category_id,
            required_stack.trim(),
            working_time ? working_time.trim() : null,
            salary_min || null,
            salary_max || null,
            is_active,
            contact_id || null,
            work_mode ? work_mode.trim() : null,
            recruitment_process ? recruitment_process.trim() : null,
            optional_stack ? optional_stack.trim() : null
        ];

        const result = await pool.query(queryText, values);

        res.status(201).json({ data: result.rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                error: "L'entreprise, la catégorie ou le contact spécifié n'existe pas"
            });
        }
        next(error);
    }
});

// PUT /ads/:id - Mettre à jour une annonce (Admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const {
            title,
            short_description,
            full_description,
            location,
            company_id,
            category_id,
            required_stack,
            working_time,
            salary_min,
            salary_max,
            is_active,
            contact_id,
            work_mode,
            recruitment_process,
            optional_stack
        } = req.body;

        if (!title || !short_description || !full_description || !location || !company_id || !category_id || !required_stack) {
            return res.status(400).json({
                error: "Les champs title, short_description, full_description, location, company_id, category_id et required_stack sont obligatoires"
            });
        }

        const queryText = `
            UPDATE ads SET
                title = $1,
                short_description = $2,
                full_description = $3,
                location = $4,
                company_id = $5,
                category_id = $6,
                required_stack = $7,
                working_time = $8,
                salary_min = $9,
                salary_max = $10,
                is_active = $11,
                contact_id = $12,
                work_mode = $13,
                recruitment_process = $14,
                optional_stack = $15
            WHERE id = $16
            RETURNING *
        `;

        const values = [
            title.trim(),
            short_description.trim(),
            full_description.trim(),
            location.trim(),
            company_id,
            category_id,
            required_stack.trim(),
            working_time ? working_time.trim() : null,
            salary_min || null,
            salary_max || null,
            is_active !== undefined ? is_active : true,
            contact_id || null,
            work_mode ? work_mode.trim() : null,
            recruitment_process ? recruitment_process.trim() : null,
            optional_stack ? optional_stack.trim() : null,
            id
        ];

        const result = await pool.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Annonce introuvable' });
        }

        res.json({ data: result.rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                error: "L'entreprise, la catégorie ou le contact spécifié n'existe pas"
            });
        }
        next(error);
    }
});

// DELETE /ads/:id - Supprimer une annonce (Admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const result = await pool.query('DELETE FROM ads WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Annonce introuvable' });
        }

        res.json({ message: 'Annonce supprimée avec succès' });
    } catch (error) {
        next(error);
    }
});

// module.exports = ce que ce fichier "donne" à celui qui fait
// require('./routes/ads'). Sans cette ligne, server.js recevrait un
// objet vide et Express planterait au démarrage.
module.exports = router;
