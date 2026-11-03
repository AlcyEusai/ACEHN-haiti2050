# Prochaines communes : Thomonde et Maïssade

## État initial du registre national transmis (3 novembre 2026)

| Commune | Total | Éducation | Santé | Autres |
|---|---:|---:|---:|---:|
| Thomonde | 24 | 12 | 8 | 4 |
| Maïssade | 13 | 2 | 8 | 3 |

Ces nombres sont des fiches déjà présentes, **pas** le total réel des établissements de chaque commune.

## Sources et limites

- MENFP : rechercher le répertoire nominatif officiel par commune, avec codes, secteur et section communale ; ne pas inventer les écoles manquantes.
- MSPP : rechercher la liste officielle des structures sanitaires et confronter noms et coordonnées aux 8 fiches existantes dans chaque commune.
- Fonds national de l'éducation, enquête PAEF 2025 : 5 écoles enquêtées à Thomonde et 11 à Maïssade. **Il s'agit uniquement des écoles de l'enquête sur les victimes de l'insécurité, pas du recensement scolaire exhaustif.** Source : https://fne.gouv.ht/wp-content/uploads/2025/07/FNE_PAEF_Rapport-Final_juillet2025.pdf

## Critères d'intégration

1. Comparer chaque établissement MENFP/MSPP aux fiches existantes (nom normalisé, code officiel, localité, coordonnées lorsqu'elles sont fiables).
2. Conserver les codes officiels et les références de sources.
3. Laisser latitude/longitude nulles si inconnues ; ne pas placer de marqueur approximatif.
4. Ne pas fusionner les homonymes sans confirmation.
5. Valider le JSON, l'absence de doublons d'ID et le chargement dans le site avant fusion dans main.

**Statut : audit de départ ; aucune nouvelle école ou structure de santé ajoutée faute de registre nominatif vérifié.**

## Périmètre élargi : inventaire de toutes les institutions

L'atlas ne doit pas se limiter aux écoles et aux structures sanitaires. Pour Thomonde puis Maïssade, inventorier progressivement : administration publique, sécurité/justice, commerces et marchés, agriculture, transports, eau et énergie, patrimoine/culture, religion et associations, sports, télécommunications, éducation et santé.

### Méthode

- Conserver les catégories existantes du registre national et les enrichir seulement si nécessaire.
- Rechercher les institutions par commune et section communale dans les sources publiques appropriées (OSM, administrations haïtiennes, registres sectoriels, données communales).
- Vérifier l'existence, l'emplacement, la catégorie et les doublons avant toute insertion.
- Ne jamais interpréter l'absence dans le registre comme une preuve d'inexistence.
- Suivre la couverture par catégorie et par commune, avec sources et statut de vérification.

**Cette extension du périmètre est une spécification de travail : elle n'atteste pas que toutes ces catégories ont déjà été recensées.**
