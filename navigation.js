
/*
 * HAÏTI 2050 — Navigation V2.4
 * Département > Arrondissement > Commune
 * À charger après app.js et map-v2.js.
 */
(() => {
  "use strict";

  const source = window.HAITI_TERRITOIRES;
  if (!source || !Array.isArray(source.departements)) {
    console.error("territoires.js est absent.");
    return;
  }

  const depSelect = document.getElementById("department");
  const arrSelect = document.getElementById("arrondissement");
  const comSelect = document.getElementById("commune");
  const count = document.getElementById("communeCount");

  if (!depSelect || !arrSelect || !comSelect) {
    console.error("Un menu territorial est absent.");
    return;
  }

  function normaliser(valeur) {
    return String(valeur || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘']/g, "'")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  function remplir(select, noms, placeholder) {
    select.replaceChildren();

    const optionVide = new Option(placeholder, "");
    select.add(optionVide);

    noms.forEach(nom => {
      select.add(new Option(nom, nom));
    });
  }

  function departementActuel() {
    return source.departements.find(
      d => normaliser(d.nom) ===
           normaliser(depSelect.value)
    );
  }

  function arrondissementActuel() {
    const dep = departementActuel();

    if (!dep) return null;

    return dep.arrondissements.find(
      a => normaliser(a.nom) ===
           normaliser(arrSelect.value)
    );
  }

  function afficherArrondissements() {
    const dep = departementActuel();

    remplir(
      arrSelect,
      dep ? dep.arrondissements.map(a => a.nom) : [],
      "Choisir un arrondissement"
    );

    remplir(
      comSelect,
      [],
      "Choisir une commune"
    );
  }

  function afficherCommunes() {
    const arr = arrondissementActuel();

    remplir(
      comSelect,
      arr ? arr.communes : [],
      "Choisir une commune"
    );
  }

  function afficherTerritoire() {
    const dep = departementActuel();
    const arr = arrondissementActuel();
    const commune = comSelect.value;

    if (!dep || !arr || !commune) return;

    const titre =
      document.getElementById("selectionTitle");
    const description =
      document.getElementById("selectionDescription");

    if (titre) titre.textContent = commune;

    if (description) {
      description.textContent =
        "Département : " + dep.nom +
        ". Arrondissement : " + arr.nom +
        ". Commune : " + commune +
        ". Les limites géographiques communales " +
        "restent à intégrer après vérification.";
    }

    // Synchroniser la sélection avec app.js
    // uniquement si les variables existent.
    try {
      if (typeof currentDepartment !== "undefined") {
        currentDepartment = dep.nom;
      }

      if (typeof currentCommune !== "undefined") {
        currentCommune = commune;
      }
    } catch (error) {
      console.warn("Synchronisation partielle :", error);
    }

    // Mise à jour de la fiche pilote si disponible.
    if (typeof renderTerritoryProfile === "function") {
      renderTerritoryProfile();
    }
  }

  // Compléter les départements avec la source nationale.
  remplir(
    depSelect,
    source.departements.map(d => d.nom),
    "Choisir un département"
  );

  // Charger les arrondissements après les événements
  // déjà enregistrés par app.js.
  depSelect.addEventListener(
    "change",
    afficherArrondissements
  );

  arrSelect.addEventListener(
    "change",
    afficherCommunes
  );

  comSelect.addEventListener(
    "change",
    afficherTerritoire
  );

  // Recherche nationale par nom de commune.
  const recherche = document.getElementById("search");
  const bouton = document.getElementById("searchBtn");

  if (recherche && bouton) {
    bouton.addEventListener("click", () => {
      const mot = normaliser(recherche.value);
      if (!mot) return;

      for (const dep of source.departements) {
        for (const arr of dep.arrondissements) {
          const commune = arr.communes.find(
            nom => normaliser(nom) === mot
          );

          if (!commune) continue;

          depSelect.value = dep.nom;
          afficherArrondissements();

          arrSelect.value = arr.nom;
          afficherCommunes();

          comSelect.value = commune;
          afficherTerritoire();
          return;
        }
      }
    });
  }

  // Afficher le nombre de communes réellement inscrites.
  const total = source.departements.reduce(
    (n, d) =>
      n + d.arrondissements.reduce(
        (m, a) => m + a.communes.length,
        0
      ),
    0
  );

  if (count) count.textContent = total;

  afficherArrondissements();

  console.log(
    "HAÏTI 2050 — Navigation territoriale chargée."
  );
})();
