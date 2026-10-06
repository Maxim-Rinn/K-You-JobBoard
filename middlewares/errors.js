// =====================================================================
//  middlewares/errors.js : les deux filets de sécurité de l'API
// =====================================================================


// ---------------------------------------------------------------------
// Filet n°1 : "adresse inconnue" -> répondre 404 en JSON
// ---------------------------------------------------------------------
function notFound(req, res) {
  res.status(404).json({ error: 'Route introuvable' });
}


// ---------------------------------------------------------------------
// Filet n°2 : "quelque chose a planté" -> réponse propre
// ---------------------------------------------------------------------
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  console.error(err);

  res.status(status).json({
    error: status === 500 ? 'Erreur interne du serveur' : err.message,
  });
}


// ---------------------------------------------------------------------
// Rendre les deux filets disponibles pour server.js
// ---------------------------------------------------------------------
module.exports = { notFound, errorHandler };
