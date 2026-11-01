
/*
 * HAÏTI 2050 — COMMUNES V3.1
 * Frontières communales, zoom automatique et fiches.
 *
 * Dépendances :
 * - Leaflet
 * - territoires.js
 * - app.js
 * - map-v2.js
 *
 * Données :
 * - data/haiti-communes.geojson
 *
 * Les limites affichées proviennent exclusivement du GeoJSON.
 * Aucune frontière n'est inventée.
 */

(() => {
  "use strict";

  const GEOJSON_URL = "./data/haiti-communes.geojson";
  const $ = id => document.getElementById(id);

  const map = window.haiti2050Map;
  const reference = window.HAITI_TERRITOIRES;

  if (
    typeof L === "undefined" ||
    !map ||
    !reference?.departements
  ) {
    console.error(
      "Haïti 2050 : Leaflet, carte ou territoires.js absent."
    );
    return;
  }

  let communeLayer = null;
  let selectedPolygon = null;
  let ready = false;

  const polygons = new Map();
  const matchedCommunes = new Set();

  /*
   * Normalisation des noms :
   * accents, apostrophes, espaces et tirets.
   */
  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  /*
   * Correspondances de noms entre les deux sources.
   *
   * La clé est le nom normalisé du GeoJSON.
   * La valeur est le nom normalisé du répertoire.
   *
   * Ces alias ne modifient aucune géométrie.
   */
  const communeAliases = {
    gonaives: "lesgonaives",
    coteaux: "lescoteaux",
    cornillongrandbois: "cornillon",
    lavallee: "lavalleedejacmel",
    chamsolme: "chansolme",
    anseapitres: "anseapitre"
  };

  const departmentAliases = {
    grandeanse: "grandanse"
  };

  function canonicalCommune(value) {
    const key = normalize(value);
    return communeAliases[key] || key;
  }

  function canonicalDepartment(value) {
    const key = normalize(value);
    return departmentAliases[key] || key;
  }

  function territoryKey(department, commune) {
    return (
      canonicalDepartment(department) +
      "|" +
      canonicalCommune(commune)
    );
  }

  function getFeatureName(feature) {
    const p = feature.properties || {};

    return (
      p.ADM2_FR ||
      p.ADM2_EN ||
      p.shapeName ||
      p.NAME_3 ||
      p.NAME_2 ||
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

  /*
   * Recherche dans le répertoire territorial.
   *
   * On vérifie toujours le département afin
   * d'éviter d'associer deux communes homonymes.
   */
  function findReference(name, department = "") {
    const target = canonicalCommune(name);
    const depTarget = canonicalDepartment(department);
    const matches = [];

    for (const dep of reference.departements) {
      if (
        depTarget &&
        canonicalDepartment(dep.nom) !== depTarget
      ) {
        continue;
      }

      for (const arr of dep.arrondissements) {
        for (const commune of arr.communes) {
          if (
            canonicalCommune(commune) === target
          ) {
            matches.push({
              department: dep.nom,
              arrondissement: arr.nom,
              commune
            });
          }
        }
      }
    }

    // Ne jamais associer arbitrairement des homonymes.
    return matches.length === 1 ? matches[0] : null;
  }

  function currentSelection() {
    return {
      department: $("department")?.value || "",
      arrondissement: $("arrondissement")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  /*
   * Message d'information sous la carte.
   */
  function updateStatus(message) {
    let status = $("communeMapStatus");

    if (!status) {
      status = document.createElement("p");
      status.id = "communeMapStatus";
      status.setAttribute("role", "status");

      status.style.cssText =
        "padding:10px 15px;" +
        "font-size:13px;" +
        "background:#f1f7f8;" +
        "color:#234;" +
        "margin:0;";

      const target =
        document.querySelector(".mapCol") ||
        $("map")?.parentElement;

      target?.appendChild(status);
    }

    status.textContent = message;
  }

  function defaultStyle() {
    return {
      color: "#2563eb",
      weight: 1.5,
      fillColor: "#60a5fa",
      fillOpacity: 0.08
    };
  }

  function findPolygon(department, commune) {
    return polygons.get(
      territoryKey(department, commune)
    ) || null;
  }

  /*
   * Afficher la couche des communes.
   */
  function showCommuneLayer() {
    if (
      communeLayer &&
      !map.hasLayer(communeLayer)
    ) {
      communeLayer.addTo(map);
    }
  }

  /*
   * Zoom sur la véritable limite géographique.
   */
  function zoomToCommune(polygon) {
    if (!polygon?.getBounds) {
      return false;
    }

    const bounds = polygon.getBounds();

    if (!bounds.isValid()) {
      return false;
    }

    showCommuneLayer();

    map.flyToBounds(bounds, {
      padding: [35, 35],
      maxZoom: 14,
      duration: 1.2
    });

    return true;
  }

  /*
   * Sélection et mise en évidence d'une commune.
   */
  function selectPolygon(polygon, zoom = true) {
    if (selectedPolygon && communeLayer) {
      communeLayer.resetStyle(selectedPolygon);
    }

    selectedPolygon = polygon || null;

    if (!polygon) {
      return false;
    }

    showCommuneLayer();

    polygon.setStyle({
      color: "#1d4ed8",
      weight: 3,
      fillColor: "#38bdf8",
      fillOpacity: 0.32
    });

    if (polygon.bringToFront) {
      polygon.bringToFront();
    }

    if (zoom) {
      return zoomToCommune(polygon);
    }

    return true;
  }

  /*
   * Synchronisation avec les menus de app.js.
   */
  function syncFromMenus(zoom = true) {
    const selection = currentSelection();

    if (!selection.commune) {
      selectPolygon(null, false);
      renderCommuneSheet();
      return;
    }

    const polygon = findPolygon(
      selection.department,
      selection.commune
    );

    if (polygon) {
      selectPolygon(polygon, zoom);

      updateStatus(
        "Commune : " +
        selection.commune +
        " — frontière communale affichée."
      );
    } else {
      selectPolygon(null, false);

      updateStatus(
        "Commune : " +
        selection.commune +
        " — frontière géographique indisponible " +
        "ou non associée au répertoire."
      );
    }

    renderCommuneSheet();
  }

  /*
   * Fonction accessible aux autres modules.
   */
  window.haiti2050ZoomToCommune = function(
    department,
    commune
  ) {
    const polygon = findPolygon(department, commune);

    if (!polygon) {
      return false;
    }

    selectPolygon(polygon, true);
    return true;
  };

  /*
   * Création de la fiche territoriale communale.
   */
  function renderCommuneSheet() {
    const selection = currentSelection();

    let sheet = $("communeSheetV25");

    if (!sheet) {
      sheet = document.createElement("section");
      sheet.id = "communeSheetV25";

      sheet.style.cssText =
        "max-width:1240px;" +
        "margin:24px auto;" +
        "padding:24px;" +
        "border:1px solid #dce5ec;" +
        "border-radius:14px;" +
        "background:#fff;";

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
      "Fiche territoriale : " +
      selection.commune;

    const location = document.createElement("p");

    location.textContent =
      "Département : " +
      selection.department +
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
        canonicalDepartment(project.department) ===
          canonicalDepartment(selection.department) &&
        canonicalCommune(project.commune) ===
          canonicalCommune(selection.commune)
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
          project.title +
          " — " +
          project.category;

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

  /*
   * Affichage de la couche selon le niveau de zoom.
   */
  function updateVisibleCommunes() {
    if (!communeLayer) {
      return;
    }

    const selection = currentSelection();

    const shouldShow =
      Boolean(selection.commune) ||
      map.getZoom() >= 10;

    if (shouldShow) {
      showCommuneLayer();
    } else if (map.hasLayer(communeLayer)) {
      map.removeLayer(communeLayer);
    }
  }

  /*
   * Chargement des frontières communales.
   */
  async function loadCommunes() {
    updateStatus(
      "Chargement des frontières communales..."
    );

    try {
      const response = await fetch(GEOJSON_URL);

      if (!response.ok) {
        throw new Error(
          "HTTP " +
          response.status +
          " : " +
          GEOJSON_URL
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

            if (!polygons.has(key)) {
              polygons.set(key, polygon);
              matchedCommunes.add(key);
            } else {
              console.warn(
                "Haïti 2050 : plusieurs polygones " +
                "pour la commune " +
                name
              );
            }
          }

          polygon.bindTooltip(
            referenceCommune?.commune ||
              name ||
              "Commune non identifiée",
            { sticky: true }
          );

          polygon.on("click", event => {
            if (event.originalEvent) {
              L.DomEvent.stopPropagation(
                event.originalEvent
              );
            }

            if (!referenceCommune) {
              updateStatus(
                "Polygone : " +
                name +
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

            updateStatus(
              "Commune : " +
              referenceCommune.commune +
              " — territoire sélectionné."
            );
          });
        }
      });

      ready = true;

      updateVisibleCommunes();

      updateStatus(
        data.features.length +
        " polygones chargés ; " +
        matchedCommunes.size +
        " communes associées au répertoire."
      );

      console.log(
        "Haïti 2050 — communes V3.1",
        {
          polygones: data.features.length,
          correspondances: matchedCommunes.size,
          communesRepertoire:
            reference.departements.reduce(
              (total, dep) =>
                total +
                dep.arrondissements.reduce(
                  (sum, arr) =>
                    sum + arr.communes.length,
                  0
                ),
              0
            )
        }
      );

      /*
       * Synchroniser la sélection éventuellement
       * effectuée pendant le chargement.
       */
      syncFromMenus(
        Boolean(currentSelection().commune)
      );
    } catch (error) {
      console.warn(
        "Haïti 2050 — frontières communales :",
        error
      );

      updateStatus(
        "Les fiches communales fonctionnent. " +
        "Pour afficher les frontières, vérifier " +
        "data/haiti-communes.geojson."
      );

      renderCommuneSheet();
    }
  }

  /*
   * Un seul événement de navigation territoriale
   * évite les zooms concurrents.
   */
  document.addEventListener(
    "haiti2050:territorychange",
    () => {
      if (!ready) {
        return;
      }

      const selection = currentSelection();

      syncFromMenus(Boolean(selection.commune));
      updateVisibleCommunes();
    }
  );

  map.on("zoomend", updateVisibleCommunes);

  loadCommunes();
})();
