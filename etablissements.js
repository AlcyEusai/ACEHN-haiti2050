/* Haïti 2050 — établissements publics et privés (v1) */
(() => {
  'use strict';
  const categories = ['Tous','Administration','Police et justice','Éducation','Santé','Religion','Commerces et dépôts','Finance','Transport','Agriculture et industrie','Tourisme et loisirs','Autres'];
  const clean = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const safeUrl = value => { try { const u = new URL(value,location.href); return ['https:','http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
  const aside = document.querySelector('#atlas .workspace > aside');
  if (!aside) return;
  const panel = document.createElement('section'); panel.id='etablissementsPanel'; panel.className='sidebarSection';
  const h = document.createElement('h3'); h.textContent='Établissements et services';
  const category = document.createElement('select'); category.setAttribute('aria-label','Catégorie d’établissement');
  categories.forEach(v=>category.add(new Option(v,v)));
  const search = document.createElement('input'); search.type='search'; search.placeholder='École, mairie, marché, église…'; search.setAttribute('aria-label','Rechercher un établissement');
  const status = document.createElement('p'); status.className='note'; status.setAttribute('role','status');
  const list = document.createElement('div'); list.className='etablissements-results';
  const credit = document.createElement('small');
  const a = document.createElement('a'); a.href='https://www.openstreetmap.org/copyright'; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='© contributeurs OpenStreetMap — ODbL'; credit.append(a);
  panel.append(h,category,search,status,list,credit);
  const anchor = aside.querySelector('.sidebarSection'); aside.insertBefore(panel,anchor || null);
  let records=[]; let layer=null;
  function showOnMap(item) {
    const lat=Number(item.latitude), lon=Number(item.longitude);
    if (!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) return;
    const map=window.haiti2050Map;
    if (!map || !window.L) { status.textContent='Carte non disponible actuellement.'; return; }
    map.setView([lat,lon],15);
    if(layer) map.removeLayer(layer);
    layer=L.marker([lat,lon]).addTo(map).bindPopup(document.createTextNode(item.nom)).openPopup();
    setTimeout(()=>map.invalidateSize(),100);
  }
  function render() {
    const q=clean(search.value), type=category.value;
    const dept=clean(document.getElementById('department')?.value);
    const commune=clean(document.getElementById('commune')?.value);
    const found=records.filter(r=>(type==='Tous'||r.categorie===type)&&(!dept||clean(r.departement)===dept)&&(!commune||clean(r.commune)===commune)&&(!q||[r.nom,r.commune,r.quartier,r.adresse,r.sous_categorie].some(v=>clean(v).includes(q))));
    list.replaceChildren(); status.textContent=`${found.length} établissement(s) dans les données disponibles. Liste non exhaustive.`;
    found.slice(0,80).forEach(item=>{
      const card=document.createElement('article'); card.className='etablissement-card';
      const title=document.createElement('strong'); title.textContent=item.nom;
      const meta=document.createElement('p'); meta.textContent=[item.categorie,item.commune,item.departement].filter(Boolean).join(' · ');
      const verification=document.createElement('small'); verification.textContent=item.verification==='verifie'?'Informations vérifiées':'Informations à vérifier';
      card.append(title,meta,verification);
      if(item.image && safeUrl(item.image)) { const img=document.createElement('img'); img.src=safeUrl(item.image); img.alt=`Photographie : ${item.nom}`; img.loading='lazy'; card.append(img); }
      if(Number.isFinite(Number(item.latitude))&&Number.isFinite(Number(item.longitude))&&item.latitude!==null&&item.longitude!==null) {
        const btn=document.createElement('button'); btn.type='button'; btn.textContent='Voir sur la carte'; btn.addEventListener('click',()=>showOnMap(item)); card.append(btn);
      }
      if(item.source && safeUrl(item.source)) { const link=document.createElement('a'); link.href=safeUrl(item.source); link.target='_blank'; link.rel='noopener noreferrer'; link.textContent='Source'; card.append(link); }
      list.append(card);
    });
  }
  category.addEventListener('change',render); search.addEventListener('input',render);
  ['department','commune','arrondissement'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>setTimeout(render,0)));
  fetch('./data/etablissements.json').then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(!Array.isArray(data))throw new Error('JSON attendu : tableau');records=data;render()}).catch(e=>{status.textContent='Données indisponibles : '+e.message;});
})();
