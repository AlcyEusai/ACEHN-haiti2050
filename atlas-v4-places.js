/* Haïti 2050 V4: exploration des lieux réels, sans modifier le référentiel existant. */
(()=>{"use strict";
const $=id=>document.getElementById(id),map=window.haiti2050Map;
if(!map||!window.L)return;
const toolbar=document.createElement("section");toolbar.className="v4-poi";
toolbar.innerHTML='<h3>Découvrir les lieux sur la carte</h3><p>Affichez les lieux cartographiés dans la zone visible. Zoomez sur une commune avant de charger.</p><div class="v4-categories"><button type="button" data-kind="all" class="active">Tous</button><button type="button" data-kind="tourism">🏛️ Tourisme</button><button type="button" data-kind="office">🏢 Bureaux</button><button type="button" data-kind="police">👮 Police</button><button type="button" data-kind="health">🏥 Santé</button><button type="button" data-kind="education">🏫 Écoles</button></div><button type="button" id="v4LoadPlaces">Charger les lieux visibles</button><p id="v4PoiStatus" role="status">Données OpenStreetMap : disponibilité et exhaustivité non garanties.</p><div id="v4PoiDetails" aria-live="polite"></div>';
document.querySelector(".mapCol")?.appendChild(toolbar);
const layer=L.layerGroup().addTo(map);let kind="all",request=0;
const rules={all:'nwr["tourism"];nwr["historic"];nwr["office"];nwr["amenity"~"townhall|courthouse|bank|post_office|embassy|fire_station|police|hospital|clinic|doctors|pharmacy|school|university|college"]',tourism:'nwr["tourism"];nwr["historic"]',office:'nwr["office"];nwr["amenity"~"townhall|courthouse|bank|post_office|embassy|fire_station"]',police:'nwr["amenity"="police"]',health:'nwr["amenity"~"hospital|clinic|doctors|pharmacy"]',education:'nwr["amenity"~"school|university|college"]'};
toolbar.querySelectorAll("[data-kind]").forEach(b=>b.addEventListener("click",()=>{kind=b.dataset.kind;toolbar.querySelectorAll("[data-kind]").forEach(x=>x.classList.toggle("active",x===b));}));
const status=$("v4PoiStatus"),details=$("v4PoiDetails");
$("v4LoadPlaces").addEventListener("click",async()=>{
if(map.getZoom()<11){status.textContent="Zoomez davantage sur une commune (niveau 11 minimum).";return}
const b=map.getBounds(),area=[b.getSouth(),b.getWest(),b.getNorth(),b.getEast()].join(",");
const q='[out:json][timeout:25];('+rules[kind].split(";").map(x=>x+'('+area+');').join("")+');out center 300;';
const id=++request;status.textContent="Chargement des lieux…";
try{const response=await fetch("https://overpass.kumi.systems/api/interpreter",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)});
if(!response.ok)throw Error("service temporairement indisponible");
const data=await response.json();if(id!==request)return;layer.clearLayers();details.replaceChildren();let count=0;
for(const e of data.elements||[]){const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;const tags=e.tags||{},name=tags["name:fr"]||tags.name||"Lieu sans nom";
const point=L.circleMarker([lat,lon],{radius:6,color:"#fff",weight:1.5,fillColor:"#0b796b",fillOpacity:.95}).addTo(layer);
point.bindTooltip(name);point.on("click",()=>{details.replaceChildren();const h=document.createElement("h4");h.textContent=name;const p=document.createElement("p");p.textContent="Catégorie : "+(tags.office||tags.amenity||tags.tourism||tags.historic||"Lieu cartographié");details.append(h,p);for(const [label,value] of [["Adresse",tags["addr:street"]],["Téléphone",tags.phone],["Site web",tags.website]]){if(value){const line=document.createElement("p");line.textContent=label+" : "+value;details.appendChild(line)}}const note=document.createElement("small");note.textContent="Source : OpenStreetMap. Informations non vérifiées en temps réel.";details.appendChild(note);});count++}
status.textContent=count+" lieux chargés dans la zone visible (données non exhaustives).";
}catch(e){if(id===request)status.textContent="Impossible de charger les lieux : "+e.message+". Réessayez plus tard."}
});
const nav=document.querySelector("header nav");if(nav){nav.replaceChildren();for(const [label,target,kindValue] of [["Explorer Haïti","#atlas","all"],["Tourisme & patrimoine","#atlas","tourism"],["Services & administrations","#atlas","office"],["Sécurité & vigilance","#v4Vigilance",""],["Vision Haïti 2050","#projects",""]]){const a=document.createElement("a");a.href=target;a.textContent=label;a.addEventListener("click",()=>{if(kindValue){const button=toolbar.querySelector('[data-kind="'+kindValue+'"]');button?.click()}if(label==="Vision Haïti 2050"){const mode=$("haiti2050ViewMode");if(mode){mode.value="future";mode.dispatchEvent(new Event("change",{bubbles:true}))}}});nav.appendChild(a)}}
const vigilance=document.createElement("section");vigilance.id="v4Vigilance";vigilance.className="v4-vigilance";vigilance.innerHTML='<h2>Sécurité & vigilance</h2><p>Ce prototype ne fournit pas d’alertes en temps réel. Consultez les avis officiels datés avant tout déplacement. L’absence de signalement ne signifie pas qu’une zone est sûre.</p>';document.querySelector("#method")?.before(vigilance);
})();