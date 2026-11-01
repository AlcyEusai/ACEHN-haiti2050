
/*
 * HAÏTI 2050 — Répertoire national V2.4
 * Référence : IHSI, Estimations désagrégées
 * de la population haïtienne en 2024,
 * Tableau 1, pages 15–16.
 *
 * Données administratives uniquement.
 * Ce fichier ne contient pas de frontières.
 */

window.HAITI_TERRITOIRES = {
  version: "2.4",
  source: "IHSI — divisions territoriales, 2024",
  totaux: {
    departements: 10,
    arrondissements: 42,
    communes: 149,
    sectionsCommunales: 574
  },

  departements: [
    {
      nom: "Ouest",
      chefLieu: "Port-au-Prince",
      arrondissements: [
        {
          nom: "Port-au-Prince",
          communes: [
            "Port-au-Prince", "Delmas",
            "Cité Soleil", "Tabarre",
            "Carrefour", "Pétion-Ville",
            "Kenscoff", "Gressier"
          ]
        },
        {
          nom: "Léogâne",
          communes: [
            "Léogâne", "Petit-Goâve",
            "Grand-Goâve"
          ]
        },
        {
          nom: "Croix-des-Bouquets",
          communes: [
            "Croix-des-Bouquets", "Thomazeau",
            "Ganthier", "Cornillon",
            "Fonds-Verrettes"
          ]
        },
        {
          nom: "Arcahaie",
          communes: ["Arcahaie", "Cabaret"]
        },
        {
          nom: "La Gonâve",
          communes: [
            "Anse-à-Galets", "Pointe-à-Raquette"
          ]
        }
      ]
    },

    {
      nom: "Sud-Est",
      chefLieu: "Jacmel",
      arrondissements: [
        {
          nom: "Jacmel",
          communes: [
            "Jacmel", "Marigot",
            "Cayes-Jacmel", "La Vallée-de-Jacmel"
          ]
        },
        {
          nom: "Bainet",
          communes: ["Bainet", "Côtes-de-Fer"]
        },
        {
          nom: "Belle-Anse",
          communes: [
            "Belle-Anse", "Grand-Gosier",
            "Thiotte", "Anse-à-Pitre"
          ]
        }
      ]
    },

    {
      nom: "Nord",
      chefLieu: "Cap-Haïtien",
      arrondissements: [
        {
          nom: "Cap-Haïtien",
          communes: [
            "Cap-Haïtien", "Quartier-Morin",
            "Limonade"
          ]
        },
        {
          nom: "Acul-du-Nord",
          communes: [
            "Acul-du-Nord", "Plaine-du-Nord",
            "Milot"
          ]
        },
        {
          nom: "Grande-Rivière-du-Nord",
          communes: [
            "Grande-Rivière-du-Nord", "Bahon"
          ]
        },
        {
          nom: "Saint-Raphaël",
          communes: [
            "Saint-Raphaël", "Dondon",
            "Ranquitte", "Pignon", "La Victoire"
          ]
        },
        {
          nom: "Borgne",
          communes: ["Borgne", "Port-Margot"]
        },
        {
          nom: "Limbé",
          communes: ["Limbé", "Bas-Limbé"]
        },
        {
          nom: "Plaisance",
          communes: ["Plaisance", "Pilate"]
        }
      ]
    },

    {
      nom: "Nord-Est",
      chefLieu: "Fort-Liberté",
      arrondissements: [
        {
          nom: "Fort-Liberté",
          communes: [
            "Fort-Liberté", "Ferrier", "Perches"
          ]
        },
        {
          nom: "Ouanaminthe",
          communes: [
            "Ouanaminthe", "Capotille",
            "Mont-Organisé"
          ]
        },
        {
          nom: "Trou-du-Nord",
          communes: [
            "Trou-du-Nord", "Sainte-Suzanne",
            "Terrier-Rouge", "Caracol",
            "Grand-Bassin"
          ]
        },
        {
          nom: "Vallières",
          communes: [
            "Vallières", "Carice",
            "Mombin-Crochu"
          ]
        }
      ]
    },

    {
      nom: "Artibonite",
      chefLieu: "Les Gonaïves",
      arrondissements: [
        {
          nom: "Les Gonaïves",
          communes: [
            "Les Gonaïves", "Ennery", "L'Estère"
          ]
        },
        {
          nom: "Gros-Morne",
          communes: [
            "Gros-Morne", "Terre-Neuve",
            "Anse-Rouge"
          ]
        },
        {
          nom: "Saint-Marc",
          communes: [
            "Saint-Marc", "Verrettes",
            "La Chapelle", "Liancourt",
            "Montrouis"
          ]
        },
        {
          nom: "Dessalines",
          communes: [
            "Dessalines",
            "Petite-Rivière-de-l'Artibonite",
            "Grande-Saline", "Desdunes"
          ]
        },
        {
          nom: "Marmelade",
          communes: [
            "Marmelade",
            "Saint-Michel-de-l'Attalaye"
          ]
        }
      ]
    },

    {
      nom: "Centre",
      chefLieu: "Hinche",
      arrondissements: [
        {
          nom: "Hinche",
          communes: [
            "Hinche", "Maïssade",
            "Thomonde", "Cerca-Carvajal"
          ]
        },
        {
          nom: "Mirebalais",
          communes: [
            "Mirebalais", "Saut-d'Eau",
            "Boucan-Carré"
          ]
        },
        {
          nom: "Lascahobas",
          communes: [
            "Lascahobas", "Belladère",
            "Savanette", "Baptiste"
          ]
        },
        {
          nom: "Cerca-la-Source",
          communes: [
            "Cerca-la-Source", "Thomassique"
          ]
        }
      ]
    },

    {
      nom: "Sud",
      chefLieu: "Les Cayes",
      arrondissements: [
        {
          nom: "Les Cayes",
          communes: [
            "Les Cayes", "Torbeck", "Chantal",
            "Camp-Perrin", "Maniche",
            "Île-à-Vache", "Ducis"
          ]
        },
        {
          nom: "Port-Salut",
          communes: [
            "Port-Salut", "Saint-Jean-du-Sud",
            "Arniquet"
          ]
        },
        {
          nom: "Aquin",
          communes: [
            "Aquin", "Saint-Louis-du-Sud",
            "Cavaillon", "Fond-des-Blancs"
          ]
        },
        {
          nom: "Côteaux",
          communes: [
            "Les Côteaux", "Port-à-Piment",
            "Roche-à-Bateau"
          ]
        },
        {
          nom: "Chardonnières",
          communes: [
            "Chardonnières", "Les Anglais",
            "Tiburon"
          ]
        }
      ]
    },

    {
      nom: "Grand'Anse",
      chefLieu: "Jérémie",
      arrondissements: [
        {
          nom: "Jérémie",
          communes: [
            "Jérémie", "Abricots", "Bonbon",
            "Moron", "Chambellan", "Marfranc"
          ]
        },
        {
          nom: "Anse-d'Hainault",
          communes: [
            "Anse-d'Hainault", "Dame-Marie",
            "Les Irois"
          ]
        },
        {
          nom: "Corail",
          communes: [
            "Corail", "Roseaux", "Beaumont",
            "Pestel", "Île Cayémites"
          ]
        }
      ]
    },

    {
      nom: "Nord-Ouest",
      chefLieu: "Port-de-Paix",
      arrondissements: [
        {
          nom: "Port-de-Paix",
          communes: [
            "Port-de-Paix", "La Tortue",
            "Bassin-Bleu", "Chansolme",
            "La Pointe"
          ]
        },
        {
          nom: "Saint-Louis-du-Nord",
          communes: [
            "Saint-Louis-du-Nord", "Anse-à-Foleur"
          ]
        },
        {
          nom: "Môle-Saint-Nicolas",
          communes: [
            "Môle-Saint-Nicolas", "Baie-de-Henne",
            "Bombardopolis", "Jean-Rabel"
          ]
        }
      ]
    },

    {
      nom: "Nippes",
      chefLieu: "Miragoâne",
      arrondissements: [
        {
          nom: "Miragoâne",
          communes: [
            "Miragoâne", "Petite-Rivière-de-Nippes",
            "Fonds-des-Nègres", "Paillant"
          ]
        },
        {
          nom: "Anse-à-Veau",
          communes: [
            "Anse-à-Veau", "Petit-Trou-de-Nippes",
            "L'Asile", "Arnaud", "Plaisance-du-Sud"
          ]
        },
        {
          nom: "Baradères",
          communes: ["Baradères", "Grand-Boucan"]
        }
      ]
    }
  ]
};

// Vérification automatique du répertoire
(function verifierRepertoire() {
  const data = window.HAITI_TERRITOIRES;
  const depts = data.departements.length;

  const arrs = data.departements.reduce(
    (total, d) => total + d.arrondissements.length,
    0
  );

  const communes = data.departements.reduce(
    (total, d) =>
      total + d.arrondissements.reduce(
        (n, a) => n + a.communes.length, 0
      ),
    0
  );

  const attendus = data.totaux;

  const valide =
    depts === attendus.departements &&
    arrs === attendus.arrondissements &&
    communes === attendus.communes;

  console.log("HAÏTI 2050 — Répertoire :", {
    departements: depts,
    arrondissements: arrs,
    communes: communes,
    valide: valide
  });

  if (!valide) {
    console.error(
      "HAÏTI 2050 : incohérence du répertoire."
    );
  }
})();


/*
 * HAÏTI 2050 — Contrôle des frontières communales
 * Compare territoires.js avec haiti-communes.geojson
 */

(async function verifierFrontieresCommunales() {
  const repertoire = window.HAITI_TERRITOIRES;

  function normaliser(nom) {
    return String(nom || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/^les(?=[a-z])/, "");
  }

  try {
    const reponse = await fetch(
      "./data/haiti-communes.geojson"
    );

    if (!reponse.ok) {
      throw new Error("HTTP " + reponse.status);
    }

    const geojson = await reponse.json();

    const frontieres = new Set(
      geojson.features.map(feature => {
        const p = feature.properties || {};

        return (
          normaliser(p.ADM1_FR) + "|" +
          normaliser(p.ADM2_FR)
        );
      })
    );

    const communes = [];

    repertoire.departements.forEach(departement => {
      departement.arrondissements.forEach(arrondissement => {
        arrondissement.communes.forEach(commune => {
          communes.push({
            departement: departement.nom,
            arrondissement: arrondissement.nom,
            commune
          });
        });
      });
    });

    const manquantes = communes.filter(item => {
      const cle =
        normaliser(item.departement) + "|" +
        normaliser(item.commune);

      return !frontieres.has(cle);
    });

    console.log("HAÏTI 2050 — Contrôle géographique");
    console.log("Communes du répertoire :", communes.length);
    console.log("Frontières GeoJSON :", geojson.features.length);
    console.log("Communes sans correspondance :", manquantes.length);

    console.table(manquantes);

    window.HAITI_COMMUNES_SANS_FRONTIERES = manquantes;

  } catch (erreur) {
    console.error(
      "Impossible de comparer les frontières :",
      erreur
    );
  }
})();
