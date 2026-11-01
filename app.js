
/*
 * HAÏTI 2050 — APP.JS V3
 * Navigation territoriale nationale
 * Départements > Arrondissements > Communes
 *
 * Compatible avec :
 * - territoires.js
 * - map-v2.js
 * - communes-v25.js
 * - quartiers.js
 * - etablissements.js
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

const nationalCenter = [18.96, -72.65];
const nationalZoom = 8;

// Compatibilité avec map-v2.js.
const departments = territorialData.departements.map(d => ({
  name: d.nom,
  center: departmentCenters[d.nom] || nationalCenter,
  communes: d.arrondissements.flatMap(a => a.communes)
}));

// Projets de démonstration conservés.
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

// Aucun territoire présélectionné.
let currentDepartment = "";
let currentArrondissement = "";
let currentCommune = "";

// Création des options des menus.
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
  if (!query) return null;

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

// Mettre à jour les arrondissements.
function updateArrondissementOptions() {
  const department = getDepartment(currentDepartment);

  fillSelect(
    $("arrondissement"),
    department
      ? department.arrondissements.map(a => a.nom)
      : [],
    "Choisir un arrondissement"
  );

  $("arrondissement").value = currentArrondissement;
}

// Mettre à jour les communes.
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

  $("commune").value = currentCommune;
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
  updateCommuneOptions();
}

// Carte Leaflet nationale.
const map = L.map("map", {
  scrollWheelZoom: false
}).setView(nationalCenter, nationalZoom);

// Carte partagée avec les autres scripts.
window.haiti2050Map = map;

// Zoom automatique sur un territoire ou une localité.
window.haiti2050ZoomTo = function(latitude, longitude, zoom = 14) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    console.warn("Coordonnées GPS indisponibles.");
    return false;
  }

  map.flyTo([lat, lon], zoom, {
    animate: true,
    duration: 1.2
  });

  return true;
};

// Zoom sur les frontières d'une couche GeoJSON.
window.haiti2050ZoomToBounds = function(layer) {
  if (!layer || typeof layer.getBounds !== "function") {
    return false;
  }

  const bounds = layer.getBounds();

  if (!bounds.isValid()) return false;

  map.flyToBounds(bounds, {
    padding: [25, 25],
    maxZoom: 15,
    duration: 1.2
  });

  return true;
};
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors"
  }
).addTo(map);

// Repères départementaux.
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

// Notification aux autres modules.
function notifyTerritoryChange() {
  document.dispatchEvent(
    new CustomEvent("haiti2050:territorychange", {
      detail: {
        department: currentDepartment,
        arrondissement: currentArrondissement,
        commune: currentCommune
      }
    })
  );
}

// Sélection d'un territoire sans forcer une commune.
function selectTerritory(
  departmentName,
  arrondissementName = null,
  communeName = null,
  zoom = false
) {
  const department = getDepartment(departmentName);

  if (!department) return false;

  currentDepartment = department.nom;
  currentArrondissement = "";
  currentCommune = "";

  if (arrondissementName) {
    const arrondissement = getArrondissement(
      currentDepartment,
      arrondissementName
    );

    if (arrondissement) {
      currentArrondissement = arrondissement.nom;

      if (communeName) {
        const commune = arrondissement.communes.find(
          name =>
            normalizeTerritory(name) ===
            normalizeTerritory(communeName)
        );

        currentCommune = commune || "";
      }
    }
  }

  syncMenus();

  if (zoom) {
    const center =
      departmentCenters[currentDepartment] || nationalCenter;

    map.flyTo(center, 10);
  }

  renderSelection();
  notifyTerritoryChange();

  return true;
}

// Sélection d'un département.
function selectDepartment(name, zoom = false) {
  return selectTerritory(name, null, null, zoom);
}

// Retour à la vue nationale.
function resetNationalView(zoom = true) {
  currentDepartment = "";
  currentArrondissement = "";
  currentCommune = "";

  syncMenus();
  renderSelection();

  if (zoom) {
    map.flyTo(nationalCenter, nationalZoom);
  }

  notifyTerritoryChange();
}

// Affichage de la sélection.
function renderSelection() {
  const title = $("selectionTitle");
  const description = $("selectionDescription");

  if (title) {
    title.textContent =
      currentCommune ||
      currentArrondissement ||
      currentDepartment ||
      "Haïti — Vue nationale";
  }

  if (description) {
    if (!currentDepartment) {
      description.textContent =
        "Bienvenue dans l'Atlas territorial Haïti 2050. " +
        "Choisissez un département, un arrondissement ou " +
        "une commune pour explorer ses localités, ses " +
        "établissements, ses services et ses projets.";
    } else if (!currentArrondissement) {
      description.textContent =
        "Département : " + currentDepartment +
        ". Choisissez un arrondissement pour poursuivre " +
        "l'exploration du territoire.";
    } else if (!currentCommune) {
      description.textContent =
        "Département : " + currentDepartment +
        ". Arrondissement : " + currentArrondissement +
        ". Choisissez une commune pour consulter sa fiche.";
    } else {
      description.textContent =
        "Département : " + currentDepartment +
        ". Arrondissement : " + currentArrondissement +
        ". Commune : " + currentCommune +
        ". Les limites communales et les sections " +
        "communales restent à vérifier.";
    }
  }

  renderProjects();
  renderTerritoryProfile();
}

// Affichage des projets.
function renderProjects() {
  const container = $("projectCards");

  if (!container) return;

  container.replaceChildren();

  const shown = currentCommune
    ? projects.filter(p =>
        normalizeTerritory(p.department) ===
          normalizeTerritory(currentDepartment) &&
        normalizeTerritory(p.commune) ===
          normalizeTerritory(currentCommune)
      )
    : [];

  const projectCount = $("projectCount");
  if (projectCount) {
    projectCount.textContent = projects.length;
  }

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

    message.textContent = !currentCommune
      ? "Sélectionnez une commune pour consulter ses projets."
      : "Aucun projet renseigné pour cette commune. " +
        "Utilisez « Ajouter un projet » pour commencer.";

    container.appendChild(message);
  }
}

// Nombre de communes dans le répertoire.
const communeTotal = territorialData.departements.reduce(
  (total, department) =>
    total + department.arrondissements.reduce(
      (n, arrondissement) =>
        n + arrondissement.communes.length,
      0
    ),
  0
);

if ($("communeCount")) {
  $("communeCount").textContent = communeTotal;
}

// Événements des menus.
$("department").addEventListener("change", event => {
  if (!event.target.value) {
    resetNationalView();
    return;
  }

  selectDepartment(event.target.value, true);
});

$("arrondissement").addEventListener("change", event => {
  selectTerritory(
    currentDepartment,
    event.target.value || null,
    null,
    true
  );
});

$("commune").addEventListener("change", event => {
  selectTerritory(
    currentDepartment,
    currentArrondissement,
    event.target.value || null,
    true
  );
});

// Bouton Vue nationale.
if ($("nationBtn")) {
  $("nationBtn").onclick = () => {
    resetNationalView(true);
  };
}

// Recherche des communes.
$("searchBtn").onclick = function(event) {
  event.preventDefault();

  const input = $("search");
  const query = normalizeTerritory(input.value.trim());

  if (!query) {
    alert("Veuillez saisir un nom de territoire.");
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
            commune
          });
        }
      }
    }
  }

  if (matches.length === 0) {
    alert("Aucune commune trouvée pour : " + input.value);
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

  $("selectionTitle")?.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
};

// Recherche avec la touche Entrée.
$("search").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("searchBtn").click();
  }
});

// Gestion des localités.
$("addLocality").onclick = () => {
  const value = $("localityName").value.trim();

  if (!currentCommune) {
    alert("Veuillez d'abord sélectionner une commune.");
    return;
  }

  if (!value) return;

  const key = currentDepartment + "|" + currentCommune;

  localities[key] ??= [];

  const exists = localities[key].some(
    item =>
      normalizeTerritory(item) ===
      normalizeTerritory(value)
  );

  if (exists) {
    alert(
      "Cette localité est déjà enregistrée pour cette commune."
    );
    return;
  }

  localities[key].push(value);

  try {
    localStorage.setItem(
      "haiti2050-localities",
      JSON.stringify(localities)
    );
  } catch (error) {
    localities[key].pop();

    console.error(
      "Haïti 2050 — enregistrement localité :",
      error
    );

    alert("Impossible d'enregistrer cette localité.");
    return;
  }

  $("localityName").value = "";

  renderSelection();

  document.dispatchEvent(
    new CustomEvent("haiti2050:localitychange")
  );
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

// Fiche territoriale pilote conservée.
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

// Initialisation nationale.
// Aucune commune ni aucun département sélectionné.
resetNationalView(false);

console.log(
  "HAÏTI 2050 V3 — Vue nationale — " +
  communeTotal +
  " communes chargées."
);
