
//Données fictives (les éléments "" seront modifiés une fois l'API terminée)
const annonces = [
    {
        id: 1,
        title: "Développeur web junior",
        short_description: "Rejoins notre équipe pour créer des sites.",
        location: "Strasbourg",
        work_mode:"Hybride",
        created_at: "2026-10-01T09:00:00.000Z",
        company_name:"ACME",
        category_name:"Alternance",
        full_description:"Tu participeras au développement et à la maintenance des sites web de nos clients, aux côtés d'une équipe de trois développeurs. Tu seras formé au quotidien et tu travailleras en HTML, CSS et JavaScript, en alternance, deux jours par semaine en télétravail.",
    },
    {
        id: 2,
        title:"Comptable débutant",
        short_description:"Rejoins notre équipe",
        location:"Paris",
        work_mode:"Présentiel",
        created_at:"2026-10-03T14:30:00.000Z",
        company_name:"CERFRANCE INDRE",
        category_name:"CDI",
        full_description:"Tu assureras la saisie et le suivi de la comptabilité d'un portefeuille de petites entreprises, avec l'appui d'une comptable expérimentée. Tu prépareras les déclarations de TVA et les bilans simples, en CDI, dans nos bureaux.",
    },
    {
        id:3,
        title:"Designer freelance",
        short_description:"Rejoins l'aventure youtube pour créer des miniatures d'une chaîne à un million d'abonnés",
        location:"France (ou Suisse)",
        work_mode:"Télétravail",
        created_at:"2026-10-05T08:15:00.000Z",
        company_name:"WEBEDIA",
        category_name:"Freelance",
        full_description:"Tu créeras les miniatures de nos vidéos pour une chaîne de plus d'un million d'abonnés, en respectant sa charte graphique. Tu travailleras en autonomie, à distance, avec un retour de l'équipe éditoriale sous 24 heures.",
    }

    
];

// Paramètres des champs de formulaires : 
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

//Faire une BOUCLE
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
    detail.textContent = annonce.full_description;
    
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
    
    // faire réagir les boutons : le "guetteur"
    
    learnMore.addEventListener("click", function(){
        console.log("clic sur", annonce.title);
        carte.append(detail);
        
    })
    
    // faire réagir le boutton POSTULER
    apply.addEventListener("click", function(){
        carte.append(formulaire);
    })

    // Ne pas afficher les données dans la barre de recherche
    formulaire.addEventListener("submit", function(event){
    event.preventDefault();
    const donnees = Object.fromEntries(new FormData(formulaire));
console.log(donnees);

});
}



