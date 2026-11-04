/* Haïti 2050 V4: exploration des lieux réels, sans modifier le référentiel existant. */
(()=>{"use strict";
const $=id=>document.getElementById(id),map=window.haiti2050Map;
if(!map||!window.L)return;
const toolbar=document.createElement("section");toolbar.className="v4-poi";
toolbar.innerHTML='<h3>Découvrir les lieux sur la carte</h3><p>Affichez les lieux cartographiés dans la zone visible. Zoomez sur une commune avant de charger.</p><div class="v4-categories"><button type="button" data-kind="all" class="active">Tous</button><button type="button" data-kind="tourism">🏛️ Tourisme</button><button type="button" data-kind="office">🏢 Bureaux</button><button type="button" data-kind="police">👮 Police</button><button type="button" data-kind="health">🏥 Santé</button><button type="button" data-kind="education">🏫 Écoles</button></div><button type="button" id="v4LoadPlaces">Charger les lieux visibles</button><p id="v4PoiStatus" role="status">Données OpenStreetMap : disponibilité et exhaustivité non garanties.</p><div id="v4PoiMiniMap" role="application" aria-label="Carte détaillée des lieux sélectionnés" style="height:430px;width:100%;border-radius:12px;margin:16px 0;border:1px solid #dce5ec"></div><div id="v4PoiDetails" aria-live="polite"></div>';
document.querySelector(".mapCol")?.appendChild(toolbar);
const detailMap=L.map("v4PoiMiniMap",{scrollWheelZoom:false}).setView(map.getCenter(),Math.max(7,map.getZoom()));
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(detailMap);
const layer=L.featureGroup().addTo(detailMap);let kind="all",request=0;
let localRecords=null;
const normalize=v=>String(v||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase();
const categoryMatch=r=>{
 const c=normalize([r.categorie,r.sous_categorie,r.nom].join(" "));
 return kind==="all"||
 (kind==="education"&&/educ|ecole|college|universit|lycee|scolaire/.test(c))||
 (kind==="health"&&/sante|hopital|clinique|pharmacie|dispensaire|medical/.test(c))||
 (kind==="police"&&/police|commissariat|securite/.test(c))||
 (kind==="office"&&/administr|bureau|mairie|minister|office|public|etat civil|justice/.test(c))||
 (kind==="tourism"&&/touris|patrimoine|hotel|musee|historique|monument/.test(c));
};
async function loadLocal(){
 if(localRecords)return localRecords;
 const response=await fetch("./data/etablissements.json");
 if(!response.ok)throw Error("Registre local HTTP "+response.status);
 const data=await response.json();if(!Array.isArray(data))throw Error("Format du registre local invalide");
 localRecords=data;return data;
}
function renderPlaces(items){
 layer.clearLayers();details.replaceChildren();let count=0;
 for(const item of items.slice(0,1200)){
  const lat=Number(item.lat),lon=Number(item.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
  const point=L.circleMarker([lat,lon],{radius:6,color:"#fff",weight:1.5,fillColor:item.local?"#1766a1":"#0b796b",fillOpacity:.95}).addTo(layer);
  point.bindPopup(document.createTextNode(item.name));
  point.on("click",()=>{details.replaceChildren();const h=document.createElement("h4");h.textContent=item.name;const p=document.createElement("p");p.textContent="Catégorie : "+item.category;const note=document.createElement("small");note.textContent=item.local?"Source : registre Haïti 2050. Localisation et activité à vérifier.":"Source : OpenStreetMap. Informations non vérifiées en temps réel.";details.append(h,p,note)});
  count++;
 }
 if(count&&layer.getBounds().isValid())detailMap.fitBounds(layer.getBounds().pad(.15),{maxZoom:15});
 return count;
}
const resize=()=>detailMap.invalidateSize();setTimeout(resize,150);
map.on("moveend",()=>{if(!layer.getLayers().length)detailMap.setView(map.getCenter(),Math.max(7,map.getZoom()))});
const rules={all:'nwr["tourism"];nwr["historic"];nwr["office"];nwr["amenity"~"townhall|courthouse|bank|post_office|embassy|fire_station|police|hospital|clinic|doctors|pharmacy|school|university|college"]',tourism:'nwr["tourism"];nwr["historic"]',office:'nwr["office"];nwr["amenity"~"townhall|courthouse|bank|post_office|embassy|fire_station"]',police:'nwr["amenity"="police"]',health:'nwr["amenity"~"hospital|clinic|doctors|pharmacy"]',education:'nwr["amenity"~"school|university|college"]'};
toolbar.querySelectorAll("[data-kind]").forEach(b=>b.addEventListener("click",()=>{kind=b.dataset.kind;toolbar.querySelectorAll("[data-kind]").forEach(x=>x.classList.toggle("active",x===b));if(map.getZoom()>=11)$("v4LoadPlaces")?.click();}));
const status=$("v4PoiStatus"),details=$("v4PoiDetails");
$("v4LoadPlaces").addEventListener("click",async()=>{
if(map.getZoom()<11){status.textContent="Zoomez davantage sur une commune (niveau 11 minimum).";return}
const b=map.getBounds();detailMap.fitBounds(b);setTimeout(resize,50);const area=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].join(",");
const q='[out:json][timeout:25];('+rules[kind].split(";").map(x=>x+'('+area+');').join("")+');out center 300;';
const id=++request;const loadButton=$("v4LoadPlaces");loadButton.disabled=true;status.textContent="Chargement des lieux…";
try{
 const bounds=map.getBounds();let localItems=[],localError=null;
 try{
  const records=await loadLocal();
  localItems=records.filter(r=>r.latitude!==null&&r.longitude!==null&&r.latitude!==""&&r.longitude!==""&&Number.isFinite(Number(r.latitude))&&Number.isFinite(Number(r.longitude))&&bounds.contains([Number(r.latitude),Number(r.longitude)])&&categoryMatch(r)).map(r=>({lat:Number(r.latitude),lon:Number(r.longitude),name:r.nom||"Sans nom",category:r.categorie||"Autre",local:true}));
 }catch(e){localError=e}
 if(id!==request)return;
 const localCount=renderPlaces(localItems);
 status.textContent=localCount+" lieux du registre Haïti 2050 affichés. Recherche complémentaire OpenStreetMap en cours…";
 const endpoints=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
let data=null,lastError=null;
for(const endpoint of endpoints){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
 try{
  const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:"data="+encodeURIComponent(q),signal:controller.signal});
  if(!response.ok)throw Error("HTTP "+response.status);
  data=await response.json();break;
 }catch(error){lastError=error}finally{clearTimeout(timeout)}
}
if(!data)throw Error(lastError?.name==="AbortError"?"Délai dépassé sur les serveurs OpenStreetMap":lastError?.message||"Serveurs indisponibles");if(id!==request)return;const osmItems=[];
for(const e of data.elements||[]){const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;const tags=e.tags||{},name=tags["name:fr"]||tags.name||"Lieu sans nom";
osmItems.push({lat,lon,name,category:tags.office||tags.amenity||tags.tourism||tags.historic||"Lieu cartographié",local:false});}
const count=renderPlaces([...localItems,...osmItems]);
status.textContent=count+" lieux affichés sur la carte détaillée ci-dessous (données non exhaustives).";
if(count){const bounds=layer.getBounds?.();if(bounds?.isValid())detailMap.fitBounds(bounds.pad(.15),{maxZoom:15});}
}catch(e){if(id===request){const shown=layer.getLayers().length;status.textContent=shown?shown+" lieux du registre Haïti 2050 affichés. Complément OpenStreetMap indisponible ("+e.message+").": "Aucun lieu géolocalisé du registre dans cette zone et catégorie. OpenStreetMap indisponible : "+e.message;}}finally{loadButton.disabled=false}
});
const nav=document.querySelector("header nav");if(nav){nav.replaceChildren();for(const [label,target,kindValue] of [["Explorer Haïti","#atlas","all"],["Tourisme & patrimoine","#atlas","tourism"],["Services & administrations","#atlas","office"],["Sécurité & vigilance","#v4Vigilance",""],["Vision Haïti 2050","#projects",""]]){const a=document.createElement("a");a.href=target;a.textContent=label;a.addEventListener("click",()=>{if(kindValue){const button=toolbar.querySelector('[data-kind="'+kindValue+'"]');button?.click()}if(label==="Vision Haïti 2050"){const mode=$("haiti2050ViewMode");if(mode){mode.value="future";mode.dispatchEvent(new Event("change",{bubbles:true}))}}});nav.appendChild(a)}}
const vigilance=document.createElement("section");vigilance.id="v4Vigilance";vigilance.className="v4-vigilance";vigilance.innerHTML='<h2>Sécurité & vigilance</h2><p>Ce prototype ne fournit pas d’alertes en temps réel. Consultez les avis officiels datés avant tout déplacement. L’absence de signalement ne signifie pas qu’une zone est sûre.</p>';document.querySelector("#method")?.before(vigilance);
})();