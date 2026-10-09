// =====================================================================
//  routes/applications.js : les candidatures (préfixe /api/applications)
// ---------------------------------------------------------------------
//  CRUD admin (Robin), même modèle que routes/companies.js.
//  Attention : ENVOYER une candidature n'est pas ici. C'est la route
//  publique POST /api/ads/:id/applications, dans routes/ads.js (Max).
// =====================================================================

// Même squelette que les autres fichiers de routes : voir routes/ads.js
// pour l'explication détaillée de chaque ligne.
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/applications - Créer une nouvelle candidature
router.post('/', async (req, res, next) => {
    try {
        const { ad_id, person_id, message, status } = req.body;
        const statusValues = status ? status.trim() : 'sent'; // Valeur par défaut si status n'est pas fourni
        
        // Validation des champs (NOT NULL)
        if (!ad_id || !person_id || !message || !statusValues) {
            return res.status(400).json({
                success: false,
                message: "Tous les champs sont obligatoires"
            });
        }

        const result = await db.query(
            'INSERT INTO applications (ad_id, person_id, message, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [ad_id, person_id, message.trim(), statusValues]
        );
        res.status(201).json({ success: true, data: result.rows[0]});
    } catch (error) {
        // Gestion des erreurs SQL
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: "Le candidat a déjà postulé à cette annonce"
            });
        }
        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                message: "L'annonce ou le candidat spécifié n'existe pas"
            });
        }
        if (error.code === '23514') {
        return res.status(400).json({
            success: false,
            message: "Le statut fourni n'est pas valide (valeurs autorisées : sent, reviewed, accepted, rejected)"
            });
        }
        next(error);
    }
});

//GET /api/applications - Liste paginée + métadonnées
router.get('/', async (req, res, next) => {
    try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await db.query(
        'SELECT a.*, p.first_name AS applicant_first_name, p.last_name AS applicant_last_name, p.email AS applicant_email, ads.title AS ad_title FROM applications a JOIN people p ON a.person_id = p.id JOIN ads ON a.ad_id = ads.id ORDER BY a.applied_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM applications');
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

//GET /api/applications/:id - Récupérer une application spécifique
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await db.query('SELECT a.*, p.first_name AS applicant_first_name, p.last_name AS applicant_last_name, p.email AS applicant_email, ads.title AS ad_title FROM applications a JOIN people p ON a.person_id = p.id JOIN ads ON a.ad_id = ads.id WHERE a.id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidature non trouvée'});
        }
        res.json({ success: true, data: result.rows[0]});
    } catch (error) {
        next(error);
    }

});

//PUT /api/applications/:id - Mettre à jour une candidature
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;

        // Validation du statut (NOT NULL)
        if (!status || status.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Le statut de la candidature est obligatoire"
            });
        }
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Le message de la candidature est obligatoire"
            });
        }

        const result = await db.query(
            'UPDATE applications SET status=$1, message=$2 WHERE id=$3 RETURNING *',
            [status.trim(), message.trim(), id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Candidature non trouvée"
            });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23514') {
            return res.status(400).json({
                success: false,
                message: "Le statut fourni n'est pas valide (valeurs autorisées : sent, reviewed, accepted, rejected)"
            });
        }
        next(error);
    }
});

// DELETE /api/applications/:id - Supprimer une candidature
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM applications WHERE id=$1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidature non trouvée'});
        }
        res.json({ success:true, message: 'Candidature supprimée avec succès'});
    } catch (error) {
        next(error);
    }
});

module.exports = router;
