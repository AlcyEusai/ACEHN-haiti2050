
/*
 * HAÏTI 2050 — QUARTIERS ET LOCALITÉS V2.6
 * Compatible avec app.js V2.4
 *
 * - Affiche les localités et quartiers enregistrés
 * - Conserve les anciennes données
 * - Recherche une localité ou un quartier
 * - Sélectionne automatiquement la commune
 * - Stockage local uniquement
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const territorialData = window.HAITI_TERRITOIRES;

  if (
    !territorialData ||
    !Array.isArray(territorialData.departements)
  ) {
    console.error(
      "Haïti 2050 : répertoire territorial indisponible."
    );
    return;
  }

  const LOCALITIES_KEY = "haiti2050-localities";
  const QUARTIERS_KEY = "haiti2050-quartiers";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function readStorage(key) {
    try {
      const result = JSON.parse(
        localStorage.getItem(key)
      );

      return result &&
        typeof result === "object" &&
        !Array.isArray(result)
          ? result
          : {};
    } catch {
      return {};
    }
  }

  const localities = readStorage(LOCALITIES_KEY);
  const quartiers = readStorage(QUARTIERS_KEY);

  function getKey(department, commune) {
    return normalize(department) + "|" +
           normalize(commune);
  }

  function currentTerritory() {
    return {
      department: $("department")?.value || "",
      arrondissement: $("arrondissement")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  function uniqueNames(names) {
    const found = new Set();

    return names.filter(name => {
      if (typeof name !== "string") return false;

      const key = normalize(name);

      if (!key || found.has(key)) return false;

      found.add(key);
      return true;
    });
  }

  function getLocalities(department, commune) {
    const oldKey = department + "|" + commune;
    const newKey = getKey(department, commune);

    return uniqueNames([
      ...(Array.isArray(localities[oldKey])
        ? localities[oldKey]
        : []),

      ...(Array.isArray(quartiers[newKey])
        ? quartiers[newKey]
        : [])
    ]);
  }

  function saveLocality(name) {
    const current = currentTerritory();

    if (!current.department || !current.commune) {
      alert("Sélectionnez d'abord une commune.");
      return;
    }

    const key =
      current.department + "|" + current.commune;

    localities[key] ||= [];

    const existing = getLocalities(
      current.department,
      current.commune
    );

    if (
      existing.some(
        item => normalize(item) === normalize(name)
      )
    ) {
      alert("Cette localité est déjà enregistrée.");
      return;
    }

    localities[key].push(name);

    try {
      localStorage.setItem(
        LOCALITIES_KEY,
        JSON.stringify(localities)
      );
    } catch (error) {
      localities[key].pop();
      console.error(error);
      alert("Enregistrement impossible.");
      return;
    }

    renderLocalities();
    renderQuartiers();

    document.dispatchEvent(
      new CustomEvent("haiti2050:localitychange")
    );
  }

  function renderLocalities() {
    const current = currentTerritory();
    const list = $("localities");

    if (!list) return;

    list.replaceChildren();

    const names = getLocalities(
      current.department,
      current.commune
    );

    if (!names.length) {
      const item = document.createElement("li");
      item.textContent =
        "Aucune localité enregistrée pour cette commune.";
      list.appendChild(item);
      return;
    }

    names.forEach(name => {
      const item = document.createElement("li");
      item.textContent = name + " (à vérifier)";
      list.appendChild(item);
    });
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
      "Les noms présentés proviennent des saisies " +
      "enregistrées dans ce navigateur. Leur statut " +
      "administratif et leur rattachement doivent " +
      "être vérifiés.";

    const list = document.createElement("ul");

    const names = getLocalities(
      current.department,
      current.commune
    );

    if (!names.length) {
      const item = document.createElement("li");
      item.textContent =
        "Aucun quartier ou localité enregistré.";
      list.appendChild(item);
    } else {
      names.forEach(name => {
        const item = document.createElement("li");
        item.textContent = name;
        list.appendChild(item);
      });
    }

    const input = document.createElement("input");
    input.id = "newQuartier";
    input.placeholder =
      "Nom du quartier ou de la localité";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = "+ Ajouter une localité";

    button.addEventListener("click", () => {
      const name = input.value.trim();

      if (!name) return;

      saveLocality(name);
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        button.click();
      }
    });

    container.append(
      title,
      note,
      list,
      input,
      button
    );
  }

  function searchLocality(query) {
    const target = normalize(query);

    if (!target) return [];

    const matches = [];

    for (const department of territorialData.departements) {
      for (const arrondissement of department.arrondissements) {
        for (const commune of arrondissement.communes) {
          const names = getLocalities(
            department.nom,
            commune
          );

          for (const name of names) {
            if (normalize(name).includes(target)) {
              matches.push({
                department: department.nom,
                arrondissement: arrondissement.nom,
                commune,
                locality: name
              });
            }
          }
        }
      }
    }

    return matches;
  }

  // Fonction utilisable par app.js.
  window.haiti2050SearchLocalities = searchLocality;

  function showSearchMessage(message) {
    let element = $("localitySearchMessage");

    if (!element) {
      element = document.createElement("p");
      element.id = "localitySearchMessage";
      element.setAttribute("role", "status");
      element.style.cssText =
        "font-size:13px;line-height:1.5;" +
        "margin:10px 0;color:#234;";

      $("searchBtn")?.insertAdjacentElement(
        "afterend",
        element
      );
    }

    element.textContent = message;
  }

  function searchAndSelectLocality(query) {
    const matches = searchLocality(query);

    if (!matches.length) {
      showSearchMessage(
        "Aucune localité enregistrée sous ce nom."
      );
      return false;
    }

    const exact = matches.find(
      item =>
        normalize(item.locality) === normalize(query)
    );

    const result = exact || matches[0];

    if (typeof selectTerritory === "function") {
      selectTerritory(
        result.department,
        result.arrondissement,
        result.commune,
        true
      );
    }

    showSearchMessage(
      "Localité trouvée : " + result.locality +
      " — Commune : " + result.commune +
      " — Département : " + result.department +
      ". Rattachement à vérifier."
    );

    renderLocalities();
    renderQuartiers();

    return true;
  }

  // Remplace le gestionnaire de clic de recherche
  // seulement pour ajouter les localités.
  const searchButton = $("searchBtn");

  if (searchButton) {
    const oldSearch = searchButton.onclick;

    searchButton.onclick = function(event) {
      const input = $("search");
      const query = input?.value.trim() || "";

      if (!query) {
        if (typeof oldSearch === "function") {
          return oldSearch.call(this, event);
        }
        return;
      }

      // Chercher d'abord une commune exacte.
      const exactCommune =
        territorialData.departements.some(dep =>
          dep.arrondissements.some(arr =>
            arr.communes.some(
              commune =>
                normalize(commune) === normalize(query)
            )
          )
        );

      if (exactCommune && typeof oldSearch === "function") {
        return oldSearch.call(this, event);
      }

      // Ensuite chercher une localité.
      if (searchAndSelectLocality(query)) {
        return;
      }

      // Enfin, conserver la recherche communale
      // partielle du programme principal.
      if (typeof oldSearch === "function") {
        return oldSearch.call(this, event);
      }
    };
  }

  // Synchronisation avec les menus territoriaux.
  document.addEventListener(
    "haiti2050:territorychange",
    () => {
      renderLocalities();
      renderQuartiers();
    }
  );

  document.addEventListener(
    "haiti2050:localitychange",
    () => {
      renderLocalities();
      renderQuartiers();
    }
  );

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

  renderLocalities();
  renderQuartiers();

  console.log(
    "Haïti 2050 — recherche des localités activée."
  );
})();
