
/*
 * HAÏTI 2050 — Contrôle des sections communales
 * Vérifie le fichier GeoJSON avant exploitation.
 */

(async () => {
  const url = "./data/haiti-sections.geojson";

  const normaliser = texte =>
    String(texte || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (
      data.type !== "FeatureCollection" ||
      !Array.isArray(data.features)
    ) {
      throw new Error("Structure GeoJSON invalide");
    }

    const rapport = {
      totalPolygones: data.features.length,
      sansNom: 0,
      sansCommune: 0,
      sansDepartement: 0,
      geometriesInvalides: 0,
      rattachementsInconnus: 0
    };

    const repertoire = window.HAITI_TERRITOIRES;

    const communesConnues = new Set();

    if (repertoire?.departements) {
      for (const dep of repertoire.departements) {
        for (const arr of dep.arrondissements) {
          for (const commune of arr.communes) {
            communesConnues.add(
              normaliser(dep.nom) + "|" +
              normaliser(commune)
            );
          }
        }
      }
    }

    for (const feature of data.features) {
      const p = feature.properties || {};

      const nom = p.ADM3_FR || p.ADM3_EN;
      const commune = p.ADM2_FR || p.ADM2_EN;
      const departement = p.ADM1_FR || p.ADM1_EN;

      if (!nom) rapport.sansNom++;
      if (!commune) rapport.sansCommune++;
      if (!departement) rapport.sansDepartement++;

      if (
        !feature.geometry ||
        !["Polygon", "MultiPolygon"].includes(
          feature.geometry.type
        )
      ) {
        rapport.geometriesInvalides++;
      }

      if (
        commune &&
        departement &&
        communesConnues.size &&
        !communesConnues.has(
          normaliser(departement) + "|" +
          normaliser(commune)
        )
      ) {
        rapport.rattachementsInconnus++;
      }
    }

    console.table(rapport);

    const panel = document.createElement("section");
    panel.style.cssText =
      "max-width:1240px;margin:20px auto;" +
      "padding:20px;background:white;" +
      "border:1px solid #ddd;border-radius:12px;";

    const title = document.createElement("h3");
    title.textContent =
      "Contrôle des sections communales";

    const summary = document.createElement("p");
    summary.textContent =
      rapport.totalPolygones +
      " polygones chargés. " +
      rapport.sansNom +
      " sans nom. " +
      rapport.sansCommune +
      " sans commune. " +
      rapport.rattachementsInconnus +
      " rattachements à vérifier.";

    const note = document.createElement("p");
    note.textContent =
      "Un rattachement inconnu peut provenir " +
      "d'une différence orthographique ou " +
      "d'un découpage administratif différent.";

    panel.append(title, summary, note);

    document.getElementById("atlas")
      ?.appendChild(panel);

  } catch (error) {
    console.error(
      "Contrôle des sections impossible :",
      error
    );
  }
})();
