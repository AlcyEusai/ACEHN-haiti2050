/* Haïti 2050 V4 — 10 fiches départementales, 42 d'arrondissement, 149 communales.
   Répertoire territorial existant; aucune donnée manquante n'est inventée. */
(()=>{"use strict";
const atlas=document.getElementById("atlas"),territories=window.HAITI_TERRITOIRES?.departements;
if(!atlas||!Array.isArray(territories))return;
const root=document.createElement("section");root.id="v4TerritorySheet";root.className="v4-territory-sheet";root.setAttribute("aria-live","polite");atlas.append(root);
const el=(tag,value)=>{const node=document.createElement(tag);node.textContent=value;return node};
const norm=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/gi,"").toLowerCase();
const equal=(a,b)=>norm(a)===norm(b);
const labels={department:"Département",arrondissement:"Arrondissement",commune:"Commune"};
let pilotData={},registry=[],communalProfiles=[];
const current=()=>({department:document.getElementById("department")?.value||"",arrondissement:document.getElementById("arrondissement")?.value||"",commune:document.getElementById("commune")?.value||""});
function panel(grid,title,description){const box=document.createElement("article");box.append(el("h3",title),el("p",description));grid.append(box);return box}
function list(parent,values){const ul=document.createElement("ul");for(const value of values)ul.append(el("li",value));parent.append(ul);return ul}
function link(parent,title,url){const a=el("a",title);a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a)}
function sourceStatus(parent,status){const values={documente:"Documenté — source à consulter",historique:"Donnée historique — non actuelle",a_verifier:"À compléter ou vérifier"};const tag=el("span",values[status]||values.a_verifier);tag.className="v4-source-status v4-source-"+(values[status]?status:"a_verifier");parent.append(tag)}
function matches(place,selection){return (!selection.department||equal(place.department,selection.department))&&(!selection.arrondissement||equal(place.arrondissement,selection.arrondissement))&&(!selection.commune||equal(place.commune,selection.commune))}
function render(){
 const selection=current(),department=territories.find(d=>equal(d.nom,selection.department));
 const arrondissement=department?.arrondissements.find(a=>equal(a.nom,selection.arrondissement))||department?.arrondissements.find(a=>a.communes.some(c=>equal(c,selection.commune)));
 const commune=arrondissement?.communes.find(c=>equal(c,selection.commune));
 const level=commune?"commune":arrondissement?"arrondissement":department?"department":"national";
 root.replaceChildren();root.hidden=false;
 const name=level==="national"?"Haïti":level==="department"?department.nom:level==="arrondissement"?arrondissement.nom:commune;
 root.append(el("p","ATLAS HAÏTI 2050 · FICHE "+(level==="national"?"NATIONALE":labels[level].toUpperCase())),el("h2",name));
 const hierarchy=[department?.nom,arrondissement?.nom,commune].filter(Boolean);
 const meta=el("p",hierarchy.length?hierarchy.join(" › "):"Répertoire national des territoires");meta.className="v4-sheet-meta";root.append(meta);
 const allArr=territories.flatMap(d=>d.arrondissements),allCom=allArr.flatMap(a=>a.communes);
 const arrs=level==="national"?allArr:level==="department"?department.arrondissements:level==="arrondissement"?[arrondissement]:[arrondissement];
 const communes=level==="national"?allCom:level==="department"?department.arrondissements.flatMap(a=>a.communes):level==="arrondissement"?arrondissement.communes:[commune];
 const count=registry.filter(p=>matches(p,selection)).length;
 const summary=el("p",level==="national"?territories.length+" départements · "+allArr.length+" arrondissements · "+allCom.length+" communes":level==="department"?arrs.length+" arrondissements · "+communes.length+" communes":level==="arrondissement"?communes.length+" communes":"Commune de l'arrondissement de "+arrondissement.nom);
 summary.className="v4-sheet-meta";root.append(summary);
 const grid=document.createElement("div");grid.className="v4-sheet-grid";root.append(grid);
 const administration=panel(grid,"Identité administrative",level==="national"?"Organisation administrative nationale":level==="department"?"Chef-lieu départemental : "+(department.chefLieu||"À documenter"):level==="arrondissement"?"Département : "+department.nom:"Département : "+department.nom+" · Arrondissement : "+arrondissement.nom);
 if(level==="national")list(administration,territories.map(d=>d.nom));
 else if(level==="department")list(administration,arrs.map(a=>a.nom));
 else if(level==="arrondissement")list(administration,communes);
 else administration.append(el("p","Informations administratives complémentaires : à documenter."));
 const inventory=panel(grid,"Établissements et services",count+" fiche"+(count===1?"":"s")+" documentaire"+(count===1?"":"s")+" rattachée"+(count===1?"":"s")+" à ce territoire dans le registre GitHub. Ces fiches ne sont pas toutes vérifiées.");
 const byCategory={};for(const p of registry.filter(p=>matches(p,selection))){const category=p.category||"Autres";byCategory[category]=(byCategory[category]||0)+1}
 if(count)list(inventory,Object.entries(byCategory).map(([category,n])=>category+" : "+n));
 else inventory.append(el("p","Inventaire à compléter : santé, écoles, marchés, administrations et infrastructures."));
 const history=panel(grid,"Histoire et patrimoine","Notice historique et patrimoine : recherches et sources à compléter pour ce territoire.");
 const pilot=level==="commune"?pilotData[department.nom+"|"+commune]:null;
 if(pilot?.history){history.querySelector("p").textContent=pilot.history;if(pilot.historySource)link(history,"Consulter la source historique ↗",pilot.historySource)}
 link(history,"Rechercher des sources historiques ↗","https://fr.wikipedia.org/w/index.php?search="+encodeURIComponent(name+" Haïti"));
 const geography=panel(grid,"Géographie et localités",level==="commune"?"Sections communales, localités, superficie et population : à renseigner à partir de sources officielles.":level==="arrondissement"?"Les "+communes.length+" communes de cet arrondissement figurent dans le répertoire ci-dessus.":level==="department"?"Les "+communes.length+" communes sont réparties entre "+arrs.length+" arrondissements.":"L'atlas couvre le répertoire national des 149 communes.");
 const profile=level==="commune"?communalProfiles.find(p=>equal(p.department,department.nom)&&equal(p.arrondissement,arrondissement.nom)&&equal(p.commune,commune)):null;
 if(profile){
  const context=panel(grid,"Portrait communal documenté","Informations issues de sources documentaires datées; ne constituent pas une validation de terrain.");
  if(profile.population?.value){const line=el("p","Population (estimation "+profile.population.year+") : "+profile.population.value.toLocaleString("fr-FR")+" habitants.");context.append(line);sourceStatus(context,profile.population.status||"historique");if(profile.population.source)link(context,"Source de la population ↗",profile.population.source)} 
  if(profile.populationUrbaine?.value){context.append(el("p","Population urbaine estimée ("+profile.populationUrbaine.year+") : "+profile.populationUrbaine.value.toLocaleString("fr-FR")+" habitants — ne représente pas la population totale de la commune."));sourceStatus(context,profile.populationUrbaine.status);if(profile.populationUrbaine.source)link(context,"Source IHSI — population urbaine ↗",profile.populationUrbaine.source)}
  if(profile.areaKm2){context.append(el("p","Superficie indiquée par la source : "+profile.areaKm2+" km²."));sourceStatus(context,profile.areaStatus);if(profile.areaSource)link(context,"Source de la superficie ↗",profile.areaSource)}
  if(profile.sectionsCommunales?.length){context.append(el("h4","Sections communales"));list(context,profile.sectionsCommunales);sourceStatus(context,profile.sectionsStatus);if(profile.sectionsSource)link(context,"Source des sections ↗",profile.sectionsSource)}
  if(profile.history?.text){history.querySelector("p").textContent=profile.history.text;sourceStatus(history,profile.history.status||"historique");for(const source of profile.history.sources||[])link(history,"Source historique ↗",source)}
  for(const [title,items] of [["Services publics documentés",profile.services],["Infrastructures et mobilité",profile.infrastructures],["Patrimoine local",profile.heritage]]){
   if(!items?.length)continue;const box=panel(grid,title,"Sources documentaires : vérifier l'état actuel et la localisation de chaque élément.");
   for(const item of items){box.append(el("h4",item.name),el("p",item.detail));sourceStatus(box,item.status);if(item.source)link(box,"Consulter la source ↗",item.source)}
  }
  if(profile.nearbyNotInCommune?.length){const nearby=panel(grid,"Patrimoine régional hors commune","Sites voisins : présentés à titre de contexte et non comme établissements de la commune.");for(const item of profile.nearbyNotInCommune){nearby.append(el("h4",item.name),el("p","Commune : "+item.commune+". "+item.detail));sourceStatus(nearby,item.status);if(item.source)link(nearby,"Source ↗",item.source)}}
 }
 if(profile?.audit?.warnings?.length){const audit=panel(grid,"Contrôle documentaire","Précautions de lecture et points à vérifier :");list(audit,profile.audit.warnings)}
 const future=panel(grid,"Vision Haïti 2050","Espace pour les projets et priorités de développement du territoire. Les propositions ne constituent pas des projets publics approuvés.");
 if(pilot?.projects)list(future,pilot.projects);
 const a=el("a","Consulter les projets et propositions ↗");a.href="#projects";future.append(a);
 const status=el("p","État documentaire : structure territoriale disponible pour chaque département, arrondissement et commune. Les données historiques, démographiques et les établissements seront enrichis progressivement et vérifiés avec leurs sources.");status.className="v4-sheet-warning";root.append(status)
}
document.addEventListener("haiti2050:territorychange",render);
for(const id of ["department","arrondissement","commune"])document.getElementById(id)?.addEventListener("change",()=>queueMicrotask(render));
fetch("./data/fond-des-blancs-pilot.json").then(r=>r.ok?r.json():{}).then(data=>{pilotData=data;render()}).catch(()=>{});
fetch("./data/fiches-communales.json",{cache:"no-store"}).then(r=>r.ok?r.json():{}).then(data=>{communalProfiles=Array.isArray(data.communes)?data.communes:[];render()}).catch(()=>{});
fetch("./data/registre-etablissements.json",{cache:"no-store"}).then(r=>r.ok?r.json():{}).then(data=>{registry=Array.isArray(data.places)?data.places:[];render()}).catch(()=>{});
render();
})();