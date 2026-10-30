
/* HAÏTI 2050 — CARTE V2 */
(() => {
  if (typeof markers !== "undefined") {
    markers.forEach(m => map.removeLayer(m));
  }

  const api = level =>
    `https://www.geoboundaries.org/api/current/gbOpen/HTI/${level}/`;

  const normalize = s => String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const layers = {};

  const status = document.createElement("div");
  status.style.cssText =
    "padding:12px;color:#35506a;font-size:13px";
  status.setAttribute("role", "status");
  document.querySelector(".mapCol").append(status);

  async function load(level) {
    const response = await fetch(api(level));
    if (!response.ok) throw Error("API " + level);

    const metadata = await response.json();
    const originalUrl =
     metadata.simplifiedGeometryGeoJSON ||
     metadata.gjDownloadURL;

   if (!originalUrl) {
     throw new Error("URL GeoJSON introuvable");
   }

   const url = originalUrl
     .replace(
       "https://github.com/",
       "https://raw.githubusercontent.com/"
     )
     .replace(/\/raw\//, "/");

    if (!url) throw Error("GeoJSON introuvable");

    const geoResponse = await fetch(url);
    if (!geoResponse.ok) throw Error("Téléchargement GeoJSON");

    const data = await geoResponse.json();

    const layer = L.geoJSON(data, {
      style: {
        color: level === "ADM1" ? "#007d67" : "#d97706",
        weight: level === "ADM1" ? 2 : 1,
        fillOpacity: 0.08
      },

      onEachFeature(feature, polygon) {
        const name =
          feature.properties?.shapeName || "Territoire";

        polygon.bindTooltip(name);

        polygon.on("mouseover", () => {
          polygon.setStyle({ weight: 3, fillOpacity: 0.25 });
        });

        polygon.on("mouseout", () => {
          layer.resetStyle(polygon);
        });

        polygon.on("click", () => {
          map.fitBounds(polygon.getBounds(), {
            padding: [20, 20],
            maxZoom: 12
          });

          if (level === "ADM1") {
            const dep = departments.find(d =>
              normalize(d.name) === normalize(name)
            );

            if (dep) selectDepartment(dep.name, false);
          } else {
            const matches = departments.flatMap(d =>
              d.communes.map(c => ({ department: d, commune: c }))
            ).filter(x =>
              normalize(x.commune) === normalize(name)
            );

            if (matches.length === 1) {
              const match = matches[0];
              selectDepartment(match.department.name, false);
              currentCommune = match.commune;
              document.getElementById("commune").value =
                currentCommune;
              renderSelection();
            }
          }

          status.textContent =
            name + " — territoire sélectionné";
        });
      }
    });

    layers[level] = layer;
    layer.addTo(map);

    return data.features.length;
  }

  async function initialize() {
    status.textContent = "Chargement des frontières…";

    const results = await Promise.allSettled([
      load("ADM1"),
      load("ADM2")
    ]);

    const names = ["Départements", "Divisions ADM2"];
    const controls = {};

    results.forEach((result, i) => {
      const level = i === 0 ? "ADM1" : "ADM2";

      if (result.status === "fulfilled") {
        controls[names[i]] = layers[level];
      } else {
        console.error(level, result.reason);
      }
    });

    if (layers.ADM1) {
      map.fitBounds(layers.ADM1.getBounds(), {
        padding: [20, 20]
      });
    }

    L.control.layers(null, controls, {
      collapsed: false
    }).addTo(map);

    status.textContent = results.map((r, i) =>
      names[i] + " : " +
      (r.status === "fulfilled"
        ? r.value + " zones chargées"
        : "chargement impossible")
    ).join(" | ") + " — Source : geoBoundaries";
  }

  initialize();
})();
