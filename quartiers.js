
/* HAITI 2050 — quartiers.js — version nationale */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const atlas = window.HAITI_TERRITOIRES;
  if (!Array.isArray(atlas?.departements)) {
    console.error('territoires.js manquant');
    return;
  }
  const map = window.haiti2050Map;
  const layer = map && window.L
    ? L.layerGroup().addTo(map) : null;
  const norm = s => String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const depNorm = s => norm(s)
    .replace(/^grandeanse$/, 'grandanse');
  const alias = s => norm(s)
    .replace(/^(les|la|le)(?=[a-z])/, '');
  const key = (d,c) => depNorm(d) + '|' + norm(c);
  const gps = (a,b) => {
    if (a == null || b == null ||
        String(a).trim() === '' ||
        String(b).trim() === '') return null;
    const lat = Number(a), lon = Number(b);
    return Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 ? {lat,lon} : null;
  };
  const read = name => {
    try {
      const x = JSON.parse(
        localStorage.getItem(name) || '{}'
      );
      return x && typeof x === 'object' &&
        !Array.isArray(x) ? x : {};
    } catch {
      return {};
    }
  };
  const manual = read('haiti2050-localities');
  const manualGPS = read('haiti2050-localities-gps');
  const legacyQuartiers = read('haiti2050-quartiers');
  const entries = new Map();
  const refs = [];
  for (const d of atlas.departements)
    for (const a of d.arrondissements)
      for (const c of a.communes)
        refs.push({
          department:d.nom,
          arrondissement:a.nom,
          commune:c
        });

  function findRef(d,c) {
    const candidates = refs.filter(r =>
      depNorm(r.department) === depNorm(d)
    );
    const exact = candidates.filter(r =>
      norm(r.commune) === norm(c)
    );
    if (exact.length === 1) return exact[0];
    if (exact.length) return null;
    const approximate = candidates.filter(r =>
      alias(r.commune) === alias(c)
    );
    return approximate.length === 1
      ? approximate[0] : null;
  }

  function add(ref, name, position, source,
               verified = false) {
    if (!ref || !String(name ?? '').trim()) return;
    const k = key(ref.department,ref.commune);
    if (!entries.has(k)) entries.set(k,new Map());
    const m = entries.get(k);
    const n = norm(name);
    const old = m.get(n);
    if (old) {
      if (!old.position && position)
        old.position = position;
      if (verified) old.verified = true;
      return;
    }
    m.set(n,{
      ...ref,
      name:String(name).trim(),
      position,
      source,
      verified
    });
  }

  function current() {
    return {
      department:$('department')?.value || '',
      arrondissement:$('arrondissement')?.value || '',
      commune:$('commune')?.value || ''
    };
  }

  function localities(d,c) {
    const k = key(d,c);
    const result = new Map(entries.get(k) || []);
    for (const oldKey of [d+'|'+c,k]) {
      const names = [
        ...(Array.isArray(manual[oldKey])
          ? manual[oldKey] : []),
        ...(Array.isArray(legacyQuartiers[oldKey])
          ? legacyQuartiers[oldKey] : [])
      ];
      for (const name of names) {
        if (!name || result.has(norm(name))) continue;
        const p = manualGPS[k+'|'+norm(name)];
        result.set(norm(name),{
          department:d,
          commune:c,
          name,
          position:p
            ? gps(p.latitude,p.longitude) : null,
          source:'Ajout local',
          verified:false
        });
      }
    }
    return [...result.values()].sort((a,b) =>
      a.name.localeCompare(b.name,'fr')
    );
  }

  function inRing(x,y,ring) {
    let inside = false;
    for (let i=0,j=ring.length-1;
         i<ring.length;j=i++) {
      const a=ring[i], b=ring[j];
      if ((a[1]>y)!==(b[1]>y) &&
          x < (b[0]-a[0])*(y-a[1])/
              (b[1]-a[1])+a[0]) {
        inside=!inside;
      }
    }
    return inside;
  }

  const inPolygon = (x,y,rings) =>
    !!rings?.length &&
    inRing(x,y,rings[0]) &&
    !rings.slice(1).some(r=>inRing(x,y,r));

  function inGeometry(x,y,g) {
    if (g?.type === 'Polygon')
      return inPolygon(x,y,g.coordinates);
    if (g?.type === 'MultiPolygon')
      return g.coordinates.some(p=>inPolygon(x,y,p));
    return false;
  }

  function bounds(g) {
    const b=[Infinity,Infinity,-Infinity,-Infinity];
    function visit(v) {
      if (!Array.isArray(v)) return;
      if (typeof v[0] === 'number' &&
          typeof v[1] === 'number') {
        b[0]=Math.min(b[0],v[0]);
        b[1]=Math.min(b[1],v[1]);
        b[2]=Math.max(b[2],v[0]);
        b[3]=Math.max(b[3],v[1]);
      } else v.forEach(visit);
    }
    visit(g?.coordinates);
    return Number.isFinite(b[0]) ? b : null;
  }

  async function fetchJSON(url) {
    try {
      const response=await fetch(url);
      if (!response.ok) {
        if (response.status !== 404)
          console.warn(url,response.status);
        return null;
      }
      return await response.json();
    } catch(e) {
      console.warn('Chargement',url,e);
      return null;
    }
  }

  let loaded=false;

  async function load() {
    const [communes,places,verified,shared] =
      await Promise.all([
        fetchJSON('./data/haiti-communes.geojson'),
        fetchJSON('./data/haiti-localites.json'),
        fetchJSON(
          './data/rattachements-localites-verifies.json'
        ),
        fetchJSON('./data/haiti-quartiers.geojson')
      ]);

    const polygons=(communes?.features || [])
      .map(f => {
        const p=f.properties || {};
        return {
          ref:findRef(
            p.ADM1_FR || p.department,
            p.ADM2_FR || p.name
          ),
          geometry:f.geometry,
          b:bounds(f.geometry)
        };
      })
      .filter(p=>p.ref && p.b);

    const confirmed=new Map();
    for (const v of Array.isArray(verified)
         ? verified : []) {
      const ref=findRef(
        v.departement || v.department,
        v.commune
      );
      if (ref && v.id != null)
        confirmed.set(String(v.id),ref);
    }

    let spatial=0, explicit=0, unknown=0;

    for (const place of Array.isArray(places)
         ? places : []) {
      const position=gps(
        place.latitude,place.longitude
      );
      const name=place.nom || place.name;
      if (!position || !name) {
        unknown++;
        continue;
      }
      const ref=confirmed.get(String(place.id));
      if (ref) {
        add(
          ref,name,position,
          'Rattachement vérifié',true
        );
        explicit++;
        continue;
      }
      const matches=new Map();
      for (const p of polygons) {
        if (
          position.lon>=p.b[0] &&
          position.lon<=p.b[2] &&
          position.lat>=p.b[1] &&
          position.lat<=p.b[3] &&
          inGeometry(
            position.lon,
            position.lat,
            p.geometry
          )
        ) {
          matches.set(
            key(p.ref.department,p.ref.commune),
            p.ref
          );
        }
      }
      if (matches.size === 1) {
        add(
          [...matches.values()][0],
          name,position,
          'GeoNames : attribution spatiale'
        );
        spatial++;
      } else {
        unknown++;
      }
    }

    for (const f of shared?.features || []) {
      if (f.geometry?.type !== 'Point') continue;
      const p=f.properties || {};
      const ref=findRef(
        p.department || p.departement || p.ADM1_FR,
        p.commune || p.ADM2_FR
      );
      const position=gps(
        f.geometry.coordinates?.[1],
        f.geometry.coordinates?.[0]
      );
      if (ref && position)
        add(
          ref,
          p.name || p.nom || p.quartier,
          position,
          'Quartiers GeoJSON'
        );
    }

    loaded=true;
    console.info('Haïti 2050 : localités', {
      communes:refs.length,
      polygones:polygons.length,
      spatial,
      explicit,
      sansRattachement:unknown
    });
    refresh();
    document.dispatchEvent(
      new CustomEvent('haiti2050:localitiesloaded')
    );
  }

  function notice(value) {
    let el=$('localitySearchMessage');
    if (!el) {
      el=document.createElement('p');
      el.id='localitySearchMessage';
      el.setAttribute('role','status');
      (
        $('localities')?.parentElement ||
        $('map')?.parentElement
      )?.appendChild(el);
    }
    if (el) el.textContent=value;
  }

  function zoom(d,c,name) {
    const item=localities(d,c).find(x =>
      norm(x.name)===norm(name)
    );
    if (!item?.position || !map) {
      notice('Position GPS indisponible : '+name);
      return false;
    }
    map.flyTo([
      item.position.lat,
      item.position.lon
    ],15);
    if (window.L)
      L.popup()
        .setLatLng([
          item.position.lat,
          item.position.lon
        ])
        .setContent(
          document.createTextNode(
            item.name+' — '+c
          )
        )
        .openOn(map);
    return true;
  }

  window.haiti2050ZoomToLocality=zoom;

  function button(item) {
    const b=document.createElement('button');
    b.type='button';
    b.textContent=item.name;
    b.title=item.position
      ? 'Voir sur la carte'
      : 'GPS indisponible';
    b.style.cssText=
      'display:block;width:100%;' +
      'text-align:left;padding:8px;' +
      'margin:3px 0;cursor:pointer';
    b.addEventListener('click',() =>
      zoom(
        item.department,
        item.commune,
        item.name
      )
    );
    return b;
  }

  function renderLocalities() {
    const list=$('localities');
    if (!list) return;
    list.replaceChildren();
    const s=current();

    if (!s.commune) {
      const li=document.createElement('li');
      li.textContent='Sélectionnez une commune.';
      list.appendChild(li);
      return;
    }

    const items=localities(
      s.department,s.commune
    );
    if (!items.length) {
      const li=document.createElement('li');
      li.textContent=loaded
        ? 'Aucune localité rattachée dans les données disponibles.'
        : 'Chargement des localités...';
      list.appendChild(li);
      return;
    }
    for (const item of items) {
      const li=document.createElement('li');
      li.appendChild(button(item));
      list.appendChild(li);
    }
  }

  function renderMarkers() {
    if (!layer || !map) return;
    layer.clearLayers();
    const s=current();
    if (!s.commune) return;
    for (const item of localities(
      s.department,s.commune
    )) {
      if (!item.position) continue;
      const marker=L.marker([
        item.position.lat,
        item.position.lon
      ]).bindTooltip(item.name);
      marker.on('click',() =>
        zoom(
          item.department,
          item.commune,
          item.name
        )
      );
      layer.addLayer(marker);
    }
  }

  function save(name,latitude,longitude) {
    const s=current();
    name=String(name || '').trim();

    if (!s.commune || !name) {
      alert(
        'Sélectionnez une commune et saisissez une localité.'
      );
      return false;
    }
    if (localities(
      s.department,s.commune
    ).some(x=>norm(x.name)===norm(name))) {
      alert('Localité déjà enregistrée.');
      return false;
    }

    const hasA=String(latitude).trim() !== '';
    const hasB=String(longitude).trim() !== '';

    if (hasA !== hasB) {
      alert('Renseignez les deux coordonnées GPS.');
      return false;
    }

    const position=hasA
      ? gps(latitude,longitude) : null;
    if (hasA && !position) {
      alert('Coordonnées invalides.');
      return false;
    }

    const k=s.department+'|'+s.commune;
    const next={
      ...manual,
      [k]:[
        ...(Array.isArray(manual[k])
          ? manual[k] : []),
        name
      ]
    };
    const nextGPS={...manualGPS};

    if (position)
      nextGPS[
        key(s.department,s.commune)+'|'+norm(name)
      ]={
        latitude:position.lat,
        longitude:position.lon
      };

    try {
      localStorage.setItem(
        'haiti2050-localities',
        JSON.stringify(next)
      );
      localStorage.setItem(
        'haiti2050-localities-gps',
        JSON.stringify(nextGPS)
      );
    } catch(e) {
      console.error(e);
      alert('Enregistrement impossible.');
      return false;
    }

    Object.assign(manual,next);
    Object.assign(manualGPS,nextGPS);
    refresh();
    document.dispatchEvent(
      new CustomEvent('haiti2050:localitychange')
    );
    return true;
  }

  function renderPanel() {
    let panel=$('quartiersPanel');
    if (!panel) {
      panel=document.createElement('section');
      panel.id='quartiersPanel';
      panel.style.cssText=
        'padding:20px;margin:20px 0;' +
        'border:1px solid #ddd;' +
        'border-radius:12px';
      (
        $('localities')?.parentElement ||
        $('map')?.parentElement
      )?.appendChild(panel);
    }

    if (!panel) return;
    panel.replaceChildren();
    const s=current();
    panel.hidden=!s.commune;
    if (!s.commune) return;

    const h=document.createElement('h2');
    h.textContent=
      'Quartiers et localités de '+s.commune;

    const p=document.createElement('p');
    p.textContent=
      localities(
        s.department,s.commune
      ).length +
      ' localité(s) répertoriée(s). ' +
      'Les rattachements spatiaux sont indicatifs. ' +
      'Les ajouts manuels restent dans ce navigateur.';

    const name=document.createElement('input');
    name.placeholder='Nom de la localité';
    name.setAttribute(
      'aria-label','Nom de la localité'
    );

    const lat=document.createElement('input');
    lat.type='number';
    lat.step='any';
    lat.placeholder='Latitude (facultative)';
    lat.setAttribute('aria-label','Latitude');

    const lon=document.createElement('input');
    lon.type='number';
    lon.step='any';
    lon.placeholder='Longitude (facultative)';
    lon.setAttribute('aria-label','Longitude');

    const b=document.createElement('button');
    b.type='button';
    b.textContent='+ Ajouter une localité';
    b.addEventListener('click',() => {
      if (save(
        name.value,
        lat.value,
        lon.value
      )) notice(
        'Localité enregistrée dans ce navigateur.'
      );
    });
    panel.append(h,p,name,lat,lon,b);
  }

  function search(query) {
    const q=norm(query);
    const results=[];
    for (const r of refs)
      for (const item of localities(
        r.department,r.commune
      ))
        if (norm(item.name).includes(q))
          results.push({
            ...r,
            name:item.name,
            type:'locality'
          });
    return results;
  }

  window.haiti2050SearchLocalities=search;

  function selectResult(item) {
    if (typeof window.selectTerritory === 'function')
      window.selectTerritory(
        item.department,
        item.arrondissement,
        item.commune,
        false
      );
    else if (typeof selectTerritory === 'function')
      selectTerritory(
        item.department,
        item.arrondissement,
        item.commune,
        false
      );

    if (item.type==='locality') {
      refresh();
      zoom(
        item.department,
        item.commune,
        item.name
      );
    } else if (
      typeof window.haiti2050ZoomToCommune==='function'
    ) {
      window.haiti2050ZoomToCommune(
        item.department,
        item.commune
      );
    }
    refresh();
  }

  function results(q) {
    const n=norm(q);
    if (!n) return [];
    const communes=refs
      .filter(r=>norm(r.commune).includes(n))
      .map(r=>({
        ...r,
        name:r.commune,
        type:'commune'
      }));
    const local=search(q);
    return [...communes,...local];
  }

  function suggestions() {
    const box=$('localitySuggestions');
    const input=$('search');
    if (!box || !input) return;

    box.replaceChildren();
    const found=results(input.value).slice(0,80);
    for (const item of found) {
      const b=document.createElement('button');
      b.type='button';
      b.className='suggestion-item';
      b.textContent=
        item.name+' — '+item.commune+
        ' ('+item.department+')';
      b.addEventListener('click',() => {
        input.value=item.name;
        box.hidden=true;
        selectResult(item);
      });
      box.appendChild(b);
    }
    box.hidden=!input.value.trim();
  }

  const searchInput=$('search');
  const searchBtn=$('searchBtn');

  searchInput?.addEventListener(
    'input',suggestions
  );
  searchInput?.addEventListener(
    'focus',suggestions
  );

  searchBtn?.addEventListener(
    'click',
    event => {
      const found=results(
        searchInput?.value || ''
      );
      if (!found.length) return;

      const exact=found.find(x =>
        x.type==='commune' &&
        norm(x.name)===norm(searchInput.value)
      ) || found.find(x =>
        norm(x.name)===norm(searchInput.value)
      ) || found[0];

      event.preventDefault();
      event.stopImmediatePropagation();

      if ($('localitySuggestions'))
        $('localitySuggestions').hidden=true;

      selectResult(exact);
    },
    true
  );

  document.addEventListener('click',event => {
    const box=$('localitySuggestions');
    if (
      box &&
      event.target!==searchInput &&
      !box.contains(event.target)
    ) box.hidden=true;
  });

  function refresh() {
    renderLocalities();
    renderPanel();
    renderMarkers();
  }

  document.addEventListener(
    'haiti2050:territorychange',refresh
  );
  document.addEventListener(
    'haiti2050:localitychange',refresh
  );

  for (const id of [
    'department',
    'arrondissement',
    'commune'
  ]) {
    $(id)?.addEventListener(
      'change',() => setTimeout(refresh,0)
    );
  }

  refresh();

  load().catch(e => {
    console.error('Chargement national',e);
    notice(
      'Erreur de chargement des localités.'
    );
  });
})();
