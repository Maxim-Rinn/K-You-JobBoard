# Job Board

API Express + PostgreSQL et front en JavaScript.

## Lancer le projet en local

### Prérequis

- [Node.js](https://nodejs.org/) et npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac / Windows) ou Docker Engine + le plugin compose (Linux)

PostgreSQL n'a **pas** besoin d'être installé : la base tourne dans un conteneur Docker. Si un PostgreSQL local occupe déjà le port 5432, arrêtez-le (ou voir `.env.example` pour utiliser 5433).

### Installation

```bash
# 1. Les librairies Node
npm install

# 2. Les réglages : copier le modèle, puis choisir PGPASSWORD et JWT_SECRET
#    (JWT_SECRET : openssl rand -hex 32). À faire AVANT le premier lancement de la base.
cp .env.example .env

# 3. La base PostgreSQL : au premier lancement, Docker crée l'utilisateur et la base
#    à partir du .env, puis exécute db/schema.sql (création des tables)
docker compose up -d

# 4. Les données de test
npm run seed

# 5. Le serveur (http://localhost:3000)
npm run dev
```

Comptes de test créés par le seed : `admin@jobboard.fr` / `admin123`, `recruiter@techcorp.fr` / `recruiter123`, `candidat@jobboard.fr` / `user123`.

### La base au quotidien

| Commande | Effet |
|---|---|
| `docker compose up -d` | Démarre la base en arrière-plan |
| `docker compose ps` | Vérifie qu'elle tourne |
| `docker compose logs db` | Affiche les messages de PostgreSQL |
| `docker compose stop` | Arrête la base (les données sont gardées) |
| `docker compose down -v` | Supprime la base **et ses données** ; puis `up -d` et `npm run seed` pour repartir de zéro (par exemple après une modification de `db/schema.sql`) |

## Choix de fonctionnement

### Postuler à une annonce : `POST /api/ads/:id/applications`

**Tout candidat a un compte** (décision d'équipe), mais on peut le créer directement en postulant :

- **Connecté** (en-tête `Authorization: Bearer <jeton>`) : seul `message` est envoyé, la candidature est liée au compte du jeton.
- **Visiteur** (sans jeton) : `first_name`, `last_name`, `email`, `password` (8 caractères minimum), `phone` (facultatif) et `message`. Le compte (mot de passe haché avec bcrypt, email en minuscules) et la candidature sont créés **ensemble dans une transaction** : si l'un échoue, rien n'est enregistré.
- **Email déjà utilisé** par un visiteur : `409`, il doit se connecter pour postuler (un compte existant n'est jamais réutilisé sans mot de passe).
- **Une seule candidature par personne et par annonce** : un doublon renvoie `409`.
- Annonce inexistante ou désactivée : `404`. Champ manquant : `400`. Jeton faux ou expiré : `401`.
