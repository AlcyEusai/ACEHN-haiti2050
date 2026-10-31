/* Haïti 2050 — Établissements V2 : filtres territoriaux + carte Leaflet */
(() => {
  'use strict';
  const aside = document.querySelector('#atlas .workspace > aside');
  if (!aside) return;
  const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
  const safe = v => { try { const u = new URL(v); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
  const valid = r => r.latitude !== null && r.longitude !== null && r.latitude !== '' && r.longitude !== '' && Number.isFinite(+r.latitude) && Number.isFinite(+r.longitude) && +r.latitude >= 18 && +r.latitude <= 21 && +r.longitude >= -75 && +r.longitude <= -71;
  document.getElementById('etablissementsPanel')?.remove();
  const panel = document.createElement('section'); panel.id = 'etablissementsPanel'; panel.className = 'sidebarSection';
  const heading = document.createElement('h3'); heading.textContent = 'Établissements et services';
  const intro = document.createElement('p'); intro.className = 'note'; intro.textContent = 'Écoles, administrations, lieux de culte, commerces, santé et autres services. Données à vérifier.';
  const category = document.createElement('select'); category.setAttribute('aria-label', 'Catégorie');
  const section = document.createElement('select'); section.setAttribute('aria-label', 'Section communale');
  const q = document.createElement('input'); q.type = 'search'; q.placeholder = 'Rechercher un établissement…'; q.setAttribute('aria-label', 'Nom ou adresse');
  const count = document.createElement('p'); count.className = 'note'; count.setAttribute('role', 'status');
  const mapStatus = document.createElement('small');
  const list = document.createElement('div'); list.className = 'etablissements-results';
  const attribution = document.createElement('small'); const attrLink = document.createElement('a'); attrLink.href = 'https://www.openstreetmap.org/copyright'; attrLink.target = '_blank'; attrLink.rel = 'noopener noreferrer'; attrLink.textContent = 'Données © contributeurs OpenStreetMap (ODbL)'; attribution.append(attrLink);
  function label(t, el) { const wrap = document.createElement('div'); wrap.className = 'etab-field'; const l = document.createElement('label'); l.textContent = t; wrap.append(l, el); return wrap; }
  panel.append(heading, intro, label('Catégorie', category), label('Section communale', section), label('Recherche', q), count, mapStatus, list, attribution);
  const first = aside.querySelector('.sidebarSection'); aside.insertBefore(panel, first || null);
  const deptEl = document.getElementById('department'); const arrEl = document.getElementById('arrondissement'); const communeEl = document.getElementById('commune');
  let records = [], filtered = [], overlay = null, selectedMarker = null, map = null, refreshTimer = null;
  const getMap = () => window.haiti2050Map || null;
  const option = (text, value = text) => new Option(text, value);
  function fillSelect(el, values, all) { const current = el.value; el.replaceChildren(option(all, '')); values.forEach(v => el.add(option(v))); if ([...el.options].some(o => o.value === current)) el.value = current; }
  function baseMatches(r) {
    return (!deptEl?.value || norm(r.departement) === norm(deptEl.value)) &&
      (!arrEl?.value || norm(r.arrondissement) === norm(arrEl.value)) &&
      (!communeEl?.value || norm(r.commune) === norm(communeEl.value));
  }
  function refreshOptions() {
    const local = records.filter(baseMatches);
    const sections = [...new Set(local.map(r => r.section_communale).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
    fillSelect(section, sections, 'Toutes les sections communales');
    const categories = [...new Set(records.map(r => r.categorie).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
    fillSelect(category, categories, 'Toutes les catégories');
  }
  function showItem(r) {
    map = getMap(); if (!map || !window.L || !valid(r)) { count.textContent = 'Position cartographique indisponible.'; return; }
    const point = [+r.latitude, +r.longitude]; map.setView(point, 15);
    if (selectedMarker) map.removeLayer(selectedMarker);
    const popup = document.createElement('div'); const title = document.createElement('strong'); title.textContent = r.nom || 'Établissement'; popup.append(title);
    const sub = document.createElement('p'); sub.textContent = [r.categorie, r.commune, r.section_communale].filter(Boolean).join(' · '); popup.append(sub);
    selectedMarker = L.marker(point).addTo(map).bindPopup(popup).openPopup();
    setTimeout(() => map.invalidateSize(), 100);
  }
  function card(r) {
    const item = document.createElement('article'); item.className = 'etablissement-card';
    const title = document.createElement('strong'); title.textContent = r.nom || 'Sans nom';
    const meta = document.createElement('p'); meta.textContent = [r.categorie, r.commune, r.section_communale, r.departement].filter(Boolean).join(' · ');
    const status = document.createElement('small'); status.textContent = 'Informations et activité à vérifier'; item.append(title, meta, status);
    const photo = safe(r.image); if (photo) { const img = document.createElement('img'); img.src = photo; img.alt = `Photo : ${r.nom}`; img.loading = 'lazy'; item.append(img); }
    if (valid(r)) { const btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Voir sur la carte'; btn.addEventListener('click', () => showItem(r)); item.append(btn); }
    const url = safe(r.source); if (url) { const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Source'; item.append(link); }
    return item;
  }
  function drawMap() {
    map = getMap(); if (!map || !window.L) { mapStatus.textContent = 'Carte Leaflet non disponible.'; return; }
    if (overlay) map.removeLayer(overlay);
    // Canvas avoids creating thousands of DOM marker elements.
    overlay = L.layerGroup().addTo(map);
    const visible = filtered.filter(valid);
    // Limit rendering for responsiveness; list and search still cover ALL records.
    const maxPoints = 1200;
    const stride = Math.max(1, Math.ceil(visible.length / maxPoints));
    const renderer = L.canvas({ padding: 0.25 });
    for (let i = 0; i < visible.length; i += stride) {
      const r = visible[i];
      const dot = L.circleMarker([+r.latitude, +r.longitude], { renderer, radius: 4, weight: 1, color: '#0c5776', fillColor: '#1b9bb0', fillOpacity: 0.7 });
      dot.on('click', () => showItem(r)); dot.addTo(overlay);
    }
    mapStatus.textContent = `${Math.ceil(visible.length / stride).toLocaleString('fr-FR')} points affichés sur ${visible.length.toLocaleString('fr-FR')} géolocalisés${stride > 1 ? ' (échantillonnage pour préserver les performances)' : ''}.`;
  }
  function render() {
    const query = norm(q.value), cat = category.value, sec = section.value;
    filtered = records.filter(r => baseMatches(r) && (!cat || r.categorie === cat) && (!sec || r.section_communale === sec) && (!query || [r.nom, r.adresse, r.sous_categorie, r.commune, r.section_communale].some(v => norm(v).includes(query))));
    count.textContent = `${filtered.length.toLocaleString('fr-FR')} établissement(s) trouvé(s). ${Math.min(filtered.length, 80)} fiches affichées ci-dessous.`;
    list.replaceChildren(...filtered.slice(0, 80).map(card));
    drawMap();
  }
  const refresh = () => { refreshOptions(); render(); };
  category.addEventListener('change', render); section.addEventListener('change', render);
  q.addEventListener('input', () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(render, 180); });
  [deptEl, arrEl, communeEl].forEach(el => el?.addEventListener('change', () => setTimeout(refresh, 0)));
  window.addEventListener('haiti2050:territorychange', () => setTimeout(refresh, 0));
  count.textContent = 'Chargement des établissements…';
  fetch('./data/etablissements.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(data => {
    if (!Array.isArray(data)) throw new Error('Le JSON doit être un tableau.');
    records = data; refresh();
  }).catch(e => { count.textContent = 'Chargement impossible : ' + e.message; console.error(e); });
})();
