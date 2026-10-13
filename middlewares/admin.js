// =====================================================================
//  middlewares/admin.js : le contrôle « est admin » (issue #7)
// ---------------------------------------------------------------------
//  Toujours placé APRÈS requireAuth : c'est requireAuth qui remplit
//  req.user. Ici on sait déjà QUI est connecté ; on vérifie son DROIT.
//    - rôle différent de 'admin'  ->  403, on s'arrête
//    - rôle 'admin'               ->  next()
// =====================================================================

function requireAdmin(req, res, next) {
  // 1. Connecté, mais pas administrateur : interdit
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }

  // 2. C'est un admin : on laisse passer
  next();
}

module.exports = requireAdmin;
