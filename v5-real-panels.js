/* V5 — Fiches réelles : miroir des modules documentaires déjà présents. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const commune=$("commune"),department=$("department"),arrondissement=$("arrondissement");
const card=$("maquetteAujourdHui");if(!card)return;
const panels=card.querySelectorAll(".maquette-showcase-card");
if(panels.length!==3)return;
const territoryBody=panels[0].querySelector(".maquette-showcase-body");
const institutionBody=panels[1].querySelector(".maquette-showcase-body");
const projectBody=panels[2].querySelector(".maquette-showcase-body");
function element(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n}
const territorial=element("div","v5-real-details");territoryBody.insertBefore(territorial,territoryBody.querySelector("a"));
const institutions=element("div","v5-real-details");institutionBody.insertBefore(institutions,institutionBody.querySelector("a"));
const proposals=element("div","v5-real-details");projectBody.insertBefore(proposals,projectBody.querySelector("a"));
function cloneText(source,destination,limit){destination.replaceChildren();if(!source){destination.append(element("p","","Informations en cours de chargement."));return}
 const sections=[...source.querySelectorAll(".v4-sheet-grid > article")];
 for(const section of sections.slice(0,limit)){const title=section.querySelector("h3")?.textContent||"Informations";const block=element("div","v5-real-group");block.append(element("strong","",title));const lines=[...section.querySelectorAll("p,li")].map(n=>n.textContent.trim()).filter(Boolean);for(const line of lines.slice(0,4))block.append(element("p","",line));destination.append(block)}
 if(!sections.length)destination.append(element("p","","Sélectionnez une commune pour consulter sa fiche."))}
function renderTerritory(){cloneText($("v4TerritorySheet"),territorial,3)}
function renderInstitutions(){
 institutions.replaceChildren();
 const selected=commune?.selectedOptions?.[0]?.textContent?.trim();
 const current=commune?.value;
 institutions.append(element("strong","",current?"Établissements : "+selected:"Établissements du territoire"));
 institutions.append(element("p","",current?"Les résultats et leurs sources sont consultables dans l’inventaire et le catalogue national.":"Sélectionnez une commune pour consulter les fiches disponibles."));
 const links=[["Voir l’inventaire","#etablissementsPanel"],["Ouvrir le catalogue national","#v4NationalCatalog"]];
 for(const [label,href] of links){const a=element("a","v5-inline-link",label);a.href=href;institutions.append(a)}
}
function renderProjects(){
 proposals.replaceChildren();const cards=$("projectCards");const list=$("haiti2050FutureProjectList");
 const items=list?.children.length?[...list.children]:[...(cards?.children||[])];
 if(!items.length){proposals.append(element("p","","Aucun projet visible pour la sélection actuelle. Les propositions sont distinctes des infrastructures existantes."));return}
 for(const item of items.slice(0,3)){const title=item.querySelector("h3,h4,strong")?.textContent?.trim()||item.textContent.trim().slice(0,90);const entry=element("div","v5-real-group");entry.append(element("strong","",title));proposals.append(entry)}
 proposals.append(element("p","v5-note","Propositions prospectives, non approuvées."))}
let pending=false;function refresh(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;renderTerritory();renderInstitutions();renderProjects()})}
for(const select of [commune,department,arrondissement])select?.addEventListener("change",()=>setTimeout(refresh,0));
for(const id of ["v4TerritorySheet","projectCards","haiti2050FutureProjectList"]){const target=$(id);if(target)new MutationObserver(refresh).observe(target,{childList:true,subtree:false})}
refresh();
})();