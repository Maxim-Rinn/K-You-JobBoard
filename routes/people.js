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
        const { id, first_name, last_name, email, role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Accès refusé : vous devez être administrateur pour accéder à cette ressource.'});
        }
        const result = await db.query('SELECT id, first_name, last_name, email FROM people ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countResult = await db.query('SELECT COUNT(*) FROM people');
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

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

module.exports = router;
