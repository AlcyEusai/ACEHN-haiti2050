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
const tabs=element("div","v5-tabs");tabs.setAttribute("role","tablist");tabs.setAttribute("aria-label","Informations sur les établissements");institutionBody.insertBefore(tabs,institutions);
const tabNames=["Description","Services","Historique","Sources"];let activeTab="Description";
for(const name of tabNames){const button=element("button","v5-tab",name);button.type="button";button.setAttribute("role","tab");button.addEventListener("click",()=>{activeTab=name;renderInstitutions()});tabs.append(button)}
function renderInstitutions(){
 institutions.replaceChildren();
 for(const button of tabs.children){const active=button.textContent===activeTab;button.setAttribute("aria-selected",String(active));button.tabIndex=active?0:-1}
 const selected=commune?.selectedOptions?.[0]?.textContent?.trim();
 const current=commune?.value;
 const title=current?"Territoire : "+selected:"Répertoire national";
 institutions.append(element("strong","",title));
 const messages={
 "Description":"Le catalogue national rassemble des fiches d’établissements. Ouvrez une fiche pour connaître les champs effectivement renseignés.",
 "Services":"Les catégories de services sont documentées dans les fiches et l’inventaire territorial. La présence dans un registre ne confirme pas l’ouverture actuelle.",
 "Historique":"Les événements et dates disponibles sont présentés dans la fiche détaillée de chaque établissement. Aucun historique n’est inventé pour les fiches incomplètes.",
 "Sources":"Les fiches peuvent mentionner leur source et leur statut de vérification. Les informations sans source doivent être considérées comme à vérifier."
 };
 institutions.append(element("p","",messages[activeTab]));
 const links=[["Consulter le registre","#etablissementsPanel"],["Explorer le catalogue national","#v4NationalCatalog"]];
 for(const [label,href] of links){if(!$(href.slice(1)))continue;const a=element("a","v5-inline-link",label);a.href=href;institutions.append(a)}
}
function renderProjects(){
 const plan=document.querySelector(".v5-plan");
 const selectedCommune=commune?.value||"";
 const label=plan?.querySelector(".v5-plan-caption strong");
 const notice=plan?.querySelector(".v5-plan-caption span");
 if(label)label.textContent=selectedCommune?"Vision 2050 — "+(commune.selectedOptions[0]?.textContent.trim()||selectedCommune):"Vision 2050 — schéma illustratif";
 if(notice)notice.textContent="Schéma générique non géolocalisé · Aucun chantier approuvé";
 proposals.replaceChildren();const cards=$("projectCards");const list=$("haiti2050FutureProjectList");
 const items=list?.querySelectorAll("article")?.length?[...list.querySelectorAll("article")]:[...(cards?.children||[])];
 if(!selectedCommune){proposals.append(element("p","","Sélectionnez une commune pour afficher ses projets. Le dessin ci-dessus reste un exemple conceptuel."));return}
 if(!items.length){proposals.append(element("p","","Aucun projet visible pour cette commune. Le schéma ci-dessus est un exemple et ne constitue pas un projet local validé."));return}
 for(const item of items.slice(0,3)){const title=item.querySelector("h3,h4,strong")?.textContent?.trim()||item.textContent.trim().slice(0,90);const entry=element("div","v5-real-group");entry.append(element("strong","",title));proposals.append(entry)}
 proposals.append(element("p","v5-note","Propositions prospectives, non approuvées."))}
let pending=false;function refresh(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;renderTerritory();renderInstitutions();renderProjects()})}
for(const select of [commune,department,arrondissement])select?.addEventListener("change",()=>setTimeout(refresh,0));
for(const id of ["v4TerritorySheet","projectCards","haiti2050FutureProjectList"]){const target=$(id);if(target)new MutationObserver(refresh).observe(target,{childList:true,subtree:false})}
document.addEventListener("haiti2050:projectschange",refresh);
refresh();
})();