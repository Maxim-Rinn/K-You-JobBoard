// =====================================================================
//  routes/categories.js : les catégories (préfixe /categories)
// ---------------------------------------------------------------------
//  CRUD admin (Robin), même modèle que routes/companies.js :
//    GET / , POST / , GET /:id , PUT /:id , DELETE /:id
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();
const db = require('../db');

// Contrôles d'accès (issue #7) : d'abord « connecté », puis « admin »
const requireAuth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');

// POST /categories - Créer une nouvelle categorie
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                error: "Le nom de la catégorie est obligatoire"
            });
        }

        const result = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );
        res.status(201).json({ data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: "Le nom de la catégorie est déjà utilisé"
            });
        }
        next(error);
    }
});

//GET /categories - Liste paginée + métadonnées

router.get('/', async (req, res, next) => {
    try {
        const page  = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const offset = (page - 1) * limit;

        const result = await db.query(
            'SELECT * FROM categories ORDER BY id DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        const countResult = await db.query('SELECT COUNT(*) FROM categories');
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

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

//GET /categories/:id - Récupérer une categories spécifique
router.get('/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }
        res.json({ data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

//PUT /categories/:id - Mettre à jour une catégorie
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                error: "Le nom de la catégorie est obligatoire"
            });
        }

        const result = await db.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name.trim(), id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }
        res.json({ data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: "Le nom de la catégorie est déjà utilisé"
            });
        }
        next(error);
    }
});

// DELETE /categories/:id - Supprimer une catégorie
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Catégorie non trouvée' });
        }
        res.json({ message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        // Code 23503 : contrainte RESTRICT déclenchée par la table ads
        if (error.code === '23503') {
            return res.status(400).json({
                error: "Impossible de supprimer cette catégorie car des annonces y sont associées"
            });
        }
        next(error);
    }
});

module.exports = router;
