document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token"); // ou sessionStorage si on veut que ce soit uniquement visible par un onglet de navigateur au lieu de toutes les fenêtres
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    
    // Charger la première table par défaut (ex: 'companies')
    loadTableData('companies', 1);
});

let currentPage = 1;
const limit = 10;
let currentTable = 'companies';

async function loadTableData(tableName, page = 1) {
    currentTable = tableName;
    currentPage = page;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`http://localhost:3000/api/admin/${tableName}?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Gestion de la sécurité demandée par l'issue (401 / 403)
        if (response.status === 401 || response.status === 403) {
            alert("Accès non autorisé. Réservé aux administrateurs.");
            window.location.href = "index.html";
            return;
        }

        const data = await response.json();
        
        // Fonction pour injecter le HTML dans le tableau
        renderTable(data);
    } catch (error) {
        console.error("Erreur lors du chargement de la table :", error);
    }
}

//Rendu du tableau en lisant les données renvoyés par l'API
function renderTable(data) {
    //Définir le head et le body et renvoie le contenu dans le html dynamiquement
    const tableHead = document.querySelector("#admin-table thead");
    const tableBody = document.querySelector("#admin-table tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    // On s'assure d'avoir un tableau d'éléments (soit data direct, soit data.items/data.rows selon la pagination de l'API)
    const items = Array.isArray(data) ? data : (data.items || data.rows || []);

    //Vérifie si les données sont présentes 
    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="100%">Aucun enregistrement trouvé</td></tr>`;
        return;
    }

    //Générer les entêtes à partir des clés du premier élément
    const keys = Object.keys(items[0]);
    const headerRow = document.createElement("tr");

    keys.forEach(key =>{
        const th = document.createElement("th");
        th.textContent = key.toUpperCase();
        headerRow.appendChild(th);
    });

    //Colonne pour les actions
    const thActions = document.createElement("th");
    thActions.textContent = "ACTIONS";
    headerRow.appendChild(thActions);
    tableHead.appendChild(headerRow);

    //Générer les lignes de données
    items.forEach(item => {
        const tr = document.createElement("tr");

        keys.forEach(key => {
            const td = document.createElement("td");
            td.textContent = item[key] !== null ? item[key] : "-";
            tr.appendChild(td);
        });

        //Boutons d'action
        const tdActions = document.createElement("td");
        tdActions.innerHTML = `
        <button class="btn-edit" onclick="openEditModal(${item.id})">Modifier</button>
        <button class="btn-delete" onclick="deleteItem(${item.id})">Supprimer</button>
        `;
        tr.appendChild(tdActions);
        tableBody.appendChild(tr);
    });

    //Mettre à jour l'affichage de la page
    document.querySelector("#page-info").textContent = `Page ${currentPage}`;
}