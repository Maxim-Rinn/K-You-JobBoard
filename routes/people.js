// =====================================================================
//  routes/people.js : les personnes (préfixe /people)
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
const db = require('../db');

// Contrôles d'accès (issue #7) : d'abord « connecté », puis « admin »
const requireAuth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/admin');
const bcrypt = require('bcrypt');

// ----- Compte de l'utilisateur connecté (Max) -----

// PUT /people/:id : modifier SON propre compte (issue #8)
//   200 : la personne modifiée (SANS le password_hash)
//   400 : id invalide ou champ obligatoire manquant
//   401 : pas connecté (répondu par requireAuth)
//   403 : ce n'est pas son compte (et on n'est pas admin)
//   404 : compte introuvable
//   409 : email déjà utilisé par un autre compte
router.put('/:id', requireAuth, async (req, res) => {
  // 1. L'id de l'URL, vérifié AVANT la base
  const id = parseInt(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Identifiant invalide' });
  }

  // 2. Le droit : on ne modifie que SON compte, sauf si on est admin.
  //    req.user vient du jeton signé : c'est lui qui fait foi, pas l'URL
  if (id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Vous ne pouvez modifier que votre propre compte' });
  }

  // 3. Le corps de la requête (sans corps JSON, req.body est undefined)
  const { first_name, last_name, email, phone, main_stack, secondary_stack, work_mode } = req.body || {};

  // 4. Champs obligatoires (NOT NULL dans le schéma). email doit être du texte,
  //    sinon .trim() planterait plus bas
  if (!first_name || !last_name || typeof email !== 'string') {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  // 5. Normaliser l'email EXACTEMENT comme à l'inscription
  const cleanEmail = email.trim().toLowerCase();

  // 6. La mise à jour. On ne lit JAMAIS role ni password_hash dans le corps :
  //    sinon un utilisateur pourrait se passer admin lui-même
  try {
    const result = await db.query(`
      UPDATE people
      SET first_name = $1, last_name = $2, email = $3, phone = $4,
          main_stack = $5, secondary_stack = $6, work_mode = $7
      WHERE id = $8
      RETURNING id, first_name, last_name, email, phone, role,
                main_stack, secondary_stack, work_mode
    `, [first_name, last_name, cleanEmail, phone, main_stack, secondary_stack, work_mode, id]);

    // 7. Aucune ligne modifiée : le compte n'existe pas (ou plus)
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    // 8. On renvoie la personne modifiée (un objet, pas un tableau), dans "data"
    //    comme le GET /people/:id de Robin juste en dessous
    res.json({ data: result.rows[0] });
  } catch (error) {
    // 23505 = UNIQUE(email) : l'email appartient déjà à un autre compte
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    throw error;
  }
});


// ----- Routes admin (Robin) -----
//GET /people : liste de toutes les personnes
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const page  = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const offset = (page - 1) * limit;

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

// GET /people/:id - Récupérer une personne spécifique
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
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

// POST /people - Créer une nouvelle personne
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const { first_name, last_name, email, role, password } = req.body;
        const roleValue = role || 'user'; // donner une valeur par défaut pour éviter les erreurs si role n'est pas fourni
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs (first_name, last_name, email, password) sont requis'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.query(
            'INSERT INTO people (first_name, last_name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email, role, created_at',
            [first_name.trim(), last_name.trim(), email.toLowerCase().trim(), roleValue, hashedPassword]
        );
        res.status(201).json({ data: result.rows[0]});
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                error: "L'email est déjà utilisé"
            });
        }
        next(error);
    }
});

// DELETE /people/:id - Supprimer une personne
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ error: 'Identifiant invalide' });
        }
        const result = await db.query('DELETE FROM people WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personne non trouvée' });
        }
        res.json({ message: 'Personne supprimée avec succès' });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({
                error: "Impossible de supprimer cette personne car elle a déjà des annonces associées et candidatures. Supprimez d'abord les annonces et les candidatures de cette personne."
            })
        }
        next(error);
    }
})

module.exports = router;
