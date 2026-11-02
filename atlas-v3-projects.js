/* HAÏTI 2050 — projets prospectifs et fiches communales.
 * GPS facultatif, fourni et vérifié manuellement par le contributeur.
 * Aucun emplacement n'est déduit du nom de la commune.
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const normalize = s => String(s || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const projectKey = p => String(p.id);
  const load = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("haiti2050-projects") || "null");
      if (Array.isArray(stored)) return stored;
    } catch (e) { console.warn("Projets non lisibles", e); }
    return typeof projects !== "undefined" && Array.isArray(projects) ? projects : [];
  };
  const selected = () => ({
    department: $("department")?.value || "",
    commune: $("commune")?.value || ""
  });
  const match = (p, s) => normalize(p.department) === normalize(s.department)
    && normalize(p.commune) === normalize(s.commune);
  const validGPS = p => {
    if (p.latitude === "" || p.longitude === "" || p.latitude == null || p.longitude == null) return false;
    const lat = Number(p.latitude), lon = Number(p.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon)
      && lat >= 18 && lat <= 21 && lon >= -75.5 && lon <= -71
      && p.locationVerified === true;
  };
  const categoryEmoji = category => {
    const c = normalize(category);
    if (c.includes("sante")) return "🏥";
    if (c.includes("education")) return "🏫";
    if (c.includes("solaire") || c.includes("energie")) return "☀️";
    if (c.includes("route") || c.includes("transport")) return "🛣️";
    if (c.includes("eau") || c.includes("assainissement")) return "💧";
    if (c.includes("agriculture")) return "🌱";
    if (c.includes("marche") || c.includes("commerce")) return "🏪";
    return "📍";
  };
  const container = document.createElement("section");
  container.id = "haiti2050FutureProjects";
  container.style.cssText = "padding:16px;margin-top:14px;border:1px solid #d7e1e8;border-radius:12px;background:#fff;color:#203040";
  container.innerHTML = '<h3 style="margin:0 0 8px">Projets d’aménagement — commune sélectionnée</h3><p style="font-size:13px">Sélectionnez une commune pour consulter ses projets. Les emplacements sont des propositions à vérifier, pas des constructions approuvées.</p><div id="haiti2050FutureProjectList"></div>';
  $("haiti2050FuturePanel")?.appendChild(container);
  const list = $("haiti2050FutureProjectList");

  function save(data) {
    try {
      localStorage.setItem("haiti2050-projects", JSON.stringify(data));
      // Maintient la variable utilisée par app.js et communes-v25.js.
      if (typeof projects !== "undefined") {
        projects.splice(0, projects.length, ...data);
      }
      document.dispatchEvent(new CustomEvent("haiti2050:projectschange"));
      return true;
    } catch (error) {
      alert("Enregistrement local impossible : " + error.message);
      return false;
    }
  }
  function draw() {
    const data = load(), selection = selected();
    const map = window.haiti2050FutureMap;
    const layer = window.haiti2050FutureProjectLayer;
    if (layer) layer.clearLayers();
    list.replaceChildren();
    if (!selection.commune) {
      list.textContent = "Choisissez un département puis une commune.";
      return;
    }
    const filtered = data.filter(p => match(p, selection));
    if (!filtered.length) {
      list.textContent = "Aucun projet enregistré pour cette commune.";
      return;
    }
    filtered.forEach(p => {
      const item = document.createElement("article");
      item.style.cssText = "border-top:1px solid #e2e8f0;padding:12px 0";
      const heading = document.createElement("strong");
      heading.textContent = categoryEmoji(p.category) + " " + p.title;
      const desc = document.createElement("p");
      desc.style.margin = "5px 0";
      desc.textContent = (p.category || "Autre") + " — " + (p.description || "Description à compléter");
      const badge = document.createElement("p");
      badge.style.cssText = "font-size:12px;margin:4px 0;color:#64748b";
      badge.textContent = (p.demo ? "Concept illustratif" : "Proposition locale") +
        " · " + (validGPS(p) ? "Position déclarée vérifiée par le contributeur" : "Position GPS non validée");
      const action = document.createElement("button");
      action.type = "button";
      action.className = "secondary";
      action.textContent = "Renseigner / vérifier l’emplacement";
      action.style.marginTop = "6px";
      action.addEventListener("click", () => {
        const form = item.querySelector("form");
        form.hidden = !form.hidden;
      });
      const form = document.createElement("form");
      form.hidden = true;
      form.style.cssText = "display:grid;gap:6px;margin-top:8px;max-width:420px";
      // hidden can be overridden by CSS display:grid; explicitly force via inline display.
      form.style.display = "none";
      action.addEventListener("click", () => {
        form.style.display = form.hidden ? "none" : "grid";
      });
      const lat = document.createElement("input");
      lat.type = "number"; lat.step = "any"; lat.placeholder = "Latitude (ex. 18.2)";
      lat.value = p.latitude ?? "";
      lat.setAttribute("aria-label", "Latitude du projet");
      const lon = document.createElement("input");
      lon.type = "number"; lon.step = "any"; lon.placeholder = "Longitude (ex. -73.7)";
      lon.value = p.longitude ?? "";
      lon.setAttribute("aria-label", "Longitude du projet");
      const source = document.createElement("input");
      source.placeholder = "Source de la localisation (obligatoire)";
      source.value = p.locationSource || "";
      source.setAttribute("aria-label", "Source de la localisation");
      const verifyLabel = document.createElement("label");
      const verify = document.createElement("input");
      verify.type = "checkbox"; verify.checked = p.locationVerified === true;
      verifyLabel.append(verify, document.createTextNode(" Je confirme avoir vérifié ces coordonnées et leur source."));
      const submit = document.createElement("button");
      submit.type = "submit"; submit.textContent = "Enregistrer la position";
      form.append(lat, lon, source, verifyLabel, submit);
      form.addEventListener("submit", e => {
        e.preventDefault();
        const latitude = lat.value.trim(), longitude = lon.value.trim();
        const candidate = {
          ...p, latitude, longitude,
          locationSource: source.value.trim(), locationVerified: verify.checked
        };
        if (!validGPS(candidate) || !candidate.locationSource) {
          alert("Renseignez des coordonnées en Haïti, une source et confirmez leur vérification.");
          return;
        }
        const updated = load();
        const index = updated.findIndex(x => projectKey(x) === projectKey(p));
        if (index < 0) return;
        updated[index] = candidate;
        if (save(updated)) draw();
      });
      item.append(heading, desc, badge, action, form);
      list.appendChild(item);
      if (validGPS(p) && map && layer) {
        const marker = L.marker([Number(p.latitude), Number(p.longitude)]);
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = p.title;
        const detail = document.createElement("p");
        detail.textContent = (p.category || "") + " — projet prospectif, non approuvé.";
        const provenance = document.createElement("small");
        provenance.textContent = "Coordonnées déclarées · Source : " + (p.locationSource || "non indiquée");
        popup.append(title, detail, provenance);
        marker.bindPopup(popup).addTo(layer);
      }
    });
  }
  function refresh() { draw(); }
  document.addEventListener("haiti2050:territorychange", refresh);
  document.addEventListener("haiti2050:projectschange", refresh);
  document.addEventListener("haiti2050:viewchange", refresh);
  ["department", "arrondissement", "commune"].forEach(id =>
    $(id)?.addEventListener("change", () => setTimeout(refresh, 0)));
  $("projectForm")?.addEventListener("submit", () => setTimeout(refresh, 0));
  // Relie les fiches communales à la carte prospective.
  const observer = new MutationObserver(() => {
    const sheet = $("communeSheetV25");
    if (!sheet || sheet.querySelector(".haiti2050-future-link")) return;
    if (sheet.hidden) return;
    const button = document.createElement("button");
    button.className = "secondary haiti2050-future-link";
    button.type = "button";
    button.textContent = "Voir les projets sur la carte Haïti 2050";
    button.addEventListener("click", () => {
      const mode = $("haiti2050ViewMode");
      if (mode) {
        mode.value = "future";
        mode.dispatchEvent(new Event("change", {bubbles:true}));
      }
      $("haiti2050FuturePanel")?.scrollIntoView({behavior:"smooth",block:"start"});
    });
    sheet.appendChild(button);
  });
  const atlas = $("atlas");
  if (atlas) observer.observe(atlas, {subtree:true,childList:true,attributes:false});
  draw();
})();
