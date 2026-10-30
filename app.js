const departments=[
{name:'Ouest',center:[18.54,-72.34],communes:['Port-au-Prince','Delmas','Pétion-Ville','Carrefour','Croix-des-Bouquets','Léogâne','Gressier','Cabaret','Arcahaie','Ganthier']},
{name:'Sud',center:[18.2,-73.75],communes:['Les Cayes','Aquin','Fond-des-Blancs','Camp-Perrin','Port-Salut','Saint-Louis-du-Sud','Cavaillon','Chantal','Torbeck','Roche-à-Bateau']},
{name:'Sud-Est',center:[18.23,-72.54],communes:['Jacmel','Marigot','Cayes-Jacmel','Bainet','Belle-Anse','Anse-à-Pitres','Thiotte']},
{name:"Grand'Anse",center:[18.65,-74.12],communes:['Jérémie','Abricots','Bonbon','Dame-Marie','Anse-d’Hainault','Corail','Roseaux','Pestel']},
{name:'Nippes',center:[18.44,-73.1],communes:['Miragoâne','Petite-Rivière-de-Nippes','Anse-à-Veau','Baradères','Petit-Trou-de-Nippes','L’Asile']},
{name:'Artibonite',center:[19.45,-72.69],communes:['Gonaïves','Saint-Marc','Dessalines','Petite-Rivière-de-l’Artibonite','Verrettes','Gros-Morne','Ennery','Marmelade']},
{name:'Centre',center:[19.14,-72.0],communes:['Hinche','Mirebalais','Lascahobas','Belladère','Cerca-la-Source','Thomonde','Maïssade','Saut-d’Eau']},
{name:'Nord',center:[19.76,-72.2],communes:['Cap-Haïtien','Limbé','Acul-du-Nord','Milot','Plaine-du-Nord','Grande-Rivière-du-Nord','Plaisance','Saint-Raphaël']},
{name:'Nord-Est',center:[19.67,-71.83],communes:['Fort-Liberté','Ouanaminthe','Trou-du-Nord','Terrier-Rouge','Caracol','Sainte-Suzanne','Mont-Organisé']},
{name:'Nord-Ouest',center:[19.93,-72.83],communes:['Port-de-Paix','Saint-Louis-du-Nord','Jean-Rabel','Môle-Saint-Nicolas','Bombardopolis','Baie-de-Henne','Bassin-Bleu']}
];
const demo=[{id:'demo-1',department:'Sud',commune:'Fond-des-Blancs',title:'Marché communal organisé',category:'Marché et commerce',description:'Concept : espaces de vente couverts, accès à l’eau, installations sanitaires et zone de stockage agricole.',budget:'À étudier',demo:true},{id:'demo-2',department:'Sud',commune:'Fond-des-Blancs',title:'Énergie solaire communautaire',category:'Énergie solaire',description:'Concept : étudier un mini-réseau solaire pour les services publics et les activités économiques.',budget:'À étudier',demo:true},{id:'demo-3',department:'Sud',commune:'Fond-des-Blancs',title:'Amélioration des routes rurales',category:'Routes et transports',description:'Concept : prioriser les axes d’accès aux écoles, marchés et établissements de santé après étude technique.',budget:'À étudier',demo:true}];
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let projects=read('haiti2050-projects',demo),localities=read('haiti2050-localities',{});
const $=id=>document.getElementById(id);let currentDepartment='Sud',currentCommune='Fond-des-Blancs';
function option(sel,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;sel.append(o)}
for(const d of departments){option($('department'),d.name,d.name);option($('formDepartment'),d.name,d.name)}
$('department').value=currentDepartment;
const map=L.map('map',{scrollWheelZoom:false}).setView([18.96,-72.65],8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);
const markers=[];departments.forEach(d=>{const m=L.circleMarker(d.center,{radius:9,color:'#fff',weight:2,fillColor:'#008f7a',fillOpacity:.95}).addTo(map).bindTooltip(d.name);m.on('click',()=>selectDepartment(d.name,true));markers.push(m)});
function selectDepartment(name,zoom){currentDepartment=name;$('department').value=name;const d=departments.find(x=>x.name===name);$('commune').replaceChildren();for(const c of d.communes)option($('commune'),c,c);currentCommune=d.communes.includes(currentCommune)?currentCommune:d.communes[0];$('commune').value=currentCommune;if(zoom)map.flyTo(d.center,10);renderSelection()}
function renderSelection(){ $('selectionTitle').textContent=currentCommune; $('selectionDescription').textContent=`Département : ${currentDepartment}. Répertoire initial non exhaustif. Les coordonnées précises de chaque commune et ses limites restent à intégrer.`;const key=currentDepartment+'|'+currentCommune;const ul=$('localities');ul.replaceChildren();const arr=localities[key]||[];if(!arr.length){const li=document.createElement('li');li.textContent='Aucune localité validée pour le moment.';ul.append(li)}else for(const item of arr){const li=document.createElement('li');li.textContent=item+' (saisie locale, à vérifier)';ul.append(li)}renderProjects()}
function renderProjects(){const container=$('projectCards');container.replaceChildren();const shown=projects.filter(p=>p.department===currentDepartment&&p.commune.toLowerCase()===currentCommune.toLowerCase());$('projectCount').textContent=projects.length;for(const p of shown){const article=document.createElement('article');article.className='projectCard';if(p.image&&/^https:\/\//.test(p.image)){const img=document.createElement('img');img.src=p.image;img.alt='Illustration du projet';img.loading='lazy';article.append(img)}const chip=document.createElement('span');chip.className='chip';chip.textContent=p.demo?'Concept illustratif':'Proposition locale';const h=document.createElement('h3');h.textContent=p.title;const info=document.createElement('p');info.textContent=p.description;const sub=document.createElement('p');sub.textContent=p.category+' · Budget : '+(p.budget||'À étudier');article.append(chip,h,info,sub);container.append(article)}if(!shown.length){const p=document.createElement('p');p.textContent='Aucun projet renseigné pour cette commune. Utilisez « Ajouter un projet » pour commencer.';container.append(p)}}
$('communeCount').textContent=departments.reduce((n,d)=>n+d.communes.length,0);
$('department').addEventListener('change',e=>selectDepartment(e.target.value,true));$('commune').addEventListener('change',e=>{currentCommune=e.target.value;renderSelection()});$('nationBtn').onclick=()=>map.flyTo([18.96,-72.65],8);
$('searchBtn').onclick=()=>{const q=$('search').value.trim().toLocaleLowerCase('fr');if(!q)return;const d=departments.find(d=>d.communes.some(c=>c.toLocaleLowerCase('fr').includes(q)));if(!d){alert('Commune non présente dans le répertoire initial. Elle pourra être ajoutée dans une version ultérieure.');return}currentCommune=d.communes.find(c=>c.toLocaleLowerCase('fr').includes(q));selectDepartment(d.name,true)};
$('search').addEventListener('keydown',e=>{if(e.key==='Enter')$('searchBtn').click()});
$('addLocality').onclick=()=>{const value=$('localityName').value.trim();if(!value)return;const key=currentDepartment+'|'+currentCommune;localities[key]??=[];if(!localities[key].includes(value))localities[key].push(value);localStorage.setItem('haiti2050-localities',JSON.stringify(localities));$('localityName').value='';renderSelection()};
const dialog=$('projectDialog');$('newProject').onclick=()=>{$('formDepartment').value=currentDepartment;$('formCommune').value=currentCommune;dialog.showModal()};$('closeDialog').onclick=$('cancelDialog').onclick=()=>dialog.close();$('projectForm').onsubmit=e=>{e.preventDefault();const p={id:Date.now(),department:$('formDepartment').value,commune:$('formCommune').value.trim(),title:$('formTitle').value.trim(),category:$('formCategory').value,description:$('formDescription').value.trim(),budget:$('formBudget').value.trim(),image:$('formImage').value.trim(),demo:false};projects.push(p);try{localStorage.setItem('haiti2050-projects',JSON.stringify(projects))}catch{alert('Stockage du navigateur saturé.')}dialog.close();$('projectForm').reset();renderProjects()};selectDepartment('Sud',false);

/* HAÏTI 2050 — FICHE TERRITORIALE PILOTE */

const territoryProfiles = {
  "Sud|Fond-des-Blancs": {
    title: "Fond-des-Blancs",
    description:
      "Territoire pilote du programme Haïti 2050. " +
      "Les projets présentés sont des propositions " +
      "d'aménagement à étudier avec les acteurs locaux.",
    priorities: [
      "Amélioration des routes rurales",
      "Construction et rénovation des écoles",
      "Accès aux soins de santé",
      "Développement de l'énergie solaire",
      "Modernisation des marchés",
      "Accès à l'eau potable"
    ]
  }
};

function renderTerritoryProfile() {
  const key = currentDepartment + "|" + currentCommune;
  const profile = territoryProfiles[key];

  let container =
    document.getElementById("territoryProfile");

  if (!container) {
    container = document.createElement("section");
    container.id = "territoryProfile";
    container.style.cssText =
      "max-width:1240px;margin:20px auto;" +
      "padding:24px;background:#fff;" +
      "border:1px solid #e0e8ee;" +
      "border-radius:14px;";

    document.getElementById("atlas")
      .appendChild(container);
  }

  container.replaceChildren();

  if (!profile) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  const title = document.createElement("h2");
  title.textContent = profile.title;

  const description = document.createElement("p");
  description.textContent = profile.description;

  const subtitle = document.createElement("h3");
  subtitle.textContent = "Priorités d'aménagement";

  const list = document.createElement("ul");

  profile.priorities.forEach(priority => {
    const item = document.createElement("li");
    item.textContent = priority;
    list.appendChild(item);
  });

  container.append(
    title,
    description,
    subtitle,
    list
  );
}

// Actualiser la fiche lors des changements
document.getElementById("department")
  .addEventListener("change", renderTerritoryProfile);

document.getElementById("commune")
  .addEventListener("change", renderTerritoryProfile);

renderTerritoryProfile();
