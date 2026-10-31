
/*
 * HAÏTI 2050 — Répertoire des sections communales
 * Source : data/haiti-sections.geojson
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const normalize = value =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

  let sections = [];

  function currentTerritory() {
    return {
      department: $("department")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

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
    // le GeoJSON rattache Fond des Blancs à Aquin.
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

    return sections.filter(section =>
      sameCommune(section, department, commune)
    );
  }

  function renderSections() {
    let panel = $("sectionsRepertoire");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "sectionsRepertoire";
      panel.className = "sidebarSection";

      const localityList = $("localities");
      const parent = localityList?.closest(".sidebarSection");

      if (parent) {
        parent.insertAdjacentElement("beforebegin", panel);
      } else {
        $("atlas")?.appendChild(panel);
      }
    }

    panel.replaceChildren();

    const title = document.createElement("h3");
    title.textContent = "Sections communales";

    const list = document.createElement("ul");
    const matches = getCurrentSections();

    if (!matches.length) {
      const li = document.createElement("li");
      li.textContent =
        "Aucune section correspondante dans ce répertoire.";
      list.appendChild(li);
    } else {
      matches.forEach(section => {
        const li = document.createElement("li");
        li.textContent = section.name;
        li.title = "Code : " + section.code;
        list.appendChild(li);
      });
    }

    const note = document.createElement("small");
    note.textContent =
      "Données historiques du GeoJSON : " +
      "rattachements administratifs à vérifier.";

    panel.append(title, list, note);
  }

  function searchSections(query) {
    const target = normalize(query);

    return sections.filter(section =>
      !target ||
      normalize(section.name).includes(target)
    );
  }

  window.haiti2050SearchSections = searchSections;

  async function loadSections() {
    try {
      const response = await fetch(
        "./data/haiti-sections.geojson"
      );

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const geojson = await response.json();

      if (
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
      ) {
        throw new Error("GeoJSON invalide");
      }

      sections = geojson.features.map(feature => {
        const p = feature.properties || {};

        return {
          name: String(p.ADM3_FR || "").trim(),
          commune: String(p.ADM2_FR || "").trim(),
          department: String(p.ADM1_FR || "").trim(),
          code: String(p.ADM3_PCODE || "").trim()
        };
      }).filter(section =>
        section.name &&
        section.commune &&
        section.department
      );

      console.log(
        "Haïti 2050 : " +
        sections.length +
        " sections communales chargées."
      );

      renderSections();

      document.dispatchEvent(
        new CustomEvent("haiti2050:sectionsloaded", {
          detail: { count: sections.length }
        })
      );
    } catch (error) {
      console.error(
        "Impossible de charger les sections :",
        error
      );
    }
  }

  document.addEventListener(
    "haiti2050:territorychange",
    renderSections
  );

  loadSections();
})();
