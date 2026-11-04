
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

    const pickerLabel=document.createElement("label");pickerLabel.htmlFor="geonamesPicker";pickerLabel.textContent="Choisir une localité dans la liste";
const picker=document.createElement("select");picker.id="geonamesPicker";picker.style.cssText="display:block;width:100%;padding:11px;margin:8px 0;box-sizing:border-box";
picker.append(new Option("Choisir une localité…",""));
panel.append(label,field,pickerLabel,picker,status,results);

    // Trouver la vraie barre latérale
    const sidebar = document.querySelector(
      "#atlas .workspace > aside"
    );

    if (!sidebar) {
      console.error("Barre latérale introuvable");
      return;
    }

    // Placer la recherche après le menu Commune
    const communeSelect = document.getElementById("commune");

    if (communeSelect && sidebar.contains(communeSelect)) {
      communeSelect.insertAdjacentElement("afterend", panel);
    } else {
      sidebar.appendChild(panel);
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

      const goToPlace=place=>{
 const lat=Number(place.latitude),lon=Number(place.longitude);
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return;
 field.value=place.nom;results.replaceChildren();
 const map=window.haiti2050Map;
 if(map&&window.L){map.setView([lat,lon],13);L.popup().setLatLng([lat,lon]).setContent(document.createTextNode(place.nom)).openOn(map);}
 status.textContent="Localité sélectionnée : "+place.nom+". Rattachement administratif à vérifier.";
};
const updatePicker=query=>{
 const matches=places.filter(p=>normalize(p.nom).includes(query)).slice(0,150);
 picker.replaceChildren(new Option(query?matches.length+" résultats — choisir…":"Choisir une localité…",""));
 for(const p of matches){const o=new Option(p.nom+" ("+Number(p.latitude).toFixed(3)+", "+Number(p.longitude).toFixed(3)+")",String(places.indexOf(p)));picker.add(o);}
 return matches;
};
picker.addEventListener("change",()=>{if(picker.value!=="")goToPlace(places[Number(picker.value)])});
updatePicker("");
field.addEventListener("input", () => {
        const query = normalize(field.value);
        results.replaceChildren();

        updatePicker(query);
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
            Number(place.latitude).toFixed(4) + ", " +
            Number(place.longitude).toFixed(4);

          button.addEventListener("click", () => goToPlace(place));

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
