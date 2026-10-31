(() => {
  'use strict';
  const data = window.K1_DATA;
  const q = (selector) => document.querySelector(selector);
  const dom = {
    search:q('#search'),searchForm:q('#search-form'),searchFeedback:q('#search-feedback'),searchFeedbackText:q('#search-feedback-text'),clear:q('#clear-search'),results:q('#results'),count:q('#result-count'),
    image:q('#floor-image'),imageError:q('#map-image-error'),markers:q('#markers'),mapLayer:q('#map-layer'),viewport:q('#map-viewport'),
    caption:q('#map-caption-text'),heading:q('#map-heading-title'),details:q('#details'),
    language:q('#language'),zoomOut:q('#zoom-out'),zoomIn:q('#zoom-in'),zoomReset:q('#zoom-reset'),
    zoomLabel:q('#zoom-label'),pinsToggle:q('#pins-toggle'),floorButtons:[...document.querySelectorAll('[data-floor]')]
  };
  // A missing or truncated data.js must not crash the entire kiosk page.
  if (!data || !Array.isArray(data.places) || !Array.isArray(data.floors)) {
    const list = document.querySelector('#results');
    if (list) list.textContent = 'Raumdaten fehlen. Bitte die Seite neu laden / Room data unavailable.';
    console.error('K1 Navigator: data.js is missing or invalid.');
    return;
  }
  const t = {
    de: {badge:'HCI-Prototyp',eyebrow:'CAMPUS WAYFINDING',title:'Finde deinen Raum.',intro:'Wähle ein Geschoss oder suche einen Bereich auf dem Gebäudeplan.',searchLabel:'Raum suchen',floors:'Geschosse',found:'Räume',loading:'Lade Räume …',sidebarNote:'Illustrationsbasierte Demo · kein amtlicher Lageplan',mapEyebrow:'INTERAKTIVE GEBÄUDEKARTE',mapSubtitle:'Tippe auf einen Marker oder wähle einen Bereich aus der Liste.',reset:'Anpassen',mapLegend:'Räume auf der Illustration',pins:'Markierungen',scrollHint:'Zum Erkunden scrollen / zoomen',emptyTitle:'Wähle einen Bereich aus',emptyText:'Position und Angaben erscheinen hier.',disclaimer:'Hinweis: Die Bilder sind KI-generierte Designillustrationen und kein verifizierter Grundriss. Positionen beziehen sich auf die Bilder, nicht auf echte Gebäude-Koordinaten. Live-Stundenpläne werden nicht simuliert.',searchPlaceholder:'z. B. K1-120, 120, Seminarraum …',invalidRoomFormat:'Ungültiges Raumformat. Beispiele: K1-120, K1 120, 120 oder K1-215a. Auch Raumnamen sind möglich.',noResults:'Kein Raum gefunden. Prüfe die Raumnummer (z. B. K1-120).',showOnMap:'Auf Karte zeigen',imageMissing:'Kartenbild konnte nicht geladen werden. Bitte die Dateien im Ordner assets prüfen.',zoomInLabel:'Vergrößern',zoomOutLabel:'Verkleinern',clearLabel:'Suche löschen',languageLabel:'Switch to English',mapRegionLabel:'Gebäudeplan, verschiebbar',floorSelectLabel:'Geschoss wählen',noLiveSchedule:'Live-Raumplan nicht verbunden',floor:'Geschoss',area:'Bereich',designSpot:'Position auf der Illustration',notOfficial:'Keine offizielle Raumzuordnung',floorName:['1. Obergeschoss','2. Obergeschoss','3. Obergeschoss'],groupLabel:'Räume im Plan',location:'Markierung',details:'Ausgewählter Bereich'},
    en: {badge:'HCI prototype',eyebrow:'CAMPUS WAYFINDING',title:'Find your room.',intro:'Choose a floor or search an area on the building illustration.',searchLabel:'Search rooms',floors:'Floors',found:'Rooms',loading:'Loading …',sidebarNote:'Illustrative demo · not an official floor plan',mapEyebrow:'INTERACTIVE CAMPUS MAP',mapSubtitle:'Tap a marker or choose an area from the list.',reset:'Fit',mapLegend:'Areas on the illustration',pins:'Markers',scrollHint:'Scroll / zoom to explore',emptyTitle:'Select an area',emptyText:'Its position and details will appear here.',disclaimer:'Note: These images are AI-generated design illustrations, not verified architectural plans. Positions are relative to the images, not real campus coordinates. Live class schedules are not simulated.',searchPlaceholder:'e.g. K1-120, 120, seminar room …',invalidRoomFormat:'Invalid room code. Examples: K1-120, K1 120, 120, or K1-215a. You can also search by room name.',noResults:'No room found. Check the room code (e.g. K1-120).',showOnMap:'Show on map',imageMissing:'Map image could not be loaded. Please check the files in the assets folder.',zoomInLabel:'Zoom in',zoomOutLabel:'Zoom out',clearLabel:'Clear search',languageLabel:'Zu Deutsch wechseln',mapRegionLabel:'Interactive floor map, scrollable',floorSelectLabel:'Choose floor',noLiveSchedule:'Live room schedule not connected',floor:'Floor',area:'Area',designSpot:'Position in illustration',notOfficial:'Not an official room designation',floorName:['First floor','Second floor','Third floor'],groupLabel:'Rooms on plan',location:'Marker',details:'Selected area'}
  };
  const sharedParams = new URLSearchParams(window.location.search);
  let lang = sharedParams.get('lang') === 'en' ? 'en' : 'de', floor = '1OG', zoom=1, selectedId=null, queryText='', lastFocusedPin=null;
  let validationTimer = null;
  const FEEDBACK_DELAY_MS = 480;

  // Separate *room codes* from ordinary free-text room-name searches.
  // Room codes may have an optional letter suffix (215a); free-text names remain unrestricted.
  const isRoomCodeAttempt = (input) => /^(?:k(?:\s|[-_\/]|\d)|\d)/i.test(input.trim());
  const validRoomCode = (input) => /^(?:K1[- ]\d{3}[a-z]?|\d{3}[a-z]?)$/i.test(input.trim());
  const hasRoomFormatError = (input) => isRoomCodeAttempt(input) && !validRoomCode(input);
  function showFormatFeedback(invalid) {
    dom.search.setAttribute('aria-invalid', String(invalid));
    dom.searchForm.classList.toggle('has-error', invalid);
    dom.searchFeedback.hidden = !invalid;
    if (invalid) {
      dom.searchFeedbackText.textContent = t[lang].invalidRoomFormat;
      dom.search.setAttribute('aria-describedby', 'search-feedback');
    } else {
      dom.search.removeAttribute('aria-describedby');
      dom.searchFeedbackText.textContent = '';
    }
  }
  function refreshValidation(immediate = false) {
    if (validationTimer !== null) { clearTimeout(validationTimer); validationTimer = null; }
    const invalid = hasRoomFormatError(dom.search.value);
    if (!invalid) { showFormatFeedback(false); return false; }
    if (immediate || !dom.searchFeedback.hidden) { showFormatFeedback(true); return true; }
    validationTimer = setTimeout(() => {
      validationTimer = null;
      showFormatFeedback(hasRoomFormatError(dom.search.value));
    }, FEEDBACK_DELAY_MS);
    return true;
  }
  const BOOKABLE_DEMO_CODES = new Set(window.LCC_BOOKABLE_CODES || []);
  const bookingBase = window.location.pathname.includes('/map-demo/') ? '../booking/' : 'booking/';
  const bookingHref = (code) => `${bookingBase}?${new URLSearchParams({raum:code,lang})}`;
  const indexById=new Map(data.places.map(p=>[p.id,p]));
  const labelFloor = (id) => t[lang].floorName[['1OG','2OG','3OG'].indexOf(id)] || id;
  const roomName = (item) => lang === 'en' ? item.nameEn : item.name;
  const normal = (s) => String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const codeKey = (s) => normal(s).replace(/[^a-z0-9]/g,'');
  const isExactCode = (room, term) => codeKey(room.code) === codeKey(term) || codeKey(room.code.replace(/^K1-/i,'')) === codeKey(term);
  const matched = (room) => {
    if(!queryText) return true;
    return isExactCode(room,queryText) || normal(`${room.code} ${room.name} ${room.nameEn} ${room.floor}`).includes(normal(queryText)) || codeKey(room.code).includes(codeKey(queryText));
  };
  const currentFloorPlaces = () => data.places.filter(item=>item.floor===floor && matched(item));
  const visibleList = () => data.places.filter(item=>matched(item) && (queryText || item.floor===floor));
  const escapeHtml = (s) => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Shared room-code contract: the map uses visual IDs; Next.js booking resolves
  // the stable SQLite room id from the selected code (no fake DB identifiers in URLs).
  const linkedCode = (sharedParams.get('raum') || '').toUpperCase();
  const linkedRoom = data.places.find(item => item.code.toUpperCase() === linkedCode);
  if (linkedRoom) { floor = linkedRoom.floor; selectedId = linkedRoom.id; }
  const iconFor = (kind)=>({seminar:'▤',common:'◈',lab:'⚙',study:'▦',office:'▣',other:'•',unverified:'?'})[kind]||'•';
  function updateLabels(){
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-i18n]').forEach(node=>{const k=node.dataset.i18n;if(t[lang][k])node.textContent=t[lang][k];});
    dom.search.placeholder=t[lang].searchPlaceholder;
    if (!dom.searchFeedback.hidden) dom.searchFeedbackText.textContent=t[lang].invalidRoomFormat;
    dom.language.textContent=lang==='de'?'EN':'DE';
    document.querySelector('[data-floor-label="1OG"]').textContent=labelFloor('1OG');
    document.querySelector('[data-floor-label="2OG"]').textContent=labelFloor('2OG');
    document.querySelector('[data-floor-label="3OG"]').textContent=labelFloor('3OG');
    dom.heading.innerHTML=escapeHtml(labelFloor(floor))+' <span class="title-muted">/ K1</span>';
    dom.caption.textContent=floor.replace('OG','. OG')+' · '+(lang==='de'?'Designillustration':'Design illustration');
    dom.image.alt=lang==='de'?`KI-generierte Illustration ${labelFloor(floor)}`:`AI-generated illustration of the ${labelFloor(floor)}`;
    dom.zoomReset.title=t[lang].reset;
    if(!dom.imageError.hidden) dom.imageError.textContent=t[lang].imageMissing;
    dom.zoomIn.setAttribute('aria-label',t[lang].zoomInLabel);
    dom.zoomIn.title=t[lang].zoomInLabel;
    dom.zoomOut.setAttribute('aria-label',t[lang].zoomOutLabel);
    dom.zoomOut.title=t[lang].zoomOutLabel;
    dom.clear.setAttribute('aria-label',t[lang].clearLabel);
    dom.language.setAttribute('aria-label',t[lang].languageLabel);
    dom.viewport.setAttribute('aria-label',t[lang].mapRegionLabel);
    document.querySelector('#floor-buttons').setAttribute('aria-label',t[lang].floorSelectLabel);
  }
  function drawFloorControls(){dom.floorButtons.forEach(b=>{const active=b.dataset.floor===floor;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  function drawMap(){
    const metadata=data.floors.find(f=>f.id===floor);
    // Preserve the current image if the floor has not changed; resetting src
    // on every keystroke can interrupt map navigation on smaller screens.
    dom.image.onload=()=>{
      dom.imageError.hidden=true;
      dom.markers.classList.toggle('hide-pins',!dom.pinsToggle.checked || !dom.imageError.hidden);
      if(selectedId){const chosen=indexById.get(selectedId);if(chosen&&chosen.floor===floor)requestAnimationFrame(()=>centerOn(chosen));}
    };
    dom.image.onerror=()=>{
      dom.image.alt=lang==='de'?'Bild nicht gefunden':'Image not found';
      dom.imageError.textContent=t[lang].imageMissing;
      dom.imageError.hidden=false;
      dom.markers.classList.add('hide-pins');
    };
    if(dom.image.src!==metadata.image && dom.image.getAttribute('src')!==metadata.image) dom.image.src=metadata.image;
    dom.markers.innerHTML='';
    currentFloorPlaces().filter(item=>Number.isFinite(item.x) && Number.isFinite(item.y)).forEach((item,i)=>{
      const button=document.createElement('button');button.type='button';button.className='map-pin room-code-pin'+(selectedId===item.id?' selected':'');
      button.style.left=`${(item.x*100).toFixed(3)}%`;button.style.top=`${(item.y*100).toFixed(3)}%`;
      button.title=`${item.code} · ${roomName(item)}`;button.setAttribute('aria-label',`${item.code}, ${roomName(item)}, ${labelFloor(item.floor)}`);
      button.dataset.roomId=item.id;button.textContent=item.code;
      button.addEventListener('click',()=>selectRoom(item.id,true));dom.markers.appendChild(button);
    });
    dom.markers.classList.toggle('hide-pins',!dom.pinsToggle.checked || !dom.imageError.hidden);
  }
  function drawResults(){
    const rows=visibleList();dom.count.textContent=String(rows.length);
    if(!rows.length){dom.results.innerHTML=`<div class="result-empty">${escapeHtml(t[lang].noResults)}</div>`;return;}
    dom.results.innerHTML='';
    rows.forEach(item=>{
      const b=document.createElement('button');b.type='button';b.className='result'+(selectedId===item.id?' selected':'');b.dataset.roomId=item.id;
      b.setAttribute('aria-label',`${item.code}, ${roomName(item)} – ${labelFloor(item.floor)}`);
      const label=document.createElement('div');label.className='result-body';label.innerHTML=`<b>${escapeHtml(item.code)}</b><small>${escapeHtml(roomName(item))} · ${escapeHtml(labelFloor(item.floor))}</small>`;
      const icon=document.createElement('span');icon.className='result-pin';icon.setAttribute('aria-hidden','true');icon.textContent=iconFor(item.category);
      const arrow=document.createElement('span');arrow.className='result-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
      b.append(icon,label,arrow);b.addEventListener('click',()=>selectRoom(item.id,true));dom.results.appendChild(b);
    });
  }
  const bookingCopy = {
    de: {button:'Diesen Raum probeweise reservieren →', note:'Nur Demo: Buchbarkeit dieser 21 Räume angenommen, keine echte Hochschulbuchung.', unavailable:'Für diesen Bereich ist in der Demo keine Buchung vorgesehen.'},
    en: {button:'Make a test reservation for this room →', note:'Demo only: room availability is assumed, not confirmed by the university.', unavailable:'This location is not bookable in the demo.'},
  };
  function drawDetails(){
    const item=indexById.get(selectedId);
    if(!item){dom.details.innerHTML=`<div class="details-empty"><div class="empty-symbol">⌖</div><div><h3>${escapeHtml(t[lang].emptyTitle)}</h3><p>${escapeHtml(t[lang].emptyText)}</p></div></div>`;return;}
    const canDemoBook = BOOKABLE_DEMO_CODES.has(item.code);
    const hasPosition = Number.isFinite(item.x) && Number.isFinite(item.y);
    const demoAction = canDemoBook
      ? `<a class="booking-cta" href="${bookingHref(item.code)}">${escapeHtml(bookingCopy[lang].button)}</a>`
      : `<p class="not-bookable">${escapeHtml(bookingCopy[lang].unavailable)}</p>`;
    const noPositionNote = !hasPosition ? (lang === 'de' ? 'Raum aus dem Hochschulplan: noch kein Marker in dieser KI-Illustration.' : 'Room from the university plan: no pin in this AI illustration yet.') : '';
    dom.details.innerHTML=`<div class="details-selected"><div class="detail-icon" aria-hidden="true">${iconFor(item.category)}</div><div class="detail-content"><div class="detail-floor">${escapeHtml(labelFloor(item.floor))} · ${escapeHtml(t[lang].designSpot)}</div><h3>${escapeHtml(item.code)} · ${escapeHtml(roomName(item))}</h3><p>${escapeHtml(t[lang].notOfficial)}</p>${canDemoBook?`<p class="booking-note">${escapeHtml(bookingCopy[lang].note)}</p>`:''}${noPositionNote?`<p class="booking-note">${escapeHtml(noPositionNote)}</p>`:''}</div><div class="detail-actions">${hasPosition ? `<button id="focus-selected" type="button">⌖ ${escapeHtml(t[lang].showOnMap)}</button>` : ''}${demoAction}</div></div>`;
    if (hasPosition) q('#focus-selected').addEventListener('click',()=>centerOn(item));
  }
  function centerOn(item){
    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) return; // no fabricated pin for K1-114
    const rect=dom.mapLayer.getBoundingClientRect(), vp=dom.viewport;
    const left=Math.max(0,rect.width*item.x-vp.clientWidth/2),top=Math.max(0,rect.height*item.y-vp.clientHeight/2);
    vp.scrollTo({left,top,behavior:'instant'});
  }
  function selectRoom(id,focus){
    const item=indexById.get(id);if(!item)return;
    if(item.floor!==floor){floor=item.floor;dom.viewport.scrollTo({left:0,top:0,behavior:'instant'});}
    selectedId=id;
    drawFloorControls();updateLabels();drawResults();drawMap();drawDetails();
    if(focus){requestAnimationFrame(()=>centerOn(item));}
  }
  function setFloor(id){
    if(!data.floors.some(f=>f.id===id))return;
    // Explicit floor navigation resets the previous room query. Otherwise a search for
    // K1-120 can leave the newly selected 2OG/3OG with zero visible markers.
    dom.search.value=''; queryText=''; dom.clear.hidden=true; refreshValidation(true);
    floor=id; selectedId=null; zoom=1;
    dom.viewport.scrollTop=0; dom.viewport.scrollLeft=0;
    updateZoom(); render();
  }
  function updateZoom(){dom.mapLayer.style.width=`max(${Math.round(zoom*100)}%,${Math.round(950*zoom)}px)`;dom.zoomLabel.textContent=`${Math.round(zoom*100)}%`;dom.zoomOut.disabled=zoom<=1;dom.zoomIn.disabled=zoom>=3;}
  function zoomBy(change){const next=Math.max(1,Math.min(3,Math.round((zoom+change)*4)/4));if(next===zoom)return;
    const vp=dom.viewport,previousW=dom.mapLayer.offsetWidth,previousH=dom.mapLayer.offsetHeight,rx=(vp.scrollLeft+vp.clientWidth/2)/previousW,ry=(vp.scrollTop+vp.clientHeight/2)/previousH;
    zoom=next;updateZoom();vp.scrollLeft=Math.max(0,rx*dom.mapLayer.offsetWidth-vp.clientWidth/2);vp.scrollTop=Math.max(0,ry*dom.mapLayer.offsetHeight-vp.clientHeight/2);}
  function render(){drawFloorControls();updateLabels();drawResults();drawMap();drawDetails();}
  function bind(){
    dom.floorButtons.forEach(b=>b.addEventListener('click',()=>setFloor(b.dataset.floor)));
    dom.search.addEventListener('input',()=>{
      queryText=dom.search.value.trim();dom.clear.hidden=!queryText;
      refreshValidation();
      const exact=queryText && !hasRoomFormatError(queryText) ? data.places.filter(item=>isExactCode(item,queryText)) : [];
      if(exact.length===1){
        // Directly navigate to the correct room and floor once a complete code is entered.
        selectRoom(exact[0].id,true);
      } else {
        selectedId=null;drawResults();drawMap();drawDetails();
      }
    });
    dom.search.addEventListener('blur',()=>refreshValidation(true));
    dom.clear.addEventListener('click',()=>{dom.search.value='';dom.search.dispatchEvent(new Event('input'));dom.search.focus();});
    dom.searchForm.addEventListener('submit',event=>{event.preventDefault();if(refreshValidation(true)){dom.search.focus();return;}const rows=visibleList();const first=rows.find(item=>isExactCode(item,queryText))||rows[0];if(first)selectRoom(first.id,true);});
    dom.language.addEventListener('click',()=>{lang=lang==='de'?'en':'de';render();});
    dom.pinsToggle.addEventListener('change',()=>dom.markers.classList.toggle('hide-pins',!dom.pinsToggle.checked || !dom.imageError.hidden));
    dom.zoomIn.addEventListener('click',()=>zoomBy(.25));dom.zoomOut.addEventListener('click',()=>zoomBy(-.25));
    dom.zoomReset.addEventListener('click',()=>{zoom=1;updateZoom();if(selectedId){centerOn(indexById.get(selectedId));}else{dom.viewport.scrollTo({left:0,top:0});}});
    // Pointer drag for desktop, native scrolling remains available on touchscreens.
    let drag=null;
    dom.viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,left:dom.viewport.scrollLeft,top:dom.viewport.scrollTop};dom.viewport.classList.add('dragging');});
    window.addEventListener('pointerup',()=>{drag=null;dom.viewport.classList.remove('dragging');});
    dom.viewport.addEventListener('pointermove',e=>{if(!drag)return;dom.viewport.scrollLeft=drag.left-(e.clientX-drag.x);dom.viewport.scrollTop=drag.top-(e.clientY-drag.y);});
    dom.viewport.addEventListener('keydown',e=>{if((e.key==='+'||e.key==='=')&&!e.ctrlKey&&!e.metaKey){zoomBy(.25);e.preventDefault();}else if(e.key==='-'&&!e.ctrlKey&&!e.metaKey){zoomBy(-.25);e.preventDefault();}});
  }
  bind();updateZoom();render();
})();
