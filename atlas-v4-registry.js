/* GitHub-native read-only registry, filtered by selected territory. */
(()=>{"use strict";
const catalog=document.getElementById("v4NationalCatalog");if(!catalog)return;
const section=document.createElement("section");section.className="v4-registry";catalog.after(section);
const heading=document.createElement("h2");heading.textContent="Registre documentaire — GitHub";section.append(heading);
const status=document.createElement("p");status.setAttribute("role","status");section.append(status);
const results=document.createElement("div");results.className="v4-registry-results";section.append(results);
const refreshButton=document.createElement("button");refreshButton.type="button";refreshButton.textContent="Actualiser le registre";section.append(refreshButton);
const contribute=document.createElement("a");contribute.href="https://github.com/AlcyEusai/ACEHN-haiti2050/edit/main/data/registre-etablissements.json";contribute.target="_blank";contribute.rel="noopener noreferrer";contribute.textContent="Proposer une fiche via GitHub (connexion requise) ↗";section.append(contribute);
let places=[],loaded=false;
const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g,"'").trim().toLocaleLowerCase("fr");
function selectedTerritory(){return {department:document.getElementById("department")?.value||"",arrondissement:document.getElementById("arrondissement")?.value||"",commune:document.getElementById("commune")?.value||""}}
function matches(place,selection){return (!selection.department||normalize(place.department)===normalize(selection.department))&&(!selection.arrondissement||normalize(place.arrondissement)===normalize(selection.arrondissement))&&(!selection.commune||normalize(place.commune)===normalize(selection.commune))}
function render(){
 if(!loaded)return;
 const selection=selectedTerritory(),visible=places.filter(p=>matches(p,selection));
 const territory=[selection.department,selection.arrondissement,selection.commune].filter(Boolean).join(" › ")||"Haïti entière";
 status.textContent=visible.length+" fiche"+(visible.length===1?"":"s")+" documentée"+(visible.length===1?"":"s")+" pour "+territory+" (sur "+places.length+" au registre). Les statuts de vérification varient selon les sources.";
 results.replaceChildren();
 if(!visible.length){const empty=document.createElement("p");empty.textContent="Aucun établissement documenté pour ce territoire dans le registre GitHub.";results.append(empty);return}
 for(const p of visible){
  const card=document.createElement("article"),name=document.createElement("strong"),meta=document.createElement("p"),verification=document.createElement("p"),button=document.createElement("button");
  name.textContent=p.name;meta.textContent=[p.category,p.department,p.arrondissement,p.commune].filter(Boolean).join(" · ");
  verification.textContent="Vérification : "+(p.verification||"Non précisée");
  button.type="button";button.textContent="Consulter la fiche et l'historique";
  button.addEventListener("click",()=>{
   const details=window.HAITI2050_PLACE_DETAILS;
   if(!details||typeof details.open!=="function"){status.textContent="La fiche détaillée n'est pas disponible. Rechargez la page (Ctrl + F5).";return}
   details.open({...p,territory:{departement:p.department,arrondissement:p.arrondissement,commune:p.commune,status:p.reviewStatus||"documentaire"},verification:p.verification||"Non précisée"});
  });
  card.append(name,meta,verification,button);results.append(card)
 }
}
async function refresh(){
 refreshButton.disabled=true;status.textContent="Lecture du registre GitHub…";
 try{const response=await fetch("./data/registre-etablissements.json",{cache:"no-store"});if(!response.ok)throw Error("HTTP "+response.status);
 const data=await response.json();if(!Array.isArray(data.places))throw Error("Format du registre invalide");
 places=data.places;loaded=true;render()
 }catch(error){status.textContent="Registre indisponible : "+error.message}finally{refreshButton.disabled=false}
}
document.addEventListener("haiti2050:territorychange",render);
for(const id of ["department","arrondissement","commune"]){document.getElementById(id)?.addEventListener("change",()=>queueMicrotask(render))}
refreshButton.addEventListener("click",refresh);refresh();
})();