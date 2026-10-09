/* =====================================================================
   Lumen · app.js
   A small single-page app with no framework and no build step.

   How it works
   - S holds everything the person saves (journal, prayers, settings).
     It lives in localStorage on this device only (see "storage").
   - Each screen is a function that returns HTML (Today, Bible, Guide,
     Journal, Library, Prayer, Cards, More). render() draws the current one.
   - Clicks are handled in one place near the bottom ("event wiring"),
     using data-* attributes on buttons (data-go, data-tool, data-add…).
   - The journal has its own section: pages, decorations, handwriting
     (one <canvas> per page) and an undo/redo history.

   Content (verses, prompts, stickers, demo data) lives in data.js.
   ===================================================================== */
(function(){
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICON = {
  today:'<path d="M3 18h18M6 18a6 6 0 0 1 12 0M12 4v3M4.9 8.9l2.1 2.1M19.1 8.9 17 11"/>',
  bible:'<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6v13"/>',
  guide:'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>',
  journal:'<path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"/>',
  library:'<path d="M5 4v16M9 4v16M13 5l4 15M4 20h16"/>',
  prayer:'<path d="M9 21h6M10 21V11h4v10M12 11V9M12 3c1.5 2 2 3 0 5-2-2-1.5-3 0-5z"/>',
  cards:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 16l5-4 4 3 3-2 4 3"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  star:'<path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z"/>',
  washi:'<path d="M3 10l16-5 2 6-16 5z"/>',
  flower:'<circle cx="12" cy="8" r="2.2"/><path d="M12 10.5V21M12 16c-3 0-4-2-4-3 2 0 4 1 4 3zM12 5.8c0-2 1-3 0-3s0 1 0 3"/>',
  stamp:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5" stroke-dasharray="2 2"/>',
  photo:'<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M20 16l-5-5-8 8"/>',
  pen:'<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/>',
  hl:'<path d="M5 20h6M14 4l6 6-8 8H8v-4z"/>',
  heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  play:'<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  keyboard:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/>',
  note:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>',
  undo:'<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
  eraser:'<path d="M16 3l5 5-11 11H5l-2-2z"/><path d="M10 19h11"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  pages:'<path d="M8 4h11v15H8z"/><path d="M5 7v14h11"/>',
  redo:'<path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/>',
  more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'
};
const ic = (k, extra='') => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${ICON[k]}</svg>`;

/* ---------- storage (this browser only) ---------- */
const KEY = 'lumen-proto-v1';
function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch(e){ return null; } }
function persist(){ try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch(e){ return false; } }
const todayKey = localDateKey(new Date()); // YYYY-MM-DD in the device's own time zone
const S = load() || makeDemoState();
let saveTimer=null;
function save(){ const st=$('#saveState'); if(st){st.classList.add('wet');st.lastElementChild.textContent='Ink drying…';}
  clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ const ok=persist(); const s=$('#saveState'); if(s){s.classList.remove('wet'); s.lastElementChild.textContent= ok?'Kept safe':'Couldn’t save in this browser';} },900); }

/* ---------- shell ---------- */
const NAV = [['today','Today'],['bible','Bible'],['guide','Guide'],['journal','Journal'],['library','My Journal'],['prayer','Prayer'],['cards','Verse cards']];
const TABS = [['today','Today'],['bible','Bible'],['journal','Journal'],['prayer','Prayer'],['more','More']];
const MORE_SCREENS=['guide','library','cards','more'];
let screen='today', currentEntry=todayKey, pickedVerse='IS40';
function go(s, opts={}){ screen=s; if(opts.entry) currentEntry=opts.entry; if(opts.verse) pickedVerse=opts.verse; render(); window.scrollTo({top:0}); }
function renderNav(){
  $('#railNav').innerHTML = NAV.map(([k,l])=>`<button class="nav" data-go="${k}" ${screen===k?'aria-current="page"':''}>${ic(k==='library'?'library':k)}${l}</button>`).join('');
  $('#tabs').innerHTML = TABS.map(([k,l])=>{ const on = screen===k || (k==='more' && MORE_SCREENS.includes(screen)); return `<button data-go="${k}" ${on?'aria-current="page"':''}>${ic(k)}${l}</button>`; }).join('');
}
function More(){
  const items=[['guide','guide','Devotion guide','Tell the guide how you feel and get a passage'],['library','library','My Journal','Every page you’ve kept, on the bookshelf'],['cards','cards','Verse cards','Turn a verse into a card to share']];
  return `<div class="screen" style="max-width:640px"><h1 style="font-size:40px">More</h1>
    <div style="display:flex;flex-direction:column;gap:12px">${items.map(([k,i,l,s])=>`<button class="card" data-go="${k}" style="display:flex;gap:16px;align-items:center;min-height:76px;padding:14px 18px;border:0;text-align:left">${ic(i,'width="28" height="28"')}<span style="flex:1"><b style="display:block;font-size:18px">${l}</b><span class="muted" style="font-size:15px">${s}</span></span>${ic('arrow','width="20" height="20"')}</button>`).join('')}</div>
    <div class="panel" style="padding:18px;display:flex;flex-direction:column;gap:10px"><h2 style="font-size:24px">Comfort</h2>
      <button class="chip" data-toggle-theme style="align-self:flex-start">${ic('moon','width="18" height="18"')} <span class="themeLabel">Candlelight</span></button>
      <button class="chip" data-toggle-size style="align-self:flex-start"><span class="sizeLabel">Larger text</span></button></div>
    <div class="panel" style="padding:18px;display:flex;flex-direction:column;gap:10px"><h2 style="font-size:24px">Demo</h2>
      <p class="muted" style="font-size:15px">Everything you write is saved on this device only. Reset to start a demo fresh with the example pages and prayers.</p>
      <button class="chip" id="resetDemo" style="align-self:flex-start">Reset demo content</button></div>
  </div>`;
}
document.addEventListener('click', e=>{
  const g=e.target.closest('[data-go]'); if(g){ go(g.dataset.go, {entry:g.dataset.entry, verse:g.dataset.verse}); }
});
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2200); }

// candlelight & text size
function isDark(){ const a=document.documentElement.dataset.theme; return a ? a==='dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
function syncModeBtn(){ document.querySelectorAll('.themeLabel').forEach(s=>s.textContent = isDark() ? 'Daylight' : 'Candlelight'); document.querySelectorAll('[data-toggle-theme]').forEach(b=>b.setAttribute('aria-pressed', String(isDark()))); }
function toggleTheme(){ document.documentElement.dataset.theme = isDark()?'light':'dark'; syncModeBtn(); if(screen==='today') render(); toast(isDark()?'Candlelight on':'Daylight on'); }
function toggleSize(){ S.big=!S.big; applySize(); persist(); toast(S.big?'Larger text on':'Standard text'); }
function applySize(){ document.body.classList.toggle('big', !!S.big); document.body.style.fontSize = S.big?'19px':''; document.documentElement.style.setProperty('--reader', S.big?'31px':'26px'); document.querySelectorAll('.sizeLabel').forEach(s=>s.textContent = S.big?'Standard text':'Larger text'); document.querySelectorAll('[data-toggle-size]').forEach(b=>b.setAttribute('aria-pressed', String(!!S.big))); }

/* ---------- screens ---------- */
function greeting(){ const h=new Date().getHours(); return h<12?'Good morning':h<18?'Good afternoon':'Good evening'; }
function hasContent(e){ return !!(e.o||e.a||e.p||e.free||(e.decos&&e.decos.length)||(e.ink&&e.ink.length)||(e.more&&e.more.some(m=>m.free||m.ink.length||m.decos.length))); }
function daysWritten(){ return Object.values(S.entries).filter(hasContent).length; }

function Today(){
  const days=[['Mon','Psalm 37:7','Rest, and wait patiently','done'],['Tue','Romans 12:12','Patient in tribulation','open'],['Wed','Galatians 5:22','Fruit grows slowly','done'],['Thu','Isaiah 40:31','Strength for the waiting','today'],['Fri','Ecclesiastes 7:8','Better is the end','ahead'],['Sat','Lamentations 3:25','Good to those who wait','ahead'],['Sun','Look back','Rest & remember','ahead']];
  const n=daysWritten()+16; const plants=Array.from({length:Math.min(n,14)},(_,i)=>{const x=18+i*28,h=18+((i*37)%40);const fl=i%3===1;return `<path d="M${x} 96v-${h}" stroke="var(--sage)" stroke-width="2.2"/>${i%2?`<path d="M${x} ${96-h/2}c-8-2-12-7-12-13 8 1 12 6 12 13z" fill="var(--sage)" opacity=".7"/>`:''}${fl?`<circle cx="${x}" cy="${96-h}" r="7" fill="var(--rose)"/><circle cx="${x}" cy="${96-h}" r="2.6" fill="#E7B25C"/>`:''}`}).join('');
  return `<div class="screen">
  <header style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px">
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="eyebrow">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}</div>
      <h1 style="font-size:clamp(38px,5vw,58px)">${greeting()}, <span id="nm">${esc(S.name)}</span></h1>
      <p style="font-family:var(--f-display);font-style:italic;font-size:21px" class="muted">${isDark()?'The day is done. Come and rest a while.':'A week on Patience · Day 4 of 7'}</p>
    </div>
  </header>
  <div class="row">
    <section class="sheet" style="flex:999 1 480px;min-width:0;padding:clamp(24px,4vw,44px)">
      <div style="position:absolute;top:-6px;right:44px;width:28px;height:110px;background:var(--rose);clip-path:polygon(0 0,100% 0,100% 100%,50% 84%,0 100%);opacity:.9" aria-hidden="true"></div>
      <div style="display:flex;flex-direction:column;gap:16px;max-width:600px">
        <div class="ref">Today’s devotion · about 10 minutes</div>
        <h2 style="font-size:clamp(34px,4vw,46px);padding-right:40px">Strength for the waiting</h2>
        <blockquote class="scripture" style="margin:0">“${V.IS40.t}”</blockquote>
        <div class="ref">Isaiah 40:31 · KJV</div>
        <div class="guide" style="margin-top:8px"><div class="ribbon">${ic('guide')}Why this passage</div>
          <p>Isaiah wrote to people who felt their lives were on hold. He promised strength <em>in</em> the waiting, not only after it.</p></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
          <button class="btn" data-go="guide">Begin ${ic('arrow','width="20" height="20"')}</button>
          <button class="btn ghost" id="listen">${ic('play','width="16" height="16"')}Listen</button>
          <button class="link" data-go="journal" data-entry="${todayKey}" data-verse="IS40">Just write today</button>
        </div>
      </div>
    </section>
    <section class="panel" style="flex:1 1 280px;min-width:0;padding:28px">
      <div class="eyebrow">This week</div>
      <h2 style="font-size:30px;margin:4px 0 12px">A week on Patience</h2>
      <div class="week">${days.map(d=>`<div class="day" style="${d[3]==='ahead'?'opacity:.8':''}"><span class="dot ${d[3]}">${d[3]==='done'?ic('check','width="16" height="16" stroke-width="2.6"'):''}</span><div><div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase" class="muted">${d[0]} · ${d[1]}</div><div style="font-family:var(--f-display);font-size:20px;font-weight:${d[3]==='today'?600:500};line-height:1.2">${d[2]}</div></div></div>`).join('')}</div>
      <p class="muted" style="font-size:14px;margin-top:8px">Missed a day? It simply waits for you.</p>
    </section>
  </div>
  <div class="quick">
    <button data-go="bible">${ic('search','width="26" height="26"')}<b>Search the Bible</b><span class="muted">A verse, a word, or how you feel</span></button>
    <button data-go="library">${ic('journal','width="26" height="26"')}<b>My Journal</b><span class="muted">${daysWritten()} pages kept</span></button>
    <button data-go="prayer">${ic('prayer','width="26" height="26"')}<b>Prayer space</b><span class="muted">${S.prayers.filter(p=>!p.answered).length} requests · ${S.prayers.filter(p=>p.answered).length} answered</span></button>
  </div>
  <section class="panel" style="padding:24px 28px;display:flex;flex-wrap:wrap;gap:24px;align-items:center">
    <div style="flex:1 1 220px"><div class="eyebrow">Your garden</div><div style="font-family:var(--f-display);font-size:27px">${n} quiet visits this season</div><p class="muted" style="font-size:15px">Each visit plants something. Nothing wilts while you’re away.</p></div>
    <svg role="img" aria-label="Garden" viewBox="0 0 410 100" style="flex:1 1 300px;max-width:420px;height:100px" fill="none" stroke-linecap="round"><path d="M0 98 Q 205 90 410 98" stroke="var(--line)" stroke-width="3"/>${plants}</svg>
  </section>
  </div>`;
}

let query='I feel anxious about work', hlMap={}, picked=null;
function search(q){
  q=q.toLowerCase().trim(); if(!q) return [];
  const words=q.split(/[^a-z0-9:]+/).filter(w=>w.length>2 && !['the','and','feel','about','with','for','that','i’m','have'].includes(w));
  const scored=Object.entries(V).map(([k,v])=>{ let s=0; const ref=v.ref.toLowerCase();
    if(ref.includes(q)||q.includes(ref.replace(/–.*/,''))) s+=10;
    words.forEach(w=>{ if(v.tags.includes(w)) s+=3; if(v.t.toLowerCase().includes(w)) s+=2; if(ref.includes(w)) s+=4; });
    return [k,s]; }).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  return scored.slice(0,6).map(x=>x[0]);
}
function Bible(){
  const res=search(query);
  return `<div class="screen">
    <form id="sform" style="display:flex;flex-direction:column;gap:12px;max-width:860px">
      <label for="q"><h1 style="font-size:clamp(32px,4vw,42px)">What are you looking for?</h1></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><input id="q" class="field" style="flex:1 1 260px" value="${esc(query)}" placeholder="John 3:16, peace, or “I can’t sleep”"><button class="btn">Search</button></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center" class="muted">Try:
        ${['John 3:16','peace','I can’t sleep','I feel afraid','tired'].map(t=>`<button type="button" class="chip" data-try="${esc(t)}" style="min-height:38px">${esc(t)}</button>`).join('')}</div>
    </form>
    <div class="row">
      <section style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:12px" aria-label="Results">
        <div class="eyebrow">${res.length? res.length+' passages':'Nothing found yet — try a feeling or a word'}</div>
        ${res.map(k=>`<div class="result"><div style="font-family:var(--f-display);font-size:21px;line-height:1.45">“${V[k].t}”</div><div class="ref">${V[k].ref}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="link" data-go="journal" data-entry="${todayKey}" data-verse="${k}">Write about this</button><button class="link" data-card="${k}">Make a card</button></div></div>`).join('')}
      </section>
      <section class="sheet" style="flex:2 1 480px;min-width:0;padding:clamp(20px,4vw,48px)" aria-label="Reader">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--line)">
          <h2 style="font-size:40px">Philippians 4</h2><span class="chip" style="display:inline-flex;align-items:center">KJV</span></div>
        <p class="muted" style="font-size:14px;margin:12px 0">Tap a verse to highlight it, copy it into your journal, or make a card.</p>
        <div style="max-width:660px;margin:0 auto;display:flex;flex-direction:column;gap:4px">
          ${PHIL4.map(([n,t])=>`<p class="verse ${hlMap[n]?'hl-'+hlMap[n]:''} ${picked===n?'picked':''}" data-v="${n}" tabindex="0"><sup>${n}</sup>${t}</p>${picked===n?`<div class="actions" role="group" aria-label="Verse ${n}">
            <span style="padding:0 6px;font-size:14px">Highlight</span>
            ${['gold','sage','rose'].map(c=>`<button class="swatch" aria-label="${c}" data-hl="${c}" style="background:var(--${c}-soft);box-shadow:inset 0 0 0 2px rgba(255,255,255,.4)"></button>`).join('')}
            <button data-hl="">Clear</button><button data-tojournal="${n}">To journal</button><button data-tocard="${n}">Verse card</button></div>`:''}`).join('')}
        </div>
      </section>
    </div></div>`;
}

let feeling='Waiting', feelText='Still waiting to hear back about the job. It’s hard not to check my email every hour.';
function Guide(){
  const f=FEEL[feeling]; const v=V[f.v];
  return `<div class="screen">
    <section class="panel" style="padding:28px;display:flex;flex-wrap:wrap;gap:28px">
      <div style="flex:1 1 360px;min-width:0;display:flex;flex-direction:column;gap:14px">
        <label for="feel"><h1 style="font-size:36px">How are you, really?</h1></label>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${Object.keys(FEEL).map(k=>`<button class="chip" data-feel="${k}" aria-pressed="${k===feeling}">${k}</button>`).join('')}</div>
        <textarea id="feel" rows="3" style="resize:vertical;padding:14px 18px;border:0;border-radius:14px;background:var(--field);box-shadow:inset 0 0 0 1.5px var(--line);font-size:17px;outline:none">${esc(feelText)}</textarea>
        <p class="muted" style="font-size:14px">Only you can see this. In this prototype, suggestions come from a small set of sample guide notes.</p>
      </div>
      <div class="guide" style="flex:1 1 320px;min-width:0"><div class="ribbon">${ic('guide')}Your guide suggests</div>
        <div style="padding:14px 18px;background:var(--paper);border-radius:4px;color:var(--ink)"><div style="font-family:var(--f-display);font-size:22px;line-height:1.45">“${v.t}”</div><div class="ref" style="margin-top:6px">${v.ref} · KJV</div></div>
        <p style="margin-top:14px">${f.why}</p>
        <p style="margin-top:10px;font-family:var(--f-display);font-style:italic;font-size:20px">${f.q}</p>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px"><button class="btn small" data-go="journal" data-entry="${todayKey}" data-verse="${f.v}">Write about this</button><button class="btn small ghost" data-card="${f.v}">Make a card</button></div>
      </div>
    </section>
    <div class="row">
      <article class="sheet" style="flex:2 1 480px;min-width:0;padding:clamp(22px,4vw,48px);display:flex;flex-direction:column;gap:16px">
        <div class="eyebrow">Today · A week on Patience</div>
        <h2 style="font-size:44px">Strength for the waiting</h2>
        <div>
          <p class="verse" style="cursor:default"><sup>29</sup>${V.IS40b.t}</p>
          <p class="verse" style="cursor:default"><sup>30</sup>Even the youths shall faint and be weary, and the young men shall utterly fall:</p>
          <p class="verse hl-gold" style="cursor:default"><sup>31</sup>${V.IS40.t}</p>
          <div class="ref" style="margin-top:6px">Isaiah 40:29–31 · KJV</div></div>
        <h3 style="font-size:28px;font-weight:600;margin-top:6px">Sit with it</h3>
        ${['Where in your life does it feel like you have “no might” right now?','What would “waiting upon the LORD” look like in your next hour?','Run, walk, or simply not faint: which is today asking of you?'].map((q,i)=>`<div style="display:flex;gap:14px;padding:12px 0;border-top:1px solid var(--line)"><span style="font-family:var(--f-hand);font-size:30px;color:var(--rose);line-height:1">${i+1}</span><div style="font-family:var(--f-display);font-style:italic;font-size:21px;line-height:1.35">${q}</div></div>`).join('')}
        <div><button class="btn" data-go="journal" data-entry="${todayKey}" data-verse="IS40">Open my journal page</button></div>
      </article>
      <aside class="guide" style="flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:16px;padding-top:34px"><div class="ribbon">${ic('guide')}Insights · guide notes</div>
        <div><h3 style="font-size:24px;font-weight:600">The setting</h3><p>Isaiah 40 opens with “Comfort ye.” It speaks to exiles in Babylon who felt forgotten (v. 27). The Creator never grows tired, and He shares that strength.</p></div>
        <div style="display:flex;flex-direction:column;gap:8px"><h3 style="font-size:24px;font-weight:600">Key words</h3>
          <div style="padding:12px 14px;border-radius:8px;background:var(--paper)"><b style="font-family:var(--f-display);font-size:20px">wait · qavah</b> <span class="muted" style="font-size:13px">Hebrew</span><p style="font-size:15px">To wait with eager expectation; related to a word for a cord, hope twisted tight.</p></div>
          <div style="padding:12px 14px;border-radius:8px;background:var(--paper)"><b style="font-family:var(--f-display);font-size:20px">renew · chalaph</b> <span class="muted" style="font-size:13px">Hebrew</span><p style="font-size:15px">To change or exchange, like trading worn clothes for new.</p></div></div>
        <div><h3 style="font-size:24px;font-weight:600">Read alongside</h3><p>Psalm 27:14 · Lamentations 3:25–26 · 2 Corinthians 4:16</p></div>
        <p style="font-size:14px;border-top:1px solid var(--line);padding-top:10px">Guide notes help you read. Scripture is the main voice.</p>
      </aside>
    </div></div>`;
}

/* ---------- journal ---------- */
let tool='write', selected=null; // selected = {s: sheet index, i: decoration index}
let inkRedraws=[];
if(!S.inputMode) S.inputMode='type';
if(!S.pen) S.pen={kind:'pen',color:'ink',size:3};
const NOTES = {
  sticky:{name:'Sticky note',w:150,h:150,style:'background:#F6E7A8;box-shadow:0 6px 14px rgba(40,25,10,.2);padding:14px'},
  strip:{name:'Torn paper',w:230,h:70,style:'background:#FFFDF8;box-shadow:0 4px 10px rgba(40,25,10,.16);padding:12px 20px;clip-path:polygon(0 8%,6% 0,14% 9%,22% 1%,31% 8%,40% 0,49% 7%,58% 1%,67% 9%,76% 2%,85% 8%,93% 0,100% 7%,100% 92%,94% 100%,86% 91%,77% 99%,68% 92%,59% 100%,50% 93%,41% 100%,32% 91%,23% 99%,14% 92%,6% 100%,0 93%)'},
  tag:{name:'Gift tag',w:190,h:84,style:'background:#F1DCD6;box-shadow:0 4px 10px rgba(40,25,10,.16);padding:12px 14px 12px 40px;clip-path:polygon(14% 0,100% 0,100% 100%,14% 100%,0 50%)',extra:'<span style="position:absolute;left:16px;top:calc(50% - 6px);width:12px;height:12px;border-radius:50%;background:#E9DFCC;box-shadow:inset 0 0 0 1.5px rgba(31,42,68,.3)"></span>'},
  card:{name:'Index card',w:210,h:136,style:'background-color:#FFFDF8;background-image:linear-gradient(180deg,transparent 26px,rgba(163,95,89,.55) 26px,rgba(163,95,89,.55) 27.5px,transparent 27.5px),repeating-linear-gradient(180deg,transparent 0 25px,rgba(79,111,150,.25) 25px 26px);box-shadow:0 6px 14px rgba(40,25,10,.18);padding:2px 14px 10px'}
};
const DECO_NAMES={sprout:'sprout',sun:'sun',heart:'heart',star:'star',moon:'moon',dove:'dove',flower:'pressed flower',lavender:'lavender',fern:'fern'};
const GROW=360; // how much a page grows when you reach the bottom
function inkColor(c){ return getComputedStyle(document.documentElement).getPropertyValue('--'+c).trim() || '#1F2A44'; }

function entry(){
  if(!S.entries[currentEntry]) S.entries[currentEntry]={verse:pickedVerse,o:'',a:'',p:'',free:'',decos:[],paper:'lined',soap:true};
  const e=S.entries[currentEntry]; if(!e.ink) e.ink=[]; if(!e.decos) e.decos=[]; if(!e.more) e.more=[]; if(!e.ext) e.ext=0; return e;
}
function sheet(si){ const e=entry(); return si===0 ? e : e.more[si-1]; }
function sheetCount(){ return entry().more.length+1; }

/* history: one undo/redo for the whole entry (all pages, handwriting, decorations) */
const HIST={};
function hist(){ return HIST[currentEntry] || (HIST[currentEntry]={u:[],r:[]}); }
function snap(){ const e=entry(); return JSON.stringify({ink:e.ink,decos:e.decos,more:e.more,ext:e.ext}); }
function record(s){ const h=hist(); h.u.push(s||snap()); if(h.u.length>80) h.u.shift(); h.r=[]; syncHist(); }
function restore(s){ const e=entry(), o=JSON.parse(s); const pagesBefore=e.more.length; e.ink=o.ink; e.decos=o.decos; e.more=o.more; e.ext=o.ext||0; selected=null; save();
  if(e.more.length!==pagesBefore){ const y=window.scrollY; render(); window.scrollTo({top:y}); }
  else { e.more.forEach((m,i)=>{ const ta=document.querySelector(`textarea[data-sheet="${i+1}"]`); if(ta){ ta.value=m.free||''; autosize(ta); } }); applyHeights(); inkRedraws.forEach(f=>f()); renderDecos(); }
  syncHist(); }
function undo(){ const h=hist(); if(!h.u.length){ toast('Nothing to undo'); return; } h.r.push(snap()); restore(h.u.pop()); toast('Undone'); }
function redo(){ const h=hist(); if(!h.r.length){ toast('Nothing to redo'); return; } h.u.push(snap()); restore(h.r.pop()); toast('Redone'); }
function syncHist(){ const h=hist(), u=$('#undoBtn'), r=$('#redoBtn'); if(u) u.setAttribute('aria-disabled', String(!h.u.length)); if(r) r.setAttribute('aria-disabled', String(!h.r.length)); }

function toolList(){ const hand=S.inputMode==='hand'; return [['write',hand?'pen':'keyboard',hand?'Pen':'Write'],['notes','note','Notes'],['stickers','star','Stickers'],['washi','washi','Washi'],['flowers','flower','Flowers'],['stamps','stamp','Stamps'],['photo','photo','Photo']]; }

function Journal(){
  const e=entry(); if(pickedVerse && currentEntry===todayKey && !hasContent(e)) e.verse=pickedVerse;
  const v=V[e.verse]||V.IS40; const d=new Date(currentEntry+'T12:00:00');
  const dateStr=d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'});
  const short=d.toLocaleDateString(undefined,{day:'numeric',month:'short'});
  const hand=S.inputMode==='hand', n=sheetCount();
  return `<div class="screen jscreen">
    <div class="jtop">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0">
        <h1 tabindex="-1" style="font-size:28px">Journal${e.example?' <span class="muted" style="font-size:15px;font-family:var(--f-ui)">example page</span>':''}</h1>
        <span class="saved" id="saveState" role="status"><i></i><span>Kept safe</span></span>
      </div>
      <div class="seg" role="radiogroup" aria-label="How would you like to journal?">
        <button role="radio" data-mode="type" aria-checked="${!hand}">${ic('keyboard')}Type</button>
        <button role="radio" data-mode="hand" aria-checked="${hand}">${ic('pen')}Handwrite</button>
      </div>
    </div>

    <div class="dock" id="dock">
      <div class="dock-row">
        <div class="tools" role="toolbar" aria-label="Journal tools" id="toolBtns">${toolButtons()}</div>
        <div class="hist">
          <button class="hb" id="pagesBtn" aria-label="Pages: ${n}. Jump to a page">${ic('pages')}<span id="pagesLabel">${n} ${n>1?'pages':'page'}</span></button>
          <button class="hb" id="undoBtn" aria-keyshortcuts="Control+Z">${ic('undo')}<span>Undo</span></button>
          <button class="hb" id="redoBtn" aria-keyshortcuts="Control+Shift+Z">${ic('redo')}<span>Redo</span></button>
        </div>
      </div>
      <div class="dock-sub ${tool==='write'&&hand?'wrap':''}" id="dockSub">${dockSub()}</div>
      <nav class="pagejump" id="pageJump" aria-label="Pages in this entry" hidden></nav>
    </div>

    <div class="jwrap" id="sheets">
      <article class="page ${e.paper} ${hand?'handwrite':''}" data-sheet="0" id="sheet-0" aria-label="Page 1, ${dateStr}" style="min-height:${900+e.ext}px">
        <div class="jdate"><span class="eyebrow">${esc(v.ref)}</span><span class="hand">${dateStr}</span></div>
        <div class="verse-copy">${e.handVerse
          ? `<p class="muted" style="font-size:15px;line-height:1.45">Copy it out slowly: ${v.t}</p><div class="handlines" aria-hidden="true"></div>`
          : `<div class="hand">“${v.t}”</div>`}<div class="ref" style="margin-top:6px">${v.ref} · KJV</div></div>
        <div class="lines">
          ${e.soap ? `
            <label class="sec-label" for="tO">O · Observation</label><textarea class="write" id="tO" data-f="o" placeholder="${hand?'':'What do you notice? A word, a picture, a question…'}">${esc(e.o)}</textarea>
            <label class="sec-label" for="tA">A · Application</label><textarea class="write" id="tA" data-f="a" placeholder="${hand?'':'What will I carry into today?'}">${esc(e.a)}</textarea>
            <label class="sec-label" for="tP">P · Prayer</label><textarea class="write prayer" id="tP" data-f="p" placeholder="${hand?'':'Talk to God as you would to a close friend.'}">${esc(e.p)}</textarea>`
          : `<label class="sec-label" for="tF">Today’s page</label><textarea class="write" id="tF" data-f="free" style="min-height:540px" placeholder="${hand?'':'Start writing… or pick a prompt above'}">${esc(e.free)}</textarea>`}
        </div>
        <canvas class="ink" aria-hidden="true"></canvas>
        <div class="deco-layer"></div>
        <span class="pnum" aria-hidden="true">1</span>
      </article>
      ${e.more.map((m,k)=>{ const si=k+1; return `
      <article class="page more ${e.paper} ${hand?'handwrite':''}" data-sheet="${si}" id="sheet-${si}" aria-label="Page ${si+1}, ${dateStr}" style="min-height:${720+(m.ext||0)}px">
        <div class="jdate"><span class="eyebrow">Continued · ${short}</span>
          <button class="link rmpage" data-rmpage="${si}" style="font-size:14px;min-height:40px">Remove this page</button></div>
        <div class="lines" style="margin-top:12px">
          <label class="sec-label" for="tm${si}">Page ${si+1}</label>
          <textarea class="write" id="tm${si}" data-sheet="${si}" style="min-height:540px" placeholder="${hand?'':'Keep going… there’s always another page.'}">${esc(m.free||'')}</textarea>
        </div>
        <canvas class="ink" aria-hidden="true"></canvas>
        <div class="deco-layer"></div>
        <span class="pnum" aria-hidden="true">${si+1}</span>
      </article>`; }).join('')}
      <button class="newpage" id="addPage">${ic('plus','width="22" height="22"')}<span><b>Turn to a new page</b><span class="muted" style="display:block;font-size:14px">Plenty of room for everything on your heart</span></span></button>
      <div class="pageopts">
        <button class="chip" id="soapBtn" aria-pressed="${e.soap}">SOAP sections</button>
        <label class="chip" style="display:inline-flex;align-items:center;gap:8px">Paper
          <select id="paperSel" style="border:0;background:transparent;font-weight:600;min-height:40px"><option value="lined" ${e.paper==='lined'?'selected':''}>Lined</option><option value="dotted" ${e.paper==='dotted'?'selected':''}>Dotted</option><option value="plain" ${e.paper==='plain'?'selected':''}>Plain</option></select></label>
        <label class="chip check" style="padding:0 16px"><input type="checkbox" id="handVerse" ${e.handVerse?'checked':''}> Copy the verse by hand</label>
      </div>
    </div></div>`;
}
function toolButtons(){ return toolList().map(([k,i,l])=>`<button class="tool" data-tool="${k}" aria-pressed="${tool===k}">${ic(i)}${l}</button>`).join(''); }
function dockSub(){
  const hand=S.inputMode==='hand', P=S.pen;
  if(tool==='write' && hand) return `
    <div class="seg" role="group" aria-label="Pen type">${[['pen','pen','Pen'],['hl','hl','Highlight'],['eraser','eraser','Eraser']].map(([k,i,l])=>`<button data-pk="${k}" aria-pressed="${P.kind===k}">${ic(i)}${l}</button>`).join('')}</div>
    <div class="pens" role="group" aria-label="Ink colour">${[['ink','Ink'],['rose','Rose'],['sage','Sage'],['gold','Gold'],['sky','Sky']].map(([k,l])=>`<button class="pc" data-pc="${k}" aria-label="${l} ink" aria-pressed="${P.color===k}" style="background:var(--${k})"></button>`).join('')}</div>
    <div class="pens" role="group" aria-label="Nib size">${[[2,'Fine'],[3.5,'Medium'],[6,'Bold']].map(([s,l])=>`<button class="ps" data-ps="${s}" aria-label="${l} nib" aria-pressed="${P.size==s}"><i style="height:${s}px"></i></button>`).join('')}</div>
    <button class="chip" id="clearInk" style="font-size:14px">Clear writing</button>
    <span class="sublabel">The page grows as you reach the bottom</span>`;
  if(tool==='write') return `<span class="sublabel">Prompts</span>${PROMPTS.map(p=>`<button class="chip pchip" data-prompt="${esc(p)}">${esc(p)}</button>`).join('')}`;
  const tray=(items)=>items.join('') + `<span class="sublabel">Tap to add, then drag. Round handles resize and tilt.</span>`;
  if(tool==='notes') return tray(Object.entries(NOTES).map(([k,n])=>`<button class="tray-item" data-add="note" data-k="${k}" aria-label="Add ${n.name}" style="width:auto;padding:6px 12px;gap:4px;display:flex;flex-direction:column;align-items:center"><span style="display:block;width:${Math.min(70,Math.round(46*n.w/n.h))}px;height:34px;${n.style.replace(/padding:[^;]+;?/,'')}"></span><span style="font-size:12px;font-weight:500">${n.name}</span></button>`));
  if(tool==='stickers') return tray(['sprout','sun','heart','star','moon','dove'].map(k=>`<button class="tray-item" data-add="sticker" data-k="${k}" aria-label="Add ${k} sticker">${STICKERS[k]}</button>`));
  if(tool==='flowers') return tray(['flower','lavender','fern'].map(k=>`<button class="tray-item" data-add="flower" data-k="${k}" aria-label="Add ${DECO_NAMES[k]}">${STICKERS[k]}</button>`));
  if(tool==='washi') return tray(Object.keys(WASHI).map(k=>`<button class="tray-item" data-add="washi" data-k="${k}" aria-label="Add ${k} washi tape" style="width:110px"><span style="display:block;width:100%;height:24px;transform:rotate(-4deg);${WASHI[k]}"></span></button>`));
  if(tool==='stamps') return tray(STAMPS.map((s,i)=>`<button class="tray-item" data-add="stamp" data-k="${i}" aria-label="Add stamp ${s.replace(/<br>|&amp;/g,' ')}" style="width:86px;font-family:var(--f-display);font-weight:600;font-size:12px;color:var(--rose);letter-spacing:.06em;line-height:1.1;text-align:center">${s}</button>`));
  if(tool==='photo') return `<label class="btn small" for="photoIn" style="cursor:pointer">${ic('photo','width="20" height="20"')}Choose a photo</label><input id="photoIn" type="file" accept="image/*" class="sr"><span class="sublabel">It’s pinned like a polaroid, with a caption you can type.</span>`;
  return '';
}
function renderDock(){
  const tb=$('#toolBtns'); if(tb) tb.innerHTML=toolButtons();
  const ds=$('#dockSub'); if(ds){ ds.innerHTML=dockSub(); ds.scrollLeft=0; ds.classList.toggle('wrap', tool==='write' && S.inputMode==='hand'); }
  bindDock(); syncHist();
}
function bindDock(){
  const e=entry();
  const pi=$('#photoIn'); if(pi) pi.onchange=ev=>{ const f=ev.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); const k=Math.min(1,420/Math.max(img.width,img.height)); c.width=img.width*k; c.height=img.height*k; c.getContext('2d').drawImage(img,0,0,c.width,c.height); addDeco({type:'photo',src:c.toDataURL('image/jpeg',.8),cap:''}); }; img.src=r.result; }; r.readAsDataURL(f); };
  const c=$('#clearInk'); if(c) c.onclick=()=>{
    const any=[e,...e.more].some(s=>s.ink&&s.ink.length);
    if(!any){ toast('There’s no handwriting to clear'); return; }
    if(c.dataset.armed){ record(); [e,...e.more].forEach(s=>s.ink=[]); inkRedraws.forEach(f=>f()); save(); c.textContent='Clear writing'; delete c.dataset.armed; toast('Handwriting cleared. Tap Undo to bring it back.'); }
    else { c.dataset.armed='1'; c.textContent='Tap again to clear all pages'; setTimeout(()=>{ if(c.isConnected){ c.textContent='Clear writing'; delete c.dataset.armed; } },3000); } };
}
function autosize(t){ t.style.height='auto'; t.style.height=Math.max(108,Math.ceil(t.scrollHeight/36)*36)+'px'; }
function applyHeights(){ const e=entry(); document.querySelectorAll('#sheets .page').forEach(p=>{ const si=+p.dataset.sheet; p.style.minHeight=(si===0?900+e.ext:720+(sheet(si).ext||0))+'px'; }); }
function growIfNeeded(si, y){ const data=sheet(si), pg=$('#sheet-'+si); if(!pg) return false;
  if(y > pg.clientHeight-140){ if(si===0) data.ext=(data.ext||0)+GROW; else data.ext=(data.ext||0)+GROW; applyHeights(); return true; } return false; }

function decoLabel(d){ if(d.type==='note') return (NOTES[d.k]||NOTES.sticky).name+(d.text?': '+d.text:''); if(d.type==='stamp') return 'Stamp '+STAMPS[d.k].replace(/<br>|&amp;/g,' '); if(d.type==='photo') return 'Photo'+(d.cap?': '+d.cap:''); if(d.type==='washi') return d.k+' washi tape'; return (DECO_NAMES[d.k]||d.k)+(d.type==='flower'?'':' sticker'); }
function isSel(si,i){ return selected && selected.s===si && selected.i===i; }
function renderDecos(only){
  const n=sheetCount();
  for(let si=0; si<n; si++){
    if(only!==undefined && only!==si) continue;
    const pg=$('#sheet-'+si); if(!pg) continue; const L=pg.querySelector('.deco-layer'), W=pg.clientWidth, data=sheet(si);
    L.innerHTML=(data.decos||[]).map((d,i)=>{
      let inner='', w=d.w||90, h=d.h||90;
      if(d.type==='sticker') inner=STICKERS[d.k];
      if(d.type==='flower'){ inner=STICKERS[d.k]; w=d.w||80; h=d.h||140; }
      if(d.type==='washi'){ inner=`<div style="width:100%;height:100%;${WASHI[d.k]}"></div>`; w=d.w||150; h=d.h||30; }
      if(d.type==='stamp'){ inner=`<div style="width:100%;height:100%;border-radius:50%;box-shadow:inset 0 0 0 3px var(--rose),inset 0 0 0 8px transparent,inset 0 0 0 9.5px var(--rose);display:grid;place-items:center;text-align:center;font-family:var(--f-display);font-weight:600;font-size:15px;line-height:1.1;letter-spacing:.1em;color:var(--rose);opacity:.85">${STAMPS[d.k]}</div>`; w=d.w||110; h=d.h||110; }
      if(d.type==='note'){ const N=NOTES[d.k]||NOTES.sticky; w=d.w||N.w; h=d.h||N.h; inner=`<div class="notebox" style="${N.style}">${N.extra||''}<div class="notetext" contenteditable="true" data-note="${i}" spellcheck="false" aria-label="Note text" style="${d.k==='card'?'line-height:26px;padding-top:26px':''}">${esc(d.text||'')}</div></div>`; }
      if(d.type==='photo'){ inner=`<div style="width:100%;height:100%;padding:8px 8px 34px;background:#FFFDF8;box-shadow:0 6px 16px rgba(40,25,10,.22)"><img src="${d.src}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none"><input data-cap="${i}" value="${esc(d.cap||'')}" placeholder="caption" aria-label="Photo caption" style="position:absolute;left:8px;right:8px;bottom:4px;border:0;background:transparent;text-align:center;font-family:var(--f-hand);font-size:20px;color:#1F2A44;outline:none"></div>`; w=d.w||160; h=d.h||180; }
      return `<div class="deco ${isSel(si,i)?'sel':''}" data-i="${i}" tabindex="0" role="group" aria-roledescription="page decoration" aria-label="${esc(decoLabel(d))}. Arrow keys move, square brackets tilt, plus and minus resize, Delete removes." style="left:${d.x*W - w/2}px;top:${d.y - h/2}px;width:${w}px;height:${h}px;transform:rotate(${d.r||0}deg) scale(${d.s||1})">${inner}<span class="frame"></span><span class="h rot" data-h="rot" title="Tilt"></span><span class="h size" data-h="size" title="Resize"></span><button class="h del" data-h="del" aria-label="Remove ${esc(decoLabel(d))}" tabindex="-1">×</button></div>`;
    }).join('');
  }
}
function visibleSheet(){ // the page most in view, below the toolbar
  const dock=$('#dock'), top=dock?dock.getBoundingClientRect().bottom:0, mid=(top+window.innerHeight)/2;
  let best=0, bestD=1e9; document.querySelectorAll('#sheets .page').forEach(p=>{ const r=p.getBoundingClientRect(); const d = mid<r.top ? r.top-mid : mid>r.bottom ? mid-r.bottom : 0; if(d<bestD){ bestD=d; best=+p.dataset.sheet; } });
  return best;
}
function addDeco(d){
  const si=visibleSheet(), data=sheet(si), pg=$('#sheet-'+si); if(!pg) return; const r=pg.getBoundingClientRect();
  const dock=$('#dock'), dockBottom=dock?dock.getBoundingClientRect().bottom:0;
  const visibleMid=(Math.max(dockBottom, r.top)+Math.min(window.innerHeight, r.bottom))/2;
  record();
  d.x=.42+Math.random()*.16; d.y=Math.max(120, Math.min(pg.clientHeight-120, visibleMid - r.top)); d.r=Math.round(Math.random()*12-6); d.s=1;
  data.decos=data.decos||[]; data.decos.push(d); selected={s:si,i:data.decos.length-1}; delete entry().example; renderDecos(si); save();
  const el=pg.querySelector(`.deco[data-i="${selected.i}"]`); el&&el.focus({preventScroll:true});
}
function removeDeco(si,i){ record(); sheet(si).decos.splice(i,1); selected=null; renderDecos(si); save(); toast('Removed. Tap Undo to bring it back.'); }
function addPage(){
  const e=entry(); record(); e.more.push({free:'',ink:[],decos:[],ext:0}); delete e.example; save(); render();
  const pg=$('#sheet-'+e.more.length); if(pg){ pg.classList.add('turning'); pg.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth', block:'start'}); setTimeout(()=>{ const ta=pg.querySelector('textarea'); if(ta && S.inputMode==='type') ta.focus({preventScroll:true}); },400); }
  toast(`Page ${e.more.length+1} added`);
}
function removePage(si, btn){
  if(!btn.dataset.armed){ btn.dataset.armed='1'; btn.textContent='Tap again to remove'; setTimeout(()=>{ if(btn.isConnected){ btn.textContent='Remove this page'; delete btn.dataset.armed; } },3000); return; }
  const e=entry(); record(); e.more.splice(si-1,1); save(); const y=window.scrollY; render(); window.scrollTo({top:y}); toast('Page removed. Tap Undo to bring it back.');
}
function renderPageJump(){
  const nav=$('#pageJump'), n=sheetCount();
  nav.innerHTML=`<span class="sublabel">Go to</span>${Array.from({length:n},(_,i)=>`<button class="chip" data-jump="${i}" style="min-width:52px">Page ${i+1}</button>`).join('')}<button class="chip" id="addPage2">${ic('plus','width="16" height="16"')} New page</button>`;
}

let drag=null, nudgeAt=0;
function bindJournal(){
  const e=entry(), wrap=$('#sheets');
  wrap.querySelectorAll('textarea.write').forEach(t=>{ autosize(t);
    t.addEventListener('input',()=>{ if(t.dataset.sheet) sheet(+t.dataset.sheet).free=t.value; else e[t.dataset.f]=t.value; delete e.example; autosize(t); save(); });
    t.addEventListener('focus',()=>{ if(selected){ selected=null; renderDecos(); } }); });
  renderDecos(); bindDock(); syncHist();
  $('#undoBtn').onclick=undo; $('#redoBtn').onclick=redo;
  $('#addPage').onclick=addPage;
  $('#pagesBtn').onclick=()=>{ const nav=$('#pageJump'); if(nav.hidden){ renderPageJump(); nav.hidden=false; $('#pagesBtn').setAttribute('aria-expanded','true'); nav.querySelector('button').focus(); } else { nav.hidden=true; $('#pagesBtn').setAttribute('aria-expanded','false'); } };
  $('#pageJump').onclick=ev=>{ const b=ev.target.closest('button'); if(!b) return; if(b.id==='addPage2'){ $('#pageJump').hidden=true; addPage(); return; }
    const pg=$('#sheet-'+b.dataset.jump); $('#pageJump').hidden=true; const dock=$('#dock'); window.scrollTo({top: window.scrollY+pg.getBoundingClientRect().top-(dock.offsetHeight+16), behavior:'smooth'}); };
  wrap.querySelectorAll('[data-rmpage]').forEach(b=>b.onclick=()=>removePage(+b.dataset.rmpage,b));
  $('#soapBtn').onclick=()=>{ e.soap=!e.soap; if(!e.soap && !e.free){ e.free=[e.o,e.a,e.p].filter(Boolean).join('\n'); } save(); render(); };
  $('#paperSel').onchange=ev=>{ e.paper=ev.target.value; wrap.querySelectorAll('.page').forEach(p=>{ p.classList.remove('lined','dotted','plain'); p.classList.add(e.paper); }); save(); };
  $('#handVerse').onchange=ev=>{ e.handVerse=ev.target.checked; save(); render(); };

  wrap.addEventListener('pointerdown', ev=>{
    const pg=ev.target.closest('.page'); if(!pg) return; const si=+pg.dataset.sheet, data=sheet(si);
    const el=ev.target.closest('.deco'); if(!el){ if(selected && !ev.target.closest('textarea')){ selected=null; renderDecos(); } return; }
    const i=+el.dataset.i, d=data.decos[i], h=ev.target.dataset.h;
    if(ev.target.matches('input') || (ev.target.closest('[data-note]') && isSel(si,i))) return;
    if(h==='del'){ ev.preventDefault(); removeDeco(si,i); return; }
    ev.preventDefault(); selected={s:si,i}; wrap.querySelectorAll('.deco').forEach(x=>x.classList.toggle('sel',x===el)); el.focus({preventScroll:true});
    const pr=pg.getBoundingClientRect(), W=pg.clientWidth; const cx=pr.left+d.x*W, cy=pr.top+d.y;
    drag={si,i,h:h||'move',start:snap(),sx:ev.clientX,sy:ev.clientY,ox:d.x,oy:d.y,os:d.s||1,or:d.r||0,cx,cy,d0:Math.hypot(ev.clientX-cx,ev.clientY-cy)||1,a0:Math.atan2(ev.clientY-cy,ev.clientX-cx),el,W};
    el.setPointerCapture(ev.pointerId);
  });
  wrap.addEventListener('pointermove', ev=>{ if(!drag) return; const d=sheet(drag.si).decos[drag.i];
    if(drag.h==='move'){ d.x=drag.ox+(ev.clientX-drag.sx)/drag.W; d.y=Math.max(0,drag.oy+(ev.clientY-drag.sy)); }
    else if(drag.h==='size'){ d.s=Math.max(.4,Math.min(3,drag.os*Math.hypot(ev.clientX-drag.cx,ev.clientY-drag.cy)/drag.d0)); }
    else if(drag.h==='rot'){ d.r=drag.or+(Math.atan2(ev.clientY-drag.cy,ev.clientX-drag.cx)-drag.a0)*180/Math.PI; }
    placeDeco(drag.el,d,drag.W);
  });
  const end=()=>{ if(drag){ const d=sheet(drag.si).decos[drag.i]; if(d) growIfNeeded(drag.si, d.y+60); if(snap()!==drag.start) record(drag.start); drag=null; save(); } };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('focusin', ev=>{ const el=ev.target.closest&&ev.target.closest('.deco'); if(el && ev.target===el){ const si=+el.closest('.page').dataset.sheet; selected={s:si,i:+el.dataset.i}; wrap.querySelectorAll('.deco').forEach(x=>x.classList.toggle('sel',x===el)); } });
  wrap.addEventListener('keydown', ev=>{
    const el=ev.target.classList&&ev.target.classList.contains('deco')?ev.target:null; if(!el) return;
    const pg=el.closest('.page'), si=+pg.dataset.sheet, i=+el.dataset.i, d=sheet(si).decos[i], step=ev.shiftKey?24:8, W=pg.clientWidth; let moved=true;
    const before=snap();
    switch(ev.key){
      case 'ArrowLeft': d.x-=step/W; break; case 'ArrowRight': d.x+=step/W; break;
      case 'ArrowUp': d.y=Math.max(0,d.y-step); break; case 'ArrowDown': d.y+=step; growIfNeeded(si,d.y+60); break;
      case '[': d.r=(d.r||0)-5; break; case ']': d.r=(d.r||0)+5; break;
      case '+': case '=': d.s=Math.min(3,(d.s||1)+.1); break; case '-': d.s=Math.max(.4,(d.s||1)-.1); break;
      case 'Delete': case 'Backspace': ev.preventDefault(); removeDeco(si,i); return;
      case 'Escape': selected=null; el.classList.remove('sel'); el.blur(); return;
      default: moved=false;
    }
    if(moved){ ev.preventDefault(); if(Date.now()-nudgeAt>800) record(before); nudgeAt=Date.now(); placeDeco(el,d,W); save(); }
  });
  wrap.addEventListener('input', ev=>{
    const pg=ev.target.closest('.page'); if(!pg) return; const data=sheet(+pg.dataset.sheet);
    if(ev.target.dataset.cap!==undefined){ data.decos[+ev.target.dataset.cap].cap=ev.target.value; save(); }
    if(ev.target.dataset.note!==undefined){ data.decos[+ev.target.dataset.note].text=ev.target.innerText; delete e.example; save(); }
  });
  inkRedraws=[]; const cleanups=[];
  wrap.querySelectorAll('.page').forEach(pg=>cleanups.push(bindInk(+pg.dataset.sheet, pg)));
  const mo=new MutationObserver(()=>inkRedraws.forEach(f=>f())); mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  inkCleanup=()=>{ cleanups.forEach(f=>f()); mo.disconnect(); inkRedraws=[]; };
}
function placeDeco(el,d,W){ const w=parseFloat(el.style.width), hh=parseFloat(el.style.height); el.style.left=(d.x*W-w/2)+'px'; el.style.top=(d.y-hh/2)+'px'; el.style.transform=`rotate(${d.r}deg) scale(${d.s})`; }

/* ---------- handwriting (one canvas per page) ---------- */
let inkCleanup=null, penSeen=false;
function bindInk(si, page){
  const data=()=>sheet(si);
  const cv=page.querySelector('.ink'), ctx=cv.getContext('2d'); let W=1, H=1, live=null, start=null, panning=false; const ptrs=new Map();
  function size(){ const dpr=window.devicePixelRatio||1; W=page.clientWidth; H=page.clientHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); redraw(); }
  function seg(s,a,b,c){ const x=p=>p[0]*W;
    ctx.beginPath(); ctx.moveTo((x(a)+x(b))/2,(a[1]+b[1])/2); ctx.quadraticCurveTo(x(b),b[1],(x(b)+x(c))/2,(b[1]+c[1])/2);
    ctx.lineWidth = s.w*(.55+.9*(b[2]??.5)); ctx.stroke(); }
  function style(s){ ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=inkColor(s.c); ctx.globalAlpha = s.k==='hl'?.32:1; }
  function drawStroke(s){ style(s); const p=s.pts; if(p.length===1){ ctx.beginPath(); ctx.arc(p[0][0]*W,p[0][1],s.k==='hl'?s.w*2.5:s.w*.6,0,7); ctx.fillStyle=ctx.strokeStyle; ctx.fill(); ctx.globalAlpha=1; return; }
    if(s.k==='hl'){ ctx.beginPath(); ctx.lineWidth=s.w*5; ctx.moveTo(p[0][0]*W,p[0][1]); p.forEach(q=>ctx.lineTo(q[0]*W,q[1])); ctx.stroke(); ctx.globalAlpha=1; return; }
    const pts=[p[0],...p,p[p.length-1]]; for(let i=1;i<pts.length-1;i++) seg(s,pts[i-1],pts[i],pts[i+1]); ctx.globalAlpha=1; }
  function redraw(){ const ink=data()?data().ink||[]:[]; ctx.clearRect(0,0,W,H); ink.filter(s=>s.k==='hl').forEach(drawStroke); ink.filter(s=>s.k!=='hl').forEach(drawStroke); }
  inkRedraws.push(redraw);
  function pt(ev){ const r=cv.getBoundingClientRect(); return [+((ev.clientX-r.left)/W).toFixed(4), +(ev.clientY-r.top).toFixed(1), ev.pointerType==='pen'? +(ev.pressure||.5).toFixed(2) : .5]; }
  function erase(p){ const dd=data(), before=dd.ink.length; dd.ink=dd.ink.filter(s=>!s.pts.some(q=>Math.hypot((q[0]-p[0])*W,q[1]-p[1])<16)); if(dd.ink.length!==before) redraw(); }
  const down=ev=>{
    if(S.inputMode!=='hand') return;
    if(ev.pointerType==='pen') penSeen=true;
    if(ev.pointerType==='touch' && penSeen) return;
    ptrs.set(ev.pointerId,{y:ev.clientY});
    if(ptrs.size>=2){ if(live){ if(!live.eraser) data().ink.pop(); live=null; redraw(); } panning=true; return; }
    cv.setPointerCapture(ev.pointerId); ev.preventDefault();
    start=snap(); const p=pt(ev);
    if(S.pen.kind==='eraser'){ live={eraser:true}; erase(p); return; }
    live={k:S.pen.kind,c:S.pen.color,w:S.pen.size,pts:[p]}; data().ink.push(live); drawStroke(live);
  };
  const move=ev=>{
    if(panning && ptrs.has(ev.pointerId)){ const o=ptrs.get(ev.pointerId); window.scrollBy(0,(o.y-ev.clientY)/ptrs.size); o.y=ev.clientY; return; }
    if(!live) return; const evs=ev.getCoalescedEvents?ev.getCoalescedEvents():[ev];
    evs.forEach(ce=>{ const p=pt(ce);
      if(live.eraser){ erase(p); return; }
      const last=live.pts[live.pts.length-1]; if(Math.hypot((p[0]-last[0])*W,p[1]-last[1])<1.2) return;
      live.pts.push(p); const n=live.pts.length;
      if(live.k==='hl'){ redraw(); } else { style(live); const a=live.pts[n-3]||live.pts[0], b=live.pts[n-2], c=live.pts[n-1]; seg(live,a,b,c); ctx.globalAlpha=1; }
    });
  };
  const up=ev=>{ ptrs.delete(ev.pointerId); if(ptrs.size===0) panning=false;
    if(live){ const stroke=live; live=null; redraw();
      if(start && snap()!==start){ record(start); delete entry().example; save();
        if(stroke.pts){ const maxY=Math.max(...stroke.pts.map(q=>q[1])); if(growIfNeeded(si,maxY)) toast('More room added below'); } }
      start=null; } };
  cv.addEventListener('pointerdown',down); cv.addEventListener('pointermove',move); cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  const ro=new ResizeObserver(size); ro.observe(page); size();
  return ()=>ro.disconnect();
}
function onKey(ev){
  if(screen!=='journal') return;
  const typing=ev.target.matches && ev.target.matches('input,textarea,select,[contenteditable="true"]');
  const mod=ev.ctrlKey||ev.metaKey;
  if(mod && !typing && ev.key.toLowerCase()==='z'){ ev.preventDefault(); ev.shiftKey?redo():undo(); }
  else if(mod && !typing && ev.key.toLowerCase()==='y'){ ev.preventDefault(); redo(); }
}

/* ---------- library ---------- */
function Library(){
  const list=Object.entries(S.entries).filter(([k,e])=>hasContent(e)).sort((a,b)=>b[0].localeCompare(a[0]));
  const months={}; list.forEach(([k])=>{const m=k.slice(0,7); months[m]=(months[m]||0)+1;});
  const cols=['#1F2A44','#5F7257','#A35F59','#C9B48C','#33405E','#7E8F74'];
  return `<div class="screen">
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px">
      <div><div class="eyebrow">Your library</div><h1 style="font-size:46px">My Journal</h1></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;flex:1 1 300px;justify-content:flex-end"><input id="libq" class="field" style="max-width:340px" placeholder="Search your pages"><button class="btn" data-go="journal" data-entry="${todayKey}">New page</button></div>
    </div>
    <section class="shelf" aria-label="Bookshelf"><div class="books">
      ${Object.entries(months).map(([m,n],i)=>`<button class="spine" style="width:${58+(i%3)*6}px;height:${236+(i%4)*10}px;background:${cols[i%cols.length]};color:${i%cols.length===3?'#1F2A44':'#F3DDB4'}"><span>${new Date(m+'-15').toLocaleDateString(undefined,{month:'long',year:'numeric'})}</span><b style="font-family:var(--f-hand);font-size:20px">${n}</b></button>`).join('')}
      <div style="width:110px;height:220px;flex:none;display:grid;place-items:center;text-align:center;padding:10px;border-radius:4px;box-shadow:inset 0 0 0 1.5px rgba(31,42,68,.35);color:#1F2A44;font-family:var(--f-hand);font-size:21px;transform:rotate(10deg)">next month’s journal</div>
    </div><div class="plank"></div></section>
    <div class="pages" id="libPages">${list.map(([k,e],i)=>{const v=V[e.verse]||V.IS40; const txt=e.o||e.free||e.a||e.p||((e.ink&&e.ink.length)?'A handwritten page':'A decorated page'); return `<button class="pg" data-go="journal" data-entry="${k}" data-text="${esc((txt+' '+v.ref).toLowerCase())}" style="transform:rotate(${[-1.2,1,-.5,.8][i%4]}deg)"><span class="hand" style="font-size:24px">${new Date(k+'T12:00:00').toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})}${e.example?' · example':''}</span><span class="ref" style="color:var(--sage)">${v.ref}${(e.more&&e.more.length)?` · ${e.more.length+1} pages`:''}</span><span class="hand">${esc(txt.slice(0,90))}${txt.length>90?'…':''}</span></button>`}).join('')||'<p class="muted">Your pages will appear here.</p>'}</div>
  </div>`;
}

/* ---------- prayer ---------- */
let answering=null;
function Prayer(){
  const open=S.prayers.filter(p=>!p.answered), done=S.prayers.filter(p=>p.answered).slice().reverse();
  const g=S.gratitude[todayKey]||['','',''];
  const tints=['#FBF6EC','#F1DCD6','#DCE3D3','#F1E2BF'];
  return `<div class="screen">
    <div><div class="eyebrow" style="color:var(--rose)">Prayer space</div><h1 style="font-size:46px">“Pray without ceasing.”</h1><div class="ref" style="margin-top:6px">1 Thessalonians 5:17</div></div>
    <div class="row">
      <section style="flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:12px">
        <h2 style="font-size:30px">Praying for</h2>
        <form id="addPrayer" class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px">
          <label for="np" style="font-weight:600;font-size:15px">Add a prayer</label>
          <input id="np" class="field" style="border-radius:12px" placeholder="Who or what are you praying for?">
          <button class="btn small" style="align-self:flex-start">Add to my list</button>
        </form>
        ${open.map(p=>`<div class="card req"><div style="display:flex;gap:8px;align-items:center"><span class="chip" style="min-height:26px;padding:0 10px;font-size:13px;font-weight:600">${esc(p.tag)}</span><span class="muted" style="font-size:13px">since ${esc(p.since)} · prayed ${p.count}×</span></div>
          <div style="font-family:var(--f-display);font-size:23px;font-weight:600;line-height:1.2">${esc(p.title)}</div>${p.note?`<p class="muted" style="font-size:15px">${esc(p.note)}</p>`:''}
          ${answering===p.id?`<form data-ansform="${p.id}" style="display:flex;flex-direction:column;gap:8px"><label for="how${p.id}" style="font-size:15px;font-weight:600">How did God answer?</label><input id="how${p.id}" class="field" style="border-radius:12px;font-family:var(--f-hand);font-size:24px" placeholder="Write a line for the wall"><div style="display:flex;gap:8px"><button class="btn small">Pin to the wall</button><button type="button" class="link" data-cancel>Cancel</button></div></form>`
          :`<div style="display:flex;flex-wrap:wrap;gap:8px"><button class="chip" data-prayed="${p.id}" style="font-size:14px">${ic('check','width="16" height="16"')} Prayed today</button><button class="chip" data-answer="${p.id}" style="font-size:14px;color:var(--rose);box-shadow:inset 0 0 0 1.5px var(--rose)">Mark as answered</button></div>`}</div>`).join('')}
      </section>
      <section class="wall" style="flex:1.5 1 400px;min-width:0" aria-label="Answered prayers">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin-bottom:22px"><h2 style="font-size:32px;font-weight:600">Wall of gratitude</h2><span style="font-family:var(--f-hand);font-size:24px">${done.length} answered prayers</span></div>
        <div class="notes">${done.map((p,i)=>`<div class="note" style="transform:rotate(${[-2,2.4,-1,1.6][i%4]}deg);background:${tints[i%4]}"><div style="font-size:12px;font-weight:700;letter-spacing:.1em;color:#7E3F3A">ANSWERED · ${esc(p.answered.date).toUpperCase()}</div><div style="font-family:var(--f-display);font-size:21px;font-weight:600;line-height:1.2">${esc(p.title)}</div><div class="hand">${esc(p.answered.how)}</div></div>`).join('')}
          <div style="display:grid;place-items:center;text-align:center;min-height:140px;border-radius:4px;box-shadow:inset 0 0 0 2px rgba(42,31,24,.3);font-family:var(--f-hand);font-size:23px;padding:14px">your next “thank You” goes here</div></div>
      </section>
      <section style="flex:1 1 260px;min-width:0" aria-label="Gratitude">
        <div class="grat"><h2 style="font-size:27px;font-weight:600;margin-bottom:6px">Three good things today</h2>
          ${[0,1,2].map(i=>`<div style="display:flex;align-items:center;gap:8px"><span style="font-family:var(--f-hand);font-size:26px;color:var(--rose)">${i+1}.</span><input data-g="${i}" aria-label="Good thing ${i+1}" value="${esc(g[i])}" placeholder="${['Mango on the balcony','A kind message','…'][i]}"></div>`).join('')}
        </div>
      </section>
    </div></div>`;
}

/* ---------- verse cards ---------- */
let card={v:'IS40',bg:'sage',font:'serif'};
const BGS={parchment:['#F2E8D5','#1F2A44'],sage:['#5F7257','#FBF6EC'],rose:['#E8CFC7','#4E2724'],night:['#1F2A44','#F3DDB4'],candle:['#2A1F18','#F3DDB4']};
const FONTS={serif:["var(--f-display)",'italic',500,38],hand:["var(--f-hand)",'normal',600,44],sans:["var(--f-ui)",'normal',600,28]};
function Cards(){
  const [bg,ink]=BGS[card.bg], f=FONTS[card.font], v=V[card.v];
  return `<div class="screen">
    <div><div class="eyebrow">Verse cards</div><h1 style="font-size:44px">Make it beautiful, then share it</h1></div>
    <div class="row">
      <div style="flex:1.3 1 380px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:16px;padding:28px 16px;border-radius:14px;background:var(--paper2)">
        <figure class="vcard" style="margin:0;background-color:${bg};${card.bg==='candle'?'background-image:radial-gradient(circle at 50% 0%,rgba(231,178,92,.32),transparent 60%);':''}color:${ink}">
          <svg aria-hidden="true" style="position:absolute;right:-12px;top:-6px;transform:rotate(18deg);opacity:.85" width="200" height="140" viewBox="0 0 210 150" fill="none"><path d="M10 140C60 110 120 70 200 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><g fill="currentColor" opacity=".35"><ellipse cx="48" cy="112" rx="18" ry="7" transform="rotate(-50 48 112)"/><ellipse cx="90" cy="86" rx="18" ry="7" transform="rotate(-55 90 86)"/><ellipse cx="108" cy="92" rx="18" ry="7" transform="rotate(15 108 92)"/><ellipse cx="150" cy="62" rx="17" ry="6.5" transform="rotate(10 150 62)"/></g></svg>
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:16px"><div style="font-family:${f[0]};font-style:${f[1]};font-weight:${f[2]};font-size:clamp(22px,4.5vw,${v.t.length>120?f[3]-12:f[3]}px);line-height:1.2">“${v.t}”</div><div style="width:40px;height:1.5px;background:currentColor;opacity:.6"></div><div style="font-size:13px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;opacity:.85">${v.ref}</div></div>
        </figure>
        <p class="muted" style="font-size:14px;text-align:center">To save this card, take a screenshot or press and hold on your phone. One-tap saving comes in the full app.</p>
      </div>
      <div class="card" style="flex:1 1 300px;min-width:0;padding:24px;display:flex;flex-direction:column;gap:20px">
        <div style="display:flex;flex-direction:column;gap:8px"><label for="cv" style="font-weight:600">Verse</label><select id="cv" class="field" style="border-radius:12px">${Object.entries(V).map(([k,x])=>`<option value="${k}" ${k===card.v?'selected':''}>${x.ref}</option>`).join('')}</select></div>
        <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:600">Background</span><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px">${Object.entries(BGS).map(([k,[b]])=>`<button aria-label="${k}" data-cbg="${k}" style="aspect-ratio:1;border:0;border-radius:12px;background:${b};box-shadow:${k===card.bg?'0 0 0 2.5px var(--ink),0 0 0 5px var(--paper)':'inset 0 0 0 1px var(--line)'}"></button>`).join('')}</div></div>
        <div style="display:flex;flex-direction:column;gap:8px"><span style="font-weight:600">Lettering</span><div style="display:flex;gap:8px;flex-wrap:wrap">${[['serif','Classic'],['hand','Handwritten'],['sans','Modern']].map(([k,l])=>`<button class="chip" data-cfont="${k}" aria-pressed="${k===card.font}">${l}</button>`).join('')}</div></div>
        <button class="btn ghost" data-go="journal" data-entry="${todayKey}" data-verse="${card.v}">Write about this verse</button>
      </div>
    </div></div>`;
}

/* ---------- render ---------- */
const SCREENS={today:Today,bible:Bible,guide:Guide,journal:Journal,library:Library,prayer:Prayer,cards:Cards,more:More};
let lastScreen=null;
function render(){
  if(inkCleanup){ inkCleanup(); inkCleanup=null; }
  renderNav(); $('#main').innerHTML=SCREENS[screen]();
  if(lastScreen===screen){ const sc=$('#main .screen'); if(sc) sc.style.animation='none'; }
  if(lastScreen!==null && lastScreen!==screen){ const h=$('#main h1'); if(h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:true}); } document.title=(NAV.find(n=>n[0]===screen)||['','More'])[1]+' · Lumen'; }
  lastScreen=screen; syncModeBtn(); applySize();
  if(screen==='journal') bindJournal();
  if(screen==='bible'){
    $('#sform').onsubmit=e=>{e.preventDefault(); query=$('#q').value; render();};
    document.querySelectorAll('[data-try]').forEach(b=>b.onclick=()=>{query=b.dataset.try; render();});
  }
  if(screen==='guide'){ $('#feel').oninput=e=>{ feelText=e.target.value; const t=feelText.toLowerCase(); const m=Object.keys(FEEL).find(k=>t.includes(k.toLowerCase().slice(0,5))) || (/(worr|stress|nervous)/.test(t)&&'Anxious') || (/(exhaust|weary|sleep)/.test(t)&&'Tired') || (/(thank|bless)/.test(t)&&'Grateful') || (/(scared|fear)/.test(t)&&'Afraid') || (/(loss|died|miss)/.test(t)&&'Grieving'); if(m && m!==feeling){ feeling=m; const pos=e.target.selectionStart; render(); const f=$('#feel'); f.focus(); f.setSelectionRange(pos,pos);} }; }
  if(screen==='library'){ $('#libq').oninput=e=>{ const q=e.target.value.toLowerCase(); document.querySelectorAll('#libPages .pg').forEach(p=>p.hidden=!p.dataset.text.includes(q)); }; }
  if(screen==='prayer'){
    $('#addPrayer').onsubmit=e=>{e.preventDefault(); const t=$('#np').value.trim(); if(!t) return; S.prayers.push({id:Date.now(),title:t,note:'',tag:'Me',since:new Date().toLocaleDateString(undefined,{day:'numeric',month:'short'}),answered:null,count:0}); persist(); render(); toast('Added to your prayer list'); };
    document.querySelectorAll('[data-ansform]').forEach(f=>f.onsubmit=e=>{e.preventDefault(); const p=S.prayers.find(x=>x.id==f.dataset.ansform); p.answered={date:new Date().toLocaleDateString(undefined,{day:'numeric',month:'short'}),how:f.querySelector('input').value.trim()||'Thank You, Lord.'}; answering=null; persist(); render(); toast('Pinned to your wall of gratitude'); });
    document.querySelectorAll('[data-g]').forEach(i=>i.oninput=()=>{ const g=S.gratitude[todayKey]||['','','']; g[+i.dataset.g]=i.value; S.gratitude[todayKey]=g; persist(); });
  }
  if(screen==='cards'){ $('#cv').onchange=e=>{card.v=e.target.value; render();}; }
}
document.addEventListener('click', e=>{
  const t=e.target.closest('button'); if(!t) return;
  if(t.dataset.tool){ tool=t.dataset.tool; selected=null; renderDock(); renderDecos(); }
  else if(t.dataset.add){ const d={type:t.dataset.add,k:t.dataset.add==='stamp'?+t.dataset.k:t.dataset.k}; addDeco(d); }
  else if(t.dataset.mode){ if(S.inputMode===t.dataset.mode) return; S.inputMode=t.dataset.mode; tool='write'; selected=null; persist(); render(); toast(S.inputMode==='hand'?'Handwriting on. Write right on the page.':'Typing on. Tap a line to type.'); }
  else if(t.dataset.pk){ S.pen.kind=t.dataset.pk; persist(); renderDock(); }
  else if(t.dataset.pc){ S.pen.color=t.dataset.pc; if(S.pen.kind==='eraser') S.pen.kind='pen'; persist(); renderDock(); }
  else if(t.dataset.ps){ S.pen.size=+t.dataset.ps; if(S.pen.kind==='eraser') S.pen.kind='pen'; persist(); renderDock(); }
  else if(t.dataset.prompt && S.inputMode==='hand'){ addDeco({type:'note',k:'tag',text:t.dataset.prompt}); }
  else if(t.dataset.prompt){ const e=entry(); const f=e.soap?'o':'free'; const ta=$(e.soap?'#tO':'#tF'); e[f]=(e[f]?e[f].replace(/\n*$/,'\n'):'')+t.dataset.prompt+'\n'; ta.value=e[f]; autosize(ta); delete e.example; save(); ta.focus({preventScroll:false}); ta.setSelectionRange(ta.value.length,ta.value.length); }
  else if(t.id==='resetDemo'){
    if(!t.dataset.armed){ t.dataset.armed='1'; t.textContent='Tap again to erase and reset'; setTimeout(()=>{ if(t.isConnected){ t.textContent='Reset demo content'; delete t.dataset.armed; } },3000); return; }
    const fresh=makeDemoState(); Object.keys(S).forEach(k=>delete S[k]); Object.assign(S,fresh); S.inputMode='type'; S.pen={kind:'pen',color:'ink',size:3}; persist(); applySize(); go('today'); toast('Demo content restored');
  }
  else if(t.dataset.toggleTheme!==undefined){ toggleTheme(); }
  else if(t.dataset.toggleSize!==undefined){ toggleSize(); }
  else if(t.dataset.feel){ feeling=t.dataset.feel; render(); }
  else if(t.dataset.card){ card.v=t.dataset.card; go('cards'); }
  else if(t.dataset.cbg){ card.bg=t.dataset.cbg; render(); }
  else if(t.dataset.cfont){ card.font=t.dataset.cfont; render(); }
  else if(t.dataset.prayed){ const p=S.prayers.find(x=>x.id==t.dataset.prayed); p.count++; persist(); render(); toast('Prayed. Keep going.'); }
  else if(t.dataset.answer){ answering=+t.dataset.answer; render(); const i=$('#how'+answering); i&&i.focus(); }
  else if(t.hasAttribute('data-cancel')){ answering=null; render(); }
  else if(t.dataset.hl!==undefined){ if(t.dataset.hl) hlMap[picked]=t.dataset.hl; else delete hlMap[picked]; render(); }
  else if(t.dataset.tojournal){ const n=+t.dataset.tojournal; go('journal',{entry:todayKey, verse: n===6?'PHP6':n===7?'PHP7':'PHP7'}); }
  else if(t.dataset.tocard){ const n=+t.dataset.tocard; card.v=n===6?'PHP6':'PHP7'; go('cards'); }
  else if(t.id==='listen'){ try{ const u=new SpeechSynthesisUtterance(V.IS40.t); u.rate=.85; speechSynthesis.cancel(); speechSynthesis.speak(u); }catch(err){ toast('Audio isn’t available here'); } }
});
document.addEventListener('click', e=>{ const v=e.target.closest('.verse[data-v]'); if(v){ const n=+v.dataset.v; picked = picked===n?null:n; render(); } });
document.addEventListener('keydown', e=>{ const v=e.target.closest && e.target.closest('.verse[data-v]'); if(v && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); v.click(); } });
document.addEventListener('keydown', onKey);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{ syncModeBtn(); if(screen==='today') render(); });

applySize(); syncModeBtn(); render();
})();
