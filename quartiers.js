
/*
 * HAÏTI 2050 — QUARTIERS ET LOCALITÉS V3
 *
 * - Conservation des anciennes données locales
 * - Coordonnées GPS facultatives
 * - Zoom sur les positions réelles disponibles
 * - Recherche des quartiers, localités et sections
 * - Synchronisation avec les menus territoriaux
 *
 * Dépendances : territoires.js, app.js, Leaflet
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const data = window.HAITI_TERRITOIRES;
  const map = window.haiti2050Map;

  if (!Array.isArray(data?.departements)) {
    console.error("Haïti 2050 : territoires.js absent.");
    return;
  }

  const LOCALITIES_KEY = "haiti2050-localities";
  const QUARTIERS_KEY = "haiti2050-quartiers";
  const GPS_KEY = "haiti2050-localities-gps";

  const normalize = value =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" &&
        !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  const localities = readStorage(LOCALITIES_KEY);
  const quartiers = readStorage(QUARTIERS_KEY);
  const coordinates = readStorage(GPS_KEY);

  let selectedMarker = null;

  function territory() {
    return {
      department: $("department")?.value || "",
      arrondissement: $("arrondissement")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  function keyFor(department, commune) {
    return normalize(department) + "|" + normalize(commune);
  }

  function gpsKey(department, commune, name) {
    return keyFor(department, commune) + "|" + normalize(name);
  }

  function uniqueNames(items) {
    const seen = new Set();

    return items.filter(name => {
      if (typeof name !== "string") return false;
      const key = normalize(name);

      if (!key || seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }

  function getLocalities(department, commune) {
    const oldKey = department + "|" + commune;
    const newKey = keyFor(department, commune);

    return uniqueNames([
      ...(Array.isArray(localities[oldKey])
        ? localities[oldKey] : []),
      ...(Array.isArray(quartiers[newKey])
        ? quartiers[newKey] : [])
    ]);
  }

  function getGPS(department, commune, name) {
    const item = coordinates[
      gpsKey(department, commune, name)
    ];

    if (!item) return null;

    const lat = Number(item.latitude);
    const lon = Number(item.longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 || lat > 90 ||
      lon < -180 || lon > 180
    ) {
      return null;
    }

    return { lat, lon };
  }

  function clearMarker() {
    if (selectedMarker && map?.hasLayer(selectedMarker)) {
      map.removeLayer(selectedMarker);
    }
    selectedMarker = null;
  }

  function showMessage(message) {
    let status = $("localitySearchMessage");

    if (!status) {
      status = document.createElement("p");
      status.id = "localitySearchMessage";
      status.setAttribute("role", "status");
      status.style.cssText =
        "font-size:13px;line-height:1.5;" +
        "margin:10px 0;color:#234;";

      ($("searchBtn") || $("atlas"))
        ?.insertAdjacentElement("afterend", status);
    }

    status.textContent = message;
  }

  function zoomToLocality(department, commune, name) {
    const position = getGPS(department, commune, name);

    if (!position || !map || typeof L === "undefined") {
      showMessage(
        "Position GPS précise indisponible pour « " +
        name + " ». La commune peut être affichée, " +
        "mais le quartier n'est pas encore géolocalisé."
      );
      return false;
    }

    clearMarker();

    selectedMarker = L.marker([
      position.lat,
      position.lon
    ]).addTo(map);

    selectedMarker.bindPopup(
      document.createTextNode(
        name + " — " + commune + " (" + department + ")"
      )
    ).openPopup();

    map.flyTo(
      [position.lat, position.lon],
      15,
      { animate: true, duration: 1.2 }
    );

    showMessage(
      "Localité : " + name +
      " — position GPS affichée sur la carte."
    );

    return true;
  }

  window.haiti2050ZoomToLocality = zoomToLocality;

  function selectLocality(item) {
    if (typeof selectTerritory === "function") {
      selectTerritory(
        item.department,
        item.arrondissement,
        item.commune,
        false
      );
    }

    // Le chargement et la mise à jour des menus
    // sont synchrones dans app.js.
    const found = zoomToLocality(
      item.department,
      item.commune,
      item.locality
    );

    if (!found) {
      showMessage(
        "Localité trouvée : " + item.locality +
        " — " + item.commune + " (" +
        item.department + "). " +
        "Coordonnées GPS non renseignées."
      );
    }

    $("map")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function saveLocality(name, latitude, longitude) {
    const current = territory();

    if (!current.department || !current.commune) {
      alert("Sélectionnez d'abord une commune.");
      return false;
    }

    name = String(name || "").trim();

    if (!name) {
      alert("Veuillez saisir le nom de la localité.");
      return false;
    }

    const existing = getLocalities(
      current.department,
      current.commune
    );

    if (existing.some(x => normalize(x) === normalize(name))) {
      alert("Cette localité est déjà enregistrée.");
      return false;
    }

    const hasLat = String(latitude).trim() !== "";
    const hasLon = String(longitude).trim() !== "";

    if (hasLat !== hasLon) {
      alert("Renseignez les deux coordonnées GPS.");
      return false;
    }

    let position = null;

    if (hasLat && hasLon) {
      const lat = Number(latitude);
      const lon = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 || lat > 90 ||
        lon < -180 || lon > 180
      ) {
        alert("Coordonnées GPS invalides.");
        return false;
      }

      position = { latitude: lat, longitude: lon };
    }

    const oldKey = current.department + "|" + current.commune;
    const nextLocalities = {
      ...localities,
      [oldKey]: [
        ...(Array.isArray(localities[oldKey])
          ? localities[oldKey] : []),
        name
      ]
    };

    const nextGPS = { ...coordinates };

    if (position) {
      nextGPS[
        gpsKey(current.department, current.commune, name)
      ] = position;
    }

    try {
      localStorage.setItem(
        LOCALITIES_KEY,
        JSON.stringify(nextLocalities)
      );

      if (position) {
        localStorage.setItem(
          GPS_KEY,
          JSON.stringify(nextGPS)
        );
      }

      Object.assign(localities, nextLocalities);
      Object.assign(coordinates, nextGPS);
    } catch (error) {
      console.error(error);
      alert("Enregistrement impossible.");
      return false;
    }

    renderLocalities();
    renderQuartiers();

    document.dispatchEvent(
      new CustomEvent("haiti2050:localitychange")
    );

    return true;
  }

  function createLocalityButton(name, current) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;

    const hasGPS = Boolean(
      getGPS(current.department, current.commune, name)
    );

    button.title = hasGPS
      ? "Voir cette localité sur la carte"
      : "Position GPS non renseignée";

    button.style.cssText =
      "width:100%;text-align:left;padding:9px;" +
      "margin:3px 0;border:1px solid #dce5ec;" +
      "border-radius:7px;background:#f8fafc;" +
      "cursor:pointer;color:#163b58;";

    button.addEventListener("click", () => {
      zoomToLocality(
        current.department,
        current.commune,
        name
      );

      $("map")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });

    return button;
  }

  function renderLocalities() {
    const current = territory();
    const list = $("localities");

    if (!list) return;

    list.replaceChildren();

    if (!current.commune) {
      const li = document.createElement("li");
      li.textContent =
        "Sélectionnez une commune pour voir ses localités.";
      list.appendChild(li);
      return;
    }

    const names = getLocalities(
      current.department,
      current.commune
    );

    if (!names.length) {
      const li = document.createElement("li");
      li.textContent = "Aucune localité enregistrée.";
      list.appendChild(li);
      return;
    }

    names.forEach(name => {
      const li = document.createElement("li");
      li.appendChild(createLocalityButton(name, current));
      list.appendChild(li);
    });
  }

  function renderQuartiers() {
    const current = territory();

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
      "Quartiers et localités de " + current.commune;

    const note = document.createElement("p");
    note.textContent =
      "Données enregistrées dans ce navigateur. " +
      "Les noms, rattachements et coordonnées " +
      "doivent être vérifiés.";

    const list = document.createElement("ul");
    const names = getLocalities(
      current.department,
      current.commune
    );

    if (!names.length) {
      const li = document.createElement("li");
      li.textContent =
        "Aucun quartier ou localité enregistré.";
      list.appendChild(li);
    } else {
      names.forEach(name => {
        const li = document.createElement("li");
        li.appendChild(createLocalityButton(name, current));
        list.appendChild(li);
      });
    }

    const input = document.createElement("input");
    input.id = "newQuartier";
    input.placeholder = "Nom du quartier ou de la localité";

    const latitude = document.createElement("input");
    latitude.type = "number";
    latitude.step = "any";
    latitude.placeholder = "Latitude GPS (facultative)";
    latitude.setAttribute("aria-label", "Latitude GPS");

    const longitude = document.createElement("input");
    longitude.type = "number";
    longitude.step = "any";
    longitude.placeholder = "Longitude GPS (facultative)";
    longitude.setAttribute("aria-label", "Longitude GPS");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = "+ Ajouter une localité";

    button.addEventListener("click", () => {
      saveLocality(
        input.value,
        latitude.value,
        longitude.value
      );
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        button.click();
      }
    });

    container.append(
      title, note, list,
      input, latitude, longitude, button
    );
  }

  function searchLocality(query) {
    const target = normalize(query);
    const matches = [];

    for (const department of data.departements) {
      for (const arrondissement of department.arrondissements) {
        for (const commune of arrondissement.communes) {
          const names = getLocalities(
            department.nom,
            commune
          );

          for (const name of names) {
            if (!target || normalize(name).includes(target)) {
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

  window.haiti2050SearchLocalities = searchLocality;

  // Recherche unifiée : communes, sections, quartiers.
  function allResults() {
    const results = [];

    const sections =
      window.haiti2050SearchSections?.("") || [];

    sections.forEach(section => {
      results.push({
        type: "section",
        name: section.name,
        department: section.department,
        commune: section.commune,
        code: section.code || ""
      });
    });

    searchLocality("").forEach(item => {
      results.push({
        type: "locality",
        name: item.locality,
        ...item
      });
    });

    for (const department of data.departements) {
      for (const arrondissement of department.arrondissements) {
        for (const commune of arrondissement.communes) {
          results.push({
            type: "commune",
            name: commune,
            department: department.nom,
            arrondissement: arrondissement.nom,
            commune
          });
        }
      }
    }

    return results;
  }

  function selectResult(item) {
    const input = $("search");
    const panel = $("localitySuggestions");

    if (input) input.value = item.name;
    if (panel) panel.hidden = true;

    if (item.type === "locality") {
      selectLocality({
        department: item.department,
        arrondissement: item.arrondissement,
        commune: item.commune,
        locality: item.name
      });
      return;
    }

    if (item.type === "section") {
      const matches = [];

      for (const dep of data.departements) {
        if (
          normalize(dep.nom) !==
          normalize(item.department)
        ) continue;

        for (const arr of dep.arrondissements) {
          for (const commune of arr.communes) {
            if (
              normalize(commune) ===
              normalize(item.commune)
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

      if (matches.length === 1) {
        const found = matches[0];

        if (typeof selectTerritory === "function") {
          selectTerritory(
            found.department,
            found.arrondissement,
            found.commune,
            false
          );
        }

        window.haiti2050ZoomToSection?.(
          found.department,
          found.commune,
          item.name
        );
      } else {
        showMessage(
          "Section trouvée : " + item.name +
          ". Son rattachement communal doit être vérifié."
        );
      }

      return;
    }

    if (
      item.type === "commune" &&
      typeof selectTerritory === "function"
    ) {
      selectTerritory(
        item.department,
        item.arrondissement,
        item.commune,
        false
      );

      if (
        typeof window.haiti2050ZoomToCommune === "function"
      ) {
        window.haiti2050ZoomToCommune(
          item.department,
          item.commune
        );
      }
    }
  }

  function findResults() {
    const input = $("search");
    const target = normalize(input?.value || "");

    if (!target) return [];

    return allResults().filter(item =>
      normalize(item.name).includes(target)
    );
  }

  function renderSuggestions() {
    const panel = $("localitySuggestions");

    if (!panel) return;

    panel.replaceChildren();

    const matches = findResults();

    if (!matches.length) {
      const p = document.createElement("p");
      p.className = "suggestion-empty";
      p.textContent =
        "Aucun résultat dans le répertoire actuel.";
      panel.appendChild(p);
    } else {
      matches.slice(0, 100).forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "suggestion-item";
        button.setAttribute("role", "option");

        const title = document.createElement("strong");
        title.textContent = item.name;

        const description = document.createElement("small");
        description.textContent =
          " — " + item.type +
          " — " + item.commune +
          " (" + item.department + ")";

        button.append(title, description);

        button.addEventListener("click", () => {
          selectResult(item);
        });

        panel.appendChild(button);
      });
    }

    panel.hidden = false;
  }

  // Recherche unifiée sur le bouton principal.
  const searchButton = $("searchBtn");
  const searchInput = $("search");
  const suggestions = $("localitySuggestions");

  if (searchButton && searchInput) {
    searchButton.addEventListener(
      "click",
      event => {
        const query = searchInput.value.trim();

        if (!query) {
          if (suggestions) renderSuggestions();
          return;
        }

        const matches = findResults();

        if (!matches.length) {
          showMessage(
            "Aucun résultat dans le répertoire actuel."
          );
          return;
        }

        const exact = matches.find(
          item => normalize(item.name) === normalize(query)
        );

        // Priorité à la commune exacte.
        const exactCommune = matches.find(
          item =>
            item.type === "commune" &&
            normalize(item.name) === normalize(query)
        );

        selectResult(exactCommune || exact || matches[0]);

        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );
  }

  if (searchInput && suggestions) {
    searchInput.setAttribute("autocomplete", "off");

    searchInput.addEventListener(
      "focus",
      renderSuggestions
    );

    searchInput.addEventListener(
      "input",
      renderSuggestions
    );

    document.addEventListener("click", event => {
      if (
        event.target !== searchInput &&
        !suggestions.contains(event.target)
      ) {
        suggestions.hidden = true;
      }
    });
  }

  document.addEventListener(
    "haiti2050:sectionsloaded",
    () => {
      if (document.activeElement === searchInput) {
        renderSuggestions();
      }
    }
  );

  document.addEventListener(
    "haiti2050:territorychange",
    () => {
      clearMarker();
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

  renderLocalities();
  renderQuartiers();

  console.log(
    "Haïti 2050 — Quartiers V3 et recherche unifiée activés."
  );
})();
