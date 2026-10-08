// =====================================================================
//  routes/companies.js : les entreprises (préfixe /api/companies)
// ---------------------------------------------------------------------
//  CRUD admin (Robin) :
//    GET    /     ->  liste paginée     (GET    /api/companies?page=&limit=)
//    POST   /     ->  créer             (POST   /api/companies)
//    GET    /:id  ->  lire une          (GET    /api/companies/3)
//    PUT    /:id  ->  modifier          (PUT    /api/companies/3)
//    DELETE /:id  ->  supprimer         (DELETE /api/companies/3)
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. GET /api/companies - Liste paginée + métadonnées
router.get('/', async (req, res, next) => {
  try {
    // 1. On lit les paramètres passés dans l'URL (ex: /api/companies?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

// 2. GET /api/companies/:id - Récupérer une entreprise spécifique
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query('SELECT * FROM companies WHERE id=$1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée'});
        }
        res.json({ success: true, data: result.rows[0]});
    } catch (error) {
        next(error);
    }

});

// 3. POST /api/companies - Créer une nouvelle entreprise
router.post('/', async (req, res, next) => {
    try {
        const { name, city, website, description } = req.body;
        
        // Validation du nom (NOT NULL)
        if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Le nom de l'entreprise est obligatoire"
        });
        }
        
        const result = await db.query(
            'INSERT INTO companies (name, city, website, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, city, website, description]
        );
        res.status(201).json({ success: true, data: result.rows[0]});
    } catch (error) {
        next(error);
    }
});

// 4. PUT /api/companies/:id - Mettre à jour une entreprise
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, city, website, description } = req.body;

        // Validation du nom (NOT NULL)
        if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: "Le nom de l'entreprise est obligatoire"
        });
        }

        const result = await db.query(
            'UPDATE companies SET name=$1, city=$2, website=$3, description=$4 WHERE id=$5 RETURNING *',
            [name, city, website, description, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée'});
        }
        res.json({ success: true, data: result.rows[0]});
    } catch (error) {
        next(error);
    }
});

// 5. DELETE /api/companies/:id - Supprimer une entreprise
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } =req.params;
        const result = await db.query('DELETE FROM companies WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvée'});
        }
        res.json({ success:true, message: 'Entreprise supprimée avec succès'});
    } catch (error) {
        next(error);
    }
});

module.exports = router;
