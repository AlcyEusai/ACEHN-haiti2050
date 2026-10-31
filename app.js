
/*
 * HAÏTI 2050 — APP.JS V2.4
 * Navigation territoriale unifiée
 * Départements > Arrondissements > Communes
 *
 * Nécessite territoires.js chargé avant app.js.
 * Compatible avec map-v2.js.
 */

const $ = id => document.getElementById(id);

const normalizeTerritory = value =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘']/g, "'")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const territorialData = window.HAITI_TERRITOIRES;

if (
  !territorialData ||
  !Array.isArray(territorialData.departements)
) {
  throw new Error(
    "HAÏTI 2050 : territoires.js est absent ou invalide."
  );
}

// Centres indicatifs des départements.
// Ils ne représentent pas des limites administratives.
const departmentCenters = {
  "Ouest": [18.54, -72.34],
  "Sud": [18.20, -73.75],
  "Sud-Est": [18.23, -72.54],
  "Grand'Anse": [18.65, -74.12],
  "Nippes": [18.44, -73.10],
  "Artibonite": [19.45, -72.69],
  "Centre": [19.14, -72.00],
  "Nord": [19.76, -72.20],
  "Nord-Est": [19.67, -71.83],
  "Nord-Ouest": [19.93, -72.83]
};

// Structure conservée pour la compatibilité avec map-v2.js.
const departments = territorialData.departements.map(d => ({
  name: d.nom,
  center: departmentCenters[d.nom] || [18.96, -72.65],
  communes: d.arrondissements.flatMap(a => a.communes)
}));

const demo = [
  {
    id: "demo-1",
    department: "Sud",
    commune: "Fond-des-Blancs",
    title: "Marché communal organisé",
    category: "Marché et commerce",
    description:
      "Concept : espaces de vente couverts, accès à l'eau, " +
      "installations sanitaires et zone de stockage agricole.",
    budget: "À étudier",
    demo: true
  },
  {
    id: "demo-2",
    department: "Sud",
    commune: "Fond-des-Blancs",
    title: "Énergie solaire communautaire",
    category: "Énergie solaire",
    description:
      "Concept : étudier un mini-réseau solaire pour " +
      "les services publics et les activités économiques.",
    budget: "À étudier",
    demo: true
  },
  {
    id: "demo-3",
    department: "Sud",
    commune: "Fond-des-Blancs",
    title: "Amélioration des routes rurales",
    category: "Routes et transports",
    description:
      "Concept : prioriser les axes d'accès aux écoles, " +
      "marchés et établissements de santé après étude technique.",
    budget: "À étudier",
    demo: true
  }
];

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let projects = readStorage("haiti2050-projects", demo);
let localities = readStorage("haiti2050-localities", {});

let currentDepartment = "Sud";
let currentArrondissement = "Aquin";
let currentCommune = "Fond-des-Blancs";

function option(select, value, label) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  select.appendChild(element);
}

function fillSelect(select, values, placeholder) {
  if (!select) return;

  select.replaceChildren();
  option(select, "", placeholder);

  values.forEach(value => {
    option(select, value, value);
  });
}

function getDepartment(name) {
  return territorialData.departements.find(
    d => normalizeTerritory(d.nom) === normalizeTerritory(name)
  );
}

function getArrondissement(departmentName, arrondissementName) {
  const department = getDepartment(departmentName);

  return department?.arrondissements.find(
    a => normalizeTerritory(a.nom) ===
         normalizeTerritory(arrondissementName)
  );
}

function findCommune(communeName, departmentName = null) {
  const query = normalizeTerritory(communeName);

  for (const department of territorialData.departements) {
    if (
      departmentName &&
      normalizeTerritory(department.nom) !==
        normalizeTerritory(departmentName)
    ) {
      continue;
    }

    for (const arrondissement of department.arrondissements) {
      const commune = arrondissement.communes.find(
        name => normalizeTerritory(name) === query
      );

      if (commune) {
        return {
          department: department.nom,
          arrondissement: arrondissement.nom,
          commune
        };
      }
    }
  }

  return null;
}

function updateArrondissementOptions() {
  const department = getDepartment(currentDepartment);

  fillSelect(
    $("arrondissement"),
    department
      ? department.arrondissements.map(a => a.nom)
      : [],
    "Choisir un arrondissement"
  );
}

function updateCommuneOptions() {
  const arrondissement = getArrondissement(
    currentDepartment,
    currentArrondissement
  );

  fillSelect(
    $("commune"),
    arrondissement ? arrondissement.communes : [],
    "Choisir une commune"
  );
}

// Initialisation des menus.
fillSelect(
  $("department"),
  territorialData.departements.map(d => d.nom),
  "Choisir un département"
);

fillSelect(
  $("formDepartment"),
  territorialData.departements.map(d => d.nom),
  "Choisir un département"
);

function syncMenus() {
  $("department").value = currentDepartment;

  updateArrondissementOptions();
  $("arrondissement").value = currentArrondissement;

  updateCommuneOptions();
  $("commune").value = currentCommune;
}

// Initialisation de la carte Leaflet.
const map = L.map("map", {
  scrollWheelZoom: false
}).setView([18.96, -72.65], 8);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors"
  }
).addTo(map);

// Conserver cette variable pour map-v2.js.
const markers = [];

departments.forEach(d => {
  const marker = L.circleMarker(d.center, {
    radius: 9,
    color: "#fff",
    weight: 2,
    fillColor: "#008f7a",
    fillOpacity: 0.95
  }).addTo(map);

  marker.bindTooltip(d.name);

  marker.on("click", () => {
    selectDepartment(d.name, true);
  });

  markers.push(marker);
});

function selectTerritory(
  departmentName,
  arrondissementName = null,
  communeName = null,
  zoom = false
) {
  const department = getDepartment(departmentName);
  if (!department) return false;

  currentDepartment = department.nom;

  const arrondissement =
    getArrondissement(department.nom, arrondissementName) ||
    department.arrondissements[0];

  if (!arrondissement) return false;

  currentArrondissement = arrondissement.nom;

  const commune = arrondissement.communes.find(
    name =>
      normalizeTerritory(name) ===
      normalizeTerritory(communeName)
  );

  currentCommune = commune || arrondissement.communes[0] || "";

  syncMenus();

  if (zoom) {
    const center =
      departmentCenters[currentDepartment] || [18.96, -72.65];

    map.flyTo(center, 10);
  }

  renderSelection();

document.dispatchEvent(
  new CustomEvent("haiti2050:territorychange", {
    detail: {
      department: currentDepartment,
      arrondissement: currentArrondissement,
      commune: currentCommune
    }
  })
);

return true;
}

// Fonction attendue par map-v2.js.
function selectDepartment(name, zoom = false) {
  const department = getDepartment(name);
  if (!department) return false;

  const previous = findCommune(
    currentCommune,
    department.nom
  );

  return selectTerritory(
    department.nom,
    previous?.arrondissement,
    previous?.commune,
    zoom
  );
}

function renderSelection() {
  const title = $("selectionTitle");
  const description = $("selectionDescription");

  if (title) title.textContent = currentCommune;

  if (description) {
    description.textContent =
      "Département : " + currentDepartment +
      ". Arrondissement : " + currentArrondissement +
      ". Commune : " + currentCommune +
      ". Les limites communales et les sections " +
      "communales seront intégrées progressivement " +
      "après vérification.";
  }

  const key = currentDepartment + "|" + currentCommune;
  const list = $("localities");

  if (list) {
    list.replaceChildren();

    const items = localities[key] || [];

    if (!items.length) {
      const li = document.createElement("li");
      li.textContent =
        "Aucune localité validée pour le moment.";
      list.appendChild(li);
    } else {
      items.forEach(item => {
        const li = document.createElement("li");
        li.textContent =
          item + " (saisie locale, à vérifier)";
        list.appendChild(li);
      });
    }
  }

  renderProjects();
  renderTerritoryProfile();
}

function renderProjects() {
  const container = $("projectCards");
  if (!container) return;

  container.replaceChildren();

  const shown = projects.filter(p =>
    normalizeTerritory(p.department) ===
      normalizeTerritory(currentDepartment) &&
    normalizeTerritory(p.commune) ===
      normalizeTerritory(currentCommune)
  );

  $("projectCount").textContent = projects.length;

  shown.forEach(p => {
    const article = document.createElement("article");
    article.className = "projectCard";

    if (p.image && /^https:\/\//.test(p.image)) {
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = "Illustration du projet";
      img.loading = "lazy";
      article.appendChild(img);
    }

    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = p.demo
      ? "Concept illustratif"
      : "Proposition locale";

    const title = document.createElement("h3");
    title.textContent = p.title;

    const description = document.createElement("p");
    description.textContent = p.description;

    const details = document.createElement("p");
    details.textContent =
      p.category + " · Budget : " +
      (p.budget || "À étudier");

    article.append(
      chip,
      title,
      description,
      details
    );

    container.appendChild(article);
  });

  if (!shown.length) {
    const message = document.createElement("p");
    message.textContent =
      "Aucun projet renseigné pour cette commune. " +
      "Utilisez « Ajouter un projet » pour commencer.";

    container.appendChild(message);
  }
}

// Nombre de communes présentes dans le répertoire.
const communeTotal = territorialData.departements.reduce(
  (total, department) =>
    total + department.arrondissements.reduce(
      (n, arrondissement) =>
        n + arrondissement.communes.length,
      0
    ),
  0
);

$("communeCount").textContent = communeTotal;

// Événements de navigation.
$("department").addEventListener("change", event => {
  if (!event.target.value) return;
  selectDepartment(event.target.value, true);
});

$("arrondissement").addEventListener("change", event => {
  if (!event.target.value) return;

  selectTerritory(
    currentDepartment,
    event.target.value,
    null,
    false
  );
});

$("commune").addEventListener("change", event => {
  if (!event.target.value) return;

  selectTerritory(
    currentDepartment,
    currentArrondissement,
    event.target.value,
    false
  );
});

$("nationBtn").onclick = () => {
  map.flyTo([18.96, -72.65], 8);
};

// Recherche nationale.

$("searchBtn").onclick = function (event) {
  event.preventDefault();

  const input = $("search");
  const query = normalizeTerritory(input.value.trim());

  if (!query) {
    alert("Veuillez saisir le nom d'une commune.");
    input.focus();
    return;
  }

  const matches = [];

  for (const department of territorialData.departements) {
    for (const arrondissement of department.arrondissements) {
      for (const commune of arrondissement.communes) {
        if (normalizeTerritory(commune).includes(query)) {
          matches.push({
            department: department.nom,
            arrondissement: arrondissement.nom,
            commune: commune
          });
        }
      }
    }
  }

  if (matches.length === 0) {
    alert(
      "Aucune commune trouvée pour : " + input.value
    );
    return;
  }

  const exact = matches.find(
    item => normalizeTerritory(item.commune) === query
  );

  const result = exact || matches[0];

  selectTerritory(
    result.department,
    result.arrondissement,
    result.commune,
    true
  );

  document.getElementById("selectionTitle")
    ?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
};

        break;
      }
    }

    if (found) break;
  }

  if (!found) {
    alert(
      "Commune introuvable dans le répertoire territorial."
    );
    return;
  }

  selectTerritory(
    found.department,
    found.arrondissement,
    found.commune,
    true
  );
};

$("search").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    $("searchBtn").click();
  }
});

// Gestion des localités.
$("addLocality").onclick = () => {
  const value = $("localityName").value.trim();
  if (!value || !currentCommune) return;

  const key = currentDepartment + "|" + currentCommune;

  localities[key] ??= [];

  if (!localities[key].some(
    item => normalizeTerritory(item) ===
            normalizeTerritory(value)
  )) {
    localities[key].push(value);
  }

  try {
    localStorage.setItem(
      "haiti2050-localities",
      JSON.stringify(localities)
    );
  } catch {
    alert("Impossible d'enregistrer cette localité.");
  }

  $("localityName").value = "";
  renderSelection();
};

// Gestion des projets.
const dialog = $("projectDialog");

$("newProject").onclick = () => {
  $("formDepartment").value = currentDepartment;
  $("formCommune").value = currentCommune;
  dialog.showModal();
};

$("closeDialog").onclick =
$("cancelDialog").onclick = () => dialog.close();

$("projectForm").onsubmit = event => {
  event.preventDefault();

  const project = {
    id: Date.now(),
    department: $("formDepartment").value,
    commune: $("formCommune").value.trim(),
    title: $("formTitle").value.trim(),
    category: $("formCategory").value,
    description: $("formDescription").value.trim(),
    budget: $("formBudget").value.trim(),
    image: $("formImage").value.trim(),
    demo: false
  };

  projects.push(project);

  try {
    localStorage.setItem(
      "haiti2050-projects",
      JSON.stringify(projects)
    );
  } catch {
    alert(
      "Stockage du navigateur saturé. " +
      "Le projet ne pourra pas être conservé."
    );
  }

  dialog.close();
  $("projectForm").reset();
  renderProjects();
};

// Fiche territoriale pilote.
const territoryProfiles = {
  "Sud|Fond-des-Blancs": {
    title: "Fond-des-Blancs",
    description:
      "Territoire pilote du programme Haïti 2050. " +
      "Les projets présentés sont des propositions " +
      "d'aménagement à étudier avec les acteurs locaux.",
    priorities: [
      "Amélioration des routes rurales",
      "Construction et rénovation des écoles",
      "Accès aux soins de santé",
      "Développement de l'énergie solaire",
      "Modernisation des marchés",
      "Accès à l'eau potable"
    ]
  }
};

function renderTerritoryProfile() {
  const key = currentDepartment + "|" + currentCommune;
  const profile = territoryProfiles[key];

  let container = $("territoryProfile");

  if (!container) {
    container = document.createElement("section");
    container.id = "territoryProfile";

    container.style.cssText =
      "max-width:1240px;margin:20px auto;" +
      "padding:24px;background:#fff;" +
      "border:1px solid #e0e8ee;" +
      "border-radius:14px;";

    $("atlas").appendChild(container);
  }

  container.replaceChildren();

  if (!profile) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  const title = document.createElement("h2");
  title.textContent = profile.title;

  const description = document.createElement("p");
  description.textContent = profile.description;

  const subtitle = document.createElement("h3");
  subtitle.textContent = "Priorités d'aménagement";

  const list = document.createElement("ul");

  profile.priorities.forEach(priority => {
    const item = document.createElement("li");
    item.textContent = priority;
    list.appendChild(item);
  });

  container.append(
    title,
    description,
    subtitle,
    list
  );
}

// Initialisation.
selectTerritory(
  "Sud",
  "Aquin",
  "Fond-des-Blancs",
  false
);

console.log(
  "HAÏTI 2050 V2.4 — " +
  communeTotal +
  " communes chargées."
);
