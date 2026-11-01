
/*
 * HAÏTI 2050 — QUARTIERS ET LOCALITÉS V4
 *
 * - Affichage automatique des quartiers géolocalisés
 * - Conservation des anciennes données localStorage
 * - Chargement facultatif d'un GeoJSON partagé
 * - Recherche des communes, sections et localités
 * - Zoom et fiches des localités
 * - Aucune coordonnée inventée
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
  const GEOJSON_URL = "./data/haiti-quartiers.geojson";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function normalizeDepartment(value) {
    const name = normalize(value);
    return name === "grandeanse" ? "grandanse" : name;
  }

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

  // Données partagées publiquement, si disponibles.
  const sharedLocalities = [];

  // Couche des marqueurs des quartiers.
  const markerLayer =
    map && typeof L !== "undefined"
      ? L.layerGroup()
      : null;

  let selectedMarker = null;

  function territory() {
    return {
      department: $("department")?.value || "",
      arrondissement: $("arrondissement")?.value || "",
      commune: $("commune")?.value || ""
    };
  }

  function keyFor(department, commune) {
    return normalizeDepartment(department) +
      "|" + normalize(commune);
  }

  function gpsKey(department, commune, name) {
    return keyFor(department, commune) +
      "|" + normalize(name);
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

  function validGPS(latitude, longitude) {
    if (
      latitude === null ||
      longitude === null ||
      latitude === undefined ||
      longitude === undefined ||
      String(latitude).trim() === "" ||
      String(longitude).trim() === ""
    ) {
      return null;
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

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

  function findShared(department, commune) {
    return sharedLocalities.filter(item =>
      normalizeDepartment(item.department) ===
        normalizeDepartment(department) &&
      normalize(item.commune) === normalize(commune)
    );
  }

  function getLocalities(department, commune) {
    const oldKey = department + "|" + commune;
    const newKey = keyFor(department, commune);

    return uniqueNames([
      ...(Array.isArray(localities[oldKey])
        ? localities[oldKey] : []),
      ...(Array.isArray(localities[newKey])
        ? localities[newKey] : []),
      ...(Array.isArray(quartiers[newKey])
        ? quartiers[newKey] : []),
      ...findShared(department, commune).map(x => x.name)
    ]);
  }

  function getGPS(department, commune, name) {
    const saved = coordinates[
      gpsKey(department, commune, name)
    ];

    if (saved) {
      const position = validGPS(
        saved.latitude,
        saved.longitude
      );

      if (position) return position;
    }

    const shared = findShared(department, commune)
      .find(item =>
        normalize(item.name) === normalize(name)
      );

    return shared
      ? validGPS(shared.latitude, shared.longitude)
      : null;
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

      const target =
        $("searchBtn") ||
        $("atlas") ||
        $("map");

      target?.insertAdjacentElement("afterend", status);
    }

    status.textContent = message;
  }

  function clearSelectedMarker() {
    if (selectedMarker && markerLayer) {
      markerLayer.removeLayer(selectedMarker);
    }

    selectedMarker = null;
  }

  /*
   * Afficher tous les quartiers GPS de la commune.
   */
  function renderMapMarkers() {
    if (!map || !markerLayer || typeof L === "undefined") {
      return;
    }

    markerLayer.clearLayers();
    selectedMarker = null;

    const current = territory();

    if (!current.department || !current.commune) {
      if (map.hasLayer(markerLayer)) {
        map.removeLayer(markerLayer);
      }
      return;
    }

    const names = getLocalities(
      current.department,
      current.commune
    );

    let count = 0;

    names.forEach(name => {
      const position = getGPS(
        current.department,
        current.commune,
        name
      );

      if (!position) return;

      const marker = L.marker([
        position.lat,
        position.lon
      ]);

      const popup = document.createElement("div");

      const heading = document.createElement("strong");
      heading.textContent = name;

      const detail = document.createElement("p");
      detail.textContent =
        current.commune + " — " + current.department;

      popup.append(heading, detail);

      marker.bindPopup(popup);
      marker.bindTooltip(name);

      markerLayer.addLayer(marker);
      count++;
    });

    if (count && !map.hasLayer(markerLayer)) {
      markerLayer.addTo(map);
    }

    if (!count && map.hasLayer(markerLayer)) {
      map.removeLayer(markerLayer);
    }

    const total = names.length;

    if (total) {
      showMessage(
        current.commune + " : " +
        total + " quartier(s) ou localité(s) enregistré(s), " +
        count + " position(s) GPS affichée(s)."
      );
    } else {
      showMessage(
        "Aucun quartier ou localité enregistré pour " +
        current.commune + "."
      );
    }
  }

  /*
   * Zoom sur un quartier géolocalisé.
   */
  function zoomToLocality(department, commune, name) {
    const position = getGPS(department, commune, name);

    if (!position || !map || typeof L === "undefined") {
      showMessage(
        "Localité trouvée : " + name +
        ". Position GPS non renseignée."
      );

      return false;
    }

    clearSelectedMarker();

    if (markerLayer) {
      selectedMarker = L.marker([
        position.lat,
        position.lon
      ]);

      const popup = document.createElement("div");
      popup.textContent =
        name + " — " + commune + " (" + department + ")";

      selectedMarker.bindPopup(popup);
      markerLayer.addLayer(selectedMarker);

      if (!map.hasLayer(markerLayer)) {
        markerLayer.addTo(map);
      }

      selectedMarker.openPopup();
    }

    map.flyTo(
      [position.lat, position.lon],
      15,
      { animate: true, duration: 1.2 }
    );

    showMessage(
      "Quartier ou localité : " + name +
      " — position affichée sur la carte."
    );

    return true;
  }

  window.haiti2050ZoomToLocality = zoomToLocality;

  /*
   * Enregistrement local d'un quartier.
   */
  function saveLocality(name, latitude, longitude) {
    const current = territory();

    if (!current.department || !current.commune) {
      alert("Sélectionnez d'abord une commune.");
      return false;
    }

    name = String(name || "").trim();

    if (!name) {
      alert("Veuillez saisir le nom du quartier.");
      return false;
    }

    const existing = getLocalities(
      current.department,
      current.commune
    );

    if (
      existing.some(x =>
        normalize(x) === normalize(name)
      )
    ) {
      alert("Cette localité est déjà enregistrée.");
      return false;
    }

    const hasLat = String(latitude).trim() !== "";
    const hasLon = String(longitude).trim() !== "";

    if (hasLat !== hasLon) {
      alert("Renseignez les deux coordonnées GPS.");
      return false;
    }

    const position = hasLat
      ? validGPS(latitude, longitude)
      : null;

    if (hasLat && !position) {
      alert("Coordonnées GPS invalides.");
      return false;
    }

    const key = current.department +
      "|" + current.commune;

    const updatedLocalities = {
      ...localities,
      [key]: [
        ...(Array.isArray(localities[key])
          ? localities[key] : []),
        name
      ]
    };

    const updatedGPS = { ...coordinates };

    if (position) {
      updatedGPS[
        gpsKey(current.department, current.commune, name)
      ] = {
        latitude: position.lat,
        longitude: position.lon
      };
    }

    try {
      localStorage.setItem(
        LOCALITIES_KEY,
        JSON.stringify(updatedLocalities)
      );

      if (position) {
        localStorage.setItem(
          GPS_KEY,
          JSON.stringify(updatedGPS)
        );
      }

      Object.assign(localities, updatedLocalities);
      Object.assign(coordinates, updatedGPS);
    } catch (error) {
      console.error(error);
      alert("Enregistrement impossible.");
      return false;
    }

    refresh();

    document.dispatchEvent(
      new CustomEvent("haiti2050:localitychange")
    );

    return true;
  }

  /*
   * Bouton d'une localité dans les listes.
   */
  function createLocalityButton(name, current) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;

    const position = getGPS(
      current.department,
      current.commune,
      name
    );

    button.title = position
      ? "Voir sur la carte"
      : "Coordonnées GPS non renseignées";

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

  /*
   * Liste des localités existante dans index.html.
   */
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
      li.textContent =
        "Aucune localité enregistrée.";
      list.appendChild(li);
      return;
    }

    names.forEach(name => {
      const li = document.createElement("li");
      li.appendChild(createLocalityButton(name, current));
      list.appendChild(li);
    });
  }

  /*
   * Panneau Quartiers et localités.
   */
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

      const target = $("atlas") || $("map")?.parentElement;
      target?.appendChild(container);
    }

    if (!container) return;

    container.replaceChildren();

    if (!current.commune) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    const title = document.createElement("h2");
    title.textContent =
      "Quartiers et localités de " + current.commune;

    const names = getLocalities(
      current.department,
      current.commune
    );

    const gpsCount = names.filter(name =>
      getGPS(current.department, current.commune, name)
    ).length;

    const note = document.createElement("p");
    note.textContent =
      names.length + " localité(s) enregistrée(s), " +
      gpsCount + " géolocalisée(s). " +
      "Les noms et positions doivent être vérifiés. " +
      "Les ajouts manuels sont enregistrés " +
      "uniquement dans ce navigateur.";

    const list = document.createElement("ul");

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
    input.placeholder =
      "Nom du quartier ou de la localité";

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
      const saved = saveLocality(
        input.value,
        latitude.value,
        longitude.value
      );

      if (saved) {
        showMessage(
          "Localité enregistrée dans ce navigateur."
        );
      }
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
      latitude,
      longitude,
      button
    );
  }

  /*
   * Recherche de toutes les localités enregistrées.
   */
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
            if (
              !target ||
              normalize(name).includes(target)
            ) {
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

  /*
   * Recherche unifiée.
   */
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
      if (typeof selectTerritory === "function") {
        selectTerritory(
          item.department,
          item.arrondissement,
          item.commune,
          false
        );
      }

      renderMapMarkers();

      zoomToLocality(
        item.department,
        item.commune,
        item.name
      );

      $("map")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return;
    }

    if (item.type === "section") {
      let found = null;

      for (const dep of data.departements) {
        if (
          normalizeDepartment(dep.nom) !==
          normalizeDepartment(item.department)
        ) continue;

        for (const arr of dep.arrondissements) {
          for (const commune of arr.communes) {
            if (
              normalize(commune) ===
              normalize(item.commune)
            ) {
              found = {
                department: dep.nom,
                arrondissement: arr.nom,
                commune
              };
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      if (found) {
        if (typeof selectTerritory === "function") {
          selectTerritory(
            found.department,
            found.arrondissement,
            found.commune,
            false
          );
        }

        if (
          typeof window.haiti2050ZoomToSection ===
          "function"
        ) {
          window.haiti2050ZoomToSection(
            found.department,
            found.commune,
            item.name
          );
        }
      } else {
        showMessage(
          "Rattachement de la section à vérifier."
        );
      }

      return;
    }

    if (item.type === "commune") {
      if (typeof selectTerritory === "function") {
        selectTerritory(
          item.department,
          item.arrondissement,
          item.commune,
          false
        );
      }

      if (
        typeof window.haiti2050ZoomToCommune ===
        "function"
      ) {
        window.haiti2050ZoomToCommune(
          item.department,
          item.commune
        );
      }

      refresh();
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

  /*
   * Événements de recherche.
   */
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

  function refresh() {
    renderLocalities();
    renderQuartiers();
    renderMapMarkers();
  }

  document.addEventListener(
    "haiti2050:territorychange",
    refresh
  );

  document.addEventListener(
    "haiti2050:localitychange",
    refresh
  );

  /*
   * Charger les quartiers publics depuis un GeoJSON.
   *
   * Format attendu :
   * FeatureCollection de points, avec propriétés
   * name, department, commune.
   *
   * Le fichier est facultatif.
   */
  async function loadSharedLocalities() {
    try {
      const response = await fetch(GEOJSON_URL);

      if (response.status === 404) {
        console.info(
          "Haïti 2050 : aucun fichier partagé " +
          "de quartiers pour le moment."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const geojson = await response.json();

      if (
        geojson.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features)
      ) {
        throw new Error("GeoJSON de quartiers invalide.");
      }

      for (const feature of geojson.features) {
        if (
          feature.geometry?.type !== "Point" ||
          !Array.isArray(feature.geometry.coordinates)
        ) {
          continue;
        }

        const p = feature.properties || {};

        const name = String(
          p.name || p.nom || p.quartier || ""
        ).trim();

        const department = String(
          p.department || p.departement || p.ADM1_FR || ""
        ).trim();

        const commune = String(
          p.commune || p.ADM2_FR || ""
        ).trim();

        const [longitude, latitude] =
          feature.geometry.coordinates;

        const position = validGPS(latitude, longitude);

        if (
          !name ||
          !department ||
          !commune ||
          !position
        ) {
          continue;
        }

        sharedLocalities.push({
          name,
          department,
          commune,
          latitude: position.lat,
          longitude: position.lon
        });
      }

      console.log(
        "Haïti 2050 : " +
        sharedLocalities.length +
        " quartiers publics géolocalisés chargés."
      );

      refresh();
    } catch (error) {
      console.warn(
        "Haïti 2050 : chargement des quartiers :",
        error
      );
    }
  }

  
/*
 * HAÏTI 2050 — INTÉGRATION GEONAMES
 *
 * Associe provisoirement les localités GPS
 * aux communes à partir des polygones GeoJSON.
 *
 * Ne modifie pas les limites administratives.
 * Ne remplace pas les données enregistrées.
 */

function pointInRing(lon, lat, ring) {
  let inside = false;

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects =
      ((yi > lat) !== (yj > lat)) &&
      (lon <
        ((xj - xi) * (lat - yi)) /
        (yj - yi) + xi);

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInPolygon(lon, lat, rings) {
  if (
    !Array.isArray(rings) ||
    !rings.length ||
    !pointInRing(lon, lat, rings[0])
  ) {
    return false;
  }

  return !rings
    .slice(1)
    .some(ring => pointInRing(lon, lat, ring));
}

function pointInGeometry(lon, lat, geometry) {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return pointInPolygon(
      lon,
      lat,
      geometry.coordinates
    );
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(
      polygon => pointInPolygon(lon, lat, polygon)
    );
  }

  return false;
}

function getGeoJSONName(feature) {
  const p = feature.properties || {};

  return (
    p.ADM2_FR ||
    p.ADM2_EN ||
    p.shapeName ||
    p.name ||
    ""
  );
}

function getGeoJSONDepartment(feature) {
  const p = feature.properties || {};

  return (
    p.ADM1_FR ||
    p.ADM1_EN ||
    p.department ||
    p.departement ||
    ""
  );
}

async function loadGeoNamesLocalities() {
  try {
    const responses = await Promise.all([
      fetch("./data/haiti-localites.json"),
      fetch("./data/haiti-communes.geojson")
    ]);

    if (!responses.every(response => response.ok)) {
      throw new Error(
        "Impossible de charger les données GeoNames ou les communes."
      );
    }

    const [rawLocalities, geojson] =
      await Promise.all(
        responses.map(response => response.json())
      );

    const places = Array.isArray(rawLocalities)
      ? rawLocalities
      : rawLocalities.localites ||
        rawLocalities.features ||
        [];

    if (
      !Array.isArray(places) ||
      !Array.isArray(geojson.features)
    ) {
      throw new Error("Structure des données invalide.");
    }

    const communes = geojson.features
      .map(feature => {
        const name = getGeoJSONName(feature);
        const department =
          getGeoJSONDepartment(feature);

        let reference = null;

        for (const dep of data.departements) {
          if (
            normalizeDepartment(dep.nom) !==
            normalizeDepartment(department)
          ) {
            continue;
          }

          for (const arr of dep.arrondissements) {
            for (const commune of arr.communes) {
              if (
                (
                  normalize(commune) === normalize(name) ||
                  normalize(commune).replace(/^les/, "") === normalize(name) ||
                  normalize(name).replace(/^les/, "") === normalize(commune)
                )
              ) {
                reference = {
                  department: dep.nom,
                  commune
                };
              }
            }
          }
        }

        return reference
          ? { feature, ...reference }
          : null;
      })
      .filter(Boolean);

    let linked = 0;
    let ambiguous = 0;

    for (const place of places) {
      const name = String(
        place.nom ||
        place.name ||
        place.properties?.name ||
        ""
      ).trim();

      const position = validGPS(
        place.latitude ??
          place.properties?.latitude,
        place.longitude ??
          place.properties?.longitude
      );

      if (!name || !position) continue;

      const matches = communes.filter(commune =>
        pointInGeometry(
          position.lon,
          position.lat,
          commune.feature.geometry
        )
      );

      // Ne pas choisir arbitrairement une commune.
      if (matches.length !== 1) {
        if (matches.length > 1) ambiguous++;
        continue;
      }

      const match = matches[0];

      sharedLocalities.push({
        name,
        department: match.department,
        commune: match.commune,
        latitude: position.lat,
        longitude: position.lon,
        source: "GeoNames",
        communeVerifiee: false
      });

      linked++;
    }

    console.info(
      "Haïti 2050 : " +
      linked +
      " localités GeoNames rattachées provisoirement."
    );

    console.info(
      "Points géographiquement ambigus : " +
      ambiguous
    );

    refresh();

  } catch (error) {
    console.warn(
      "Haïti 2050 : erreur GeoNames :",
      error
    );

    showMessage(
      "Les localités nationales n'ont pas pu être chargées."
    );
  }
}
 
  refresh();
  loadSharedLocalities();
  loadGeoNamesLocalities();

  console.log(
    "Haïti 2050 — Quartiers V4 + GeoNames activés."
  );
  })();
