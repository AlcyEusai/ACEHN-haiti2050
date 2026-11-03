/* Haïti 2050 — réconciliation territoriale non destructive.
   Référentiel : window.HAITI_TERRITOIRES, chargé avant ce script.
   Ne devine jamais une commune ambiguë ni un département absent. */
window.HAITI_NORMALISER_ETABLISSEMENTS = function(records) {
  const ref = window.HAITI_TERRITOIRES;
  if (!ref || !Array.isArray(ref.departements)) return {records,rapport:{erreur:"Référentiel territorial absent"}};
  const norm = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const aliases = {'artibonitedepartment':'artibonite','suddepartment':'sud','nordestdepartment':'nordest','nordouestdepartment':'nordouest','centredepartement':'centre','centredepartmant':'centre','centredepartementhaiti':'centre','centredept':'centre','centredepart':'centre','centredepartment':'centre','grandeansedepartment':'grandeanse','nippesdepartment':'nippes','sudestdepartment':'sudest','norddepartment':'nord','ouestdepartment':'ouest'};
  const communeAliases = {
    'gonaives':'lesgonaives',
    'cornillongrandbois':'cornillon',
    'lavallee':'lavalleedejacmel',
    'coteaux':'lescoteaux',
    'chamsolme':'chansolme',
    'communeileavache':'ileavache',
    'communeportapiment':'portapiment'
  };
  aliases['grandeanse']='grandanse';
  const deps = new Map(), all = new Map();
  for (const d of ref.departements) {
    const communes = new Map();
    for (const a of d.arrondissements) for (const c of a.communes) {
      const name = typeof c==='string'?c:c.nom;
      const key=norm(name);if(!communes.has(key))communes.set(key,[]);
      communes.get(key).push({commune:name,arrondissement:a.nom});
      if(!all.has(key))all.set(key,[]);all.get(key).push({commune:name,arrondissement:a.nom,departement:d.nom});
    }
    deps.set(norm(d.nom),{nom:d.nom,communes});
  }
  const rapport={total:records.length,departements_normalises:0,communes_normalisees:0,communes_inferrees_sans_departement:0,non_rattaches:[],ambiguities:[]};
  const result=records.map((original,index)=>{
    const x={...original};const rawDep=x.departement,rawComm=x.commune;
    const dk=norm(rawDep), dep=deps.get(aliases[dk]||dk);
    if(dep) {
      if(x.departement!==dep.nom){x.departement=dep.nom;rapport.departements_normalises++;}
      const matches=dep.communes.get(communeAliases[norm(rawComm)]||norm(rawComm))||[];
      if(matches.length===1){
        if(x.commune!==matches[0].commune){x.commune=matches[0].commune;rapport.communes_normalisees++;}
        if(!x.arrondissement)x.arrondissement=matches[0].arrondissement;
      } else {rapport.non_rattaches.push({index,id:x.id||'',departement:rawDep,commune:rawComm,raison:matches.length?'commune_ambigue':'commune_introuvable'});}
    } else if(!dk) {
      const matches=all.get(communeAliases[norm(rawComm)]||norm(rawComm))||[];
      if(matches.length===1){
        x.departement=matches[0].departement;x.commune=matches[0].commune;
        if(!x.arrondissement)x.arrondissement=matches[0].arrondissement;
        rapport.communes_inferrees_sans_departement++;
      } else {rapport.non_rattaches.push({index,id:x.id||'',departement:rawDep,commune:rawComm,raison:matches.length?'commune_ambigue':'departement_absent'});}
    } else {rapport.non_rattaches.push({index,id:x.id||'',departement:rawDep,commune:rawComm,raison:'departement_inconnu'});}
    return x;
  });
  rapport.non_rattaches_total=rapport.non_rattaches.length;
  return {records:result,rapport};
};
