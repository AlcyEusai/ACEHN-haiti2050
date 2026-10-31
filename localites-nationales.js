
/* HAÏTI 2050 — Recherche nationale des localités */

(() => {
  "use strict";

  const normalize = value =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  async function init() {
    const existing = document.getElementById("search");
    if (!existing) return;

    const panel = document.createElement("section");
    panel.id = "geonamesSearchPanel";
    panel.style.cssText = `
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      margin: 12px 0;
      padding: 12px;
      border: 1px solid #dce5ec;
      border-radius: 12px;
      background: #ffffff;
`      ;

    const label = document.createElement("label");
    label.htmlFor = "geonamesSearch";
    label.textContent = "Rechercher un lieu habité en Haïti";

    const field = document.createElement("input");
    field.id = "geonamesSearch";
    field.type = "search";
    field.autocomplete = "off";
    field.placeholder = "Ex. Zoranger, Fond des Blancs...";
    field.style.cssText =
      "display:block;width:100%;margin:8px 0;padding:12px;box-sizing:border-box";

    const status = document.createElement("small");
    status.setAttribute("role", "status");

    const results = document.createElement("div");
    results.style.cssText =
      "max-height:260px;overflow:auto;margin-top:8px";

    panel.append(label, field, status, results);

    
    // Placer le panneau dans la colonne de gauche
    const sidebar = document.querySelector(
      "#atlas .workspace aside"
    );

    if (sidebar) {
      const searchLabel = sidebar.querySelector(
        'label[for="search"]'
      );

      if (searchLabel) {
        sidebar.insertBefore(panel, searchLabel);
      } else {
        sidebar.appendChild(panel);
      }
    } else {
      console.error(
        "Haïti 2050 : colonne latérale introuvable."
      );
    }
  

    try {
      const response = await fetch(
        "./data/haiti-localites.json"
      );

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const places = await response.json();

      if (!Array.isArray(places)) {
        throw new Error("Format JSON inattendu");
      }

      status.textContent =
        places.length.toLocaleString("fr-FR") +
        " lieux disponibles. Saisissez au moins 2 lettres.";

      field.addEventListener("input", () => {
        const query = normalize(field.value);
        results.replaceChildren();

        if (query.length < 2) {
          status.textContent = "Saisissez au moins 2 lettres.";
          return;
        }

        const matches = places
          .filter(place =>
            normalize(place.nom).includes(query)
          )
          .slice(0, 60);

        status.textContent =
          matches.length + " résultat(s) affiché(s).";

        matches.forEach(place => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "suggestion-item";
          button.style.cssText =
            "display:block;width:100%;text-align:left;padding:10px;margin:3px 0";

          button.textContent =
            place.nom + " — " +
            place.latitude.toFixed(4) + ", " +
            place.longitude.toFixed(4);

          button.addEventListener("click", () => {
            field.value = place.nom;
            results.replaceChildren();

            const map = window.haiti2050Map;

            if (map && window.L) {
              map.setView(
                [place.latitude, place.longitude],
                13
              );

              L.popup()
                .setLatLng([
                  place.latitude,
                  place.longitude
                ])
                .setContent(
                  document.createTextNode(place.nom)
                )
                .openOn(map);

              status.textContent =
                "Lieu affiché sur la carte : " +
                place.nom +
                ". Rattachement administratif à vérifier.";
            }
          });

          results.appendChild(button);
        });
      });

    } catch (error) {
      status.textContent =
        "Impossible de charger les localités : " +
        error.message;

      console.error(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
