/* Fiches territoriales V4 — réutilise le répertoire existant, sans inventer de données. */
(()=>{"use strict";
const root=document.createElement("section");root.id="v4TerritorySheet";root.className="v4-territory-sheet";root.setAttribute("aria-live","polite");
const atlas=document.getElementById("atlas");if(!atlas)return;atlas.appendChild(root);
const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e};
const link=(label,href)=>{const a=document.createElement("a");a.textContent=label;a.href=href;a.target="_blank";a.rel="noopener noreferrer";return a};
let pilotData={};
function render(){
const dept=document.getElementById("department")?.value||"",arr=document.getElementById("arrondissement")?.value||"",commune=document.getElementById("commune")?.value||"";
root.replaceChildren();if(!commune||!dept){root.hidden=true;return}root.hidden=false;
const data=window.HAITI_TERRITOIRES?.departements||[];
const d=data.find(x=>x.nom===dept),a=d?.arrondissements.find(x=>x.nom===arr)||d?.arrondissements.find(x=>x.communes.includes(commune));
root.append(text("p","FICHE TERRITORIALE · RÉPERTOIRE NATIONAL"),text("h2",commune));
const meta=text("p",[dept,a?.nom,commune].filter(Boolean).join("  ›  "));meta.className="v4-sheet-meta";root.append(meta);
const pilot=pilotData[dept+"|"+commune];
const grid=document.createElement("div");grid.className="v4-sheet-grid";root.append(grid);
function panel(title,description){const s=document.createElement("article");s.append(text("h3",title),text("p",description));grid.append(s);return s}
const history=panel("Histoire & patrimoine","La notice historique de cette commune reste à documenter et à vérifier. Les sources externes permettent de commencer la recherche.");
if(pilot){history.querySelector("p").textContent=pilot.history;history.append(link("Source historique ↗",pilot.historySource))}
history.append(link("Rechercher des sources historiques ↗","https://fr.wikipedia.org/w/index.php?search="+encodeURIComponent(commune+" Haïti")));
const services=panel("Services & administrations","Explorez les administrations, bureaux, écoles, établissements de santé et autres lieux renseignés dans OpenStreetMap. Leur présence et leurs coordonnées restent à vérifier.");
if(pilot){services.append(text("h4","Établissement documenté"),text("p",pilot.hospital),link("Source officielle de l’hôpital ↗",pilot.hospitalSource),text("p","Mairie, écoles, commissariat et autres services : inventaire et coordonnées à vérifier."))}
const show=document.createElement("button");show.type="button";show.textContent="Afficher les lieux sur la carte";show.addEventListener("click",()=>{document.getElementById("atlas")?.scrollIntoView({behavior:"smooth"});document.getElementById("v4LoadPlaces")?.focus()});services.append(show);
const tourism=panel("Tourisme & lieux d'intérêt","Les sites patrimoniaux et touristiques seront ajoutés progressivement, avec description, photographie, localisation et sources.");
if(pilot){tourism.querySelector("p").textContent=pilot.heritage;tourism.append(link("Reportage sur le patrimoine local ↗",pilot.heritageSource))}
tourism.append(link("Rechercher les lieux documentés ↗","https://www.openstreetmap.org/search?query="+encodeURIComponent(commune+", Haïti")));
const future=panel("Vision Haïti 2050","Les projets présentés sont des propositions ou contributions locales, et non des travaux publics officiellement approuvés.");
if(pilot){const ul=document.createElement("ul");pilot.projects.forEach(v=>ul.append(text("li",v)));future.append(ul)}
const projectLink=document.createElement("a");projectLink.href="#projects";projectLink.textContent="Consulter les projets et propositions ↗";future.append(projectLink);
const warning=text("p","État des données : fiche en cours d'enrichissement. Aucun renseignement non vérifié n'est présenté comme un fait.");warning.className="v4-sheet-warning";root.append(warning);
}
fetch("./data/fond-des-blancs-pilot.json").then(r=>{if(!r.ok)throw Error("Données indisponibles");return r.json()}).then(data=>{pilotData=data;render()}).catch(()=>{});
document.addEventListener("haiti2050:territorychange",render);["department","arrondissement","commune"].forEach(id=>document.getElementById(id)?.addEventListener("change",()=>setTimeout(render,0)));render();
})();