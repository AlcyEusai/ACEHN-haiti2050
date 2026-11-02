/* HAÏTI 2050 — Prototype des vues actuelles et futures.
 * Les projets non géolocalisés ne sont pas placés arbitrairement sur la carte.
 */
(() => {
  "use strict";
  const map = window.haiti2050Map;
  if (!map || !window.L) return;
  const tools = document.querySelector(".mapTools");
  if (!tools) return;

  const group = document.createElement("div");
  group.className = "haiti2050-view-controls";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Modes de visualisation");
  group.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0;";

  const select = document.createElement("select");
  select.id = "haiti2050ViewMode";
  select.setAttribute("aria-label", "Choisir la vue de la carte");
  [
    ["streets", "Aujourd'hui — carte des rues"],
    ["satellite", "Aujourd'hui — satellite"],
    ["future", "Haïti 2050 — projets futurs"]
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
  select.style.cssText = "max-width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;";

  const status = document.createElement("span");
  status.id = "haiti2050ViewStatus";
  status.setAttribute("role", "status");
  status.style.cssText = "font-size:12px;line-height:1.5;";

  group.append(select, status);
  tools.appendChild(group);

  // Le fond OSM est créé dans app.js. On l'identifie sans le dupliquer.
  const streets = [];
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer &&
        String(layer._url || "").includes("tile.openstreetmap.org")) {
      streets.push(layer);
    }
  });

  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      maxNativeZoom: 19,
      attribution: "Imagery © Esri et fournisseurs de données"
    }
  );

  // Réservé aux projets futurs géoréférencés validés.
  const futureProjects = L.layerGroup();
  const update = () => {
    const mode = select.value;
    if (mode === "satellite") {
      streets.forEach(layer => map.removeLayer(layer));
      if (!map.hasLayer(satellite)) satellite.addTo(map);
      map.removeLayer(futureProjects);
      status.textContent = "Imagerie satellite du fournisseur : la date des prises de vue varie.";
    } else if (mode === "future") {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      streets.forEach(layer => { if (!map.hasLayer(layer)) layer.addTo(map); });
      if (!map.hasLayer(futureProjects)) futureProjects.addTo(map);
      status.textContent = "Vision 2050 : aucun projet sans GPS n'est placé sur la carte. Les projets restent consultables dans leurs fiches.";
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      streets.forEach(layer => { if (!map.hasLayer(layer)) layer.addTo(map); });
      map.removeLayer(futureProjects);
      status.textContent = "Territoire actuel — fond OpenStreetMap.";
    }
    document.dispatchEvent(new CustomEvent("haiti2050:viewchange", {
      detail: { mode }
    }));
  };
  select.addEventListener("change", update);
  update();
  window.haiti2050FutureLayer = futureProjects;
})();
