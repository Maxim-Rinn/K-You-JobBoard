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
//GET /api/people : liste de toutes les personnes
router.get('/', async (req, res, next) => {
    try {
        const page  = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const offset = (page - 1) * limit;
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé : vous devez être administrateur pour accéder à cette ressource.'});
        }

        const result = await db.query('SELECT id, first_name, last_name, email, role, created_at FROM people ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countResult = await db.query('SELECT COUNT(*) FROM people');
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

// GET /api/people/:id - Récupérer une personne spécifique
router.get('/:id', async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé : vous devez être administrateur pour accéder à cette ressource.'});
        }
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }

        const result = await db.query('SELECT id, first_name, last_name, email, role, created_at FROM people WHERE id=$1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personne non trouvée' });
        }
        res.json({ data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// 3. POST /api/people - Créer une nouvelle personne
router.post('/', async (req, res, next) => {
    try {
        const { first_name, last_name, email, role, password } = req.body;
        
});

module.exports = router;
