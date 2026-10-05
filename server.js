// =====================================================================
//  server.js : le point de départ de tout le backend
// ---------------------------------------------------------------------
//  Quand on tape "npm run dev", Node lit ce fichier de HAUT en BAS,
//  une ligne après l'autre. L'ordre des lignes compte donc.
//
//  Image à garder en tête : ce fichier, c'est l'ouverture d'un
//  restaurant le matin.
//    1. on lit les consignes du jour         (le fichier .env)
//    2. on sort le matériel                  (la librairie Express)
//    3. on installe la salle                 (l'application "app")
//    4. on écrit le menu                     (les routes)
//    5. on choisit la porte d'entrée         (le port)
//    6. on ouvre la porte aux clients        (app.listen)
// =====================================================================


// ---------------------------------------------------------------------
// 1. Lire les consignes du jour : le fichier .env
// ---------------------------------------------------------------------
// Le fichier .env contient des réglages qui changent d'un PC à l'autre
// (le port, et plus tard le mot de passe de la base de données).
// Il n'est jamais envoyé sur GitHub : chacun a le sien.
//
// - require('dotenv') va chercher la librairie "dotenv" dans le dossier
//   node_modules (installée avec npm).
// - .config() ouvre le fichier .env, le lit, et range chaque ligne
//   CLÉ=valeur dans un grand tableau d'affichage commun appelé
//   "process.env". Exemple : PORT=3000 devient process.env.PORT.
//
// Cette ligne est TOUT EN HAUT : si un autre fichier lisait process.env
// avant elle, il trouverait le tableau vide.
require('dotenv').config();


// ---------------------------------------------------------------------
// 2. Sortir le matériel : la librairie Express
// ---------------------------------------------------------------------
// Express est une boîte à outils qui s'occupe du travail compliqué
// d'un serveur web (lire les demandes qui arrivent, renvoyer des
// réponses). Nous, on n'a plus qu'à dire "si on me demande X, je
// réponds Y".
//
// On range Express dans une constante ("const" = une boîte dont on ne
// changera jamais le contenu) pour s'en servir à la ligne suivante.
const express = require('express');


// ---------------------------------------------------------------------
// 3. Installer la salle : créer l'application
// ---------------------------------------------------------------------
// "express" est une usine : quand on l'appelle avec (), elle fabrique
// une application toute neuve, qu'on range dans "app".
// C'est sur "app" que tout se passe ensuite : on lui ajoute des routes
// (le menu) puis on lui demande d'ouvrir la porte.
const app = express();


// ---------------------------------------------------------------------
// 4. Écrire le menu : une première route de test
// ---------------------------------------------------------------------
// Une "route", c'est une règle : "quand quelqu'un demande CETTE adresse
// avec CE verbe, voilà ce qu'on fait".
//
// - app.get(...) : "get" est le verbe HTTP qui veut dire "je veux LIRE
//   une information". C'est ce que fait ton navigateur quand tu tapes
//   une adresse.
// - '/api/health' : l'adresse demandée. "health" = santé : cette route
//   sert juste à vérifier que le serveur est en vie.
//   On commence toutes les adresses de l'API par /api pour les séparer
//   des pages du site (index.html, login.html...) que le serveur
//   affichera plus tard.
// - (req, res) => { ... } : la fonction exécutée à chaque visite.
//     req (request)  = la DEMANDE du client : ce qu'il envoie.
//     res (response) = la RÉPONSE : ce qu'on lui renvoie.
//   On n'utilise pas req ici, mais Express donne toujours les deux
//   dans cet ordre, donc il faut l'écrire pour avoir accès à res.
// - res.json({ status: 'ok' }) : renvoie au client un petit texte au
//   format JSON (le format que le front et l'API utilisent pour se
//   parler). Le navigateur affichera : {"status":"ok"}
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


// ---------------------------------------------------------------------
// 5. Choisir la porte d'entrée : le port
// ---------------------------------------------------------------------
// Un PC a des milliers de "portes" numérotées (les ports). Notre
// serveur va en surveiller une seule.
//
// - process.env.PORT : la valeur lue dans le .env à l'étape 1.
// - || 3000 : "||" veut dire "sinon". Si quelqu'un a oublié de mettre
//   PORT dans son .env, on prend 3000 par défaut, et le serveur
//   démarre quand même au lieu de planter.
const PORT = process.env.PORT || 3000;


// ---------------------------------------------------------------------
// 6. Ouvrir la porte aux clients : démarrer le serveur
// ---------------------------------------------------------------------
// app.listen = "écoute". Le serveur se met à attendre des visiteurs
// sur le port choisi, et NE S'ARRÊTE PLUS (jusqu'à Ctrl+C).
// C'est cette ligne qui garde le programme allumé : sans elle, Node
// lirait tout le fichier puis s'arrêterait aussitôt.
//
// La fonction () => { ... } est exécutée une seule fois, quand le
// serveur est prêt. Elle affiche un message dans le terminal pour
// nous prévenir. Les accents graves ` ` permettent d'insérer une
// variable dans le texte avec ${...}.
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
