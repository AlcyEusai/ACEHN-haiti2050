
/*
 * HAÏTI 2050 — ATLAS TERRITORIAL
 * Carte administrative interactive — V3
 *
 * ADM1 : Départements
 * ADM2 : Arrondissements
 *
 * Synchronisation :
 * - Menus territoriaux vers carte
 * - Carte vers menus territoriaux
 * - Zoom automatique sur les frontières
 * - Retour à la vue nationale
 *
 * Sources : geoBoundaries / OpenStreetMap
 */

(() => {
  "use strict";

  const map = window.haiti2050Map;

  if (
    typeof L === "undefined" ||
    !map ||
    typeof map.fitBounds !== "function"
  ) {
    console.error(
      "Haïti 2050 : carte Leaflet indisponible."
    );
    return;
  }

  const GEOJSON_FILES = {
    ADM1: "./data/haiti-adm1.geojson",
    ADM2: "./data/haiti-adm2.geojson"
  };

  const layers = {};
  const polygons = {
    ADM1: [],
    ADM2: []
  };

  let selectedPolygon = null;
  let selectedLevel = null;
  let arrondissementSelect = null;

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘']/g, " ")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function normalizeDepartment(value) {
    return normalize(value)
      .replace(/^departement de l /, "")
      .replace(/^departement du /, "")
      .replace(/^departement de /, "")
      .replace(/^department of /, "")
      .replace(/^department /, "")
      .trim();
  }

  function normalizeArrondissement(value) {
    return normalize(value)
      .replace(/^arrondissement de l /, "")
      .replace(/^arrondissement des /, "")
      .replace(/^arrondissement du /, "")
      .replace(/^arrondissement de /, "")
      .replace(/^arrondissement d /, "")
      .replace(/^arrondissement /, "")
      .trim();
  }

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

  function getTerritoryName(feature) {
    const p = feature?.properties || {};

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

  // Zone d'information sous la carte.
  let status = document.getElementById("mapV2Status");

  if (!status) {
    status = document.createElement("div");
    status.id = "mapV2Status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    status.style.cssText = `
      padding:12px 16px;
      font-size:13px;
      color:#35506a;
      background:#f4f8fa;
      border-top:1px solid #e0e8ee;
      line-height:1.6;
    `;

    document.querySelector(".mapCol")?.appendChild(status);
  }

  function setStatus(message) {
    if (status) status.textContent = message;
  }

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

  function resetSelectedPolygon() {
    if (selectedPolygon && selectedLevel) {
      const layer = layers[selectedLevel];

      if (layer && layer.hasLayer(selectedPolygon)) {
        layer.resetStyle(selectedPolygon);
      }
    }

    selectedPolygon = null;
    selectedLevel = null;
  }

  function highlightPolygon(polygon, level) {
    if (!polygon) return;

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

  function zoomToPolygon(polygon, level) {
    if (!polygon || !polygon.getBounds) return false;

    const bounds = polygon.getBounds();

    if (!bounds.isValid()) return false;

    map.flyToBounds(bounds, {
      padding: [25, 25],
      maxZoom: level === "ADM1" ? 10 : 12,
      duration: 1.2
    });

    return true;
  }

  function findDepartment(name) {
    const wanted = normalizeDepartment(name);

    return polygons.ADM1.find(item =>
      normalizeDepartment(item.name) === wanted
    );
  }

  function findArrondissement(name) {
    const wanted = normalizeArrondissement(name);

    return polygons.ADM2.find(item =>
      normalizeArrondissement(item.name) === wanted
    );
  }

  // Synchronisation depuis les menus.
  function zoomFromMenus(detail = null) {
    const departmentName =
      detail?.department ??
      document.getElementById("department")?.value ??
      "";

    const arrondissementName =
      detail?.arrondissement ??
      document.getElementById("arrondissement")?.value ??
      "";

    const communeName =
      detail?.commune ??
      document.getElementById("commune")?.value ??
      "";

    // Les communes sont gérées par communes-v25.js.
    if (communeName) {
      return;
    }

    if (arrondissementName) {
      const found = findArrondissement(arrondissementName);

      if (found) {
        highlightPolygon(found.polygon, "ADM2");
        zoomToPolygon(found.polygon, "ADM2");

        setStatus(
          "Arrondissement : " + arrondissementName
        );

        return;
      }
    }

    if (departmentName) {
      const found = findDepartment(departmentName);

      if (found) {
        highlightPolygon(found.polygon, "ADM1");
        zoomToPolygon(found.polygon, "ADM1");

        setStatus(
          "Département : " + departmentName
        );

        return;
      }
    }

    resetSelectedPolygon();

    if (layers.ADM1) {
      const bounds = layers.ADM1.getBounds();

      if (bounds.isValid()) {
        map.flyToBounds(bounds, {
          padding: [20, 20],
          duration: 1.2
        });
      }
    }

    setStatus("Vue nationale d'Haïti");
  }

  // Associer un département du GeoJSON au répertoire.
  function selectMapDepartment(name) {
    const normalizedName = normalizeDepartment(name);

    const mappedName =
      DEPARTMENT_ALIASES[normalizedName] || name;

    if (typeof departments === "undefined") {
      return false;
    }

    const department = departments.find(item =>
      normalize(item.name) === normalize(mappedName)
    );

    if (!department) return false;

    if (typeof selectDepartment === "function") {
      selectDepartment(department.name, false);
      return true;
    }

    return false;
  }

  // Associer un arrondissement au répertoire.
  function selectMapArrondissement(name) {
    const data = window.HAITI_TERRITOIRES;

    if (!data?.departements) return false;

    const wanted = normalizeArrondissement(name);

    for (const department of data.departements) {
      for (const arrondissement of department.arrondissements) {
        if (
          normalizeArrondissement(arrondissement.nom) === wanted
        ) {
          if (typeof selectTerritory === "function") {
            selectTerritory(
              department.nom,
              arrondissement.nom,
              null,
              false
            );

            return true;
          }
        }
      }
    }

    return false;
  }

  // Chargement GeoJSON.
  async function loadGeoJSON(level) {
    const url = GEOJSON_FILES[level];

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

        polygons[level].push({
          name,
          polygon
        });

        polygon.bindTooltip(name, {
          sticky: true,
          direction: "auto"
        });

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
            const found = selectMapArrondissement(name);

            setStatus(
              "Arrondissement : " + name +
              (found
                ? " — sélectionné"
                : " — correspondance à vérifier")
            );
          }
        });
      }
    });

    layers[level] = layer;

    return data.features.length;
  }

  // Afficher les arrondissements à partir du zoom 9.
  function updateVisibleLayers() {
    const zoom = map.getZoom();

    if (layers.ADM1 && !map.hasLayer(layers.ADM1)) {
      layers.ADM1.addTo(map);
    }

    if (!layers.ADM2) return;

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

  // Navigation par arrondissement dans la barre de carte.
  function setupArrondissementSearch() {
    const tools = document.querySelector(".mapTools");

    if (!tools) return;

    document.getElementById("arrondissementSelect")?.remove();

    const select = document.createElement("select");
    select.id = "arrondissementSelect";
    select.setAttribute(
      "aria-label",
      "Choisir un arrondissement"
    );

    select.style.cssText = `
      width:auto;
      max-width:260px;
      padding:9px;
      font-size:13px;
    `;

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Choisir un arrondissement";
    select.appendChild(firstOption);

    const territories = [...polygons.ADM2].sort((a, b) =>
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

      const territory = territories[Number(select.value)];

      if (!territory) return;

      highlightPolygon(territory.polygon, "ADM2");
      zoomToPolygon(territory.polygon, "ADM2");

      selectMapArrondissement(territory.name);

      setStatus(
        "Arrondissement : " + territory.name
      );
    });

    tools.appendChild(select);
    arrondissementSelect = select;
  }

  // Synchronisation des changements territoriaux.
  document.addEventListener(
    "haiti2050:territorychange",
    event => {
      zoomFromMenus(event.detail);
    }
  );

  // Bouton Vue nationale.
  function setupNationalView() {
    const button = document.getElementById("nationBtn");

    if (!button) return;

    button.addEventListener("click", () => {
      resetSelectedPolygon();

      if (arrondissementSelect) {
        arrondissementSelect.value = "";
      }

      if (layers.ADM1) {
        const bounds = layers.ADM1.getBounds();

        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [20, 20],
            duration: 1.2
          });
        }
      }

      setStatus("Vue nationale d'Haïti");
    });
  }

  // Légende cartographique.
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
        background:white;
        padding:12px;
        border-radius:8px;
        box-shadow:0 2px 12px #0002;
        font-size:12px;
        line-height:1.8;
        color:#15283b;
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

  // Initialisation générale.
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

    updateVisibleLayers();

    map.on("zoomend", updateVisibleLayers);

    setupNationalView();
    setupArrondissementSearch();
    addLegend();

    // Affichage national au démarrage.
    if (layers.ADM1) {
      const bounds = layers.ADM1.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20]
        });
      }
    }

    setStatus(
      messages.join(" | ") +
      " — Source : geoBoundaries / OpenStreetMap"
    );
  }

  initialize().catch(error => {
    console.error(
      "Haïti 2050 — erreur d'initialisation :",
      error
    );

    setStatus(
      "Impossible d'initialiser la carte."
    );
  });
})();
