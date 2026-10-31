
/*
 * HAÏTI 2050 — Sections communales
 * Source : couche géographique ArcGIS / OCHA
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const URL = "./data/haiti-sections.geojson";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  let features = [];

  function getField(properties, names) {
    for (const name of names) {
      if (properties[name] != null) {
        return String(properties[name]);
      }
    }
    return "";
  }

  function render() {
    let panel = $("sectionsPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "sectionsPanel";
      panel.style.cssText =
        "max-width:1240px;margin:24px auto;" +
        "padding:24px;background:white;" +
        "border:1px solid #dce5ec;" +
        "border-radius:14px;";

      $("atlas").appendChild(panel);
    }

    panel.replaceChildren();

    const department = $("department")?.value || "";
    const commune = $("commune")?.value || "";

    const title = document.createElement("h2");
    title.textContent =
      "Sections communales de " + commune;

    const list = document.createElement("ul");
    const found = new Set();

    for (const feature of features) {
      const p = feature.properties || {};

      const parentCommune = getField(p, [
        "ADM2_FR", "ADM2_EN",
        "commune", "COMMUNE"
      ]);

      const parentDepartment = getField(p, [
        "ADM1_FR", "ADM1_EN",
        "department", "DEPARTEMENT"
      ]);

      const section = getField(p, [
        "ADM3_FR", "ADM3_EN",
        "section", "SECTION"
      ]);

      if (
        normalize(parentCommune) === normalize(commune) &&
        (!parentDepartment ||
         normalize(parentDepartment) ===
           normalize(department)) &&
        section
      ) {
        found.add(section);
      }
    }

    [...found].sort((a, b) =>
      a.localeCompare(b, "fr")
    ).forEach(name => {
      const li = document.createElement("li");
      li.textContent = name;
      list.appendChild(li);
    });

    if (!found.size) {
      const li = document.createElement("li");
      li.textContent =
        "Aucune section associée avec certitude " +
        "dans le fichier géographique.";
      list.appendChild(li);
    }

    const note = document.createElement("p");
    note.style.fontSize = "13px";
    note.textContent =
      found.size + " section(s) identifiée(s). " +
      "Les résultats dépendent de la couverture " +
      "et des attributs de la source.";

    panel.append(title, list, note);
  }

  async function initialize() {
    try {
      const response = await fetch(URL);

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const geojson = await response.json();

      if (
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
      ) {
        throw new Error("Format GeoJSON invalide");
      }

      features = geojson.features;
      console.log(
        "Sections chargées :", features.length
      );

    } catch (error) {
      console.error(
        "Impossible de charger les sections :", error
      );
    }

    render();
  }

  document.addEventListener(
    "haiti2050:territorychange",
    render
  );

  ["department", "arrondissement", "commune"]
    .forEach(id => {
      $(id)?.addEventListener("change", () => {
        queueMicrotask(render);
      });
    });

  initialize();
})();
