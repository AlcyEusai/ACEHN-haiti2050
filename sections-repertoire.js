
/*
 * HAÏTI 2050 — RÉPERTOIRE DES SECTIONS COMMUNALES V3
 *
 * Fonctionnalités :
 * - Chargement des sections depuis le GeoJSON
 * - Affichage selon la commune sélectionnée
 * - Clic sur une section pour zoomer sur ses frontières
 * - Mise en évidence du territoire sélectionné
 * - Synchronisation avec la navigation territoriale
 * - Conservation des correspondances historiques
 *
 * Source : data/haiti-sections.geojson
 * Dépendances : Leaflet, app.js
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const map = window.haiti2050Map;

  const GEOJSON_URL = "./data/haiti-sections.geojson";

  const normalize = value =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

  let sections = [];
  let sectionLayer = null;
  let selectedPolygon = null;
  let selectedSection = null;

  function currentTerritory() {
    return {
      department: $("department")?.value || "",
      arrondissement: $("arrondissement")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  // Correspondance administrative des sections.
  function sameCommune(section, department, commune) {
    if (
      normalize(section.department) !==
      normalize(department)
    ) {
      return false;
    }

    if (
      normalize(section.commune) ===
      normalize(commune)
    ) {
      return true;
    }

    // Correspondance historique à vérifier :
    // Fond-des-Blancs apparaît sous Aquin
    // dans certaines données géographiques.
    if (
      normalize(department) === "sud" &&
      normalize(commune) === "fonddesblancs" &&
      normalize(section.commune) === "aquin" &&
      normalize(section.name).includes("fonddesblancs")
    ) {
      return true;
    }

    return false;
  }

  function getCurrentSections() {
    const { department, commune } = currentTerritory();

    if (!department || !commune) return [];

    return sections.filter(section =>
      sameCommune(section, department, commune)
    );
  }

  // Style des frontières communales de niveau section.
  function defaultStyle() {
    return {
      color: "#9333ea",
      weight: 1.4,
      opacity: 0.85,
      fillColor: "#c084fc",
      fillOpacity: 0.07
    };
  }

  function selectedStyle() {
    return {
      color: "#6b21a8",
      weight: 3,
      opacity: 1,
      fillColor: "#a855f7",
      fillOpacity: 0.30
    };
  }

  // Afficher la couche des sections.
  function showSectionLayer() {
    if (!map || !sectionLayer) return;

    if (!map.hasLayer(sectionLayer)) {
      sectionLayer.addTo(map);
    }
  }

  // Zoom précis sur le polygone.
  function zoomToSection(section) {
    if (!map || !section?.polygon) {
      return false;
    }

    const bounds = section.polygon.getBounds();

    if (!bounds.isValid()) {
      console.warn(
        "Haïti 2050 : limites géographiques invalides.",
        section.name
      );
      return false;
    }

    showSectionLayer();

    map.flyToBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
      duration: 1.3
    });

    return true;
  }

  // Mettre en évidence la section choisie.
  function highlightSection(section, zoom = true) {
    if (!section || !section.polygon) return false;

    if (selectedPolygon && sectionLayer) {
      sectionLayer.resetStyle(selectedPolygon);
    }

    selectedPolygon = section.polygon;
    selectedSection = section;

    showSectionLayer();

    selectedPolygon.setStyle(selectedStyle());

    if (selectedPolygon.bringToFront) {
      selectedPolygon.bringToFront();
    }

    if (zoom) {
      zoomToSection(section);
    }

    document.dispatchEvent(
      new CustomEvent("haiti2050:sectionchange", {
        detail: {
          name: section.name,
          code: section.code,
          commune: section.commune,
          department: section.department
        }
      })
    );

    return true;
  }

  // Effacer la sélection précédente.
  function clearSelectedSection() {
    if (selectedPolygon && sectionLayer) {
      sectionLayer.resetStyle(selectedPolygon);
    }

    selectedPolygon = null;
    selectedSection = null;
  }

  // Affichage des sections dans le répertoire.
  function renderSections() {
    let panel = $("sectionsRepertoire");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "sectionsRepertoire";
      panel.className = "sidebarSection";

      const localityList = $("localities");
      const parent =
        localityList?.closest(".sidebarSection");

      if (parent) {
        parent.insertAdjacentElement(
          "beforebegin",
          panel
        );
      } else {
        $("atlas")?.appendChild(panel);
      }
    }

    panel.replaceChildren();

    const title = document.createElement("h3");
    title.textContent = "Sections communales";

    const list = document.createElement("ul");
    const matches = getCurrentSections();

    if (!currentTerritory().commune) {
      const li = document.createElement("li");

      li.textContent =
        "Sélectionnez une commune pour consulter " +
        "ses sections communales.";

      list.appendChild(li);

    } else if (!matches.length) {
      const li = document.createElement("li");

      li.textContent =
        "Aucune section correspondante dans ce répertoire.";

      list.appendChild(li);

    } else {
      matches.forEach(section => {
        const li = document.createElement("li");

        const button = document.createElement("button");
        button.type = "button";
        button.className = "sectionZoomButton";

        button.textContent = section.name;

        button.title =
          "Voir sur la carte — Code : " +
          (section.code || "non renseigné");

        button.style.cssText = `
          display:block;
          width:100%;
          text-align:left;
          padding:10px 12px;
          margin:4px 0;
          background:#f5f3ff;
          border:1px solid #ddd6fe;
          border-radius:8px;
          color:#581c87;
          cursor:pointer;
          font-size:14px;
        `;

        button.addEventListener("click", () => {
          const success = highlightSection(section, true);

          if (!success) {
            alert(
              "Les frontières de cette section " +
              "ne sont pas disponibles."
            );
            return;
          }

          // Faire défiler vers la carte.
          $("map")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        });

        li.appendChild(button);
        list.appendChild(li);
      });
    }

    const note = document.createElement("small");

    note.textContent =
      "Source : fichier GeoJSON des sections communales. " +
      "Les rattachements administratifs historiques " +
      "et les limites restent à vérifier.";

    panel.append(title, list, note);
  }

  // Recherche globale des sections.
  function searchSections(query) {
    const target = normalize(query);

    return sections.filter(section =>
      !target ||
      normalize(section.name).includes(target)
    );
  }

  window.haiti2050SearchSections = searchSections;

  // Zoom sur une section depuis un autre module.
  window.haiti2050ZoomToSection = function(
    department,
    commune,
    sectionName
  ) {
    const matches = sections.filter(section =>
      sameCommune(section, department, commune) &&
      normalize(section.name) ===
        normalize(sectionName)
    );

    // Ne pas sélectionner arbitrairement
    // une section si plusieurs correspondent.
    if (matches.length !== 1) {
      return false;
    }

    return highlightSection(matches[0], true);
  };

  // Affichage conditionnel des frontières.
  function updateVisibleSections() {
    if (!map || !sectionLayer) return;

    const territory = currentTerritory();

    const shouldShow =
      Boolean(territory.commune) &&
      (
        map.getZoom() >= 11 ||
        Boolean(selectedSection)
      );

    if (shouldShow) {
      showSectionLayer();
    } else if (map.hasLayer(sectionLayer)) {
      map.removeLayer(sectionLayer);
    }
  }

  // Chargement du GeoJSON.
  async function loadSections() {
    try {
      const response = await fetch(GEOJSON_URL);

      if (!response.ok) {
        throw new Error(
          "HTTP " + response.status +
          " — " + GEOJSON_URL
        );
      }

      const geojson = await response.json();

      if (
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
      ) {
        throw new Error("GeoJSON invalide.");
      }

      if (!map || typeof L === "undefined") {
        throw new Error(
          "Carte Leaflet indisponible."
        );
      }

      sectionLayer = L.geoJSON(geojson, {
        style: defaultStyle,

        onEachFeature(feature, polygon) {
          const p = feature.properties || {};

          const section = {
            name: String(p.ADM3_FR || "").trim(),
            commune: String(p.ADM2_FR || "").trim(),
            department: String(p.ADM1_FR || "").trim(),
            code: String(p.ADM3_PCODE || "").trim(),
            polygon
          };

          if (
            !section.name ||
            !section.commune ||
            !section.department
          ) {
            return;
          }

          sections.push(section);

          polygon.bindTooltip(
            section.name,
            {
              sticky: true,
              direction: "auto"
            }
          );

          // Clic direct sur la carte.
          polygon.on("click", event => {
            if (event.originalEvent) {
              L.DomEvent.stopPropagation(
                event.originalEvent
              );
            }

            const territory = currentTerritory();

            if (
              !sameCommune(
                section,
                territory.department,
                territory.commune
              )
            ) {
              // Ne pas modifier automatiquement la commune
              // en raison des rattachements historiques.
              return;
            }

            highlightSection(section, true);
          });
        }
      });

      console.log(
        "Haïti 2050 : " +
        sections.length +
        " sections communales chargées."
      );

      renderSections();
      updateVisibleSections();

      document.dispatchEvent(
        new CustomEvent("haiti2050:sectionsloaded", {
          detail: {
            count: sections.length
          }
        })
      );

    } catch (error) {
      console.error(
        "Impossible de charger les sections :",
        error
      );

      renderSections();
    }
  }

  // Réinitialiser les sections lorsque la commune change.
  document.addEventListener(
    "haiti2050:territorychange",
    () => {
      clearSelectedSection();
      renderSections();
      updateVisibleSections();
    }
  );

  if (map) {
    map.on("zoomend", updateVisibleSections);
  }

  loadSections();
})();
