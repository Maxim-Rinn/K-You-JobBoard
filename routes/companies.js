// =====================================================================
//  routes/companies.js : les entreprises (préfixe /companies)
// ---------------------------------------------------------------------
//  CRUD admin (Robin) :
//    GET    /     ->  liste paginée     (GET    /companies?page=&limit=)
//    POST   /     ->  créer             (POST   /companies)
//    GET    /:id  ->  lire une          (GET    /companies/3)
//    PUT    /:id  ->  modifier          (PUT    /companies/3)
//    DELETE /:id  ->  supprimer         (DELETE /companies/3)
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();
const db = require('../db');

// Contrôles d'accès (issue #7) : d'abord « connecté », puis « admin »
const requireAuth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// 1. GET /companies - Liste paginée + métadonnées
router.get('/', async (req, res, next) => {
  try {
    // 1. On lit les paramètres passés dans l'URL (ex: /companies?page=1&limit=10)
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    // 2. On calcule l'offset avec ta formule
    const offset = (page - 1) * limit;

    // 3. Requête SQL sécurisée, récupération des éléments de la page demandée
    const result = await db.query(
      'SELECT * FROM companies ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM companies');
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 4. Réponse
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. GET /companies/:id - Récupérer une entreprise spécifique
router.get('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const result = await db.query('SELECT * FROM companies WHERE id=$1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        res.json({ data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// 3. POST /companies - Créer une nouvelle entreprise
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name, city, website, description } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({
                error: "Le nom de l'entreprise est obligatoire"
            });
        }
        
        const result = await db.query(
            'INSERT INTO companies (name, city, website, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [
                name.trim(),
                city ? city.trim() : null,
                website ? website.trim() : null,
                description ? description.trim() : null
            ]
        );
        res.status(201).json({ data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: "Ce nom d'entreprise est déjà utilisé"
            });
        }
        next(error);
    }
});

// 4. PUT /companies/:id - Mettre à jour une entreprise
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const { name, city, website, description } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                error: "Le nom de l'entreprise est obligatoire"
            });
        }

        const result = await db.query(
            'UPDATE companies SET name=$1, city=$2, website=$3, description=$4 WHERE id=$5 RETURNING *',
            [
                name.trim(),
                city ? city.trim() : null,
                website ? website.trim() : null,
                description ? description.trim() : null,
                id
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        res.json({ data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: "Ce nom d'entreprise est déjà utilisé"
            });
        }
        next(error);
    }
});

// 5. DELETE /companies/:id - Supprimer une entreprise
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const result = await db.query('DELETE FROM companies WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }
        res.json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                error: "Impossible de supprimer cette entreprise car des annonces y sont rattachées"
            });
        }
        next(error);
    }
});

module.exports = router;
