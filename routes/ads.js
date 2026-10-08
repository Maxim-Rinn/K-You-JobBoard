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

// GET /api/ads?page=1&limit=10 : les annonces actives, page par page
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
  const total = Number(count.rows[0].count);

  // 5. La réponse : les annonces + les infos de pagination
  res.json({
    data: result.rows,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /api/ads/:id : le détail complet d'une annonce (page "Learn more")
router.get('/:id', async (req, res) => {
  // 1. Récupérer l'id dans l'URL et le transformer en nombre entier
  //    (les paramètres de route comme :id sont rangés dans req.?????)
  const id = parseInt(req.params.id);

  // 2. Si ce n'est pas un entier, ou s'il est plus petit que 1 : 400 et on s'arrête
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  // 3. L'annonce + infos de son entreprise et de sa catégorie
  //    (une annonce désactivée ne doit pas être visible du public)
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

  // 4. Aucune ligne trouvée (tableau vide) : 404 et on s'arrête
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Annonce introuvable' });
  }

  // 5. Renvoyer l'annonce : la PREMIÈRE case du tableau, pas le tableau entier
  res.json(result.rows[0]);
});


// ----- Routes admin (Robin) -----


// module.exports = ce que ce fichier "donne" à celui qui fait
// require('./routes/ads'). Sans cette ligne, server.js recevrait un
// objet vide et Express planterait au démarrage.
module.exports = router;
