# Audit des doublons — écoles non publiques de Savanette

Source de travail : registre MENFP Centre 2024-2025.

- 46 fiches, 46 codes MENFP uniques.
- Une paire porte exactement le même nom avec deux codes et deux sections différentes : École presbytérale Notre-Dame d'Altagrâce de Corosse (063401205752 / 063402215768).
- Trois paires de noms voisins à vérifier : Fieroute de Mare Bleu (063401205662 / 063401219650), Persévérance de Mare Georges (063402209309 / 063402211485), Institution communautaire L'Oiseau Vert (063490202714 / 063490217618).
- Aucun regroupement automatique de ces paires n'est justifié sur la seule base du nom.
- Les coordonnées GPS ne sont pas connues et ne doivent pas être inventées.
- La fusion dans main doit attendre une vérification documentaire ou locale des paires et un test de chargement sur la branche.

## Contrôle technique du 3 novembre 2026

- JSON des 46 écoles analysé et syntaxiquement valide.
- 46 identifiants et 46 codes MENFP distincts ; champs essentiels renseignés.
- Le script `etablissements.js` contient le chargement des deux registres et un filtre par identifiant/code.
- Aucun test dans un navigateur ni test du site déployé n'a encore été exécuté.
- Les quatre paires de noms voisins restent non résolues : codes distincts, identité physique non confirmée.
- **Décision : ne pas fusionner la PR tant que ces vérifications ne sont pas levées.**
