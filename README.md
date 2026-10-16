# Job Board (K-YOU)

Un site d'offres d'emploi : une **API** (Express + PostgreSQL) et un **front** en JavaScript, servi par la même application.

Ce document explique, pas à pas, comment lancer le projet sur votre ordinateur et comment le tester, **même si vous n'avez jamais utilisé Node.js ni Docker**.

## Sommaire

1. [Ce que fait le projet](#1-ce-que-fait-le-projet)
2. [Technologies utilisées](#2-technologies-utilisées)
3. [Structure du projet](#3-structure-du-projet)
4. [Lancer le projet en local](#4-lancer-le-projet-en-local)
5. [Naviguer dans l'application](#5-naviguer-dans-lapplication)
6. [Tester l'API](#6-tester-lapi)
7. [Documentation de l'API](#7-documentation-de-lapi)
8. [Choix de fonctionnement](#8-choix-de-fonctionnement)
9. [Problèmes fréquents](#9-problèmes-fréquents)
10. [État d'avancement](#10-état-davancement)

---

## 1. Ce que fait le projet

- Un **visiteur** consulte les annonces et peut postuler en créant son compte au passage.
- Un **candidat** (rôle `user`) se connecte, gère son profil et postule.
- Un **recruteur** (rôle `recruiter`) est rattaché à une entreprise.
- Un **administrateur** (rôle `admin`) gère tout depuis une page dédiée : entreprises, annonces, utilisateurs, catégories et candidatures.

## 2. Technologies utilisées

| Technologie | À quoi elle sert |
|---|---|
| **Node.js** | Fait tourner le serveur (JavaScript côté serveur) |
| **Express 5** | Crée l'API : reçoit les requêtes et renvoie des réponses JSON |
| **PostgreSQL 16** | La base de données (annonces, entreprises, comptes, candidatures) |
| **Docker / Docker Compose** | Lance PostgreSQL dans un « conteneur », sans rien installer sur votre PC |
| **JWT** (`jsonwebtoken`) | Le « badge » donné à la connexion pour prouver qui on est |
| **bcrypt** | Stocke les mots de passe de façon chiffrée (jamais en clair) |
| **dotenv** | Lit vos réglages personnels dans le fichier `.env` |
| **pg** | Fait le lien entre Node.js et PostgreSQL |
| **nodemon** | Relance le serveur automatiquement quand on modifie le code |
| **HTML / CSS / JavaScript** | Le front (pages du site), sans framework |

## 3. Structure du projet

```text
KYJB/
├── server.js              # Point de départ : démarre le serveur et branche les routes
├── package.json           # Liste des librairies et des commandes npm
├── docker-compose.yml     # Définit la base PostgreSQL lancée par Docker
├── .env.example           # Modèle des réglages (à copier en .env)
├── test.http              # Requêtes de test pour l'API (extension REST Client de VS Code)
├── K-YOU_API.postman_collection.json   # Collection à importer dans Postman
├── db/
│   ├── schema.sql         # Création des tables (exécuté automatiquement par Docker)
│   ├── seed.js            # Données de test (entreprises, annonces, comptes…)
│   └── index.js           # Connexion à la base
├── routes/                # Une « boutique » par ressource
│   ├── ads.js             # Annonces (+ candidature à une annonce)
│   ├── auth.js            # Inscription, connexion, « qui suis-je »
│   ├── companies.js       # Entreprises
│   ├── categories.js      # Catégories
│   ├── people.js          # Personnes (candidats, recruteurs, admins)
│   └── applications.js    # Candidatures
├── middlewares/           # Contrôles appliqués avant les routes
│   ├── auth.js            # Exige un jeton valide (sinon 401)
│   ├── optionalAuth.js    # Jeton facultatif (visiteur ou connecté)
│   ├── admin.js           # Exige le rôle admin (sinon 403)
│   └── errors.js          # Réponses d'erreur en JSON (404, 500…)
└── public/                # Le front, servi tel quel par Express
    ├── index.html         # Accueil : liste des annonces
    ├── login.html         # Connexion
    ├── account.html       # Création de compte / profil
    ├── admin.html         # Espace administrateur
    ├── css/               # Styles
    └── js/                # Scripts de chaque page
```

## 4. Lancer le projet en local

### 4.1 Ce qu'il faut installer (une seule fois)

1. **Node.js** (version LTS récente, 20 ou plus) : <https://nodejs.org/>
2. **Docker Desktop** (Mac / Windows) ou Docker Engine + le plugin compose (Linux) : <https://www.docker.com/products/docker-desktop/>
3. Un terminal : *Terminal* sur Mac/Linux, *PowerShell* sur Windows.

PostgreSQL n'a **pas** besoin d'être installé : la base tourne dans Docker. Si un PostgreSQL local occupe déjà le port 5432, arrêtez-le (ou voir `.env.example` pour utiliser 5433).

**Vérifiez vos installations** (chaque commande doit afficher un numéro de version) :

```bash
node -v
npm -v
docker --version
docker compose version
```

> **Important :** ouvrez **Docker Desktop** et attendez qu'il indique qu'il est démarré *avant* de continuer.

### 4.2 Installation pas à pas

Placez-vous dans le dossier du projet (celui qui contient `package.json`) :

```bash
cd chemin/vers/KYJB
```

**Étape 1 : installer les librairies Node**

```bash
npm install
```

Un dossier `node_modules` apparaît. C'est normal (il est volontairement absent du dépôt).

**Étape 2 : créer votre fichier de réglages `.env`**

Mac / Linux :

```bash
cp .env.example .env
```

Windows (PowerShell) :

```powershell
copy .env.example .env
```

Ouvrez ensuite `.env` dans un éditeur et modifiez **deux valeurs** :

- `PGPASSWORD` : choisissez un mot de passe pour la base (ex. `monMotDePasse123`).
- `JWT_SECRET` : une longue chaîne aléatoire. Pour en générer une :

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  (ou `openssl rand -hex 32` si vous avez openssl). Copiez le résultat dans `.env`.

> **À faire AVANT le premier lancement de la base.** Le fichier `.env` contient des secrets : ne le partagez jamais et ne le publiez pas sur GitHub (il est déjà ignoré par Git).

**Étape 3 : démarrer la base PostgreSQL**

```bash
docker compose up -d
```

Au premier lancement, Docker télécharge PostgreSQL, crée l'utilisateur et la base à partir de votre `.env`, puis exécute `db/schema.sql` (création des tables).
Vérifiez : `docker compose ps` doit afficher le service `db` avec l'état **running**.

**Étape 4 : remplir la base avec des données de test**

```bash
npm run seed
```

Message attendu : `Base de données initialisée avec succès !`

**Étape 5 : démarrer le serveur**

```bash
npm run dev
```

Message attendu : `Serveur lancé sur http://localhost:3000`. **Laissez ce terminal ouvert** : le serveur tourne tant qu'il est ouvert (arrêt : `Ctrl + C`).

### 4.3 Vérifier que tout fonctionne

- Ouvrez <http://localhost:3000/health> : vous devez voir `{"status":"ok","db":"ok", ...}`. Cela prouve que le serveur **et** la base se parlent.
- Ouvrez <http://localhost:3000> : le site s'affiche.

### 4.4 Les jours suivants

| Commande | Effet |
|---|---|
| `docker compose up -d` | Démarre la base en arrière-plan |
| `npm run dev` | Démarre le serveur |
| `docker compose ps` | Vérifie que la base tourne |
| `docker compose logs db` | Affiche les messages de PostgreSQL (utile en cas d'erreur) |
| `docker compose stop` | Arrête la base (les données sont gardées) |
| `docker compose down -v` | Supprime la base **et ses données** ; puis `up -d` et `npm run seed` pour repartir de zéro (par exemple après une modification de `db/schema.sql`) |
| `npm run seed` | Réinitialise les données de test (efface vos modifications) |
| `npm start` | Démarre le serveur sans rechargement automatique |

## 5. Naviguer dans l'application

### 5.1 Comptes de test

Créés par `npm run seed` :

| Rôle | Email | Mot de passe | Ce que vous pouvez faire |
|---|---|---|---|
| Administrateur | `admin@jobboard.fr` | `admin123` | Tout gérer depuis `admin.html` |
| Recruteur | `recruiter@techcorp.fr` | `recruiter123` | Compte rattaché à l'entreprise TechCorp |
| Candidat | `candidat@jobboard.fr` | `user123` | Consulter, postuler, modifier son profil |

### 5.2 Parcours de test conseillé

Adresse du site : <http://localhost:3000>

1. **En visiteur (non connecté)** : sur l'accueil, parcourez les annonces. Utilisez la recherche et le filtre par catégorie.
2. **Créer un compte** : cliquez sur « Connexion » puis « Créer un compte » (`/account.html`). Remplissez le formulaire (mot de passe : 8 caractères minimum). Vous êtes connecté automatiquement.
3. **Se connecter / se déconnecter** : page `/login.html` avec le compte candidat ; le bouton de déconnexion apparaît dans le menu.
4. **Modifier son profil** : une fois connecté, ouvrez « Mon compte » (`/account.html`) pour renseigner vos technologies (principales, secondaires) et votre mode de travail.
5. **Espace administrateur** : connectez-vous avec `admin@jobboard.fr`. Vous êtes redirigé vers `/admin.html`, où une liste déroulante permet de choisir la table à gérer (entreprises, annonces, utilisateurs / candidats, catégories, candidatures), de la parcourir page par page et de supprimer des éléments.
6. **Accès refusé** : connecté en candidat, tentez d'ouvrir `/admin.html` : vous êtes renvoyé vers l'accueil.

### 5.3 Pages du site

| Page | Adresse | Rôle |
|---|---|---|
| Accueil | `/index.html` (ou `/`) | Liste des annonces, recherche, filtre, formulaire de candidature |
| Connexion | `/login.html` | Se connecter |
| Compte | `/account.html` | Créer un compte, ou modifier son profil si connecté |
| Administration | `/admin.html` | Gérer les données (admin uniquement) |

## 6. Tester l'API

L'API répond en JSON. Vous pouvez la tester de trois façons.

**a) Dans le navigateur** (routes publiques en lecture) :

- <http://localhost:3000/ads> : liste des annonces actives
- <http://localhost:3000/ads/1> : détail d'une annonce
- <http://localhost:3000/companies> et <http://localhost:3000/categories>

**b) Avec `curl` dans le terminal** :

```bash
# Se connecter : la réponse contient un "token"
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidat@jobboard.fr","password":"user123"}'

# Utiliser le token pour voir son profil (remplacez LE_TOKEN)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer LE_TOKEN"
```

(Sous Windows PowerShell, utilisez plutôt `curl.exe` ou l'une des deux options ci-dessous.)

**c) Avec un outil graphique** :

- **Postman** : importez `K-YOU_API.postman_collection.json` (requêtes classées en « Publiques », « Compte » et « Admin »).
- **VS Code** : installez l'extension *REST Client*, ouvrez `test.http` et cliquez sur « Send Request » au-dessus de chaque requête.

> Les tests qui créent, modifient ou suppriment des données changent votre base. Pour repartir d'une base propre : `npm run seed`.

### Codes de réponse à connaître

| Code | Signification |
|---|---|
| `200` / `201` | Succès / élément créé |
| `400` | Requête incorrecte (champ manquant, identifiant invalide) |
| `401` | Pas connecté, ou jeton faux / expiré |
| `403` | Connecté, mais pas le droit (ex. route réservée aux admins) |
| `404` | Élément introuvable (ou annonce désactivée) |
| `409` | Conflit (email déjà utilisé, candidature en double) |

## 7. Documentation de l'API

Adresse de base : `http://localhost:3000`
Pour les routes protégées, ajoutez l'en-tête `Authorization: Bearer <jeton>` (jeton obtenu avec `/auth/login`).

**Accès :** *Public* = sans connexion · *Connecté* = jeton valide · *Admin* = jeton d'un compte `admin`.

### Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Créer un compte |
| POST | `/auth/login` | Public | Se connecter, renvoie un jeton |
| GET | `/auth/me` | Connecté | Voir son propre profil |

### Annonces

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/ads?page=1&limit=10` | Public | Annonces actives, paginées (limit : 1 à 50) |
| GET | `/ads/:id` | Public | Détail d'une annonce |
| POST | `/ads/:id/applications` | Public ou connecté | Postuler (voir section 8) |
| POST | `/ads` | Admin | Créer une annonce |
| PUT | `/ads/:id` | Admin | Modifier une annonce |
| DELETE | `/ads/:id` | Admin | Supprimer une annonce |

### Entreprises

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/companies` | Public | Liste paginée |
| GET | `/companies/:id` | Public | Détail |
| POST | `/companies` | Admin | Créer |
| PUT | `/companies/:id` | Admin | Modifier |
| DELETE | `/companies/:id` | Admin | Supprimer (ses annonces sont supprimées aussi) |

### Catégories

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/categories` | Public | Liste |
| GET | `/categories/:id` | Public | Détail |
| POST | `/categories` | Admin | Créer |
| PUT | `/categories/:id` | Admin | Modifier |
| DELETE | `/categories/:id` | Admin | Supprimer (impossible si une annonce l'utilise) |

### Personnes

| Méthode | Route | Accès | Description |
|---|---|---|---|
| PUT | `/people/:id` | Connecté | Modifier un profil |
| GET | `/people` | Admin | Liste paginée |
| GET | `/people/:id` | Admin | Détail |
| POST | `/people` | Admin | Créer une personne |
| DELETE | `/people/:id` | Admin | Supprimer |

### Candidatures

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/applications` | Admin | Liste |
| GET | `/applications/:id` | Admin | Détail |
| POST | `/applications` | Admin | Créer |
| PUT | `/applications/:id` | Admin | Modifier (statut : `sent`, `reviewed`, `accepted`, `rejected`) |
| DELETE | `/applications/:id` | Admin | Supprimer |

### Divers

| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/health` | Public | Vérifie que le serveur et la base répondent |

Les listes renvoient `{ "data": [...], "pagination": { "page", "limit", "totalItems", "totalPages" } }`.

## 8. Choix de fonctionnement

### Postuler à une annonce : `POST /ads/:id/applications`

**Tout candidat a un compte** (décision d'équipe), mais on peut le créer directement en postulant :

- **Connecté** (en-tête `Authorization: Bearer <jeton>`) : seul `message` est envoyé, la candidature est liée au compte du jeton.
- **Visiteur** (sans jeton) : `first_name`, `last_name`, `email`, `password` (8 caractères minimum), `phone` (facultatif) et `message`. Le compte (mot de passe haché avec bcrypt, email en minuscules) et la candidature sont créés **ensemble dans une transaction** : si l'un échoue, rien n'est enregistré.
- **Email déjà utilisé** par un visiteur : `409`, il doit se connecter pour postuler (un compte existant n'est jamais réutilisé sans mot de passe).
- **Une seule candidature par personne et par annonce** : un doublon renvoie `409`.
- Annonce inexistante ou désactivée : `404`. Champ manquant : `400`. Jeton faux ou expiré : `401`.

## 9. Problèmes fréquents

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Cannot connect to the Docker daemon` / `docker: command not found` | Docker Desktop n'est pas lancé ou pas installé | Lancez Docker Desktop, attendez qu'il soit prêt, réessayez |
| `port is already allocated` (5432) | Un PostgreSQL local utilise déjà ce port | Arrêtez-le, ou mettez `5433` dans `.env` (`PGPORT`) **et** dans `docker-compose.yml` |
| `password authentication failed` | Le mot de passe de `.env` ne correspond pas à celui utilisé à la création de la base | `docker compose down -v`, puis `docker compose up -d` et `npm run seed` |
| `ECONNREFUSED 127.0.0.1:5432` | La base n'est pas démarrée | `docker compose up -d`, puis `docker compose ps` |
| `relation "..." does not exist` | Les tables n'ont pas été créées | `docker compose down -v`, puis `up -d`, puis `npm run seed` |
| `/health` ne répond pas / page blanche | Le serveur n'est pas lancé | Lancez `npm run dev` et vérifiez le message dans le terminal |
| `EADDRINUSE: address already in use :::3000` | Un autre programme utilise le port 3000 | Fermez-le, ou changez `PORT` dans `.env` |
| `Cannot find module ...` | Les librairies ne sont pas installées | `npm install` |
| Jeton invalide, 401 sur toutes les routes protégées | `JWT_SECRET` modifié après la connexion | Reconnectez-vous |
| Je veux repartir de zéro | | `docker compose down -v`, `docker compose up -d`, `npm run seed` |

## 10. État d'avancement

- L'API est fonctionnelle et testable (sections 6 et 7).
- Les pages `login.html`, `account.html` et `admin.html` utilisent l'API.
- La liste des annonces de l'accueil (`public/js/board.js`) affiche pour le moment des **annonces d'exemple** en dur ; son branchement sur `GET /ads` est prévu. Les annonces réelles de la base se consultent via l'API (`/ads`) ou l'espace admin.