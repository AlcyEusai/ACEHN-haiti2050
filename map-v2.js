
/* =========================================================
   HAÏTI 2050 — ATLAS TERRITORIAL
   Carte administrative interactive — V2
   Source géographique : fichiers GeoJSON locaux
   ========================================================= */

(() => {
  "use strict";

  // Vérification de Leaflet et de la carte existante
  if (typeof L === "undefined" || typeof map === "undefined") {
    console.error("Haïti 2050 : Leaflet ou la carte est indisponible.");
    return;
  }

  // Supprimer les anciens repères départementaux
  if (typeof markers !== "undefined") {
    markers.forEach(marker => {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
  }

  // Fichiers géographiques locaux
  const GEOJSON_FILES = {
    ADM1: "./data/haiti-adm1.geojson",
    ADM2: "./data/haiti-adm2.geojson"
  };

  const layers = {};
  let selectedPolygon = null;

  // Normaliser les noms des territoires
  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  // Zone d'information
  const status = document.createElement("div");

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

  const mapContainer = document.querySelector(".mapCol");

  if (mapContainer) {
    mapContainer.appendChild(status);
  }

  function setStatus(message) {
    status.textContent = message;
  }

  // Récupérer le nom d'un territoire
  function getTerritoryName(feature) {
    const properties = feature.properties || {};

    return (
      properties.shapeName ||
      properties.name ||
      properties.NAME ||
      properties.NAME_1 ||
      properties.NAME_2 ||
      properties.nom ||
      "Territoire non identifié"
    );
  }

  // Sélectionner un département
  function selectMapDepartment(name) {
    const department = departments.find(item =>
      normalize(item.name) === normalize(name)
    );

    if (!department) {
      setStatus(
        "Département : " + name +
        " — correspondance à vérifier."
      );
      return;
    }

    selectDepartment(department.name, false);
  }

  // Sélectionner une commune
  function selectMapCommune(name) {
    const matches = [];

    departments.forEach(department => {
      department.communes.forEach(commune => {
        if (normalize(commune) === normalize(name)) {
          matches.push({
            department: department.name,
            commune
          });
        }
      });
    });

    // Ne pas attribuer une commune au mauvais département
    if (matches.length !== 1) {
      setStatus(
        "Commune : " + name +
        " — identification administrative à vérifier."
      );
      return;
    }

    const match = matches[0];

    selectDepartment(match.department, false);

    currentCommune = match.commune;

    const communeSelect =
      document.getElementById("commune");

    if (communeSelect) {
      communeSelect.value = match.commune;
    }

    renderSelection();
  }

  // Styles des frontières
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
      weight: 1.2,
      opacity: 0.85,
      fillColor: "#f59e0b",
      fillOpacity: 0.04
    };
  }

  // Chargement d'un fichier GeoJSON
  async function loadGeoJSON(level) {
    const url = GEOJSON_FILES[level];

    if (!url) {
      throw new Error("Niveau administratif inconnu : " + level);
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        "Impossible de charger " + url +
        " (HTTP " + response.status + ")"
      );
    }

    const data = await response.json();

    if (
      data.type !== "FeatureCollection" ||
      !Array.isArray(data.features)
    ) {
      throw new Error(
        "Le fichier " + url +
        " ne contient pas une collection GeoJSON valide."
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

        // Survol du territoire
        polygon.on("mouseover", () => {
          polygon.setStyle({
            weight: 3,
            fillOpacity: 0.25
          });

          if (polygon.bringToFront) {
            polygon.bringToFront();
          }
        });

        polygon.on("mouseout", () => {
          if (selectedPolygon !== polygon) {
            layer.resetStyle(polygon);
          }
        });

        // Clic sur un territoire
        polygon.on("click", () => {
          if (selectedPolygon) {
            const oldLayer =
              layers.ADM1?.hasLayer(selectedPolygon)
                ? layers.ADM1
                : layers.ADM2;

            if (oldLayer) {
              oldLayer.resetStyle(selectedPolygon);
            }
          }

          selectedPolygon = polygon;

          polygon.setStyle({
            color: "#0d2943",
            weight: 3,
            fillOpacity: 0.30
          });

          const bounds = polygon.getBounds();

          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              padding: [25, 25],
              maxZoom: level === "ADM1" ? 10 : 12
            });
          }

          if (level === "ADM1") {
            selectMapDepartment(name);
          } else {
            selectMapCommune(name);
          }

          setStatus(
            (level === "ADM1"
              ? "Département : "
              : "Division ADM2 : ") + name
          );
        });
      }
    });

    layers[level] = layer;

    return data.features.length;
  }

  // Affichage selon le niveau de zoom
  function updateVisibleLayers() {
    const zoom = map.getZoom();

    if (layers.ADM1 && !map.hasLayer(layers.ADM1)) {
      layers.ADM1.addTo(map);
    }

    if (layers.ADM2) {
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
  }

  // Bouton vue nationale
  function setupNationalView() {
    const button = document.getElementById("nationBtn");

    if (!button) return;

    button.addEventListener("click", () => {
      if (layers.ADM1) {
        map.fitBounds(layers.ADM1.getBounds(), {
          padding: [20, 20]
        });
      } else {
        map.setView([18.96, -72.65], 8);
      }

      setStatus("Vue nationale d'Haïti");
    });
  }

  // Initialisation
  async function initialize() {
    setStatus("Chargement des frontières administratives…");

    const results = await Promise.allSettled([
      loadGeoJSON("ADM1"),
      loadGeoJSON("ADM2")
    ]);

    const labels = {
      ADM1: "Départements",
      ADM2: "Communes (ADM2)"
    };

    const levels = ["ADM1", "ADM2"];
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

    if (layers.ADM1) {
      const bounds = layers.ADM1.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20]
        });
      }
    }

    updateVisibleLayers();

    map.on("zoomend", updateVisibleLayers);

    setupNationalView();

    // Légende cartographique
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
          Communes (zoom ≥ 9)
        </div>
      `;

      return div;
    };

    legend.addTo(map);

    setStatus(
      messages.join(" | ") +
      " — Source : geoBoundaries"
    );
  }

  initialize().catch(error => {
    console.error("Erreur d'initialisation :", error);

    setStatus(
      "Erreur lors de l'initialisation de la carte."
    );
  });
})();
