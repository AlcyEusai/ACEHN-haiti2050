
/*
 * HAÏTI 2050 — Répertoire des quartiers et localités
 * Compatible avec app.js V2.4
 *
 * Chaque commune dispose d'une fiche locale.
 * Les données ajoutées sont conservées dans
 * le navigateur et restent à vérifier.
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const data = window.HAITI_TERRITOIRES;

  if (!data || !Array.isArray(data.departements)) {
    console.error("Répertoire territorial indisponible.");
    return;
  }

  const STORAGE_KEY = "haiti2050-quartiers";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘']/g, "'")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function readData() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || {};
    } catch {
      return {};
    }
  }

  const saved = readData();

  function getKey(department, commune) {
    return normalize(department) + "|" +
           normalize(commune);
  }

  function currentTerritory() {
    return {
      department: $("department")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  function getQuartiers() {
    const current = currentTerritory();
    const key = getKey(
      current.department,
      current.commune
    );

    return saved[key] || [];
  }

  function saveQuartier(name) {
    const current = currentTerritory();

    if (!current.department || !current.commune) {
      alert("Sélectionnez d'abord une commune.");
      return;
    }

    const key = getKey(
      current.department,
      current.commune
    );

    saved[key] ||= [];

    const exists = saved[key].some(
      item => normalize(item) === normalize(name)
    );

    if (!exists) {
      saved[key].push(name);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(saved)
        );
      } catch {
        alert("Impossible d'enregistrer ce quartier.");
      }
    }

    renderQuartiers();
  }

  function renderQuartiers() {
    const current = currentTerritory();

    let container = $("quartiersPanel");

    if (!container) {
      container = document.createElement("section");
      container.id = "quartiersPanel";

      container.style.cssText =
        "max-width:1240px;margin:24px auto;" +
        "padding:24px;background:#fff;" +
        "border:1px solid #dce5ec;" +
        "border-radius:14px;";

      $("atlas")?.appendChild(container);
    }

    container.replaceChildren();

    if (!current.commune) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    const title = document.createElement("h2");
    title.textContent =
      "Quartiers et localités de " +
      current.commune;

    const note = document.createElement("p");
    note.textContent =
      "Répertoire participatif. Les quartiers " +
      "ajoutés sont enregistrés uniquement dans " +
      "ce navigateur et doivent être vérifiés.";

    const list = document.createElement("ul");

    const quartiers = getQuartiers();

    if (!quartiers.length) {
      const li = document.createElement("li");
      li.textContent =
        "Aucun quartier encore documenté.";
      list.appendChild(li);
    } else {
      quartiers.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        list.appendChild(li);
      });
    }

    const input = document.createElement("input");
    input.id = "newQuartier";
    input.placeholder = "Nom du quartier ou de la localité";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = "+ Ajouter un quartier";

    button.addEventListener("click", () => {
      const name = input.value.trim();

      if (!name) return;

      saveQuartier(name);
    });

    container.append(
      title,
      note,
      list,
      input,
      button
    );
  }

  $("department")?.addEventListener(
    "change",
    () => queueMicrotask(renderQuartiers)
  );

  $("arrondissement")?.addEventListener(
    "change",
    () => queueMicrotask(renderQuartiers)
  );

  $("commune")?.addEventListener(
    "change",
    () => queueMicrotask(renderQuartiers)
  );

  document.addEventListener(
    "haiti2050:territorychange",
    renderQuartiers
  );

  renderQuartiers();
})();
