# Haïti 2050 — architecture et feuille de route V3

## Deux objectifs distincts

1. **Haïti aujourd'hui** : présenter les données géographiques et les équipements existants avec leur source, leur date et leur niveau de vérification. Fonds : OpenStreetMap et satellite (date d'imagerie variable).
2. **Haïti 2050** : présenter des **propositions prospectives** d'infrastructures et d'aménagements. Elles ne sont ni des constructions existantes ni des projets approuvés. Ne jamais inventer de coordonnées.

## Modules actuellement chargés

| Module | Responsabilité |
|---|---|
| `territoires.js` | Référentiel des départements, arrondissements et communes |
| `app.js` | Menus, état territorial, création de la carte Leaflet actuelle, projets locaux |
| `map-v2.js` | Départements et arrondissements (GeoJSON ADM1/ADM2) |
| `communes-v25.js` | Polygones communaux et fiches communales |
| `sections-repertoire.js` | Sections communales et sélection |
| `quartiers.js`, `localites-nationales.js` | Localités et recherche ; vérifier les chevauchements de responsabilité |
| `bureaux-administratifs.js`, `etablissements.js` | Équipements et bureaux |
| `atlas-v3-modes.js` | Sélection rue/satellite/futur |
| `atlas-v3-future-map.js` | Carte Leaflet prospective indépendante |
| `atlas-v3-projects.js` | Projets de la commune, coordonnées déclarées et marqueurs prospectifs |

Les fichiers `sections.js` et `controle-sections.js` sont actuellement désactivés dans `index.html` ; ne pas les réactiver sans arbitrer leur rôle.

## Contrats de communication

- `window.haiti2050Map` : carte actuelle, initialisée **une seule fois** par `app.js`.
- `window.haiti2050FutureMap` : carte future, initialisée à la première ouverture du mode futur.
- `window.haiti2050FutureProjectLayer` : couche de marqueurs prospectifs.
- `haiti2050:territorychange` : sélection administrative mise à jour.
- `haiti2050:viewchange` : bascule de mode, `detail.mode` = `streets`, `satellite` ou `future`.
- `haiti2050:futuremapready` : carte prospective prête à afficher des marqueurs.
- `haiti2050:projectschange` : projets locaux modifiés.

## Modèle cible d'un projet

```json
{
  "id": "identifiant",
  "department": "Sud",
  "commune": "Fond-des-Blancs",
  "title": "Marché communal",
  "category": "Marché et commerce",
  "description": "Proposition à étudier",
  "status": "idee",
  "budget": "À étudier",
  "latitude": null,
  "longitude": null,
  "locationSource": "",
  "locationVerified": false,
  "demo": true
}
```

La vérification par case à cocher signifie **déclaration du contributeur**, pas contrôle indépendant. Les données de démonstration ne doivent jamais être décrites comme des réalisations.

## Priorités de stabilisation

- [x] Branche de test isolée de `main`.
- [x] Deux vues territoriales séparées ; rues et satellite dans la vue actuelle.
- [x] Couche prospective et liste de projets par commune.
- [x] Formulaire de coordonnées et source (stockage local uniquement).
- [x] Correction du bouton d'ouverture du formulaire et de l'événement de carte future prête.
- [ ] Vérification visuelle complète : desktop, mobile, zoom, affichage/masquage des cartes.
- [ ] Vérification géographique de Fond-des-Blancs et des localités ; polygones absents ou contestés à signaler.
- [ ] Audit des doublons de recherche et des sélecteurs.
- [ ] Ajouter un catalogue public de projets vérifiés et une persistance partagée avec modération.
- [ ] Intégrer des données d'infrastructures existantes avec provenance.
- [ ] Ajouter des fonctions IA seulement après stabilisation.

## Parcours de test minimal

1. Ouvrir la branche de prévisualisation.
2. Choisir Sud > Aquin > Fond-des-Blancs.
3. Vérifier l'affichage en mode rues puis satellite (sans surfaces opaques).
4. Passer en mode futur : la seconde carte doit être visible.
5. Lire les projets de démonstration, sans marqueur fictif.
6. Saisir une position réelle avec source pour un projet, vérifier son marqueur et revenir aux rues.
7. Revenir en mode futur : le marqueur doit être conservé dans ce navigateur.
8. Vérifier l'absence d'erreurs dans la console et la présentation sur mobile.

**Publication :** ne fusionner vers `main` qu'après validation de ces étapes et de la licence du fournisseur de tuiles satellite pour l'usage prévu.
