/* Haïti 2050 — Répertoire administratif, données sourcées */
(() => {
  'use strict';
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const init = async () => {
    const sidebar = document.querySelector('#atlas .workspace > aside');
    if (!sidebar || document.getElementById('administrationsPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'administrationsPanel';
    panel.className = 'sidebarSection';
    panel.innerHTML = `<h3>Bureaux administratifs</h3><label for="adminCategory">Administration</label><select id="adminCategory"><option value="">Toutes les administrations</option><option value="DGI">DGI</option><option value="ONI">ONI</option><option value="Mairie">Mairies (à compléter)</option><option value="État civil">État civil (à compléter)</option></select><label for="adminQuery">Rechercher un bureau</label><input id="adminQuery" type="search" placeholder="Nom, commune ou adresse"><p id="adminStatus" class="note" role="status"></p><div id="adminResults"></div>`;
    const selected = document.getElementById('commune');
    if (selected && sidebar.contains(selected)) {
      const oldLabel = sidebar.querySelector('label[for="search"]');
      if (oldLabel) sidebar.insertBefore(panel, oldLabel);
      else selected.insertAdjacentElement('afterend', panel);
    } else sidebar.appendChild(panel);
    const category = panel.querySelector('#adminCategory');
    const query = panel.querySelector('#adminQuery');
    const status = panel.querySelector('#adminStatus');
    const results = panel.querySelector('#adminResults');
    let bureaux = [];
    try {
      const response = await fetch('./data/bureaux-administratifs.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      bureaux = await response.json();
      if (!Array.isArray(bureaux)) throw new Error('Format de données invalide');
    } catch (error) {
      status.textContent = 'Impossible de charger le répertoire : ' + error.message;
      return;
    }
    const render = () => {
      const dep = document.getElementById('department')?.value || '';
      const commune = document.getElementById('commune')?.value || '';
      const needle = normalize(query.value);
      const filtered = bureaux.filter(b => (!category.value || b.categorie === category.value)
        && (!dep || normalize(b.departement) === normalize(dep))
        && (!commune || normalize(b.commune) === normalize(commune))
        && (!needle || normalize([b.nom,b.adresse,b.commune,b.departement].join(' ')).includes(needle)));
      status.textContent = `${filtered.length} bureau(x) dans la sélection. Répertoire initial non exhaustif.`;
      results.replaceChildren();
      filtered.slice(0,60).forEach(b => {
        const article = document.createElement('article');
        article.className = 'admin-office';
        const title = document.createElement('h4'); title.textContent = b.nom;
        const address = document.createElement('p'); address.textContent = `${b.commune} (${b.departement}) — ${b.adresse}`;
        const note = document.createElement('small'); note.textContent = b.statut;
        article.append(title,address,note);
        if (b.image && /^https:\/\//.test(b.image)) {
          const img = document.createElement('img'); img.src=b.image; img.alt=`Photographie de ${b.nom}`; img.loading='lazy'; article.appendChild(img);
        }
        const source = document.createElement('a'); source.href=b.source; source.target='_blank'; source.rel='noopener noreferrer'; source.textContent='Source officielle'; article.appendChild(source);
        if (Number.isFinite(b.latitude) && Number.isFinite(b.longitude) && window.haiti2050Map && window.L) {
          const btn=document.createElement('button'); btn.type='button'; btn.textContent='Voir sur la carte';
          btn.addEventListener('click',()=>{ window.haiti2050Map.setView([b.latitude,b.longitude],15); L.popup().setLatLng([b.latitude,b.longitude]).setContent(document.createTextNode(b.nom)).openOn(window.haiti2050Map); });
          article.appendChild(btn);
        }
        results.appendChild(article);
      });
    };
    category.addEventListener('change',render);
    query.addEventListener('input',render);
    ['department','arrondissement','commune'].forEach(id => document.getElementById(id)?.addEventListener('change',()=>setTimeout(render,0)));
    document.addEventListener('haiti2050:territorychange',render);
    render();
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
