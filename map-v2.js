
/* =========================================================
   HAÏTI 2050 — ATLAS TERRITORIAL
   Carte administrative interactive — V2.1

   ADM1 : Départements
   ADM2 : Arrondissements

   Source : geoBoundaries / OpenStreetMap
   Fichiers GeoJSON hébergés localement
   ========================================================= */

(() => {
  "use strict";

  // Vérification des dépendances
  if (typeof L === "undefined" || typeof map === "undefined") {
    console.error(
      "Haïti 2050 : Leaflet ou la carte est indisponible."
    );
    return;
  }

  // Retirer les anciens repères départementaux
  if (typeof markers !== "undefined") {
    markers.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
  }

  // Sources géographiques locales
  const GEOJSON_FILES = {
    ADM1: "./data/haiti-adm1.geojson",
    ADM2: "./data/haiti-adm2.geojson"
  };

  const layers = {};
  let selectedPolygon = null;
  let selectedLevel = null;

  // Normalisation des noms
  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘']/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // Nettoyer les préfixes administratifs
  function normalizeDepartment(value) {
    return normalize(value)
      .replace(/^departement de l /, "")
      .replace(/^departement du /, "")
      .replace(/^departement de /, "")
      .replace(/^department of /, "")
      .replace(/^department /, "")
      .trim();
  }

  // Correspondances entre les noms
  const DEPARTMENT_ALIASES = {
    "ouest": "Ouest",
    "sud": "Sud",
    "sud est": "Sud-Est",
    "grand anse": "Grand'Anse",
    "grande anse": "Grand'Anse",
    "nippes": "Nippes",
    "artibonite": "Artibonite",
    "centre": "Centre",
    "nord": "Nord",
    "nord est": "Nord-Est",
    "nord ouest": "Nord-Ouest"
  };

  // Récupérer le nom du territoire
  function getTerritoryName(feature) {
    const p = feature.properties || {};

    return (
      p.shapeName ||
      p.name ||
      p.NAME ||
      p.NAME_1 ||
      p.NAME_2 ||
      p.nom ||
      "Territoire non identifié"
    );
  }

  // Zone d'information sous la carte
  let status = document.getElementById("mapV2Status");

  if (!status) {
    status = document.createElement("div");
    status.id = "mapV2Status";

    status.style.cssText = `
      padding: 12px 16px;
      font-size: 13px;
      color: #35506a;
      background: #f4f8fa;
      border-top: 1px solid #e0e8ee;
      line-height: 1.6;
    `;

    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    const container = document.querySelector(".mapCol");

    if (container) {
      container.appendChild(status);
    }
  }

  function setStatus(message) {
    status.textContent = message;
  }

  // Sélectionner un département dans l'interface
  function selectMapDepartment(name) {
    const normalizedName = normalizeDepartment(name);

    const mappedName =
      DEPARTMENT_ALIASES[normalizedName] || name;

    const department = departments.find(item =>
      normalize(item.name) === normalize(mappedName)
    );

    if (!department) {
      setStatus(
        "Département non reconnu : " + name
      );
      return false;
    }

    selectDepartment(department.name, false);
    return true;
  }

  // Styles géographiques
  function getStyle(level) {
    if (level === "ADM1") {
      return {
        color: "#007d67",
        weight: 2.5,
        opacity: 1,
        fillColor: "#0aa98c",
        fillOpacity: 0.10
      };
    }

    return {
      color: "#d97706",
      weight: 1.3,
      opacity: 0.9,
      fillColor: "#f59e0b",
      fillOpacity: 0.05
    };
  }

  // Réinitialiser la sélection précédente
  function resetSelectedPolygon() {
    if (!selectedPolygon || !selectedLevel) {
      return;
    }

    const previousLayer = layers[selectedLevel];

    if (
      previousLayer &&
      previousLayer.hasLayer(selectedPolygon)
    ) {
      previousLayer.resetStyle(selectedPolygon);
    }

    selectedPolygon = null;
    selectedLevel = null;
  }

  // Sélectionner un polygone
  function highlightPolygon(polygon, level) {
    resetSelectedPolygon();

    selectedPolygon = polygon;
    selectedLevel = level;

    polygon.setStyle({
      color: "#0d2943",
      weight: 3,
      fillColor: "#38bdf8",
      fillOpacity: 0.30
    });

    if (polygon.bringToFront) {
      polygon.bringToFront();
    }
  }

  // Afficher le territoire sélectionné
  function zoomToPolygon(polygon, level) {
    const bounds = polygon.getBounds();

    if (!bounds.isValid()) {
      return;
    }

    map.fitBounds(bounds, {
      padding: [25, 25],
      maxZoom: level === "ADM1" ? 10 : 12
    });
  }

  // Chargement des données GeoJSON
  async function loadGeoJSON(level) {
    const url = GEOJSON_FILES[level];

    if (!url) {
      throw new Error(
        "Niveau administratif inconnu : " + level
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Fichier introuvable : " + url +
        " — HTTP " + response.status
      );
    }

    const data = await response.json();

    if (
      data.type !== "FeatureCollection" ||
      !Array.isArray(data.features)
    ) {
      throw new Error(
        "Format GeoJSON invalide : " + url
      );
    }

    const layer = L.geoJSON(data, {
      style: () => getStyle(level),

      onEachFeature(feature, polygon) {
        const name = getTerritoryName(feature);

        polygon.bindTooltip(name, {
          sticky: true,
          direction: "auto"
        });

        // Survol
        polygon.on("mouseover", () => {
          if (selectedPolygon !== polygon) {
            polygon.setStyle({
              weight: 3,
              fillOpacity: 0.20
            });
          }
        });

        polygon.on("mouseout", () => {
          if (selectedPolygon !== polygon) {
            layer.resetStyle(polygon);
          }
        });

        // Sélection par clic
        polygon.on("click", event => {
          if (event.originalEvent) {
            L.DomEvent.stopPropagation(
              event.originalEvent
            );
          }

          highlightPolygon(polygon, level);
          zoomToPolygon(polygon, level);

          if (level === "ADM1") {
            const found = selectMapDepartment(name);

            setStatus(
              "Département : " + name +
              (found
                ? " — sélectionné"
                : " — correspondance à vérifier")
            );
          } else {
            // ADM2 = arrondissement, pas commune
            setStatus(
              "Arrondissement : " + name +
              " — niveau ADM2. " +
              "Les communes seront intégrées " +
              "dans une prochaine étape."
            );
          }
        });
      }
    });

    layers[level] = layer;

    return data.features.length;
  }

  // Affichage des couches selon le zoom
  function updateVisibleLayers() {
    const zoom = map.getZoom();

    if (layers.ADM1 && !map.hasLayer(layers.ADM1)) {
      layers.ADM1.addTo(map);
    }

    if (!layers.ADM2) {
      return;
    }

    if (zoom >= 9) {
      if (!map.hasLayer(layers.ADM2)) {
        layers.ADM2.addTo(map);
      }
    } else {
      if (map.hasLayer(layers.ADM2)) {
        map.removeLayer(layers.ADM2);
      }
    }
  }

  // Bouton de retour à la vue nationale
  function setupNationalView() {
    const button = document.getElementById("nationBtn");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      resetSelectedPolygon();

      if (layers.ADM1) {
        const bounds = layers.ADM1.getBounds();

        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [20, 20]
          });
        }
      } else {
        map.setView([18.96, -72.65], 8);
      }

      setStatus("Vue nationale d'Haïti");
    });
  }

  // Légende cartographique
  function addLegend() {
    const legend = L.control({
      position: "bottomright"
    });

    legend.onAdd = function() {
      const div = L.DomUtil.create(
        "div",
        "haiti2050-legend"
      );

      div.style.cssText = `
        background: white;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 12px #0002;
        font-size: 12px;
        line-height: 1.8;
        color: #15283b;
      `;

      div.innerHTML = `
        <strong>Haïti 2050</strong>

        <div>
          <span style="
            display:inline-block;
            width:12px;
            height:12px;
            background:#0aa98c;
            margin-right:6px;
          "></span>
          Départements
        </div>

        <div>
          <span style="
            display:inline-block;
            width:12px;
            height:12px;
            background:#f59e0b;
            margin-right:6px;
          "></span>
          Arrondissements (zoom ≥ 9)
        </div>
      `;

      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);

      return div;
    };

    legend.addTo(map);
  }

   
  // Navigation par arrondissement
  function setupArrondissementSearch() {
    const tools = document.querySelector(".mapTools");

    if (!tools) return;

    const select = document.createElement("select");
    select.id = "arrondissementSelect";
    select.setAttribute(
      "aria-label",
      "Choisir un arrondissement"
    );

    select.style.cssText = `
      width: auto;
      max-width: 260px;
      padding: 9px;
      font-size: 13px;
    `;

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Choisir un arrondissement";
    select.appendChild(firstOption);

    if (layers.ADM2) {
      const territories = [];

      layers.ADM2.eachLayer(polygon => {
        const name = getTerritoryName(
          polygon.feature
        );

        territories.push({
          name,
          polygon
        });
      });

      territories.sort((a, b) =>
        a.name.localeCompare(b.name, "fr")
      );

      territories.forEach((territory, index) => {
        const option = document.createElement("option");

        option.value = String(index);
        option.textContent = territory.name;

        select.appendChild(option);
      });

      select.addEventListener("change", () => {
        if (select.value === "") return;

        const territory =
          territories[Number(select.value)];

        if (!territory) return;

        highlightPolygon(
          territory.polygon,
          "ADM2"
        );

        zoomToPolygon(
          territory.polygon,
          "ADM2"
        );

        setStatus(
          "Arrondissement : " +
          territory.name
        );
      });
    } else {
      select.disabled = true;
    }

    tools.appendChild(select);
  }


  // Initialisation générale
  async function initialize() {
    setStatus(
      "Chargement des frontières administratives…"
    );

    const levels = ["ADM1", "ADM2"];

    const results = await Promise.allSettled(
      levels.map(level => loadGeoJSON(level))
    );

    const labels = {
      ADM1: "Départements",
      ADM2: "Arrondissements"
    };

    const messages = [];

    results.forEach((result, index) => {
      const level = levels[index];

      if (result.status === "fulfilled") {
        messages.push(
          labels[level] + " : " +
          result.value + " territoires chargés"
        );
      } else {
        console.error(
          "Haïti 2050 — erreur " + level,
          result.reason
        );

        messages.push(
          labels[level] + " : chargement impossible"
        );
      }
    });

    // Ajuster la carte sur Haïti
    if (layers.ADM1) {
      const bounds = layers.ADM1.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20]
        });
      }
    }

    // Activer les couches
    updateVisibleLayers();

    map.on("zoomend", updateVisibleLayers);

    setupNationalView();
    addLegend();
    setupArrondissementSearch();

    setStatus(
      messages.join(" | ") +
      " — Source : geoBoundaries / OpenStreetMap"
    );
  }

  // Lancer la carte V2
  initialize().catch(error => {
    console.error(
      "Haïti 2050 — erreur d'initialisation :",
      error
    );

    setStatus(
      "Impossible d'initialiser la carte V2."
    );
  });

})();
