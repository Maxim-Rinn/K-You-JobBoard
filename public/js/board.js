
//Données fictive (les éléments "" seront modifiés une fois l'API terminée)
const annonces = [
    {
        id: 1,
        title: "Développeur web junior",
        short_description: "Rejoins notre équipe pour créer des sites.",
        location: "Strasbourg",
        work_mode:"Hybride",
        created_at: "2026-10-01T09:00:00.000Z",
        company_name:"Acme",
        category_name:"Alternance",
    },
    {
        id: 2,
        title:"Comptable débutant",
        short_description:"rejoins notre équipe",
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
        company_name:"Webedia",
        category_name:"Freelance"
    }

    
];

//TESTS : afficher des valeurs dans la console
console.log(annonces.length);
console.log(annonces [2].title);
//exemple en plus pour que je vois ce que "ça fait" du code vers la console
console.log(annonces [2].category_name);

//ZONE : la boîte vide de index.html où on range les cartes
const zone = document.querySelector("#liste-annonces");

//PREMIÈRE BOUCLE
for (const annonce of annonces) {
    
    //1. fabriquer les éléments (pas encore visible dans la page)
    const carte = document.createElement("article");
    const titre = document.createElement("h2");
    const description = document.createElement("p");
    
    //2. écrire dans le titre le texte qui vient du tableau 
    titre.textContent = annonce.title;
    description.textContent = annonce.short_description;
    
    //3. assembler : le titre dans la carte, puis la carte dans la zone (elle appraît)
    carte.append(titre);
    carte.append(description);
    zone.append(carte);

}

