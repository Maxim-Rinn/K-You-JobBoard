// =====================================================================
//  middlewares/auth.js : le contrôle « est connecté » (issue #7)
// ---------------------------------------------------------------------
//  Placé devant une route protégée. Il vérifie le jeton JWT envoyé par
//  le front dans l'en-tête :   Authorization: Bearer <jeton>
//    - pas de jeton, ou jeton faux / expiré  ->  401, on s'arrête
//    - jeton valide  ->  on range la personne dans req.user, puis next()
// =====================================================================

// La librairie qui fabrique (sign) et VÉRIFIE (verify) les jetons
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // 1. Lire l'en-tête Authorization (Express met les noms d'en-têtes en minuscules)
  const header = req.headers.authorization;

  // 2. Il doit exister ET commencer par "Bearer " : sinon, pas connecté
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Connexion requise' });
  }

  // 3. Garder seulement le jeton : "Bearer eyJhbGci..." coupé à l'espace
  //    donne ['Bearer', 'eyJhbGci...'] ; le jeton est la 2e case
  const token = header.split(' ')[1];

  // 4. Vérifier la signature et l'expiration.
  //    Si le jeton est faux ou expiré, verify LANCE UNE ERREUR : on l'attrape.
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Jeton invalide ou expiré' });
  }

  // 5. Le jeton est bon : on range qui est connecté dans req.user,
  //    pour que les contrôles et la route qui suivent puissent s'en servir
  req.user = { id: payload.id, role: payload.role };

  // 6. Tout est bon : on laisse passer au contrôle suivant (ou à la route).
  //    Appelé APRÈS le try/catch : une erreur de la route suivante ne doit
  //    pas être attrapée ici et transformée à tort en 401.
  next();
}

// On exporte la fonction elle-même, pour l'utiliser dans les routes
module.exports = requireAuth;
