
/*
 HAÏTI 2050
 Répertoire territorial national

 Source de référence :
 IHSI — Estimations désagrégées
 de la population haïtienne en 2024.

 Le répertoire sera complété
 département par département.
*/

window.HAITI_TERRITOIRES = {
  version: "2.4",
  source: "IHSI, données territoriales 2024",
  totalNational: {
    departements: 10,
    arrondissements: 42,
    communes: 149,
    sectionsCommunales: 574
  },

  departements: [
    {
      nom: "Sud",
      chefLieu: "Les Cayes",
      arrondissements: [
        {
          nom: "Les Cayes",
          communes: [
            "Les Cayes",
            "Torbeck",
            "Chantal",
            "Camp-Perrin",
            "Maniche",
            "Île-à-Vache",
            "Ducis"
          ]
        },
        {
          nom: "Port-Salut",
          communes: [
            "Port-Salut",
            "Saint-Jean-du-Sud",
            "Arniquet"
          ]
        },
        {
          nom: "Aquin",
          communes: [
            "Aquin",
            "Saint-Louis-du-Sud",
            "Cavaillon",
            "Fond-des-Blancs"
          ]
        },
        {
          nom: "Côteaux",
          communes: [
            "Côteaux",
            "Port-à-Piment",
            "Roche-à-Bateau"
          ]
        },
        {
          nom: "Chardonnières",
          communes: [
            "Chardonnières",
            "Les Anglais",
            "Tiburon"
          ]
        }
      ]
    }
  ]
};
