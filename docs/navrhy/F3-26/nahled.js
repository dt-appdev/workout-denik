// Náhledy F3-26: skutečná stránka appky, obsah #app nahrazený navrženým HTML
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const TRI = {
  up: '<svg class="tri" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 9.5 8.5H.5z"/></svg>',
  down: '<svg class="tri" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 .5 1.5h9z"/></svg>',
  same: '<svg class="tri tri2" viewBox="0 0 20 10" aria-hidden="true"><path d="M.5 5 7 .8v8.4zM19.5 5 13 .8v8.4z"/></svg>',
};
const fmt = (n) => String(n).replace('.', ',');
// d: změna (číslo), u: jednotka, pct: procenta, mode: kg | pct
function chg(r, mode) {
  if (r.d == null) return '<span class="flat">–</span>';
  const val = mode === 'pct' ? r.pct : r.d;
  const unit = mode === 'pct' ? ' %' : r.u;
  if (Math.abs(r.pct) < 1) return `<span class="flat">${TRI.same} 0</span>`;
  if (val > 0) return `<span class="gain">${TRI.up} +${fmt(val)}${unit}</span>`;
  return `<span class="flat">${TRI.down} −${fmt(Math.abs(val))}${unit}</span>`;
}
// cviky (fiktivní, PPL 3M)
const EX = [
  { n: 'Bench Press (Barbell)', cz: 'Bench press s velkou činkou', p: 'Hrudník', v: '108', l: 'odh. 1RM', d: 4.5, u: ' kg', pct: 4.3, k: 6, last: '7. 10.' },
  { n: 'Lateral Raise (Dumbbell)', cz: 'Upažování s jednoručkami', p: 'Ramena', v: '12', l: 'max. zátěž', d: 2, u: ' kg', pct: 20, k: 6, last: '7. 10.' },
  { n: 'Triceps Pushdown', cz: 'Stahování kladky na triceps', p: 'Triceps', v: '41', l: 'odh. 1RM', d: 0, u: ' kg', pct: 0, k: 6, last: '7. 10.' },
  { n: 'Pull Up', cz: 'Shyby nadhmatem', p: 'Záda', v: '10', l: 'opak.', d: 2, u: ' opak.', pct: 25, k: 6, last: '5. 10.' },
  { n: 'Leg Press (Machine)', cz: 'Leg press (šikmý)', p: 'Kvadricepsy', v: '205', l: 'odh. 1RM', d: 25, u: ' kg', pct: 13.9, k: 4, last: '3. 10.', gym: 'Fitko Letná' },
  { n: 'Leg Press (Machine)', cz: 'Leg press (šikmý)', p: 'Kvadricepsy', v: '160', l: 'odh. 1RM', d: null, k: 2, last: '19. 9.', gym: 'Fitko Karlín' },
  { n: 'Romanian Deadlift (Barbell)', cz: 'Rumunský mrtvý tah', p: 'Hamstringy', v: '128', l: 'odh. 1RM', d: 7.5, u: ' kg', pct: 6.2, k: 5, last: '3. 10.' },
  { n: 'Bicep Curl (Dumbbell)', cz: 'Bicepsový zdvih s jednoručkami', p: 'Biceps', v: '16', l: 'max. zátěž', d: -1, u: ' kg', pct: -5.9, k: 6, last: '5. 10.' },
  { n: 'Plank', cz: 'Prkno (plank)', p: 'Břicho', v: '1:30', l: 'výdrž', d: '0:15', u: '', pct: 20, k: 5, last: '5. 10.', time: true },
  { n: 'Running', cz: 'Běh', p: 'Kardio', v: '5:12', l: 'tempo /km', d: '0:14', u: ' /km', pct: 4.3, k: 4, last: '1. 10.', time: true },
];
function exRow(r, mode) {
  let c = chg(r, mode);
  if (r.time && r.d != null && mode !== 'pct') c = `<span class="gain">${TRI.up} ${r.l.startsWith('tempo') ? '−' : '+'}${r.d}</span>`;
  return `<button class="exrow" data-act="openEx">
    <div class="grow">
      <div class="n">${r.n}</div>
      <div class="cz">${r.cz}</div>
      <div class="m">${r.p}${r.gym ? ' · ' + r.gym : ''} · ${r.k}× v období · naposledy ${r.last}</div>
    </div>
    <div class="r">${r.v}<small>${r.l}</small><span class="chg">${c}</span></div>
  </button>`;
}
const HELP_BTN = fs.readFileSync('help.html', 'utf8');
const top = (sub) => `<header class="top"><h1>Statistiky<small>${sub}</small></h1>
  <span class="sync"><i></i> Uloženo</span></header>
  <div class="seg seg-wide" style="margin-bottom:10px">
    <button aria-pressed="false">Přehled</button><button aria-pressed="false">Partie</button>
    <button aria-pressed="true">Cviky</button></div>
  <div class="chips"><button class="chip" aria-pressed="true">Všechna fitka</button>
    <button class="chip" aria-pressed="false"><span class="sw" style="background:var(--s1)"></span> Fitko Letná</button>
    <button class="chip" aria-pressed="false"><span class="sw" style="background:var(--s2)"></span> Fitko Karlín</button></div>`;
const range = (cur) => `<section class="sec"><div class="seg seg-wide">${[
  ['7d', '7 dní'], ['30d', '30 dní'], ['3m', '3M'], ['6m', '6M'], ['1y', 'Rok'], ['all', 'Vše'],
].map(([k, l]) => `<button aria-pressed="${k === cur}">${l}</button>`).join('')}</div></section>`;
function best() {
  const rows = EX.filter((r) => r.d != null && r.pct >= 1).sort((a, b) => b.pct - a.pct).slice(0, 5);
  const mx = rows[0].pct;
  const txt = (r) => `+${fmt(Math.round(r.pct))} %`;
  return `<section class="sec">
    <div class="sec-h"><h2>Největší zlepšení</h2>${HELP_BTN}</div>
    <div class="card"><div class="hbars stk">${rows.map((r) => `<div class="hbar" role="button">
      <span class="hl">${r.n}${r.gym ? ' · ' + r.gym : ''}</span>
      <div class="t" style="width:${(r.pct / mx) * 100}%;background:var(--good)"></div>
      <span class="v gain">${txt(r)}</span></div>`).join('')}</div></div></section>`;
}
const stag = `<section class="sec"><div class="sec-h"><h2>Bez zlepšení</h2><span class="xs muted">1</span></div>
  <div class="stack" style="gap:6px"><button class="exrow"><div class="grow">
    <div class="n">Triceps Pushdown</div><div class="cz">Stahování kladky na triceps</div>
    <div class="m">od 9. 9. (35×10) · naposledy 7. 10.</div></div>
    <div class="r">4<small>tréninky</small></div></button></div></section>`;
function list(rows, mode) {
  return `<section class="sec">
    <div class="sec-h"><h2>Cviky</h2><span class="xs muted">${rows.length}</span>
      <div class="seg" style="margin-left:auto"><button aria-pressed="${mode !== 'pct'}">Naposledy</button>
      <button aria-pressed="${mode === 'pct'}">Zlepšení</button></div></div>
    <input class="inp" placeholder="Hledat cvik (anglicky i česky)…">
    <div class="chips" style="margin-top:8px"><button class="chip" aria-pressed="true">Vše</button>
      <button class="chip">Hrudník</button><button class="chip">Záda</button><button class="chip">Ramena</button>
      <button class="chip">Biceps</button><button class="chip">Triceps</button></div>
    <div class="stack" style="margin-top:10px;gap:6px">${rows.map((r) => exRow(r, mode)).join('')}</div></section>`;
}
const byPct = EX.slice().sort((a, b) => (a.d == null) - (b.d == null) || b.pct - a.pct);
const short = EX.map((r) => Object.assign({}, r, { d: null, k: r.k > 2 ? 2 : 1 }));
const CSS = `.exrow .r .chg{display:block;font-family:var(--body);font-size:var(--fs-sm);font-weight:700;margin-top:2px}
  .tabs,#toastRoot{display:none!important}`;
const PAGES = {
  'navrh-naposledy': top('Všechna fitka') + range('3m') + best() + stag + list(EX, 'kg'),
  'navrh-zlepseni': top('Všechna fitka') + range('3m') + best() + stag + list(byPct, 'pct'),
  'navrh-7dni': top('Všechna fitka') + range('7d') + stag + list(short, 'kg'),
};
const HELP_SHEET = `<div class="scrim"><div class="sheet" role="dialog"><div class="sheet-h"><h2>Zlepšení za období</h2>
  <button class="iconbtn">${fs.readFileSync('close.html', 'utf8')}</button></div><div class="sheet-b">${[
  ['Změna u cviku', 'Porovná nejlepší hodnotu z prvních 2 tréninků v období s nejlepší z posledních 2. Ukáže se, když je v období aspoň 3 tréninky s cvikem rozložené aspoň na 14 dní, jinak –. Změna pod 1 % se bere jako 0.'],
  ['Co se porovnává', 'Váha a opakování: odhad 1RM, když obvykle děláš víc než 10 opakování, tak max. zátěž (odhad je tam nepřesný). Vlastní váha: nejvíc opakování v sérii. Na čas: nejdelší výdrž. Vzdálenost: nejlepší tempo.'],
  ['Největší zlepšení', 'Pět cviků s největší změnou v procentech, aby lehké cviky nebyly vždy pod těžkými. Platí zvolené období a fitko.'],
  ['Bez zlepšení', 'Sleduje jen poslední tréninky s cvikem, ne období. Cvik proto může být v obou: za 3 měsíce se zlepšil, poslední týdny stojí.'],
  ['Cvik vázaný na fitko', 'Počítá se v každém fitku zvlášť, u Všech fitek má každé fitko vlastní řádek.'],
].map(([b, p]) => `<div class="hlp"><b>${b}</b><p>${p}</p></div>`).join('')}</div></div></div>`;
(async () => {
  const b = await chromium.launch();
  const shots = [];
  for (const [name, html] of Object.entries(PAGES)) for (const th of ['light', 'dark']) shots.push([name, html, th, 400, '']);
  shots.push(['navrh-pismo-nejvetsi', PAGES['navrh-naposledy'], 'dark', 360, 'xl']);
  shots.push(['navrh-napoveda', PAGES['navrh-naposledy'], 'light', 400, '', true]);
  shots.push(['navrh-napoveda', PAGES['navrh-naposledy'], 'dark', 400, '', true]);
  for (const [name, html, th, w, fsz, sheet] of shots) {
    const ctx = await b.newContext({ viewport: { width: w, height: 860 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log('ERR', e.message));
    await p.goto('http://localhost:8765/');
    await p.waitForTimeout(800);
    await p.evaluate(([html, th, fsz, css, sheet]) => {
      document.documentElement.setAttribute('data-theme', th);
      if (fsz) document.documentElement.setAttribute('data-fs', fsz);
      const st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
      // appka už nepřekreslí (náhled)
      const app = document.getElementById('app');
      const clone = app.cloneNode(false);
      app.replaceWith(clone);
      clone.innerHTML = html;
      if (sheet) document.getElementById('sheetRoot').innerHTML = sheet;
    }, [html, th, fsz, CSS, sheet ? HELP_SHEET : '']);
    await p.waitForTimeout(300);
    const file = `${OUT}/${name}${name.includes('pismo') ? '' : '-' + (th === 'light' ? 'svetly' : 'tmavy')}.png`;
    await p.screenshot({ path: file, fullPage: !sheet });
    console.log(file);
    await ctx.close();
  }
  await b.close();
})();
