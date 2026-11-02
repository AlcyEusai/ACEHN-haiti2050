/* Haïti 2050 — seconde carte prospective (prototype).
 * Aucun point fictif n'est présenté comme une infrastructure existante.
 */
(() => {
  "use strict";
  const current = window.haiti2050Map;
  if (!current || !window.L) return;
  const mapCol = document.querySelector(".mapCol");
  const currentMap = document.getElementById("map");
  if (!mapCol || !currentMap) return;

  const panel = document.createElement("section");
  panel.id = "haiti2050FuturePanel";
  panel.hidden = true;
  panel.style.display = "none";
  panel.setAttribute("aria-label", "Carte prospective Haïti 2050");
  panel.innerHTML = `
    <h3 style="margin:12px 0 5px">Carte prospective — Haïti 2050</h3>
    <p style="font-size:13px;margin:0 0 10px">Planification territoriale : projets envisagés, non approuvés. Les emplacements ne seront affichés que lorsqu'ils seront documentés.</p>
    <div id="haiti2050FutureMap" style="height:480px;min-height:320px;border-radius:12px;overflow:hidden"></div>
    <p id="haiti2050FutureNote" style="font-size:12px;margin:8px 0">Carte distincte du territoire actuel. Aucune infrastructure fictive n'est positionnée.</p>
  `;
  currentMap.insertAdjacentElement("afterend", panel);

  let futureMap = null;
  let futureLayer = null;
  function ensureMap() {
    if (futureMap) return;
    futureMap = L.map("haiti2050FutureMap", {
      scrollWheelZoom: false
    }).setView(current.getCenter(), current.getZoom());
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(futureMap);
    futureLayer = L.layerGroup().addTo(futureMap);
    window.haiti2050FutureMap = futureMap;
    window.haiti2050FutureProjectLayer = futureLayer;
  }
  // Synchronise les déplacements lorsque la carte actuelle change de territoire.
  let syncScheduled = false;
  const syncFromCurrent = () => {
    if (!futureMap || panel.hidden || syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      if (!panel.hidden) {
        futureMap.setView(current.getCenter(), current.getZoom(), { animate: false });
      }
    });
  };
  current.on("moveend", syncFromCurrent);
  current.on("zoomend", syncFromCurrent);
  document.addEventListener("haiti2050:territorychange", () => {
    // Certains modules déclenchent le zoom après l'événement de sélection.
    requestAnimationFrame(syncFromCurrent);
  });

  document.addEventListener("haiti2050:viewchange", event => {
    const future = event.detail?.mode === "future";
    panel.hidden = !future;
    panel.style.display = future ? "block" : "none";
    currentMap.hidden = future;
    currentMap.style.display = future ? "none" : "";
    if (future) {
      ensureMap();
      futureMap.setView(current.getCenter(), current.getZoom(), {animate:false});
      requestAnimationFrame(() => {
        futureMap.invalidateSize();
        document.dispatchEvent(new CustomEvent("haiti2050:futuremapready"));
      });
    } else {
      requestAnimationFrame(() => current.invalidateSize());
    }
  });
})();
