
/*
 * HAÏTI 2050 — V2.5 corrigée
 * Frontières communales et fiches territoriales
 *
 * Dépendances :
 * - Leaflet
 * - territoires.js
 * - app.js
 *
 * Données :
 * - data/haiti-communes.geojson
 */

(() => {
  "use strict";

  const GEOJSON_URL = "./data/haiti-communes.geojson";
  const $ = id => document.getElementById(id);

  if (
    typeof L === "undefined" ||
    !window.HAITI_TERRITOIRES
  ) {
    console.error(
      "Haïti 2050 : Leaflet ou territoires.js absent."
    );
    return;
  }

  // Utiliser uniquement une véritable instance Leaflet.
  const map = window.haiti2050Map;

  if (
    !map ||
    typeof map.on !== "function" ||
    typeof map.fitBounds !== "function" ||
    typeof map.getZoom !== "function"
  ) {
    console.error(
      "Haïti 2050 : carte Leaflet indisponible. " +
      "Ajouter window.haiti2050Map = map dans app.js."
    );
    return;
  }

  const reference = window.HAITI_TERRITOIRES;

  let communeLayer = null;
  let selectedPolygon = null;

  const polygons = new Map();
  const matchedCommunes = new Set();

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function territoryKey(department, commune) {
    return normalize(department) + "|" +
           normalize(commune);
  }

  const aliases = {
    gonaives: "lesgonaives",
    coteaux: "lescoteaux",
    anseapitres: "anseapitre"
  };

  function canonical(value) {
    const key = normalize(value);
    return aliases[key] || key;
  }

  function getFeatureName(feature) {
    const p = feature.properties || {};

    return (
      p.ADM2_FR ||
      p.ADM2_EN ||
      p.shapeName ||
      p.NAME_2 ||
      p.NAME_3 ||
      p.name ||
      p.nom ||
      ""
    );
  }

  function getFeatureDepartment(feature) {
    const p = feature.properties || {};

    return (
      p.ADM1_FR ||
      p.ADM1_EN ||
      p.department ||
      p.departement ||
      p.NAME_1 ||
      ""
    );
  }

  function findReference(name, department = "") {
    const target = canonical(name);
    const depTarget = normalize(department);
    const matches = [];

    for (const dep of reference.departements) {
      if (
        depTarget &&
        normalize(dep.nom) !== depTarget
      ) {
        continue;
      }

      for (const arr of dep.arrondissements) {
        for (const commune of arr.communes) {
          if (canonical(commune) === target) {
            matches.push({
              department: dep.nom,
              arrondissement: arr.nom,
              commune
            });
          }
        }
      }
    }

    // Ne pas associer arbitrairement des homonymes.
    return matches.length === 1 ? matches[0] : null;
  }

  function currentSelection() {
    return {
      department: $("department")?.value || "",
      arrondissement: $("arrondissement")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  function updateStatus(message) {
    let status = $("communeMapStatus");

    if (!status) {
      status = document.createElement("p");
      status.id = "communeMapStatus";
      status.setAttribute("role", "status");

      status.style.cssText =
        "padding:10px 15px;font-size:13px;" +
        "background:#f1f7f8;color:#234;" +
        "margin:0;";

      const target =
        document.querySelector(".mapCol") ||
        $("map")?.parentElement;

      target?.appendChild(status);
    }

    if (status) {
      status.textContent = message;
    }
  }

  function defaultStyle() {
    return {
      color: "#2563eb",
      weight: 1.5,
      fillColor: "#60a5fa",
      fillOpacity: 0.08
    };
  }

  function selectPolygon(polygon, zoom = true) {
    if (selectedPolygon && communeLayer) {
      communeLayer.resetStyle(selectedPolygon);
    }

    selectedPolygon = polygon;

    if (!polygon) return;

    polygon.setStyle({
      color: "#1d4ed8",
      weight: 3,
      fillColor: "#38bdf8",
      fillOpacity: 0.32
    });

    if (zoom) {
      const bounds = polygon.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [25, 25],
          maxZoom: 12
        });
      }
    }
  }

  function findPolygon(department, commune) {
    return polygons.get(
      territoryKey(department, commune)
    ) || null;
  }

  function syncFromMenus(zoom = false) {
    const selection = currentSelection();

    const polygon = findPolygon(
      selection.department,
      selection.commune
    );

    selectPolygon(polygon, zoom);

    if (selection.commune) {
      updateStatus(
        polygon
          ? "Frontière affichée : " + selection.commune
          : "Commune : " + selection.commune +
            " — frontière non disponible dans cette couche."
      );
    }

    renderCommuneSheet();
  }

  function renderCommuneSheet() {
    const selection = currentSelection();

    let sheet = $("communeSheetV25");

    if (!sheet) {
      sheet = document.createElement("section");
      sheet.id = "communeSheetV25";

      sheet.style.cssText =
        "max-width:1240px;margin:24px auto;" +
        "padding:24px;border:1px solid #dce5ec;" +
        "border-radius:14px;background:#fff;";

      ($("atlas") || $("map")?.parentElement)
        ?.appendChild(sheet);
    }

    sheet.replaceChildren();

    if (!selection.commune) {
      sheet.hidden = true;
      return;
    }

    sheet.hidden = false;

    const polygon = findPolygon(
      selection.department,
      selection.commune
    );

    const heading = document.createElement("h2");
    heading.textContent =
      "Fiche territoriale : " + selection.commune;

    const location = document.createElement("p");
    location.textContent =
      "Département : " + selection.department +
      " | Arrondissement : " +
      selection.arrondissement;

    const geography = document.createElement("p");
    geography.textContent = polygon
      ? "Limite communale disponible sur la carte."
      : "Limite communale non encore disponible " +
        "dans le fichier géographique.";

    const subtitle = document.createElement("h3");
    subtitle.textContent =
      "Développement territorial — Horizon 2050";

    const introduction = document.createElement("p");
    introduction.textContent =
      "Cette fiche rassemble les informations " +
      "administratives disponibles et les projets " +
      "d'aménagement documentés. Les diagnostics, " +
      "budgets et infrastructures existantes " +
      "restent à vérifier localement.";

    const priorities = [
      "Routes et transports",
      "Éducation",
      "Santé",
      "Eau et assainissement",
      "Énergie solaire",
      "Agriculture et commerce"
    ];

    const list = document.createElement("ul");

    priorities.forEach(priority => {
      const item = document.createElement("li");
      item.textContent = priority;
      list.appendChild(item);
    });

    const projectsTitle = document.createElement("h3");
    projectsTitle.textContent =
      "Projets enregistrés pour cette commune";

    const projectList = document.createElement("ul");

    const availableProjects =
      typeof projects !== "undefined" &&
      Array.isArray(projects)
        ? projects
        : [];

    const matchingProjects = availableProjects.filter(
      project =>
        normalize(project.department) ===
          normalize(selection.department) &&
        normalize(project.commune) ===
          normalize(selection.commune)
    );

    if (!matchingProjects.length) {
      const item = document.createElement("li");
      item.textContent =
        "Aucun projet enregistré pour le moment.";
      projectList.appendChild(item);
    } else {
      matchingProjects.forEach(project => {
        const item = document.createElement("li");
        item.textContent =
          project.title + " — " + project.category;
        projectList.appendChild(item);
      });
    }

    const note = document.createElement("p");
    note.style.cssText =
      "font-size:12px;color:#64748b;";

    note.textContent =
      "Fiche évolutive. Les priorités présentées " +
      "sont des thèmes d'étude, pas des projets " +
      "approuvés ni des besoins déjà démontrés.";

    sheet.append(
      heading,
      location,
      geography,
      subtitle,
      introduction,
      list,
      projectsTitle,
      projectList,
      note
    );
  }

  function updateVisibleCommunes() {
    if (!communeLayer) return;

    if (map.getZoom() >= 10) {
      if (!map.hasLayer(communeLayer)) {
        communeLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(communeLayer)) {
        map.removeLayer(communeLayer);
      }
    }
  }

  async function loadCommunes() {
    updateStatus(
      "Chargement des frontières communales..."
    );

    try {
      const response = await fetch(GEOJSON_URL);

      if (!response.ok) {
        throw new Error(
          "HTTP " + response.status +
          " : " + GEOJSON_URL
        );
      }

      const data = await response.json();

      if (
        data.type !== "FeatureCollection" ||
        !Array.isArray(data.features)
      ) {
        throw new Error("GeoJSON invalide.");
      }

      communeLayer = L.geoJSON(data, {
        style: defaultStyle,

        onEachFeature(feature, polygon) {
          const name = getFeatureName(feature);
          const department =
            getFeatureDepartment(feature);

          const referenceCommune =
            findReference(name, department);

          if (referenceCommune) {
            const key = territoryKey(
              referenceCommune.department,
              referenceCommune.commune
            );

            polygons.set(key, polygon);
            matchedCommunes.add(key);
          }

          polygon.bindTooltip(
            name || "Commune non identifiée",
            { sticky: true }
          );

          polygon.on("click", () => {
            if (!referenceCommune) {
              updateStatus(
                "Polygone : " + name +
                " — correspondance administrative " +
                "à vérifier."
              );
              return;
            }

            if (
              typeof selectTerritory === "function"
            ) {
              selectTerritory(
                referenceCommune.department,
                referenceCommune.arrondissement,
                referenceCommune.commune,
                false
              );
            }

            selectPolygon(polygon, true);
            renderCommuneSheet();
          });
        }
      });

      updateVisibleCommunes();

      const total = data.features.length;

      updateStatus(
        total + " polygones chargés ; " +
        matchedCommunes.size +
        " communes associées au répertoire."
      );

      console.log("Haïti 2050 — communes", {
        polygones: total,
        correspondances: matchedCommunes.size
      });

      syncFromMenus(false);

    } catch (error) {
      console.warn(
        "Haïti 2050 — frontières communales :",
        error
      );

      updateStatus(
        "Les fiches communales fonctionnent. " +
        "Pour afficher les frontières, ajouter " +
        "data/haiti-communes.geojson."
      );

      renderCommuneSheet();
    }
  }

  $("department")?.addEventListener(
    "change",
    () => queueMicrotask(() => syncFromMenus(false))
  );

  $("arrondissement")?.addEventListener(
    "change",
    () => queueMicrotask(() => syncFromMenus(false))
  );

  $("commune")?.addEventListener(
    "change",
    () => queueMicrotask(() => syncFromMenus(true))
  );

  document.addEventListener(
    "haiti2050:territorychange",
    () => syncFromMenus(false)
  );

  map.on("zoomend", updateVisibleCommunes);

  loadCommunes();
})();
