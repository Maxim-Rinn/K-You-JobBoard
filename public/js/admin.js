//vérifier le token au chargement
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token"); // ou sessionStorage si on veut que ce soit uniquement visible par un onglet de navigateur au lieu de toutes les fenêtres
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    
    // Charger la première table par défaut (ex: 'companies')
    loadTableData('companies', 1);
});

//Fonction centrale de chargement des données
let currentPage = 1;
const limit = 10;
let currentTable = 'companies';

async function loadTableData(tableName, page = 1) {
    currentTable = tableName;
    currentPage = page;
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/${tableName}?page=${page}&limit=${limit}`, {
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
    const items = Array.isArray(data) ? data : (data.items || data.data || []);

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

//Selecteur de table et pagination
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Charger la première table par défaut
    loadTableData(currentTable, currentPage);

    // Changement de table
    document.querySelector("#table-select").addEventListener("change", (e) => {
        currentTable = e.target.value;
        currentPage = 1;
        loadTableData(currentTable, currentPage);
    });

    // Pagination Précédent
    document.querySelector("#btn-prev").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadTableData(currentTable, currentPage);
        }
    });

    // Pagination Suivant
    document.querySelector("#btn-next").addEventListener("click", () => {
        currentPage++;
        loadTableData(currentTable, currentPage);
    });
});

//Suppression
async function deleteItem(id) {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`/${currentTable}/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            loadTableData(currentTable, currentPage);
        } else {
            alert("Erreur lors de la suppression.");
        }
    } catch (error) {
        console.error("Erreur suppression :", error);
    }
}