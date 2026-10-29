# K-YOU Job Board

Site d'offres d'emploi réalisé en équipe à Epitech (Hugo Jehl, Robin Milanini, Maxim Rinn).
Une API Express + PostgreSQL et un front en HTML / CSS / JavaScript, servi par le même serveur.

## Fonctionnalités

- Liste des annonces avec pagination, recherche et filtre par catégorie
- Inscription, connexion (JWT) et page profil
- Candidature à une annonce, en étant connecté ou en créant son compte au passage
- Espace administrateur pour gérer entreprises, annonces, utilisateurs, catégories et candidatures

## Stack

Node.js, Express 5, PostgreSQL 16 (Docker), JWT, bcrypt, HTML / CSS / JavaScript sans framework.

## Structure

```text
server.js            serveur Express
docker-compose.yml   base PostgreSQL
db/                  schéma, seed et connexion
routes/              ads, auth, companies, categories, people, applications
middlewares/         auth, optionalAuth, admin, errors
public/              front (index, login, account, admin)
test.http            requêtes de test (REST Client)
K-YOU_API.postman_collection.json
```

## Installation

Prérequis : Node.js 20+ et Docker.

```bash
npm install
cp .env.example .env     # renseigner PGPASSWORD et JWT_SECRET
docker compose up -d     # lance PostgreSQL et crée les tables
npm run seed             # données de test
npm run dev              # http://localhost:3000
```

`/health` permet de vérifier que le serveur et la base répondent.
Pour repartir d'une base vide : `docker compose down -v`, puis `docker compose up -d` et `npm run seed`.

## Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@jobboard.fr` | `admin123` |
| Recruteur | `recruiter@techcorp.fr` | `recruiter123` |
| Candidat | `candidat@jobboard.fr` | `user123` |

Le seed crée 54 annonces actives et 2 annonces désactivées.

## API

Les routes protégées attendent l'en-tête `Authorization: Bearer <token>` (token renvoyé par `/auth/login`).
Les listes renvoient `{ data, pagination: { page, limit, totalItems, totalPages } }`.

| Méthode | Route | Accès |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Public |
| GET | `/auth/me` | Connecté |
| GET | `/ads?page=&limit=&q=&category_id=`, `/ads/:id` | Public |
| POST | `/ads/:id/applications` | Public ou connecté |
| POST, PUT, DELETE | `/ads` | Admin |
| GET | `/companies`, `/categories` (+ `/:id`) | Public |
| POST, PUT, DELETE | `/companies`, `/categories` | Admin |
| PUT | `/people/:id` | Connecté |
| GET, POST, DELETE | `/people` | Admin |
| GET, POST, PUT, DELETE | `/applications` | Admin |
| GET | `/health` | Public |

### Candidature

- Connecté : seul `message` est envoyé, la candidature est liée au compte.
- Visiteur : `first_name`, `last_name`, `email`, `password`, `phone` (facultatif) et `message`. Le compte et la candidature sont créés dans une même transaction.
- Email déjà utilisé ou candidature en double : `409`.

## Pistes d'amélioration

- Choix du rôle (candidat ou recruteur) à l'inscription
- Espace recruteur : gestion de ses propres annonces et des candidats
- Suivi du statut des candidatures côté candidat
