


// Champs du formulaire « Postuler ». `name` = clé envoyée à l'API (noms à confirmer avec Max, route POST /api/ads/:id/applications).
const champs = [
    { name: "nom", type: "text", placeholder: "Nom" },
    { name: "prenom", type: "text", placeholder: "Prénom" },
    { name: "email", type: "email", placeholder: "Email" },
    { name: "telephone", type: "tel", placeholder: "Téléphone" },
    { name: "mot_de_passe", type: "password", placeholder: "Mot de passe" },
    { name: "message", type: "text", placeholder: "Message" },
];


//ZONE : la boîte vide de index.html où on range les cartes
const zone = document.querySelector("#liste-annonces");

// Une carte par annonce. Les éléments sont recréés à chaque tour : chaque carte a ses propres boutons et son propre formulaire.
function afficherAnnonces(annonces){
for (const annonce of annonces) {
    
    //1. fabriquer les éléments (pas encore visible dans la page)
    const carte = document.createElement("article");
    const titre = document.createElement("h2");
    const description = document.createElement("p");
    const lieu = document.createElement("p");
    const entreprise = document.createElement("p");
    const contrat = document.createElement("p");
    const dateCarte = document.createElement("p");
    const learnMore = document.createElement("button");
    const apply = document.createElement("button");
    const detail = document.createElement("p");

    const formulaire = document.createElement("form");
    
    const submit = document.createElement("button");
    

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
    carte.append(learnMore);
    carte.append(apply);
    
        for (const champ of champs) {
        const saisie = document.createElement("input");
        saisie.name = champ.name;
        saisie.type = champ.type;
        saisie.placeholder = champ.placeholder;
        formulaire.append(saisie);
    }

    formulaire.append(submit);
    zone.append(carte);
    
    // faire réagir les boutons : écouteurs d'événements (clic sur les boutons, envoi du formulaire).
    
    // Au clic sur « Voir plus » : on demande le détail complet de CETTE annonce à l'API, puis on l'affiche.
    learnMore.addEventListener("click", async function(){
        // `${annonce.id}` insère l'id de l'annonce dans l'adresse : /api/ads/1, /api/ads/2...
        const reponse = await fetch(`/api/ads/${annonce.id}`);

        // 404 (annonce introuvable) ou autre erreur : on affiche un message dans le détail.
        if (!reponse.ok) {
            detail.textContent = "Détail introuvable.";
            carte.append(detail);
            return;
        }

        // On lit la réponse (un objet : l'annonce complète) et on affiche son texte long.
        const resultat = await reponse.json();
        detail.textContent = resultat.full_description;
        carte.append(detail);
    })

    
    // faire réagir le bouton POSTULER
    apply.addEventListener("click", function(){
        carte.append(formulaire);
    })

    // preventDefault() empêche le rechargement de la page (sinon les données partiraient dans l'adresse).
    formulaire.addEventListener("submit", function(event){
    event.preventDefault();
    const donnees = Object.fromEntries(new FormData(formulaire));
console.log(donnees);

    });
}
}

async function chargerAnnonces() {
    const reponse = await fetch("/api/ads");
    if (!reponse.ok) {
        zone.textContent = "Impossible de charger les annonces.";
        return;
    }
    const resultat = await reponse.json();
    afficherAnnonces(resultat.data);
}

chargerAnnonces();





