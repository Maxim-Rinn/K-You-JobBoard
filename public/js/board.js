


// Champs du formulaire « Postuler » : seul le message est demandé. Il faut être connecté pour postuler
// (voir le bouton « Postuler » plus bas) : l'API connaît déjà le compte grâce au token.
const champs = [
    { name: "message", type: "text", placeholder: "Message" },
];


//ZONE : la boîte vide de index.html où on range les cartes
const zone = document.querySelector("#liste-annonces");

// Pagination, recherche et filtre par catégorie : les éléments de index.html et ce que le visiteur a demandé
const ANNONCES_PAR_PAGE = 10;
const DELAI_RECHERCHE = 300; // millisecondes d'attente après la dernière frappe
const zonePagination = document.querySelector("#pagination-controls");
const champRecherche = document.querySelector("#search-input");
const listeCategories = document.querySelector("#category-filter");
let pageCourante = 1;
let rechercheCourante = champRecherche.value.trim();
let categorieCourante = "";
// Numéro de la dernière demande envoyée : une réponse plus ancienne arrivée en retard est ignorée
let numeroDemande = 0;

// Une carte par annonce. Les éléments sont recréés à chaque tour : chaque carte a ses propres boutons et son propre formulaire.
function afficherAnnonces(annonces){
// On vide la liste avant de la remplir : sinon les cartes de la page précédente resteraient affichées.
zone.replaceChildren();
if (annonces.length === 0) {
    zone.textContent = "Aucune annonce ne correspond à votre recherche.";
    return;
}
for (const annonce of annonces) {
    
    //1. fabriquer les éléments (pas encore visible dans la page)
    const carte = document.createElement("article");
        // Classe CSS du design de la carte (cadre, ombre, arrondi) : définie dans style.css.
    carte.className = "ad-card";

    const titre = document.createElement("h3");
    const description = document.createElement("p");
    const lieu = document.createElement("p");
    const entreprise = document.createElement("p");
    const contrat = document.createElement("p");
    const dateCarte = document.createElement("p");
    const learnMore = document.createElement("button");
    const apply = document.createElement("button");
        // Les deux boutons sont rangés dans une boîte « actions », côte à côte, avec le style de style.css.
    const actions = document.createElement("div");
    actions.className = "ad-actions";
    learnMore.className = "btn-details";
    apply.className = "btn-apply";

    const detail = document.createElement("p");

    const formulaire = document.createElement("form");
    
    const submit = document.createElement("button");
    const message = document.createElement("p");
    const infos = document.createElement("p");
    const invitation = document.createElement("p");
    

    //2. "Remplir l'assiette" 
    titre.textContent = annonce.title;
    entreprise.textContent = annonce.company_name;
    lieu.textContent = annonce.location;
    contrat.textContent = annonce.category_name;
    description.textContent = annonce.short_description;
    const date = new Date(annonce.created_at);
    const texte = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    dateCarte.textContent = texte;
    learnMore.textContent = "Voir plus";
    apply.textContent = "Postuler";
    
    
    submit.type = "submit";
    submit.textContent = "Envoyer"; 
    
    //3. assembler : le titre dans la carte, puis la carte dans la zone (elle apparaît)
    carte.append(titre);
    carte.append(entreprise);
    carte.append(lieu);
    carte.append(contrat);
    carte.append(description);
    carte.append(dateCarte);
    actions.append(learnMore);
    actions.append(apply);
    carte.append(actions);
    
        for (const champ of champs) {
        const saisie = document.createElement("input");
        saisie.name = champ.name;
        saisie.type = champ.type;
        saisie.placeholder = champ.placeholder;
        formulaire.append(saisie);
    }
    formulaire.append(message);
    formulaire.append(submit);
    zone.append(carte);
    
    // faire réagir les boutons : écouteurs d'événements (clic sur les boutons, envoi du formulaire).
    
    // Au clic sur « Voir plus » : on demande le détail complet de CETTE annonce à l'API, puis on l'affiche.
    // Un second clic referme le détail. Le texte n'est demandé à l'API qu'une seule fois.
    let detailCharge = false;
    learnMore.addEventListener("click", async function(){
        // Détail déjà affiché : on le retire et on remet le libellé d'origine.
        if (detail.isConnected) {
            detail.remove();
            learnMore.textContent = "Voir plus";
            return;
        }

        if (!detailCharge) {
            // Le bouton est bloqué pendant la demande, pour éviter les doubles clics.
            learnMore.disabled = true;

            // `${annonce.id}` insère l'id de l'annonce dans l'adresse : /ads/1, /ads/2...
            const reponse = await fetch(`/ads/${annonce.id}`);

            if (!reponse.ok) {
                // 404 (annonce introuvable) ou autre erreur : on affiche un message dans le détail.
                detail.textContent = "Détail introuvable.";
            } else {
                // On lit la réponse (un objet : l'annonce complète) et on garde son texte long.
                const resultat = await reponse.json();
                detail.textContent = resultat.data.full_description;
                detailCharge = true;
            }

            learnMore.disabled = false;
        }

        carte.append(detail);
        learnMore.textContent = "Voir moins";
    })


    // faire réagir le bouton POSTULER
        // Au clic sur « Postuler » : on affiche le formulaire. Si l'utilisateur est connecté, on demande son profil à l'API pour l'afficher.
    apply.addEventListener("click", async function(){
        const token = localStorage.getItem("token");

        // Visiteur (pas de token) : pas de formulaire, on l'invite à se connecter ou à créer un compte.
        if (!token) {
            const lienConnexion = document.createElement("a");
            lienConnexion.href = "login.html";
            lienConnexion.textContent = "connecte-toi";
            const lienCompte = document.createElement("a");
            lienCompte.href = "account.html";
            lienCompte.textContent = "crée un compte";
            invitation.replaceChildren("Pour postuler, ", lienConnexion, " ou ", lienCompte, ".");
            carte.append(invitation);
            return;
        }

        // Connecté : GET /auth/me avec le badge (token) renvoie le profil dans la clé "data".
        if (token) {
            const reponse = await fetch("/auth/me", {
                headers: { Authorization: "Bearer " + token }
            });

            if (reponse.ok) {
                const resultat = await reponse.json();
                const profil = resultat.data;
                infos.textContent = `Connecté en tant que ${profil.first_name} ${profil.last_name} (${profil.email})`;
            } else {
                // 401 : le token a expiré (il dure 2 h) : on propose de se reconnecter.
                infos.textContent = "Ta session a expiré : reconnecte-toi pour postuler avec ton compte.";
            }

            // prepend = ranger au DÉBUT du formulaire (append range à la fin).
            formulaire.prepend(infos);
        }

        carte.append(formulaire);
    })


    // Envoi du formulaire : preventDefault() empêche le rechargement de la page, puis on envoie les données à l'API.
    formulaire.addEventListener("submit", async function(event){
        event.preventDefault();

                // Lit les champs du formulaire : { message }.
        const donnees = Object.fromEntries(new FormData(formulaire));

                // Y a-t-il un token (utilisateur connecté) ? Il est rangé dans localStorage sous la clé "token".
        const token = localStorage.getItem("token");

        // En-têtes de la requête : on dit qu'on envoie du JSON.
        const entetes = { "Content-Type": "application/json" };
                // Connecté : on montre le badge à l'API, et on n'envoie que le message (elle connaît déjà le compte).
        // Visiteur : on envoie toutes les informations, comme avant.
        let corps = donnees;
        if (token) {
            entetes.Authorization = "Bearer " + token;
            corps = { message: donnees.message };
        }
                // POST : on envoie les données en JSON dans le corps de la requête (jamais dans l'adresse).
                const reponse = await fetch(`/ads/${annonce.id}/applications`, {

            method: "POST",
            headers: entetes,
            body: JSON.stringify(corps)
        });


        // Un seul endroit pour afficher le résultat sous le formulaire.
        message.textContent = "";
        const resultat = await reponse.json();

        // Erreur (400 champ manquant, 409 email déjà pris, 404...) : on affiche le message de l'API.
        if (!reponse.ok) {
            message.textContent = resultat.error;
            return;
        }

        // 201 : candidature créée.
        message.textContent = "Candidature envoyée !";
        formulaire.reset();
    });

}
}

// Charge UNE page d'annonces : GET /ads?page=1&limit=10&q=...&category_id=...
async function chargerAnnonces() {
    const cetteDemande = ++numeroDemande;

    // URLSearchParams fabrique la partie « ?page=1&... » de l'adresse (accents et espaces compris)
    const parametres = new URLSearchParams({ page: pageCourante, limit: ANNONCES_PAR_PAGE });
    if (rechercheCourante) parametres.set("q", rechercheCourante);
    if (categorieCourante) parametres.set("category_id", categorieCourante);

    const reponse = await fetch("/ads?" + parametres);

    // Une demande plus récente est partie entre-temps : on laisse celle-là gagner
    if (cetteDemande !== numeroDemande) return;

    if (!reponse.ok) {
        zone.textContent = "Impossible de charger les annonces.";
        zonePagination.replaceChildren();
        return;
    }
    const resultat = await reponse.json();
    if (cetteDemande !== numeroDemande) return;

    // Page qui n'existe plus (ex. annonces supprimées entre-temps) : retour à la dernière page
    const pagination = resultat.pagination;
    if (resultat.data.length === 0 && pagination.totalItems > 0 && pageCourante > pagination.totalPages) {
        pageCourante = pagination.totalPages;
        return chargerAnnonces();
    }

    afficherAnnonces(resultat.data);
    afficherPagination(pagination);
}

// Boutons « Précédent » / « Page X sur Y » / « Suivant » (cachés s'il n'y a qu'une page)
function afficherPagination(pagination) {
    if (pagination.totalPages <= 1) {
        zonePagination.replaceChildren();
        return;
    }

    const precedent = document.createElement("button");
    precedent.type = "button";
    precedent.className = "btn-details";
    precedent.textContent = "Précédent";
    precedent.disabled = pagination.page <= 1;
    precedent.addEventListener("click", function () {
        allerALaPage(pagination.page - 1);
    });

    const info = document.createElement("span");
    const mot = pagination.totalItems > 1 ? "annonces" : "annonce";
    info.textContent = "Page " + pagination.page + " sur " + pagination.totalPages
        + " (" + pagination.totalItems + " " + mot + ")";

    const suivant = document.createElement("button");
    suivant.type = "button";
    suivant.className = "btn-details";
    suivant.textContent = "Suivant";
    suivant.disabled = pagination.page >= pagination.totalPages;
    suivant.addEventListener("click", function () {
        allerALaPage(pagination.page + 1);
    });

    zonePagination.replaceChildren(precedent, info, suivant);
}

function allerALaPage(numero) {
    pageCourante = numero;
    chargerAnnonces();
    // On remonte en haut de la liste pour voir la nouvelle page
    document.querySelector(".filters").scrollIntoView({ behavior: "smooth" });
}

// Liste des catégories : GET /categories
async function chargerCategories() {
    const reponse = await fetch("/categories?limit=50");
    if (!reponse.ok) return; // sans catégories, la liste reste sur « Toutes les catégories »
    const resultat = await reponse.json();

    // Ordre alphabétique, plus facile à parcourir
    const categories = resultat.data.slice().sort(function (a, b) {
        return a.name.localeCompare(b.name, "fr");
    });

    for (const categorie of categories) {
        const option = document.createElement("option");
        option.value = categorie.id;
        option.textContent = categorie.name;
        listeCategories.append(option);
    }
}

// Recherche : on attend une courte pause dans la frappe avant d'interroger l'API
let minuteurRecherche = null;
champRecherche.addEventListener("input", function () {
    clearTimeout(minuteurRecherche);
    minuteurRecherche = setTimeout(function () {
        rechercheCourante = champRecherche.value.trim();
        pageCourante = 1; // un nouveau filtre ramène toujours à la page 1
        chargerAnnonces();
    }, DELAI_RECHERCHE);
});

// Catégorie : réaction immédiate au choix dans la liste
listeCategories.addEventListener("change", function () {
    categorieCourante = listeCategories.value;
    pageCourante = 1;
    chargerAnnonces();
});

chargerCategories();
chargerAnnonces();

