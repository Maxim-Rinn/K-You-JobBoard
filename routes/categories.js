// =====================================================================
//  routes/categories.js : les catégories (préfixe /api/categories)
// ---------------------------------------------------------------------
//  CRUD admin (Robin), même modèle que routes/companies.js :
//    GET / , POST / , GET /:id , PUT /:id , DELETE /:id
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/categories - Créer une nouvelle categorie
router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body;
        
        // Validation du nom (NOT NULL)
        if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Le nom de la catégorie est obligatoire"
        });
        }
        
        const result = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name.trim()]
        );
        res.status(201).json({ success: true, data: result.rows[0]});
    } catch (error) {

        //La vérification de l'erreur SQL
        if (error.code === '23505') {
        return res.status(409).json({
            success: false,
            message: "Le nom de la catégorie est déjà utilisé"
        });
        }

        next(error);
    }
});

//GET /api/categories - Liste paginée + métadonnées

router.get('/', async (req, res, next) => {
    try {
        // 1. On lit les paramètres passés dans l'URL (ex: /api/companies?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // 2. On calcule l'offset avec ta formule
    const offset = (page - 1) * limit;

    // 3. Requête SQL sécurisée, récupération des éléments de la page demandée
    const result = await db.query(
      'SELECT * FROM categories ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM categories');
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // 4. Réponse
    res.json({
      success: true,
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

//GET /api/categories/:id - Récupérer une categories spécifique
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query('SELECT * FROM categories WHERE id=$1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée'});
        }
        res.json({ success: true, data: result.rows[0]});
    } catch (error) {
        next(error);
    }

});

//PUT /api/categories/:id - Mettre à jour une catégorie
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Validation du nom (NOT NULL)
        if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Le nom de la catégorie est obligatoire"
        });
        }

        const result = await db.query(
            'UPDATE categories SET name=$1 WHERE id=$2 RETURNING *',
            [name.trim(), id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée'});
        }
        res.json({ success: true, data: result.rows[0]});
    } catch (error) {

        //La vérification de l'erreur SQL
        if (error.code === '23505') {
        return res.status(409).json({
            success: false,
            message: "Le nom de la catégorie est déjà utilisé"
        });
        }
        next(error);
    }
});

// DELETE /api/categories/:id - Supprimer une catégorie
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM categories WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée'});
        }
        res.json({ success:true, message: 'Catégorie supprimée avec succès'});
    } catch (error) {
        next(error);
    }
});

module.exports = router;
