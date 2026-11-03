# Validation territoriale — 3 novembre 2026

## Contrôle du registre de 19 076 fiches

Le contrôle local précédent a produit **18 980 rattachements** et **96 fiches non rattachées** (99,5 %). La revue des 96 cas a relevé :
- 81 communes non renseignées ;
- 13 communes inconnues du référentiel ;
- 2 départements absents ou ambigus ;
- 21 pistes d'investigation (sans correction automatique).

La liste détaillée des 96 cas a été générée en CSV hors dépôt.

## Tests du normaliseur sur la branche

- Le référentiel chargé contient 149 communes.
- Les variantes `Artibonite Department / Gonaïves`, `Sud Department / Côteaux`, `Centre Department / Thomonde` et `Ouest / Cornillon / Grand Bois` sont normalisées correctement.
- `Thomonde` sans département est rattachée à `Centre` (nom non ambigu).
- `Nord / Hinche` est laissée non rattachée (département contradictoire).
- Une commune vide est laissée non rattachée.

**Limites :** tests fonctionnels du normaliseur sur échantillons, pas de test automatisé sur un navigateur réel, ni de vérification géographique des 96 points. Le site public et la branche `main` ne sont pas modifiés.

## Avant publication

1. Vérifier les 96 fiches par coordonnées et sources (et détecter les points éventuellement hors d'Haïti).
2. Vérifier les doublons institutionnels en attente.
3. Tester le chargement des trois fichiers JSON, les filtres des 149 communes et la carte sur la branche.
4. Recalculer la couverture et publier uniquement après contrôle.
