// =====================================================================
//  middlewares/optionalAuth.js : « connecté OU visiteur » (issue #5)
// ---------------------------------------------------------------------
//  Même vérification que requireAuth, avec une seule différence :
//  SANS jeton, on laisse passer (c'est un visiteur) au lieu de répondre 401.
//    - pas d'en-tête Authorization   ->  visiteur : req.user reste vide, next()
//    - jeton valide                  ->  req.user = { id, role }, next()
//    - jeton présent mais faux/expiré ->  401 : on ne le traite PAS en visiteur,
//      sinon un utilisateur dont le jeton a expiré se créerait un 2e compte
//  Utilisé par POST /ads/:id/applications, ouvert aux deux publics.
// =====================================================================

const jwt = require('jsonwebtoken');

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  // 1. Aucun en-tête : c'est un visiteur, on passe à la route
  if (!header) {
    return next();
  }

  // 2. Un en-tête est là : il doit être au bon format "Bearer <jeton>"
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Jeton invalide ou expiré' });
  }

  // 3. Vérifier le jeton, exactement comme dans requireAuth
  const token = header.split(' ')[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Jeton invalide ou expiré' });
  }

  // 4. Connecté : la route saura QUI postule grâce à req.user
  req.user = { id: payload.id, role: payload.role };
  next();
}

module.exports = optionalAuth;
