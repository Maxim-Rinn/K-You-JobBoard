
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
    },
    {
        id:3,
        title:"Designer freelance",
        short_description:"Rejoins l'aventure youtube pour créer des miniatures d'une chaîne à un million d'abonnés",
        location:"France (ou Suisse)",
        work_mode:"Télétravail",
        created_at:"2026-10-05T08:15:00.000Z",
        company_name:"WEBEDIA",
        category_name:"Freelance"
    }

    
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
    
    //3. assembler : le titre dans la carte, puis la carte dans la zone (elle apparaît)
    carte.append(titre);
    carte.append(entreprise);
    carte.append(lieu);
    carte.append(contrat);
    carte.append(description);
    carte.append(dateCarte);
    carte.append(learnMore);
    carte.append(apply);
    zone.append(carte);

}
