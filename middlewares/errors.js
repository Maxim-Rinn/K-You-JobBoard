// Filet n°1 : "adresse inconnue" -> répondre 404 en JSON
// ---------------------------------------------------------------------
// 💡 C'est un middleware normal : il reçoit la demande (req) et la
//    réponse (res). On n'a pas besoin de next, car ce filet répond
//    toujours lui-même : il ne passe jamais la main à quelqu'un d'autre.
//    Son nom est imposé, car server.js l'importera sous ce nom :
//    "pas trouvé" en anglais, en un seul mot, avec une majuscule au
//    milieu (comme errorHandler plus bas).
function notfoud(req, res) {
  // 💡 Une réponse HTTP a deux parties : un CODE (200 = ok, 404 = pas
  //    trouvé, 500 = le serveur a planté) et un CONTENU.
  //    - res.status(code) fixe le code ;
  //    - res.json(objet) envoie le contenu en JSON et termine la réponse.
  //    Les deux s'enchaînent sur une seule ligne : res.status(...).json(...)
  //    Le contenu : un objet avec une clé "error" et le texte 'Route introuvable'.
  ____________________________________________;
}


// ---------------------------------------------------------------------
// Filet n°2 : "quelque chose a planté" -> réponse propre
// ---------------------------------------------------------------------
// 💡 Express reconnaît un middleware d'ERREURS à un seul détail :
//    il a 4 paramètres au lieu de 3. Le premier est l'erreur elle-même
//    (on l'appelle err), puis req, res, et enfin next.
//    On n'utilise pas next, mais si on l'oublie, Express ne compte que
//    3 paramètres et prend ce filet pour un middleware normal : il ne
//    recevrait jamais les erreurs.
function errorHandler(____, ____, ____, ____) {
  // 💡 Certaines erreurs portent déjà un code dans err.status
  //    (ex : express.json() met 400 quand le JSON reçu est mal formé).
  //    Les autres (un bug, la base de données en panne) n'en ont pas :
  //    pour elles, on choisit le code "erreur interne du serveur".
  //    Avec ||, ça se dit : "err.status, sinon ce code-là".
  const status = ____________;

  // 💡 Le détail complet de l'erreur est précieux pour NOUS : on
  //    l'affiche dans le terminal du serveur. console.log affiche du
  //    texte normal ; il existe une méthode cousine faite pour les
  //    erreurs (même nom que le paramètre... en entier, en anglais).
  ____________(err);

  // 💡 Au client, on renvoie le code calculé plus haut et un message.
  //    Règle de sécurité : pour une erreur 500, JAMAIS le vrai message
  //    (il peut révéler un nom de table, un chemin de fichier...).
  //    On envoie alors 'Erreur interne du serveur'. Pour les autres
  //    codes (ex : 400), err.message est sans danger et aide le front.
  //    Cette ligne est déjà écrite : lis-la et explique-la-moi.
  res.status(status).json({
    error: status === 500 ? 'Erreur interne du serveur' : err.message,
  });
}


// ---------------------------------------------------------------------
// Rendre les deux filets disponibles pour server.js
// ---------------------------------------------------------------------
// 💡 Dans routes/, chaque fichier exportait UNE seule chose (router).
//    Ici on en exporte DEUX : on les range dans un objet { a, b }.
//    server.js pourra ensuite les récupérer par leur nom.
module.exports = ____________________;
