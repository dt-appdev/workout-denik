(function () {
  "use strict";
  /* ---------- konstanty (partie, vybavení, druhy sérií, měsíce, ikony) ---------- */
  const MUSCLES = {
    chest: "Hrudník",
    back: "Záda",
    shoulders: "Ramena",
    biceps: "Biceps",
    triceps: "Triceps",
    forearms: "Předloktí",
    quads: "Kvadricepsy",
    hams: "Hamstringy",
    glutes: "Hýždě",
    adductors: "Přitahovače",
    calves: "Lýtka",
    abs: "Břicho",
    lowback: "Spodní záda",
    neck: "Krk",
    other: "Ostatní",
  };
  const EQUIP = {
    barbell: "Velká činka",
    dumbbell: "Jednoručky",
    machine: "Stroj",
    cable: "Kladka",
    smith: "Multipress",
    bodyweight: "Vlastní váha",
    band: "Guma",
    kettlebell: "Kettlebell",
    other: "Jiné",
  };
  const GYMDEP_EQUIP = { machine: 1, cable: 1, smith: 1 };
  const GYM_COLORS = 12; // počet barev fitek (--s1 … --s12 v css/app.css, F3-01)
  const TYPES = ["n", "w", "d", "f"]; // cycle order
  const TYPE_NAME = { n: "Pracovní", w: "Zahřívací", d: "Drop set", f: "Do selhání" };
  // procenta u tlačítka zahřívací série v krokovači (F1-08): výchozí, rozsah a krok posuvníku v Nastavení
  const WARM_PCT = { def: 60, min: 10, max: 90, step: 10 };
  const MONTHS = ["led", "úno", "bře", "dub", "kvě", "čvn", "čvc", "srp", "zář", "říj", "lis", "pro"];
  const MONTHS_FULL = [
    "leden",
    "únor",
    "březen",
    "duben",
    "květen",
    "červen",
    "červenec",
    "srpen",
    "září",
    "říjen",
    "listopad",
    "prosinec",
  ];
  const DAY = 86400000;
  const IC = {
    train: `<svg viewBox="0 0 24 24">
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>
    </svg>`,
    hist: '<svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10"/></svg>',
    ex: `<svg viewBox="0 0 24 24">
      <path
          d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5v13"/>
    </svg>`,
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    body: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="2.2"/>
      <path d="M5 9h14M12 9v6M12 15l-3.5 6M12 15l3.5 6"/>
    </svg>`,
    set: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path
          d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
    </svg>`,
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    more: `<svg viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.2"/>
      <circle cx="12" cy="12" r="1.2"/>
      <circle cx="19" cy="12" r="1.2"/>
    </svg>`,
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    // úchyt pro přetažení a změna pořadí (F2-07)
    grip: `<svg viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.1"/>
      <circle cx="15" cy="6" r="1.1"/>
      <circle cx="9" cy="12" r="1.1"/>
      <circle cx="15" cy="12" r="1.1"/>
      <circle cx="9" cy="18" r="1.1"/>
      <circle cx="15" cy="18" r="1.1"/>
    </svg>`,
    order: `<svg viewBox="0 0 24 24">
      <path d="M8 4v16M4.5 7.5L8 4l3.5 3.5M16 20V4M12.5 16.5L16 20l3.5-3.5"/>
    </svg>`,
    // hledání v online databázi cviků (zeměkoule, lupa patří hledání v seznamu)
    globe: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5"/>
      <path d="M3.5 12h17M12 3.5c2.4 2.5 3.6 5.3 3.6 8.5s-1.2 6-3.6 8.5c-2.4-2.5-3.6-5.3-3.6-8.5s1.2-6 3.6-8.5z"/>
    </svg>`,
    next: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    // skupiny Nastavení (F3-09)
    gym: `<svg viewBox="0 0 24 24">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/>
      <circle cx="12" cy="10" r="2.3"/>
    </svg>`,
    medal: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="15" r="5"/>
      <path d="M8.5 3l2.2 7.3M15.5 3l-2.2 7.3"/>
    </svg>`,
    theme: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8"/>
      <path class="fill" d="M12 4a8 8 0 010 16z"/>
    </svg>`,
    backup: '<svg viewBox="0 0 24 24"><path d="M12 3v11M7.5 9.5L12 14l4.5-4.5M4 17v3h16v-3"/></svg>',
    info: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 11v6M12 7.5v.5"/>
    </svg>`,
  };

  /* ---------- svalová mapa ----------
     Anatomické SVG: Ryan Graves, CC BY 4.0 (balíček flutter-body-atlas).
     Každá svalová vrstva bere barvu z proměnné --f-<klíč>, takže se obarvuje
     nastavením stylu na obalu, ne přestavbou SVG. */
  /* ATLAS (anatomické SVG) je v js/atlas.js */
  const MUSCLE_MAP = (function () {
    const NAMES = {
      neck: "Krk",
      chest: "Hrudník",
      delts: "Ramena",
      traps: "Trapézy",
      upperback: "Horní záda",
      lats: "Široký sval zádový",
      lowback: "Spodní záda",
      biceps: "Biceps",
      triceps: "Triceps",
      forearm: "Předloktí",
      abs: "Přímý sval břišní",
      oblique: "Šikmé svaly",
      glutes: "Hýždě",
      quads: "Kvadricepsy",
      adductor: "Přitahovače",
      hams: "Hamstringy",
      calves: "Lýtka",
    };
    const KEYS = Object.keys(NAMES);
    function svg(view, fillOf, label) {
      // ramena jsou jedna partie, v atlasu ale tři vrstvy (přední, boční, zadní)
      const st = KEYS.map((k) => {
        const f = fillOf(k);
        return (k === "delts" ? ["delt_f", "delt_s", "delt_r"] : [k])
          .map((v) => "--f-" + v + ":" + f)
          .join(";");
      }).join(";");
      return `<div class="fig" style="${st}">${ATLAS[view].replace("__L__", esc(label || ""))}</div>`;
    }
    function exSvg(view, pri, sec, label) {
      return svg(
        view,
        (k) =>
          pri.indexOf(k) >= 0 ? "var(--m-pri)" : sec.indexOf(k) >= 0 ? "var(--m-sec)" : "var(--m-idle)",
        label,
      );
    }
    return { svg, exSvg, NAMES };
  })();
  const MKEYS = Object.keys(MUSCLE_MAP.NAMES);
  /* 6 skupin partií (F3-01, použije i radar F3-04): barva --g-<skupina> v css/app.css */
  const MGRP = { chest: "Hrudník", back: "Záda", sh: "Ramena", arms: "Paže", legs: "Nohy", core: "Břicho" };
  const MGRP_OF = {
    neck: "back",
    chest: "chest",
    delts: "sh",
    traps: "back",
    upperback: "back",
    lats: "back",
    lowback: "back",
    biceps: "arms",
    triceps: "arms",
    forearm: "arms",
    abs: "core",
    oblique: "core",
    glutes: "legs",
    quads: "legs",
    adductor: "legs",
    hams: "legs",
    calves: "legs",
  };
  const mgCol = (k) => "var(--g-" + (MGRP_OF[k] || "back") + ")";
  const GROUP_OF = {
    neck: "neck",
    chest: "chest",
    delts: "shoulders",
    traps: "back",
    upperback: "back",
    lats: "back",
    lowback: "lowback",
    biceps: "biceps",
    triceps: "triceps",
    forearm: "forearms",
    abs: "abs",
    oblique: "abs",
    glutes: "glutes",
    quads: "quads",
    adductor: "adductors",
    hams: "hams",
    calves: "calves",
  };
  /* Databáze cviků = výchozí EX_DB (js/cviky.js) + odchylky uložené v config/exercises.
     V config/exercises je {v:2, items:{id: jen změněná pole | celý vlastní cvik}}.
     Starší data (bez v:2) obsahují celé kopie cviků; při načtení se z nich nechá jen to,
     co se liší od výchozí databáze. Původní partie (EX_DB_OLD) se nahradí novými,
     ručně změněné partie zůstanou.
     partial = položky už jsou jen odchylky (načtené z config/exercises v:2), jinak celé cviky. */
  const EX_V = 2,
    DELT = { delt_f: "delts", delt_s: "delts", delt_r: "delts" };
  const mNorm = (a) =>
    Array.isArray(a) ? a.map((k) => DELT[k] || k).filter((k, i, x) => x.indexOf(k) === i) : [];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  /* ---------- odkaz u cviku (F0-09) ----------
     Jen adresa http(s) s doménou, nejvýš URL_MAX znaků. Adrese bez schématu („youtube.com/…“) se doplní
     https://. Jiný odkaz (skript, intent://, adresa uvnitř appky…) se neuloží ani neotevře. */
  const URL_MAX = 500;
  // jednotná podoba odkazu: bez mezer okolo, adresa bez schématu dostane https://
  function urlNormalize(value) {
    const text = String(value || "").trim();
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(text);
    const looksLikeHost = /^[^\s/?#]+\.[^\s/?#]+([/?#]|$)/.test(text);
    if (text && !hasScheme && looksLikeHost) {
      return "https://" + text;
    }
    return text;
  }
  // co je na odkazu špatně (text do hlášky), "" = v pořádku; prázdný odkaz je povolený
  function urlProblem(value) {
    const text = urlNormalize(value);
    if (!text) return "";
    if (text.length > URL_MAX) return "Odkaz může mít nejvýš " + URL_MAX + " znaků";
    let url = null;
    try {
      url = new URL(text);
    } catch (e) {}
    if (!url || !/^https?:$/.test(url.protocol) || !url.hostname.includes(".") || /\s/.test(text)) {
      return "Odkaz musí začínat https:// (nebo http://)";
    }
    return "";
  }
  // zvýraznit neplatný odkaz v poli a napsat pod něj, co je špatně (zůstane, dokud se neopraví);
  // bez hlášky nahoře a bez klávesnice, ta by ji na telefonu odsunula mimo obrazovku
  function urlMark(input) {
    const msg = urlProblem(input.value);
    input.classList.toggle("bad", !!msg);
    const msgEl = document.getElementById(input.id + "-msg");
    if (msgEl) {
      msgEl.textContent = msg;
    }
    return msg;
  }
  // odkaz, který jde bezpečně otevřít, jinak ""
  const urlSafe = (value) => (urlProblem(value) ? "" : urlNormalize(value));
  // odkazy u cviků ze zálohy: jednotná podoba, neplatný se zahodí (výchozí cvik dostane zpět svůj z EX_DB)
  function exUrlsClean(items) {
    for (const id in items) {
      const item = items[id];
      if (!item || typeof item !== "object" || !("url" in item)) continue;
      if (!urlProblem(item.url)) {
        item.url = urlNormalize(item.url);
      } else if (EX_DB[id] && EX_DB[id].url) {
        item.url = EX_DB[id].url;
      } else {
        delete item.url;
      }
    }
    return items;
  }

  function exPack(items, legacy, partial) {
    const out = {};
    for (const id in items || {}) {
      const it = items[id],
        b = EX_DB[id];
      if (!it || typeof it !== "object") continue;
      if (!b) {
        const o = Object.assign({}, it);
        if (o.pri) {
          o.pri = mNorm(o.pri);
        }
        if (o.sec) {
          o.sec = mNorm(o.sec);
        }
        out[id] = o;
        continue;
      }
      const o = {},
        old = legacy && EX_DB_OLD[id],
        oldMus = old && same(it.pri, old[0]) && same(it.sec, old[1]);
      for (const k in it) {
        if (k === "muscle" || k === "custom") continue;
        if ((k === "pri" || k === "sec") && oldMus) continue;
        const v = k === "pri" || k === "sec" ? mNorm(it[k]) : it[k];
        if (!v && !b[k]) continue;
        if (!same(v, b[k])) {
          o[k] = v;
        }
      }
      // smazaný text (český název, popis, odkaz) u výchozího cviku se uloží jako prázdný
      if (!partial) {
        for (const k of ["cz", "desc", "url"]) {
          if (b[k] && !(k in it)) {
            o[k] = "";
          }
        }
      }
      if (Object.keys(o).length) {
        out[id] = o;
      }
    }
    return out;
  }
  function exMerge(packed) {
    const out = {};
    for (const id in EX_DB) {
      const o = Object.assign({}, EX_DB[id], packed[id]);
      o.muscle = GROUP_OF[(o.pri || [])[0]] || "other";
      out[id] = o;
    }
    for (const id in packed) {
      if (!EX_DB[id]) {
        out[id] = Object.assign({}, packed[id]);
      }
    }
    for (const id in out) {
      const o = out[id];
      if (o.pri && o.sec) {
        o.sec = o.sec.filter((k) => !o.pri.includes(k));
      }
    }
    return out;
  }
  const exLoad = (items, legacy, partial) => exMerge(exPack(items, legacy, partial));
  function putEx(items) {
    put("config/exercises", { v: EX_V, items: exPack(items, false) });
  }
  const exChanged = (id) => !!(EX_DB[id] && exPack({ [id]: S.exLib[id] }, false)[id]);
  const exOf = (id) => S.exLib[id] || { name: id };
  const exGroup = (e) => (e.pri && e.pri.length ? GROUP_OF[e.pri[0]] : e.muscle) || "other";
  const exPri = (e) =>
    e.pri && e.pri.length
      ? e.pri
      : e.muscle
        ? Object.keys(GROUP_OF)
            .filter((k) => GROUP_OF[k] === e.muscle)
            .slice(0, 1)
        : [];
  const exLink = (e) =>
    urlSafe(e.url) ||
    "https://www.youtube.com/results?search_query=" + encodeURIComponent(e.name + " exercise form");
  // popisek odkazu u cviku podle toho, kam vede
  function exLinkLabel(e) {
    const url = urlSafe(e.url);
    if (!url) return "Hledat video ↗";
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (/(^|\.)hevyapp\.com$/.test(host)) return "Otevřít na Hevy ↗";
    if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return "Video na YouTube ↗";
    return "Otevřít odkaz ↗";
  }
  // hledání bez ohledu na velikost písmen a diakritiku („tlak" najde „Tlak", „stehna" i „stehná")
  const fold = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const exMatch = (e, q) => {
    if (!q) return true;
    q = fold(q).trim();
    return fold(e.name).includes(q) || fold(e.cz).includes(q);
  };
  const isAssisted = (id) => /assisted/.test(id);
  const isBodyweight = (id) => {
    const e = S.exLib[id];
    return !!(e && e.equip === "bodyweight");
  };
  function exFigures(e, small) {
    const pri = exPri(e),
      sec = e.sec || [];
    return `<div class="figs${small ? " sm" : ""}">
      <figure>${MUSCLE_MAP.exSvg("front", pri, sec, "Zepředu")}<figcaption>Zepředu</figcaption></figure>
      <figure>${MUSCLE_MAP.exSvg("back", pri, sec, "Zezadu")}<figcaption>Zezadu</figcaption></figure>
    </div>`;
  }
  // postava zepředu a zezadu obarvená podle hodnot partií (m: {partie: počet}), sytější = víc;
  // grp = barva podle skupiny partie (F3-01), jinak červená
  function musFigs(m, small, grp) {
    const mx = Math.max(0, ...Object.values(m)) || 1;
    const heat = (k) => {
      const v = m[k] || 0;
      if (!v) return "var(--m-idle)";
      const a = grp ? 0.4 + (0.6 * v) / mx : 0.25 + (0.75 * v) / mx;
      return (
        "color-mix(in srgb, " +
        (grp ? mgCol(k) : "var(--m-pri)") +
        " " +
        Math.round(a * 100) +
        "%, var(--m-idle))"
      );
    };
    return `<div class="figs${small ? " sm" : ""}">
      <figure>${MUSCLE_MAP.svg("front", heat, "Zepředu")}<figcaption>Zepředu</figcaption></figure>
      <figure>${MUSCLE_MAP.svg("back", heat, "Zezadu")}<figcaption>Zezadu</figcaption></figure>
    </div>`;
  }
  // pruh s poměrem skupin partií a legenda v procentech (F3-01)
  function mgStack(m) {
    const g = {};
    for (const k in m) {
      const x = MGRP_OF[k];
      if (x) {
        g[x] = (g[x] || 0) + m[k];
      }
    }
    const tot = Object.values(g).reduce((a, b) => a + b, 0);
    if (!tot) return "";
    const rows = Object.keys(MGRP)
      .filter((x) => g[x])
      .sort((a, b) => g[b] - g[a]);
    return `<div class="gstack" aria-hidden="true">
      ${rows.map((x) => `<i style="flex:${g[x]};background:var(--g-${x})"></i>`).join("")}
    </div>
    <div class="glegend">
      ${rows
        .map(
          (x) =>
            `<span><i style="background:var(--g-${x})"></i>${MGRP[x]} ` +
            `<b>${Math.round((g[x] / tot) * 100)} ` +
            `%</b></span>`,
        )
        .join("")}
    </div>`;
  }
  function exTags(e) {
    const pri = exPri(e),
      sec = e.sec || [];
    return (
      `<div class="mus">
      ${pri.map((k) => `<span class="tag p">${esc(MUSCLE_MAP.NAMES[k] || k)}</span>`).join("")}` +
      `${sec.map((k) => `<span class="tag s">${esc(MUSCLE_MAP.NAMES[k] || k)}</span>`).join("")}
    </div>`
    );
  }

  /* =====================================================================
     DATOVÁ VRSTVA
     Aplikace mluví jen se Store. Store drží frontu zápisů, lokální cache
     a rozdělaný trénink; samotné úložiště je vyměnitelný "backend".
     Backend má rozhraní:
       name
       open()                      -> Promise<boolean>   (true = připojeno)
       watch(onDoc, onReady, onErr) -> posílá onDoc(path, data|null)
       set(path, data)             -> Promise
       del(path)                   -> Promise
       get(path)                   -> Promise<data|null>
     Dnes: IndexedDbBackend (IndexedDB v prohlížeči, data jen v telefonu).
     Do verze 9 to byl ClaudeDbBackend (databáze Claude artefaktu),
     viz puvodni/workout-denik.html. Cesty dokumentů zůstávají stejné:
       config/main, config/exercises, config/templates, config/backup,
       workouts/RRRR-MM, body/all, state/active
     Fotky u cviků (F2-05) jdou mimo Store rovnou do IndexedDB (úložiště photos).
     ===================================================================== */
  /* Verze a kanál appky (F0-04). BUILD doplní při nasazení GitHub Actions do js/verze.js.
     Testovací verze PR běží na adrese …/workout-denik-test/pr-12/ a má VLASTNÍ data: jiný prefix
     v localStorage a jinou databázi IndexedDB. Vydaná verze se jí tak nedotkne.
     Proto data ukládat vždy jen přes Local / Idb / Store, nikdy přímo. */
  const BUILD = Object.assign(
    { kanal: "lokal", pr: 0, nazev: "", vetev: "", commit: "", cas: "" },
    window.APP_BUILD || {},
  );
  const TEST_PR = (location.pathname.match(/\/pr-(\d+)\//) || [])[1] || "";
  const MAIN_P = "zd1:",
    MAIN_DB = "workout-denik";
  const FILE_P = "workout-denik" + (TEST_PR ? "-test-pr" + TEST_PR : ""); // začátek názvu staženého souboru
  const Local = {
    // drobnosti v zařízení (cache, fronta, nastavení zobrazení)
    P: TEST_PR ? "zd1-pr" + TEST_PR + ":" : MAIN_P,
    get(k, d) {
      try {
        const v = localStorage.getItem(this.P + k);
        return v ? JSON.parse(v) : d;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        if (v === undefined || v === null) {
          localStorage.removeItem(this.P + k);
        } else {
          localStorage.setItem(this.P + k, JSON.stringify(v));
        }
      } catch (e) {}
    },
  };
  const lsGet = (k, d) => Local.get(k, d),
    lsSet = (k, v) => Local.set(k, v);

  /* IndexedDB "workout-denik" (testovací verze PR 12: "workout-denik-pr12"):
       docs   – dokumenty appky, klíč = cesta ("config/main", "workouts/2026-09", …)
       points – body obnovy, klíč = id, hodnota {id, at, data (JSON text zálohy)}
       photos – fotky u cviků (F2-05, od verze databáze 2), klíč = id, viz sekce „FOTKY U CVIKU“ */
  const Idb = {
    NAME: TEST_PR ? MAIN_DB + "-pr" + TEST_PR : MAIN_DB,
    VER: 2,
    db: null,
    // otevře databázi (poprvé ji založí, starší verzi doplní chybějící úložiště); otevřenou drží v this.db
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        let rq;
        try {
          rq = indexedDB.open(this.NAME, this.VER);
        } catch (e) {
          rej(e);
          return;
        }
        rq.onupgradeneeded = () => {
          const db = rq.result;
          if (!db.objectStoreNames.contains("docs")) {
            db.createObjectStore("docs");
          }
          if (!db.objectStoreNames.contains("points")) {
            db.createObjectStore("points");
          }
          if (!db.objectStoreNames.contains("photos")) {
            db.createObjectStore("photos");
          }
        };
        rq.onsuccess = () => {
          this.db = rq.result;
          this.db.onversionchange = () => {
            this.db.close();
            this.db = null;
          };
          res(this.db);
        };
        rq.onerror = () => rej(rq.error);
        rq.onblocked = () => rej(new Error("blocked"));
      });
    },
    // jedna operace nad jedním úložištěm; výsledek až po dokončení transakce (zápis je na disku)
    async run(store, mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction(store, mode),
          rq = fn(tx.objectStore(store));
        tx.oncomplete = () => res(rq ? rq.result : undefined);
        tx.onerror = () => rej(Idb.err(tx.error));
        tx.onabort = () => rej(Idb.err(tx.error));
      });
    },
    // chyba IndexedDB → chyba appky (plné úložiště dostane kód quota_exceeded)
    err(e) {
      if (e && e.name === "QuotaExceededError") {
        const x = new Error("Úložiště v telefonu je plné.");
        x.code = "quota_exceeded";
        return x;
      }
      return e || new Error("IndexedDB");
    },
    get(store, key) {
      return this.run(store, "readonly", (s) => s.get(key));
    },
    put(store, key, val) {
      return this.run(store, "readwrite", (s) => s.put(val, key));
    },
    del(store, key) {
      return this.run(store, "readwrite", (s) => s.delete(key));
    },
    async all(store) {
      return idbAll(await this.open(), store);
    },
  };
  // všechny položky úložiště jako [[klíč, hodnota], …]
  function idbAll(db, store) {
    return new Promise((res, rej) => {
      if (!db.objectStoreNames.contains(store)) {
        res([]);
        return;
      }
      const out = [],
        tx = db.transaction(store, "readonly"),
        rq = tx.objectStore(store).openCursor();
      rq.onsuccess = () => {
        const c = rq.result;
        if (c) {
          out.push([c.key, c.value]);
          c.continue();
        }
      };
      tx.oncomplete = () => res(out);
      tx.onerror = () => rej(tx.error);
    });
  }
  // otevře cizí existující databázi (vydaná / testovací verze); neexistující nevytváří
  function idbOpenExisting(name) {
    return new Promise((res, rej) => {
      const rq = indexedDB.open(name);
      rq.onupgradeneeded = () => rq.transaction.abort();
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error || new Error("Databáze neexistuje."));
      rq.onblocked = () => rej(new Error("blocked"));
    });
  }

  // backend pro Store: dokumenty v úložišti docs databáze IndexedDB
  function IndexedDbBackend() {
    return {
      name: "indexeddb",
      async open() {
        if (!window.indexedDB) return false;
        try {
          await Idb.open();
          return true;
        } catch (e) {
          return false;
        }
      },
      watch(onDoc, onReady, onErr) {
        // IndexedDB je jen v tomto zařízení, nic jiného ho nemění: stačí načíst jednou při startu
        Idb.all("docs").then((rows) => {
          const months = [];
          for (const [path, data] of rows) {
            if (path.startsWith("workouts/")) {
              months.push(path.slice(9));
            }
            if (path !== "state/active") {
              onDoc(path, data);
            }
          }
          onDoc("workouts/*", { present: months });
          onReady();
        }, onErr);
      },
      set(path, data) {
        return Idb.put("docs", path, data);
      },
      del(path) {
        return Idb.del("docs", path);
      },
      async get(path) {
        const d = await Idb.get("docs", path);
        return d === undefined ? null : d;
      },
    };
  }

  /* body obnovy v IndexedDB (dřív assets artefaktu) — stejné rozhraní, jaké používal kód zálohy */
  const LocalPoints = {
    async upload(blob) {
      const data = await blob.text(),
        id = "pt" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try {
        await Idb.put("points", id, { id, at: Date.now(), data });
      } catch (e) {
        const x = new Error(e.message);
        x.code = e.code === "quota_exceeded" ? "quota_or_state" : "write_failed";
        throw x;
      }
      return { id, sizeBytes: blob.size };
    },
    delete(id) {
      return Idb.del("points", id);
    },
    async read(id) {
      const p = await Idb.get("points", id);
      if (!p) throw new Error("Bod obnovy už v telefonu není.");
      return p.data;
    },
  };

  /* stažení souboru do telefonu (dřív downloads artefaktu) — Chrome ho uloží do složky Stažené */
  const LocalDownloads = {
    async save({ filename, data }) {
      const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
  };

  /* Store: jediné místo, přes které appka čte a zapisuje data.
     Q = fronta zápisů {cesta: data | null (smazat)}, uložená v Local "queue", aby přežila zavření appky. */
  const Store = {
    backend: null,
    state: "connecting",
    Q: Local.get("queue", {}),
    flushing: false,
    onDoc: null,
    onChange: null,
    pending() {
      return Object.keys(this.Q).length;
    },
    // připojí backend, načte z něj všechny dokumenty (onDoc) a odešle frontu; false = úložiště nejde otevřít
    async init(backend, onDoc, onChange) {
      this.onDoc = onDoc;
      this.onChange = onChange;
      const ok = await backend.open();
      if (!ok) {
        this.state = "off";
        onChange();
        return false;
      }
      this.backend = backend;
      this.state = "connecting";
      onChange();
      backend.watch(
        (path, data) => {
          if (path === "workouts/*") {
            for (const mk of Object.keys(S.months)) {
              const p = "workouts/" + mk;
              if (!data.present.includes(mk) && !(p in this.Q)) {
                onDoc(p, null);
              }
            }
            return;
          }
          if (path in this.Q) return; // lokální změna ještě čeká na odeslání
          onDoc(path, data);
        },
        () => {
          this.state = "ok";
          onChange();
        },
        (e) => {
          if (e && e.code === "revoked") {
            this.state = "off";
            onChange();
          }
        },
      );
      this.flush();
      return true;
    },
    // zápis dokumentu (null = smazat): nejdřív do fronty v zařízení, pak do backendu
    put(path, data) {
      this.Q[path] = data === null ? null : JSON.parse(JSON.stringify(data));
      Local.set("queue", this.Q);
      this.onChange && this.onChange();
      this.flush();
    },
    // odešle frontu do backendu; co se zapsalo, z fronty zmizí
    async flush() {
      const b = this.backend;
      if (!b || this.flushing) return;
      this.flushing = true;
      let failed = false;
      try {
        for (const p of Object.keys(this.Q)) {
          const d = this.Q[p];
          try {
            if (d === null) {
              await b.del(p);
            } else {
              await b.set(p, d);
            }
            if (this.Q[p] === d) {
              delete this.Q[p];
            }
            Local.set("queue", this.Q);
          } catch (e) {
            if (e && (e.code === "invalid_argument" || e.code === "transform_error")) {
              delete this.Q[p];
              Local.set("queue", this.Q);
              toast("Zápis se nepodařil: " + (e.message || e.code));
            } else if (e && e.code === "quota_exceeded") {
              toast("Databáze je plná — smaž staré záznamy.");
              failed = true;
              break;
            } else {
              failed = true;
              break;
            }
          }
        }
      } finally {
        this.flushing = false;
        this.onChange && this.onChange();
      }
      // chyba spojení: zkusit za 6 s; nové změny přidané během odesílání: odeslat hned
      if (this.pending() && this.backend) {
        setTimeout(() => this.flush(), failed ? 6000 : 50);
      }
    },
    // cache celé databáze v zařízení (rychlý start, offline)
    loadCache() {
      return Local.get("cache", null);
    },
    // uloží cache se zpožděním 0,8 s (víc změn rychle po sobě = jeden zápis)
    saveCache(snap) {
      clearTimeout(this._ct);
      this._ct = setTimeout(() => Local.set("cache", snap()), 800);
    },
    // rozdělaný trénink
    loadActive() {
      return Local.get("active", null);
    },
    // rozdělaný trénink hned do Local, do databáze (state/active) se zpožděním 2,5 s
    saveActive(draft) {
      Local.set("active", draft);
      clearTimeout(this._at);
      this._at = setTimeout(() => {
        if (this.backend) {
          this.backend.set("state/active", { draft: draft ? JSON.stringify(draft) : "" }).catch(() => {});
        }
      }, 2500);
    },
    // rozdělaný trénink z databáze (když v Local chybí)
    async fetchActive() {
      if (!this.backend) return null;
      try {
        const a = await this.backend.get("state/active");
        return a && a.draft ? JSON.parse(a.draft) : null;
      } catch (e) {
        return null;
      }
    },
  };

  /* ---------- stav appky (S) a zápis dat (applyDoc, put) ---------- */
  const S = {
    cfg: {
      gyms: [],
      defaultGymId: null,
      restSec: 120,
      restSs: 180,
      restAlert: "both",
      restOver: true,
      restNotify: true,
      screenOn: false,
      screenDim: true,
      recCelEx: true,
      recCelW: true,
      recSnd: "fanfara",
      stepper: true,
      warmPct: WARM_PCT.def,
    },
    exLib: exLoad({}),
    exV: 0,
    exLegacy: null,
    templates: {},
    months: {},
    body: {},
    bk: { last: null, points: [] }, // config/backup: datum poslední zálohy do souboru + body obnovy
    photos: {}, // fotky u cviků (F2-05): popisy bez obrázku, klíč = id fotky
    photosOn: false, // úložiště fotek je dostupné (načtené z IndexedDB)
    active: Store.loadActive(),
    editDraft: null,
    route: lsGet("route", "train"),
    setPage: lsGet("setPage", ""), // otevřená podstránka Nastavení, "" = rozcestník (F3-09)
    nav: [], // kam se vrátit ze stránky cviku / úpravy (F0-06), viz navBack
    exDetail: null,
    exPart: "info",
    exlQ: "",
    exlM: lsGet("exlM", "all"),
    exlEq: lsGet("exlEq", "all"),
    exlSort: lsGet("exlSort", "last"),
    exlHid: false,
    histGym: "all",
    statsGym: "all",
    statsMetric: "count",
    statsRange: lsGet("statsRange", "30d"),
    sumPeriod: "month",
    exSearch: "",
    exMuscle: "all",
    detailMetric: "e1rm",
    detailRange: "1y",
    detailGym: "all",
    bodyMetric: "weight",
    bodyRange: "all",
    histView: lsGet("histView", "cal") === "list" ? "list" : "cal",
    calM: 0, // Historie: kalendář (výchozí) / seznam (F3-06), zobrazený měsíc kalendáře (0 = aktuální)
    selGym: null,
  };
  let downloads = null,
    pointsApi = null;

  (function loadCache() {
    const c = Store.loadCache();
    if (!c) return;
    S.cfg = cfgNorm(c.cfg || S.cfg);
    S.exLib = exLoad(c.exLib, c.exV !== EX_V);
    S.templates = tplNorm(c.templates);
    S.months = c.months || {};
    S.body = c.body || {};
    if (c.bk) {
      S.bk = c.bk;
    }
  })();
  // všechna data appky pro cache v zařízení (Store.saveCache)
  const snapshot = () => ({
    cfg: S.cfg,
    exLib: S.exLib,
    exV: EX_V,
    templates: S.templates,
    months: S.months,
    body: S.body,
    bk: S.bk,
  });
  function saveCache() {
    Store.saveCache(snapshot);
  }

  // načtený nebo změněný dokument (cesta jako "workouts/2026-09") promítne do stavu S
  function applyDoc(path, data) {
    const [col, id] = path.split("/");
    if (col === "config") {
      if (id === "main") {
        S.cfg = cfgNorm(data);
      } else if (id === "exercises") {
        const items = (data && data.items) || {};
        S.exV = (data && data.v) || 0;
        S.exLegacy = S.exV !== EX_V && Object.keys(items).length ? items : null;
        S.exLib = exLoad(items, S.exV !== EX_V, S.exV === EX_V);
      } else if (id === "templates") {
        S.templates = tplNorm(data && data.items);
      } else if (id === "backup") {
        S.bk = Object.assign({ last: null, points: [] }, data || {});
      }
    } else if (col === "workouts") {
      if (data) {
        S.months[id] = data.items || {};
      } else {
        delete S.months[id];
      }
    } else if (col === "body" && id === "all") {
      S.body = (data && data.items) || {};
    }
    dirty();
    saveCache();
  }
  // změna dat: hned do stavu S, pak přes Store do úložiště (jediný správný způsob zápisu)
  function put(path, data) {
    applyDoc(path, data);
    Store.put(path, data);
  }
  // ukazatel uložení v horní liště (Uloženo / Ukládám… / Jen v zařízení)
  function updSync() {
    const el = document.getElementById("sync");
    if (!el) return;
    const n = Store.pending(),
      st = Store.state;
    el.className = "sync" + (st === "off" ? " off" : n ? " pending" : "");
    el.innerHTML = `<i></i>
    ${st === "off" ? "Jen v zařízení" : n ? "Ukládám…" : st === "connecting" ? "Připojuji" : "Uloženo"}`;
  }
  function saveActive() {
    Store.saveActive(S.active);
  }

  /* ---------- pomocné funkce (formát čísel a dat, escapování, fitka) ---------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const uid = (p) => (p || "") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const num = (v) => {
    if (v === "" || v == null) return NaN;
    const n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : NaN;
  };
  const fmtKg = (v) => {
    if (!isFinite(v)) return "–";
    return (Math.round(v * 100) / 100).toLocaleString("cs-CZ", { maximumFractionDigits: 2 });
  };
  const fmtInt = (v) => Math.round(v).toLocaleString("cs-CZ");
  const d2 = (n) => String(n).padStart(2, "0");
  const fmtDate = (t) => {
    const d = new Date(t);
    return d.getDate() + ". " + (d.getMonth() + 1) + ". " + d.getFullYear();
  };
  const fmtDateS = (t) => {
    const d = new Date(t);
    return d.getDate() + ". " + (d.getMonth() + 1) + ".";
  };
  const fmtDay = (t) => {
    const d = new Date(t);
    return (
      ["ne", "po", "út", "st", "čt", "pá", "so"][d.getDay()] +
      " " +
      d.getDate() +
      ". " +
      (d.getMonth() + 1) +
      "."
    );
  };
  const fmtTime = (t) => {
    const d = new Date(t);
    return d.getHours() + ":" + d2(d.getMinutes());
  };
  const fmtDur = (ms) => {
    const m = Math.max(0, Math.round(ms / 60000));
    return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min";
  };
  const fmtDurS = (ms) => {
    const m = Math.max(0, Math.round(ms / 60000));
    return m >= 60 ? Math.floor(m / 60) + ":" + d2(m % 60) + " h" : m + " min";
  };
  // odpočet a délka tréninku: 5:07, od hodiny 1:07:39 (F1-11)
  const fmtClock = (s) => {
    s = Math.max(0, Math.round(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor(s / 60) % 60;
    return (h ? h + ":" + d2(m) : m) + ":" + d2(s % 60);
  };
  const monthKey = (t) => {
    const d = new Date(t);
    return d.getFullYear() + "-" + d2(d.getMonth() + 1);
  };
  const e1rm = (kg, r) => (kg > 0 && r > 0 && r <= 20 ? (r === 1 ? kg : kg * (1 + r / 30)) : 0);
  const isWork = (t) => t !== "w";
  const exName = (id) => (S.exLib[id] && S.exLib[id].name) || id;
  const gymName = (id) => {
    const g = S.cfg.gyms.find((g) => g.id === id);
    return g ? g.name : "Neznámé fitko";
  };
  const gymIdx = (id) => {
    const i = S.cfg.gyms.findIndex((g) => g.id === id);
    return i < 0 ? 0 : i;
  };
  /* barva fitka (F0-07): uložená v g.col (číslo 1–GYM_COLORS = proměnná --sN), nezávislá na pořadí */
  const gymColor = (id) => {
    const g = S.cfg.gyms.find((g) => g.id === id);
    return "var(--s" + (g && g.col ? g.col : (gymIdx(id) % GYM_COLORS) + 1) + ")";
  };
  /* doplní výchozí hodnoty nastavení; fitkům bez barvy dá barvu podle pořadí (= barva, kterou měla dřív) */
  function cfgNorm(c) {
    c = Object.assign(
      {
        gyms: [],
        defaultGymId: null,
        restSec: 120,
        restSs: 180,
        restAlert: "both",
        restOver: true,
        restNotify: true,
        screenOn: false,
        screenDim: true,
        recCelEx: true,
        recCelW: true,
        recSnd: "fanfara",
        stepper: true,
        warmPct: WARM_PCT.def,
      },
      c && typeof c === "object" ? c : {},
    );
    const pct = Math.round(+c.warmPct / WARM_PCT.step) * WARM_PCT.step;
    c.warmPct = pct >= WARM_PCT.min && pct <= WARM_PCT.max ? pct : WARM_PCT.def;
    c.gyms = (Array.isArray(c.gyms) ? c.gyms : [])
      .filter((g) => g && g.id)
      .map((g, i) =>
        g.col >= 1 && g.col <= GYM_COLORS ? g : Object.assign({}, g, { col: (i % GYM_COLORS) + 1 }),
      );
    return c;
  }
  /* barva pro nové fitko: první nepoužitá, jinak nejméně používaná */
  function freeGymCol(gyms) {
    const n = {};
    for (const g of gyms) {
      n[g.col] = (n[g.col] || 0) + 1;
    }
    let b = 1;
    for (let c = 2; c <= GYM_COLORS; c++) {
      if ((n[c] || 0) < (n[b] || 0)) {
        b = c;
      }
    }
    return b;
  }
  const toDateInput = (t) => {
    const d = new Date(t);
    return d.getFullYear() + "-" + d2(d.getMonth() + 1) + "-" + d2(d.getDate());
  };
  const toTimeInput = (t) => {
    const d = new Date(t);
    return d2(d.getHours()) + ":" + d2(d.getMinutes());
  };

  /* ---------- TYPY CVIKŮ ----------
     Určují, co se u série zapisuje a jak se počítá zátěž.
     wr     váha × opakování          zátěž = váha
     bw     vlastní váha              zátěž = tělesná hmotnost
     bwplus vlastní váha + zátěž      zátěž = hmotnost + přidané kg
     assist s dopomocí                zátěž = hmotnost − dopomoc
     time   na čas                    bez objemu, rekord nejdelší výdrž
     timew  na čas se zátěží          bez objemu, rekord nejdelší výdrž
     dist   vzdálenost a čas          rekordy vzdálenost, čas a tempo         */
  const KIND = {
    wr: { l: "Váha a opakování", f: ["kg", "reps"], ex: "Bench press, bicepsový zdvih" },
    bw: { l: "Vlastní váha", f: ["reps"], ex: "Shyby, kliky, sedy-lehy" },
    bwplus: { l: "Vlastní váha se zátěží", f: ["plus", "reps"], ex: "Shyby a kliky na bradlech se zátěží" },
    assist: { l: "S dopomocí", f: ["minus", "reps"], ex: "Shyby a kliky s dopomocí stroje" },
    time: { l: "Na čas", f: ["sec"], ex: "Plank, výdrž, vis" },
    timew: { l: "Na čas se zátěží", f: ["kg", "sec"], ex: "Plank se zátěží, farmářská chůze" },
    dist: { l: "Vzdálenost a čas", f: ["km", "sec"], ex: "Běh, veslovací trenažér" },
  };
  const KIND_ORDER = ["wr", "bw", "bwplus", "assist", "time", "timew", "dist"];
  const FLD = {
    kg: { lab: "kg", mode: "decimal" },
    plus: { lab: "+kg", mode: "decimal" },
    minus: { lab: "−kg", mode: "decimal" },
    reps: { lab: "Opak.", mode: "numeric" },
    sec: { lab: "Čas", mode: "numeric" },
    km: { lab: "km", mode: "decimal" },
  };
  const kindOf = (id) => {
    const e = S.exLib[id];
    return e && KIND[e.kind] ? e.kind : "wr";
  };
  const kFields = (k) => KIND[k].f;
  const hasReps = (k) => KIND[k].f.includes("reps");
  const isTimed = (k) => KIND[k].f.includes("sec");
  const usesKg = (k) => KIND[k].f.some((f) => f === "kg" || f === "plus" || f === "minus");
  /* tělesná hmotnost k datu: nejbližší dřívější měření, jinak hodnota z nastavení */
  function bodyWeightAt(t) {
    const xs = Object.values(S.body || {})
      .filter((b) => isFinite(+b.weight) && +b.weight > 0)
      .sort((a, b) => a.date - b.date);
    if (!xs.length) return +S.cfg.bodyWeight || 80;
    let best = xs[0];
    for (const x of xs) {
      if (x.date <= t) {
        best = x;
      } else {
        break;
      }
    }
    return +best.weight;
  }
  function setLoad(kind, s, t) {
    const kg = +s.kg || 0;
    if (kind === "wr" || kind === "timew") return kg;
    if (kind === "bw") return bodyWeightAt(t);
    if (kind === "bwplus") return bodyWeightAt(t) + kg;
    if (kind === "assist") return Math.max(0, bodyWeightAt(t) - kg);
    return 0;
  }
  const setVol = (kind, s, t) => (hasReps(kind) ? setLoad(kind, s, t) * (+s.reps || 0) : 0);
  const fmtSec = (v) => {
    v = Math.max(0, Math.round(v));
    const h = Math.floor(v / 3600);
    return h
      ? h + ":" + d2(Math.floor((v % 3600) / 60)) + ":" + d2(v % 60)
      : Math.floor(v / 60) + ":" + d2(v % 60);
  };
  const parseSec = (v) => {
    if (v == null || v === "") return NaN;
    v = String(v).trim().replace(",", ":");
    if (/^\d+$/.test(v)) return +v;
    const p = v.split(":").map((x) => +x);
    if (p.some((x) => !isFinite(x))) return NaN;
    return p.length >= 3 ? p[0] * 3600 + p[1] * 60 + (p[2] || 0) : p[0] * 60 + (p[1] || 0);
  };
  const fmtPace = (sec, km) => (km > 0 ? fmtSec(sec / km) + " /km" : "–");
  /* zápis jedné série textem */
  function setStr(kind, s) {
    if (kind === "time") return fmtSec(s.sec || 0);
    if (kind === "timew") return (s.kg ? fmtKg(s.kg) + " kg · " : "") + fmtSec(s.sec || 0);
    if (kind === "dist") return (s.km ? fmtKg(s.km) + " km · " : "") + fmtSec(s.sec || 0);
    if (kind === "bw") return (s.reps || 0) + "×";
    if (kind === "bwplus") return (s.kg ? "+" + fmtKg(s.kg) + " × " : "") + (s.reps || 0);
    if (kind === "assist") return (s.kg ? "−" + fmtKg(s.kg) + " × " : "") + (s.reps || 0);
    return (s.kg ? fmtKg(s.kg) + "×" : "") + (s.reps || 0);
  }

  /* ---------- KONTROLA ČÍSEL (F1-10) ----------
     Číselné políčko má atribut data-num="<pravidlo z NUM_RULES>". Nepovolený znak se do něj vůbec
     nedostane (numFilter), hodnota, která i tak nedává smysl (moc desetinných míst, nad limitem, 1:75),
     dostane červený rámeček (třída bad) a uložit ji nejde (numCheck). Prázdné políčko je v pořádku,
     povinné hodnoty (opakování, čas, km u odškrtnuté série) hlídá setProblem.
     Pravidla:  dec = počet desetinných míst (0 = jen celé číslo), min/max = rozsah,
                unit = jednotka do nápovědy,
                time = čas (45, 1:30, 1:02:30; čárka a tečka se při psaní mění na dvojtečku). */
  const NUM_RULES = {
    kg: { lab: "Váha", dec: 2, max: 999, unit: "kg" },
    reps: { lab: "Opakování", dec: 0, max: 999 },
    sec: { lab: "Čas", time: true, max: 86399 },
    km: { lab: "Vzdálenost", dec: 2, max: 999, unit: "km" },
    min: { lab: "Délka", dec: 0, max: 1439, unit: "min" },
    body: { lab: "Hodnota", dec: 2, max: 999 },
    pct: { lab: "Hodnota", dec: 2, max: 100, unit: "%" },
    kcal: { lab: "Hodnota", dec: 2, max: 9999 },
    bw: { lab: "Tělesná hmotnost", dec: 2, min: 20, max: 300, unit: "kg" },
  };
  // pravidlo pro pole série (kg, +kg a −kg se ukládají do s.kg)
  const setRule = (f) => (f === "plus" || f === "minus" ? "kg" : f);
  // uložené číslo jako text do políčka: nejvýš 2 desetinná místa (starší data z Hevy mohou mít víc), čárka
  function numStr(v) {
    const n = +String(v).replace(",", ".");
    if (!isFinite(n)) return String(v);
    return String(Math.round(n * 100) / 100).replace(".", ",");
  }
  // nechá jen povolené znaky: číslice, u desetinných čísel jednu čárku/tečku, u času nejvýš 2 dvojtečky;
  // čárka nebo dvojtečka na začátku dostane před sebe nulu („,5“ → „0,5“)
  function numFilter(rule, text) {
    const r = NUM_RULES[rule];
    let out = "";
    let seps = 0;
    for (const ch of String(text)) {
      if (ch >= "0" && ch <= "9") {
        out += ch;
        continue;
      }
      const isSep = ch === ":" || ch === "," || ch === ".";
      const zero = out === "" ? "0" : "";
      if (r.time && isSep && seps < 2) {
        out += zero + ":";
        seps++;
      } else if (!r.time && r.dec > 0 && ch !== ":" && isSep && seps === 0) {
        out += zero + ch;
        seps++;
      }
    }
    return out;
  }
  // vejde se text do políčka? Nejvýš tolik číslic před čárkou, kolik má
  // hranice (999 → 3), a dec desetinných míst;
  // u času nejvýš 5 číslic na začátku a 2 za každou dvojtečkou
  function numFits(rule, text) {
    const r = NUM_RULES[rule];
    if (r.time) {
      const parts = text.split(":");
      return parts[0].length <= 5 && parts.slice(1).every((p) => p.length <= 2);
    }
    const [whole, decimals = ""] = text.split(/[.,]/);
    return whole.length <= String(r.max).length && decimals.length <= r.dec;
  }
  // jednotná podoba po opuštění políčka a při ✓: čas „85“ → „1:25“, „1:5“ → „1:05“; číslo „5,“ → „5“,
  // „082“ → „82“, „82.5“ → „82,5“. Prázdnou nebo neplatnou hodnotu nechá, jak je.
  function numNormalize(rule, value) {
    const text = String(value == null ? "" : value).trim();
    const res = numCheck(rule, text);
    if (text === "" || !res.ok) return text;
    if (NUM_RULES[rule].time) return fmtSec(res.v);
    return String(res.v).replace(".", ",");
  }
  // je hodnota platná? {ok, v: číslo (NaN u prázdné), msg: co je špatně}
  function numCheck(rule, value) {
    const r = NUM_RULES[rule];
    const text = String(value == null ? "" : value).trim();
    if (text === "") return { ok: true, v: NaN };
    if (r.time) return timeCheck(r, text);
    if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(text)) {
      return { ok: false, msg: r.dec ? "zapiš číslo, např. 82,5" : "zapiš celé číslo" };
    }
    const decimals = (text.split(/[.,]/)[1] || "").length;
    if (decimals > r.dec) {
      return { ok: false, msg: r.dec ? "nejvýš " + r.dec + " desetinná místa" : "jen celé číslo" };
    }
    const v = num(text);
    const unit = r.unit ? " " + r.unit : "";
    if (v > r.max) return { ok: false, msg: "nejvýš " + fmtInt(r.max) + unit };
    if (r.min && v < r.min) return { ok: false, msg: "aspoň " + fmtInt(r.min) + unit };
    return { ok: true, v };
  }
  function timeCheck(r, text) {
    text = text.replace(/[.,]/g, ":");
    // „1:“ během psaní ještě není chyba (= 1:00)
    if (!/^\d+(:\d{0,2}){0,2}$/.test(text)) return { ok: false, msg: "zapiš jako 45, 1:30 nebo 1:02:30" };
    if (
      text
        .split(":")
        .slice(1)
        .some((p) => +p > 59)
    ) {
      return { ok: false, msg: "minuty a sekundy nejvýš 59" };
    }
    const v = parseSec(text);
    if (v > r.max) return { ok: false, msg: "nejvýš 23:59:59" };
    return { ok: true, v };
  }
  // třída pro vykreslení políčka: " bad", když uložená hodnota neprojde kontrolou
  const numCls = (rule, value) => (numCheck(rule, value).ok ? "" : " bad");
  // při psaní: vyhodí nepovolené znaky a číslici navíc (3. desetinné místo, 4. číslice u 999) vůbec nepřijme,
  // kurzor zůstane na místě; obnoví červený rámeček. input.numLast = poslední přijatá hodnota.
  function numInput(input) {
    const rule = input.dataset.num;
    const text = input.value;
    const last = input.numLast != null ? input.numLast : input.defaultValue;
    let clean = numFilter(rule, text);
    const caret = input.selectionStart == null ? text.length : input.selectionStart;
    let pos = numFilter(rule, text.slice(0, caret)).length;
    if (!numFits(rule, clean) && numFits(rule, last)) {
      pos = Math.max(0, pos - (clean.length - last.length));
      clean = last;
    }
    input.numLast = clean;
    if (clean !== text) {
      input.value = clean;
      try {
        input.setSelectionRange(pos, pos);
      } catch (e) {}
    }
    input.classList.toggle("bad", !numCheck(rule, clean).ok);
  }
  // krátká nápověda k políčku s červeným rámečkem (po opuštění políčka a při ukládání)
  function numMsg(input) {
    const rule = input.dataset.num;
    const res = numCheck(rule, input.value);
    if (res.ok) return "";
    return (input.dataset.lab || NUM_RULES[rule].lab) + ": " + res.msg;
  }
  // první problém v sérii: neplatná hodnota, u odškrtávané série (required) i chybějící povinná hodnota
  function setProblem(kind, s, required) {
    for (const f of kFields(kind)) {
      const rule = setRule(f);
      const res = numCheck(rule, s[rule]);
      if (!res.ok) {
        return { f, msg: "Oprav zvýrazněnou hodnotu. " + NUM_RULES[rule].lab + ": " + res.msg + "." };
      }
    }
    if (!required) return null;
    if (hasReps(kind) && !(num(s.reps) > 0)) return { f: "reps", msg: "Zadej počet opakování." };
    if (isTimed(kind) && !(parseSec(s.sec) > 0)) return { f: "sec", msg: "Zadej čas (např. 45 nebo 1:30)." };
    if (kind === "dist" && !(num(s.km) > 0)) return { f: "km", msg: "Zadej vzdálenost." };
    return null;
  }
  // první problém v tréninku nebo šabloně: {e, j, f, msg}; onlyDone =
  // jen odškrtnuté série (i povinné hodnoty)
  function draftProblem(d, onlyDone) {
    for (const e of d.ex) {
      const kind = kindOf(e.exId);
      for (let j = 0; j < e.sets.length; j++) {
        const s = e.sets[j];
        if (onlyDone && !s.done) continue;
        const problem = setProblem(kind, s, onlyDone);
        if (problem) return Object.assign({ e, j }, problem);
      }
    }
    return null;
  }
  // ukáže problém a skočí do políčka série (po vykreslení, render drží fokus podle id)
  function showProblem(e, j, problem) {
    toast(problem.msg);
    focusInput("in-" + e.k + "-" + j + "-" + problem.f);
  }
  // políčko s červeným rámečkem v panelu nebo formuláři: ukáže nápovědu, skočí do něj a vrátí true
  function inputProblem(id) {
    const input = document.getElementById(id);
    if (!input || !input.dataset.num) return false;
    const msg = numMsg(input);
    if (!msg) return false;
    toast("Oprav zvýrazněnou hodnotu. " + msg + ".");
    focusInput(id);
    return true;
  }
  function focusInput(id) {
    setTimeout(() => {
      const input = document.getElementById(id);
      if (!input) return;
      if (input.dataset.act === "kk") {
        // políčko série s krokovačem (F1-03): místo klávesnice panel s +/−
        sheetStepper(+input.dataset.i, +input.dataset.j, input.dataset.v);
        return;
      }
      input.scrollIntoView({ block: "center" });
      input.focus();
    }, 80);
  }

  /* ---------- odvozená data: seznam tréninků a souhrny po cvicích (derive) ---------- */
  let D = null; // výsledek derive(), null = spočítat znovu
  // data se změnila: zahodit odvozená data a překreslit
  function dirty() {
    D = null;
    scheduleRender();
  }
  /* všechny tréninky od nejnovějšího (all) a pro každý cvik jeho výskyty s hodnotami (byEx);
     počítá se jen jednou po každé změně dat */
  function derive() {
    if (D) return D;
    const all = [];
    for (const mk in S.months) {
      const items = S.months[mk];
      for (const id in items) {
        all.push(Object.assign({ id, mk }, items[id]));
      }
    }
    all.sort((a, b) => b.start - a.start);
    const byEx = {};
    for (const w of all) {
      for (const e of w.ex || []) {
        const kind = kindOf(e.exId);
        let vol = 0,
          maxKg = 0,
          best = 0,
          bestSet = null,
          maxReps = 0,
          nWork = 0,
          maxSec = 0,
          totSec = 0,
          maxKm = 0,
          totKm = 0,
          speed = 0;
        for (const s of e.sets) {
          if (!isWork(s.t)) continue;
          nWork++;
          if (hasReps(kind)) {
            const L = setLoad(kind, s, w.start),
              reps = +s.reps || 0;
            vol += L * reps;
            if (L > maxKg) {
              maxKg = L;
            }
            if (reps > maxReps) {
              maxReps = reps;
            }
            const r = e1rm(L, reps);
            if (r > best) {
              best = r;
              bestSet = Object.assign({}, s, { load: L });
            }
          }
          if (isTimed(kind)) {
            const sec = +s.sec || 0;
            totSec += sec;
            if (sec > maxSec) {
              maxSec = sec;
            }
          }
          if (kind === "dist") {
            const km = +s.km || 0,
              sec = +s.sec || 0;
            totKm += km;
            if (km > maxKm) {
              maxKm = km;
            }
            const v = sec > 0 ? km / (sec / 3600) : 0;
            if (v > speed) {
              speed = v;
            }
          }
        }
        (byEx[e.exId] = byEx[e.exId] || []).push({
          w,
          e,
          kind,
          vol,
          maxKg,
          best,
          bestSet,
          maxReps,
          nWork,
          maxSec,
          totSec,
          maxKm,
          totKm,
          speed,
        });
      }
    }
    D = { all, byEx };
    return D;
  }
  // fitko, ve kterém se cvik porovnává: u cviku vázaného na fitko gymId, jinak null (všechna fitka)
  function exCtxGym(exId, gymId) {
    const ex = S.exLib[exId];
    return ex && ex.gymDep ? gymId : null;
  }
  // poslední trénink s cvikem (vázaný na fitko: jen v tomto fitku; anyGym = v kterémkoli), před časem before
  function lastSession(exId, gymId, excludeId, before, anyGym) {
    const list = derive().byEx[exId] || [];
    const g = anyGym ? null : exCtxGym(exId, gymId);
    for (const s of list) {
      if (s.w.id === excludeId || s.w.start >= (before || Infinity)) continue;
      if (g && s.w.gymId !== g) continue;
      return s;
    }
    return null;
  }
  // při úpravě uloženého tréninku se „minule“ bere jen z tréninků před ním
  const draftBefore = (d) => (d.mode === "edit" ? d.start : 0);
  // „minule“ pro cvik v rozdělaném / upravovaném tréninku d
  function draftLast(d, exId) {
    return lastSession(exId, d.gymId, d.id, draftBefore(d));
  }
  /* ---------- MINULE A PŘEDVYPLNĚNÍ (F1-01) ----------
     Série se párují podle druhu: zahřívací zvlášť, ostatní (pracovní, drop set, do selhání) spolu, v pořadí.
     Předvyplnění je šedé (placeholder), klepnutím na ✓ se převezme. Zdroj: odpovídající série z minula,
     jinak s.ph (hodnoty ze šablony u nikdy necvičeného cviku). Když ani jedno není, ukáže se „–“
     ve sloupci Minule i v políčkách (hodnoty ze série nad ní se nepřebírají). */
  const setGrp = (t) => (t === "w" ? "w" : "n");
  const HINT_F = ["kg", "reps", "sec", "km"];
  // ke každé sérii cviku e: p = odpovídající série z minula (sloupec Minule), h = šedé předvyplnění
  function exHints(e, last) {
    const prev = { w: [], n: [] };
    if (last) {
      for (const q of last.e.sets) {
        prev[setGrp(q.t)].push(q);
      }
    }
    const cnt = { w: 0, n: 0 };
    return e.sets.map((s) => {
      const g = setGrp(s.t),
        p = prev[g][cnt[g]++] || null;
      return { p, h: p || s.ph || null };
    });
  }
  // série jako text „80×8 · 80×7“ (onlyWork = jen pracovní, bez zahřívacích)
  function setsStr(sets, onlyWork, kind) {
    kind = kind || "wr";
    return sets
      .filter((s) => !onlyWork || isWork(s.t))
      .map((s) => setStr(kind, s))
      .join(" · ");
  }

  /* ---------- UPOZORNĚNÍ NA VELKÝ SKOK (F1-10) ----------
     Při ✓ v rozdělaném tréninku porovná hodnoty série se sérií z minula (sloupec Minule), a když
     minulá hodnota chybí, s nejvyšší hodnotou cviku v historii (vázaný cvik jen v tomto fitku).
     U úplně nového cviku se neporovnává nic. Ptá se jen při nárůstu (pokles bývá záměrný):
     kg víc než 1,5× a aspoň o 20 kg, opakování víc než 2× a aspoň o 10, čas a km víc než 2×.
     Potvrzení platí pro sérii, dokud se v ní nezmění hodnota (s.jumpOk, do uloženého tréninku
     se nedostane). */
  const JUMP = {
    kg: { x: 1.5, add: 20 },
    reps: { x: 2, add: 10 },
    sec: { x: 2, add: 0 },
    km: { x: 2, add: 0 },
  };
  // nejvyšší kg, opakování, čas a km cviku v historii (vázaný cvik jen v daném fitku)
  function exMaxes(exId, gymId) {
    const gym = exCtxGym(exId, gymId);
    const out = { kg: 0, reps: 0, sec: 0, km: 0 };
    for (const x of derive().byEx[exId] || []) {
      if (gym && x.w.gymId !== gym) continue;
      for (const s of x.e.sets) {
        for (const f of HINT_F) {
          if (+s[f] > out[f]) {
            out[f] = +s[f];
          }
        }
      }
    }
    return out;
  }
  // velký skok v sérii j cviku i: {f, v, ref, refTxt}, jinak null
  function setJump(d, i, j) {
    const e = d.ex[i];
    const s = e.sets[j];
    const prev = exHints(e, draftLast(d, e.exId))[j].p;
    let maxes = null;
    for (const f of kFields(kindOf(e.exId))) {
      const rule = setRule(f);
      const v = rule === "sec" ? parseSec(s.sec) : num(s[rule]);
      if (!(v > 0)) continue;
      let ref = prev ? +prev[rule] || 0 : 0;
      let refTxt = "Minule";
      if (!ref) {
        maxes = maxes || exMaxes(e.exId, d.gymId);
        ref = maxes[rule];
        refTxt = "Zatím nejvíc";
      }
      if (!(ref > 0)) continue;
      if (v > ref * JUMP[rule].x && v - ref >= JUMP[rule].add) return { f, v, ref, refTxt };
    }
    return null;
  }
  // hodnota pro text upozornění (+kg / −kg se znaménkem)
  function jumpFmt(f, v) {
    if (f === "reps") return fmtInt(v) + " opak.";
    if (f === "sec") return fmtSec(v);
    if (f === "km") return fmtKg(v) + " km";
    const sign = f === "plus" ? "+" : f === "minus" ? "−" : "";
    return sign + fmtKg(v) + " kg";
  }
  function sheetJump(i, j, jump) {
    const body = `
    <p style="margin:0">${esc(jump.refTxt)}: <b>${esc(jumpFmt(jump.f, jump.ref))}</b></p>
    <p style="margin:0">Není to překlep?</p>`;
    const foot = `<button class="btn grow" data-act="jumpFix" data-i="${i}" data-j="${j}"
        data-v="${esc(jump.f)}">
      Opravit
    </button>
    <button class="btn primary grow" data-act="jumpOk" data-i="${i}" data-j="${j}">
      Ano, je to správně
    </button>`;
    openSheet("Opravdu " + jumpFmt(jump.f, jump.v) + "?", body, foot);
  }

  /* ✓ u série: odškrtnutí (převezme šedé předvyplnění, zkontroluje hodnoty a velký skok),
     nebo jeho zrušení */
  function toggleSetDone(d, i, j) {
    const e = d.ex[i];
    const s = e.sets[j];
    const kind = kindOf(e.exId);
    if (s.done) {
      s.done = false;
      delete s.at;
      touchDraft();
      scheduleRender();
      return;
    }
    const hint = exHints(e, draftLast(d, e.exId))[j].h;
    if (hint) {
      if (s.kg === "" && hint.kg) {
        s.kg = numStr(hint.kg);
      }
      if (s.reps === "" && hint.reps) {
        s.reps = String(hint.reps);
      }
      if (!s.sec && hint.sec) {
        s.sec = fmtSec(hint.sec);
      }
      if (!s.km && hint.km) {
        s.km = numStr(hint.km);
      }
    }
    for (const f of kFields(kind)) {
      const rule = setRule(f);
      s[rule] = numNormalize(rule, s[rule]); // „85“ → „1:25“, „5,“ → „5“
    }
    const problem = setProblem(kind, s, true);
    if (problem) {
      touchDraft();
      scheduleRender();
      showProblem(e, j, problem);
      return;
    }
    if (d === S.active && !s.jumpOk) {
      const jump = setJump(d, i, j);
      if (jump) {
        touchDraft();
        scheduleRender();
        sheetJump(i, j, jump);
        return;
      }
    }
    s.done = true;
    s.at = Date.now();
    // pauza (v úpravě staršího tréninku bez časovače); v supersérii podle kola (F4-05)
    if (d === S.active) {
      const rest = ssRest(d, i, j);
      if (rest === "none") {
        restStop();
        toast(restNext());
      } else {
        restStart(rest === "ss" ? S.cfg.restSs : S.cfg.restSec);
      }
    }
    const lr = liveRecords(d, i);
    const types = lr.sets[j];
    if (S.cfg.recCelEx && d === S.active) {
      celExercise(e, lr); // oslava až po dokončení cviku (F3-02)
    } else if (types && types.length) {
      toast("🏅 Nový rekord: " + types.map(recLow).join(", "));
    }
    touchDraft();
    scheduleRender();
  }

  /* ---------- KROKOVAČ (F1-03) ----------
     Velká tlačítka +/− pro ovládání jednou rukou. V rozdělaném tréninku (se zapnutým S.cfg.stepper)
     jsou políčka série jen ke čtení, takže se neotevře klávesnice, a klepnutí na ně otevře spodní panel
     s hodnotami série pod sebou. Tlačítko − / + mění hodnotu o krok, podržení ji mění dál.
     Počáteční hodnota = hodnota v políčku, u prázdného políčka šedé předvyplnění z minula (F1-01).
     Krok u kg (i +kg a −kg), času a km se mění jedním tlačítkem dokola (STEPS) a pamatuje se
     v Local "kkStep" pro každý cvik (cvik vázaný na fitko zvlášť pro každé fitko). Opakování po 1.
     „Napsat“ zavře panel a otevře klávesnici v políčku (kkKbd = id políčka, dokud ho uživatel neopustí).
     „Série hotová“ zavře panel a odškrtne sérii přes toggleSetDone (kontrola čísel, velký skok, rekord,
     pauza). Nic nového se neukládá do dat tréninku. */
  const STEPS = {
    kg: [0.5, 1, 1.25, 2.5, 5, 10],
    sec: [1, 5, 30],
    km: [0.1, 0.5, 1],
  };
  const STEP_DEF = { kg: 2.5, sec: 5, km: 0.1 };
  const STEP_UNIT = { kg: " kg", sec: " s", km: " km" };
  const KK_REPEAT_DELAY = 450; // ms: podržení tlačítka − / +, než se hodnota začne měnit sama
  const KK_REPEAT_EVERY = 90; // ms: další krok při podržení
  let kk = null; // otevřený krokovač: {i, j, f} (cvik, série, pole, na které se klepnulo)
  let kkKbd = null; // id políčka, do kterého se právě píše klávesnicí (přes „Napsat“)
  let kkHold = null; // časovač podrženého tlačítka

  // krokovač místo klávesnice? jen v rozdělaném tréninku a se zapnutým nastavením
  const kkOn = (d) => d.mode === "active" && S.cfg.stepper !== false;
  const kkInputId = (e, j, f) => "in-" + e.k + "-" + j + "-" + f;

  // klíč uloženého kroku: cvik, u cviku vázaného na fitko i fitko, a pravidlo (kg, sec, km)
  function kkStepKey(d, e, rule) {
    const ex = S.exLib[e.exId];
    const gym = ex && ex.gymDep ? d.gymId || "" : "";
    return e.exId + "|" + gym + "|" + rule;
  }
  // aktuální krok pro pole série (opakování vždy 1)
  function kkStep(d, e, rule) {
    if (!STEPS[rule]) return 1;
    const saved = Local.get("kkStep", {})[kkStepKey(d, e, rule)];
    return STEPS[rule].includes(saved) ? saved : STEP_DEF[rule];
  }
  // další krok dokola (0,5 → 1 → 1,25 → 2,5 → 5 → 10 → 0,5 …) a uložení
  function kkStepNext(d, e, rule) {
    const list = STEPS[rule];
    const next = list[(list.indexOf(kkStep(d, e, rule)) + 1) % list.length];
    const all = Local.get("kkStep", {});
    all[kkStepKey(d, e, rule)] = next;
    Local.set("kkStep", all);
    return next;
  }
  const kkStepStr = (rule, step) => numStr(step) + STEP_UNIT[rule];

  // hodnota z minula (šedé předvyplnění) pro pole série, jinak NaN
  function kkHint(d, i, j, rule) {
    const e = d.ex[i];
    const hint = exHints(e, draftLast(d, e.exId))[j].h;
    return hint && +hint[rule] > 0 ? +hint[rule] : NaN;
  }
  // číslo, od kterého se krokuje: hodnota v políčku, jinak z minula, jinak 0
  function kkBase(d, i, j, rule) {
    const text = d.ex[i].sets[j][rule];
    const res = numCheck(rule, text);
    if (res.ok && isFinite(res.v)) return res.v;
    const hint = kkHint(d, i, j, rule);
    return isFinite(hint) ? hint : 0;
  }
  // číslo jako text do políčka: čas „1:05“, opakování celé číslo, kg a km s čárkou
  function kkText(rule, value) {
    if (rule === "sec") return fmtSec(value);
    if (rule === "reps") return String(Math.round(value));
    return numStr(value);
  }
  // hodnota v panelu: zapsaná normálně, z minula šedě, bez hodnoty „–“
  function kkValue(d, i, j, rule) {
    const text = d.ex[i].sets[j][rule];
    if (text !== "") return `<b>${esc(text)}</b>`;
    const hint = kkHint(d, i, j, rule);
    if (isFinite(hint)) return `<b class="ph">${esc(kkText(rule, hint))}</b>`;
    return '<b class="ph">–</b>';
  }

  // otevře krokovač pro sérii j cviku i (f = pole, na které se klepnulo: kg, plus, minus, reps, sec, km)
  function sheetStepper(i, j, f) {
    const d = S.active;
    const e = d && d.ex[i];
    const s = e && e.sets[j];
    if (!s) return;
    const kind = kindOf(e.exId);
    const flds = kFields(kind);
    if (document.activeElement) {
      document.activeElement.blur();
    }
    // název série jako ve sloupci Série: pracovní se číslují, ostatní podle druhu
    let label = TYPE_NAME[s.t];
    if (s.t === "n") {
      label = "Série " + e.sets.slice(0, j + 1).filter((x) => x.t === "n").length;
    }
    const prev = exHints(e, draftLast(d, e.exId))[j].p;
    const steps = flds
      .map(setRule)
      .filter((rule) => STEPS[rule])
      .map(
        (rule) =>
          `<button class="btn sm" data-act="kkStep" data-v="${rule}">
            <span>krok</span> ${esc(kkStepStr(rule, kkStep(d, e, rule)))}
          </button>`,
      )
      .join("");
    const prevText = prev ? `minule <b class="num">${esc(setStr(kind, prev))}</b>` : "bez záznamu z minula";
    const warm = warmInfo(d, i, j);
    let body = `<div class="kk-sub">
      <span class="grow">${esc(label)} · ${prevText}</span>
      ${steps}
      ${
        warm
          ? `<button class="btn sm" id="kk-warm" data-act="kkWarm"
              aria-label="Nastavit ${warm.pct} % nejtěžší série z minula">${warmLabel(warm)}</button>`
          : ""
      }
    </div>`;
    for (const fld of flds) {
      const rule = setRule(fld);
      body += `<div class="kk-row">
        <button class="btn kk-b" data-kk="-1" data-kf="${rule}" aria-label="Ubrat">−</button>
        <div class="kk-v">
          <span id="kk-${rule}">${kkValue(d, i, j, rule)}</span>
          <small>${esc(FLD[fld].lab)}</small>
        </div>
        <button class="btn kk-b" data-kk="1" data-kf="${rule}" aria-label="Přidat">+</button>
      </div>`;
    }
    const foot = `<button class="btn grow" data-act="kkKbd">⌨ Napsat</button>
      ${
        s.done
          ? '<button class="btn primary grow" data-act="closeSheet">Hotovo</button>'
          : '<button class="btn primary grow" data-act="kkDone">✓ Série hotová</button>'
      }`;
    openSheet(exName(e.exId), body, foot, false, {
      cls: "kk",
      re: () => sheetStepper(i, j, f),
    });
    kk = { i, j, f };
    kkMark();
    kkScroll();
  }
  // zvýrazní v tabulce řádek série, kterou krokovač upravuje (bez překreslení)
  function kkMark() {
    for (const row of document.querySelectorAll(".sets tr.kk-on")) {
      row.classList.remove("kk-on");
    }
    const input = kk && S.active ? document.getElementById(kkInputId(S.active.ex[kk.i], kk.j, kk.f)) : null;
    if (input) {
      input.closest("tr").classList.add("kk-on");
    }
  }
  // zavření krokovače (i když ho nahradí jiný panel): zrušit zvýraznění řádku
  function kkEnd() {
    if (!kk) return;
    kk = null;
    kkHoldStop();
    kkMark();
  }
  // posune stránku, aby upravovaná série byla vidět nad panelem a pod horní lištou
  function kkScroll() {
    const row = document.querySelector(".sets tr.kk-on");
    const sheet = document.querySelector("#sheetRoot .sheet");
    if (!row || !sheet) return;
    const box = row.getBoundingClientRect();
    const top = document.querySelector("#app .top");
    const minTop = (top ? top.getBoundingClientRect().bottom : 0) + 8;
    const maxBottom = window.innerHeight - sheet.offsetHeight - 12;
    if (box.bottom > maxBottom) {
      window.scrollBy(0, box.bottom - maxBottom);
    } else if (box.top < minTop) {
      window.scrollBy(0, box.top - minTop);
    }
  }
  // klepnutí na − / +: změní hodnotu o krok (nejméně 0, nejvýš hranice z NUM_RULES)
  function kkPress(btn) {
    const d = S.active;
    if (!kk || !d || !d.ex[kk.i] || !d.ex[kk.i].sets[kk.j]) return;
    const e = d.ex[kk.i];
    const rule = btn.dataset.kf;
    const step = rule === "reps" ? 1 : kkStep(d, e, rule);
    let value = kkBase(d, kk.i, kk.j, rule) + +btn.dataset.kk * step;
    value = Math.min(NUM_RULES[rule].max, Math.max(0, value));
    kkSet(rule, value);
  }
  // zapíše hodnotu do pole série v otevřeném krokovači a ukáže ji v panelu i v tabulce (bez překreslení)
  function kkSet(rule, value) {
    const d = S.active;
    const e = d.ex[kk.i];
    const s = e.sets[kk.j];
    value = Math.round(value * 100) / 100; // bez chyb zaokrouhlení (0,1 + 0,2)
    s[rule] = kkText(rule, value);
    delete s.jumpOk; // změněná hodnota = znovu zkontrolovat velký skok
    touchDraft();
    const shown = document.getElementById("kk-" + rule);
    if (shown) {
      shown.innerHTML = kkValue(d, kk.i, kk.j, rule);
    }
    // políčko v tabulce nad panelem ukazuje hodnotu hned
    for (const fld of kFields(kindOf(e.exId))) {
      if (setRule(fld) !== rule) continue;
      const input = document.getElementById(kkInputId(e, kk.j, fld));
      if (input) {
        input.value = s[rule];
        input.numLast = s[rule];
        input.className = "cell" + numCls(rule, s[rule]);
      }
    }
  }
  function kkHoldStop() {
    clearTimeout(kkHold);
    clearInterval(kkHold);
    kkHold = null;
  }
  // − / + reaguje hned na dotyk, podržením se hodnota mění dál
  document.addEventListener("pointerdown", (ev) => {
    const btn = ev.target.closest("[data-kk]");
    if (!btn) return;
    ev.preventDefault();
    kkHoldStop();
    kkPress(btn);
    kkHold = setTimeout(() => {
      kkHold = setInterval(() => kkPress(btn), KK_REPEAT_EVERY);
    }, KK_REPEAT_DELAY);
  });
  for (const type of ["pointerup", "pointercancel", "pointerleave", "blur"]) {
    window.addEventListener(type, kkHoldStop);
  }
  // podržení tlačítka nemá otevřít kontextovou nabídku
  document.addEventListener("contextmenu", (ev) => {
    if (ev.target.closest && ev.target.closest("[data-kk]")) {
      ev.preventDefault();
    }
  });
  // „Napsat“: zavře panel a otevře klávesnici v políčku (musí být ve stejném klepnutí, jinak Chrome
  // klávesnici neukáže)
  function kkKeyboard() {
    const d = S.active;
    if (!kk || !d || !d.ex[kk.i]) return;
    const id = kkInputId(d.ex[kk.i], kk.j, kk.f);
    closeSheet();
    const input = document.getElementById(id);
    if (!input) return;
    kkKbd = id;
    input.readOnly = false;
    input.removeAttribute("data-act");
    input.focus();
    input.select();
  }
  // po opuštění políčka zase krokovač
  document.addEventListener("focusout", (ev) => {
    if (kkKbd && ev.target.id === kkKbd) {
      kkKbd = null;
      scheduleRender();
    }
  });

  /* ---------- ZAHŘÍVACÍ SÉRIE Z MINULA (F1-08) ----------
     V krokovači u zahřívací série cviku „Váha a opakování“ je tlačítko „60 % → 50 kg“. Nastaví váhu
     na S.cfg.warmPct procent (posuvník v Nastavení → Trénink) nejtěžší série z minula bez zahřívacích
     („minule“ jako F1-01: draftLast, cvik vázaný na fitko jen z tohoto fitka), zaokrouhleno na krok
     krokovače cviku. Hodnota se zapíše stejně jako napsaná, další úpravy zůstanou a tlačítko jde použít
     znovu. Bez záznamu z minula se tlačítko neukáže. Nic nového se neukládá do dat tréninku.
     Výpočet (warmKg) může převzít generátor rozcvičkových sérií (F4-02). */

  // nejtěžší série cviku e z minula bez zahřívacích (0 = bez záznamu)
  function warmMax(d, e) {
    const last = draftLast(d, e.exId);
    if (!last) return 0;
    let max = 0;
    for (const q of last.e.sets) {
      if (q.t !== "w" && +q.kg > max) {
        max = +q.kg;
      }
    }
    return max;
  }
  // pct procent z max, zaokrouhleno na krok (aspoň jeden krok, nejvýš max)
  function warmKg(max, pct, step) {
    let kg = Math.round((max * pct) / 100 / step) * step;
    kg = Math.min(max, Math.max(step, kg));
    return Math.round(kg * 100) / 100;
  }
  // tlačítko pro sérii j cviku i v rozdělaném tréninku d: {pct, kg}, nebo null (tlačítko se neukáže)
  function warmInfo(d, i, j) {
    const e = d.ex[i];
    const s = e && e.sets[j];
    if (!s || s.t !== "w" || kindOf(e.exId) !== "wr") return null;
    const max = warmMax(d, e);
    if (!max) return null;
    const pct = S.cfg.warmPct;
    return { pct, kg: warmKg(max, pct, kkStep(d, e, "kg")) };
  }
  const warmLabel = (warm) => `${warm.pct} % <span>→</span> ${esc(numStr(warm.kg))} kg`;

  /* Nastavení → Trénink → Zadávání čísel v tréninku */
  function stepperSettings() {
    const on = S.cfg.stepper !== false;
    return `<section class="sec">
      <div class="sec-h"><h2>Zadávání čísel v tréninku</h2></div>
      <div class="card stack">
        <label class="switch">
          <input type="checkbox" data-act="stepper" ${on ? "checked" : ""}>
          <span><b>Tlačítka +/−</b><br><span class="xs muted">Klepnutí na kg, opakování, čas nebo km
              v rozdělaném tréninku otevře dole panel s tlačítky + a −, ovladatelný jednou rukou.
              Klávesnice je v panelu pod tlačítkem Napsat. Vypnuto = klepnutí rovnou otevře
              klávesnici.</span></span>
        </label>
        <div class="warm-set${on ? "" : " off"}">
          <div class="row">
            <b class="grow">Zahřívací série</b>
            <b class="num" id="warmPctV">${S.cfg.warmPct} %</b>
          </div>
          <input type="range" class="range" id="warmPct" min="${WARM_PCT.min}" max="${WARM_PCT.max}"
              step="${WARM_PCT.step}" value="${S.cfg.warmPct}" aria-label="Zahřívací série v procentech"
              ${on ? "" : "disabled"}>
          <div class="xs muted">
            V panelu s tlačítky +/− u zahřívací série tlačítko, které nastaví váhu na tolik procent
            nejtěžší série z minula (zaokrouhleno na krok, např. 60 % z 82,5 kg = 50 kg).
            ${on ? "" : "Funguje jen se zapnutými tlačítky +/−."}
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- REKORDY ----------
     Počítají se chronologicky z celé historie (zpětně i pro importovaná data).
     Kontext: cvik vázaný na fitko -> zvlášť pro každé fitko, jinak globálně.
     První trénink s cvikem v kontextu (a první výskyt daného typu) rekord nezakládá.
     Typy: maxKg (max. váha), e1rm (odh. 1RM), bestSet (kg × opak. nejvyšší součin),
           vol (objem cviku v tréninku), reps (max. opakování bez zátěže u cviků s vlastní vahou). */
  const REC = {
    maxKg: "Max. zátěž",
    e1rm: "Odh. 1RM",
    bestSet: "Nejlepší série",
    vol: "Objem cviku",
    reps: "Max. opakování",
    maxSec: "Nejdelší výdrž",
    totSec: "Celkový čas",
    maxKm: "Nejdelší vzdálenost",
    totKm: "Vzdálenost v tréninku",
    speed: "Nejvyšší tempo",
  };
  // název rekordu malými písmeny do věty
  const recLow = (t) => (t === "e1rm" ? "odh. 1RM" : REC[t].toLowerCase());
  const REC_ORDER = [
    "maxKg",
    "e1rm",
    "bestSet",
    "vol",
    "reps",
    "maxSec",
    "totSec",
    "maxKm",
    "totKm",
    "speed",
  ];
  const EPS = 1e-6;
  // kontext rekordu: cvik, u cviku vázaného na fitko navíc fitko („bench|*“, „leg-press|g2“)
  function recCtx(exId, gymId) {
    const e = S.exLib[exId];
    return exId + "|" + (e && e.gymDep ? gymId : "*");
  }
  // hodnota rekordu jako text („82,5 kg“, „100 kg × 5“, „1:30“, „5 km“…)
  function recFmt(type, v, set) {
    if (type === "reps") return fmtInt(v) + " opak.";
    if (type === "bestSet" && set) return fmtKg(set.load != null ? set.load : set.kg) + " kg × " + set.reps;
    if (type === "e1rm") return fmtKg(Math.round(v * 10) / 10) + " kg";
    if (type === "vol") return fmtInt(v) + " kg";
    if (type === "maxSec" || type === "totSec") return fmtSec(v);
    if (type === "maxKm" || type === "totKm") return fmtKg(v) + " km";
    if (type === "speed") return fmtKg(Math.round(v * 10) / 10) + " km/h";
    return fmtKg(v) + " kg";
  }
  // metriky jedné sady sérií (jen pracovní). Vrací {type:{v,set,j}}
  function exMetrics(exId, sets, t) {
    const kind = kindOf(exId);
    const m = {};
    let vol = 0,
      totSec = 0,
      totKm = 0,
      any = false;
    sets.forEach((s, j) => {
      if (!isWork(s.t)) return;
      if (hasReps(kind)) {
        const reps = +s.reps || 0;
        if (reps <= 0) return;
        any = true;
        const L = setLoad(kind, s, t);
        if (L > 0) {
          vol += L * reps;
          if (!m.maxKg || L > m.maxKg.v + EPS || (Math.abs(L - m.maxKg.v) < EPS && reps > m.maxKg.set.reps)) {
            m.maxKg = { v: L, set: Object.assign({}, s, { load: L }), j };
          }
          const r = e1rm(L, reps);
          if (r > 0 && (!m.e1rm || r > m.e1rm.v + EPS)) {
            m.e1rm = { v: r, set: Object.assign({}, s, { load: L }), j };
          }
          const p = L * reps;
          if (!m.bestSet || p > m.bestSet.v + EPS) {
            m.bestSet = { v: p, set: Object.assign({}, s, { load: L }), j };
          }
        }
        if (kind === "bw" || kind === "assist" || kind === "bwplus") {
          if (!m.reps || reps > m.reps.v) {
            m.reps = { v: reps, set: s, j };
          }
        }
      }
      if (isTimed(kind)) {
        const sec = +s.sec || 0;
        if (sec <= 0) return;
        any = true;
        totSec += sec;
        if (!m.maxSec || sec > m.maxSec.v + EPS) {
          m.maxSec = { v: sec, set: s, j };
        }
      }
      if (kind === "dist") {
        const km = +s.km || 0,
          sec = +s.sec || 0;
        if (km <= 0) return;
        any = true;
        totKm += km;
        if (!m.maxKm || km > m.maxKm.v + EPS) {
          m.maxKm = { v: km, set: s, j };
        }
        const v = sec > 0 ? km / (sec / 3600) : 0;
        if (v > 0 && (!m.speed || v > m.speed.v + EPS)) {
          m.speed = { v, set: s, j };
        }
      }
    });
    if (vol > 0) {
      m.vol = { v: vol };
    }
    if (totSec > 0 && kind !== "dist") {
      m.totSec = { v: totSec };
    }
    if (totKm > 0) {
      m.totKm = { v: totKm };
    }
    return any ? m : null;
  }
  /* projde všechny tréninky od nejstaršího a zapíše, kde padl rekord:
     byW = rekordy podle tréninku, byEx = podle cviku, best = nejlepší hodnoty v každém kontextu */
  function computeRecords() {
    const best = {}; // ctx -> {type:{v,set,w}}
    const seen = {}; // ctx -> true po prvním tréninku
    const byW = {}; // workoutId -> [{exId,type,v,prev,set}]
    const byEx = {}; // exId -> [{w,type,v,prev,set,ctx}]
    const list = derive().all.slice().reverse();
    for (const w of list) {
      // sloučit případné duplicitní cviky v tréninku
      const grouped = {};
      for (const e of w.ex || []) {
        (grouped[e.exId] = grouped[e.exId] || []).push(...e.sets);
      }
      for (const exId in grouped) {
        const m = exMetrics(exId, grouped[exId], w.start);
        if (!m) continue;
        const ctx = recCtx(exId, w.gymId);
        const b = best[ctx] || (best[ctx] = {});
        const first = !seen[ctx];
        seen[ctx] = true;
        for (const type in m) {
          const cur = m[type],
            prev = b[type];
          if (!prev) {
            b[type] = { v: cur.v, set: cur.set, w };
            continue;
          }
          if (cur.v > prev.v + EPS) {
            if (!first) {
              const r = {
                exId,
                type,
                v: cur.v,
                prev: prev.v,
                set: cur.set,
                prevSet: prev.set,
                ctx,
                gymId: w.gymId,
              };
              (byW[w.id] = byW[w.id] || []).push(r);
              (byEx[exId] = byEx[exId] || []).push(Object.assign({ w }, r));
            }
            b[type] = { v: cur.v, set: cur.set, w };
          }
        }
      }
    }
    return { best, byW, byEx };
  }
  // rekordy (computeRecords), spočítané jednou po každé změně dat
  function recs() {
    const d = derive();
    if (!d.rec) {
      d.rec = computeRecords();
    }
    return d.rec;
  }
  // rekordy, které padly v tréninku w
  function wRecs(w) {
    return recs().byW[w.id] || [];
  }
  // živé medaile pro rozdělaný trénink: vrací {j:[types]} pro cvik i, seznam typů
  // cviku a jejich hodnoty v ({typ:{v,set,prev,prevSet}})
  function liveRecords(d, i) {
    const e = d.ex[i];
    const kind = kindOf(e.exId);
    const b = recs().best[recCtx(e.exId, d.gymId)];
    const out = { sets: {}, ex: [], v: {} };
    if (!b) return out; // první trénink s cvikem v tomto kontextu
    const conv = (s) => ({
      t: s.t,
      kg: num(s.kg) || 0,
      reps: num(s.reps) || 0,
      sec: parseSec(s.sec) || 0,
      km: num(s.km) || 0,
    });
    const done = e.sets.map((s) => (s.done ? conv(s) : { t: "w" }));
    const extra = [];
    d.ex.forEach((x, k) => {
      if (k !== i && x.exId === e.exId) {
        for (const s of x.sets) {
          if (s.done) {
            extra.push(conv(s));
          }
        }
      }
    });
    const m = exMetrics(e.exId, done.concat(extra), d.start);
    if (!m) return out;
    for (const type in m) {
      const prev = b[type];
      if (!prev || !(m[type].v > prev.v + EPS)) continue;
      out.ex.push(type);
      out.v[type] = { v: m[type].v, set: m[type].set, prev: prev.v, prevSet: prev.set };
      if (m[type].j != null && m[type].j < done.length) {
        (out.sets[m[type].j] = out.sets[m[type].j] || []).push(type);
      }
    }
    return out;
  }
  // seznam rekordů jako HTML (withEx = seskupený po cvicích)
  function recListHtml(list, withEx) {
    if (!list.length) return "";
    if (withEx) {
      // po cvicích: název na vlastním řádku, pod ním každý rekord zvlášť
      const g = {};
      for (const r of list) {
        (g[r.exId] = g[r.exId] || []).push(r);
      }
      return `<div class="reclist">
        ${Object.keys(g)
          .map(
            (id) =>
              `<div class="recex">
                <div class="rn"><span class="md">🏅</span><b>${esc(exName(id))}</b></div>
                ${g[id]
                  .map(
                    (r) =>
                      `<div class="rr">
                        ${esc(REC[r.type])}: <b>${esc(recFmt(r.type, r.v, r.set))}</b>` +
                      `<span class="muted"> (dříve ` +
                      `${esc(recFmt(r.type, r.prev, r.prevSet))})</span>
                      </div>`,
                  )
                  .join("")}
              </div>`,
          )
          .join("")}
      </div>`;
    }
    return `<div class="reclist">
      ${list
        .map(
          (r) =>
            `<div class="rec">
              <span class="md">🏅</span>
              <div class="grow">
                ${esc(REC[r.type])}: <b>${esc(recFmt(r.type, r.v, r.set))}</b>` +
            `<span class="muted"> (dříve ` +
            `${esc(recFmt(r.type, r.prev, r.prevSet))})</span>
              </div>
            </div>`,
        )
        .join("")}
    </div>`;
  }
  const plural = (n, a, b, c) => (n === 1 ? a : n >= 2 && n <= 4 ? b : c);

  /* ---------- OSLAVA REKORDU (F3-02) ----------
     Medaile přes celou obrazovku: v rozdělaném tréninku po dokončení cviku (odškrtnuté všechny pracovní
     série, zahřívací se nepočítají) a po uložení tréninku nad souhrnem. Zlatá = aspoň jeden velký rekord
     (REC_BIG), jinak stříbrná; v seznamu jsou vždy všechny. Co už se oslavilo, si pamatuje cvik v rozdělaném
     tréninku (e.cel = {typ: hodnota}, do uloženého tréninku se nedostane); znovu se slaví jen vyšší hodnota
     nebo nový typ. Nastavení v config/main: recCelEx (po cviku; vypnuto = jen hláška po sérii jako dřív),
     recCelW (po tréninku), recSnd (id zvuku z CEL_SOUNDS, "off" = bez zvuku). Zvuky se tvoří přes Web Audio.
     Zavření jen na přání (aby šlo vše v klidu přečíst): tlačítko Pokračovat, klepnutí mimo kartu,
     Zpět (navBack). */
  const REC_BIG = { maxKg: 1, e1rm: 1, reps: 1, maxSec: 1, maxKm: 1, speed: 1 };
  let celEl = null;
  const exDone = (e) => {
    const w = e.sets.filter((s) => isWork(s.t));
    return w.length > 0 && w.every((s) => s.done);
  };
  // po odškrtnutí série: dokončený cvik s novým (ještě neoslaveným) rekordem
  function celExercise(e, lr) {
    if (!exDone(e) || !lr.ex.length) return;
    const c = e.cel || {},
      nw = lr.ex.filter((t) => !(c[t] != null && lr.v[t].v <= c[t] + EPS));
    if (!nw.length) return;
    e.cel = Object.assign({}, c);
    for (const t of nw) {
      e.cel[t] = lr.v[t].v;
    }
    celebrate(
      nw.map((t) => Object.assign({ exId: e.exId, type: t }, lr.v[t])),
      exName(e.exId),
    );
  }
  function celMedal(k) {
    const m =
      k === "gold"
        ? { a: "#fff4b8", b: "#f5c542", c: "#d99a0b", d: "#9c6400", r: "#cf3a31", r2: "#9e2a23" }
        : { a: "#ffffff", b: "#dde2e8", c: "#aab2bc", d: "#66707b", r: "#2a78d6", r2: "#1d5aa3" };
    const id = "cel" + k,
      bar = "M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"; // činka z ikony appky
    return `<svg viewBox="0 0 200 240" aria-hidden="true">
      <defs>
        <linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${m.a}"/>
          <stop offset=".35" stop-color="${m.b}"/>
          <stop offset=".7" stop-color="${m.c}"/>
          <stop offset="1" stop-color="${m.d}"/>
        </linearGradient>
        <linearGradient id="${id}i" x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${m.a}"/>
          <stop offset=".45" stop-color="${m.b}"/>
          <stop offset="1" stop-color="${m.c}"/>
        </linearGradient>
        <clipPath id="${id}c"><circle cx="100" cy="152" r="70"/></clipPath>
      </defs>
      <g class="cel-sw">
        <polygon points="56,0 96,0 114,98 84,106" fill="${m.r}"/>
        <polygon points="70,0 82,0 99,100 90,103" fill="#fff" opacity=".85"/>
        <polygon points="144,0 104,0 86,98 116,106" fill="${m.r2}"/>
        <polygon points="130,0 118,0 101,100 110,103" fill="#fff" opacity=".7"/>
        <rect x="84" y="84" width="32" height="14" rx="4" fill="${m.d}"/>
        <circle cx="100" cy="152" r="70" fill="url(#${id}o)"/>
        <circle cx="100" cy="152" r="70" fill="none" stroke="${m.d}" stroke-width="2.5" opacity=".6"/>
        <circle cx="100" cy="152" r="54" fill="url(#${id}i)" stroke="${m.d}" stroke-opacity=".45"
            stroke-width="2"/>
        <g transform="translate(100 152) scale(3.3) translate(-12 -12)" fill="none"
            stroke-linecap="round">
          <path d="${bar}" stroke="${m.a}" stroke-width="3.1" transform="translate(.35 .45)"/>
          <path d="${bar}" stroke="${m.d}" stroke-width="2.3"/>
        </g>
        <g clip-path="url(#${id}c)">
          <rect class="cel-shine" x="0" y="60" width="26" height="200" fill="#fff" opacity=".55"
              transform="rotate(20 100 152)"/>
        </g>
      </g>
    </svg>`;
  }
  function celebrate(R, sub) {
    celClose(true);
    const gold = R.some((r) => REC_BIG[r.type]),
      k = gold ? "gold" : "silver",
      rank = (t) => (REC_BIG[t] ? 0 : 100) + REC_ORDER.indexOf(t);
    const g = {};
    for (const r of R) {
      (g[r.exId] = g[r.exId] || []).push(r);
    }
    const ids = Object.keys(g);
    const list = ids
      .map(
        (id) =>
          (ids.length > 1 ? `<div class="cel-g">${esc(exName(id))}</div>` : "") +
          g[id]
            .sort((a, b) => rank(a.type) - rank(b.type))
            .map((r) => {
              const b = REC_BIG[r.type];
              return `<div class="cel-r${b ? "" : " small"}">
                <span class="cel-dot ${b ? "g" : "s"}"></span>
                <span>${esc(REC[r.type])}</span>
                <b>${esc(recFmt(r.type, r.v, r.set))}</b>
                <span class="was">dříve ${esc(recFmt(r.type, r.prev, r.prevSet))}</span>
              </div>`;
            })
            .join(""),
      )
      .join("");
    let sp = "";
    for (let i = 0; i < 14; i++) {
      sp +=
        `<i class="cel-sp" style="--a:${(i * 360) / 14 + (i % 2 ? 9 : -5)}deg;--d:${95 + (i % 3) * 22}px;` +
        `--s:${(0.7 + (i % 4) * 0.22).toFixed(2)};--dl:${(0.42 + (i % 5) * 0.05).toFixed(2)}s"></i>`;
    }
    const el = document.createElement("div");
    el.className = "cel " + k;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Nový rekord");
    el.innerHTML = `<div class="cel-m">
      <div class="cel-glow"></div>
      <div class="cel-rays"></div>
      ${sp}${celMedal(k)}
    </div>
    <div class="cel-c">
      <h2>Nový rekord!</h2>
      <div class="cel-ex">${esc(sub)}</div>
      <div class="cel-l">${list}</div>
      <div class="cel-more" hidden>↓ Posuň pro další</div>
      <button class="btn cel-ok">Pokračovat</button>
    </div>`;
    const t0 = Date.now();
    el.addEventListener("click", (ev) => {
      // zavře tlačítko nebo klepnutí mimo kartu (v kartě se posouvá seznam)
      if (Date.now() - t0 < 400 || (ev.target.closest(".cel-c") && !ev.target.closest(".cel-ok"))) return;
      celClose();
    });
    document.body.appendChild(el);
    celEl = el;
    const L = el.querySelector(".cel-l"),
      M = el.querySelector(".cel-more");
    // „Posuň pro další“: místo drží, dokud se seznam dá posouvat (jinak by
    // seznam na konci poskočil), jen zneviditelní
    const more = () => {
      if (L.scrollHeight - L.clientHeight > 4) {
        M.hidden = false;
      }
      const m = L.scrollHeight - L.scrollTop - L.clientHeight > 4;
      L.classList.toggle("more", m);
      L.classList.toggle("up", L.scrollTop > 4);
      M.style.visibility = m ? "" : "hidden";
    };
    L.addEventListener("scroll", more);
    requestAnimationFrame(more);
    setTimeout(more, 500);
    if (S.cfg.recSnd !== "off") {
      celSound(gold);
    }
  }
  function celClose(now) {
    const el = celEl;
    if (!el) return;
    celEl = null;
    if (now || matchMedia("(prefers-reduced-motion:reduce)").matches) {
      el.remove();
    } else {
      el.classList.add("out");
      setTimeout(() => el.remove(), 250);
    }
  }
  // zvuky oslavy: plná podoba pro zlatou, kratší a tišší pro stříbrnou
  let celOut = null;
  function celTone(t, f, s, d, o) {
    // tón f Hz od s na d s; o = {type, vol, att, vib, lp, lpTo, hold}
    o = o || {};
    const a = audioCtx,
      g = a.createGain(),
      osc = a.createOscillator();
    osc.type = o.type || "triangle";
    osc.frequency.value = f;
    let out = osc;
    if (o.lp) {
      const fl = a.createBiquadFilter();
      fl.type = "lowpass";
      fl.frequency.setValueAtTime(o.lp, t + s);
      if (o.lpTo) {
        fl.frequency.linearRampToValueAtTime(o.lpTo, t + s + Math.min(0.25, d));
      }
      osc.connect(fl);
      out = fl;
    }
    if (o.vib) {
      const l = a.createOscillator(),
        lg = a.createGain();
      l.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, t + s);
      lg.gain.linearRampToValueAtTime(f * 0.012, t + s + 0.35);
      l.connect(lg);
      lg.connect(osc.frequency);
      l.start(t + s);
      l.stop(t + s + d + 0.05);
    }
    const v = o.vol || 0.12,
      att = o.att || 0.012;
    g.gain.setValueAtTime(0, t + s);
    g.gain.linearRampToValueAtTime(v, t + s + att);
    if (o.hold) {
      g.gain.setValueAtTime(v, t + s + d - 0.18);
      g.gain.linearRampToValueAtTime(0.0001, t + s + d);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0005, t + s + d);
    }
    out.connect(g);
    g.connect(celOut);
    osc.start(t + s);
    osc.stop(t + s + d + 0.05);
  }
  const NT = {
    G4: 392,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
    A5: 880,
    B5: 987.77,
    C6: 1046.5,
    D6: 1174.66,
    E6: 1318.51,
    G6: 1567.98,
    A6: 1760,
    C7: 2093,
  };
  const CEL_SOUNDS = [
    {
      id: "fanfara",
      name: "Fanfára",
      play(t, gold) {
        const n = gold
          ? [
              ["C5", 0, 0.11],
              ["E5", 0.11, 0.11],
              ["G5", 0.22, 0.11],
              ["C6", 0.36, 0.7],
            ]
          : [
              ["G5", 0, 0.12],
              ["C6", 0.14, 0.45],
            ];
        for (const [k, s, d] of n) {
          celTone(t, NT[k], s, d, { vol: gold ? 0.16 : 0.1 });
          celTone(t, NT[k] * 2, s, d, { type: "sine", vol: gold ? 0.04 : 0.025 });
        }
      },
    },
    {
      id: "tada",
      name: "Ta-dá",
      play(t, gold) {
        const br = { type: "sawtooth", lp: 700, lpTo: 2600, att: 0.03 };
        if (gold) {
          for (const k of ["G4", "B4", "D5"]) {
            celTone(t, NT[k], 0, 0.14, Object.assign({ vol: 0.06 }, br));
          }
        }
        const s = gold ? 0.17 : 0,
          d = gold ? 1.25 : 0.6,
          v = gold ? 0.07 : 0.045;
        for (const k of ["C5", "E5", "G5"].concat(gold ? ["C6"] : [])) {
          celTone(t, NT[k], s, d, Object.assign({ vol: v, hold: true, vib: gold }, br));
          celTone(t, NT[k] * 1.004, s, d, Object.assign({ vol: v * 0.6, hold: true }, br));
        }
      },
    },
    {
      id: "zvonky",
      name: "Zvonkohra",
      play(t, gold) {
        const n = gold
          ? [
              ["E6", 0],
              ["G6", 0.09],
              ["C7", 0.18],
              ["G6", 0.34],
              ["C7", 0.42],
            ]
          : [
              ["G6", 0],
              ["C7", 0.1],
            ];
        for (const [k, s] of n) {
          const f = NT[k],
            d = gold ? 1.3 : 0.8,
            v = gold ? 0.09 : 0.06;
          celTone(t, f, s, d, { type: "sine", vol: v, att: 0.003 });
          celTone(t, f * 2.76, s, d * 0.5, { type: "sine", vol: v * 0.35, att: 0.003 });
          celTone(t, f * 5.4, s, d * 0.25, { type: "sine", vol: v * 0.15, att: 0.003 });
        }
      },
    },
    {
      id: "levelup",
      name: "Level up",
      play(t, gold) {
        const n = gold ? ["C5", "E5", "G5", "C6", "E6", "G6", "C7"] : ["G5", "C6", "E6", "G6"];
        n.forEach((k, i) =>
          celTone(t, NT[k], i * 0.055, i === n.length - 1 ? 0.4 : 0.07, {
            type: "square",
            lp: 3200,
            vol: gold ? 0.06 : 0.04,
            att: 0.004,
          }),
        );
      },
    },
    {
      id: "mince",
      name: "Mince",
      play(t, gold) {
        const o = { type: "square", lp: 4000, vol: gold ? 0.06 : 0.04, att: 0.003 };
        celTone(t, NT.B5, 0, 0.08, o);
        celTone(t, NT.E6, 0.08, gold ? 0.55 : 0.35, o);
        if (gold) {
          celTone(t, NT.B5, 0.3, 0.08, o);
          celTone(t, NT.E6 * 1.5, 0.38, 0.6, o);
        }
      },
    },
    {
      id: "harfa",
      name: "Harfa",
      play(t, gold) {
        const sc = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6", "G6", "A6", "C7"],
          n = gold ? sc : sc.slice(5);
        n.forEach((k, i) => celTone(t, NT[k], i * 0.035, 0.9, { vol: gold ? 0.07 : 0.05, att: 0.004 }));
        if (gold) {
          for (const k of ["C6", "E6", "G6"]) {
            celTone(t, NT[k], n.length * 0.035 + 0.05, 1.2, { vol: 0.06, att: 0.004 });
          }
        }
      },
    },
  ];
  function celSound(gold, id) {
    const x = CEL_SOUNDS.find((x) => x.id === (id || S.cfg.recSnd)) || CEL_SOUNDS[0];
    try {
      audioUnlock();
      if (!audioCtx) return;
      if (!celOut) {
        celOut = audioCtx.createDynamicsCompressor();
        celOut.connect(audioCtx.destination);
      }
      x.play(audioCtx.currentTime + 0.05, gold);
    } catch (e) {}
  }
  /* Nastavení → Rekordy */
  function recSettings() {
    const c = S.cfg;
    let h = '<section class="sec"><div class="sec-h"><h2>Oslava rekordu</h2></div><div class="card stack">';
    h += `<div class="xs muted">
      Při novém rekordu vyskočí medaile se všemi rekordy. Zlatá za max. zátěž, odhad 1RM, opakování,
      výdrž, vzdálenost a tempo, stříbrná za objem, nejlepší sérii a celkový čas nebo vzdálenost.
    </div>`;
    h +=
      `<label class="switch">
      <input type="checkbox" data-act="recCelEx" ${c.recCelEx ? "checked" : ""}>
      <span><b>Oslava po dokončení cviku</b><br><span class="xs muted">Po odškrtnutí poslední pracovní
          série cviku. Když ji vypneš, ukáže se po sérii s rekordem jen krátká hláška nahoře.</span>` +
      `</span>
    </label>`;
    h += `<label class="switch">
      <input type="checkbox" data-act="recCelW" ${c.recCelW ? "checked" : ""}>
      <span><b>Oslava po uložení tréninku</b><br><span class="xs muted">Nad souhrnem tréninku, se všemi
          rekordy po cvicích.</span></span>
    </label>`;
    if (c.recCelEx || c.recCelW) {
      h += `<div class="stack" style="gap:6px">
        <span>Zvuk oslavy <span class="xs muted">· hraje přes hlasitost médií</span></span>
        <div class="spick">
          ${[["off", "Vypnuto"]]
            .concat(CEL_SOUNDS.map((x) => [x.id, x.name]))
            .map(
              ([id, l]) =>
                `<div class="spr">
                  <button class="spr-l" data-act="recSnd" data-v="${id}"
                      aria-pressed="${c.recSnd === id}">
                    <span class="rad"></span>
                    ${l}
                  </button>
                  ${
                    id === "off"
                      ? ""
                      : `<button class="spr-p" data-act="recSndPlay" data-v="${id}"
                          aria-label="Přehrát zvuk ${l}">
                        ▶
                      </button>`
                  }
                </div>`,
            )
            .join("")}
        </div>
      </div>`;
      h += '<button class="btn block" data-act="recTry">Vyzkoušet</button>';
    }
    return `${h}</div></section>`;
  }

  /* ---------- vykreslení: hlavní smyčka, horní lišta, záložky ---------- */
  const CK = {}; // posun posuvných nabídek podle klíče
  function saveChipScroll(root) {
    (root || document).querySelectorAll("[data-ck]").forEach((el) => {
      CK[el.dataset.ck] = el.scrollLeft;
    });
  }
  function restoreChipScroll(root) {
    (root || document).querySelectorAll("[data-ck]").forEach((el) => {
      const v = CK[el.dataset.ck];
      if (v != null) {
        el.scrollLeft = v;
      }
      const cur = el.querySelector('[aria-pressed="true"]');
      if (!cur) return;
      const l = cur.offsetLeft,
        r = l + cur.offsetWidth;
      if (l < el.scrollLeft + 4 || r > el.scrollLeft + el.clientWidth - 4) {
        el.scrollLeft = Math.max(0, l - (el.clientWidth - cur.offsetWidth) / 2);
      }
    });
  }
  let rq = false;
  function scheduleRender() {
    if (rq) return;
    rq = true;
    requestAnimationFrame(() => {
      rq = false;
      render();
    });
  }
  /* hláška nahoře; s funkcí undo má tlačítko „Vrátit“ (F2-03, akce undo), které platí,
     jen dokud je hláška vidět (UNDO_MS) */
  const UNDO_MS = 5000;
  function toast(msg, cls, undo) {
    const r = document.getElementById("toastRoot");
    toast.undo = undo || null;
    r.innerHTML =
      `<div class="toast${cls ? " " + cls : ""}${undo ? " has-undo" : ""}" role="status">` +
      `<span>${esc(msg)}</span>` +
      `${undo ? '<button class="toast-undo" data-act="undo">Vrátit</button>' : ""}` +
      `</div>`;
    clearTimeout(toast.t);
    toast.t = setTimeout(
      () => {
        r.innerHTML = "";
        toast.undo = null;
      },
      undo ? UNDO_MS : 2600,
    );
  }

  function renderTabs() {
    const t = [
      ["train", "Trénink"],
      ["hist", "Historie"],
      ["ex", "Cviky"],
      ["stats", "Statistiky"],
      ["body", "Tělo"],
      ["set", "Nastavení"],
    ];
    // stránka cviku patří pod Statistiky, jen když se na ni přišlo odtamtud, jinak pod Cviky
    const cur = S.route === "exd" ? (S.prevRoute === "stats" ? "stats" : "ex") : S.route;
    document.getElementById("tabs").innerHTML = t
      .map(
        ([k, l]) =>
          `<button data-act="tab" data-v="${k}" aria-current="${cur === k}">${IC[k]}` +
          `${k === "train" && S.active && S.route !== "train" ? '<span class="dot"></span>' : ""}${l}` +
          `</button>`,
      )
      .join("");
  }
  /* akce v nadpisu sekce: ikona v rámečku malého tlačítka, bez textu (label = popis pro čtečku obrazovky);
     v = data-v */
  function icoBtn(act, icon, label, v) {
    return `<button class="btn sm ico" data-act="${act}"${v ? ` data-v="${esc(v)}"` : ""}
        aria-label="${esc(label)}">${IC[icon]}</button>`;
  }
  function topbar(title, sub, left, subCls) {
    return `${testBar()}
    <header class="top">
      ${left || ""}
      <h1${String(title).length > 18 ? ' class="long"' : ""}>
        ${esc(title)}${sub ? `<small${subCls ? ` class="${subCls}"` : ""}>${esc(sub)}</small>` : ""}
      </h1>
      <span class="sync" id="sync"></span>
    </header>`;
  }
  function render() {
    const app = document.getElementById("app");
    const y = window.scrollY;
    let h = "";
    try {
      if (S.route === "edit" && S.editDraft) {
        h = vEditor(S.editDraft);
      } else if (S.route === "train") {
        h = S.active ? vEditor(S.active) : vHome();
      } else if (S.route === "hist") {
        h = vHist();
      } else if (S.route === "ex") {
        h = vExList();
      } else if (S.route === "stats") {
        h = vStats();
      } else if (S.route === "exd") {
        h = vExDetail();
      } else if (S.route === "body") {
        h = vBody();
      } else if (S.route === "set") {
        h = vSettings();
      } else {
        S.route = "train";
        h = vHome();
      }
    } catch (err) {
      console.error(err);
      h = `${topbar("Chyba")}<div class="banner">${esc(err.message)}</div>`;
    }
    const focusId = document.activeElement && document.activeElement.id;
    app.innerHTML = h;
    renderTabs();
    updSync();
    drawCharts();
    renderRest();
    restoreChipScroll(app);
    galRestore(app);
    if (focusId) {
      const f = document.getElementById(focusId);
      if (f && f.tagName === "INPUT" && f.type !== "checkbox") {
        f.focus();
        try {
          const l = f.value.length;
          f.setSelectionRange(l, l);
        } catch (e) {}
      }
    }
    if (render.keepScroll) {
      window.scrollTo(0, y);
    }
    if (render.restoreY != null) {
      window.scrollTo(0, render.restoreY);
      render.restoreY = null;
      render.toEx = false;
    }
    // F1-11: návrat do rozdělaného tréninku z jiné záložky = na naposledy změněný cvik
    if (render.toEx && (S.route !== "train" || S.active)) {
      render.toEx = false;
      if (S.route === "train" && S.active) {
        edScroll(S.active);
      }
    }
    render.keepScroll = true;
    navEnsure();
  }
  function go(route) {
    if (route !== "exd" && route !== "edit") {
      S.nav = [];
    }
    if (route === "train" && S.route !== "train") {
      render.toEx = true;
    }
    if (route === "exd") {
      galReset();
    } // nově otevřená stránka cviku začíná postavou (F2-05)
    S.route = route;
    const base = (r) => (r === "edit" || r === "exd" ? "train" : r);
    lsSet("route", route === "exd" ? base(S.prevRoute || "ex") : base(route));
    render.keepScroll = false;
    scheduleRender();
    window.scrollTo(0, 0);
  }

  /* ---------- ÚVODNÍ OBRAZOVKA (záložka Trénink bez rozdělaného tréninku) ---------- */
  function curGym() {
    return S.selGym || S.cfg.defaultGymId || (S.cfg.gyms[0] && S.cfg.gyms[0].id) || null;
  }
  function vHome() {
    const { all } = derive();
    const now = Date.now();
    const w30 = all.filter((w) => w.start > now - 30 * DAY);
    const weekStart = startOfWeek(now);
    const thisWeek = all.filter((w) => w.start >= weekStart).length;
    const vol30 = w30.reduce((a, w) => a + wVol(w), 0);
    let h = topbar(
      "Workout deník",
      new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" }),
    );
    if (Store.state === "off") {
      h += `<div class="banner">
        Úložiště v prohlížeči teď není dostupné. Záznamy se drží v telefonu a uloží se, až bude znovu
        dostupné.
      </div>`;
    }
    h += backupBanner();
    h +=
      `<div class="kpis">
      <div class="kpi"><b>${thisWeek}</b><span>Tento týden</span></div>
      <div class="kpi"><b>${w30.length}</b><span>Za 30 dní</span></div>
      <div class="kpi">
        <b>${vol30 >= 1000 ? fmtKg(Math.round(vol30 / 100) / 10) + " t" : fmtInt(vol30) + " kg"}</b>` +
      `<span>Objem
          30 dní</span>
      </div>
    </div>`;
    h += `<section class="sec">
      <div class="sec-h"><h2>Kde dnes cvičíš</h2></div>
      <div class="chips" data-ck="selGym">
        ${S.cfg.gyms
          .map(
            (g) =>
              `<button class="chip" data-act="selGym" data-v="${g.id}"
                  aria-pressed="${curGym() === g.id}">
                <span class="sw" style="background:${gymColor(g.id)}"></span>
                ${esc(g.name)}
              </button>`,
          )
          .join("")}
      </div>
    </section>`;
    h +=
      `<section class="sec startbar">
      <button class="btn primary block" data-act="startEmpty">
        ${IC.plus.replace(
          "<svg",
          '<svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2.4"',
        )} ` +
      `Začít prázdný trénink
      </button>
    </section>`;
    h += vHomeTpls(all);
    return h;
  }
  /* ---------- ŠABLONY PODLE FITKA (F2-02) ----------
     Šablona má t.gyms = seznam fitek, kam patří ([] = do všech fitek, i u starších šablon). Na úvodní
     obrazovce nahoře šablony vybraného fitka (curGym) a šablony bez fitka, ostatní až po tlačítku
     „Ostatní šablony“ (jako „Zobrazit další“ v Historii; tplOther, po otevření appky a změně fitka
     znovu skryté). Smazané fitko se ze šablon odebere (delGym), fitka, která už neexistují, se navíc
     nikdy nepočítají (tplGyms). */
  let tplOther = false; // ukázané ostatní šablony (klepnutí na tlačítko „Ostatní šablony“)
  // doplní šablonám seznam fitek (starší šablony ho nemají); items = {id: šablona}
  function tplNorm(items) {
    const out = {};
    for (const [id, t] of Object.entries(items || {})) {
      if (!t || typeof t !== "object") continue;
      const gyms = Array.isArray(t.gyms) ? t.gyms.filter((g) => typeof g === "string") : [];
      out[id] = Object.assign({}, t, { gyms: [...new Set(gyms)] });
    }
    return out;
  }
  // fitka šablony, jen ta, která ještě existují (v pořadí fitek v Nastavení)
  const tplGyms = (t) => S.cfg.gyms.filter((g) => (t.gyms || []).includes(g.id)).map((g) => g.id);
  // patří šablona do fitka gymId? (bez fitka = do všech)
  function tplHere(t, gymId) {
    const gyms = tplGyms(t);
    return !gyms.length || gyms.includes(gymId);
  }
  // šablony na úvodní obrazovce: šablony vybraného fitka, pod nimi ostatní po tlačítku „Ostatní šablony“
  // šablony v ručním pořadí ([id, šablona]; mění se přetažením, F2-07)
  function tplSorted() {
    return Object.entries(S.templates).sort(
      (a, b) => (a[1].order || 0) - (b[1].order || 0) || a[1].name.localeCompare(b[1].name),
    );
  }
  // pořadí nové šablony: za poslední (i po přetažení a smazání šablon)
  function tplNextOrder(items) {
    return Object.values(items).reduce((m, t) => Math.max(m, (t.order || 0) + 1), 0);
  }
  function vHomeTpls(all) {
    const gymId = curGym();
    const tpls = tplSorted();
    const here = tpls.filter(([, t]) => tplHere(t, gymId));
    const other = tpls.filter(([, t]) => !tplHere(t, gymId));
    let h = `<section class="sec">
        <div class="sec-h">
          <h2>Šablony${gymId && S.cfg.gyms.length > 1 ? " · " + esc(gymName(gymId)) : ""}</h2>
          <div class="sec-btns">
            ${tpls.length > 1 ? icoBtn("tplOrder", "order", "Změnit pořadí šablon") : ""}
            ${icoBtn("newTpl", "plus", "Nová šablona")}
          </div>
        </div>
        <div class="stack">`;
    if (!tpls.length) {
      h += '<div class="empty">Zatím žádné šablony. Vytvoř si třeba Push / Pull / Legs.</div>';
    } else if (!here.length) {
      h += '<div class="empty">Pro toto fitko zatím žádné šablony.</div>';
    }
    for (const [id, t] of here) {
      h += tplCard(id, t, all, gymId);
    }
    // ostatní šablony až po tlačítku (jako „Zobrazit další“ v Historii), bez šablon pro toto fitko hned;
    // na místě tlačítka pak nadpis
    if (other.length && !tplOther && here.length) {
      h += '<button class="btn block" data-act="tplOther">Ostatní šablony</button>';
    }
    h += "</div></section>";
    if (!other.length || (!tplOther && here.length)) return h;
    h += `<section class="sec">
        <div class="sec-h"><h2>Ostatní šablony</h2></div>
        <div class="stack">`;
    for (const [id, t] of other) {
      h += tplCard(id, t, all, null);
    }
    h += "</div></section>";
    return h;
  }
  // výběr fitek v úpravě šablony (víc najednou, žádné = všechna fitka)
  function tplGymPick(d) {
    const gyms = d.gyms || [];
    return `<div class="stack" style="gap:6px">
        <div class="small" style="font-weight:600">Fitka</div>
        <div class="chips" data-ck="tplGym">
          ${S.cfg.gyms
            .map(
              (g) =>
                `<button class="chip" data-act="tplGym" data-v="${g.id}" aria-pressed="${gyms.includes(g.id)}">
                  <span class="sw" style="background:${gymColor(g.id)}"></span>
                  ${esc(g.name)}
                </button>`,
            )
            .join("")}
        </div>
        <p class="xs muted" style="margin:0">
          ${
            gyms.length
              ? "Šablona se nahoře ukáže jen ve vybraných fitkách, jinde bude mezi ostatními."
              : "Žádné fitko nevybrané: šablona se nahoře ukáže ve všech fitkách."
          }
        </p>
      </div>`;
  }
  /* karta šablony; gymId = šablona vybraného fitka: „naposledy“ přednostně z tohoto fitka (bez názvu fitka),
     jinak (i u ostatních šablon) poslední běh kdekoli s názvem fitka */
  function tplCard(id, t, all, gymId) {
    const runs = all.filter((w) => sameRun({ tplId: id, title: t.name }, w));
    const lastHere = gymId ? runs.find((w) => w.gymId === gymId) : null;
    const last = lastHere || runs[0];
    const lastTxt = !last
      ? ""
      : " · naposledy " + fmtDateS(last.start) + (lastHere ? "" : " (" + esc(gymName(last.gymId)) + ")");
    // u ostatních šablon, kam patří
    const gyms = gymId ? [] : tplGyms(t);
    return `<div class="card tpl">
        <div class="grow">
          <h3>${esc(t.name)}</h3>
          <p>${esc((t.items || []).map((i) => exName(i.exId)).join(", "))}</p>
          ${
            gyms.length
              ? `<p class="xs tpl-gyms">
                ${gyms
                  .map(
                    (g) =>
                      `<span class="pill"><span class="sw" style="background:${gymColor(g)}"></span>` +
                      `${esc(gymName(g))}</span>`,
                  )
                  .join(" ")}
              </p>`
              : ""
          }
          <p class="xs">${(t.items || []).length} cviků${lastTxt}</p>
        </div>
        <div class="stack" style="gap:6px">
          <button class="btn sm primary" data-act="startTpl" data-v="${id}">Začít</button>
          <button class="btn sm" data-act="editTpl" data-v="${id}">Upravit</button>
        </div>
      </div>`;
  }
  function startOfWeek(t) {
    const d = new Date(t);
    d.setHours(0, 0, 0, 0);
    const wd = (d.getDay() + 6) % 7;
    return d.getTime() - wd * DAY;
  }
  function wVol(w) {
    let v = 0;
    for (const e of w.ex || []) {
      const k = kindOf(e.exId);
      for (const s of e.sets) {
        if (isWork(s.t)) {
          v += setVol(k, s, w.start);
        }
      }
    }
    return v;
  }
  function wSets(w) {
    let n = 0;
    for (const e of w.ex || []) {
      for (const s of e.sets) {
        if (isWork(s.t)) {
          n++;
        }
      }
    }
    return n;
  }

  /* ---------- EDITOR (rozdělaný trénink / úprava uloženého tréninku / šablona) ---------- */
  // série do šablony z uloženého tréninku (i čas a vzdálenost)
  function tplSet(s) {
    return { t: s.t, kg: s.kg || 0, reps: s.reps || 0, sec: s.sec || 0, km: s.km || 0 };
  }
  function newSetFrom(s) {
    return {
      t: s ? s.t : "n",
      kg: s && s.kg ? numStr(s.kg) : "",
      reps: s && s.reps ? String(s.reps) : "",
      sec: s && s.sec ? (typeof s.sec === "string" ? s.sec : fmtSec(s.sec)) : "",
      km: s && s.km ? numStr(s.km) : "",
      done: false,
    };
  }
  // nový cvik v tréninku: série podle šablony, jinak podle minula v tomto fitku;
  // hodnoty zůstávají prázdné (šedé předvyplnění, F1-01)
  function exEntryFor(exId, gymId, fromTplSets) {
    const last = lastSession(exId, gymId);
    let sets;
    if (fromTplSets && fromTplSets.length) {
      // hodnoty ze šablony jen u cviku, který nikdy necvičil
      const never = !lastSession(exId, gymId, null, 0, true);
      sets = fromTplSets.map((x) => {
        const n = newSetFrom({ t: x.t || "n" });
        if (never) {
          const ph = {};
          for (const f of HINT_F) {
            if (+x[f] > 0) {
              ph[f] = +x[f];
            }
          }
          if (Object.keys(ph).length) {
            n.ph = ph;
          }
        }
        return n;
      });
    } else if (last) {
      sets = last.e.sets.map((x) => newSetFrom({ t: x.t }));
    } else {
      sets = [newSetFrom(null), newSetFrom(null), newSetFrom(null)];
    }
    return { k: uid("e"), exId, note: "", sets };
  }
  function startWorkout(tplId) {
    const gymId = curGym();
    const t = tplId && S.templates[tplId];
    const d = {
      mode: "active",
      id: null,
      title: t ? t.name : defaultTitle(),
      gymId,
      start: Date.now(),
      tplId: tplId || null,
      ex: [],
    };
    if (t) {
      for (const it of t.items || []) {
        d.ex.push(Object.assign(exEntryFor(it.exId, gymId, it.sets), ssOf(it)));
      }
      ssNorm(d.ex);
    }
    S.active = d;
    saveActive();
    restStop();
    go("train");
  }

  /* ---------- SUPERSÉRIE (F4-05) ----------
     Cviky v supersérii mají stejnou značku e.ss (rozdělaný trénink, uložený trénink i šablona) a stojí
     v seznamu hned za sebou. Supersérie = aspoň 2 sousední cviky se stejnou značkou (ssRun); osamělá
     značka se nebere v úvahu a ssNorm ji zahodí. Vytváří se v menu cviku (ssOn = s dalším cvikem,
     ssOff = zrušit), přenáší se ze šablony, přes Cvičit znovu, Uložit jako šablonu i Aktualizovat šablonu.
     Série se párují podle druhu jako u Minule (setGrp: zahřívací se zahřívacími, ostatní s pracovními)
     a podle pořadí. Po ✓ série rozhodne ssRest o pauze:
     - dvojice v jiném cviku supersérie ještě není hotová → bez pauzy, jen hláška „Další: …“,
     - kolo je hotové → pracovní kolo S.cfg.restSs (Časovač po pracovní supersérii), zahřívací výchozí,
     - série nemá v jiném cviku dvojici (série navíc) → výchozí časovač. */
  // značka supersérie cviku pro Object.assign (prázdný objekt = cvik není v supersérii)
  const ssOf = (e) => (e && e.ss ? { ss: e.ss } : {});
  // rozsah [od, do] supersérie, do které patří cvik na místě i (null = není v supersérii)
  function ssRun(list, i) {
    const tag = list[i] && list[i].ss;
    if (!tag) return null;
    let from = i;
    let to = i;
    while (from > 0 && list[from - 1].ss === tag) {
      from--;
    }
    while (to < list.length - 1 && list[to + 1].ss === tag) {
      to++;
    }
    return to > from ? [from, to] : null;
  }
  // uklidí značky: osamělý cvik ze supersérie vypadne, rozdělená supersérie dostane pro další část novou
  function ssNorm(list) {
    const seen = new Set();
    let i = 0;
    while (i < list.length) {
      const tag = list[i].ss;
      let to = i;
      while (tag && to < list.length - 1 && list[to + 1].ss === tag) {
        to++;
      }
      if (tag && to === i) {
        delete list[i].ss;
      } else if (tag && seen.has(tag)) {
        const fresh = uid("s");
        for (let k = i; k <= to; k++) {
          list[k].ss = fresh;
        }
      }
      if (tag) {
        seen.add(tag);
      }
      i = to + 1;
    }
    return list;
  }
  // spojí cvik i s cvikem pod ním (i s jeho případnou supersérií)
  function ssLink(list, i) {
    const a = list[i];
    const b = list[i + 1];
    if (!a || !b) return;
    const tag = a.ss || b.ss || uid("s");
    const other = b.ss && b.ss !== tag ? b.ss : null;
    for (const e of list) {
      if (other && e.ss === other) {
        e.ss = tag;
      }
    }
    a.ss = tag;
    b.ss = tag;
    ssNorm(list);
  }
  // zruší celou supersérii, do které patří cvik i
  function ssUnlink(list, i) {
    const run = ssRun(list, i);
    if (!run) return;
    for (let k = run[0]; k <= run[1]; k++) {
      delete list[k].ss;
    }
  }
  // po přetažení cviku na místo k: mezi dvěma cviky stejné supersérie se k ní přidá, jinak ze své vypadne
  function ssMoved(list, k) {
    const e = list[k];
    const prev = list[k - 1];
    const next = list[k + 1];
    if (prev && next && prev.ss && prev.ss === next.ss) {
      e.ss = prev.ss;
    } else if (e.ss && !(prev && prev.ss === e.ss) && !(next && next.ss === e.ss)) {
      delete e.ss;
    }
    ssNorm(list);
  }
  // štítek cviku v supersérii „supersérie 1/2“ ("" = cvik není v supersérii)
  function ssLabel(list, i) {
    const run = ssRun(list, i);
    return run ? `supersérie ${i - run[0] + 1}/${run[1] - run[0] + 1}` : "";
  }
  // štítek jako pill do hlavičky karty cviku
  function ssPill(list, i) {
    const label = ssLabel(list, i);
    return label ? `<span class="pill ssp">${esc(label)}</span>` : "";
  }
  // karty cviků (cards[i] patří list[i]); karty jedné supersérie obalí kvůli menší mezeře mezi nimi.
  // Proužek vlevo má každá karta sama (třída ss-on), rozměry karty se nemění.
  function ssWrap(list, cards) {
    let h = "";
    for (let i = 0; i < list.length; i++) {
      const run = ssRun(list, i);
      if (!run) {
        h += cards[i];
        continue;
      }
      h += `<div class="ssg">${cards.slice(run[0], run[1] + 1).join("")}</div>`;
      i = run[1];
    }
    return h;
  }
  // pauza po ✓ série j cviku i: "none" = kolo supersérie pokračuje, "ss" = časovač po pracovní supersérii,
  // "def" = výchozí časovač
  function ssRest(d, i, j) {
    const run = ssRun(d.ex, i);
    if (!run) return "def";
    const grp = setGrp(d.ex[i].sets[j].t);
    const pos = d.ex[i].sets.slice(0, j).filter((s) => setGrp(s.t) === grp).length;
    const pairs = [];
    for (let k = run[0]; k <= run[1]; k++) {
      if (k === i) continue;
      const pair = d.ex[k].sets.filter((s) => setGrp(s.t) === grp)[pos];
      if (pair) {
        pairs.push(pair);
      }
    }
    if (!pairs.length) return "def";
    if (pairs.some((s) => !s.done)) return "none";
    return grp === "w" ? "def" : "ss";
  }

  /* ---------- CVIČIT ZNOVU (F2-01) ----------
     Nový trénink podle tréninku z historie: stejný název a cviky, počet a druh sérií z něj,
     hodnoty jen šedě z minula v zvoleném fitku (jako u šablony, F1-01). Poznámky ke cvikům jen
     ve stejném fitku. Vazba na šablonu zůstane (když šablona ještě existuje), „Aktualizovat šablonu“
     je ale nezaškrtnuté (d.again).
     d.again = id původního tréninku, uloží se jako w.againOf (souhrn F3-03 s ním pak porovnává). */
  let again = null; // {w, gym}: otevřené okno Cvičit znovu
  const againEx = (w) => (w.ex || []).filter((e) => S.exLib[e.exId]);
  function againInfo() {
    const w = again.w,
      n = (w.ex || []).length - againEx(w).length;
    return (
      (again.gym !== w.gymId
        ? `<p class="small muted" style="margin:0">
          Trénink byl v ${esc(gymName(w.gymId))}. Hodnoty z minula se vezmou z vybraného fitka.
        </p>`
        : "") +
      (n
        ? `<p class="small muted" style="margin:0">
          ${n} ${plural(n, "cvik už v appce není", "cviky už v appce nejsou", "cviků už v appce není")}` +
          `${n === 1 ? ", vynechá se." : ", vynechají se."}
        </p>`
        : "")
    );
  }
  function sheetAgain(w) {
    again = { w, gym: S.cfg.gyms.some((g) => g.id === curGym()) ? curGym() : w.gymId };
    const ex = againEx(w);
    const b =
      `<p style="margin:0">
      ${ex.length} ${plural(ex.length, "cvik", "cviky", "cviků")}: ` +
      `${esc(ex.map((e) => exName(e.exId)).join(", "))}
    </p>
    <div class="small" style="font-weight:600">Kde dnes cvičíš</div>
    ${gymChips("againGym", again.gym, false)}
    <div class="stack" id="againInfo" style="gap:6px">${againInfo()}</div>`;
    openSheet(
      "Cvičit znovu: " + w.title,
      b,
      `<button class="btn grow" data-act="againBack">Zpět</button>
      <button class="btn primary grow" data-act="againOk">Začít</button>`,
      false,
      { lv: wOpen && wOpen.nav.lv ? wOpen.nav.lv + 1 : 2, back: wBack(wOpen) },
    );
  }
  function startAgain() {
    const w = again.w,
      gymId = again.gym;
    const t = w.tplId && S.templates[w.tplId];
    const d = {
      mode: "active",
      id: null,
      title: w.title,
      gymId,
      start: Date.now(),
      tplId: t ? w.tplId : null,
      again: w.id,
      ex: [],
    };
    for (const e of againEx(w)) {
      const x = Object.assign(exEntryFor(e.exId, gymId, e.sets), ssOf(e));
      if (e.note && gymId === w.gymId) {
        x.note = e.note;
      }
      d.ex.push(x);
    }
    ssNorm(d.ex); // cvik, který už v appce není, mohl supersérii rozdělit
    again = null;
    S.selGym = gymId;
    S.active = d;
    saveActive();
    restStop();
    closeSheet();
    go("train");
  }
  function defaultTitle() {
    const h = new Date().getHours();
    return h < 11 ? "Ranní trénink" : h < 17 ? "Odpolední trénink" : "Večerní trénink";
  }
  const END_PAD = 3 * 60000; // pár minut po poslední sérii
  function lastSetAt(d) {
    let t = 0;
    for (const e of d.ex) {
      for (const s of e.sets) {
        if (s.done && s.at > t) {
          t = s.at;
        }
      }
    }
    return t || null;
  }
  function suggestEnd(d) {
    const t = lastSetAt(d);
    const now = Date.now();
    return t ? Math.min(now, t + END_PAD) : now;
  }
  function finEndValue(d) {
    const el = document.getElementById("fin-end");
    if (!el || !el.value) return null;
    const [h, m] = el.value.split(":").map(Number);
    const x = new Date(d.start);
    x.setHours(h, m, 0, 0);
    let t = x.getTime();
    if (t < d.start - 60000) {
      t += DAY;
    }
    return t;
  }
  function finInfo(d, end, lastAt) {
    return `Délka <b>${fmtDur(end - d.start)}</b>${
      lastAt
        ? " · poslední série v " + fmtTime(lastAt) + ", navrženo +3 min"
        : " · bez časů sérií, navržen aktuální čas"
    }`;
  }
  function durLabel(w) {
    const dur = fmtDur((w.end || w.start) - w.start);
    return w.endOrig
      ? `<span title="Délka upravena ručně, původně ${fmtDur(w.endOrig - w.start)}">${dur} ` +
          `<span class="edited">✎ ` +
          `upraveno</span></span>`
      : `<span>${dur}</span>`;
  }
  function curDraft() {
    return S.route === "edit" ? S.editDraft : S.active;
  }
  function touchDraft() {
    const d = curDraft();
    if (d && d.mode === "active") {
      saveActive();
      if (S.restEnd && !S.restFired) {
        restPost();
      }
    }
  } // restPost: aktuální „Další:“ v oznámení

  /* ---------- NÁVRAT DO TRÉNINKU (F1-11) ----------
     Poslední změněný cvik rozdělaného tréninku (klíč e.k v Local "edLast"). Po návratu z jiné záložky
     (i po znovuotevření appky) se stránka posune tak, aby karta cviku začínala hned pod horní lištou. */
  function edMark(d, e) {
    if (d && d.mode === "active" && e && e.k) {
      lsSet("edLast", e.k);
    }
  }
  function edScroll(d) {
    const i = d.ex.findIndex((e) => e.k === lsGet("edLast", ""));
    if (i < 0) return;
    const card = document.querySelector(`article.exc[data-i="${i}"]`);
    if (!card) return;
    const bar = document.querySelector("header.top");
    const under = bar ? bar.offsetHeight + (parseFloat(getComputedStyle(bar).top) || 0) : 0;
    window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - under - 8);
  }

  /* ---------- VRÁTIT CVIK (F2-03) ----------
     Po odebrání nebo nahrazení cviku (šablona, rozdělaný i ukončený trénink) nabídne hláška „Vrátit“.
     Vrátí původní cvik se sériemi a poznámkou na stejné místo (u nahrazení místo nového cviku newK).
     Platí jen pro stejnou úpravu, která je pořád otevřená. Smazání série „Vrátit“ nemá.
     ssBefore = [[cvik, značka supersérie]] před odebráním: Vrátit obnoví i supersérii (F4-05). */
  function exUndoOffer(d, idx, entry, newK, msg, ssBefore) {
    toast(msg, "", () => {
      if (curDraft() !== d) {
        toast("Cvik už nejde vrátit.");
        return;
      }
      const at = newK ? d.ex.findIndex((e) => e.k === newK) : -1;
      if (at >= 0) {
        d.ex[at] = entry;
      } else {
        d.ex.splice(Math.min(idx, d.ex.length), 0, entry);
      }
      for (const [e, tag] of ssBefore || []) {
        if (tag) {
          e.ss = tag;
        } else {
          delete e.ss;
        }
      }
      ssNorm(d.ex);
      edMark(d, entry);
      touchDraft();
      scheduleRender();
    });
  }

  /* ---------- SMAZÁNÍ SÉRIE TAHEM (F2-03) ----------
     Tah doleva po řádku série (tr.sw) odsune řádek a vpravo odkryje tlačítko „Smazat“ (.sw-del, akce
     delSet, leží za posledním sloupcem a karta cviku ho jinak ořízne). Série se smaže až klepnutím na
     něj. Tah doprava, klepnutí jinam nebo posunutí stránky řádek vrátí. Odsunutý je nejvýš jeden řádek
     (swOpen). Svislý pohyb posouvá stránku (touch-action: pan-y u buněk). Po tahu se klepnutí zahodí,
     aby se neotevřel krokovač ani neodškrtla série. */
  const SW_SLOP = 10; // px: pohyb, po kterém se rozhodne, jestli jde o tah do strany, nebo o posun stránky
  const SW_OPEN = 0.4; // část šířky tlačítka Smazat, po které řádek po puštění zůstane odsunutý
  const SW_EAT_MS = 350; // ms: jak dlouho po tahu zahodit klepnutí
  let swOpen = null; // odsunutý řádek
  let sw = null; // rozběhnutý tah: {row, pid, x0, y0, base, dx, horiz, w}
  let swEatUntil = 0;

  function swWidth(row) {
    const btn = row.querySelector(".sw-del");
    return btn ? btn.offsetWidth : 0;
  }
  function swSet(row, x, anim) {
    row.classList.toggle("sw-anim", !!anim);
    row.style.transform = x ? `translateX(${x}px)` : "";
  }
  function swClose() {
    if (swOpen && swOpen.isConnected) {
      swSet(swOpen, 0, true);
    }
    swOpen = null;
  }
  document.addEventListener("pointerdown", (ev) => {
    if (sw || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    const row = ev.target.closest && ev.target.closest("tr.sw");
    if (swOpen && !swOpen.isConnected) {
      swOpen = null;
    }
    if (swOpen && row !== swOpen) {
      swClose();
    }
    if (!row || ev.target.closest(".sw-del")) return;
    sw = {
      row,
      pid: ev.pointerId,
      x0: ev.clientX,
      y0: ev.clientY,
      base: row === swOpen ? -swWidth(row) : 0,
      dx: 0,
      horiz: null,
      w: 0,
    };
  });
  document.addEventListener("pointermove", (ev) => {
    if (!sw || ev.pointerId !== sw.pid) return;
    const dx = ev.clientX - sw.x0;
    const dy = ev.clientY - sw.y0;
    if (sw.horiz === null) {
      if (Math.abs(dx) < SW_SLOP && Math.abs(dy) < SW_SLOP) return;
      sw.horiz = Math.abs(dx) > Math.abs(dy);
      if (!sw.horiz) {
        sw = null;
        return;
      }
      sw.w = swWidth(sw.row);
    }
    sw.dx = dx;
    swSet(sw.row, Math.max(-sw.w, Math.min(0, sw.base + dx)), false);
  });
  function swEnd(ev, cancel) {
    if (!sw || ev.pointerId !== sw.pid) return;
    const g = sw;
    sw = null;
    if (!g.horiz) {
      // klepnutí na odsunutý řádek ho jen vrátí
      if (g.row === swOpen) {
        swClose();
        swEatUntil = Date.now() + SW_EAT_MS;
      }
      return;
    }
    swEatUntil = Date.now() + SW_EAT_MS;
    const x = g.base + g.dx;
    const open = !cancel && g.w > 0 && x < -g.w * SW_OPEN;
    swSet(g.row, open ? -g.w : 0, true);
    swOpen = open ? g.row : null;
  }
  document.addEventListener("pointerup", (ev) => swEnd(ev, false));
  document.addEventListener("pointercancel", (ev) => swEnd(ev, true));
  document.addEventListener(
    "click",
    (ev) => {
      if (Date.now() >= swEatUntil) return;
      swEatUntil = 0;
      ev.stopPropagation();
      ev.preventDefault();
    },
    true,
  );
  window.addEventListener(
    "scroll",
    () => {
      if (swOpen && !sw) {
        swClose();
      }
    },
    { passive: true },
  );

  function vEditor(d) {
    const mode = d.mode;
    let h = "";
    const left =
      mode === "active"
        ? ""
        : `<button class="iconbtn" data-act="edCancel" aria-label="Zpět">${IC.back}</button>`;
    const heading =
      mode === "template"
        ? d.id
          ? "Úprava šablony"
          : "Nová šablona"
        : mode === "edit"
          ? "Úprava tréninku"
          : "Probíhá trénink";
    h += topbar(heading, mode === "active" ? "Začátek " + fmtTime(d.start) : "", left);
    const durMin = Math.round(((d.end || d.start) - d.start) / 60000); // délka v úpravě tréninku (min)
    let vol = 0,
      done = 0;
    for (const e of d.ex) {
      const k = kindOf(e.exId);
      for (const s of e.sets) {
        if (mode === "active" && !s.done) continue;
        if (!isWork(s.t)) continue;
        done++;
        vol += setVol(k, { kg: num(s.kg) || 0, reps: num(s.reps) || 0 }, d.start);
      }
    }
    h += `<div class="ed-head">
      <input class="ed-title" id="ed-title" data-f="title" value="${esc(d.title)}" aria-label="Název"
          placeholder="Název">`;
    if (mode === "template" && S.cfg.gyms.length > 1) {
      h += tplGymPick(d);
    }
    if (mode !== "template") {
      h +=
        `<div class="row wrap-r">
          <label class="f grow" style="min-width:150px">
            Fitko
            <select class="inp" id="ed-gym" data-f="gymId">${S.cfg.gyms
              .map(
                (g) =>
                  `<option value="${g.id}"${g.id === d.gymId ? " selected" : ""}>${esc(g.name)}</option>`,
              )
              .join("")}` +
        `</select>
        </label>`;
      if (mode === "edit") {
        h += `<label class="f">
          Datum
          <input class="inp" type="date" id="ed-date" data-f="date" value="${toDateInput(d.start)}">
        </label>
        <label class="f">
          Začátek
          <input class="inp" type="time" id="ed-time" data-f="time" value="${toTimeInput(d.start)}">
        </label>
        <label class="f">
          Délka (min)
          <input class="inp${numCls("min", durMin)}" inputmode="numeric" id="ed-dur" data-num="min"
              data-f="dur" value="${durMin}" style="width:90px">
        </label>`;
      }
      h += "</div>";
      h += `<div class="ed-meta">
        ${
          mode === "active"
            ? `<div class="stat">
              <b data-elapsed>${fmtClock((Date.now() - d.start) / 1000)}</b><span>Čas</span>
            </div>`
            : ""
        }
        <div class="stat"><b>${fmtInt(vol)} kg</b><span>Objem</span></div>
        <div class="stat">
          <b>${done}</b><span>${mode === "active" ? "Hotové série" : "Pracovní série"}</span>
        </div>
      </div>`;
    }
    h += "</div>";
    h += '<div class="stack" style="margin-top:12px">';
    h += ssWrap(
      d.ex,
      d.ex.map((e, i) => vExCard(d, e, i)),
    );
    h += "</div>";
    h += `<div class="stack" style="margin-top:12px">
        <button class="btn block" data-act="addEx">+ Přidat cvik</button>`;
    if (mode === "active") {
      h += `<button class="btn primary block" data-act="finish">Dokončit trénink</button>
        <button class="btn ghost danger block" data-act="discard">Zahodit trénink</button>`;
    } else if (mode === "edit") {
      h += `<button class="btn primary block" data-act="saveEdit">Uložit změny</button>
        <button class="btn ghost danger block" data-act="delWorkout">Smazat trénink</button>`;
    } else {
      h +=
        `<button class="btn primary block" data-act="saveTpl">Uložit šablonu</button>` +
        `${d.id ? '<button class="btn ghost danger block" data-act="delTpl">Smazat šablonu</button>' : ""}`;
    }
    h += "</div>";
    return h;
  }
  function vExCard(d, e, i) {
    const ex = S.exLib[e.exId] || { name: e.exId };
    const last = draftLast(d, e.exId);
    const mode = d.mode;
    const kind = kindOf(e.exId),
      flds = kFields(kind);
    const lr = mode === "active" ? liveRecords(d, i) : { sets: {}, ex: [] };
    const ssLbl = ssPill(d.ex, i); // supersérie (F4-05): štítek a proužek vlevo
    let h = `<article class="exc${ssLbl ? " ss-on" : ""}" data-i="${i}">
      <div class="exc-h">
        <div class="grow">
          <h3>
            <button data-act="openEx" data-v="${esc(e.exId)}" data-p="info">${esc(ex.name)}</button>
          </h3>
          ${ex.cz ? `<div class="cz">${esc(ex.cz)}</div>` : ""}`;
    h +=
      `<div class="row wrap-r" style="margin-top:4px;gap:6px">
        ${ssLbl}
        ${
          ex.gymDep
            ? `<span class="pill gd" title="Progres se počítá zvlášť pro každé fitko">
              vázáno na fitko
            </span>`
            : '<span class="pill">univerzální</span>'
        }` +
      `${kind !== "wr" ? `<span class="pill">${esc(KIND[kind].l.toLowerCase())}</span>` : ""}` +
      `${
        lr.ex.length
          ? `<span class="exmedal" title="${esc(lr.ex.map((t) => REC[t]).join(", "))}">
            🏅 ${esc(lr.ex.map(recLow).join(", "))}
          </span>`
          : ""
      }` +
      `</div></div>
      <button class="iconbtn" data-act="openEx" data-v="${esc(e.exId)}" data-p="stats"
          aria-label="Statistiky cviku">
        ${IC.stats}
      </button>
      <button class="iconbtn" data-act="exMenu" data-i="${i}" aria-label="Možnosti cviku">
        ${IC.more}
      </button>
      </div>`;
    if (mode !== "template") {
      const other = !last && ex.gymDep ? lastSession(e.exId, d.gymId, d.id, draftBefore(d), true) : null;
      h += `<div class="exc-prev">
        ${
          last
            ? `Minule${ex.gymDep ? " v " + esc(gymName(last.w.gymId)) : ""} (${fmtDateS(last.w.start)}): ` +
              `<span class="num">${esc(setsStr(last.e.sets, true, kind))}` +
              `</span>`
            : ex.gymDep
              ? "V tomto fitku zatím bez záznamu" +
                (other
                  ? `. V jiném fitku (${esc(gymName(other.w.gymId))}, ${fmtDateS(other.w.start)}): ` +
                    `<span class="num">${esc(setsStr(other.e.sets, true, kind))}` +
                    `</span>`
                  : "")
              : "Zatím bez záznamu"
        }
      </div>`;
    }
    if (e.note || e.showNote) {
      h += `<textarea class="exc-note" id="note-${e.k}" data-f="note" data-i="${i}" rows="1"
          placeholder="Poznámka ke cviku">${esc(e.note || "")}</textarea>`;
    }
    h += `<table class="sets">
      <thead>
        <tr>
          <th class="c-type">Série</th>
          ${mode !== "template" ? '<th class="c-prev">Minule</th>' : ""}
          ${flds.map((f) => `<th class="c-in">${FLD[f].lab}</th>`).join("")}
          ${mode === "active" ? '<th class="c-ok"><span aria-label="Hotovo">✓</span></th>' : ""}
        </tr>
      </thead>
      <tbody>`;
    let wn = 0;
    const hints = exHints(e, last);
    const useStepper = kkOn(d);
    const fval = (s, f) =>
      f === "sec" ? s.sec || "" : f === "km" ? s.km || "" : f === "reps" ? s.reps || "" : s.kg || "";
    const phOf = (p, f) => {
      if (!p) return "–";
      if (f === "sec") return p.sec ? fmtSec(p.sec) : "";
      if (f === "km") return String(p.km || "");
      if (f === "reps") return String(p.reps || "");
      return p.kg ? fmtKg(p.kg).replace(/\s/g, "") : "";
    };
    e.sets.forEach((s, j) => {
      const lbl = s.t === "w" ? "W" : s.t === "d" ? "D" : s.t === "f" ? "F" : String(++wn);
      const p = hints[j].p,
        hn = hints[j].h;
      const marked = kk && d === S.active && kk.i === i && kk.j === j;
      // tlačítko Smazat za posledním sloupcem, odkryje ho tah doleva (F2-03)
      const delBtn = `<button class="sw-del" data-act="delSet" data-i="${i}" data-j="${j}" tabindex="-1">
        Smazat
      </button>`;
      h +=
        `<tr class="sw${s.done ? " done" : ""}${marked ? " kk-on" : ""}">
        <td class="c-type">
          <button class="stype ${s.t}" data-act="cycType" data-i="${i}" data-j="${j}"
              title="${TYPE_NAME[s.t]} — klepnutím změníš">
            ${lbl}` +
        `${
          lr.sets[j]
            ? `<span class="medal" title="${esc(lr.sets[j].map((t) => REC[t]).join(", "))}">🏅</span>`
            : ""
        }
          </button>
        </td>`;
      if (mode !== "template") {
        h += `<td class="c-prev num">${p ? esc(setStr(kind, p)) : "–"}</td>`;
      }
      flds.forEach((f, n) => {
        const fld = f === "plus" || f === "minus" ? "kg" : f;
        const id = kkInputId(e, j, f);
        // krokovač (F1-03): políčko jen ke čtení, klepnutí otevře panel s +/−
        const stepper = useStepper && kkKbd !== id ? ` readonly data-act="kk" data-v="${f}"` : "";
        const last = mode !== "active" && n === flds.length - 1;
        h += `<td class="c-in${last ? " sw-cell" : ""}">
          <input class="cell${numCls(fld, fval(s, fld))}" id="${id}"
              inputmode="${FLD[f].mode}" data-num="${fld}" data-f="${fld}" data-i="${i}" data-j="${j}"
              value="${esc(fval(s, fld))}" placeholder="${esc(phOf(hn, fld))}"
              aria-label="${FLD[f].lab}"${stepper}>
          ${last ? delBtn : ""}
        </td>`;
      });
      if (mode === "active") {
        h += `<td class="c-ok sw-cell">
          <button class="okb" data-act="done" data-i="${i}" data-j="${j}" aria-pressed="${!!s.done}"
              aria-label="Série hotová">
            ${IC.check}
          </button>
          ${delBtn}
        </td>`;
      }
      h += `</tr>`;
    });
    h += `</tbody></table>
    <div class="exc-f">
      <button class="btn sm" data-act="addSet" data-i="${i}">+ Série</button>
      <button class="btn sm" data-act="addWarm" data-i="${i}">+ Zahřívací</button>
    </div>
    </article>`;
    return h;
  }
  function draftToWorkout(d, onlyDone) {
    const ex = [];
    for (const e of d.ex) {
      const kind = kindOf(e.exId),
        flds = kFields(kind);
      const sets = [];
      for (const s of e.sets) {
        if (onlyDone && !s.done) continue;
        const o = { t: s.t };
        let any = false;
        if (flds.some((f) => f === "kg" || f === "plus" || f === "minus")) {
          const kg = num(s.kg);
          o.kg = isFinite(kg) ? kg : 0;
          if (isFinite(kg)) {
            any = true;
          }
        } else {
          o.kg = 0;
        }
        if (hasReps(kind)) {
          const r = num(s.reps);
          o.reps = isFinite(r) ? Math.round(r) : 0;
          if (isFinite(r)) {
            any = true;
          }
        } else {
          o.reps = 0;
        }
        if (isTimed(kind)) {
          const sec = parseSec(s.sec);
          if (isFinite(sec) && sec > 0) {
            o.sec = Math.round(sec);
            any = true;
          }
        }
        if (kind === "dist") {
          const km = num(s.km);
          if (isFinite(km) && km > 0) {
            o.km = km;
            any = true;
          }
        }
        if (!any) continue;
        if (s.rpe) {
          o.rpe = s.rpe;
        }
        if (s.at) {
          o.at = s.at;
        }
        sets.push(o);
      }
      if (sets.length) {
        const o = Object.assign({ exId: e.exId, sets }, ssOf(e));
        if (e.note) {
          o.note = e.note;
        }
        ex.push(o);
      }
    }
    return ssNorm(ex); // cvik bez uložené série ze supersérie vypadne
  }
  function saveWorkout(id, w, oldMk) {
    const mk = monthKey(w.start);
    if (oldMk && oldMk !== mk) {
      const items = Object.assign({}, S.months[oldMk] || {});
      delete items[id];
      put("workouts/" + oldMk, { items });
    }
    const items = Object.assign({}, S.months[mk] || {});
    items[id] = w;
    put("workouts/" + mk, { items });
  }
  function workoutToDraft(w, mode) {
    return {
      mode,
      id: w.id,
      mk: w.mk,
      title: w.title,
      gymId: w.gymId,
      start: w.start,
      end: w.end,
      endOrig: w.endOrig,
      tplId: w.tplId || null,
      note: w.note || "",
      ex: (w.ex || []).map((e) => ({
        k: uid("e"),
        exId: e.exId,
        ...ssOf(e),
        note: e.note || "",
        sets: e.sets.map((s) => ({
          t: s.t,
          kg: s.kg ? numStr(s.kg) : "",
          reps: s.reps ? String(s.reps) : "",
          sec: s.sec ? fmtSec(s.sec) : "",
          km: s.km ? numStr(s.km) : "",
          done: true,
          rpe: s.rpe,
          at: s.at,
        })),
      })),
    };
  }

  /* ---------- HISTORIE ---------- */
  function gymChips(act, cur, withAll) {
    return (
      `<div class="chips" data-ck="${act}">
        ${
          withAll
            ? `<button class="chip" data-act="${act}" data-v="all" aria-pressed="${cur === "all"}">
              Všechna fitka
            </button>`
            : ""
        }` +
      `${S.cfg.gyms
        .map(
          (g) =>
            `<button class="chip" data-act="${act}" data-v="${g.id}" aria-pressed="${cur === g.id}">
              <span class="sw" style="background:${gymColor(g.id)}"></span>
              ${esc(g.name)}
            </button>`,
        )
        .join("")}` +
      `</div>`
    );
  }
  function vHist() {
    const { all } = derive();
    const list = all.filter((w) => S.histGym === "all" || w.gymId === S.histGym);
    let h = topbar("Historie", list.length + " tréninků");
    h += `<div class="seg seg-wide" style="margin-bottom:10px">${[
      ["cal", "Kalendář"],
      ["list", "Seznam"],
    ]
      .map(
        ([k, l]) =>
          `<button data-act="histView" data-v="${k}" aria-pressed="${S.histView === k}">${l}</button>`,
      )
      .join("")}</div>`;
    h += gymChips("histGym", S.histGym, true);
    if (S.histView === "cal") return h + vCal(all, list);
    if (!list.length) return `${h}<div class="empty" style="margin-top:14px">Žádné tréninky.</div>`;
    let curM = "";
    const lim = S.histLimit || 40;
    list.slice(0, lim).forEach((w) => {
      const d = new Date(w.start);
      const m = MONTHS_FULL[d.getMonth()] + " " + d.getFullYear();
      if (m !== curM) {
        curM = m;
        h += `<div class="mhead">${m}</div>`;
      }
      h +=
        `<button class="hw" data-act="openW" data-v="${esc(w.id)}" data-m="${w.mk}"
          style="margin-bottom:8px">
        <div class="row">
          <h3 class="grow">
            ${esc(w.title)}` +
        `${wRecs(w).length ? ` <span class="medals">🏅 ${wRecs(w).length}</span>` : ""}
          </h3>
          <span class="pill">
            <span class="sw" style="background:${gymColor(w.gymId)}"></span>
            ${esc(gymName(w.gymId))}
          </span>
        </div>
        <div class="line num">
          <span>${fmtDay(w.start)} ${fmtTime(w.start)}</span>
          ${durLabel(w)}
          <span>${fmtInt(wVol(w))} kg</span>
          <span>${wSets(w)} sérií</span>
        </div>
        <div class="exs">
          ${esc((w.ex || []).map((e) => e.sets.length + "× " + exName(e.exId)).join(", "))}
        </div>
      </button>`;
    });
    if (list.length > lim) {
      h += '<button class="btn block" data-act="histMore">Zobrazit další</button>';
    }
    return h;
  }
  /* ---------- SOUHRN TRÉNINKU (F3-03) ----------
     Panel tréninku (po uložení „Hotovo · …“ i z Historie): karty Čas, Objem, Série, Rekordy s rozdílem
     proti minulému běhu stejné šablony (prevRun: přednostně ve stejném fitku), procvičené partie
     (hlavní partie = série, pomocná = půl) a u každého cviku porovnání s posledním výskytem cviku
     (prevEx: i z jiné šablony, cvik vázaný na fitko jen ze stejného fitka). Vše se počítá z uložených dat.
     Dole po uložení červené Dokončit (zavře panel, F3-12), z Historie Cvičit znovu. */
  const DEF_TITLES = ["Ranní trénink", "Odpolední trénink", "Večerní trénink", "Trénink"];
  const runKey = (t) => {
    t = String(t || "").trim();
    return DEF_TITLES.includes(t) ? "" : fold(t);
  };
  // je x běh „stejného tréninku“ jako w? stejná šablona, jinak stejný (ne
  // automatický) název, nebo zdroj Cvičit znovu
  function sameRun(w, x) {
    if (w.againOf && x.id === w.againOf) return true;
    if (w.tplId && x.tplId) return w.tplId === x.tplId;
    const k = runKey(w.title);
    return !!k && k === runKey(x.title);
  }
  function prevRun(w) {
    let other = null;
    for (const x of derive().all) {
      if (x.start >= w.start || x.id === w.id || !sameRun(w, x)) continue;
      if (x.gymId === w.gymId) return x;
      if (!other) {
        other = x;
      }
    }
    return other;
  }
  const exSetsIn = (w, exId) => (w.ex || []).filter((e) => e.exId === exId).flatMap((e) => e.sets);
  function prevEx(exId, w, anyGym) {
    const g = anyGym ? null : exCtxGym(exId, w.gymId);
    for (const s of derive().byEx[exId] || []) {
      if (s.w.start >= w.start || s.w.id === w.id) continue;
      if (g && s.w.gymId !== g) continue;
      return s.w;
    }
    return null;
  }
  // nejlepší pracovní série: klíč se porovnává zleva (váha, pak opakování; dopomoc čím menší, tím lepší)
  function setKey(kind, s) {
    const kg = +s.kg || 0,
      reps = +s.reps || 0,
      sec = +s.sec || 0,
      km = +s.km || 0;
    if (kind === "time") return sec > 0 ? [sec] : null;
    if (kind === "timew") return sec > 0 ? [kg, sec] : null;
    if (kind === "dist") return km > 0 ? [km, -sec] : null;
    if (reps <= 0) return null;
    if (kind === "bw") return [reps];
    if (kind === "assist") return [-kg, reps];
    return [kg, reps];
  }
  const keyCmp = (a, b) => {
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      if (Math.abs(d) > EPS) return d > 0 ? 1 : -1;
    }
    return 0;
  };
  function bestOf(kind, sets) {
    let b = null;
    for (const s of sets) {
      if (!isWork(s.t)) continue;
      const k = setKey(kind, s);
      if (k && (!b || keyCmp(k, b.k) > 0)) {
        b = { k, s };
      }
    }
    return b;
  }
  // součet cviku: objem (kg), u cviků na čas celkový čas, u vzdálenosti km
  function exTotal(kind, sets, t) {
    let v = 0;
    for (const s of sets) {
      if (isWork(s.t)) {
        v += kind === "dist" ? +s.km || 0 : isTimed(kind) ? +s.sec || 0 : setVol(kind, s, t);
      }
    }
    return {
      v,
      lab: kind === "dist" ? "Vzdálenost" : isTimed(kind) ? "Celkem" : "Objem",
      fmt: kind === "dist" ? (x) => fmtKg(x) + " km" : isTimed(kind) ? fmtSec : (x) => fmtInt(x) + " kg",
    };
  }
  function wMuscles(w) {
    const m = {};
    for (const e of w.ex || []) {
      const n = e.sets.filter((s) => isWork(s.t)).length;
      if (!n) continue;
      const x = exOf(e.exId);
      for (const k of exPri(x)) {
        m[k] = (m[k] || 0) + n;
      }
      for (const k of x.sec || []) {
        m[k] = (m[k] || 0) + n / 2;
      }
    }
    for (const k in m) {
      if (!MUSCLE_MAP.NAMES[k]) {
        delete m[k];
      }
    }
    return m;
  }
  // rozdíl proti minule: ▲ víc (zeleně), ▼ míň (červeně), ◄► beze změny; neutral = jen šedě (čas)
  // trojúhelníčky jako SVG, aby vypadaly stejně v každém písmu
  const TRI = (() => {
    const t = (d) => `<svg class="tri" viewBox="0 0 10 10" aria-hidden="true"><path d="${d}"/></svg>`;
    return {
      up: t("M5 1.5 9.5 8.5H.5z"),
      down: t("M5 8.5 .5 1.5h9z"),
      same: `<svg class="tri tri2" viewBox="0 0 20 10" aria-hidden="true">
        <path d="M.5 5 7 .8v8.4zM19.5 5 13 .8v8.4z"/>
      </svg>`,
    };
  })();
  const SAME = TRI.same + " 0";
  function dHtml(d, fmt, cls, neutral) {
    if (Math.abs(d) < EPS || fmt(Math.abs(d)) === fmt(0)) {
      return `<span class="${cls} flat">${SAME}</span>`;
    }
    return (
      `<span class="${cls} ${neutral ? "flat" : d > 0 ? "gain" : "loss"}">` +
      `${d > 0 ? TRI.up + " +" : TRI.down + " −"}${fmt(Math.abs(d))}</span>`
    );
  }
  // den s rokem, jen když se liší od roku tréninku
  const dayY = (t, ref) =>
    fmtDay(t) +
    (new Date(t).getFullYear() !== new Date(ref).getFullYear() ? " " + new Date(t).getFullYear() : "");
  function sumKpis(w, p) {
    const dur = wDur(w),
      vol = wVol(w),
      sets = wSets(w),
      rec = wRecs(w).length;
    const kpi = (v, l, dl) => `<div class="kpi"><b>${v}</b><span>${l}</span>${p ? dl : ""}</div>`;
    let dv = "";
    if (p) {
      const pv = wVol(p);
      const pc = pv > 0 ? Math.round(((vol - pv) / pv) * 100) : 0;
      dv =
        dHtml(vol - pv, (x) => fmtInt(x) + " kg", "dl") +
        (pc
          ? `<span class="dl pc ${pc > 0 ? "gain" : "loss"}">
            ${pc > 0 ? "+" : "−"}${Math.abs(pc)} %
          </span>`
          : "");
    }
    return (
      `<div class="kpis k4">
      ${kpi(
        fmtDurS(dur),
        "Čas",
        p
          ? dHtml(
              Math.round(dur / 60000) - Math.round(wDur(p) / 60000),
              (m) => fmtDurS(m * 60000),
              "dl",
              true,
            )
          : "",
      )}` +
      `${kpi(fmtVol(vol), "Objem", dv)}` +
      `${kpi(sets, "Série", p ? dHtml(sets - wSets(p), String, "dl") : "")}` +
      `${kpi(rec, "Rekordy", p ? dHtml(rec - wRecs(p).length, String, "dl") : "")}
    </div>`
    );
  }
  function sumCompare(w, p) {
    if (!p) {
      return `<div class="small muted">${
        w.tplId || w.againOf || runKey(w.title)
          ? "První trénink „" + esc(w.title) + "“, zatím není s čím porovnat."
          : "Trénink bez šablony, není s čím porovnat."
      }</div>`;
    }
    const have = new Set((w.ex || []).map((e) => e.exId));
    const extra = [...new Set((p.ex || []).map((e) => e.exId))].filter((id) => !have.has(id));
    return (
      `<button class="cmp" data-act="prevW" data-v="${esc(p.id)}" data-m="${p.mk}">
        <div class="grow">
          Porovnáno s <b>${esc(p.title)}</b> · ${dayY(p.start, w.start)} · ` +
      `${esc(gymName(p.gymId))}${p.gymId !== w.gymId ? " (jiné fitko)" : ""}
          ${extra.length ? `<div class="xs muted">Minule navíc: ${esc(extra.map(exName).join(", "))}</div>` : ""}
        </div>
        <span class="chev">›</span>
      </button>`
    );
  }
  function sumMuscles(w) {
    const m = wMuscles(w),
      rows = Object.entries(m).sort((a, b) => b[1] - a[1]);
    if (!rows.length) return "";
    const mx = rows[0][1];
    return `<div class="card">
      <h3 class="sumh">Procvičené partie</h3>
      ${musFigs(m, false, true)}${mgStack(m)}
      <div class="mbars">
        ${rows
          .map(
            ([k, v]) =>
              `<div class="mbar">
                <span>${esc(MUSCLE_MAP.NAMES[k])}</span>
                <div><i style="width:${Math.max(4, (v / mx) * 100)}%;background:${mgCol(k)}"></i></div>
              </div>`,
          )
          .join("")}
      </div>
    </div>`;
  }
  function sumEx(w, exId) {
    const kind = kindOf(exId),
      sets = exSetsIn(w, exId);
    const pw = prevEx(exId, w);
    if (!pw) {
      const ex = S.exLib[exId];
      return ` <span class="pill new">
        ${ex && ex.gymDep && prevEx(exId, w, true) ? "Poprvé v tomto fitku" : "Poprvé"}
      </span>`;
    }
    const ps = exSetsIn(pw, exId);
    const b = bestOf(kind, sets),
      pb = bestOf(kind, ps),
      t = exTotal(kind, sets, w.start),
      pt = exTotal(kind, ps, pw.start);
    let h = "";
    if (b) {
      h += `<span class="k">Nejlepší</span>
      <span class="v">${esc(setStr(kind, b.s))}</span>
      ${
        !pb
          ? "<span></span>"
          : keyCmp(b.k, pb.k)
            ? `<span class="d ${keyCmp(b.k, pb.k) > 0 ? 'gain">' + TRI.up : 'loss">' + TRI.down}` +
              ` z ${esc(setStr(kind, pb.s))}</span>`
            : `<span class="d flat">${SAME}</span>`
      }`;
    }
    if (t.v > 0 || pt.v > 0) {
      h += `<span class="k">${t.lab}</span>
      <span class="v">${t.fmt(t.v)}</span>
      ${dHtml(t.v - pt.v, t.fmt, "d")}`;
    }
    return {
      h: `${h}
      <span class="src">
        Minule ${dayY(pw.start, w.start)} · ${esc(pw.title)}${sameRun(w, pw) ? "" : " (jiný trénink)"}
      </span>`,
    };
  }
  let wOpen = null; // otevřený panel tréninku {w, justSaved, nav} – pro panel v panelu a krok zpět
  const wBack = (o) => (o ? () => sheetWorkout(o.w, o.justSaved, o.nav, true) : closeSheet);
  function sheetWorkout(w, justSaved, nav, noanim) {
    nav = nav || {};
    wOpen = { w, justSaved, nav };
    const p = prevRun(w);
    let b = `<div class="row wrap-r small muted num">
      <span class="pill">
        <span class="sw" style="background:${gymColor(w.gymId)}"></span>
        ${esc(gymName(w.gymId))}
      </span>
      <span>${fmtDay(w.start)} ${fmtTime(w.start)}</span>
    </div>
    ${
      w.endOrig
        ? `<div class="xs muted">
          Délka upravena ručně: původně ${fmtDur(w.endOrig - w.start)} (konec ${fmtTime(w.endOrig)}),
          uloženo ${fmtDur(w.end - w.start)} (konec ${fmtTime(w.end)}).
        </div>`
        : ""
    }`;
    b += sumKpis(w, p) + sumCompare(w, p);
    const R = wRecs(w);
    if (justSaved || R.length) {
      b += R.length
        ? `<div class="recbox">
          <h3>🏅 ${R.length} ${plural(R.length, "rekord", "rekordy", "rekordů")}</h3>
          ${recListHtml(R, true)}
        </div>`
        : '<div class="small muted">Tentokrát bez nového rekordu.</div>';
    }
    b += sumMuscles(w);
    const seen = {};
    const cards = []; // karta každého cviku, supersérie (F4-05) je obalí rámečkem
    (w.ex || []).forEach((e, i) => {
      let wn = 0;
      const er = R.filter((r) => r.exId === e.exId);
      const c = seen[e.exId] ? null : sumEx(w, e.exId);
      seen[e.exId] = true;
      const ssLbl = ssPill(w.ex, i);
      cards.push(
        `<div class="card${ssLbl ? " ss-on" : ""}">
        ${ssLbl ? `<div class="row" style="margin-bottom:4px">${ssLbl}</div>` : ""}
        <div style="font-weight:700;color:var(--accent-2)">
          <button class="linkbtn" data-act="openEx" data-v="${esc(e.exId)}">${esc(exName(e.exId))}` +
          `</button>${er.length ? ` <span class="medals">🏅 ${er.length}</span>` : ""}` +
          `${typeof c === "string" ? c : ""}
        </div>
        ${e.note ? `<div class="xs muted">${esc(e.note)}</div>` : ""}` +
          `${c && c.h ? `<div class="excmp">${c.h}</div>` : ""}
        <div class="dset">
          ${(() => {
            const k = kindOf(e.exId);
            return e.sets
              .map((s) => {
                const l = s.t === "w" ? "W" : s.t === "d" ? "D" : s.t === "f" ? "F" : ++wn;
                const L = setLoad(k, s, w.start);
                const r = hasReps(k) && L && s.reps ? e1rm(L, s.reps) : 0;
                return (
                  `<div>
                  <span class="lbl ${s.t}">${l}</span><span>${esc(setStr(k, s))}` +
                  `${s.rpe ? " @" + s.rpe : ""}</span>` +
                  `${
                    isWork(s.t) && r
                      ? `<span class="muted">1RM ≈ ${fmtKg(Math.round(r * 10) / 10)}</span>`
                      : ""
                  }
                </div>`
                );
              })
              .join("");
          })()}
        </div>
        </div>`,
      );
    });
    b += ssWrap(w.ex || [], cards);
    openSheet(
      (justSaved ? "Hotovo · " : "") + w.title,
      b,
      `${
        justSaved
          ? '<button class="btn primary full" data-act="closeSheet">Dokončit</button>'
          : `<button class="btn primary full" data-act="wAgain" data-v="${esc(w.id)}" data-m="${w.mk}">
            Cvičit znovu
          </button>`
      }
      <button class="btn grow" data-act="wToTpl" data-v="${esc(w.id)}" data-m="${w.mk}">
        Uložit jako šablonu
      </button>
      <button class="btn grow" data-act="editW" data-v="${esc(w.id)}" data-m="${w.mk}">
        Upravit
      </button>`,
      noanim,
      nav,
    );
  }

  /* ---------- KALENDÁŘ (F3-06) ----------
     Historie → Kalendář: měsíc, kolečko v barvě fitka, pod ním název tréninku (víc tréninků = kolečko
     rozdělené na barvy a „2×“), tečka = měření v Tělo, čárkované kolečko = rozdělaný trénink.
     Filtr fitek skryje tréninky z jiných fitek, streak a volné dny se počítají vždy ze všech fitek.
     Otevře se vždy aktuální měsíc (S.calM = 0), přepíná se šipkami nebo swipem.
     Budoucí dny jsou zatím neaktivní (místo pro plánované tréninky, F4-07). */
  const dayKey = (t) => {
    const d = new Date(t);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  };
  const dayStart = (t) => new Date(t).setHours(0, 0, 0, 0);
  // tréninky podle dne (klíč dayKey), v rámci dne od nejstaršího; poslouží i roční heatmapě (F3-07)
  function wByDay(ws) {
    const m = {};
    for (const w of ws) {
      (m[dayKey(w.start)] = m[dayKey(w.start)] || []).push(w);
    }
    for (const k in m) {
      m[k].sort((a, b) => a.start - b.start);
    }
    return m;
  }
  function bodyByDay() {
    const m = {};
    for (const [id, b] of Object.entries(S.body || {})) {
      (m[dayKey(b.date)] = m[dayKey(b.date)] || []).push(Object.assign({ id }, b));
    }
    return m;
  }
  // týdny po sobě (po–ne) aspoň s jedním tréninkem; rozběhnutý týden bez tréninku řadu nepřeruší
  function calStreak(all) {
    const wk = new Set(all.map((w) => startOfWeek(w.start)));
    let t = startOfWeek(Date.now()),
      n = 0;
    if (!wk.has(t)) {
      t = startOfWeek(t - 3 * DAY);
    }
    while (wk.has(t)) {
      n++;
      t = startOfWeek(t - 3 * DAY);
    } // −3 dny a zpět na pondělí: bez chyby při změně času
    return n;
  }
  // dny od posledního tréninku (dnes cvičil nebo rozdělaný trénink = 0, bez tréninků null)
  function calRest(all) {
    if (S.active) return 0;
    if (!all.length) return null;
    return Math.round((dayStart(Date.now()) - dayStart(all[0].start)) / DAY);
  }
  const calMonth = () => {
    const n = new Date();
    return S.calM || new Date(n.getFullYear(), n.getMonth(), 1).getTime();
  };
  const calMonthName = (d) => MONTHS_FULL[d.getMonth()].replace(/^./, (c) => c.toUpperCase());
  function vCal(all, list) {
    const m0 = new Date(calMonth()),
      y = m0.getFullYear(),
      mo = m0.getMonth(),
      now = new Date();
    const byDay = wByDay(list),
      byAll = wByDay(all),
      bDay = bodyByDay();
    const today = dayKey(now),
      endToday = dayStart(now) + DAY,
      first = all.length ? dayStart(all[all.length - 1].start) : endToday; // volné dny až od prvního tréninku
    const act = S.active && (S.histGym === "all" || S.active.gymId === S.histGym) ? S.active : null;
    const streak = calStreak(all),
      rest = calRest(all);
    let h =
      `<div class="kpis cal-k">
      <div class="kpi">
        <b>🔥 ${streak}</b><span>${plural(streak, "týden", "týdny", "týdnů")} v řadě</span>
      </div>
      <div class="kpi">
        <b>${rest == null ? "–" : rest}</b>` +
      `<span>${rest == null ? "dní" : plural(rest, "den", "dny", "dní")} ` +
      `volna</span>
      </div>
    </div>`;
    const isNow = y === now.getFullYear() && mo === now.getMonth();
    h +=
      `<div class="card cal" data-cal="1">
      <div class="cal-nav">
        <button class="iconbtn" data-act="calM" data-v="-1" aria-label="Předchozí měsíc">‹</button>
        ${
          isNow
            ? '<b class="cal-t">'
            : '<button class="cal-t" data-act="calM" data-v="0" title="Zpět na aktuální měsíc">'
        }` +
      `${calMonthName(m0)} ${y}${isNow ? "</b>" : " <small>↺</small></button>"}
        <button class="iconbtn" data-act="calM" data-v="1" aria-label="Další měsíc">›</button>
      </div>`;
    h += `<div class="cal-g">
      ${["po", "út", "st", "čt", "pá", "so", "ne"].map((d) => `<div class="cal-wd">${d}</div>`).join("")}`;
    for (let i = (m0.getDay() + 6) % 7; i > 0; i--) {
      h += "<div></div>";
    }
    const dim = new Date(y, mo + 1, 0).getDate();
    let nW = 0,
      nRest = 0,
      nBody = 0;
    for (let d = 1; d <= dim; d++) {
      const t = new Date(y, mo, d).getTime(),
        k = dayKey(t),
        ws = byDay[k] || [],
        fut = t >= endToday,
        bs = bDay[k] || [],
        a = act && k === today ? act : null;
      if (!fut && t >= first && !byAll[k] && !(S.active && k === today)) {
        nRest++;
      }
      nW += ws.length;
      if (bs.length) {
        nBody++;
      }
      let cls = "cal-c",
        st = "";
      if (ws.length) {
        cls += " on";
        const c = ws.map((w) => gymColor(w.gymId));
        st =
          c.length > 1
            ? "background:conic-gradient(" +
              c
                .map(
                  (x, i) =>
                    x +
                    " " +
                    Math.round((i * 100) / c.length) +
                    "% " +
                    Math.round(((i + 1) * 100) / c.length) +
                    "%",
                )
                .join(",") +
              ")"
            : "background:" + c[0];
      } else if (a) {
        cls += " act";
        st = "border-color:" + gymColor(a.gymId);
      }
      const lab = ws.length > 1 ? ws.length + "×" : ws.length ? ws[0].title : a ? a.title : "";
      const aria =
        fmtDay(t) +
        (ws.length ? ": " + ws.map((w) => w.title).join(", ") : "") +
        (bs.length ? ", měření" : "") +
        (a ? ", rozdělaný trénink" : "");
      const tap =
        fut || !(ws.length || bs.length || a)
          ? ' tabindex="-1" aria-disabled="true"'
          : a && !ws.length && !bs.length
            ? ' data-act="calActive"'
            : ` data-act="calDay" data-v="${k}"`;
      h +=
        `<button class="cal-d${k === today ? " today" : ""}${fut ? " fut" : ""}"${tap}
          aria-label="${esc(aria)}">
        <span class="${cls}"${st ? ` style="${st}"` : ""}>${d}` +
        `${bs.length ? '<i class="cal-b"></i>' : ""}</span>
        ${lab ? `<span class="cal-l">${esc(lab)}</span>` : ""}
      </button>`;
    }
    h += "</div></div>";
    h +=
      `<div class="small muted num cal-sum">
      ${calMonthName(m0)}: <b>${nW}</b> ${plural(nW, "trénink", "tréninky", "tréninků")}` +
      `${S.histGym !== "all" ? " (" + esc(gymName(S.histGym)) + ")" : ""} · <b>${nRest}</b> ` +
      `${plural(nRest, "volný den", "volné dny", "volných dnů")}` +
      `${
        nBody
          ? ` · <i class="cal-b"></i> <b>${nBody}</b> ${plural(nBody, "den", "dny", "dní")} s měřením`
          : ""
      }
    </div>`;
    return h;
  }
  // klepnutí na den: jedna věc se otevře rovnou, víc (tréninky, měření) = výběr
  function sheetCalDay(k, noanim) {
    const ws = wByDay(derive().all.filter((w) => S.histGym === "all" || w.gymId === S.histGym))[k] || [],
      bs = bodyByDay()[k] || [];
    if (!ws.length && !bs.length) {
      closeSheet();
      return;
    }
    if (ws.length + bs.length === 1) {
      if (ws.length) {
        sheetWorkout(ws[0]);
      } else {
        sheetBody(bs[0].id);
      }
      return;
    }
    let b = '<div class="stack" style="gap:8px">';
    for (const w of ws) {
      b += `<button class="hw" data-act="calW" data-v="${esc(w.id)}" data-m="${w.mk}" data-k="${k}">
        <div class="row">
          <h3 class="grow">${esc(w.title)}</h3>
          <span class="pill">
            <span class="sw" style="background:${gymColor(w.gymId)}"></span>
            ${esc(gymName(w.gymId))}
          </span>
        </div>
        <div class="line num">
          <span>${fmtTime(w.start)}</span>
          ${durLabel(w)}
          <span>${fmtInt(wVol(w))} kg</span>
          <span>${wSets(w)} sérií</span>
        </div>
      </button>`;
    }
    for (const x of bs) {
      b += `<button class="hw" data-act="calBody" data-v="${esc(x.id)}" data-k="${k}">
        <div class="row"><h3 class="grow"><i class="cal-b"></i> Měření</h3></div>
        <div class="line num">
          ${BODY_F.filter(([f]) => x[f] !== undefined && x[f] !== null && x[f] !== "")
            .slice(0, 3)
            .map(([f, l, u]) => `<span>${esc(l)} <b>${fmtKg(+x[f])}</b> ${esc(u)}</span>`)
            .join("")}
        </div>
      </button>`;
    }
    const d = new Date(ws.length ? ws[0].start : bs[0].date);
    openSheet(fmtDay(d.getTime()) + " " + d.getFullYear(), `${b}</div>`, null, noanim);
  }
  function calShift(v) {
    if (!v) {
      S.calM = 0;
    } else {
      const m = new Date(calMonth());
      S.calM = new Date(m.getFullYear(), m.getMonth() + v, 1).getTime();
    }
    scheduleRender();
  }
  // swipe doleva/doprava po kalendáři přepne měsíc
  {
    let x0 = null,
      y0 = 0;
    document.addEventListener(
      "touchstart",
      (e) => {
        x0 =
          e.touches.length === 1 && e.target.closest && e.target.closest("[data-cal]")
            ? e.touches[0].clientX
            : null;
        if (x0 != null) {
          y0 = e.touches[0].clientY;
        }
      },
      { passive: true },
    );
    document.addEventListener(
      "touchend",
      (e) => {
        if (x0 == null) return;
        const t = e.changedTouches[0],
          dx = t.clientX - x0,
          dy = t.clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          calShift(dx < 0 ? 1 : -1);
        }
      },
      { passive: true },
    );
  }

  /* ---------- STATISTIKY ---------- */
  const RANGES = [
    ["7d", "7 dní", 7],
    ["30d", "30 dní", 30],
    ["3m", "3M", 91],
    ["6m", "6M", 182],
    ["1y", "Rok", 365],
    ["all", "Vše", null],
  ];
  function rangeSince(k) {
    const r = RANGES.find((x) => x[0] === k);
    return r && r[2] ? Date.now() - r[2] * DAY : -Infinity;
  }
  function rangeSeg(act, cur) {
    return `<div class="seg seg-wide">${RANGES.map(
      ([k, l]) => `<button data-act="${act}" data-v="${k}" aria-pressed="${cur === k}">${l}</button>`,
    ).join("")}</div>`;
  }
  function filtW(g) {
    return derive().all.filter((w) => g === "all" || w.gymId === g);
  }
  const wDur = (w) => Math.max(0, (w.end || w.start) - w.start);
  function fmtVol(v) {
    return v >= 10000 ? fmtKg(Math.round(v / 100) / 10) + " t" : fmtInt(v) + " kg";
  }
  function fmtHours(ms) {
    const h = ms / 3600000;
    return h >= 10 ? fmtInt(h) + " h" : fmtDurS(ms);
  }
  // souhrn za seznam tréninků
  function summarize(ws) {
    const s = { n: ws.length, dur: 0, vol: 0, sets: 0, recs: 0, ex: {}, gyms: {}, mus: {} };
    for (const w of ws) {
      s.dur += wDur(w);
      s.vol += wVol(w);
      s.sets += wSets(w);
      s.recs += wRecs(w).length;
      s.gyms[w.gymId] = (s.gyms[w.gymId] || 0) + 1;
      for (const e of w.ex || []) {
        const n = e.sets.filter((x) => isWork(x.t)).length;
        const r = s.ex[e.exId] || (s.ex[e.exId] = { sets: 0, n: 0, vol: 0 });
        r.sets += n;
        r.n++;
        {
          const k = kindOf(e.exId);
          for (const x of e.sets) {
            if (isWork(x.t)) {
              r.vol += setVol(k, x, w.start);
            }
          }
        }
        for (const k of exPri(exOf(e.exId))) {
          s.mus[k] = (s.mus[k] || 0) + n;
        }
      }
    }
    for (const id in s.ex) {
      s.ex[id].n = ws.filter((w) => (w.ex || []).some((e) => e.exId === id)).length;
    }
    return s;
  }
  function kpiGrid(s) {
    return `<div class="kpis k6">
      <div class="kpi"><b>${s.n}</b><span>Tréninky</span></div>
      <div class="kpi"><b>${fmtHours(s.dur)}</b><span>Čas</span></div>
      <div class="kpi"><b>${fmtVol(s.vol)}</b><span>Objem</span></div>
      <div class="kpi"><b>${fmtInt(s.sets)}</b><span>Série</span></div>
      <div class="kpi"><b>${s.recs}</b><span>Rekordy</span></div>
      <div class="kpi"><b>${s.n ? fmtDurS(s.dur / s.n) : "–"}</b><span>Ø délka</span></div>
    </div>`;
  }
  function hbarList(rows, stk) {
    if (!rows.length) return '<div class="muted small">Nic.</div>';
    const mx = Math.max(...rows.map((r) => r.v)) || 1;
    return `<div class="hbars${stk ? " stk" : ""}">
      ${rows
        .map(
          (r) =>
            `<div class="hbar"${r.act ? ` role="button" data-act="${r.act}" data-v="${esc(r.id)}"` : ""}>
              <span class="hl" title="${esc(r.label)}">
                ${r.sw ? `<span class="sw" style="background:${r.sw}"></span>` : ""}${esc(r.label)}
              </span>
              <div class="t"
                  style="width:${Math.max(2, (r.v / mx) * 100)}%${r.sw ? ";background:" + r.sw : ""}"></div>
              <span class="v">${esc(r.txt || String(r.v))}</span>
            </div>`,
        )
        .join("")}
    </div>`;
  }
  function topExRows(s, n) {
    return Object.entries(s.ex)
      .sort((a, b) => b[1].sets - a[1].sets || b[1].n - a[1].n)
      .slice(0, n)
      .map(([id, r]) => ({
        id,
        act: "openEx",
        label: exName(id),
        v: r.sets,
        txt: r.n + "× · " + r.sets + " sérií",
      }));
  }
  function gymRows(s) {
    return Object.entries(s.gyms)
      .sort((a, b) => b[1] - a[1])
      .map(([g, n]) => ({
        label: gymName(g),
        v: n,
        sw: gymColor(g),
        txt: n + "× · " + Math.round((n / s.n) * 100) + " %",
      }));
  }
  function summaryBlock(s, withGyms) {
    let h = kpiGrid(s);
    h += `<div class="subh">Nejčastější cviky</div>${hbarList(topExRows(s, 5), true)}`;
    if (withGyms) {
      h += `<div class="subh">Podle fitek</div>${hbarList(gymRows(s))}`;
    }
    return h;
  }
  // kalendářní období
  function calPeriods() {
    const now = new Date();
    const y = now.getFullYear(),
      m = now.getMonth();
    const lm = new Date(y, m - 1, 1),
      lmE = new Date(y, m, 1);
    const hy =
      m >= 6
        ? { a: new Date(y, 0, 1), b: new Date(y, 6, 1), l: "Leden–červen " + y }
        : { a: new Date(y - 1, 6, 1), b: new Date(y, 0, 1), l: "Červenec–prosinec " + (y - 1) };
    return {
      month: {
        a: lm.getTime(),
        b: lmE.getTime(),
        l: MONTHS_FULL[lm.getMonth()].replace(/^./, (c) => c.toUpperCase()) + " " + lm.getFullYear(),
        short: "Minulý měsíc",
      },
      half: { a: hy.a.getTime(), b: hy.b.getTime(), l: hy.l, short: "Pololetí" },
      year: {
        a: new Date(y - 1, 0, 1).getTime(),
        b: new Date(y, 0, 1).getTime(),
        l: "Rok " + (y - 1),
        short: "Minulý rok",
      },
    };
  }
  function bucketsFor(range, ws) {
    const now = Date.now();
    let unit, count, start;
    const sod = (t) => {
      const d = new Date(t);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const som = (t) => {
      const d = new Date(t);
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    };
    if (range === "7d") {
      unit = "day";
      count = 7;
      start = sod(now) - 6 * DAY;
    } else if (range === "30d") {
      unit = "week";
      count = 5;
      start = startOfWeek(now) - 4 * 7 * DAY;
    } else if (range === "3m") {
      unit = "week";
      count = 13;
      start = startOfWeek(now) - 12 * 7 * DAY;
    } else if (range === "6m") {
      unit = "week";
      count = 26;
      start = startOfWeek(now) - 25 * 7 * DAY;
    } else if (range === "1y") {
      unit = "month";
      count = 12;
      const d = new Date();
      start = new Date(d.getFullYear(), d.getMonth() - 11, 1).getTime();
    } else {
      unit = "month";
      const first = ws.length ? ws[ws.length - 1].start : now;
      const a = new Date(first),
        b = new Date();
      count = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() + 1;
      start = som(first);
      if (count > 36) {
        unit = "quarter";
        const qa = new Date(a.getFullYear(), Math.floor(a.getMonth() / 3) * 3, 1);
        start = qa.getTime();
        count = Math.ceil(((b.getFullYear() - qa.getFullYear()) * 12 + b.getMonth() - qa.getMonth() + 1) / 3);
      }
    }
    const B = [];
    for (let i = 0; i < count; i++) {
      let t;
      if (unit === "day") {
        t = start + i * DAY;
      } else if (unit === "week") {
        t = start + i * 7 * DAY;
      } else {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i * (unit === "quarter" ? 3 : 1));
        t = d.getTime();
      }
      B.push({ t, count: 0, vol: 0, sets: 0, dur: 0, unit });
    }
    const key = (t) => {
      if (unit === "day") return sod(t);
      if (unit === "week") return startOfWeek(t);
      const d = new Date(t);
      return new Date(
        d.getFullYear(),
        unit === "quarter" ? Math.floor(d.getMonth() / 3) * 3 : d.getMonth(),
        1,
      ).getTime();
    };
    const idx = {};
    B.forEach((b, i) => (idx[b.t] = i));
    for (const w of ws) {
      const i = idx[key(w.start)];
      if (i == null) continue;
      const b = B[i];
      b.count++;
      b.vol += wVol(w);
      b.sets += wSets(w);
      b.dur += wDur(w) / 60000;
    }
    const lab = (b) => {
      const d = new Date(b.t);
      if (unit === "day") return ["ne", "po", "út", "st", "čt", "pá", "so"][d.getDay()];
      if (unit === "week") return fmtDateS(b.t);
      if (unit === "quarter") {
        return "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + String(d.getFullYear()).slice(2);
      }
      return MONTHS[d.getMonth()] + (d.getMonth() === 0 || count <= 12 ? "" : "");
    };
    const tipLab = (b) => {
      const d = new Date(b.t);
      if (unit === "day") return fmtDay(b.t);
      if (unit === "week") return "týden od " + fmtDateS(b.t);
      if (unit === "quarter") return "Q" + (Math.floor(d.getMonth() / 3) + 1) + " " + d.getFullYear();
      return MONTHS_FULL[d.getMonth()] + " " + d.getFullYear();
    };
    const every = count <= 13 ? 1 : count <= 26 ? 4 : Math.ceil(count / 8);
    return B.map((b, i) => ({
      x: b.t,
      label: i % every === (count - 1) % every ? lab(b) : "",
      tip: tipLab(b),
      count: b.count,
      vol: b.vol,
      sets: b.sets,
      dur: b.dur,
    }));
  }
  function vStats() {
    const g = S.statsGym,
      range = S.statsRange;
    const wsAll = filtW(g);
    const since = rangeSince(range);
    const ws = wsAll.filter((w) => w.start >= since);
    const s = summarize(ws);
    let h = topbar("Statistiky", g === "all" ? "Všechna fitka" : gymName(g));
    h += gymChips("statsGym", g, true);
    h += `<section class="sec">
      ${rangeSeg("statsRange", range)}
      <div style="margin-top:10px">${kpiGrid(s)}</div>
    </section>`;
    // graf
    const m = S.statsMetric;
    const lab = { count: "Tréninky", sets: "Pracovní série", vol: "Objem (kg)", dur: "Čas (min)" };
    const bars = bucketsFor(range, ws.length ? ws : wsAll);
    h += `<section class="sec">
      <div class="sec-h">
        <h2>Průběh</h2>
        <div class="seg">
          ${Object.keys(lab)
            .map(
              (k) =>
                `<button data-act="statsMetric" data-v="${k}" aria-pressed="${m === k}">` +
                `${{ count: "Tréninky", sets: "Série", vol: "Objem", dur: "Čas" }[k]}</button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="card">
        ${chartPh(
          {
            type: "bar",
            label: lab[m],
            unit: m === "vol" ? " kg" : m === "dur" ? " min" : "",
            bars: bars.map((b) => ({ x: b.x, label: b.label, tip: b.tip, v: b[m] })),
          },
          180,
        )}
      </div>
    </section>`;
    // partie
    const mv = Object.entries(s.mus).sort((a, b) => b[1] - a[1]);
    h += `<section class="sec">
      <div class="sec-h"><h2>Pracovní série podle partie</h2></div>
      <div class="card">
        ${
          mv.length
            ? musFigs(s.mus, true, true) +
              mgStack(s.mus) +
              hbarList(mv.map(([k, v]) => ({ label: MUSCLE_MAP.NAMES[k], v, sw: mgCol(k) })))
            : '<div class="muted small">V tomto období nic.</div>'
        }
        <p class="xs muted" style="margin:8px 0 0">Počítá se hlavní partie cviku.</p>
      </div>
    </section>`;
    h += `<section class="sec">
      <div class="sec-h"><h2>Nejčastější cviky</h2></div>
      <div class="card">${hbarList(topExRows(s, 8), true)}</div>
    </section>`;
    if (g === "all") {
      h += `<section class="sec">
        <div class="sec-h"><h2>Podle fitek</h2></div>
        <div class="card">${hbarList(gymRows(s))}</div>
      </section>`;
    }
    // kalendářní souhrny
    const P = calPeriods();
    const pk = S.sumPeriod;
    const p = P[pk];
    const ps = summarize(wsAll.filter((w) => w.start >= p.a && w.start < p.b));
    h += `<section class="sec">
      <div class="sec-h"><h2>Souhrn · ${esc(p.l)}</h2></div>
      <div class="seg seg-wide" style="margin-bottom:10px">
        ${Object.entries(P)
          .map(
            ([k, v]) =>
              `<button data-act="sumPeriod" data-v="${k}" aria-pressed="${pk === k}">${v.short}</button>`,
          )
          .join("")}
      </div>
      <div class="card">
        ${
          ps.n
            ? summaryBlock(ps, g === "all")
            : '<div class="muted small">V tomto období žádný trénink.</div>'
        }
      </div>
    </section>`;
    // seznam cviků
    const { byEx } = derive();
    let rows = [];
    for (const id in byEx) {
      const ss = byEx[id].filter((x) => g === "all" || x.w.gymId === g);
      if (!ss.length) continue;
      const ex = exOf(id);
      if (S.exMuscle !== "all" && exGroup(ex) !== S.exMuscle) continue;
      if (!exMatch(ex, S.exSearch)) continue;
      let best = 0;
      for (const x of ss) {
        if (x.best > best) {
          best = x.best;
        }
      }
      const inR = ss.filter((x) => x.w.start >= since).length;
      rows.push({
        id,
        ex,
        n: ss.length,
        inR,
        last: ss[0].w.start,
        best,
        gyms: new Set(ss.map((x) => x.w.gymId)).size,
      });
    }
    rows.sort((a, b) => b.last - a.last);
    h += `<section class="sec">
      <div class="sec-h"><h2>Cviky</h2><span class="xs muted">${rows.length}</span></div>
      <input class="inp" id="exSearch" data-f="exSearch" placeholder="Hledat cvik (anglicky i česky)…"
          value="${esc(S.exSearch)}">
      <div class="chips" data-ck="exMuscle" style="margin-top:8px">
        <button class="chip" data-act="exMuscle" data-v="all" aria-pressed="${S.exMuscle === "all"}">
          Vše
        </button>
        ${Object.entries(MUSCLES)
          .filter(([k]) => k !== "other")
          .map(
            ([k, l]) =>
              `<button class="chip" data-act="exMuscle" data-v="${k}" aria-pressed="${S.exMuscle === k}">
                ${l}
              </button>`,
          )
          .join("")}
      </div>
      <div class="stack" style="margin-top:10px;gap:6px">`;
    for (const r of rows.slice(0, S.exLimit || 60)) {
      h +=
        `<button class="exrow" data-act="openEx" data-v="${esc(r.id)}">
        <div class="grow">
          <div class="n">${esc(r.ex.name)}</div>
          ${r.ex.cz ? `<div class="cz">${esc(r.ex.cz)}</div>` : ""}
          <div class="m">
            ${esc(MUSCLES[exGroup(r.ex)] || "")} · ${r.n}×` +
        `${range !== "all" ? " (" + r.inR + "× v období)" : ""} · naposledy ${fmtDateS(r.last)}` +
        `${r.ex.gymDep && r.gyms > 1 && g === "all" ? " · " + r.gyms + " fitka" : ""}
          </div>
        </div>
        <div class="r">${r.best ? `${fmtKg(Math.round(r.best))}<small>odh. 1RM</small>` : "–"}</div>
      </button>`;
    }
    if (rows.length > (S.exLimit || 60)) {
      h += '<button class="btn block" data-act="exMore">Další cviky</button>';
    }
    h += "</div></section>";
    return h;
  }

  /* ---------- ZÁLOŽKA CVIKY (F0-05) ---------- */
  function vExList() {
    const { byEx } = derive();
    const all = Object.entries(S.exLib);
    const nHid = all.filter(([, e]) => e.archived).length;
    if (!nHid) {
      S.exlHid = false;
    }
    const rows = all
      .filter(
        ([, e]) =>
          // skrytých je málo, filtry partie a vybavení se na ně nepoužijí (jen hledání)
          (S.exlHid
            ? !!e.archived
            : !e.archived &&
              (S.exlM === "all" || exGroup(e) === S.exlM) &&
              (S.exlEq === "all" || e.equip === S.exlEq)) && exMatch(e, S.exlQ),
      )
      .map(([id, e]) => {
        const l = byEx[id];
        return { id, e, n: l ? l.length : 0, last: l ? l[0].w.start : 0 };
      });
    // Naposledy: cvičené nahoře od posledního, pod nimi ostatní podle abecedy; A–Z: všechny podle abecedy
    const az = (a, b) => a.e.name.localeCompare(b.e.name, "cs");
    rows.sort(S.exlSort === "az" ? az : (a, b) => b.last - a.last || az(a, b));
    const lim = S.exlLimit || 100;
    let h = topbar("Cviky", all.length + " " + plural(all.length, "cvik", "cviky", "cviků") + " v databázi");
    h += `<input class="inp" id="exlQ" data-f="exlQ" placeholder="Hledat cvik (anglicky i česky)…"
        value="${esc(S.exlQ)}" autocomplete="off">`;
    h += `<div class="chips" data-ck="exlM" style="margin-top:8px">
      <button class="chip" data-act="exlM" data-v="all" aria-pressed="${S.exlM === "all"}">
        Všechny partie
      </button>
      ${Object.entries(MUSCLES)
        .filter(([k]) => k !== "other")
        .map(
          ([k, l]) =>
            `<button class="chip" data-act="exlM" data-v="${k}" aria-pressed="${S.exlM === k}">
              ${l}
            </button>`,
        )
        .join("")}
    </div>`;
    h += `<div class="chips" data-ck="exlEq" style="margin-top:6px">
      <button class="chip" data-act="exlEq" data-v="all" aria-pressed="${S.exlEq === "all"}">
        Všechno vybavení
      </button>
      ${Object.entries(EQUIP)
        .map(
          ([k, l]) =>
            `<button class="chip" data-act="exlEq" data-v="${k}" aria-pressed="${S.exlEq === k}">
              ${l}
            </button>`,
        )
        .join("")}
    </div>`;
    h += `<div class="row wrap-r" style="margin-top:8px;gap:8px">
      <div class="seg">
        ${[
          ["last", "Naposledy"],
          ["az", "A–Z"],
        ]
          .map(
            ([k, l]) =>
              `<button data-act="exlSort" data-v="${k}" aria-pressed="${S.exlSort === k}">${l}</button>`,
          )
          .join("")}
      </div>
      ${
        nHid
          ? `<button class="chip" data-act="exlHid" aria-pressed="${S.exlHid}">Skryté (${nHid})</button>`
          : ""
      }
      <span class="grow"></span>
      ${icoBtn("fedbOpen", "globe", "Hledat v online databázi", "list")}
      ${icoBtn("exlNew", "plus", "Nový cvik")}
    </div>`;
    h += `<section class="sec">
    <div class="sec-h">
      <h2>${S.exlHid ? "Skryté cviky" : "Seznam"}</h2>
      <span class="xs muted">${rows.length}</span>
    </div>`;
    if (S.exlHid) {
      h += `<p class="xs muted" style="margin:0 0 8px">
        Skryté cviky se nenabízejí při přidávání do tréninku. Historie i statistiky zůstávají. Vrátíš
        je přes Upravit → Zobrazit.
      </p>`;
    }
    if (!rows.length) {
      h +=
        `<div class="empty">
        Nic neodpovídá hledání nebo filtru.` +
        `${
          S.exlQ.trim() && !S.exlHid
            ? `<br>
            <button class="btn sm" data-act="fedbOpen" data-v="list" style="margin-top:10px">
              Hledat „${esc(S.exlQ.trim())}“ online
            </button>`
            : ""
        }` +
        `</div>`;
    }
    h += '<div class="stack" style="gap:6px">';
    for (const r of rows.slice(0, lim)) {
      const e = r.e;
      h +=
        `<button class="exrow" data-act="openEx" data-v="${esc(r.id)}">
        <div class="grow">
          <div class="n">
            ${esc(e.name)}${e.custom ? ' <span class="xs muted">(vlastní)</span>' : ""}
          </div>
          ${e.cz ? `<div class="cz">${esc(e.cz)}</div>` : ""}
          <div class="m">
            ${esc(
              exPri(e)
                .map((k) => MUSCLE_MAP.NAMES[k])
                .join(", ") ||
                MUSCLES[e.muscle] ||
                "",
            )} ` +
        `· ${esc(EQUIP[e.equip] || "")}` +
        `${r.n ? " · " + r.n + "× · naposledy " + fmtDateS(r.last) : ""}
          </div>
        </div>
      </button>`;
    }
    if (rows.length > lim) {
      h += `<button class="btn block" data-act="exlMore">Další cviky (${rows.length - lim})</button>`;
    }
    h += "</div></section>";
    return h;
  }

  /* ---------- STRÁNKA CVIKU ---------- */
  function vExDetail() {
    const id = S.exDetail;
    const ex = exOf(id);
    const list = derive().byEx[id] || [];
    let h = topbar(
      ex.name,
      ex.cz || "",
      `<button class="iconbtn" data-act="exBack" aria-label="Zpět">${IC.back}</button>`,
      "czsub",
    );
    h += `<div class="seg seg-wide" style="margin-bottom:10px">
      ${[
        ["info", "Popis"],
        ["stats", "Statistiky" + (list.length ? " (" + list.length + "×)" : "")],
      ]
        .map(
          ([k, l]) =>
            `<button data-act="exPart" data-v="${k}" aria-pressed="${S.exPart === k}">${l}</button>`,
        )
        .join("")}
    </div>`;
    if (S.exPart !== "stats") {
      // popis
      h +=
        `<div class="card exinfo">
        ${photoGallery(ex, id)}${photoAddRow(id)}${exTags(ex)}` +
        `${
          ex.desc
            ? `<p class="desc">${esc(ex.desc)}</p>`
            : '<p class="desc muted">Popis provedení zatím chybí.</p>'
        }
        <div class="row wrap-r" style="justify-content:space-between">
          <a class="link" href="${esc(exLink(ex))}" target="_blank" rel="noopener">` +
        `${esc(exLinkLabel(ex))}</a>
          <span class="xs muted">${esc(EQUIP[ex.equip] || "")}</span>
        </div>
        <div class="row wrap-r" style="margin-top:10px;gap:8px">
          <button class="btn sm" data-act="editExDetail" data-v="${esc(id)}">Upravit cvik</button>
        </div>
      </div>`;
      h +=
        `<div class="card" style="margin-top:10px">
        <label class="switch">
          <input type="checkbox" id="gymDepToggle" data-act="toggleGymDep"
              ${ex.gymDep ? "checked" : ""}>
          <span><b>Vázáno na fitko</b><br>` +
        `<span class="xs muted">${
          ex.gymDep
            ? "Každé fitko má vlastní progres, grafy i rekordy."
            : "Data ze všech fitek se sčítají dohromady."
        }` +
        `</span></span>
        </label>
      </div>`;
      if (ex.archived) {
        h += `<div class="card small" style="margin-top:10px">
          <b>Skrytý cvik.</b> <span class="muted">Nenabízí se při přidávání do tréninku. Vrátíš ho
            přes Upravit cvik → Zobrazit.</span>
        </div>`;
      }
      h += `<p class="small muted" style="margin-top:12px">
        ${
          list.length
            ? `Cvičeno ${list.length}× · naposledy ${fmtDate(list[0].w.start)} ` +
              `<button class="linkbtn" data-act="exPart" data-v="stats"
                style="color:var(--accent-2);font-weight:600">Statistiky →</button>`
            : "S tímto cvikem zatím nemáš žádný záznam."
        }
      </p>`;
      return h;
    }
    // statistiky
    if (!list.length) {
      return `${h}
      <div class="empty" style="margin-top:14px">S tímto cvikem zatím nemáš žádný záznam.</div>`;
    }
    h += `<p class="xs muted" style="margin:0 0 8px">${
      ex.gymDep
        ? "Vázáno na fitko: počítá se zvlášť pro každé fitko."
        : "Nevázáno na fitko: data ze všech fitek se sčítají."
    } Změníš v Popisu.</p>`;
    const gymsWith = [...new Set(list.map((s) => s.w.gymId))].sort((a, b) => gymIdx(a) - gymIdx(b));
    if (ex.gymDep && gymsWith.length > 1) {
      h += `<div class="sec">
        <div class="chips" data-ck="detailGym">
          <button class="chip" data-act="detailGym" data-v="all"
              aria-pressed="${S.detailGym === "all"}">
            Všechna (zvlášť)
          </button>
          ${gymsWith
            .map(
              (g) =>
                `<button class="chip" data-act="detailGym" data-v="${g}"
                    aria-pressed="${S.detailGym === g}">
                  <span class="sw" style="background:${gymColor(g)}"></span>
                  ${esc(gymName(g))}
                </button>`,
            )
            .join("")}
        </div>
      </div>`;
    }
    const kind = kindOf(id);
    const bw = hasReps(kind) && kind !== "wr";
    const M =
      isTimed(kind) && kind !== "dist"
        ? { sec: ["Nejdelší výdrž", "maxSec", " s"], tsec: ["Čas celkem", "totSec", " s"] }
        : kind === "dist"
          ? {
              km: ["Nejdelší", "maxKm", " km"],
              tkm: ["Vzdálenost", "totKm", " km"],
              speed: ["Tempo", "speed", " km/h"],
            }
          : {
              e1rm: ["Odh. 1RM", "best", " kg"],
              max: ["Max zátěž", "maxKg", " kg"],
              vol: ["Objem", "vol", " kg"],
              reps: ["Max opak.", "maxReps", ""],
            };
    // vybraný graf cvik nemá (např. „Odh. 1RM“ u planku) → první graf, který má
    if (!M[S.detailMetric]) {
      S.detailMetric = Object.keys(M)[0];
    }
    const since = rangeSince(S.detailRange);
    let sel = list.filter((s) => s.w.start >= since && s.nWork > 0);
    if (ex.gymDep && S.detailGym !== "all") {
      sel = sel.filter((s) => s.w.gymId === S.detailGym);
    }
    // souhrn za období
    let pv = 0,
      ps = 0;
    for (const s of sel) {
      pv += s.vol;
      ps += s.nWork;
    }
    const pr = (recs().byEx[id] || []).filter(
      (r) => r.w.start >= since && (!ex.gymDep || S.detailGym === "all" || r.gymId === S.detailGym),
    ).length;
    h += `<section class="sec">
      ${rangeSeg("detailRange", S.detailRange)}
      <div class="kpis k4" style="margin-top:10px">
        <div class="kpi"><b>${sel.length}</b><span>Tréninky</span></div>
        <div class="kpi"><b>${ps}</b><span>Série</span></div>
        <div class="kpi"><b>${fmtVol(pv)}</b><span>Objem</span></div>
        <div class="kpi"><b>${pr}</b><span>Rekordy</span></div>
      </div>
    </section>`;
    const key = M[S.detailMetric][1];
    let series;
    if (ex.gymDep) {
      const by = {};
      for (const s of sel) {
        (by[s.w.gymId] = by[s.w.gymId] || []).push(s);
      }
      series = Object.keys(by)
        .sort((a, b) => gymIdx(a) - gymIdx(b))
        .map((g) => ({
          name: gymName(g),
          color: gymColor(g),
          pts: by[g]
            .map((s) => ({ x: s.w.start, y: s[key], s }))
            .filter((p) => p.y > 0)
            .reverse(),
        }));
    } else {
      series = [
        {
          name: "Všechna fitka",
          color: "var(--chart)",
          pts: sel
            .map((s) => ({ x: s.w.start, y: s[key], s }))
            .filter((p) => p.y > 0)
            .reverse(),
        },
      ];
    }
    h += `<section class="sec">
      <div class="seg" style="margin-bottom:10px">
        ${Object.keys(M)
          .map(
            (k) =>
              `<button data-act="detailMetric" data-v="${k}"
                  aria-pressed="${S.detailMetric === k}">${M[k][0]}</button>`,
          )
          .join("")}
      </div>`;
    h +=
      `<div class="card">
        ${chartPh({ type: "line", label: M[S.detailMetric][0], unit: M[S.detailMetric][2], series }, 200)}` +
      `${
        series.length > 1
          ? `<div class="legend">${series
              .map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`)
              .join("")}</div>`
          : ""
      }
    </div>
    </section>`;
    // rekordy
    const R = recs();
    const ctxs = ex.gymDep
      ? gymsWith.map((g) => ({ g, name: gymName(g), b: R.best[id + "|" + g] }))
      : [{ g: null, name: "", b: R.best[id + "|*"] }];
    h += `<section class="sec">
        <div class="sec-h"><h2>Osobní rekordy</h2></div>
        <div class="stack" style="gap:8px">`;
    for (const c of ctxs) {
      if (!c.b) continue;
      h +=
        `<div class="card recgrid">
          ${
            ex.gymDep
              ? `<div class="rg-h">
                <span class="pill">
                  <span class="sw" style="background:${gymColor(c.g)}"></span>
                  ${esc(c.name)}
                </span>
              </div>`
              : ""
          }` +
        `${REC_ORDER.filter((t) => c.b[t])
          .map((t) => {
            const r = c.b[t];
            const sub =
              t === "e1rm" || t === "maxKg"
                ? fmtKg(r.set.kg) + " × " + r.set.reps + " · "
                : t === "bestSet"
                  ? fmtInt(r.v) + " kg · "
                  : "";
            return `<div class="rg-r">
              <span class="rg-l">${REC[t]}</span>
              <b>${esc(recFmt(t, r.v, r.set))}</b>
              <span class="rg-s">${sub}${fmtDate(r.w.start)}</span>
            </div>`;
          })
          .join("")}` +
        `</div>`;
    }
    h += "</div>";
    const rl = (R.byEx[id] || []).slice().reverse().slice(0, 8);
    if (rl.length) {
      h += `<div class="card" style="margin-top:8px">
        <div class="subh" style="margin-top:0">Poslední rekordy</div>
        ${rl
          .map(
            (r) =>
              `<div class="rec">
                <span class="md">🏅</span>
                <div class="grow">
                  ${esc(REC[r.type])}: <b>${esc(recFmt(r.type, r.v, r.set))}</b> ` +
              `<span class="muted">· ` +
              `${fmtDate(r.w.start)}${ex.gymDep ? " · " + esc(gymName(r.gymId)) : ""}</span>
                </div>
              </div>`,
          )
          .join("")}
      </div>`;
    }
    h +=
      `<p class="xs muted">
      Odhad 1RM podle Epleyho: váha × (1 + opakování / 30). Zahřívací série se nepočítají. První trénink
      s cvikem${ex.gymDep ? " v každém fitku" : ""} rekord nezakládá.` +
      `${
        bw
          ? " U tohoto typu se zátěž počítá z tvé tělesné hmotnosti (" +
            fmtKg(bodyWeightAt(Date.now())) +
            " kg)."
          : ""
      }
    </p>
    </section>`;
    // historie
    h += `<section class="sec">
      <div class="sec-h"><h2>Historie cviku</h2><span class="xs muted">${list.length}×</span></div>
      <div class="stack" style="gap:6px">`;
    for (const s of list.slice(0, S.exHistLimit || 25)) {
      const nr = wRecs(s.w).filter((r) => r.exId === id).length;
      h +=
        `<div class="card" style="padding:10px 12px">
        <div class="row small">
          <b class="grow">
            ${fmtDay(s.w.start)} ${new Date(s.w.start).getFullYear()}` +
        `${nr ? ` <span class="medals">🏅${nr > 1 ? "×" + nr : ""}</span>` : ""}
          </b>
          <span class="pill">
            <span class="sw" style="background:${gymColor(s.w.gymId)}"></span>
            ${esc(gymName(s.w.gymId))}
          </span>
        </div>
        <div class="small num" style="margin-top:4px">
          ${s.e.sets
            .map(
              (st) =>
                `<span class="${st.t === "w" ? "muted" : ""}">${
                  st.t !== "n"
                    ? `<span class="lbl ${st.t}" style="font-weight:700">${st.t.toUpperCase()}</span> `
                    : ""
                }${esc(setStr(s.kind, st))}</span>`,
            )
            .join(" · ")}
        </div>
      </div>`;
    }
    if (list.length > (S.exHistLimit || 25)) {
      h += '<button class="btn block" data-act="exHistMore">Starší</button>';
    }
    h += "</div></section>";
    return h;
  }

  /* ---------- FOTKY U CVIKU (F2-05) ----------
     Vlastní fotky (stroj, nastavení) a vybrané fotky z free-exercise-db. Jsou v IndexedDB v úložišti
     "photos" (klíč = id), ne v dokumentech Store: fronta zápisů v localStorage by je neunesla.
     Záznam: {id, exId, gymId (null = bez fitka), at, first, w, h, mime, size, src, blob},
     src = "fedb:<id>/<n>" u fotky z online databáze. S.photos = popisy bez obrázku, phBlob = obrázky
     (Blob z IndexedDB, v paměti je jen odkaz), zobrazují se přes blob: adresy (CSP img-src blob:).
     Galerie (stránka cviku a info o cviku ve výběru): postava, fotka „první“ (jen jedna u cviku, platí
     ve všech fitkách), fotky aktuálního fitka (photoGym), bez fitka, jiných fitek; ve skupině od nejstarší.
     Před uložením se fotka zmenší (PH_MAX px, JPEG), tím zmizí i údaje z fotoaparátu (poloha GPS).
     Záloha: fotky jen v souboru s přepínačem „Zálohovat i fotky“, body obnovy je nemají; obnova fotky
     jen přidává (Nahradit vše přepíše jen fotky se stejným id), maže se jen ručně. */
  const PH_MAX = 1280,
    PH_Q = 0.82;
  const phBlob = new Map(), // id fotky → Blob
    phUrl = new Map(); // id fotky → blob: adresa
  const galPos = {}; // kolikátý snímek galerie je vidět (klíč = id cviku), 0 = postava
  let phAdd = null, // přidání fotek z telefonu: {exId, items: [{blob, w, h, url}], gym, first}
    pv = null, // fotka přes celou obrazovku: {exId, id, from ("exd" / "info"), gymOpen}
    fp = null; // fotky z online databáze: {exId, x (záznam FEDB), q, search, sel, gym, first}

  // popisy fotek při startu (obrázky zůstávají v IndexedDB, v paměti je jen odkaz na ně)
  async function photosLoad() {
    try {
      const rows = await Idb.all("photos");
      for (const [id, rec] of rows) {
        photoKeep(id, rec);
      }
      photoInputs();
      S.photosOn = true;
      scheduleRender();
    } catch (e) {
      console.warn("fotky", e);
    }
  }
  // záznam fotky → S.photos (popis) a phBlob (obrázek)
  function photoKeep(id, rec) {
    const meta = Object.assign({}, rec, { id });
    delete meta.blob;
    S.photos[id] = meta;
    if (phBlob.get(id) !== rec.blob) {
      photoUrlDrop(id);
      phBlob.set(id, rec.blob);
    }
  }
  function photoUrlDrop(id) {
    const u = phUrl.get(id);
    if (u) {
      URL.revokeObjectURL(u);
      phUrl.delete(id);
    }
  }
  // blob: adresa obrázku (vytvoří se při prvním zobrazení)
  function photoUrl(id) {
    let u = phUrl.get(id);
    if (!u && phBlob.get(id)) {
      u = URL.createObjectURL(phBlob.get(id));
      phUrl.set(id, u);
    }
    return u || "";
  }
  const photoId = () => "ph" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const photoErr = (e) =>
    e && e.code === "quota_exceeded"
      ? "Úložiště v telefonu je plné, fotka se neuložila."
      : "Fotku se nepodařilo uložit.";
  // uloží celý záznam fotky (i s obrázkem)
  async function photoSave(rec) {
    await Idb.put("photos", rec.id, rec);
    photoKeep(rec.id, rec);
  }
  async function photoDel(id) {
    await Idb.del("photos", id);
    delete S.photos[id];
    photoUrlDrop(id);
    phBlob.delete(id);
  }
  // změna popisu fotky (fitko, první); „první“ může být jen jedna fotka cviku, ostatním se vypne
  async function photoUpdate(id, change) {
    const p = S.photos[id];
    if (!p) return;
    if (change.first) {
      for (const o of Object.values(S.photos)) {
        if (o.exId === p.exId && o.first && o.id !== id) {
          await photoSave(Object.assign({}, o, { first: false, blob: phBlob.get(o.id) }));
        }
      }
    }
    await photoSave(Object.assign({}, p, change, { blob: phBlob.get(id) }));
  }
  // fitko, podle kterého se řadí fotky: rozdělaný nebo upravovaný trénink, jinak vybrané fitko
  function photoGym() {
    const fromEdit = S.route === "edit" || (S.route === "exd" && S.prevRoute === "edit");
    const d = fromEdit ? S.editDraft : S.active;
    return (d && d.gymId) || curGym();
  }
  // fotky cviku v pořadí galerie
  function photosOf(exId) {
    const gym = photoGym();
    const rank = (p) => (p.first ? 0 : p.gymId && p.gymId === gym ? 1 : !p.gymId ? 2 : 3);
    return Object.values(S.photos)
      .filter((p) => p.exId === exId)
      .sort(
        (a, b) => rank(a) - rank(b) || (rank(a) === 3 ? gymIdx(a.gymId) - gymIdx(b.gymId) : 0) || a.at - b.at,
      );
  }
  const gymExists = (id) => S.cfg.gyms.some((g) => g.id === id);
  // štítek fitka na fotce (fitko, které už neexistuje = „Smazané fitko“)
  function photoTag(p) {
    if (!p.gymId) return '<span class="gal-tag">Bez fitka</span>';
    if (!gymExists(p.gymId)) return '<span class="gal-tag">Smazané fitko</span>';
    return `<span class="gal-tag">
      <span class="sw" style="background:${gymColor(p.gymId)}"></span>${esc(gymName(p.gymId))}
    </span>`;
  }
  const galDots = (n, cur) =>
    `<div class="gal-dots" aria-hidden="true">` +
    `${Array.from({ length: n }, (_, i) => `<i${i === cur ? ' class="on"' : ""}></i>`).join("")}</div>`;
  // galerie: první snímek je postava, pak fotky, pod nimi tečky; cvik bez fotek má jen postavu jako dřív
  function photoGallery(ex, exId) {
    const list = photosOf(exId);
    if (!list.length) return exFigures(ex);
    const cur = Math.min(galPos[exId] || 0, list.length);
    return `<div class="gal">
      <div class="gal-track" data-gal="${esc(exId)}">
        <button type="button" class="gal-s fig" data-act="phView" data-v="${PV_FIG}" data-ex="${esc(exId)}"
            aria-label="Postava přes celou obrazovku">${exFigures(ex)}</button>
        ${list
          .map(
            (p, i) =>
              `<button type="button" class="gal-s" data-act="phView" data-v="${esc(p.id)}"
                  aria-label="Fotka ${i + 1} z ${list.length}">
                <img src="${photoUrl(p.id)}" alt="">
                ${photoTag(p)}${p.first ? '<span class="gal-pin">★ První</span>' : ""}
              </button>`,
          )
          .join("")}
      </div>
      ${galDots(list.length + 1, cur)}
    </div>`;
  }
  // tlačítka pro přidání fotek na stránce cviku (Vyfotit = rovnou fotoaparát)
  function photoAddRow(exId) {
    if (!S.photosOn) return "";
    return `<div class="gal-add">
      <label class="btn sm" for="phCamIn">Vyfotit</label>
      <label class="btn sm" for="phPickIn">Z galerie</label>
      <button class="btn sm" data-act="phFedb" data-v="${esc(exId)}">Z online databáze</button>
    </div>`;
  }
  /* políčka pro výběr souboru jsou mimo #app: překreslení stránky, zatímco je otevřený fotoaparát
     nebo galerie, by je jinak nahradilo a vybraná fotka by se ztratila */
  function photoInputs() {
    if (document.getElementById("phCamIn")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<input type="file" id="phCamIn" accept="image/*" capture="environment" hidden>
      <input type="file" id="phPickIn" accept="image/*" multiple hidden>`,
    );
  }
  // index snímku, na kterém galerie stojí (snímky jsou široké jako galerie + mezera)
  function galIndex(el) {
    const a = el.children[0],
      b = el.children[1];
    const step = b ? b.offsetLeft - a.offsetLeft : el.clientWidth;
    return Math.max(0, Math.min(el.children.length - 1, Math.round(el.scrollLeft / (step || 1))));
  }
  function galScrollTo(el, i) {
    const s = el.children[i];
    if (s) {
      el.scrollLeft = s.offsetLeft - el.children[0].offsetLeft;
    }
  }
  // po vykreslení nastaví galerie na naposledy viděný snímek
  function galRestore(root) {
    (root || document).querySelectorAll(".gal-track[data-gal]").forEach((el) => {
      galScrollTo(el, galPos[el.dataset.gal] || 0);
    });
  }
  function galReset() {
    for (const k in galPos) {
      delete galPos[k];
    }
  }
  // posun galerie prstem: tečky, zapamatovaná pozice, u fotky přes celou obrazovku popisky
  document.addEventListener(
    "scroll",
    (ev) => {
      const el = ev.target;
      if (!el.classList || !el.classList.contains("gal-track")) return;
      const i = galIndex(el);
      const dots = el.parentNode.querySelector(".gal-dots");
      if (dots) {
        dots.querySelectorAll("i").forEach((d, k) => d.classList.toggle("on", k === i));
      }
      if (el.dataset.gal) {
        galPos[el.dataset.gal] = i;
      }
      if (el.dataset.pv && pv) {
        const id = el.children[i] && el.children[i].dataset.id;
        if (id && id !== pv.id) {
          pv.id = id;
          pv.gymOpen = false;
          pvChrome();
        }
      }
    },
    true,
  );

  /* zmenší obrázek (soubor z telefonu nebo načtený <img>) na nejvýš PH_MAX px a uloží jako JPEG;
     orientaci podle fotoaparátu (EXIF) otočí prohlížeč, ostatní údaje z fotky se nepřenesou */
  async function photoShrink(src) {
    let bmp;
    try {
      bmp = await createImageBitmap(src, { imageOrientation: "from-image" });
    } catch (e) {
      bmp = await createImageBitmap(src);
    }
    const k = Math.min(1, PH_MAX / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k)),
      h = Math.max(1, Math.round(bmp.height * k));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; // průhledné PNG na bílém pozadí
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, w, h);
    if (bmp.close) {
      bmp.close();
    }
    const blob = await new Promise((ok, ko) => {
      c.toBlob((b) => (b ? ok(b) : ko(new Error("toBlob"))), "image/jpeg", PH_Q);
    });
    return { blob, w, h };
  }
  // nový záznam fotky ze zmenšeného obrázku
  const photoRec = (exId, it, gymId, at, src) =>
    Object.assign(
      {
        id: photoId(),
        exId,
        gymId: gymId || null,
        at,
        first: false,
        w: it.w,
        h: it.h,
        mime: it.blob.type || "image/jpeg",
        size: it.blob.size,
        blob: it.blob,
      },
      src ? { src } : {},
    );

  /* přidání fotek z telefonu: soubory z Vyfotit / Z galerie → zmenšit → okno s volbou fitka */
  async function photoFiles(inp) {
    const files = [...(inp.files || [])];
    inp.value = "";
    if (!files.length || !S.exDetail) return;
    const exId = S.exDetail;
    toast(files.length > 1 ? "Zpracovávám fotky…" : "Zpracovávám fotku…");
    const items = [];
    for (const f of files) {
      try {
        const it = await photoShrink(f);
        it.url = URL.createObjectURL(it.blob);
        items.push(it);
      } catch (e) {
        console.warn("fotka", e);
      }
    }
    if (!items.length) {
      toast(files.length > 1 ? "Fotky se nepodařilo načíst." : "Fotku se nepodařilo načíst.");
      return;
    }
    if (items.length < files.length) {
      toast("Některé fotky se nepodařilo načíst.");
    }
    phAdd = { exId, items, gym: exOf(exId).gymDep ? photoGym() : null, first: false };
    renderPhAdd();
  }
  // výběr fitka pro fotku (chips, v = id fitka, "" = bez fitka)
  function phGymChips(act, cur) {
    return `<div class="chips" data-ck="${act}">
      <button class="chip" data-act="${act}" data-v="" aria-pressed="${!cur}">Bez fitka</button>
      ${S.cfg.gyms
        .map(
          (g) =>
            `<button class="chip" data-act="${act}" data-v="${g.id}" aria-pressed="${cur === g.id}">` +
            `<span class="sw" style="background:${gymColor(g.id)}"></span>${esc(g.name)}</button>`,
        )
        .join("")}
    </div>`;
  }
  const photosWord = (n) => (n > 1 ? n + " " + plural(n, "fotku", "fotky", "fotek") : "fotku");
  function renderPhAdd(noanim) {
    const a = phAdd,
      n = a.items.length,
      size = a.items.reduce((s, it) => s + it.blob.size, 0);
    const b =
      `<div class="thumbs">
        ${a.items.map((it) => `<div class="th"><img src="${it.url}" alt=""></div>`).join("")}
      </div>
      <div class="small" style="font-weight:600">Fitko</div>
      ${phGymChips("phAddGym", a.gym)}
      <div class="xs muted">
        ${exOf(a.exId).gymDep ? "Cvik je vázaný na fitko, předvybrané je fitko, kde teď cvičíš. " : ""}` +
      `„Bez fitka“ = fotka se ukáže stejně ve všech fitkách.
      </div>
      <label class="switch">
        <input type="checkbox" data-act="phAddFirst" ${a.first ? "checked" : ""}>
        <span><b>Nastavit jako první</b><br><span class="xs muted">
          ${n > 1 ? "První z přidaných fotek bude" : "Fotka bude"} hned za postavou, s předností i před
          fotkami aktuálního fitka.</span></span>
      </label>
      <div class="xs muted">
        Po zmenšení ${n > 1 ? "mají fotky" : "má fotka"} ${fmtSize(size)} a uloží se jen v tomto
        telefonu.
      </div>`;
    openSheet(
      n > 1 ? "Přidat fotky (" + n + ")" : "Přidat fotku",
      b,
      `<button class="btn grow" data-act="closeSheet">Zrušit</button>
      <button class="btn primary grow" data-act="phAddSave">Uložit ${photosWord(n)}</button>`,
      noanim,
    );
  }
  async function phAddSave() {
    const a = phAdd;
    if (!a) return;
    phAdd = null;
    const ids = [];
    try {
      const at = Date.now();
      for (let k = 0; k < a.items.length; k++) {
        const rec = photoRec(a.exId, a.items[k], a.gym, at + k);
        await photoSave(rec);
        ids.push(rec.id);
      }
      if (a.first && ids.length) {
        await photoUpdate(ids[0], { first: true });
      }
      toast(ids.length > 1 ? "Fotky uloženy" : "Fotka uložena");
    } catch (e) {
      toast(photoErr(e));
    }
    for (const it of a.items) {
      URL.revokeObjectURL(it.url);
    }
    closeSheet();
    galShow(a.exId, ids[0]);
  }
  // galerie cviku ukáže danou fotku (po přidání, po návratu z celé obrazovky)
  function galShow(exId, id) {
    const i = photosOf(exId).findIndex((p) => p.id === id);
    if (i >= 0) {
      galPos[exId] = i + 1;
    }
    scheduleRender();
  }

  /* fotka přes celou obrazovku: stejné snímky jako galerie (postava, pak fotky), posun prstem, fitko,
     „první“, smazání; Zpět nebo tah dolů ji zavře. pv.id = id fotky, nebo PV_FIG = postava */
  const PV_FIG = "fig",
    PV_CLOSE_DY = 110; // o kolik px táhnout dolů, aby se zavřela
  function openViewer(id, from, exId) {
    const p = S.photos[id];
    exId = p ? p.exId : exId;
    if (!exId || (!p && id !== PV_FIG)) return;
    pv = { exId, id, from, gymOpen: false };
    renderViewer();
  }
  // snímky přes celou obrazovku v pořadí galerie: postava, pak id fotek
  const pvIds = (exId) => [PV_FIG].concat(photosOf(exId).map((p) => p.id));
  function renderViewer() {
    const list = photosOf(pv.exId),
      ids = pvIds(pv.exId);
    if (!list.length) {
      pvClose();
      return;
    }
    if (!ids.includes(pv.id)) {
      pv.id = ids[1];
    }
    kkEnd();
    const root = document.getElementById("sheetRoot");
    root.innerHTML = `<div class="pv" role="dialog" aria-modal="true" aria-label="Fotky cviku">
      <div class="pv-h">
        <button class="iconbtn" data-act="pvBack" aria-label="Zpět">${IC.back}</button>
        <b id="pvCount"></b>
        <span class="pv-name">${esc(exOf(pv.exId).name)}</span>
      </div>
      <div class="gal-track pv-track" data-pv="1">
        <div class="pv-s pv-fig" data-id="${PV_FIG}">${exFigures(exOf(pv.exId))}</div>
        ${list
          .map((p) => `<div class="pv-s" data-id="${esc(p.id)}"><img src="${photoUrl(p.id)}" alt=""></div>`)
          .join("")}
      </div>
      <div class="pv-f" id="pvFoot"></div>
    </div>`;
    document.body.style.overflow = "hidden";
    sheetNav = { lv: pv.from === "info" ? 3 : 1, back: pvClose, re: renderViewer };
    galScrollTo(root.querySelector(".pv-track"), ids.indexOf(pv.id));
    pvChrome();
  }
  /* popisky přes celou obrazovku: kolikátá fotka, tečky (stejně jako galerie), fitko, smazat, první;
     u postavy jsou ovládací prvky jen neviditelné, aby se výška fotek při posunu neměnila */
  function pvChrome() {
    const list = photosOf(pv.exId),
      ids = pvIds(pv.exId),
      fig = pv.id === PV_FIG,
      i = list.findIndex((p) => p.id === pv.id),
      p = fig ? list[0] : list[i];
    const cnt = document.getElementById("pvCount"),
      foot = document.getElementById("pvFoot");
    if (!p || !cnt || !foot) return;
    cnt.textContent = fig ? "Postava" : `Fotka ${i + 1} / ${list.length}`;
    const gymTxt = !p.gymId ? "bez fitka" : gymExists(p.gymId) ? gymName(p.gymId) : "smazané fitko",
      gymSw =
        p.gymId && gymExists(p.gymId)
          ? `<span class="sw" style="background:${gymColor(p.gymId)}"></span>`
          : "";
    foot.innerHTML = `${galDots(ids.length, ids.indexOf(pv.id))}
      <div class="stack${fig ? " pv-off" : ""}" style="gap:12px"${fig ? ' aria-hidden="true"' : ""}>
      <div class="row" style="gap:8px">
        <button class="btn grow pv-gym" data-act="pvGym" aria-expanded="${pv.gymOpen}">
          ${gymSw}
          <span class="grow">Fitko: ${esc(gymTxt)}</span>${pv.gymOpen ? "▴" : "▾"}
        </button>
        <button class="btn danger" data-act="pvDel">Smazat</button>
      </div>
      ${pv.gymOpen ? phGymChips("pvSetGym", p.gymId) : ""}
      <label class="switch">
        <input type="checkbox" data-act="pvFirst" ${p.first ? "checked" : ""}>
        <span><b>Nastavit jako první</b><br><span class="xs muted">Hned za postavou, s předností před
            ostatními fotkami cviku.</span></span>
      </label>
      </div>`;
    restoreChipScroll(foot);
  }
  // zavřít fotku: zpět na stránku cviku (na stejnou fotku) nebo do info o cviku
  function pvClose() {
    const v = pv;
    pv = null;
    if (!v) {
      closeSheet();
      return;
    }
    const i = pvIds(v.exId).indexOf(v.id);
    galPos[v.exId] = Math.max(0, i); // galerie zůstane na stejném snímku (i na postavě)
    if (v.from === "info") {
      sheetExInfo(v.exId);
    } else {
      closeSheet();
      scheduleRender();
    }
  }
  function pvDelAsk() {
    if (pv.id === PV_FIG) return;
    openSheet(
      "Smazat fotku?",
      `<p style="margin:0">Fotka se smaže z telefonu. Smazání nejde vrátit (fotky nejsou v bodech
        obnovy, jen v záloze do souboru s fotkami).</p>`,
      `<button class="btn grow" data-act="pvDelNo">Zrušit</button>
      <button class="btn danger grow" data-act="pvDelOk">Smazat</button>`,
      false,
      { lv: (pv.from === "info" ? 3 : 1) + 1, back: renderViewer, re: renderViewer },
    );
  }
  // smaže zobrazenou fotku a ukáže tu, která byla za ní (poslední → ta před ní)
  async function pvDelOk() {
    if (!pv || pv.id === PV_FIG) return;
    const idx = pvIds(pv.exId).indexOf(pv.id);
    try {
      await photoDel(pv.id);
      toast("Fotka smazána");
      const ids = pvIds(pv.exId);
      pv.id = ids[Math.max(1, Math.min(idx, ids.length - 1))];
    } catch (e) {
      toast("Fotku se nepodařilo smazat.");
    }
    renderViewer();
  }
  // změna fotky zobrazené přes celou obrazovku (fitko, první), pak znovu vykreslit (pořadí se může změnit)
  function pvUpdate(change) {
    if (!pv || pv.id === PV_FIG) return;
    photoUpdate(pv.id, change)
      .catch((e) => toast(photoErr(e)))
      .then(() => {
        if (pv) {
          pv.gymOpen = false;
          renderViewer();
        }
      });
  }

  // tah dolů přes celou obrazovku ji zavře (jako galerie v telefonu); tah do strany = další snímek
  let pvDrag = null;
  document.addEventListener(
    "touchstart",
    (ev) => {
      const tr = ev.target.closest && ev.target.closest(".pv-track");
      pvDrag =
        tr && ev.touches.length === 1
          ? { tr, x: ev.touches[0].clientX, y: ev.touches[0].clientY, dy: 0, on: false }
          : null;
    },
    { passive: true },
  );
  document.addEventListener(
    "touchmove",
    (ev) => {
      if (!pvDrag) return;
      const dx = ev.touches[0].clientX - pvDrag.x,
        dy = ev.touches[0].clientY - pvDrag.y;
      if (!pvDrag.on) {
        if (Math.abs(dx) > 10 && Math.abs(dx) >= Math.abs(dy)) {
          pvDrag = null; // posun do strany
          return;
        }
        if (dy < 10) return;
        pvDrag.on = true;
        pvDrag.tr.style.transition = "none";
      }
      pvDrag.dy = Math.max(0, dy);
      pvDrag.tr.style.transform = `translateY(${pvDrag.dy}px)`;
      pvDrag.tr.style.opacity = String(Math.max(0.3, 1 - pvDrag.dy / 400));
    },
    { passive: true },
  );
  function pvDragEnd() {
    const d = pvDrag;
    pvDrag = null;
    if (!d || !d.on) return;
    if (d.dy > PV_CLOSE_DY && pv) {
      navBack();
      return;
    }
    d.tr.style.transition = "transform 0.15s, opacity 0.15s";
    d.tr.style.transform = "";
    d.tr.style.opacity = "";
  }
  document.addEventListener("touchend", pvDragEnd);
  document.addEventListener("touchcancel", pvDragEnd);

  /* fotky z online databáze free-exercise-db: u cviku se shodou rovnou jeho fotky, jinak hledání;
     stáhnou se jen vybrané (přes <img> s CORS a canvas, bez fetch, v CSP stačí img-src) */
  function fedbPhotos(exId) {
    fp = { exId, x: null, q: exOf(exId).name, search: false, sel: [], gym: null, first: false };
    renderFp();
  }
  // stejný cvik v online databázi: shoda s výchozí databází (h) nebo cvik převzatý z ní (src)
  function fedbMatch(exId) {
    const ex = exOf(exId);
    const src = ex.src && ex.src.startsWith("fedb:") ? ex.src.slice(5) : null;
    return FEDB.find((x) => !x.ni && (x.h === exId || x.id === src)) || null;
  }
  const fedbSrc = (x, n) => FEDB_IMG + x.id + "/" + n + ".jpg";
  // fotka z online databáze už je u cviku uložená
  const fedbSaved = (exId, x, n) =>
    Object.values(S.photos).some((p) => p.exId === exId && p.src === "fedb:" + x.id + "/" + n);
  function renderFp(noanim) {
    const title = "Fotky z online databáze";
    const sub = !!(fp.x && fp.search);
    const nav = {
      lv: sub ? 2 : 1,
      back: sub ? fpBack : closeSheet,
      re: () => renderFp(true),
    };
    if (typeof FEDB === "undefined") {
      openSheet(
        title,
        '<div class="empty" id="fpLoad">Načítám online databázi…</div>',
        '<button class="btn grow" data-act="closeSheet">Zrušit</button>',
        noanim,
        nav,
      );
      fedbLoad()
        .then(() => {
          if (fp) {
            renderFp(true);
          }
        })
        .catch(() => {
          const el = document.getElementById("fpLoad");
          if (el) {
            el.innerHTML = `Online databázi se nepodařilo načíst. Poprvé je potřeba internet, potom
              funguje i offline.<br>
              <button class="btn sm" data-act="fpRetry" style="margin-top:10px">Zkusit znovu</button>`;
          }
        });
      return;
    }
    if (!fp.x && !fp.search) {
      fp.x = fedbMatch(fp.exId);
      fp.search = !fp.x;
    }
    if (!fp.x) {
      const direct = fedbMatch(fp.exId);
      const b = `<p class="small" style="margin:0">
          ${
            direct
              ? "Najdi cvik v online databázi a vyber jeho fotky."
              : `Cvik <b>${esc(exOf(fp.exId).name)}</b> v online databázi nemá přímou shodu. Najdi
                podobný a vyber jeho fotky.`
          }
        </p>
        <input class="inp" id="fpQ" data-f="fpQ" value="${esc(fp.q)}" autocomplete="off"
            placeholder="Název anglicky i česky">
        <div class="stack" id="fpList" style="gap:6px"></div>`;
      openSheet(title, b, '<button class="btn grow" data-act="closeSheet">Zrušit</button>', noanim, nav);
      refreshFp();
      return;
    }
    const x = fp.x,
      n = fp.sel.length;
    const b = `<p class="small" style="margin:0">
        Fotky cviku <b>${esc(x.n)}</b>${x.cz ? ` (${esc(x.cz)})` : ""} z databáze free-exercise-db
        (volné dílo). Klepnutím vyber, které uložit do telefonu.
      </p>
      <div class="thumbs big">
        ${[0, 1]
          .map((k) => {
            const saved = fedbSaved(fp.exId, x, k),
              on = fp.sel.includes(k);
            return `<button type="button" class="th${on ? " sel" : ""}${saved ? " saved" : ""}"
                data-act="fpSel" data-v="${k}" aria-pressed="${on}"${saved ? " disabled" : ""}>
              <img crossorigin="anonymous" src="${esc(fedbSrc(x, k))}" alt="">
              <span class="ck">${on ? "✓" : ""}</span>
              ${saved ? '<span class="gal-tag">Už uložená</span>' : ""}
            </button>`;
          })
          .join("")}
      </div>
      <div class="small" style="font-weight:600">Fitko</div>
      ${phGymChips("fpGym", fp.gym)}
      <label class="switch">
        <input type="checkbox" data-act="fpFirst" ${fp.first ? "checked" : ""}>
        <span><b>Nastavit jako první</b></span>
      </label>
      <div class="xs muted">Stažení potřebuje internet, uložené fotky pak fungují i offline.</div>
      ${
        sub
          ? ""
          : `<button class="linkbtn small" data-act="fpSearch" style="color:var(--accent-2);font-weight:600">
              Vybrat fotky jiného cviku z databáze
            </button>`
      }`;
    openSheet(
      title,
      b,
      `<button class="btn grow" data-act="${sub ? "fpBack" : "closeSheet"}">${sub ? "Zpět" : "Zrušit"}</button>
      <button class="btn primary grow" data-act="fpSave"${n ? "" : " disabled"}>
        ${n ? "Uložit " + photosWord(n) : "Vyber fotky"}
      </button>`,
      noanim,
      nav,
    );
  }
  function fpBack() {
    fp.x = null;
    fp.sel = [];
    renderFp(true);
  }
  // výsledky hledání (jen cviky s fotkami)
  function refreshFp() {
    const el = document.getElementById("fpList");
    if (!el || !fp) return;
    const q = fp.q.trim();
    const rows = q ? fedbRows(q).filter((x) => !x.ni) : [];
    if (!q) {
      el.innerHTML = '<div class="empty">Napiš název cviku anglicky nebo česky.</div>';
      return;
    }
    if (!rows.length) {
      el.innerHTML = '<div class="empty">Nic nenalezeno. Zkus jiné slovo, třeba anglicky.</div>';
      return;
    }
    el.innerHTML = rows
      .slice(0, 30)
      .map(
        (x) =>
          `<div class="pickrow">
            <button class="pick" data-act="fpPick" data-v="${esc(x.id)}">
              <img class="fsimg" crossorigin="anonymous" src="${esc(fedbSrc(x, 0))}" alt="" loading="lazy">
              <div class="grow">
                <div style="font-weight:600">${esc(x.n)}</div>
                <div class="cz">${esc(x.cz)}</div>
              </div>
            </button>
          </div>`,
      )
      .join("");
  }
  // načte obrázek z free-exercise-db tak, aby šel zmenšit (CORS, jinak by canvas nešel uložit)
  function fedbImg(url) {
    return new Promise((ok, ko) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.addEventListener("load", () => ok(img));
      img.addEventListener("error", () => ko(new Error("img")));
      img.src = url;
    });
  }
  // stáhne vybrané fotky z online databáze a uloží je k cviku; vrací id první uložené
  async function photosFromFedb(exId, x, sel, gym, first) {
    const at = Date.now();
    let firstId = null;
    for (let k = 0; k < sel.length; k++) {
      const it = await photoShrink(await fedbImg(fedbSrc(x, sel[k])));
      const rec = photoRec(exId, it, gym, at + k, "fedb:" + x.id + "/" + sel[k]);
      await photoSave(rec);
      if (!firstId) {
        firstId = rec.id;
      }
    }
    if (first && firstId) {
      await photoUpdate(firstId, { first: true });
    }
    return firstId;
  }
  const fedbPhotoErr = (e) =>
    e && e.message === "img" ? "Fotky se nepodařilo stáhnout. Jsi připojený k internetu?" : photoErr(e);
  async function fpSave() {
    const f = fp;
    if (!f || !f.x || !f.sel.length) return;
    toast("Stahuji fotky…");
    try {
      const id = await photosFromFedb(
        f.exId,
        f.x,
        f.sel.slice().sort((a, b) => a - b),
        f.gym,
        f.first,
      );
      fp = null;
      closeSheet();
      toast(f.sel.length > 1 ? "Fotky uloženy" : "Fotka uložena");
      galShow(f.exId, id);
    } catch (e) {
      toast(fedbPhotoErr(e));
      scheduleRender();
    }
  }

  /* záloha fotek (F0-01 formát v2, pole photos): {id: {exId, gymId, at, first, w, h, mime, size, src,
     data (base64)}}; jen do souboru, když je zapnuté „Zálohovat i fotky“ (Local bkPhotos) */
  function photoStats() {
    const list = Object.values(S.photos);
    return { n: list.length, size: list.reduce((a, p) => a + (p.size || 0), 0) };
  }
  const blobB64 = (b) =>
    new Promise((ok, ko) => {
      const r = new FileReader();
      r.addEventListener("load", () => ok(String(r.result).split(",")[1] || ""));
      r.addEventListener("error", () => ko(r.error));
      r.readAsDataURL(b);
    });
  function b64Blob(data, mime) {
    const bin = atob(data),
      u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      u[i] = bin.charCodeAt(i);
    }
    return new Blob([u], { type: mime });
  }
  async function photosExport() {
    const out = {};
    for (const id in S.photos) {
      const b = phBlob.get(id);
      if (!b) continue;
      const meta = Object.assign({}, S.photos[id]);
      delete meta.id;
      out[id] = Object.assign(meta, { data: await blobB64(b) });
    }
    return out;
  }
  // fotky ze souboru zálohy: jen platné záznamy (normBackup)
  function photosClean(src) {
    const out = {};
    for (const id in src) {
      const p = src[id];
      const ok =
        /^[\w-]{1,60}$/.test(id) &&
        p &&
        typeof p.data === "string" &&
        typeof p.exId === "string" &&
        /^image\/(jpeg|png|webp)$/.test(p.mime || "");
      if (!ok) continue;
      out[id] = {
        exId: p.exId,
        gymId: typeof p.gymId === "string" && p.gymId ? p.gymId : null,
        at: +p.at || 0,
        first: !!p.first,
        w: +p.w || 0,
        h: +p.h || 0,
        mime: p.mime,
        data: p.data,
      };
      if (typeof p.src === "string") {
        out[id].src = p.src;
      }
    }
    return out;
  }
  /* uloží fotky ze zálohy: overwrite = přepsat i fotky se stejným id (Nahradit vše), jinak jen chybějící;
     žádná fotka se nesmaže. Vrací počet uložených. */
  async function photosImport(photos, overwrite) {
    let n = 0;
    for (const id in photos || {}) {
      if (!overwrite && S.photos[id]) continue;
      const p = Object.assign({}, photos[id]);
      let blob;
      try {
        blob = b64Blob(p.data, p.mime);
      } catch (e) {
        continue;
      }
      delete p.data;
      await photoSave(Object.assign(p, { id, size: blob.size, blob }));
      n++;
    }
    // u každého cviku nejvýš jedna „první“ (nechá se ta naposledy přidaná)
    const firsts = {};
    for (const p of Object.values(S.photos)) {
      if (p.first) {
        (firsts[p.exId] = firsts[p.exId] || []).push(p);
      }
    }
    for (const exId in firsts) {
      const list = firsts[exId].sort((a, b) => b.at - a.at);
      for (const p of list.slice(1)) {
        await photoSave(Object.assign({}, p, { first: false, blob: phBlob.get(p.id) }));
      }
    }
    return n;
  }

  /* ---------- TĚLO (měření) ---------- */
  const BODY_F = [
    ["weight", "Hmotnost", "kg"],
    ["fat", "Tělesný tuk", "%"],
    ["fatMass", "Hmotnost tuku", "kg"],
    ["muscleMass", "Kosterní sval", "kg"],
    ["muscle", "Kosterní sval", "%"],
    ["water", "Tělesná voda", "kg"],
    ["bmr", "Bazální metabolismus", "kcal"],
    ["bmi", "BMI", ""],
    ["visceral", "Viscerální tuk", "úroveň"],
    ["waist", "Pas", "cm"],
    ["chest", "Hrudník", "cm"],
    ["arm", "Paže", "cm"],
    ["thigh", "Stehno", "cm"],
  ];
  function vBody() {
    const items = Object.entries(S.body)
      .map(([id, v]) => Object.assign({ id }, v))
      .sort((a, b) => b.date - a.date);
    let h = topbar(
      "Tělo",
      items.length ? "Poslední měření " + fmtDate(items[0].date) : "Hmotnost, složení, obvody",
    );
    h += '<button class="btn primary block" data-act="addBody">+ Nové měření</button>';
    const m = S.bodyMetric;
    const f = BODY_F.find((x) => x[0] === m) || BODY_F[0];
    const since = rangeSince(S.bodyRange);
    const all = items.filter((i) => isFinite(+i[m]) && i[m] !== null && i[m] !== "");
    // víc měření v jednom dni sloučím do denního průměru
    const byDay = {};
    for (const i of all) {
      if (i.date < since) continue;
      const d = new Date(i.date);
      d.setHours(12, 0, 0, 0);
      const k = d.getTime();
      (byDay[k] = byDay[k] || []).push(+i[m]);
    }
    const pts = Object.keys(byDay)
      .map(Number)
      .sort((a, b) => a - b)
      .map((k) => ({ x: k, y: byDay[k].reduce((s, v) => s + v, 0) / byDay[k].length }));
    // klouzavý průměr: středové okno 7 dní
    const WIN = 7 * DAY;
    const avg = pts.map((p) => {
      let sum = 0,
        n = 0;
      for (const q of pts) {
        if (Math.abs(q.x - p.x) <= WIN / 2) {
          sum += q.y;
          n++;
        }
      }
      return { x: p.x, y: sum / n, n };
    });
    const avgNow = avg.length ? avg[avg.length - 1].y : null;
    h += `<section class="sec"><div class="chips" data-ck="bodyMetric">${BODY_F.map(
      ([k, l, u]) =>
        `<button class="chip" data-act="bodyMetric" data-v="${k}" aria-pressed="${m === k}">${l}${
          u && u !== "kg" && u !== "cm"
            ? " (" + u + ")"
            : u === "kg" && (k === "fatMass" || k === "muscleMass" || k === "water")
              ? " (kg)"
              : ""
        }</button>`,
    ).join("")}</div>`;
    h += `<div style="margin-top:8px">${rangeSeg("bodyRange", S.bodyRange)}</div>`;
    if (pts.length) {
      const lastV = pts[pts.length - 1].y,
        firstV = pts[0].y,
        diff = lastV - firstV;
      const unit = f[2] ? " " + f[2] : "";
      const dAvg = avg.length > 1 ? avg[avg.length - 1].y - avg[0].y : 0;
      h += `<div class="card" style="margin-top:10px">
        <div class="row" style="align-items:flex-end;margin-bottom:6px">
          <div class="grow">
            <div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:600">
              ${esc(f[1])}
            </div>
            <div style="font-family:var(--display);font-size:var(--fs-4xl);font-weight:600;line-height:1"
                class="num">
              ${fmtKg(lastV)} <span style="font-size:var(--fs-lg)">${esc(f[2])}</span>
            </div>
            ${
              avgNow != null
                ? `<div class="xs muted num">
                  průměr 7 dní ${fmtKg(Math.round(avgNow * 10) / 10)}${unit}
                </div>`
                : ""
            }
          </div>
          <div class="small muted num" style="text-align:right">
            ${
              pts.length > 1
                ? `${(diff > 0 ? "+" : "") + fmtKg(Math.round(diff * 10) / 10) + unit} ` +
                  `od ${fmtDateS(pts[0].x)}
                <div class="xs">
                  průměr ${dAvg > 0 ? "+" : ""}${fmtKg(Math.round(dAvg * 10) / 10)}${unit}
                </div>`
                : ""
            }
          </div>
        </div>
        ${chartPh(
          {
            type: "line",
            label: f[1],
            unit: unit,
            series: [
              { name: "Měření", color: "var(--ink-3)", pts, noLine: true, dots: true },
              { name: "Klouzavý průměr 7 dní", color: "var(--chart)", pts: avg, noDots: true, w: 2.4 },
            ],
          },
          190,
        )}
        <div class="legend">
          <span><i style="background:var(--chart)"></i>Klouzavý průměr 7 dní</span>
          <span><i style="background:var(--ink-3);height:7px;width:7px;border-radius:50%"></i>Jednotlivá
            měření</span>
        </div>
        <div class="xs muted" style="margin-top:6px">
          ${pts.length} ${plural(pts.length, "den s měřením", "dny s měřením", "dnů s měřením")} v
          období${all.length > pts.length ? " z " + all.length + " měření celkem" : ""}
        </div>
      </div>`;
    } else {
      h += `<div class="empty" style="margin-top:10px">
        Pro „${esc(f[1])}“ v tomto období žádné měření.
      </div>`;
    }
    h += `</section>
    <section class="sec">
      <div class="sec-h"><h2>Měření</h2><span class="xs muted">${items.length}</span></div>
      <div class="stack" style="gap:6px">`;
    for (const i of items.slice(0, S.bodyLimit || 30)) {
      h += `<button class="hw" data-act="editBody" data-v="${i.id}">
        <div class="row">
          <b class="grow">${fmtDate(i.date)}</b>
          ${i.note ? `<span class="pill">${esc(i.note)}</span>` : ""}
        </div>
        <div class="line num">
          ${BODY_F.filter(([k]) => i[k] !== undefined && i[k] !== null && i[k] !== "")
            .map(([k, l, u]) => `<span>${esc(l)} <b>${fmtKg(+i[k])}</b> ${esc(u)}</span>`)
            .join("")}
        </div>
      </button>`;
    }
    if (!items.length) {
      h += '<div class="empty">Zatím žádná měření.</div>';
    }
    if (items.length > (S.bodyLimit || 30)) {
      h += '<button class="btn block" data-act="bodyMore">Starší měření</button>';
    }
    h += "</div></section>";
    return h;
  }
  // pravidlo kontroly čísla (F1-10) podle jednotky měření
  const bodyRule = (unit) => (unit === "%" ? "pct" : unit === "kcal" ? "kcal" : "body");
  function sheetBody(id, nav) {
    const v = id ? S.body[id] : { date: Date.now() };
    let b = `<label class="f">
      Datum
      <input class="inp" type="date" id="b-date" value="${toDateInput(v.date)}">
    </label>
    <div class="grid2">`;
    for (const [k, l, u] of BODY_F) {
      const rule = bodyRule(u);
      const val = v[k] != null ? numStr(v[k]).replace(".", ",") : "";
      b += `<label class="f">
        ${esc(l)}${u ? " (" + esc(u) + ")" : ""}
        <input class="inp${numCls(rule, val)}" id="b-${k}" inputmode="decimal" data-num="${rule}"
            data-lab="${esc(l)}" value="${esc(val)}">
      </label>`;
    }
    b += `</div>
    <label class="f">Poznámka<input class="inp" id="b-note" value="${esc(v.note || "")}"></label>`;
    openSheet(
      id ? "Upravit měření" : "Nové měření",
      b,
      `${id ? `<button class="btn danger" data-act="delBody" data-v="${id}">Smazat</button>` : ""}
      <button class="btn primary grow" data-act="saveBody" data-v="${id || ""}">Uložit</button>`,
      false,
      nav,
    );
  }

  /* ---------- NASTAVENÍ (F3-09) ----------
     Rozcestník se skupinami, každá skupina na vlastní podstránce (S.setPage, "" = rozcestník).
     Otevřená podstránka se pamatuje v Local "setPage" (vrátí se po aktualizaci nebo zavření appky),
     klepnutí na záložku Nastavení vrátí rozcestník (goTab). Zpět z podstránky = rozcestník
     (navBack, navDepth). Nová volba patří do některé skupiny, ne na rozcestník. */
  const SET_PAGES = [
    { id: "gyms", name: "Fitka", icon: "gym", body: () => gymSettings() },
    {
      id: "train",
      name: "Trénink",
      icon: "train",
      body: () => stepperSettings() + restSettings() + bodyWeightSettings(),
    },
    { id: "rec", name: "Rekordy", icon: "medal", body: () => recSettings() },
    { id: "look", name: "Vzhled", icon: "theme", body: () => themeSettings() },
    { id: "data", name: "Data a záloha", icon: "backup", body: () => backupSettings() },
    { id: "about", name: "O aplikaci", icon: "info", body: () => versionSettings() + aboutSettings() },
  ];
  // otevře podstránku Nastavení ("" = rozcestník)
  function setPageOpen(id) {
    S.setPage = id;
    lsSet("setPage", id);
    go("set");
  }
  function vSettings() {
    const page = SET_PAGES.find((p) => p.id === S.setPage);
    if (!page) {
      S.setPage = ""; // neznámá podstránka (např. z jiné verze appky) = rozcestník
      return vSettingsHub();
    }
    const back = `<button class="iconbtn" data-act="setBack" aria-label="Zpět">${IC.back}</button>`;
    return topbar(page.name, "Nastavení", back) + page.body();
  }
  // rozcestník: jen názvy skupin, u zálohy upozornění, když je čas zálohovat (jako na úvodní obrazovce)
  function vSettingsHub() {
    let h = topbar("Nastavení");
    h += '<section class="sec"><div class="card setlist">';
    for (const page of SET_PAGES) {
      const warn = page.id === "data" && backupDue();
      let note = "";
      if (warn) {
        const last = lastBackupAt();
        note = last ? "Poslední záloha " + agoLabel(last) : "Zatím žádná záloha";
      }
      h += `<button class="setrow${warn ? " warn" : ""}" data-act="setOpen" data-v="${page.id}">
        <span class="setrow-ic">${IC[page.icon]}</span>
        <span class="grow">
          <b>${esc(page.name)}</b>${note ? `<span class="xs">${esc(note)}</span>` : ""}
        </span>
        <span class="setrow-go">${IC.next}</span>
      </button>`;
    }
    h += "</div></section>";
    return h;
  }
  /* Nastavení → Fitka */
  function gymSettings() {
    const counts = {};
    for (const w of derive().all) {
      counts[w.gymId] = (counts[w.gymId] || 0) + 1;
    }
    let h = `<section class="sec">
        <div class="sec-h">
          <h2>Moje fitka</h2>
          ${icoBtn("addGym", "plus", "Přidat fitko")}
        </div>
        <div class="stack dnd-list" data-dnd="gyms" style="gap:6px">`;
    const many = S.cfg.gyms.length > 1;
    S.cfg.gyms.forEach((g) => {
      h += `<div class="card row dnd-it" style="padding:10px 12px">
        <span class="sw" style="width:12px;height:12px;border-radius:50%;background:${gymColor(g.id)}"></span>
        <div class="grow">
          <b>${esc(g.name)}</b>
          <div class="xs muted">
            ${counts[g.id] || 0} tréninků${S.cfg.defaultGymId === g.id ? " · výchozí" : ""}
          </div>
        </div>
        <button class="btn sm" data-act="editGym" data-v="${g.id}">Upravit</button>
        ${many ? dndGrip(g.name) : ""}
      </div>`;
    });
    h += "</div></section>";
    return h;
  }
  /* Nastavení → Vzhled */
  function themeSettings() {
    return `<section class="sec">
      <div class="sec-h"><h2>Motiv</h2></div>
      <div class="card">
        <div class="seg seg-wide">
          ${[
            ["dark", "Tmavý"],
            ["light", "Světlý"],
            ["auto", "Podle systému"],
          ]
            .map(
              ([k, l]) =>
                `<button data-act="theme" data-v="${k}" aria-pressed="${themePref() === k}">${l}` +
                `</button>`,
            )
            .join("")}
        </div>
      </div>
    </section>
    <section class="sec">
      <div class="sec-h"><h2>Velikost písma</h2></div>
      <div class="card">
        <div class="seg seg-wide">
          ${FONT_SCALES.map(
            ([k, l]) =>
              `<button data-act="fontScale" data-v="${k}" aria-pressed="${fontScalePref() === k}">${l}` +
              `</button>`,
          ).join("")}
        </div>
      </div>
    </section>`;
  }
  /* Nastavení → Trénink → Tělesná hmotnost */
  function bodyWeightSettings() {
    return `<section class="sec">
      <div class="sec-h"><h2>Tělesná hmotnost</h2></div>
      <div class="card stack">
        <div class="row">
          <span class="grow small">Používá se u cviků s vlastní vahou pro objem a odhad 1RM.</span>
          <label class="f" style="width:110px">
            kg
            <input class="inp${numCls("bw", S.cfg.bodyWeight || 80)}" id="bwInp" data-f="bodyWeight"
                data-num="bw" inputmode="decimal" value="${esc(S.cfg.bodyWeight || 80)}">
          </label>
        </div>
        <div class="xs muted">
          ${
            Object.values(S.body || {}).some((b) => isFinite(+b.weight))
              ? "Máš uložená měření v záložce Tělo, takže se k datu tréninku bere nejbližší dřívější měření. " +
                "Tahle hodnota slouží jen pro starší tréninky před prvním měřením."
              : "Zatím nemáš žádné měření v záložce Tělo. Až nějaké přidáš, bude se brát ono."
          }
        </div>
      </div>
    </section>`;
  }
  /* Nastavení → O aplikaci → Zdroje */
  function aboutSettings() {
    return (
      `<section class="sec">
        <div class="sec-h"><h2>Zdroje</h2></div>
        <div class="card small muted">
          Schéma svalů vychází z anatomických kreseb <b>Ryana Gravese</b>, použitých pod licencí ` +
      `<a class="link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank"
              rel="noopener">CC BY 4.0</a> (balíček flutter-body-atlas). Odkazy na cviky vedou na
          hevyapp.com.
        </div>
      </section>`
    );
  }
  function sheetGym(id) {
    const g = id ? S.cfg.gyms.find((x) => x.id === id) : { name: "" };
    const cnt = id ? derive().all.filter((w) => w.gymId === id).length : 0;
    let b = `<label class="f">
      Název
      <input class="inp" id="g-name" value="${esc(g.name)}" placeholder="např. Fitness Brno-střed">
    </label>
    <label class="switch">
      <input type="checkbox" id="g-def" ${id && S.cfg.defaultGymId === id ? "checked" : ""}> Výchozí
      fitko
    </label>`;
    // barva (F3-01): předvybraná vlastní, u nového fitka první volná; pod obsazenou barvou název fitka
    const cur = id && g.col ? g.col : freeGymCol(S.cfg.gyms);
    b += `<div>
      <div class="f lbl-f" style="margin-bottom:8px">Barva</div>
      <div class="cpick" role="radiogroup" aria-label="Barva fitka">
        ${Array.from({ length: GYM_COLORS }, (_, i) => i + 1)
          .map((c) => {
            const o = S.cfg.gyms
              .filter((x) => x.col === c && x.id !== id)
              .map((x) => x.name)
              .join(", ");
            return `<button type="button" role="radio" data-act="gymCol" data-v="${c}"
                aria-checked="${c === cur}"
                aria-label="Barva ${c}${o ? ", má ji " + esc(o) : ""}"><i style="background:var(--s${c})">
                ${c === cur ? "✓" : ""}
              </i><small>${o ? esc(o) : "&nbsp;"}</small></button>`;
          })
          .join("")}
      </div>
    </div>`;
    if (id && cnt) {
      b += `<div class="small muted">
        Fitko má ${cnt} tréninků, proto ho nelze smazat. Tréninky můžeš přesunout jinam v Historii →
        Upravit.
      </div>`;
    }
    openSheet(
      id ? "Upravit fitko" : "Nové fitko",
      b,
      `${
        id && !cnt && S.cfg.gyms.length > 1
          ? `<button class="btn danger" data-act="delGym" data-v="${id}">Smazat</button>`
          : ""
      }<button class="btn primary grow" data-act="saveGym" data-v="${id || ""}">Uložit</button>`,
    );
  }

  /* ---------- výběr cviků ---------- */
  let pick = { sel: [], q: "", m: "all", eq: "all", hist: false, mode: "add", replaceI: null };
  function openPicker(mode, replaceI) {
    pick = { sel: [], q: "", m: "all", eq: "all", hist: pick.hist, mode, replaceI };
    renderPicker();
  }
  function pickerRows() {
    const { byEx } = derive();
    const recent = {};
    for (const w of derive().all.slice(0, 60)) {
      for (const e of w.ex || []) {
        recent[e.exId] = (recent[e.exId] || 0) + 1;
      }
    }
    let arr = Object.entries(S.exLib).filter(
      ([id, e]) =>
        !e.archived &&
        (pick.m === "all" || exGroup(e) === pick.m) &&
        (pick.eq === "all" || e.equip === pick.eq) &&
        (!pick.hist || byEx[id]) &&
        exMatch(e, pick.q),
    );
    arr.sort(
      (a, b) =>
        (recent[b[0]] || 0) - (recent[a[0]] || 0) ||
        (byEx[b[0]] ? 1 : 0) - (byEx[a[0]] ? 1 : 0) ||
        a[1].name.localeCompare(b[1].name),
    );
    return arr;
  }
  function pickerList() {
    const { byEx } = derive();
    const arr = pickerRows();
    if (!arr.length) {
      return (
        `<div class="empty">
        Nic neodpovídá filtru.` +
        `${
          pick.q.trim()
            ? `<br>
            <button class="btn sm" data-act="fedbOpen" data-v="picker" style="margin-top:10px">
              Hledat „${esc(pick.q.trim())}“ online
            </button>`
            : ""
        }` +
        `</div>`
      );
    }
    let h = "";
    for (const [id, e] of arr.slice(0, pick.limit || 120)) {
      const on = pick.sel.includes(id);
      const n = byEx[id] ? byEx[id].length : 0;
      h +=
        `<div class="pickrow">
        <button class="pick" data-act="pickToggle" data-v="${esc(id)}" aria-pressed="${on}">
          <span class="chk">${on ? IC.check : ""}</span>
          <div class="grow">
            <div style="font-weight:600">${esc(e.name)}</div>
            ${e.cz ? `<div class="cz">${esc(e.cz)}</div>` : ""}
            <div class="xs muted">
              ${esc(
                exPri(e)
                  .map((k) => MUSCLE_MAP.NAMES[k])
                  .join(", ") ||
                  MUSCLES[e.muscle] ||
                  "",
              )} ` +
        `· ${esc(EQUIP[e.equip] || "")}${n ? " · " + n + "× v historii" : ""}` +
        `${e.gymDep ? " · vázáno na fitko" : ""}
            </div>
          </div>
        </button>
        <button class="infob" data-act="exInfo" data-v="${esc(id)}"
            aria-label="Info o cviku ${esc(e.name)}" title="Popis a statistiky">
          i
        </button>
      </div>`;
    }
    if (arr.length > (pick.limit || 120)) {
      h += `<button class="btn block" data-act="pickMore">
        Další cviky (${arr.length - (pick.limit || 120)})
      </button>`;
    }
    return h;
  }
  function pickerBody() {
    const n = pickerRows().length;
    return `<input class="inp" id="pickQ" data-f="pickQ" placeholder="Hledat cvik (anglicky i česky)…"
        value="${esc(pick.q)}" autocomplete="off">
    <div class="chips" data-ck="pickM">
      <button class="chip" data-act="pickM" data-v="all" aria-pressed="${pick.m === "all"}">
        Všechny partie
      </button>
      ${Object.entries(MUSCLES)
        .filter(([k]) => k !== "other")
        .map(
          ([k, l]) =>
            `<button class="chip" data-act="pickM" data-v="${k}" aria-pressed="${pick.m === k}">
              ${l}
            </button>`,
        )
        .join("")}
    </div>
    <div class="chips" data-ck="pickEq">
      <button class="chip" data-act="pickEq" data-v="all" aria-pressed="${pick.eq === "all"}">
        Vše
      </button>
      ${Object.entries(EQUIP)
        .map(
          ([k, l]) =>
            `<button class="chip" data-act="pickEq" data-v="${k}" aria-pressed="${pick.eq === k}">
              ${l}
            </button>`,
        )
        .join("")}
    </div>
    <div class="row wrap-r" style="justify-content:space-between">
      <button class="chip" data-act="pickHist" aria-pressed="${pick.hist}">Jen cviky z historie</button>
      <span class="xs muted">${n} ${plural(n, "cvik", "cviky", "cviků")}</span>
    </div>
    <div class="row wrap-r" style="gap:8px">
      <button class="btn sm" data-act="newEx">+ Vytvořit vlastní cvik</button>
      <button class="btn sm" data-act="fedbOpen" data-v="picker">Hledat v online databázi</button>
    </div>
    <div class="stack" id="pickList" style="gap:6px">${pickerList()}</div>`;
  }
  function renderPicker(keep) {
    const sb = document.querySelector(".sheet-b");
    const st = keep && sb ? sb.scrollTop : 0;
    saveChipScroll(sb || undefined);
    const f = `<button class="btn primary grow" data-act="pickDone" ${pick.sel.length ? "" : "disabled"}>
      ${
        pick.mode === "replace"
          ? "Nahradit"
          : "Přidat" + (pick.sel.length ? " (" + pick.sel.length + ")" : "")
      }
    </button>`;
    openSheet(pick.mode === "replace" ? "Nahradit cvik" : "Přidat cviky", pickerBody(), f, keep, {
      re: () => renderPicker(true),
    });
    const nb = document.querySelector(".sheet-b");
    if (nb && st) {
      nb.scrollTop = st;
    }
    restoreChipScroll(nb || undefined);
  }
  function refreshPickList() {
    const el = document.getElementById("pickList");
    if (!el) {
      renderPicker(true);
      return;
    }
    el.innerHTML = pickerList();
  }
  /* info o cviku nad výběrem – výběr i hledání zůstanou zachované */
  function sheetExInfo(id) {
    exEd = null;
    const e = exOf(id);
    const list = derive().byEx[id] || [];
    const R = recs();
    const rl = (R.byEx[id] || []).slice(-3).reverse();
    let b =
      `${
        photoGallery(e, id) +
        exTags(e) +
        (e.desc
          ? `<p class="desc">${esc(e.desc)}</p>`
          : '<p class="desc muted">Popis provedení zatím chybí.</p>')
      }
      <div class="row wrap-r" style="justify-content:space-between">
        <a class="link" href="${esc(exLink(e))}" target="_blank" rel="noopener">` +
      `${esc(exLinkLabel(e))}</a>
      <span class="xs muted">${esc(EQUIP[e.equip] || "")}${e.gymDep ? " · vázáno na fitko" : ""}</span>
    </div>`;
    if (list.length) {
      let best = 0,
        nSets = 0;
      for (const x of list) {
        if (x.best > best) {
          best = x.best;
        }
        nSets += x.nWork;
      }
      b += `<div class="kpis k4">
        <div class="kpi"><b>${list.length}</b><span>Tréninků</span></div>
        <div class="kpi"><b>${nSets}</b><span>Sérií</span></div>
        <div class="kpi"><b>${best ? fmtKg(Math.round(best)) : "–"}</b><span>Odh. 1RM</span></div>
        <div class="kpi"><b>${fmtDateS(list[0].w.start)}</b><span>Naposledy</span></div>
      </div>`;
      b +=
        `<div class="small">
        Minule: <span class="num">${esc(setsStr(list[0].e.sets, true, kindOf(id)))}</span> ` +
        `<span class="muted">(` +
        `${esc(gymName(list[0].w.gymId))})</span>
      </div>`;
      if (rl.length) {
        b += `<div class="reclist">
          ${rl
            .map(
              (r) =>
                `<div class="rec">
                  <span class="md">🏅</span>
                  <div class="grow">
                    ${esc(REC[r.type])}: <b>${esc(recFmt(r.type, r.v, r.set))}</b> ` +
                `<span class="muted">· ` +
                `${fmtDate(r.w.start)}</span>
                  </div>
                </div>`,
            )
            .join("")}
        </div>`;
      }
    } else {
      b += '<div class="small muted">S tímto cvikem zatím nemáš žádný záznam.</div>';
    }
    openSheet(
      e.name,
      b,
      `<button class="btn grow" data-act="backPicker">Zpět na výběr</button>
      <button class="btn" data-act="editExInfo" data-v="${esc(id)}">Upravit</button>
      <button class="btn primary" data-act="openEx" data-v="${esc(id)}" data-p="info">
        Stránka cviku
      </button>`,
      true,
      { lv: 2, back: () => renderPicker(true), re: () => sheetExInfo(id) },
    );
    galRestore(document.getElementById("sheetRoot"));
  }
  let exEd = null;
  // úprava otevřená mimo výběr cviků
  const exEdOut = () => exEd && (exEd.from === "detail" || exEd.from === "list");
  // fx = záznam z free-exercise-db (F0-03), předvyplní nový cvik
  function sheetExEdit(id, from, fx) {
    const e = id
      ? S.exLib[id]
      : fx
        ? {
            name: fx.n,
            cz: fx.cz,
            equip: fx.e,
            kind: fx.k,
            gymDep: !!GYMDEP_EQUIP[fx.e],
            pri: fx.p,
            sec: fx.s,
            desc: fx.d.join("\n"),
          }
        : {
            name: (from === "list" ? S.exlQ : pick.q) || "",
            equip: "machine",
            gymDep: true,
            pri: [],
            sec: [],
          };
    exEd = {
      id,
      from: from || "picker",
      pri: exPri(e).slice(),
      sec: (e.sec || []).slice(),
      fx: fx || null,
      fxPh: [], // vybrané fotky z online databáze (F2-05), stáhnou se po uložení cviku
    };
    renderExEdit(e);
  }
  // výběr fotek z online databáze ve formuláři Nový cvik (F2-05); nic není předvybrané
  function exEdPhotos(fx) {
    return `<div class="stack" style="gap:6px">
      <div class="f lbl-f">Fotky z databáze · klepnutím vyber, které uložit</div>
      <div class="thumbs">
        ${[0, 1]
          .map((k) => {
            const on = exEd.fxPh.includes(k);
            return `<button type="button" class="th${on ? " sel" : ""}" data-act="xPh" data-v="${k}"
                aria-pressed="${on}">
              <img crossorigin="anonymous" src="${esc(fedbSrc(fx, k))}" alt="">
              <span class="ck">${on ? "✓" : ""}</span>
            </button>`;
          })
          .join("")}
      </div>
      <div class="xs muted">
        Vybrané se po uložení cviku stáhnou a uloží k němu jako fotky bez fitka. Nevybrané se nestáhnou.
      </div>
    </div>`;
  }
  function renderExEdit(e) {
    const v = (k) => {
      const el = document.getElementById(k);
      return el ? el.value : null;
    };
    const name = v("x-name") != null ? v("x-name") : e.name,
      cz = v("x-cz") != null ? v("x-cz") : e.cz || "",
      desc = v("x-desc") != null ? v("x-desc") : e.desc || "",
      url = v("x-url") != null ? v("x-url") : e.url || "",
      equip = v("x-equip") || e.equip,
      kind = v("x-kind") || (KIND[e.kind] ? e.kind : "wr"),
      gd = document.getElementById("x-gd") ? document.getElementById("x-gd").checked : !!e.gymDep;
    const fx = exEd.fx,
      have = fx && fedbHave(fx);
    const b = `${
      exEd.id
        ? ""
        : fx
          ? `<div class="banner" style="margin-top:0">
              Předvyplněno z databáze free-exercise-db. Zkontroluj hlavně partie a typ zápisu, český
              název je jen návrh.` +
            `${have ? `<br><b>Podobný cvik už máš: ${esc(exOf(have).cz || exOf(have).name)}</b>` : ""}
            </div>`
          : `<button class="btn sm" data-act="fedbOpen" data-v="form">
              Předvyplnit z online databáze
            </button>`
    }${fx && !exEd.id && !fx.ni ? exEdPhotos(fx) : ""}
      <label class="f">
        Název (anglicky, jako v Hevy)
        <input class="inp" id="x-name" value="${esc(name)}">
      </label>
      <label class="f">Český název<input class="inp" id="x-cz" value="${esc(cz)}"></label>
      <div>
        <div class="f lbl-f" style="margin-bottom:6px">Partie · klepnutím: hlavní → pomocná → nic</div>
        <div class="mpick">
          ${MKEYS.map(
            (k) =>
              `<button type="button"
                  class="${exEd.pri.includes(k) ? "p" : exEd.sec.includes(k) ? "s" : ""}"
                  data-act="xMus" data-v="${k}">${esc(MUSCLE_MAP.NAMES[k])}</button>`,
          ).join("")}
        </div>
      </div>
      ${exFigures({ pri: exEd.pri, sec: exEd.sec }, true)}
      <label class="f">
        Typ zápisu
        <select class="inp" id="x-kind">
          ${KIND_ORDER.map(
            (k) => `<option value="${k}"${kind === k ? " selected" : ""}>${esc(KIND[k].l)}</option>`,
          ).join("")}
        </select>
        <span class="xs muted" style="text-transform:none;letter-spacing:0;font-weight:500">
          ${esc(KIND[kind].ex)}
        </span>
      </label>
      <label class="f">
        Vybavení
        <select class="inp" id="x-equip" data-f="xEquip">
          ${Object.entries(EQUIP)
            .map(([k, l]) => `<option value="${k}"${equip === k ? " selected" : ""}>${l}</option>`)
            .join("")}
        </select>
      </label>
      <label class="switch">
        <input type="checkbox" id="x-gd" ${gd ? "checked" : ""}>
        <span><b>Vázáno na fitko</b><br><span class="xs muted">Zapni u strojů a kladek — v každém fitku
            mají jiný odpor.</span></span>
      </label>
      <label class="f">
        Popis provedení
        <textarea class="inp" id="x-desc" rows="4">${esc(desc)}</textarea>
      </label>
      <label class="f">
        Odkaz (Hevy nebo video)
        <input class="inp${urlProblem(url) ? " bad" : ""}" id="x-url" inputmode="url" value="${esc(url)}"
            placeholder="prázdné = vyhledat video podle názvu">
        <span class="fmsg" id="x-url-msg">${esc(urlProblem(url))}</span>
      </label>`;
    const id = exEd.id;
    // Zpět o úroveň: do výsledků online databáze, do info o cviku, do výběru, nebo zavřít (úprava mimo výběr)
    const nav =
      fx && fs
        ? {
            lv: fsLv() + 1,
            back: () => {
              exEd = null;
              renderFs();
            },
          }
        : exEdOut()
          ? {}
          : exEd.from === "info"
            ? { lv: 3, back: () => sheetExInfo(id) }
            : {
                lv: 2,
                back: () => {
                  exEd = null;
                  renderPicker(true);
                },
              };
    const sb = document.querySelector(".sheet-b");
    const st = sb ? sb.scrollTop : null;
    openSheet(
      id ? "Upravit cvik" : "Nový cvik",
      b,
      `${
        id
          ? `<button class="btn danger" data-act="archEx" data-v="${esc(id)}">
            ${e.archived ? "Zobrazit" : "Skrýt"}
          </button>`
          : ""
      }
      <button class="btn grow" data-act="backPicker">Zpět</button>
      ${
        id && exChanged(id)
          ? `<button class="btn" data-act="resetEx" data-v="${esc(id)}">Výchozí</button>`
          : ""
      }
      <button class="btn primary grow" data-act="saveEx" data-v="${esc(id || "")}">Uložit</button>`,
      false,
      nav,
    );
    if (st !== null) {
      const sh = document.querySelector(".sheet");
      if (sh) {
        sh.classList.add("noanim");
      }
      const nb = document.querySelector(".sheet-b");
      if (nb) {
        nb.scrollTop = st;
      }
    }
  }

  /* ---------- hledání v databázi free-exercise-db (F0-03) ----------
     Data jsou v js/fedb.js (FEDB, vytváří tools/fedb/build.py). Načtou se až při prvním
     hledání: poprvé je potřeba internet, pak soubor drží service worker v cache.
     Vybraný cvik předvyplní formulář Nový cvik a uloží se jako vlastní cvik se značkou
     src:"fedb:<id>". Fotky se ve výsledcích jen ukazují (online); uložit k cviku jdou jen ty, které
     uživatel vybere (formulář Nový cvik, stránka cviku → Z online databáze, sekce „FOTKY U CVIKU“). */
  let fs = null,
    fedbP = null;
  function fedbLoad() {
    if (typeof FEDB !== "undefined") return Promise.resolve();
    if (!fedbP) {
      fedbP = new Promise((ok, ko) => {
        const s = document.createElement("script");
        s.src = "js/fedb.js";
        s.onload = () => (typeof FEDB !== "undefined" ? ok() : ko());
        s.onerror = () => {
          s.remove();
          ko();
        };
        document.head.appendChild(s);
      }).catch(() => {
        fedbP = null;
        throw new Error("fedb");
      });
    }
    return fedbP;
  }
  const FEDB_CAT = {
    S: "",
    W: "silový trojboj",
    O: "vzpírání",
    M: "strongman",
    P: "plyometrie",
    T: "protahování",
    C: "kardio",
  };
  const fedbStrength = (x) => "SWOM".includes(x.c);
  // cvik, který už mám: stejný cvik ve výchozí databázi (h) nebo vlastní cvik převzatý z tohoto záznamu
  function fedbHave(x) {
    if (x.h && S.exLib[x.h]) return x.h;
    for (const id in S.exLib) {
      if (S.exLib[id].src === "fedb:" + x.id) return id;
    }
    return null;
  }
  // hledá se v anglickém i českém názvu, bez diakritiky, slova v libovolném pořadí;
  // konce slov se useknou, aby „lavice“ našla „lavici“ a „rows“ i „row“
  function fedbRows(q) {
    const words = fold(q === undefined ? fs.q : q)
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((w) =>
        w.length >= 7
          ? w.slice(0, -3)
          : w.length >= 5 || (/s$/.test(w) && w.length === 4)
            ? w.slice(0, -1)
            : w,
      );
    if (!words.length) return [];
    const hay = (x) => {
      if (!x._f) {
        const h = fold(x.n + " " + x.cz)
          .replace(/[^a-z0-9]+/g, " ")
          .replace(/\bdb\b/g, "dumbbell");
        x._f = h + "|" + h.replace(/ /g, "");
      }
      return x._f;
    };
    const r = FEDB.filter((x) => words.every((w) => hay(x).includes(w)));
    const st = (x) => (fold(x.n).startsWith(words[0]) || fold(x.cz).startsWith(words[0]) ? 0 : 1);
    return r.sort((a, b) => fedbStrength(b) - fedbStrength(a) || st(a) - st(b) || a.n.length - b.n.length);
  }
  function fedbOpen(from, q, form) {
    fs = { from, q: q || "", all: false, limit: 0, form: !!form };
    renderFs();
  }
  function renderFs() {
    const b = `<input class="inp" id="fsQ" data-f="fsQ"
        placeholder="Název anglicky i česky, např. bench press, dřep…" value="${esc(fs.q)}"
        autocomplete="off">
    <div class="row wrap-r" id="fsBar" style="gap:8px"></div>
    <div class="stack" id="fsList" style="gap:6px"></div>
    <p class="xs muted" style="margin:2px 0 0">
      Zdroj: databáze free-exercise-db (volné dílo). Český název, partie a typ zápisu jsou návrh, před
      uložením je zkontroluj.
    </p>`;
    openSheet("Online databáze cviků", b, '<button class="btn grow" data-act="fsBack">Zpět</button>', false, {
      lv: fsLv(),
      back: fsBack,
      re: renderFs,
    });
    refreshFs();
    if (typeof FEDB === "undefined") {
      fedbLoad()
        .then(() => {
          if (fs) {
            refreshFs();
          }
        })
        .catch(() => {
          const el = document.getElementById("fsList");
          if (el) {
            el.innerHTML = `<div class="empty">
              Databázi cviků se nepodařilo načíst. Poprvé je potřeba internet, potom funguje i
              offline.<br>
              <button class="btn sm" data-act="fsRetry" style="margin-top:10px">Zkusit znovu</button>
            </div>`;
          }
        });
    }
    const inp = document.getElementById("fsQ");
    if (inp && !fs.q) {
      inp.focus();
    }
  }
  // tlačítko Zpět (F0-06): hledání je o úroveň pod výběrem cviků, resp. pod formulářem Nový cvik
  const fsLv = () => (fs.from === "picker" ? 2 : 1) + (fs.form ? 1 : 0);
  function fsBack() {
    if (fs.form) {
      sheetExEdit(null, fs.from);
      return;
    }
    if (fs.from === "picker") {
      renderPicker(true);
    } else {
      closeSheet();
    }
  }
  function refreshFs() {
    const el = document.getElementById("fsList"),
      bar = document.getElementById("fsBar");
    if (!el || !bar) return;
    if (typeof FEDB === "undefined") {
      bar.innerHTML = "";
      el.innerHTML = '<div class="empty">Načítám databázi cviků…</div>';
      return;
    }
    const q = fs.q.trim(),
      all = q ? fedbRows() : [],
      str = all.filter(fedbStrength),
      rows = fs.all ? all : str,
      hid = all.length - str.length;
    bar.innerHTML =
      `<button class="chip" data-act="fsAll" aria-pressed="${fs.all}">
      I protahování, kardio a plyometrie${hid ? " (" + hid + ")" : ""}
    </button>
    <span class="grow"></span>
    <span class="xs muted">${
      q
        ? rows.length + " " + plural(rows.length, "cvik", "cviky", "cviků")
        : FEDB.length + " cviků v databázi"
    }` + `</span>`;
    if (!q) {
      el.innerHTML = '<div class="empty">Napiš název cviku anglicky nebo česky.</div>';
      return;
    }
    if (!rows.length) {
      el.innerHTML =
        `<div class="empty">
        Nic nenalezeno.` +
        `${hid ? " Zapni „I protahování, kardio a plyometrie“." : " Zkus jiné slovo, třeba anglicky."}
      </div>`;
      return;
    }
    const lim = fs.limit || 40;
    let h = "";
    for (const x of rows.slice(0, lim)) {
      const have = fedbHave(x),
        he = have && S.exLib[have];
      h +=
        `<div class="pickrow">
          <button class="pick" data-act="fsPick" data-v="${esc(x.id)}">
            ${
              x.ni
                ? '<span class="fsimg"></span>'
                : `<img class="fsimg" src="${esc(FEDB_IMG + x.id + "/0.jpg")}" alt="" loading="lazy">`
            }
            <div class="grow">
              <div style="font-weight:600">${esc(x.n)}</div>
              <div class="cz">${esc(x.cz)}</div>
              <div class="xs muted">
                ${esc(x.p.map((k) => MUSCLE_MAP.NAMES[k]).join(", "))} · ${esc(EQUIP[x.e] || "")}` +
        `${FEDB_CAT[x.c] ? " · " + FEDB_CAT[x.c] : ""}</div>` +
        `${
          he
            ? `<div class="xs have">
              Už máš: ${esc(he.cz || he.name)}${he.archived ? " (skrytý)" : ""}
            </div>`
            : ""
        }` +
        `</div></button>` +
        `${
          he
            ? `<button class="btn sm fshave" data-act="fsHave" data-v="${esc(have)}">
              ${fs.from === "picker" ? "Vybrat" : "Otevřít"}
            </button>`
            : ""
        }` +
        `</div>`;
    }
    if (rows.length > lim) {
      h += `<button class="btn block" data-act="fsMore">Další cviky (${rows.length - lim})</button>`;
    }
    el.innerHTML = h;
  }

  /* ---------- PŘETAŽENÍ (F2-07) ----------
     Pořadí se mění tažením prstu za úchyt (⋮⋮): seznam má data-dnd="<druh>", položky třídu dnd-it
     a úchyt dnd-h (dndGrip). Zvednutá položka jede s prstem, ostatní jí uhýbají, u okraje panelu
     (stránky) se seznam sám posouvá. Po puštění se položka přesune i v HTML (bez probliknutí)
     a dndDrop(druh, odkud, kam) uloží nové pořadí. Tahá se jen za úchyt, posouvání stránky
     a klepání fungují dál. */
  const DND_EDGE = 56; // px od okraje rámečku, kde se seznam začne sám posouvat
  const DND_SPEED = 14; // nejvyšší posun za snímek (px)
  let dnd = null; // probíhající tah
  // úchyt položky (label = co se přesouvá, pro čtečku obrazovky)
  function dndGrip(label) {
    return `<span class="dnd-h" aria-label="Přetáhnout: ${esc(label)}">${IC.grip}</span>`;
  }
  // posouvaný rámeček: obsah panelu, jinak stránka (null)
  const dndBox = (list) => list.closest(".sheet-b");
  const dndScroll = (box) => (box ? box.scrollTop : window.scrollY);
  // viditelná část rámečku (u stránky bez horní lišty a spodních záložek)
  function dndView(box) {
    if (box) {
      const r = box.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    }
    const bar = document.querySelector("header.top");
    const tabs = document.querySelector(".tabs");
    return {
      top: bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0,
      bottom: tabs ? tabs.getBoundingClientRect().top : window.innerHeight,
    };
  }
  function dndStart(ev, grip) {
    const it = grip.closest(".dnd-it"),
      list = grip.closest("[data-dnd]");
    if (!it || !list) return;
    const items = [...list.children].filter((x) => x.classList.contains("dnd-it"));
    if (items.length < 2) return;
    ev.preventDefault();
    const box = dndBox(list);
    const scroll = dndScroll(box);
    // polohy položek v obsahu (nezávislé na posouvání)
    const rects = items.map((x) => {
      const r = x.getBoundingClientRect();
      return { top: r.top + scroll, bottom: r.bottom + scroll };
    });
    const from = items.indexOf(it);
    const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
    dnd = {
      kind: list.dataset.dnd,
      list,
      it,
      items,
      rects,
      from,
      to: from,
      step: rects[from].bottom - rects[from].top + gap,
      y0: ev.clientY + scroll,
      y: ev.clientY,
      box,
      pid: ev.pointerId,
      raf: 0,
    };
    try {
      grip.setPointerCapture(ev.pointerId);
    } catch (e) {}
    list.classList.add("dnd-act");
    it.classList.add("dnd-on");
    if (navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {}
    }
    dnd.raf = requestAnimationFrame(dndAuto);
  }
  // posun zvednuté položky podle prstu, ostatní uhnou
  function dndMove() {
    const g = dnd;
    const { rects, from } = g;
    const last = rects.length - 1;
    let dy = g.y + dndScroll(g.box) - g.y0;
    dy = Math.max(rects[0].top - rects[from].top, Math.min(rects[last].bottom - rects[from].bottom, dy));
    g.it.style.transform = `translateY(${dy}px)`;
    // nové místo = kolik ostatních položek má střed nad středem zvednuté
    const mid = (rects[from].top + rects[from].bottom) / 2 + dy;
    let to = 0;
    rects.forEach((r, k) => {
      if (k !== from && (r.top + r.bottom) / 2 < mid) {
        to++;
      }
    });
    if (to === g.to) return;
    g.to = to;
    g.items.forEach((x, k) => {
      if (k === from) return;
      let shift = 0;
      if (from < to && k > from && k <= to) {
        shift = -g.step;
      } else if (to < from && k >= to && k < from) {
        shift = g.step;
      }
      x.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  }
  // prst u horního / spodního okraje: seznam se sám posouvá (rychleji, čím blíž okraji)
  function dndAuto() {
    const g = dnd;
    if (!g) return;
    if (!g.list.isConnected) {
      dndEnd(true);
      return;
    }
    const v = dndView(g.box);
    let by = 0;
    if (g.y < v.top + DND_EDGE) {
      by = -Math.min(1, (v.top + DND_EDGE - g.y) / DND_EDGE) * DND_SPEED;
    } else if (g.y > v.bottom - DND_EDGE) {
      by = Math.min(1, (g.y - v.bottom + DND_EDGE) / DND_EDGE) * DND_SPEED;
    }
    if (by) {
      if (g.box) {
        g.box.scrollTop += by;
      } else {
        window.scrollBy(0, by);
      }
      dndMove();
    }
    g.raf = requestAnimationFrame(dndAuto);
  }
  // konec tahu: položka se přesune i v HTML a pořadí se uloží (cancel = vrátit, nic neukládat)
  function dndEnd(cancel) {
    const g = dnd;
    if (!g) return;
    dnd = null;
    cancelAnimationFrame(g.raf);
    g.list.classList.remove("dnd-act");
    g.it.classList.remove("dnd-on");
    g.items.forEach((x) => (x.style.transform = ""));
    if (cancel || g.to === g.from || !g.list.isConnected) return;
    const rest = g.items.filter((x) => x !== g.it);
    if (g.to < rest.length) {
      rest[g.to].before(g.it);
    } else {
      rest[rest.length - 1].after(g.it);
    }
    // klepnutí, které po puštění prstu případně přijde, nemá nic spustit
    const eat = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    document.addEventListener("click", eat, true);
    setTimeout(() => document.removeEventListener("click", eat, true), 0);
    dndDrop(g.kind, g.from, g.to);
  }
  document.addEventListener("pointerdown", (ev) => {
    if (dnd || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    const grip = ev.target.closest && ev.target.closest(".dnd-h");
    if (grip) {
      dndStart(ev, grip);
    }
  });
  document.addEventListener("pointermove", (ev) => {
    if (!dnd || ev.pointerId !== dnd.pid) return;
    dnd.y = ev.clientY;
    dndMove();
  });
  document.addEventListener("pointerup", (ev) => {
    if (dnd && ev.pointerId === dnd.pid) {
      dndEnd(false);
    }
  });
  document.addEventListener("pointercancel", (ev) => {
    if (dnd && ev.pointerId === dnd.pid) {
      dndEnd(true);
    }
  });
  // podržení úchytu nemá otevřít kontextovou nabídku
  document.addEventListener("contextmenu", (ev) => {
    if (ev.target.closest && ev.target.closest(".dnd-h")) {
      ev.preventDefault();
    }
  });
  // uložení nového pořadí podle druhu seznamu
  function dndDrop(kind, from, to) {
    const move = (a) => a.splice(to, 0, a.splice(from, 1)[0]);
    if (kind === "gyms") {
      const cfg = JSON.parse(JSON.stringify(S.cfg));
      move(cfg.gyms);
      put("config/main", cfg);
    } else if (kind === "ex") {
      const d = curDraft();
      if (!d) return;
      const tags = d.ex.map((e) => e.ss || "");
      move(d.ex);
      ssMoved(d.ex, to);
      touchDraft();
      scheduleRender();
      // změnila se supersérie (F4-05)? překreslit panel, aby ukazoval nové pruhy
      if (tags.some(Boolean)) {
        const box = document.querySelector(".sheet-b");
        const top = box ? box.scrollTop : 0;
        sheetExOrder(true);
        const fresh = document.querySelector(".sheet-b");
        if (fresh) {
          fresh.scrollTop = top;
        }
      }
    } else if (kind === "tpl") {
      const ids = tplSorted().map(([id]) => id);
      move(ids);
      const items = {};
      ids.forEach((id, k) => (items[id] = Object.assign({}, S.templates[id], { order: k })));
      put("config/templates", { items });
    }
  }
  // panel Změnit pořadí cviků (z menu cviku v tréninku, úpravě tréninku i šabloně)
  function sheetExOrder(noanim) {
    const d = curDraft();
    if (!d) return;
    const rows = d.ex
      .map((e, i) => {
        const n = e.sets.length;
        const name = exName(e.exId);
        const ss = ssLabel(d.ex, i); // cvik v supersérii (F4-05): proužek vlevo a „supersérie 1/2“
        return `<div class="card dnd-it dnd-row${ss ? " ss-on" : ""}">
            <div class="grow">
              <b>${esc(name)}</b>
              <div class="xs muted">
                ${n} ${plural(n, "série", "série", "sérií")}${ss ? " · " + esc(ss) : ""}
              </div>
            </div>
            ${dndGrip(name)}
          </div>`;
      })
      .join("");
    openSheet(
      "Pořadí cviků",
      `<p class="xs muted" style="margin:0">
        Cvik přesuneš tažením za úchyt vpravo.` +
        `${
          d.ex.some((e, i) => ssRun(d.ex, i))
            ? " Cvik přetažený mezi cviky supersérie se k ní přidá, přetažený pryč z ní vypadne."
            : ""
        }
      </p>
      <div class="stack dnd-list" data-dnd="ex">${rows}</div>`,
      '<button class="btn primary grow" data-act="closeSheet">Hotovo</button>',
      noanim,
      { re: () => sheetExOrder(true) },
    );
  }
  // panel Změnit pořadí šablon (úvodní obrazovka); pořadí je společné pro všechna fitka
  function sheetTplOrder(noanim) {
    const rows = tplSorted()
      .map(([, t]) => {
        const gyms = tplGyms(t);
        return `<div class="card dnd-it dnd-row">
            <div class="grow">
              <b>${esc(t.name)}</b>
              <div class="xs muted">
                ${gyms.length ? esc(gyms.map(gymName).join(", ")) : "Všechna fitka"}
              </div>
            </div>
            ${dndGrip(t.name)}
          </div>`;
      })
      .join("");
    openSheet(
      "Pořadí šablon",
      `<p class="xs muted" style="margin:0">
        Šablonu přesuneš tažením za úchyt vpravo. Pořadí platí ve všech fitkách, nahoře jsou vždy
        šablony vybraného fitka.
      </p>
      <div class="stack dnd-list" data-dnd="tpl">${rows}</div>`,
      '<button class="btn primary grow" data-act="closeSheet">Hotovo</button>',
      noanim,
      { re: () => sheetTplOrder(true) },
    );
  }

  /* ---------- panel vysouvaný zespodu (sheet) a potvrzovací okna ---------- */
  // sheetNav: otevřený panel pro tlačítko Zpět – lv = kolik stisků Zpět ho zavře (panel v panelu má víc),
  // back = jeden krok zpět, re = znovu otevřít (návrat ze stránky cviku nebo z úpravy tréninku)
  let sheetNav = null;
  // nav.cls = třída navíc pro panel (např. krokovač "kk")
  function openSheet(title, body, foot, noanim, nav) {
    kkEnd();
    const cls = nav && nav.cls ? " " + nav.cls : "";
    document.getElementById("sheetRoot").innerHTML = `<div class="scrim${cls}" data-act="scrim">
      <div class="sheet${noanim ? " noanim" : ""}" role="dialog" aria-modal="true"
          aria-label="${esc(title)}">
        <div class="sheet-h">
          <h2>${esc(title)}</h2>
          <button class="iconbtn" data-act="closeSheet" aria-label="Zavřít">${IC.close}</button>
        </div>
        <div class="sheet-b">${body}</div>
        ${foot ? `<div class="sheet-f">${foot}</div>` : ""}
      </div>
    </div>`;
    document.body.style.overflow = "hidden";
    sheetNav = Object.assign(
      { lv: 1, back: closeSheet, re: () => openSheet(title, body, foot, true, nav) },
      nav,
    );
  }
  function closeSheet() {
    kkEnd();
    document.getElementById("sheetRoot").innerHTML = "";
    document.body.style.overflow = "";
    sheetNav = null;
  }
  function confirmSheet(title, text, btn, act, v) {
    openSheet(
      title,
      `<p style="margin:0">${text}</p>`,
      `<button class="btn grow" data-act="closeSheet">Zrušit</button>
      <button class="btn primary grow" data-act="${act}" data-v="${esc(v || "")}">${esc(btn)}</button>`,
    );
  }

  /* Nastavení → Trénink → Odpočinek mezi sériemi */
  function restSettings() {
    const c = S.cfg,
      ns = notifState();
    let h = `<section class="sec">
        <div class="sec-h"><h2>Odpočinek mezi sériemi</h2></div>
        <div class="card stack">`;
    // volba délky pauzy: act = akce tlačítek, cur = uložená délka (s)
    const secSeg = (act, cur) =>
      `<div class="seg seg-wide">
        ${REST_SECS.map(
          (s) =>
            `<button data-act="${act}" data-v="${s}" aria-pressed="${cur === s}">${fmtClock(s)}` +
            `</button>`,
        ).join("")}
      </div>`;
    h += `<div class="stack" style="gap:6px">
      <span>Výchozí časovač</span>
      ${secSeg("restSec", c.restSec)}
    </div>`;
    // F4-05: po dokončení kola pracovních sérií supersérie
    h += `<div class="stack" style="gap:6px">
      <span>Časovač po pracovní supersérii</span>
      ${secSeg("restSs", c.restSs)}
    </div>`;
    h += `<div class="stack" style="gap:6px">
      <span>Na konci pauzy</span>
      <div class="seg seg-wide">
        ${[
          ["both", "Zvuk i vibrace"],
          ["sound", "Zvuk"],
          ["vib", "Vibrace"],
        ]
          .map(
            ([k, l]) =>
              `<button data-act="restAlert" data-v="${k}" aria-pressed="${c.restAlert === k}">${l}` +
              `</button>`,
          )
          .join("")}
      </div>
    </div>`;
    h += `<label class="switch">
      <input type="checkbox" data-act="restOver" ${c.restOver ? "checked" : ""}>
      <span><b>Počítat přečas</b><br><span class="xs muted">Po konci pauzy lišta zůstane a ukazuje, jak
          dlouho už odpočíváš (+0:25), dokud neodškrtneš další sérii.</span></span>
    </label>`;
    h += `<label class="switch">
      <input type="checkbox" data-act="restNotify"
          ${c.restNotify ? "checked" : ""}${ns === "none" ? " disabled" : ""}>
      <span><b>Oznámení na pozadí</b><br><span class="xs muted">Když je appka na pozadí nebo máš
          zhasnutý displej, konec pauzy ohlásí oznámení v telefonu. Zvuk a vibraci oznámení určuje
          nastavení oznámení v Androidu.</span></span>
    </label>`;
    if (c.restNotify) {
      if (ns === "none") {
        h += '<div class="xs muted">Tento prohlížeč oznámení nepodporuje.</div>';
      } else if (ns === "denied") {
        h += `<div class="xs muted">
          Oznámení jsou v telefonu zakázaná. Povol je v Nastavení Androidu → Aplikace → Workout deník
          → Oznámení (v prohlížeči přes ikonu vedle adresy → Oprávnění).
        </div>`;
      } else if (ns === "default") {
        h += '<button class="btn block" data-act="notifAsk">Povolit oznámení</button>';
      } else {
        h += `<div class="row">
          <span class="grow xs muted">
            Oznámení jsou povolená. Vyzkoušej: klepni, zhasni displej a počkej 10 s.
          </span>
          <button class="btn sm" data-act="notifTest">Vyzkoušet</button>
        </div>`;
      }
    }
    h += wakeSettings();
    return `${h}</div></section>`;
  }

  /* ---------- odpočinek mezi sériemi (F1-04) ----------
     Časovač se počítá z času konce (S.restEnd), ne z odtikaných sekund, takže nevadí,
     že Chrome appku na pozadí uspí. Stav je uložený v Local "rest" ({end,total,fired}),
     přežije zavření appky i automatickou aktualizaci; smaže ho restStop().
     Konec pauzy:
     - appka je na očích celou dobu → pípnutí / vibrace podle S.cfg.restAlert,
     - appka byla na pozadí nebo displej zhasnutý → systémové oznámení z service workeru
       (sw.js, zpráva "rest"; Chrome udrží worker vzhůru nejvýš ~5 min), po návratu už nepípá.
     S.cfg.restOver = po konci pauzy počítat přečas, dokud se neodškrtne další série. */
  const REST_SECS = [60, 90, 120, 150, 180]; // volby délky pauzy v Nastavení (výchozí i po supersérii)
  const REST_VIB = [700, 300, 700],
    REST_OVER_MAX = 15 * 60; // 2 dlouhé vibrace; přečas zmizí po 15 min
  let audioCtx = null,
    visibleSince = document.hidden ? Infinity : Date.now();
  {
    const r = Local.get("rest", null);
    if (r && r.end > 0) {
      S.restEnd = r.end;
      S.restTotal = r.total || 120;
      S.restFired = !!r.fired;
    }
  }
  function audioUnlock() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    } catch (e) {}
  }
  function beep() {
    const m = S.cfg.restAlert;
    if (m !== "vib") {
      try {
        audioUnlock();
        [0, 0.25, 0.5].forEach((t) => {
          const o = audioCtx.createOscillator(),
            g = audioCtx.createGain();
          o.frequency.value = 880;
          g.gain.value = 0.15;
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(audioCtx.currentTime + t);
          o.stop(audioCtx.currentTime + t + 0.15);
        });
      } catch (e) {}
    }
    if (m !== "sound") {
      try {
        navigator.vibrate && navigator.vibrate(REST_VIB);
      } catch (e) {}
    }
  }
  /* oznámení: podporuje prohlížeč / stav povolení ("granted", "denied", "default", "none") */
  const notifState = () =>
    "Notification" in window && "serviceWorker" in navigator ? Notification.permission : "none";
  const REST_TAG = "rest-" + (TEST_PR ? "pr" + TEST_PR : "main");
  /* co je na řadě po pauze: první nehotová série za naposledy odškrtnutou, jinak kdekoli
     (v supersérii další kolo, F4-05) */
  function restNext() {
    const d = S.active;
    if (!d) return "";
    let li = -1,
      lj = -1,
      la = 0;
    d.ex.forEach((e, i) =>
      e.sets.forEach((s, j) => {
        if (s.done && (s.at || 0) >= la) {
          la = s.at || 0;
          li = i;
          lj = j;
        }
      }),
    );
    const all = [];
    d.ex.forEach((e, i) => {
      let wn = 0;
      const cnt = { w: 0, n: 0 };
      e.sets.forEach((s, j) => {
        const n = s.t === "n" ? ++wn : 0;
        const grp = setGrp(s.t);
        const pos = cnt[grp]++; // pořadí série mezi zahřívacími / pracovními (kolo supersérie)
        if (!s.done) {
          all.push({ i, j, e, s, n, grp: grp === "w" ? 0 : 1, pos });
        }
      });
    });
    // v supersérii (F4-05) další nehotová série podle kol: zahřívací, pak pracovní, v kole podle pořadí cviků
    const run = li >= 0 ? ssRun(d.ex, li) : null;
    const inRun = run
      ? all
          .filter((a) => a.i >= run[0] && a.i <= run[1])
          .sort((a, b) => a.grp - b.grp || a.pos - b.pos || a.i - b.i)
      : [];
    const after = run ? all.find((a) => a.i > run[1]) : all.find((a) => a.i > li || (a.i === li && a.j > lj));
    const x = inRun[0] || after || all[0];
    if (!x) return "Všechny série jsou hotové";
    return (
      "Další: " +
      exName(x.e.exId) +
      " · " +
      (x.s.t === "n" ? x.n + ". série" : TYPE_NAME[x.s.t].toLowerCase() + " série")
    );
  }
  /* předá service workeru, kdy má ukázat oznámení (nebo ho zruší) */
  function restPost() {
    if (notifState() === "none") return;
    const on = S.restEnd && !S.restFired && S.active && S.cfg.restNotify && notifState() === "granted";
    const msg = on
      ? {
          type: "rest",
          end: S.restEnd,
          tag: REST_TAG,
          title: "Odpočinek skončil",
          body: restNext(),
          vib: S.cfg.restAlert !== "sound" ? REST_VIB : null,
        }
      : { type: "rest", tag: REST_TAG };
    navigator.serviceWorker.ready.then((r) => r.active && r.active.postMessage(msg)).catch(() => {});
  }
  /* záznam oznámení (sdílený se sw.js, cache "wdlog-…"): kdy se oznámení naplánovalo, zobrazilo,
     kdy byla appka skrytá. Jen pro vývoj: vede se a ukazuje (Nastavení → O aplikaci) jen v testovací
     verzi PR a lokálně, ve vydané ne. */
  const DEV = !!TEST_PR || BUILD.kanal === "lokal";
  const REST_LOG = "wdlog-" + (TEST_PR ? "pr" + TEST_PR : "main");
  async function restLogRead() {
    try {
      const r = await (await caches.open(REST_LOG)).match("log");
      return r ? await r.json() : [];
    } catch (e) {
      return [];
    }
  }
  async function restLog(txt) {
    if (!DEV || !window.caches) return;
    try {
      const a = await restLogRead();
      a.unshift({ at: Date.now(), txt });
      await (await caches.open(REST_LOG)).put("log", new Response(JSON.stringify(a.slice(0, 12))));
    } catch (e) {}
  }
  async function sheetRestLog() {
    const a = await restLogRead();
    openSheet(
      "Záznam oznámení",
      `<div class="xs muted" style="margin-bottom:8px">
        Posledních 12 událostí, nejnovější nahoře. Pomáhá zjistit, proč oznámení nepřišlo.
      </div>
      ${
        a.length
          ? `<div class="stack" style="gap:4px">
            ${a
              .map(
                (x) =>
                  `<div class="small">
                    <b class="num">${esc(new Date(x.at).toLocaleTimeString("cs-CZ"))}</b> ${esc(x.txt)}
                  </div>`,
              )
              .join("")}
          </div>`
          : '<div class="muted small">Zatím nic.</div>'
      }`,
      `<button class="btn grow" data-act="restLogClear">Smazat záznam</button>
      <button class="btn primary grow" data-act="closeSheet">Zavřít</button>`,
    );
  }
  function restClearNotif() {
    if (notifState() !== "none") {
      navigator.serviceWorker.ready
        .then((r) => r.getNotifications({ tag: REST_TAG }))
        .then((ns) => ns.forEach((n) => n.close()))
        .catch(() => {});
    }
  }
  /* zkouška z Nastavení: oznámení za 10 s, i když je appka na očích */
  function restTest() {
    navigator.serviceWorker.ready
      .then(
        (r) =>
          r.active &&
          r.active.postMessage({
            type: "rest",
            end: Date.now() + 10000,
            tag: REST_TAG + "-test",
            always: true,
            title: "Zkouška oznámení",
            body: "Takhle tě appka upozorní na konec pauzy.",
            vib: S.cfg.restAlert !== "sound" ? REST_VIB : null,
          }),
      )
      .catch(() => {});
    toast("Oznámení přijde za 10 s");
  }
  function notifAsk() {
    if (notifState() !== "default") return;
    Local.set("notifAsked", true);
    Notification.requestPermission()
      .then(() => {
        restPost();
        scheduleRender();
      })
      .catch(() => {});
  }
  function restSave(post) {
    Local.set("rest", S.restEnd ? { end: S.restEnd, total: S.restTotal, fired: !!S.restFired } : null);
    if (post !== false) {
      restPost();
    }
    wakeSync(); // pauza začala / skončila → zámek displeje (F1-02)
  }
  // sec = délka pauzy (výchozí časovač, po pracovní supersérii S.cfg.restSs)
  function restStart(sec) {
    audioUnlock(); // klepnutí = povolení zvuku na později
    S.restTotal = sec || S.cfg.restSec || 120;
    S.restEnd = Date.now() + S.restTotal * 1000;
    S.restFired = false;
    if (S.cfg.restNotify && notifState() === "default" && !Local.get("notifAsked", false)) {
      // jednou, pak jen v Nastavení
      notifAsk();
    }
    restSave();
    renderRest();
  }
  function restStop() {
    S.restEnd = null;
    S.restFired = false;
    restSave();
    renderRest();
  }
  function renderRest() {
    const el = document.getElementById("rest");
    if (!S.restEnd || !S.active) {
      el.hidden = true;
      return;
    }
    const left = (S.restEnd - Date.now()) / 1000,
      over = left <= 0;
    el.hidden = false;
    el.innerHTML = `<div class="rest-in${over ? " over" : ""}">
      ${
        over
          ? ""
          : `<div class="bar" id="restBar" style="width:${Math.max(0, (left / S.restTotal) * 100)}%"></div>`
      }
      <b id="restClock">${restClock(left)}</b>
      <span class="rest-l"><i>${over ? "Přečas" : "Odpočinek"}</i></span>
      ${
        over
          ? '<button data-act="restSkip">Zavřít</button>'
          : `<button data-act="restAdj" data-v="-15">−15</button>` +
            `<button data-act="restAdj" data-v="15">+15` +
            `</button><button data-act="restSkip">Přeskočit</button>`
      }
    </div>`;
  }
  const restClock = (left) => (left > 0 ? fmtClock(left) : "+" + fmtClock(-left));
  function restTick() {
    document.querySelectorAll("[data-elapsed]").forEach((e) => {
      const d = curDraft();
      if (d) {
        e.textContent = fmtClock((Date.now() - d.start) / 1000);
      }
    });
    if (!S.restEnd || !S.active) return;
    const left = (S.restEnd - Date.now()) / 1000;
    if (left <= 0 && !S.restFired) {
      // pípnout jen tehdy, když je appka na očích už od doby před koncem pauzy; jinak upozornilo oznámení
      const seen = !document.hidden && visibleSince <= S.restEnd;
      if (seen) {
        beep();
        setTimeout(restClearNotif, 1500);
      } else if (!document.hidden && !(S.cfg.restNotify && notifState() === "granted")) {
        toast("Odpočinek skončil");
      }
      S.restFired = true;
      // service workeru nic neposílat: oznámení na pozadí si hlídá sám (zrušení by ho mohlo předběhnout)
      if (!S.cfg.restOver) {
        if (seen) {
          toast("Odpočinek skončil");
        }
        S.restEnd = null;
        S.restFired = false;
        restSave(false);
        renderRest();
        return;
      }
      restSave(false);
      renderRest();
      return;
    }
    if (left <= 0 && -left > REST_OVER_MAX) {
      restStop();
      return;
    }
    const c = document.getElementById("restClock"),
      b = document.getElementById("restBar");
    if (left <= 0 && !document.querySelector(".rest-in.over")) {
      renderRest();
      return;
    }
    if (c) {
      c.textContent = restClock(left);
    }
    if (b) {
      b.style.width = Math.max(0, (left / S.restTotal) * 100) + "%";
    }
  }
  setInterval(() => {
    restTick();
    wakeSync(); // pojistka 10 min a ztmavení po 30 s (F1-02)
  }, 500);
  document.addEventListener("visibilitychange", () => {
    if (S.restEnd && S.active && !S.restFired) {
      restLog(document.hidden ? "appka na pozadí / zhasnutý displej" : "appka zpět na očích");
    }
    if (document.hidden) {
      visibleSince = Infinity;
      return;
    }
    visibleSince = Date.now();
    restClearNotif();
    restTick(); // po návratu hned správný čas, staré oznámení pryč
  });

  /* ---------- displej během pauzy (F1-02) ----------
     S.cfg.screenOn: během odpočinkové pauzy (i přečasu) v rozdělaném tréninku displej nezhasne
     (Screen Wake Lock, jen když je appka na očích; Chrome zámek při skrytí appky sám pustí,
     po návratu ho appka vezme znovu). Pojistka: po WAKE_IDLE bez dotyku se zámek pustí.
     Baterie pod WAKE_BATT bez nabíječky: funkce dočasně neplatí, Nastavení to ukáže.
     S.cfg.screenDim: po WAKE_DIM bez dotyku černá obrazovka jen s odpočtem (jas webová appka
     měnit neumí; na OLED displeji černá šetří baterii). Klepnutí ji schová a nic pod ní nezmáčkne. */
  const WAKE_IDLE = 10 * 60 * 1000,
    WAKE_DIM = 30 * 1000,
    WAKE_BATT = 0.15,
    WAKE_RETRY = 30 * 1000;
  const wakeApi = !!(navigator.wakeLock && navigator.wakeLock.request);
  let wakeLock = null; // držený zámek (WakeLockSentinel)
  let wakeBusy = false; // žádost o zámek právě běží
  let wakeFailAt = 0; // kdy telefon zámek naposledy odmítl
  let wakeTouch = Date.now(); // poslední dotyk (pro pojistku a ztmavení)
  let battery = null; // stav baterie (navigator.getBattery), když ho prohlížeč umí
  let dimEl = null; // černá obrazovka se odpočtem

  // baterie pod 15 % a telefon se nenabíjí
  const batteryLow = () => !!battery && !battery.charging && battery.level < WAKE_BATT;

  // pauza v rozdělaném tréninku se zapnutou volbou, appka na očích, baterie v pořádku
  function wakeActive() {
    return !!(S.cfg.screenOn && S.active && S.restEnd && !document.hidden && !batteryLow());
  }

  // srovná zámek displeje a ztmavení se stavem appky; volá se při změně pauzy a z restTick
  function wakeSync() {
    const on = wakeActive();
    const idle = Date.now() - wakeTouch;
    const want = on && idle < WAKE_IDLE;
    if (want && !wakeLock && !wakeBusy && wakeApi && Date.now() - wakeFailAt > WAKE_RETRY) {
      wakeRequest();
    }
    if (!want && wakeLock) {
      wakeRelease();
    }
    // ztmavení zůstane i po pojistce, displej pak zhasne podle Androidu
    if (on && S.cfg.screenDim && idle >= WAKE_DIM) {
      dimShow();
    } else if (!on) {
      dimHide();
    }
    dimUpdate();
  }

  // požádá Chrome, aby displej nezhasl
  async function wakeRequest() {
    wakeBusy = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      wakeLock = lock;
      lock.addEventListener("release", () => {
        if (wakeLock === lock) {
          wakeLock = null;
        }
      });
      restLog("displej: zámek zapnutý");
      // mezitím se stav mohl změnit (pauza skončila, appka šla na pozadí)
      if (!wakeActive()) {
        wakeRelease();
      }
    } catch (e) {
      wakeFailAt = Date.now();
      restLog("displej: telefon zámek odmítl (" + ((e && e.name) || "chyba") + ")");
    }
    wakeBusy = false;
  }

  function wakeRelease() {
    const lock = wakeLock;
    wakeLock = null;
    if (!lock) return;
    lock.release().catch(() => {});
    restLog("displej: zámek puštěný");
  }

  // černá obrazovka se odpočtem (po WAKE_DIM bez dotyku)
  function dimShow() {
    if (dimEl) return;
    const el = document.createElement("div");
    el.className = "dim";
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Zpět do appky");
    el.innerHTML = `
    <b class="dim-clock"></b>
    <span class="dim-lab"></span>
    <span class="dim-next"></span>
    <span class="dim-hint">Klepni pro návrat</span>`;
    // klepnutí jen schová ztmavení, do appky pod ním neprojde
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      wakeTouch = Date.now();
      dimHide();
    });
    el.addEventListener("touchmove", (ev) => ev.preventDefault(), { passive: false });
    document.body.appendChild(el);
    dimEl = el;
    dimUpdate();
  }

  function dimHide() {
    if (!dimEl) return;
    dimEl.remove();
    dimEl = null;
  }

  // odpočet na černé obrazovce; po konci pauzy se zesvětlí
  function dimUpdate() {
    if (!dimEl || !S.restEnd) return;
    const left = (S.restEnd - Date.now()) / 1000;
    const over = left <= 0;
    dimEl.classList.toggle("over", over);
    dimEl.querySelector(".dim-clock").textContent = restClock(left);
    dimEl.querySelector(".dim-lab").textContent = over ? "Odpočinek skončil" : "Odpočinek";
    const next = restNext();
    const nextEl = dimEl.querySelector(".dim-next");
    if (nextEl.textContent !== next) {
      nextEl.textContent = next;
    }
  }

  // každý dotyk (i Zpět) = aktivita: obnoví pojistku a odloží ztmavení
  function wakeActivity() {
    wakeTouch = Date.now();
  }
  document.addEventListener("pointerdown", wakeActivity, true);
  document.addEventListener("keydown", wakeActivity, true);
  window.addEventListener("popstate", () => {
    wakeActivity();
    dimHide();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      wakeActivity();
    } // návrat do appky = aktivita, ať hned nezčerná
    wakeSync();
  });

  // stav baterie: pod 15 % se funkce dočasně vypne, v Nastavení je upozornění
  if (navigator.getBattery) {
    navigator
      .getBattery()
      .then((b) => {
        battery = b;
        const onChange = () => {
          wakeSync();
          if (S.route === "set") {
            scheduleRender();
          }
        };
        b.addEventListener("levelchange", onChange);
        b.addEventListener("chargingchange", onChange);
        onChange();
      })
      .catch(() => {});
  }

  /* Nastavení → Trénink → vypínače pod Odpočinkem */
  function wakeSettings() {
    const c = S.cfg;
    let h = `<label class="switch">
      <input type="checkbox" data-act="screenOn"
          ${c.screenOn ? "checked" : ""}${wakeApi ? "" : " disabled"}>
      <span><b>Displej nezhasne během pauzy</b><br><span class="xs muted">Během odpočinku a přečasu v
          rozdělaném tréninku zůstane displej zapnutý, pokud máš appku otevřenou. Když se ho 10 minut
          nedotkneš, zhasne jako obvykle. Displej navíc spotřebuje trochu baterie.</span></span>
    </label>`;
    if (!wakeApi) {
      h += '<div class="xs muted">Tento prohlížeč neumí držet displej zapnutý.</div>';
      return h;
    }
    if (!c.screenOn) return h;
    h +=
      `<label class="switch">
      <input type="checkbox" data-act="screenDim" ${c.screenDim ? "checked" : ""}>
      <span><b>Po 30 s ztmavit obrazovku</b><br><span class="xs muted">Když se displeje 30 s nedotkneš,
          zčerná a ukáže jen odpočet. Na displeji OLED to šetří baterii. Klepnutí vrátí appku.</span>` +
      `</span>
    </label>`;
    if (batteryLow()) {
      h += `<div class="banner" style="margin-top:0">
        Baterie je pod ${WAKE_BATT * 100} %, displej teď během pauzy zhasne jako obvykle. Znovu to začne
        fungovat nad ${WAKE_BATT * 100} % nebo při nabíjení.
      </div>`;
    }
    return h;
  }

  /* ---------- grafy (SVG) ---------- */
  const CH = {};
  let chN = 0;
  function chartPh(spec, h) {
    const id = "ch" + ++chN;
    CH[id] = Object.assign({ h }, spec);
    return `<div class="chart" id="${id}" data-chart="${id}" style="height:${h}px"></div>`;
  }
  function niceTicks(min, max, n) {
    if (min === max) {
      min = min - 1;
      max = max + 1;
    }
    const span = max - min,
      step0 = span / n,
      mag = Math.pow(10, Math.floor(Math.log10(step0))),
      r = step0 / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step,
      hi = Math.ceil(max / step) * step;
    const t = [];
    for (let v = lo; v <= hi + step / 2; v += step) {
      t.push(+v.toFixed(6));
    }
    return t;
  }
  function yFmt(v) {
    return Math.abs(v) >= 10000 ? fmtKg(Math.round(v / 100) / 10) + "k" : fmtKg(v);
  }
  function drawCharts() {
    document.querySelectorAll("[data-chart]").forEach((el) => {
      const sp = CH[el.dataset.chart];
      if (!sp) return;
      const W = el.clientWidth || 320,
        H = sp.h;
      // okraje pro popisky os rostou s písmem (F3-11)
      const textScale = fontK();
      const padL = Math.round(40 * textScale),
        padR = 12,
        padT = 12,
        padB = Math.round(24 * textScale);
      const iw = W - padL - padR,
        ih = H - padT - padB;
      let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"
          aria-label="${esc(sp.label)}">`;
      if (sp.type === "bar") {
        const vals = sp.bars.map((b) => b.v);
        const ticks = niceTicks(0, Math.max(1, ...vals), 4);
        const ymax = ticks[ticks.length - 1];
        const Y = (v) => padT + ih - (v / ymax) * ih;
        for (const t of ticks) {
          svg += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}"/>
          <text x="${padL - 6}" y="${Y(t) + 4 * textScale}" text-anchor="end">${yFmt(t)}</text>`;
        }
        const bw = iw / sp.bars.length;
        sp.hit = [];
        sp.bars.forEach((b, i) => {
          const x = padL + i * bw + 1,
            w = Math.max(2, bw - 2),
            y = Y(b.v),
            hh = padT + ih - y;
          if (b.v > 0) {
            const r = Math.min(4, w / 2, hh);
            svg +=
              `<path fill="var(--chart)" d="M${x},${padT + ih}V${y + r}Q${x},${y} ${x + r},${y}` +
              `H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${padT + ih}Z"/>`;
          }
          if (
            b.tip !== undefined ? b.label : i % 4 === 3 || (i === sp.bars.length - 1 && sp.bars.length < 5)
          ) {
            svg += `<text x="${x + w / 2}" y="${H - 6}" text-anchor="middle">${b.label}</text>`;
          }
          sp.hit.push({
            x: x + w / 2,
            y: Math.min(y, padT + ih - 2),
            html:
              `<b>${b.v >= 1000 ? fmtInt(b.v) : fmtKg(Math.round(b.v))}${sp.unit}</b><br>` +
              `${b.tip || "týden od " + b.label}`,
          });
        });
        svg += `<line class="axis" x1="${padL}" x2="${W - padR}" y1="${padT + ih}" y2="${padT + ih}"/>`;
      } else {
        const pts = sp.series.flatMap((s) => s.pts);
        if (!pts.length) {
          el.innerHTML = `<div class="muted small" style="padding-top:60px;text-align:center">
            V tomto období žádná data.
          </div>`;
          return;
        }
        let x0 = Math.min(...pts.map((p) => p.x)),
          x1 = Math.max(...pts.map((p) => p.x));
        if (x1 - x0 < DAY) {
          x0 -= 3 * DAY;
          x1 += 3 * DAY;
        }
        let y0 = Math.min(...pts.map((p) => p.y)),
          y1 = Math.max(...pts.map((p) => p.y));
        const pad = (y1 - y0) * 0.08 || 1;
        const ticks = niceTicks(Math.max(0, y0 - pad), y1 + pad, 4);
        const ya = ticks[0],
          yb = ticks[ticks.length - 1];
        const X = (x) => padL + ((x - x0) / (x1 - x0)) * iw,
          Y = (y) => padT + ih - ((y - ya) / (yb - ya)) * ih;
        for (const t of ticks) {
          svg += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}"/>
          <text x="${padL - 6}" y="${Y(t) + 4 * textScale}" text-anchor="end">${yFmt(t)}</text>`;
        }
        // x ticks: months
        const span = x1 - x0;
        const stepM = span > 730 * DAY ? 6 : span > 365 * DAY ? 3 : span > 150 * DAY ? 2 : 1;
        const d = new Date(x0);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        d.setMonth(d.getMonth() + 1);
        let lastX = -99;
        while (d.getTime() <= x1) {
          if (d.getMonth() % stepM === 0 || stepM === 1) {
            const x = X(d.getTime());
            if (x - lastX > 34) {
              svg +=
                `<text x="${x}" y="${H - 6}" text-anchor="middle">
                ${MONTHS[d.getMonth()]}` +
                `${d.getMonth() === 0 ? " " + String(d.getFullYear()).slice(2) : ""}
              </text>`;
              lastX = x;
            }
          }
          d.setMonth(d.getMonth() + 1);
        }
        if (lastX < 0) {
          svg += `<text x="${padL}" y="${H - 6}">${fmtDateS(x0)}</text>
          <text x="${W - padR}" y="${H - 6}" text-anchor="end">${fmtDateS(x1)}</text>`;
        }
        svg += `<line class="axis" x1="${padL}" x2="${W - padR}" y1="${padT + ih}" y2="${padT + ih}"/>`;
        sp.hit = [];
        for (const s of sp.series) {
          if (!s.pts.length) continue;
          if (!s.noLine) {
            const path = s.pts
              .map((p, i) => (i ? "L" : "M") + X(p.x).toFixed(1) + "," + Y(p.y).toFixed(1))
              .join("");
            svg += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2}"
                stroke-linejoin="round" stroke-linecap="round"/>`;
          }
          const many = s.pts.length > 60 && !s.dots;
          s.pts.forEach((p, i) => {
            const last = i === s.pts.length - 1;
            if (s.noDots) {
            } else if (s.dots) {
              svg += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="2.6" fill="${s.color}"/>`;
            } else if (!many || last) {
              svg += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${last ? 5 : 3.2}" fill="${s.color}"
                  stroke="var(--surface)" stroke-width="2"/>`;
            }
            sp.hit.push({
              x: X(p.x),
              y: Y(p.y),
              html:
                `${
                  sp.series.length > 1
                    ? `<span class="sw" style="background:${s.color}"></span>${esc(s.name)}<br>`
                    : ""
                }` +
                `<b>${fmtKg(Math.round(p.y * 10) / 10)}` +
                `${sp.unit}</b> · ${fmtDate(p.x)}${p.n > 1 ? " (" + p.n + " měření)" : ""}` +
                `${
                  p.s && p.s.bestSet && S.detailMetric === "e1rm"
                    ? `<br>${fmtKg(p.s.bestSet.kg)}×${p.s.bestSet.reps}`
                    : ""
                }`,
            });
          });
        }
      }
      svg += `<line id="${el.id}-cx" x1="0" x2="0" y1="${padT}" y2="${padT + ih}" stroke="var(--ink-3)"
          stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/>
      </svg>
      <div class="tip" hidden></div>`;
      el.innerHTML = svg;
      const tip = el.querySelector(".tip"),
        cx = el.querySelector("#" + el.id + "-cx");
      const move = (ev) => {
        const r = el.getBoundingClientRect();
        const mx = ev.clientX - r.left,
          my = ev.clientY - r.top;
        let best = null,
          bd = 1e9;
        for (const p of sp.hit) {
          const dd = Math.abs(p.x - mx) + Math.abs(p.y - my) * 0.25;
          if (dd < bd) {
            bd = dd;
            best = p;
          }
        }
        if (!best) return;
        tip.hidden = false;
        tip.innerHTML = best.html;
        const tx = Math.min(Math.max(best.x, 70), W - 70);
        tip.style.left = tx + "px";
        tip.style.top = best.y - 10 + "px";
        cx.setAttribute("x1", best.x);
        cx.setAttribute("x2", best.x);
        cx.setAttribute("visibility", "visible");
      };
      el.onpointermove = move;
      el.onpointerdown = move;
      el.onpointerleave = () => {
        tip.hidden = true;
        cx.setAttribute("visibility", "hidden");
      };
    });
  }
  let rsT;
  window.addEventListener("resize", () => {
    clearTimeout(rsT);
    rsT = setTimeout(drawCharts, 150);
  });

  /* ---------- akce: klepnutí (data-act), psaní a změny v políčkách ---------- */
  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-act]");
    if (!t) return;
    const act = t.dataset.act,
      v = t.dataset.v,
      i = +t.dataset.i,
      j = +t.dataset.j;
    saveChipScroll();
    saveChipScroll(document.getElementById("sheetRoot"));
    if (act === "scrim") {
      if (ev.target === t) {
        closeSheet();
      }
      return;
    }
    const d = curDraft();
    if (d && t.dataset.i !== undefined) {
      edMark(d, d.ex[i]);
    } // F1-11: klepnutí v kartě cviku (série, ✓, krokovač, menu cviku)
    switch (act) {
      // přepnutí záložky z rozdělané úpravy (i ze stránky cviku otevřené z úpravy) se zeptá jako Zpět
      case "tab":
        if (edChanged()) {
          confirmSheet("Zahodit změny?", "Neuložené změny se ztratí.", "Zahodit", "tabDiscard", v);
          break;
        }
        goTab(v);
        break;
      case "tabDiscard":
        closeSheet();
        goTab(v);
        break;
      case "selGym":
        S.selGym = v;
        tplOther = false;
        scheduleRender();
        break;
      case "startEmpty":
        if (S.active) {
          go("train");
          break;
        }
        startWorkout(null);
        break;
      case "startTpl":
        if (S.active) {
          toast("Nejdřív dokonči rozdělaný trénink.");
          go("train");
          break;
        }
        startWorkout(v);
        break;
      case "newTpl":
        S.editDraft = {
          mode: "template",
          id: null,
          title: "Nová šablona",
          // předvybrané fitko, kde teď cvičíš (s jedním fitkem bez přiřazení)
          gyms: curGym() && S.cfg.gyms.length > 1 ? [curGym()] : [],
          ex: [],
        };
        goEdit();
        break;
      case "editTpl": {
        const t = S.templates[v];
        S.editDraft = {
          mode: "template",
          id: v,
          title: t.name,
          gymId: curGym(),
          gyms: tplGyms(t),
          ex: (t.items || []).map((it) => ({
            k: uid("e"),
            exId: it.exId,
            ...ssOf(it),
            note: "",
            sets: (it.sets || []).map(newSetFrom),
          })),
        };
        goEdit();
        break;
      }
      case "cycType": {
        const s = d.ex[i].sets[j];
        s.t = TYPES[(TYPES.indexOf(s.t) + 1) % TYPES.length];
        touchDraft();
        scheduleRender();
        break;
      }
      case "done":
        toggleSetDone(d, i, j);
        break;
      case "kk":
        sheetStepper(i, j, v);
        break;
      case "kkStep": {
        const a = S.active;
        if (!kk || !a) break;
        const step = kkStepNext(a, a.ex[kk.i], v);
        t.innerHTML = `<span>krok</span> ${esc(kkStepStr(v, step))}`;
        // tlačítko zahřívací série (F1-08) zaokrouhluje na krok kg
        const warmBtn = document.getElementById("kk-warm");
        const warm = warmBtn && v === "kg" ? warmInfo(a, kk.i, kk.j) : null;
        if (warm) {
          warmBtn.innerHTML = warmLabel(warm);
        }
        break;
      }
      case "kkWarm": {
        const a = S.active;
        const warm = kk && a ? warmInfo(a, kk.i, kk.j) : null;
        if (warm) {
          kkSet("kg", warm.kg);
        }
        break;
      }
      case "kkKbd":
        kkKeyboard();
        break;
      case "kkDone": {
        const at = kk;
        closeSheet();
        if (at && S.active) {
          toggleSetDone(S.active, at.i, at.j);
        }
        break;
      }
      case "jumpFix":
        closeSheet();
        focusInput("in-" + d.ex[i].k + "-" + j + "-" + v);
        break;
      case "jumpOk":
        closeSheet();
        d.ex[i].sets[j].jumpOk = true;
        toggleSetDone(d, i, j);
        break;
      case "delSet":
        swOpen = null;
        d.ex[i].sets.splice(j, 1);
        touchDraft();
        scheduleRender();
        break;
      case "undo": {
        const fn = toast.undo;
        toast.undo = null;
        clearTimeout(toast.t);
        document.getElementById("toastRoot").innerHTML = "";
        if (fn) {
          fn();
        }
        break;
      }
      case "addSet": {
        const ss = d.ex[i].sets;
        const l = [...ss].reverse().find((s) => s.t !== "w");
        const n =
          d.mode === "template" && l
            ? newSetFrom({ t: l.t, kg: num(l.kg), reps: num(l.reps) })
            : newSetFrom(l ? { t: l.t } : null);
        ss.push(n);
        touchDraft();
        scheduleRender();
        break;
      } // mimo šablonu prázdná, šedé předvyplnění z minula (jinak „–“)
      case "addWarm": {
        const ss = d.ex[i].sets;
        let k = 0;
        while (k < ss.length && ss[k].t === "w") {
          k++;
        }
        ss.splice(k, 0, { t: "w", kg: "", reps: "", done: false });
        touchDraft();
        scheduleRender();
        break;
      }
      case "exMenu": {
        const e = d.ex[i];
        const run = ssRun(d.ex, i);
        // supersérie (F4-05): spojit s dalším cvikem, pokud už s ním není; zrušit celou supersérii
        const ssBtns =
          (i < d.ex.length - 1 && !(run && run[1] > i)
            ? `<button class="btn block" data-act="ssOn" data-i="${i}">Supersérie s dalším cvikem</button>`
            : "") +
          (run ? `<button class="btn block" data-act="ssOff" data-i="${i}">Zrušit supersérii</button>` : "");
        openSheet(
          exName(e.exId),
          `<div class="stack">
            <button class="btn block" data-act="exNote" data-i="${i}">
              ${e.note || e.showNote ? "Upravit poznámku" : "Přidat poznámku"}
            </button>
            <button class="btn block" data-act="exReplace" data-i="${i}">Nahradit jiným cvikem</button>
            ${ssBtns}
            ${
              d.ex.length > 1
                ? '<button class="btn block" data-act="exOrder">Změnit pořadí cviků</button>'
                : ""
            }
            <button class="btn block" data-act="openEx" data-v="${esc(e.exId)}">
              Stránka cviku (popis, statistiky)
            </button>
            <button class="btn block danger" data-act="exRemove" data-i="${i}">
              Odebrat cvik z tréninku
            </button>
          </div>`,
        );
        break;
      }
      case "exNote":
        d.ex[i].showNote = true;
        closeSheet();
        scheduleRender();
        setTimeout(() => {
          const n = document.getElementById("note-" + d.ex[i].k);
          n && n.focus();
        }, 60);
        break;
      case "exOrder":
        sheetExOrder();
        break;
      case "ssOn":
        ssLink(d.ex, i);
        edMark(d, d.ex[i]);
        touchDraft();
        closeSheet();
        scheduleRender();
        break;
      case "ssOff":
        ssUnlink(d.ex, i);
        edMark(d, d.ex[i]);
        touchDraft();
        closeSheet();
        scheduleRender();
        break;
      case "exRemove": {
        const ssBefore = d.ex.map((e) => [e, e.ss]); // Vrátit obnoví i supersérii (F4-05)
        const old = d.ex.splice(i, 1)[0];
        ssNorm(d.ex);
        touchDraft();
        closeSheet();
        scheduleRender();
        exUndoOffer(d, i, old, null, "Cvik odebrán", ssBefore);
        break;
      }
      case "exReplace":
        openPicker("replace", i);
        break;
      case "addEx":
        openPicker("add");
        break;
      case "pickToggle":
        if (pick.mode === "replace") {
          pick.sel = [v];
        } else {
          const k = pick.sel.indexOf(v);
          k < 0 ? pick.sel.push(v) : pick.sel.splice(k, 1);
        }
        renderPicker(true);
        break;
      case "pickM":
        pick.m = v;
        pick.limit = 0;
        renderPicker(true);
        break;
      case "pickEq":
        pick.eq = v;
        pick.limit = 0;
        renderPicker(true);
        break;
      case "pickHist":
        pick.hist = !pick.hist;
        pick.limit = 0;
        renderPicker(true);
        break;
      case "pickMore":
        pick.limit = (pick.limit || 120) + 120;
        refreshPickList();
        break;
      case "exInfo":
        galReset();
        sheetExInfo(v);
        break;
      case "pickDone": {
        const dd = curDraft();
        if (!dd) {
          closeSheet();
          break;
        }
        let replaced = null;
        if (pick.mode === "replace") {
          // nahrazený cvik zůstává v supersérii
          const e = Object.assign(exEntryFor(pick.sel[0], dd.gymId), ssOf(dd.ex[pick.replaceI]));
          replaced = { i: pick.replaceI, old: dd.ex[pick.replaceI], k: e.k };
          dd.ex[pick.replaceI] = e;
          edMark(dd, e);
        } else {
          for (const id of pick.sel) {
            dd.ex.push(
              dd.mode === "template"
                ? {
                    k: uid("e"),
                    exId: id,
                    note: "",
                    sets: [newSetFrom(null), newSetFrom(null), newSetFrom(null)],
                  }
                : exEntryFor(id, dd.gymId),
            );
          }
          edMark(dd, dd.ex[dd.ex.length - 1]);
        }
        touchDraft();
        closeSheet();
        scheduleRender();
        if (replaced && replaced.old) {
          exUndoOffer(dd, replaced.i, replaced.old, replaced.k, "Cvik nahrazen");
        }
        break;
      }
      case "newEx":
        sheetExEdit(null);
        break;
      case "backPicker":
        navBack();
        break;
      case "fedbOpen": {
        // v = odkud: picker (výběr cviků), list (záložka Cviky), form (formulář Nový cvik)
        if (v === "form") {
          const n = document.getElementById("x-name");
          fedbOpen(exEd ? exEd.from : "picker", n ? n.value.trim() : "", true);
        } else {
          fedbOpen(v, v === "list" ? S.exlQ : pick.q);
        }
        break;
      }
      case "fsBack":
        navBack();
        break;
      case "fsAll":
        fs.all = !fs.all;
        fs.limit = 0;
        refreshFs();
        break;
      case "fsMore":
        fs.limit = (fs.limit || 40) + 40;
        refreshFs();
        break;
      case "fsRetry":
        renderFs();
        break;
      case "fsPick": {
        const x = typeof FEDB !== "undefined" && FEDB.find((o) => o.id === v);
        if (x) {
          sheetExEdit(null, fs.from, x);
        }
        break;
      }
      case "fsHave":
        if (fs.from === "picker") {
          if (pick.mode === "replace") {
            pick.sel = [v];
          } else if (!pick.sel.includes(v)) {
            pick.sel.push(v);
          }
          renderPicker();
          toast("Vybráno: " + exOf(v).name);
          break;
        }
        {
          const f = S.route !== "exd" ? navFrame() : null;
          closeSheet();
          S.exPart = "info";
          S.exDetail = v;
          S.detailGym = "all";
          S.exHistLimit = 25;
          if (f) {
            S.prevRoute = S.route;
            S.nav.push(f);
          }
          go("exd");
          break;
        }
      case "saveEx": {
        const name = document.getElementById("x-name").value.trim();
        if (!name) {
          toast("Zadej název cviku.");
          break;
        }
        const id =
          v ||
          "c-" +
            name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .slice(0, 40) +
            "-" +
            Date.now().toString(36).slice(-4);
        if (!exEd.pri.length) {
          toast("Vyber aspoň jednu hlavní partii.");
          break;
        }
        // F0-09: odkaz jen https://… (http://…), jinak se cvik neuloží
        const urlInput = document.getElementById("x-url");
        urlInput.value = urlNormalize(urlInput.value);
        if (urlMark(urlInput)) {
          urlInput.scrollIntoView({ block: "center", behavior: "smooth" });
          break;
        }
        const items = Object.assign({}, S.exLib);
        const o = Object.assign({}, items[id] || { custom: true }, {
          name,
          cz: document.getElementById("x-cz").value.trim(),
          pri: exEd.pri.slice(),
          sec: exEd.sec.slice(),
          muscle: GROUP_OF[exEd.pri[0]],
          equip: document.getElementById("x-equip").value,
          kind: document.getElementById("x-kind").value,
          gymDep: document.getElementById("x-gd").checked,
          desc: document.getElementById("x-desc").value.trim(),
        });
        if (!v && exEd.fx) {
          o.src = "fedb:" + exEd.fx.id;
        } // F0-03: cvik převzatý z free-exercise-db
        const url = urlInput.value;
        if (url) {
          o.url = url;
        } else {
          delete o.url;
        }
        if (!o.cz) {
          delete o.cz;
        }
        if (!o.desc) {
          delete o.desc;
        }
        items[id] = o;
        putEx(items);
        if (!v && exEd.fx && exEd.fxPh.length && S.photosOn) {
          // F2-05: vybrané fotky z online databáze se stáhnou až teď, k uloženému cviku
          photosFromFedb(
            id,
            exEd.fx,
            exEd.fxPh.slice().sort((a, b) => a - b),
            null,
            false,
          )
            .then(() => {
              toast("Cvik uložen i s fotkami");
              scheduleRender();
            })
            .catch((e) => {
              toast(
                e && e.message === "img"
                  ? "Cvik je uložený, fotky se nepodařilo stáhnout. Přidáš je na stránce cviku."
                  : photoErr(e),
              );
              scheduleRender();
            });
        }
        if (exEd.from === "detail") {
          closeSheet();
          toast("Cvik uložen");
          break;
        }
        if (exEd.from === "info") {
          exEd = null;
          renderPicker(true);
          toast("Cvik uložen");
          break;
        }
        if (exEd.from === "list") {
          closeSheet();
          if (!v) {
            S.nav.push(navFrame());
            S.exDetail = id;
            S.exPart = "info";
            S.detailGym = "all";
            S.exHistLimit = 25;
            S.prevRoute = "ex";
            go("exd");
          }
          toast("Cvik uložen");
          break;
        }
        if (!v) {
          if (pick.mode === "replace") {
            pick.sel = [id];
          } else {
            pick.sel.push(id);
          }
        }
        pick.q = "";
        renderPicker();
        toast("Cvik uložen");
        break;
      }
      case "resetEx": {
        const items = Object.assign({}, S.exLib),
          a = items[v].archived;
        items[v] = Object.assign({}, EX_DB[v]);
        if (a) {
          items[v].archived = true;
        }
        putEx(items);
        if (exEdOut()) {
          closeSheet();
          toast("Cvik vrácen na výchozí");
          break;
        }
        exEd = null;
        renderPicker(true);
        toast("Cvik vrácen na výchozí");
        break;
      }
      case "archEx": {
        const items = Object.assign({}, S.exLib);
        const was = !!items[v].archived;
        items[v] = Object.assign({}, items[v]);
        if (was) {
          delete items[v].archived;
        } else {
          items[v].archived = true;
        }
        putEx(items);
        if (!exEd || exEdOut()) {
          closeSheet();
        } else {
          renderPicker();
        }
        toast(was ? "Cvik je znovu ve výběru" : "Cvik skrytý z výběru");
        break;
      }
      // fotky u cviku (F2-05)
      case "xPh": {
        const k = +v;
        const sel = exEd.fxPh;
        if (sel.includes(k)) {
          sel.splice(sel.indexOf(k), 1);
        } else {
          sel.push(k);
        }
        renderExEdit(S.exLib[exEd.id] || {});
        break;
      }
      case "phView":
        openViewer(v, t.closest("#sheetRoot") ? "info" : "exd", t.dataset.ex);
        break;
      case "phAddGym":
        if (phAdd) {
          phAdd.gym = v || null;
          renderPhAdd(true);
        }
        break;
      case "phAddFirst":
        if (phAdd) {
          phAdd.first = t.checked;
        }
        break;
      case "phAddSave":
        phAddSave();
        break;
      case "pvBack":
      case "fpBack":
        navBack();
        break;
      case "pvGym":
        if (pv) {
          pv.gymOpen = !pv.gymOpen;
          pvChrome();
        }
        break;
      case "pvSetGym":
        pvUpdate({ gymId: v || null });
        break;
      case "pvFirst":
        pvUpdate({ first: t.checked });
        break;
      case "pvDel":
        pvDelAsk();
        break;
      case "pvDelNo":
        renderViewer();
        break;
      case "pvDelOk":
        pvDelOk();
        break;
      case "phFedb":
        fedbPhotos(v);
        break;
      case "fpRetry":
        renderFp(true);
        break;
      case "fpPick": {
        const x = typeof FEDB !== "undefined" && FEDB.find((o) => o.id === v);
        if (fp && x) {
          fp.x = x;
          fp.sel = [];
          renderFp();
        }
        break;
      }
      case "fpSel": {
        const k = +v;
        if (!fp) break;
        if (fp.sel.includes(k)) {
          fp.sel.splice(fp.sel.indexOf(k), 1);
        } else {
          fp.sel.push(k);
        }
        renderFp(true);
        break;
      }
      case "fpGym":
        if (fp) {
          fp.gym = v || null;
          renderFp(true);
        }
        break;
      case "fpFirst":
        if (fp) {
          fp.first = t.checked;
        }
        break;
      case "fpSearch":
        if (fp) {
          fp.search = true;
          fp.x = null;
          fp.sel = [];
          renderFp();
        }
        break;
      case "fpSave":
        fpSave();
        break;
      case "bkPhotos":
        lsSet("bkPhotos", t.checked);
        break;
      case "xMus": {
        const k = v;
        const P = exEd.pri,
          Sx = exEd.sec;
        if (P.includes(k)) {
          P.splice(P.indexOf(k), 1);
          Sx.push(k);
        } else if (Sx.includes(k)) {
          Sx.splice(Sx.indexOf(k), 1);
        } else {
          P.push(k);
        }
        renderExEdit({});
        break;
      }
      case "editExDetail":
        sheetExEdit(v, "detail");
        break;
      case "editExInfo":
        sheetExEdit(v, "info");
        break;
      case "statsRange":
        S.statsRange = v;
        lsSet("statsRange", v);
        scheduleRender();
        break;
      case "sumPeriod":
        S.sumPeriod = v;
        scheduleRender();
        break;
      case "closeSheet":
        closeSheet();
        break;
      case "restAdj":
        if (!S.restEnd) break;
        S.restEnd += +v * 1000;
        S.restTotal = Math.max(S.restTotal, (S.restEnd - Date.now()) / 1000);
        restSave();
        renderRest();
        break;
      case "restSkip":
        restStop();
        break;
      case "finish": {
        const problem = draftProblem(d, true);
        if (problem) {
          showProblem(problem.e, problem.j, problem);
          break;
        }
        const ex = draftToWorkout(d, true);
        const undone = d.ex.reduce((a, e) => a + e.sets.filter((s) => !s.done).length, 0);
        if (!ex.length) {
          toast("Žádná série není označená jako hotová.");
          break;
        }
        const lastAt = lastSetAt(d);
        const sug = suggestEnd(d);
        let b = `<p style="margin:0">
          ${ex.length} cviků, ${ex.reduce((a, e) => a + e.sets.length, 0)} sérií.
        </p>
        ${
          undone ? `<p class="small muted" style="margin:0">${undone} neoznačených sérií se neuloží.</p>` : ""
        }`;
        b += `<div class="card stack" style="gap:8px">
          <div class="row">
            <label class="f grow">
              Začátek
              <input class="inp" type="time" value="${toTimeInput(d.start)}" disabled>
            </label>
            <label class="f grow">
              Konec
              <input class="inp" type="time" id="fin-end" data-f="finEnd" value="${toTimeInput(sug)}">
            </label>
          </div>
          <div class="small muted" id="fin-info">${finInfo(d, sug, lastAt)}</div>
        </div>`;
        if (d.tplId && S.templates[d.tplId]) {
          b +=
            `<label class="switch">
            <input type="checkbox" id="updTpl"${d.again ? "" : " checked"}> Aktualizovat šablonu „` +
            `${esc(S.templates[d.tplId].name)}“ (cviky a váhy)
          </label>`;
        }
        openSheet(
          "Dokončit trénink?",
          b,
          `<button class="btn grow" data-act="closeSheet">Zpět</button>
          <button class="btn primary grow" data-act="finishOk">Uložit trénink</button>`,
        );
        break;
      }
      case "finishOk": {
        const ex = draftToWorkout(d, true);
        const upd = document.getElementById("updTpl");
        const sug = suggestEnd(d);
        const end = finEndValue(d) || sug;
        const w = { title: d.title.trim() || defaultTitle(), start: d.start, end, gymId: d.gymId, ex };
        if (d.tplId) {
          w.tplId = d.tplId;
        }
        if (typeof d.again === "string") {
          w.againOf = d.again;
        }
        if (Math.abs(end - sug) >= 60000) {
          w.endOrig = sug;
        }
        const id = uid("w");
        saveWorkout(id, w, null);
        if (upd && upd.checked) {
          const items = Object.assign({}, S.templates);
          items[d.tplId] = Object.assign({}, items[d.tplId], {
            items: ex.map((e) => Object.assign({ exId: e.exId, sets: e.sets.map(tplSet) }, ssOf(e))),
          });
          put("config/templates", { items });
        }
        S.active = null;
        saveActive();
        restStop();
        closeSheet();
        toast("Trénink uložen");
        go("hist");
        sheetWorkout(Object.assign({ id, mk: monthKey(w.start) }, w), true);
        if (S.cfg.recCelW) {
          const R = wRecs({ id });
          if (R.length) {
            celebrate(R, w.title + " · " + R.length + " " + plural(R.length, "rekord", "rekordy", "rekordů"));
          }
        }
        break;
      }
      case "discard":
        confirmSheet("Zahodit trénink?", "Rozdělaný trénink se smaže a neuloží.", "Zahodit", "discardOk");
        break;
      case "discardOk":
        S.active = null;
        saveActive();
        restStop();
        closeSheet();
        go("train");
        break;
      case "edCancel":
        navBack();
        break;
      case "edDiscard":
        closeSheet();
        navBack(true);
        break;
      case "saveEdit": {
        const problem = draftProblem(d, false);
        if (problem) {
          showProblem(problem.e, problem.j, problem);
          break;
        }
        if (inputProblem("ed-dur")) break;
        const ex = draftToWorkout(d, false);
        if (!ex.length) {
          toast("Trénink je prázdný.");
          break;
        }
        const old = (S.months[d.mk] || {})[d.id] || {};
        const w = Object.assign({}, old, {
          title: d.title.trim() || "Trénink",
          start: d.start,
          end: d.end,
          gymId: d.gymId,
          ex,
        });
        const oldDur = (old.end || old.start) - old.start;
        if (Math.abs(d.end - d.start - oldDur) >= 60000 && !old.endOrig) {
          w.endOrig = d.start + oldDur;
        }
        if (w.endOrig && Math.abs(w.endOrig - w.start - (w.end - w.start)) < 60000) {
          delete w.endOrig;
        }
        saveWorkout(d.id, w, d.mk);
        S.editDraft = null;
        toast("Změny uloženy");
        go("hist");
        break;
      }
      case "delWorkout":
        confirmSheet(
          "Smazat trénink?",
          "Trénink „" + esc(d.title) + "“ se trvale smaže.",
          "Smazat",
          "delWorkoutOk",
        );
        break;
      case "delWorkoutOk": {
        const items = Object.assign({}, S.months[d.mk] || {});
        delete items[d.id];
        put("workouts/" + d.mk, { items });
        S.editDraft = null;
        closeSheet();
        toast("Trénink smazán");
        go("hist");
        break;
      }
      case "saveTpl": {
        const name = d.title.trim();
        if (!name) {
          toast("Zadej název šablony.");
          break;
        }
        const problem = draftProblem(d, false);
        if (problem) {
          showProblem(problem.e, problem.j, problem);
          break;
        }
        const items = Object.assign({}, S.templates);
        const id = d.id || uid("t");
        // Object.assign: zachová i pole, která editor nezná
        items[id] = Object.assign({}, items[id], {
          name,
          // pořadí 0 (první šablona) se při uložení nesmí změnit
          order: items[id] ? items[id].order || 0 : tplNextOrder(items),
          gyms: tplGyms({ gyms: d.gyms }),
          items: ssNorm(
            d.ex.map((e) => ({
              exId: e.exId,
              ...ssOf(e),
              sets: e.sets.map((s) => ({
                t: s.t,
                kg: num(s.kg) || 0,
                reps: num(s.reps) || 0,
                sec: parseSec(s.sec) || 0,
                km: num(s.km) || 0,
              })),
            })),
          ),
        });
        put("config/templates", { items });
        S.editDraft = null;
        toast("Šablona uložena");
        go("train");
        break;
      }
      case "tplGym": {
        const gyms = tplGyms({ gyms: d.gyms });
        d.gyms = gyms.includes(v) ? gyms.filter((g) => g !== v) : tplGyms({ gyms: gyms.concat(v) });
        scheduleRender();
        break;
      }
      case "tplOrder":
        sheetTplOrder();
        break;
      case "tplOther":
        tplOther = true;
        scheduleRender();
        break;
      case "delTpl":
        confirmSheet(
          "Smazat šablonu?",
          "Šablona „" + esc(d.title) + "“ se smaže. Tréninky podle ní zůstanou.",
          "Smazat",
          "delTplOk",
        );
        break;
      case "delTplOk": {
        const items = Object.assign({}, S.templates);
        delete items[S.editDraft.id];
        put("config/templates", { items });
        S.editDraft = null;
        closeSheet();
        go("train");
        break;
      }
      case "histGym":
        S.histGym = v;
        S.histLimit = 40;
        scheduleRender();
        break;
      case "histView":
        S.histView = v;
        lsSet("histView", v);
        scheduleRender();
        break;
      case "calM":
        calShift(+v);
        break;
      case "calDay":
        sheetCalDay(v);
        break;
      case "calActive":
        go("train");
        break;
      case "calW":
        sheetWorkout(Object.assign({ id: v, mk: t.dataset.m }, S.months[t.dataset.m][v]), false, {
          lv: 2,
          back: () => sheetCalDay(t.dataset.k, true),
        });
        break;
      case "calBody":
        sheetBody(v, { lv: 2, back: () => sheetCalDay(t.dataset.k, true) });
        break;
      case "histMore":
        S.histLimit = (S.histLimit || 40) + 40;
        scheduleRender();
        break;
      case "wAgain": {
        if (S.active) {
          closeSheet();
          toast("Nejdřív dokonči rozdělaný trénink.");
          go("train");
          break;
        }
        sheetAgain(Object.assign({ id: v, mk: t.dataset.m }, S.months[t.dataset.m][v]));
        break;
      }
      case "againGym": {
        if (!again) break;
        again.gym = v;
        document
          .querySelectorAll('[data-act="againGym"]')
          .forEach((c) => c.setAttribute("aria-pressed", c.dataset.v === v));
        const el = document.getElementById("againInfo");
        if (el) {
          el.innerHTML = againInfo();
        }
        break;
      }
      case "againBack":
        navBack();
        break;
      case "againOk":
        if (again && !S.active) {
          startAgain();
        }
        break;
      case "prevW": {
        const o = wOpen;
        const x = S.months[t.dataset.m] && S.months[t.dataset.m][v];
        if (!x) break;
        sheetWorkout(Object.assign({ id: v, mk: t.dataset.m }, x), false, {
          lv: ((o && o.nav.lv) || 1) + 1,
          back: wBack(o),
        });
        break;
      }
      case "openW": {
        const w = Object.assign({ id: v, mk: t.dataset.m }, S.months[t.dataset.m][v]);
        sheetWorkout(w);
        break;
      }
      case "editW": {
        const w = Object.assign({ id: v, mk: t.dataset.m }, S.months[t.dataset.m][v]);
        S.editDraft = workoutToDraft(w, "edit");
        goEdit();
        break;
      }
      case "wToTpl": {
        const w = S.months[t.dataset.m][v];
        const items = Object.assign({}, S.templates);
        const id = uid("t");
        items[id] = {
          name: w.title,
          order: tplNextOrder(items),
          // fitko tréninku (F2-02; s jedním fitkem bez přiřazení)
          gyms: S.cfg.gyms.length > 1 ? tplGyms({ gyms: [w.gymId] }) : [],
          items: (w.ex || []).map((e) => Object.assign({ exId: e.exId, sets: e.sets.map(tplSet) }, ssOf(e))),
        };
        put("config/templates", { items });
        closeSheet();
        toast("Šablona „" + w.title + "“ vytvořena");
        break;
      }
      case "statsGym":
        S.statsGym = v;
        scheduleRender();
        break;
      case "statsMetric":
        S.statsMetric = v;
        scheduleRender();
        break;
      case "exMuscle":
        S.exMuscle = v;
        scheduleRender();
        break;
      case "exMore":
        S.exLimit = (S.exLimit || 60) + 60;
        scheduleRender();
        break;
      // ze záložky Cviky a z výběru se otevře Popis, odjinud (trénink, historie, statistiky) Statistiky
      case "openEx": {
        const f = S.route !== "exd" ? navFrame() : null;
        closeSheet();
        S.exPart = t.dataset.p || (S.route === "ex" ? "info" : "stats");
        S.exDetail = v;
        S.detailGym = "all";
        S.exHistLimit = 25;
        if (f) {
          S.prevRoute = S.route;
          S.nav.push(f);
        }
        go("exd");
        break;
      }
      case "exBack":
        navBack();
        break;
      case "setOpen":
        setPageOpen(v);
        break;
      case "setBack":
        navBack();
        break;
      case "exPart":
        S.exPart = v;
        render.keepScroll = false;
        scheduleRender();
        window.scrollTo(0, 0);
        break;
      case "exlM":
        S.exlM = v;
        lsSet("exlM", v);
        S.exlLimit = 0;
        scheduleRender();
        break;
      case "exlEq":
        S.exlEq = v;
        lsSet("exlEq", v);
        S.exlLimit = 0;
        scheduleRender();
        break;
      case "exlSort":
        S.exlSort = v;
        lsSet("exlSort", v);
        S.exlLimit = 0;
        scheduleRender();
        break;
      case "exlHid":
        S.exlHid = !S.exlHid;
        S.exlLimit = 0;
        scheduleRender();
        break;
      case "exlMore":
        S.exlLimit = (S.exlLimit || 100) + 100;
        scheduleRender();
        break;
      case "exlNew":
        sheetExEdit(null, "list");
        break;
      case "detailMetric":
        S.detailMetric = v;
        scheduleRender();
        break;
      case "detailRange":
        S.detailRange = v;
        scheduleRender();
        break;
      case "detailGym":
        S.detailGym = v;
        scheduleRender();
        break;
      case "exHistMore":
        S.exHistLimit += 25;
        scheduleRender();
        break;
      case "toggleGymDep": {
        const items = Object.assign({}, S.exLib);
        items[S.exDetail] = Object.assign({}, items[S.exDetail], { gymDep: t.checked });
        putEx(items);
        break;
      }
      case "bodyMetric":
        S.bodyMetric = v;
        scheduleRender();
        break;
      case "bodyRange":
        S.bodyRange = v;
        scheduleRender();
        break;
      case "bodyMore":
        S.bodyLimit = (S.bodyLimit || 30) + 30;
        scheduleRender();
        break;
      case "addBody":
        sheetBody(null);
        break;
      case "editBody":
        sheetBody(v);
        break;
      case "saveBody": {
        if (BODY_F.some(([k]) => inputProblem("b-" + k))) break;
        const o = {
          date: new Date(document.getElementById("b-date").value + "T08:00").getTime() || Date.now(),
        };
        for (const [k] of BODY_F) {
          const n = num(document.getElementById("b-" + k).value);
          if (isFinite(n)) {
            o[k] = n;
          }
        }
        const note = document.getElementById("b-note").value.trim();
        if (note) {
          o.note = note;
        }
        if (Object.keys(o).length < 2) {
          toast("Vyplň aspoň jednu hodnotu.");
          break;
        }
        const items = Object.assign({}, S.body);
        items[v || uid("b")] = o;
        put("body/all", { items });
        closeSheet();
        toast("Měření uloženo");
        break;
      }
      case "delBody": {
        const items = Object.assign({}, S.body);
        delete items[v];
        put("body/all", { items });
        closeSheet();
        break;
      }
      case "addGym":
        sheetGym(null);
        break;
      case "editGym":
        sheetGym(v);
        break;
      case "gymCol":
        for (const x of document.querySelectorAll(".cpick button")) {
          const on = x === t;
          x.setAttribute("aria-checked", on);
          x.querySelector("i").textContent = on ? "✓" : "";
        }
        break;
      case "saveGym": {
        const name = document.getElementById("g-name").value.trim();
        if (!name) {
          toast("Zadej název fitka.");
          break;
        }
        const cfg = JSON.parse(JSON.stringify(S.cfg));
        let id = v;
        const pk = document.querySelector(".cpick [aria-checked=true]"),
          col = pk ? +pk.dataset.v : 0;
        if (id) {
          const g = cfg.gyms.find((g) => g.id === id);
          g.name = name;
          if (col) {
            g.col = col;
          }
        } else {
          id = uid("g");
          cfg.gyms.push({ id, name, col: col || freeGymCol(cfg.gyms) });
        }
        if (document.getElementById("g-def").checked) {
          cfg.defaultGymId = id;
        }
        put("config/main", cfg);
        closeSheet();
        break;
      }
      case "delGym": {
        const cfg = JSON.parse(JSON.stringify(S.cfg));
        cfg.gyms = cfg.gyms.filter((g) => g.id !== v);
        if (cfg.defaultGymId === v) {
          cfg.defaultGymId = cfg.gyms[0].id;
        }
        put("config/main", cfg);
        // smazané fitko zmizí i ze šablon (F2-02)
        if (Object.values(S.templates).some((x) => (x.gyms || []).includes(v))) {
          const items = {};
          for (const [id, x] of Object.entries(S.templates)) {
            items[id] = Object.assign({}, x, { gyms: (x.gyms || []).filter((g) => g !== v) });
          }
          put("config/templates", { items });
        }
        closeSheet();
        break;
      }
      case "restSec": {
        const cfg = Object.assign({}, S.cfg, { restSec: +v });
        put("config/main", cfg);
        break;
      }
      case "restSs":
        put("config/main", Object.assign({}, S.cfg, { restSs: +v }));
        break;
      case "restAlert":
        put("config/main", Object.assign({}, S.cfg, { restAlert: v }));
        restPost();
        break;
      case "restOver":
        put("config/main", Object.assign({}, S.cfg, { restOver: t.checked }));
        break;
      case "stepper":
        put("config/main", Object.assign({}, S.cfg, { stepper: t.checked }));
        break;
      case "screenOn":
      case "screenDim":
        put("config/main", Object.assign({}, S.cfg, { [act]: t.checked }));
        wakeSync();
        break;
      case "restNotify":
        put("config/main", Object.assign({}, S.cfg, { restNotify: t.checked }));
        if (t.checked) {
          notifAsk();
        }
        restPost();
        break;
      case "notifAsk":
        notifAsk();
        break;
      case "recCelEx":
      case "recCelW":
        put("config/main", Object.assign({}, S.cfg, { [act]: t.checked }));
        break;
      case "recSnd":
        put("config/main", Object.assign({}, S.cfg, { recSnd: v }));
        if (v !== "off") {
          celSound(true, v);
        }
        break;
      case "recSndPlay":
        celSound(true, v);
        break;
      case "recTry":
        celebrate([{ exId: "", type: "e1rm", v: 100, prev: 95 }], "Ukázka");
        break;
      case "notifTest":
        restTest();
        break;
      case "restLog":
        sheetRestLog();
        break;
      case "restLogClear":
        if (window.caches) {
          caches.delete(REST_LOG).then(sheetRestLog);
        }
        break;
      case "theme":
        setTheme(v);
        scheduleRender();
        break;
      case "fontScale":
        setFontScale(v);
        scheduleRender();
        break;
      case "export":
        doExport();
        break;
      case "importOk":
        doImport(v);
        break;
      case "importGo":
        confirmImport(v);
        break;
      case "bkNow":
        makePoint("manual").then((ok) => {
          if (ok) {
            toast("Bod obnovy vytvořen");
          }
        });
        break;
      case "bkRestore":
        openPoint(v);
        break;
      case "bkSave":
        savePoint(v);
        break;
      case "bkNoHelp":
        lsSet("bkHelpOff", true);
        closeSheet();
        break;
      case "bkHelp":
        showBackupHelp(true);
        break;
      case "updCheck":
        checkUpdate();
        break;
      case "copyMain":
        confirmSheet(
          "Zkopírovat data z vydané verze?",
          "Data této testovací verze se nahradí kopií dat z vydané verze v tomto telefonu. " +
            "Vydaná verze se nijak nezmění.",
          "Zkopírovat",
          "copyMainOk",
        );
        break;
      case "copyMainOk":
        closeSheet();
        copyFromMain();
        break;
      case "testDel":
        confirmSheet(
          "Smazat data testovacích verzí?",
          "Smažou se tréninky a nastavení ze všech testovacích verzí v tomto telefonu. " +
            "Data vydané verze zůstanou.",
          "Smazat",
          "testDelOk",
        );
        break;
      case "testDelOk":
        closeSheet();
        deleteTestData();
        break;
    }
  });
  /* F1-11: Enter (✓ na klávesnici) v jednořádkovém textovém poli (hledání, názvy, poznámka u měření) schová
     klávesnici, napsaný text zůstane; číselná políčka (data-num), datum a čas beze změny */
  document.addEventListener("keydown", (ev) => {
    const t = ev.target;
    if (ev.key !== "Enter" || t.tagName !== "INPUT" || (t.dataset && t.dataset.num)) return;
    if (!["text", "search", "url", "email"].includes(t.type)) return;
    ev.preventDefault();
    t.blur();
  });
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.id === "warmPct") {
      document.getElementById("warmPctV").textContent = t.value + " %";
      return;
    } // F1-08: posuvník ukazuje procenta hned, uloží se po puštění (change)
    if (t.dataset && t.dataset.num) {
      numInput(t);
    } // F1-10: jen povolené znaky, červený rámeček
    if (t.id === "x-url" && t.classList.contains("bad") && !urlProblem(t.value)) {
      urlMark(t);
    } // F0-09: opravený odkaz už není červený
    const f = t.dataset && t.dataset.f;
    if (!f) return;
    const d = curDraft();
    const i = +t.dataset.i,
      j = +t.dataset.j;
    if (d && t.dataset.i !== undefined) {
      edMark(d, d.ex[i]);
    } // F1-11: psaní v kartě cviku
    if (f === "kg" || f === "reps" || f === "sec" || f === "km") {
      const set = d.ex[i].sets[j];
      set[f] = t.value;
      delete set.jumpOk; // změněná hodnota = znovu zkontrolovat velký skok
      touchDraft();
      return;
    }
    if (f === "note") {
      d.ex[i].note = t.value;
      touchDraft();
      return;
    }
    if (f === "title") {
      d.title = t.value;
      touchDraft();
      return;
    }
    if (f === "finEnd") {
      const a = S.active;
      if (a) {
        const e = finEndValue(a);
        const inf = document.getElementById("fin-info");
        if (e && inf) {
          inf.innerHTML = finInfo(a, e, lastSetAt(a));
        }
      }
      return;
    }
    if (f === "bodyWeight") {
      const n = num(t.value);
      if (isFinite(n) && numCheck("bw", t.value).ok) {
        clearTimeout(S._bwT);
        S._bwT = setTimeout(() => put("config/main", Object.assign({}, S.cfg, { bodyWeight: n })), 700);
      }
      return;
    }
    if (f === "exSearch") {
      S.exSearch = t.value;
      scheduleRender();
      return;
    }
    if (f === "exlQ") {
      S.exlQ = t.value;
      S.exlLimit = 0;
      scheduleRender();
      return;
    }
    if (f === "pickQ") {
      pick.q = t.value;
      pick.limit = 0;
      refreshPickList();
      return;
    }
    if (f === "fsQ") {
      fs.q = t.value;
      fs.limit = 0;
      refreshFs();
      return;
    }
    if (f === "fpQ" && fp) {
      fp.q = t.value;
      refreshFp();
      return;
    }
  });
  document.addEventListener("change", (ev) => {
    const t = ev.target;
    const f = t.dataset && t.dataset.f;
    const d = curDraft();
    if (t.dataset && t.dataset.num) {
      // po opuštění políčka jednotná podoba („85“ → „1:25“), u série i v rozdělaném tréninku
      const norm = numNormalize(t.dataset.num, t.value);
      if (norm !== t.value) {
        t.value = norm;
        t.numLast = norm;
        if (d && (f === "kg" || f === "reps" || f === "sec" || f === "km")) {
          d.ex[+t.dataset.i].sets[+t.dataset.j][f] = norm;
          touchDraft();
        }
      }
      const msg = numMsg(t);
      if (msg) {
        toast(msg);
      } // u políčka s červeným rámečkem krátká nápověda
    }
    if (t.id === "impFile") {
      readImport(t);
      return;
    }
    if (t.id === "warmPct") {
      put("config/main", Object.assign({}, S.cfg, { warmPct: +t.value }));
      return;
    }
    if (t.id === "phCamIn" || t.id === "phPickIn") {
      photoFiles(t);
      return;
    }
    if (t.id === "x-url") {
      // odkaz u cviku (F0-09): doplnit https://, neplatný zvýraznit s nápovědou pod polem
      t.value = urlNormalize(t.value);
      urlMark(t);
      return;
    }
    if (f === "xEquip") {
      const gd = document.getElementById("x-gd");
      if (gd) {
        gd.checked = !!GYMDEP_EQUIP[t.value];
      }
      return;
    }
    if (t.id === "x-kind" && exEd) {
      renderExEdit(S.exLib[exEd.id] || {});
      return;
    }
    if (!f || !d) return;
    if (f === "gymId") {
      d.gymId = t.value;
      touchDraft();
      scheduleRender();
    }
    if (f === "date" || f === "time") {
      const ds = document.getElementById("ed-date").value,
        ts = document.getElementById("ed-time").value;
      const dur = (d.end || d.start) - d.start;
      const n = new Date(ds + "T" + (ts || "12:00")).getTime();
      if (isFinite(n)) {
        d.start = n;
        d.end = n + dur;
      }
    }
    if (f === "dur") {
      const m = num(t.value);
      if (isFinite(m) && numCheck("min", t.value).ok) {
        d.end = d.start + m * 60000;
      }
    }
  });

  /* ---------- pravidla zabezpečení (F0-08) ----------
     Content-Security-Policy v index.html: kód a data jen z vlastních souborů, obrázky navíc
     z raw.githubusercontent.com a blob: (fotky u cviků z IndexedDB, F2-05). Kód zapsaný přímo v HTML (onclick=, onerror= …) prohlížeč
     nespustí, proto se události řeší tady posluchači. */

  // náhled fotky z free-exercise-db, který se nenačetl (offline, chybí), se schová
  document.addEventListener(
    "error",
    (ev) => {
      const t = ev.target;
      if (t && t.tagName === "IMG" && (t.classList.contains("fsimg") || t.closest(".thumbs"))) {
        t.style.visibility = "hidden";
      }
    },
    true,
  );
  // v testovací verzi a lokálně ukázat, co pravidla zablokovala (zapomenutá úprava pravidel)
  document.addEventListener("securitypolicyviolation", (ev) => {
    if (!DEV) return;
    const what = !ev.blockedURI || ev.blockedURI === "inline" ? "kód přímo v HTML" : ev.blockedURI;
    toast("Zabezpečení zablokovalo: " + ev.effectiveDirective + " " + what);
    console.warn("CSP:", ev.effectiveDirective, what, ev.sourceFile + ":" + ev.lineNumber);
  });

  /* ---------- tlačítko Zpět (F0-06) ----------
     Každý stisk systémového Zpět (i gesto) = jeden krok navBack() podle toho, co je na obrazovce:
     panel → o úroveň / zavřít, stránka cviku a úprava → tam, odkud se přišlo, jiná záložka → Trénink.
     Na hlavní obrazovce Tréninku první Zpět jen ukáže hlášku, další appku zavře.
     Historie prohlížeče jen „počítá kroky“: drží se v ní aspoň tolik záznamů, kolik kroků zbývá
     na hlavní obrazovku, + 1 pojistka. Záznamy se přidávají jen po klepnutí – Chrome záznamy
     přidané bez klepnutí může při Zpět přeskočit. Po hlášce na hlavní obrazovce zůstanou kroky
     „dopředu“ v historii; dotyk (klepnutí i swipe) pojistku obnoví krokem vpřed (history.forward),
     ten klepnutí nepotřebuje. Rozdělaný trénink Zpět nikdy neukončí. */
  // pos = kde v historii appky jsme, top = nejvyšší existující záznam, wait = čeká se na krok vpřed
  const Nav = { pos: 0, top: 0, ignore: false, exit: false, wait: false };
  (function () {
    const st = history.state;
    Nav.pos = Nav.top = st && typeof st.zd === "number" ? st.zd : 0;
    try {
      history.replaceState({ zd: Nav.pos }, "");
    } catch (e) {}
  })();
  // kolik stisků Zpět zbývá na hlavní obrazovku Tréninku
  function navDepth() {
    const r = S.route,
      top = S.nav[S.nav.length - 1];
    let page = 1; // jiná záložka: jeden krok na Trénink
    if (r === "exd" || r === "edit") {
      page = 1 + (top ? top.d : 1);
    } else if (r === "train") {
      page = 0;
    } else if (r === "set" && S.setPage) {
      page = 2; // podstránka Nastavení → rozcestník → Trénink
    }
    return (celEl ? 1 : 0) + (sheetNav ? sheetNav.lv : 0) + page;
  }
  // místo, kam se vrátit ze stránky cviku nebo z úpravy (i s otevřeným panelem a posunem stránky)
  function navFrame() {
    return { route: S.route, re: sheetNav && sheetNav.re, y: window.scrollY, d: navDepth() };
  }
  // úprava tréninku/šablony má neuložené změny
  const edChanged = () => !!S.editDraft && JSON.stringify(S.editDraft) !== S.editOrig;
  // přepnutí záložky dole (zavře stránku cviku i úpravu; Historie vždy na aktuálním měsíci,
  // Nastavení na rozcestníku)
  function goTab(v) {
    S.exDetail = null;
    S.editDraft = null;
    if (v === "hist" && S.route !== "hist") {
      S.calM = 0;
    }
    if (v === "ex" && S.route !== "ex" && S.route !== "exd") {
      S.exlQ = "";
      S.exlLimit = 0;
    }
    if (v === "set") {
      setPageOpen("");
      return;
    }
    go(v);
  }
  // otevře úpravu tréninku nebo šablony (S.editDraft) a zapamatuje si, kam se pak vrátit
  function goEdit() {
    const f = navFrame();
    closeSheet();
    S.nav.push(f);
    S.editOrig = JSON.stringify(S.editDraft);
    go("edit");
  }
  /* jeden krok zpět: medaile, panel, stránka cviku / úprava (tam, odkud se přišlo), podstránka Nastavení →
     rozcestník, jiná záložka → Trénink;
     force = zahodit neuložené změny bez ptaní; false = už není kam (hlavní obrazovka Tréninku) */
  function navBack(force) {
    if (celEl) {
      celClose();
      return true;
    }
    if (sheetNav) {
      sheetNav.back();
      return true;
    }
    const r = S.route;
    if (r === "edit" && !force && edChanged()) {
      confirmSheet("Zahodit změny?", "Neuložené změny se ztratí.", "Zahodit", "edDiscard");
      return true;
    }
    if (r === "exd" || r === "edit") {
      const d = S.editDraft;
      if (r === "edit") {
        S.editDraft = null;
      }
      const f = S.nav.pop();
      if (!f) {
        go(
          r === "edit"
            ? d && d.mode === "template"
              ? "train"
              : "hist"
            : S.prevRoute && S.prevRoute !== "exd" && S.prevRoute !== "edit"
              ? S.prevRoute
              : "ex",
        );
        return true;
      }
      go(f.route);
      render.restoreY = f.y;
      if (f.re) {
        f.re();
      }
      return true;
    }
    if (r === "set" && S.setPage) {
      setPageOpen("");
      return true;
    }
    if (r !== "train") {
      go("train");
      return true;
    }
    return false;
  }
  // doplní záznamy do historie prohlížeče, aby na každý krok zpět zbyl jeden (jen po klepnutí)
  function navEnsure() {
    if (Nav.exit || Nav.wait || (navigator.userActivation && !navigator.userActivation.isActive)) return;
    const need = navDepth() + 1;
    while (Nav.pos < need) {
      Nav.pos++;
      Nav.top = Nav.pos;
      history.pushState({ zd: Nav.pos }, "");
    }
  }
  window.addEventListener("popstate", (ev) => {
    const p = ev.state && typeof ev.state.zd === "number" ? ev.state.zd : 0;
    const fwd = p > Nav.pos;
    Nav.pos = p;
    if (p > Nav.top) {
      Nav.top = p;
    }
    if (fwd) {
      Nav.wait = false;
      navEnsure();
      return;
    }
    if (Nav.ignore) {
      Nav.ignore = false;
      return;
    }
    saveChipScroll();
    if (navBack()) return;
    // hlavní obrazovka Tréninku: zahodit zbylé kroky, další Zpět appku zavře
    if (p > 0) {
      Nav.ignore = true;
      history.go(-p);
    }
    Nav.exit = true;
    toast("Stiskni Zpět ještě jednou pro zavření", "exit");
  });
  // dotyk do appky (klepnutí i swipe) po hlášce: schovat ji a obnovit pojistku proti zavření
  function navRearm() {
    if (!Nav.exit) return;
    Nav.exit = false;
    const t = document.querySelector(".toast.exit");
    if (t) {
      t.remove();
    }
    if (Nav.top > Nav.pos) {
      Nav.wait = true;
      history.forward();
      setTimeout(() => {
        if (Nav.wait) {
          Nav.wait = false;
          navEnsure();
        }
      }, 800);
    }
  }
  document.addEventListener("pointerdown", navRearm, true);
  document.addEventListener("touchstart", navRearm, { capture: true, passive: true });
  document.addEventListener("click", navRearm, true);
  // po klepnutí doplnit kroky (otevřený panel, stránka)
  document.addEventListener("click", () => navEnsure());

  /* ---------- záloha (F0-01) ----------
     Dvě vrstvy ochrany:
     1) Záloha do souboru (JSON) — stáhne se do telefonu, odtud ručně na Disk / e-mail.
        Datum poslední zálohy je v config/backup.last.
        Po 7 dnech bez zálohy ukáže úvodní obrazovka pruh s připomínkou.
     2) Body obnovy uvnitř appky (IndexedDB, úložiště "points"): automaticky jednou za 7 dní,
        vždy před obnovou ze zálohy a ručně. Drží se posledních BK_MAX_POINTS.
     Formát souboru: version 2 = version 1 + pole "photos" (fotky u cviků F2-05, jen v souboru
     s přepínačem „Zálohovat i fotky“; body obnovy mají photos prázdné, includes.photos = false).
     Obnova umí "sloučit" (doplní chybějící, nic nepřepíše) a "nahradit vše" (fotky jen přidá). */
  const BK_VERSION = 2,
    BK_REMIND_DAYS = 14,
    BK_AUTO_DAYS = 7,
    BK_MAX_POINTS = 8;
  const BK_REASON = {
    auto: "Automatický (týdenní)",
    pre: "Před obnovou ze zálohy",
    exdb: "Před aktualizací databáze cviků",
    manual: "Ručně vytvořený",
  };
  // počet tréninků ve všech měsících
  const countW = (months) => Object.values(months || {}).reduce((a, m) => a + Object.keys(m || {}).length, 0);
  const daysAgo = (t) => Math.floor((Date.now() - t) / DAY);
  const agoLabel = (t) => {
    const n = daysAgo(t);
    return n <= 0 ? "dnes" : n === 1 ? "včera" : "před " + n + " " + plural(n, "dnem", "dny", "dny");
  };

  // celá záloha jako objekt (formát v2) bez fotek; stejný obsah má i bod obnovy
  function snapshotAll() {
    return {
      app: "workout-denik",
      version: BK_VERSION,
      exported: new Date().toISOString(),
      includes: { photos: false },
      cfg: S.cfg,
      exercises: S.exLegacy || S.exLib,
      exDb: S.exLegacy ? undefined : EX_V,
      templates: S.templates,
      months: S.months,
      body: S.body,
      photos: {}, // F2-05: fotky doplní doExport (photosExport), formát viz sekce „FOTKY U CVIKU“
    };
  }
  // čas poslední zálohy do souboru (z databáze nebo z Local, novější z nich), jinak null
  function lastBackupAt() {
    const a = +(S.bk && S.bk.last) || 0,
      b = +lsGet("lastBackup", 0) || 0;
    const m = Math.max(a, b);
    return m || null;
  }
  // zapamatuje si čas zálohy do souboru
  function markBackup(ts) {
    lsSet("lastBackup", ts);
    put("config/backup", Object.assign({}, S.bk, { last: ts }));
  }

  // je čas zálohovat: máš tréninky a poslední záloha do souboru je starší než BK_REMIND_DAYS (nebo žádná)
  function backupDue() {
    if (!countW(S.months)) return false;
    const last = lastBackupAt();
    return !last || daysAgo(last) >= BK_REMIND_DAYS;
  }
  /* připomínka na úvodní obrazovce (a oranžový řádek Data a záloha v Nastavení);
     klepnutí na pruh otevře Nastavení → Data a záloha, tlačítko Zálohovat rovnou stáhne zálohu */
  function backupBanner() {
    if (!backupDue()) return "";
    const last = lastBackupAt();
    const txt = last
      ? "Poslední záloha do souboru " + agoLabel(last) + "."
      : "Zatím nemáš žádnou zálohu v souboru.";
    return (
      `<div class="banner act" data-act="setOpen" data-v="data" role="button">` +
      `<span class="grow">${txt}</span>` +
      `<button class="btn" data-act="export">
        Zálohovat
      </button></div>`
    );
  }

  /* Nastavení → Data a záloha */
  function backupSettings() {
    const last = lastBackupAt();
    let h = '<section class="sec"><div class="sec-h"><h2>Záloha</h2></div><div class="card stack">';
    h += `<div class="small muted">
      Záloha je jeden soubor JSON se vším (tréninky, šablony, cviky, fitka, měření). Ulož si ho mimo
      telefon, třeba na Google Disk.
    </div>`;
    const ps = photoStats();
    if (ps.n) {
      h += `<label class="switch">
        <input type="checkbox" data-act="bkPhotos" ${lsGet("bkPhotos", true) ? "checked" : ""}>
        <span><b>Zálohovat i fotky</b><br><span class="xs muted">Fotky u cviků: ${fmtInt(ps.n)}
            ${plural(ps.n, "fotka", "fotky", "fotek")} · ${fmtSize(ps.size)}, záloha s nimi bude asi o
            ${fmtSize((ps.size * 4) / 3)} větší. Fotky ochrání jen záloha s fotkami.</span></span>
      </label>`;
    }
    h += `<div class="row wrap-r">
      <button class="btn primary grow" data-act="export">Stáhnout zálohu</button>
      <label class="btn grow" for="impFile">Obnovit ze souboru</label>
      <input type="file" id="impFile" accept=".json,application/json" hidden>
    </div>`;
    h += `<div class="row">
      <span class="xs muted grow">
        Poslední záloha: ${last ? fmtDate(last) + " (" + agoLabel(last) + ")" : "zatím nikdy"}
      </span>
      <button class="btn sm ghost" data-act="bkHelp">Jak na Disk?</button>
    </div>`;
    h += "</div></section>";

    h += `<section class="sec">
      <div class="sec-h">
        <h2>Body obnovy</h2>
        ${pointsApi ? icoBtn("bkNow", "plus", "Vytvořit bod obnovy teď") : ""}
      </div>
      <div class="card">`;
    if (!pointsApi) {
      h += `<div class="small muted">
        Body obnovy tady nejsou dostupné (prohlížeč nepovolil úložiště).
      </div>`;
    } else {
      h +=
        `<div class="small muted" style="margin-bottom:6px">
        Kopie dat uložené v appce: automaticky jednou týdně a vždy před obnovou ze zálohy. Chrání před
        chybou v nové verzi nebo špatnou obnovou, ne před ztrátou telefonu. Drží se posledních ` +
        `${BK_MAX_POINTS}.${ps.n ? " Fotky u cviků v bodech obnovy nejsou (zabraly by moc místa)." : ""}
      </div>`;
      const pts = S.bk.points || [];
      if (!pts.length) {
        h += '<div class="xs muted">Zatím žádný bod obnovy.</div>';
      }
      for (const p of pts) {
        h +=
          `<div class="bkpt">
          <div class="grow">
            <b class="small">${fmtDate(p.at)} ${toTimeInput(p.at)}</b>
            <div class="xs muted">
              ${esc(BK_REASON[p.reason] || p.reason)} · ${fmtInt(p.n || 0)} ` +
          `${plural(p.n || 0, "trénink", "tréninky", "tréninků")}
            </div>
          </div>
          <button class="btn sm ghost" data-act="bkSave" data-v="${esc(p.id)}">Stáhnout</button>
          <button class="btn sm" data-act="bkRestore" data-v="${esc(p.id)}">Obnovit</button>
        </div>`;
      }
    }
    h += "</div></section>";
    return h;
  }

  /* stažení souboru */
  async function doExport() {
    const o = snapshotAll();
    const name = FILE_P + "-" + toDateInput(Date.now()) + ".json";
    if (!downloads) {
      toast("Stahování tady není dostupné.");
      return;
    }
    if (lsGet("bkPhotos", true) && photoStats().n) {
      // F2-05: fotky jako base64 (soubor naroste asi o třetinu víc, než fotky zabírají)
      toast("Připravuji zálohu s fotkami…");
      try {
        o.photos = await photosExport();
        o.includes.photos = true;
      } catch (e) {
        toast("Fotky se nepodařilo přidat do zálohy.");
        return;
      }
    }
    const data = JSON.stringify(o);
    try {
      await downloads.save({ filename: name, data });
      markBackup(Date.now());
      scheduleRender();
      if (!lsGet("bkHelpOff", false)) {
        showBackupHelp(false, name);
      } else {
        toast("Záloha stažena");
      }
    } catch (e) {
      if (e && e.code !== "declined") {
        toast("Stažení se nepovedlo (" + (e.code || "chyba") + ")");
      }
    }
  }
  // okno s návodem, jak dostat zálohu na Disk (force = otevřené tlačítkem Jak na Disk?)
  function showBackupHelp(force, name) {
    let b = "";
    if (!force) {
      b +=
        `<p style="margin:0">
        Soubor <b>${esc(name || "workout-denik-….json")}</b> je v telefonu ve složce <b>Stažené</b> ` +
        `(Download).
      </p>`;
    }
    b += `<p class="small muted" style="margin:0">
      Aby záloha přežila i ztrátu telefonu, pošli ji mimo něj:
    </p>`;
    b += `<ol class="steps small">
      <li>
        V Chromu klepni na <b>⋮ → Stažené soubory</b> (nebo otevři appku <b>Soubory</b> → Stažené).
      </li>
      <li>Podrž soubor zálohy a zvol <b>Sdílet</b>.</li>
      <li>Vyber <b>Disk</b> → Uložit (nebo Gmail a pošli si ho).</li>
    </ol>`;
    b += `<p class="xs muted" style="margin:0">
      Obnova: Nastavení → Data a záloha → Obnovit ze souboru a vybrat soubor (z Disku jde vybrat přímo).
    </p>`;
    const foot = force
      ? '<button class="btn primary grow" data-act="closeSheet">Rozumím</button>'
      : `<button class="btn grow" data-act="bkNoHelp">Příště neukazovat</button>
      <button class="btn primary grow" data-act="closeSheet">Hotovo</button>`;
    openSheet(force ? "Záloha na Disk" : "Záloha stažena", b, foot);
  }

  /* načtení a kontrola zálohy */
  function normBackup(o) {
    if (!o || typeof o !== "object" || (o.app !== "zelezny-denik" && o.app !== "workout-denik")) {
      throw new Error("Tohle není záloha Workout deníku.");
    }
    if ((+o.version || 1) > BK_VERSION) {
      throw new Error("Záloha je z novější verze appky. Nejdřív appku aktualizuj.");
    }
    const obj = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : {});
    const months = {};
    for (const mk in obj(o.months)) {
      if (/^\d{4}-\d{2}$/.test(mk)) {
        months[mk] = obj(o.months[mk]);
      }
    }
    const cfg = cfgNorm(obj(o.cfg));
    return {
      exported: o.exported,
      cfg,
      exercises: exLoad(exUrlsClean(obj(o.exercises)), o.exDb !== EX_V),
      templates: tplNorm(obj(o.templates)),
      months,
      body: obj(o.body),
      photos: photosClean(obj(o.photos)),
    };
  }
  let importData = null;
  // přečte vybraný soubor zálohy a nabídne obnovu (importSheet)
  function readImport(inp) {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        importSheet(normBackup(JSON.parse(r.result)), "Soubor zálohy");
      } catch (e) {
        toast(e instanceof SyntaxError ? "Soubor není platný JSON." : e.message);
      }
    };
    r.readAsText(f);
    inp.value = "";
  }
  // kolik tréninků ze zálohy o v appce chybí (přidá je Sloučit)
  function mergeCount(o) {
    let n = 0;
    for (const mk in o.months) {
      const cur = S.months[mk] || {};
      for (const id in o.months[mk]) {
        if (!(id in cur)) {
          n++;
        }
      }
    }
    return n;
  }
  // okno obnovy: co je v záloze (label = soubor nebo bod obnovy), volba Sloučit / Nahradit vše
  function importSheet(o, label) {
    importData = o;
    const nb = countW(o.months),
      nc = countW(S.months),
      nm = mergeCount(o);
    let b =
      `<p style="margin:0">
      ${esc(label)}${o.exported ? ` z <b>${esc(fmtDate(Date.parse(o.exported)))}</b>` : ""}: ` +
      `${fmtInt(nb)} ${plural(nb, "trénink", "tréninky", "tréninků")}. V appce je teď ${fmtInt(nc)}.
    </p>`;
    const np = Object.keys(o.photos).length;
    if (np) {
      b += `<p class="small muted" style="margin:0">
        Záloha obsahuje i ${fmtInt(np)} ${plural(np, "fotku", "fotky", "fotek")} u cviků. Sloučit doplní
        chybějící, Nahradit vše je přidá. Fotky, které v appce máš, se nesmažou.
      </p>`;
    }
    b += `<div class="card stack" style="gap:6px">
      <b>Sloučit</b>
      <div class="small muted">
        Doplní jen to, co v appce chybí (tréninky, cviky, šablony, měření, fitka). Nic se nepřepíše ani
        nesmaže. Přibude ${fmtInt(nm)} ${plural(nm, "trénink", "tréninky", "tréninků")}.
      </div>
      <button class="btn primary" data-act="importGo" data-v="merge">Sloučit</button>
    </div>`;
    b += `<div class="card stack" style="gap:6px">
      <b>Nahradit vše</b>
      <div class="small muted">
        Současná data se smažou a nahradí obsahem zálohy. Fotky u cviků zůstanou.
      </div>
      <button class="btn danger" data-act="importGo" data-v="replace">Nahradit vše</button>
    </div>`;
    if (pointsApi) {
      b += `<div class="xs muted">
        Před obnovou se automaticky vytvoří bod obnovy, takže jde krok vrátit.
      </div>`;
    }
    openSheet("Obnovit ze zálohy", b, '<button class="btn grow" data-act="closeSheet">Zrušit</button>');
  }
  // Nahradit vše se ještě jednou zeptá, Sloučit rovnou
  function confirmImport(mode) {
    if (mode === "replace") {
      confirmSheet(
        "Nahradit všechna data?",
        "Všechny současné tréninky, šablony, cviky, fitka a měření se nahradí obsahem zálohy.",
        "Nahradit",
        "importOk",
        "replace",
      );
    } else {
      doImport("merge");
    }
  }
  /* obnova ze zálohy importData: nejdřív bod obnovy „před obnovou“, pak sloučit nebo nahradit;
     v = "merge" / "replace", s „!“ na konci bez bodu obnovy (když se ho nepodařilo vytvořit) */
  async function doImport(v) {
    const o = importData;
    if (!o) return;
    const force = String(v || "").endsWith("!"),
      mode = String(v || "merge").replace("!", "");
    if (pointsApi && !force) {
      toast("Vytvářím bod obnovy…");
      const ok = await makePoint("pre");
      if (!ok) {
        confirmSheet(
          "Bod obnovy se nepodařilo vytvořit",
          "Pokračovat bez pojistky? Krok pak nepůjde vrátit.",
          "Pokračovat",
          "importOk",
          mode + "!",
        );
        return;
      }
    }
    // F2-05: fotky ze zálohy (do IndexedDB mimo Store); žádná se nesmaže
    let np = 0;
    if (S.photosOn && Object.keys(o.photos).length) {
      toast("Obnovuji fotky…");
      try {
        np = await photosImport(o.photos, mode === "replace");
      } catch (e) {
        toast("Některé fotky se nepodařilo obnovit (" + photoErr(e) + ")");
      }
    }
    if (mode === "replace") {
      applyReplace(o);
      importData = null;
      closeSheet();
      toast("Data nahrazena zálohou" + (np ? ", fotky: " + np : ""));
    } else {
      const r = applyMerge(o);
      r.other += np;
      importData = null;
      closeSheet();
      toast(
        r.w || r.other
          ? "Doplněno: " +
              r.w +
              " " +
              plural(r.w, "trénink", "tréninky", "tréninků") +
              (r.other ? ", " + r.other + " dalších položek" : "")
          : "Nic nechybělo, vše už v appce je.",
      );
    }
  }
  // Nahradit vše: data appky = obsah zálohy (měsíce, které v záloze nejsou, se smažou)
  function applyReplace(o) {
    put("config/main", o.cfg);
    putEx(o.exercises);
    put("config/templates", { items: o.templates });
    put("body/all", { items: o.body });
    for (const mk in S.months) {
      if (!(mk in o.months)) {
        put("workouts/" + mk, null);
      }
    }
    for (const mk in o.months) {
      put("workouts/" + mk, { items: o.months[mk] });
    }
  }
  // Sloučit: doplní jen to, co v appce chybí, nic nepřepíše; vrací počty přidaných položek
  function applyMerge(o) {
    const r = { w: 0, other: 0 };
    const addMissing = (cur, src) => {
      const out = Object.assign({}, cur);
      let n = 0;
      for (const k in src) {
        if (!(k in out)) {
          out[k] = src[k];
          n++;
        }
      }
      return [out, n];
    };
    for (const mk in o.months) {
      const [items, n] = addMissing(S.months[mk] || {}, o.months[mk]);
      if (n) {
        put("workouts/" + mk, { items });
        r.w += n;
      }
    }
    let [ex, ne] = addMissing(S.exLib, o.exercises);
    if (ne) {
      putEx(ex);
      r.other += ne;
    }
    let [tp, nt] = addMissing(S.templates, o.templates);
    if (nt) {
      put("config/templates", { items: tp });
      r.other += nt;
    }
    let [bd, nb] = addMissing(S.body, o.body);
    if (nb) {
      put("body/all", { items: bd });
      r.other += nb;
    }
    const have = new Set(S.cfg.gyms.map((g) => g.id)),
      add = o.cfg.gyms.filter((g) => !have.has(g.id));
    if (add.length) {
      const gs = S.cfg.gyms.slice();
      for (const g of add) {
        gs.push(gs.some((x) => x.col === g.col) ? Object.assign({}, g, { col: freeGymCol(gs) }) : g);
      }
      put("config/main", Object.assign({}, S.cfg, { gyms: gs }));
      r.other += add.length;
    }
    return r;
  }

  /* převod cviků na výchozí databázi (F0-02): jednou, s bodem obnovy předem */
  async function migrateEx() {
    if (!S.exLegacy || !pointsApi || Store.state !== "ok" || migrateEx.busy) return;
    migrateEx.busy = true;
    try {
      await makePoint("exdb");
      if (S.exLegacy) {
        S.exLegacy = null;
        putEx(S.exLib);
        scheduleRender();
      }
    } finally {
      migrateEx.busy = false;
    }
  }

  /* body obnovy (IndexedDB) */
  async function makePoint(reason) {
    if (!pointsApi || makePoint.busy) return false;
    makePoint.busy = true;
    try {
      const data = JSON.stringify(snapshotAll());
      const res = await pointsApi.upload(new Blob([data], { type: "application/json" }), {
        type: "application/json",
      });
      const pt = { id: res.id, at: Date.now(), reason, n: countW(S.months), bytes: res.sizeBytes };
      const all = [pt].concat(S.bk.points || []);
      const keep = all.slice(0, BK_MAX_POINTS),
        drop = all.slice(BK_MAX_POINTS);
      put("config/backup", Object.assign({}, S.bk, { points: keep }));
      for (const d of drop) {
        pointsApi.delete(d.id).catch(() => {});
      }
      scheduleRender();
      return true;
    } catch (e) {
      toast(
        e && e.code === "quota_or_state"
          ? "Úložiště bodů obnovy je plné."
          : "Bod obnovy se nepodařilo vytvořit (" + ((e && e.code) || "chyba") + ")",
      );
      return false;
    } finally {
      makePoint.busy = false;
    }
  }
  // automatický bod obnovy jednou za BK_AUTO_DAYS dní (jen jednou za spuštění appky)
  function autoPoint() {
    if (autoPoint.armed || !pointsApi || Store.state !== "ok") return;
    autoPoint.armed = true;
    // počkat, až dorazí všechna data z databáze
    setTimeout(() => {
      if (!countW(S.months)) return;
      const lastAuto = Math.max(
        0,
        ...(S.bk.points || []).filter((p) => p.reason === "auto").map((p) => +p.at || 0),
      );
      if (Date.now() - lastAuto >= BK_AUTO_DAYS * DAY) {
        makePoint("auto");
      }
    }, 20000);
  }
  // obsah bodu obnovy (JSON text zálohy)
  function fetchPoint(id) {
    return pointsApi.read(id);
  }
  // Obnovit z bodu obnovy: otevře stejné okno jako soubor zálohy
  async function openPoint(id) {
    const p = (S.bk.points || []).find((x) => x.id === id);
    try {
      const o = normBackup(JSON.parse(await fetchPoint(id)));
      importSheet(o, "Bod obnovy " + (p ? fmtDate(p.at) + " " + toTimeInput(p.at) : ""));
    } catch (e) {
      toast(e.message || "Bod obnovy nejde načíst.");
    }
  }
  // stáhne bod obnovy jako soubor zálohy
  async function savePoint(id) {
    const p = (S.bk.points || []).find((x) => x.id === id);
    if (!downloads) {
      toast("Stahování tady není dostupné.");
      return;
    }
    try {
      const data = await fetchPoint(id);
      await downloads.save({
        filename: FILE_P + "-bod-obnovy-" + toDateInput(p ? p.at : Date.now()) + ".json",
        data,
      });
      toast("Bod obnovy stažen");
    } catch (e) {
      if (!(e && e.code === "declined")) {
        toast(e.message || "Stažení se nepovedlo.");
      }
    }
  }

  /* ---------- verze appky (F0-04) ----------
     Vydaná verze = …/workout-denik/ (větev main), testovací verze PR = …/workout-denik-test/pr-12/
     (jiné repo, aby šla v Androidu nainstalovat vedle vydané appky; stejná doména = stejné úložiště).
     Údaje o nasazení jsou v BUILD (js/verze.js), aktualizaci řídí js/pwa.js (window.PWA). */
  const MAIN_URL = BUILD.vydana || "../"; // adresa vydané verze (z testovací verze)
  const fmtSize = (b) =>
    b < 1048576
      ? Math.max(1, Math.round(b / 1024)) + " kB"
      : (b / 1048576).toLocaleString("cs-CZ", { maximumFractionDigits: 1 }) + " MB";
  function testBar() {
    if (!TEST_PR) return "";
    return `<div class="testbar"><b>TEST · PR #${esc(TEST_PR)}</b><span class="grow">
        ${esc(BUILD.nazev)}
      </span><a href="${esc(MAIN_URL)}">Vydaná verze ›</a></div>`;
  }
  /* Nastavení → O aplikaci → Verze aplikace */
  function versionSettings() {
    const t = Date.parse(BUILD.cas);
    let h = `<section class="sec">
      <div class="sec-h"><h2>Verze aplikace</h2></div>
      <div class="card stack">`;
    h += `<div class="row"><b class="grow">${
      TEST_PR
        ? "Testovací verze · PR #" + esc(TEST_PR)
        : BUILD.kanal === "main"
          ? "Vydaná verze"
          : "Lokální spuštění"
    }</b>${TEST_PR ? '<span class="pill test">TEST</span>' : ""}</div>`;
    if (TEST_PR && BUILD.nazev) {
      h += `<div class="small">
        ${esc(BUILD.nazev)}${BUILD.vetev ? `<div class="xs muted">Větev ${esc(BUILD.vetev)}</div>` : ""}
      </div>`;
    }
    h += `<div class="small muted">${
      BUILD.commit && isFinite(t)
        ? "Nasazeno " + fmtDate(t) + " " + fmtTime(t) + " · kód změny " + esc(BUILD.commit)
        : "Bez údajů o nasazení (spuštěno mimo GitHub Pages)."
    }</div>`;
    h += '<button class="btn" data-act="updCheck">Zkontrolovat aktualizaci</button>';
    if (TEST_PR) {
      h += `<div class="small muted">
        Testovací verze má vlastní data, oddělená od vydané verze. Co tady zapíšeš nebo smažeš, se
        vydané verze netýká.
      </div>`;
      h += `<button class="btn" data-act="copyMain">Zkopírovat data z vydané verze</button>
      <a class="btn" href="${esc(MAIN_URL)}">Otevřít vydanou verzi</a>`;
    } else if (S.testData === undefined) {
      scanTestData();
    } else if (S.testData.n) {
      h +=
        `<div class="row">
        <span class="small grow">
          Data testovacích verzí v telefonu: ${S.testData.n} ` +
        `${plural(S.testData.n, "verze", "verze", "verzí")} (≈ ${fmtSize(S.testData.bytes)})
        </span>
        <button class="btn sm" data-act="testDel">Smazat</button>
      </div>`;
    }
    if (DEV && window.caches) {
      h += '<button class="btn" data-act="restLog">Záznam oznámení o pauze</button>';
    } // jen pro vývoj (F1-04)
    return `${h}</div></section>`;
  }
  async function checkUpdate() {
    if (!window.PWA) {
      toast("Aktualizace tady nejde zkontrolovat.");
      return;
    }
    toast("Kontroluji…");
    const r = await window.PWA.check();
    toast(
      r === "new"
        ? "Stahuji novou verzi, appka se hned znovu načte."
        : r === "same"
          ? "Máš nejnovější verzi."
          : r === "offline"
            ? "Nepodařilo se spojit se serverem. Jsi online?"
            : "Aktualizace tady nejde zkontrolovat.",
    );
  }
  /* data testovacích verzí v tomto telefonu (jen pro vydanou verzi):
     databáze workout-denik-prN a klíče zd1-prN: */
  const testKeys = () => {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/^zd1-pr\d+:/.test(k || "")) {
          out.push(k);
        }
      }
    } catch (e) {}
    return out;
  };
  async function testDbs() {
    try {
      return indexedDB.databases
        ? (await indexedDB.databases())
            .map((d) => d.name)
            .filter((n) => /^workout-denik-pr\d+$/.test(n || ""))
        : [];
    } catch (e) {
      return [];
    }
  }
  async function scanTestData() {
    if (scanTestData.busy) return;
    scanTestData.busy = true;
    const prs = {};
    let bytes = 0;
    for (const k of testKeys()) {
      prs[k.match(/^zd1-pr(\d+):/)[1]] = 1;
      bytes += k.length + (localStorage.getItem(k) || "").length;
    }
    for (const n of await testDbs()) {
      prs[n.match(/\d+$/)[0]] = 1;
      try {
        const db = await idbOpenExisting(n);
        for (const st of ["docs", "points"]) {
          for (const [k, v] of await idbAll(db, st)) {
            bytes += String(k).length + JSON.stringify(v).length;
          }
        }
        db.close();
      } catch (e) {}
    }
    S.testData = { n: Object.keys(prs).length, bytes };
    scanTestData.busy = false;
    scheduleRender();
  }
  async function deleteTestData() {
    toast("Mažu…");
    try {
      for (const k of testKeys()) {
        localStorage.removeItem(k);
      }
      for (const n of await testDbs()) {
        await new Promise((r) => {
          const q = indexedDB.deleteDatabase(n);
          q.onsuccess = q.onerror = q.onblocked = () => r();
        });
      }
      if (window.caches) {
        for (const k of await caches.keys()) {
          if (/^wd-pr\d+-|^wdlog-pr\d+$/.test(k)) {
            await caches.delete(k);
          }
        }
      } // i záznam oznámení (F1-04)
      if (navigator.serviceWorker) {
        for (const r of await navigator.serviceWorker.getRegistrations()) {
          if (/\/pr-\d+\/$/.test(new URL(r.scope).pathname)) {
            await r.unregister();
          }
        }
      }
      toast("Data testovacích verzí smazána");
    } catch (e) {
      toast("Nepodařilo se smazat všechno.");
    }
    S.testData = undefined;
    scheduleRender();
  }
  /* testovací verze: nahradí svá data kopií dat vydané verze (vydaná verze se jen čte) */
  async function copyFromMain() {
    let src = null,
      stopped = false;
    try {
      const names = indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : [MAIN_DB];
      if (!names.includes(MAIN_DB)) {
        toast("Vydaná verze v tomto telefonu zatím nemá žádná data.");
        return;
      }
      toast("Kopíruji data…");
      src = await idbOpenExisting(MAIN_DB);
      const docs = await idbAll(src, "docs"),
        pts = await idbAll(src, "points"),
        phs = await idbAll(src, "photos"); // fotky u cviků (F2-05); starší databáze je nemá = []
      src.close();
      src = null;
      // zastavit ukládání této verze, ať kopii nic nepřepíše; po kopii se appka znovu načte
      Store.backend = null;
      clearTimeout(Store._ct);
      clearTimeout(Store._at);
      stopped = true;
      const db = await Idb.open();
      await new Promise((res, rej) => {
        const tx = db.transaction(["docs", "points", "photos"], "readwrite"),
          d = tx.objectStore("docs"),
          p = tx.objectStore("points"),
          ph = tx.objectStore("photos");
        d.clear();
        p.clear();
        ph.clear();
        for (const [k, v] of phs) {
          ph.put(v, k);
        }
        for (const [k, v] of docs) {
          d.put(v, k);
        }
        for (const [k, v] of pts) {
          p.put(v, k);
        }
        tx.oncomplete = () => res();
        tx.onerror = tx.onabort = () => rej(Idb.err(tx.error));
      });
      // drobnosti z localStorage: fronta zápisů, rozdělaný trénink, nastavení zobrazení
      const ks = [];
      for (let i = 0; i < localStorage.length; i++) {
        ks.push(localStorage.key(i));
      }
      for (const k of ks) {
        if (k && k.startsWith(Local.P)) {
          localStorage.removeItem(k);
        }
      }
      for (const k of ks) {
        if (k && k.startsWith(MAIN_P)) {
          localStorage.setItem(Local.P + k.slice(MAIN_P.length), localStorage.getItem(k));
        }
      }
      location.reload();
    } catch (e) {
      if (src) {
        src.close();
      }
      toast("Kopírování se nepovedlo: " + ((e && e.message) || "chyba"));
      if (stopped) {
        setTimeout(() => location.reload(), 2500);
      }
    }
  }

  /* ---------- vzhled ---------- */
  function themePref() {
    return Local.get("theme", "dark");
  }
  function setTheme(v) {
    Local.set("theme", v);
    const r = document.documentElement;
    if (v === "auto") {
      r.removeAttribute("data-theme");
    } else {
      r.setAttribute("data-theme", v);
    }
    // PWA: barva stavového řádku Androidu podle pozadí appky
    const m = document.querySelector("meta[name=theme-color]");
    if (m) {
      m.content = TEST_PR ? "#f59f00" : getComputedStyle(r).getPropertyValue("--bg").trim() || "#0e1013";
    }
  }
  /* velikost písma (F3-11): celá stupnice písma v css/app.css se násobí podle data-fs na <html>,
     pamatuje se jen v tomto zařízení (Local fontScale), stejně jako motiv */
  const FONT_SCALES = [
    ["m", "Normální"],
    ["l", "Větší"],
    ["xl", "Největší"],
  ];
  function fontScalePref() {
    const v = Local.get("fontScale", "m");
    return FONT_SCALES.some(([k]) => k === v) ? v : "m";
  }
  // násobek písma pro rozměry počítané v JS (okraje grafů), podle --fs-k v css/app.css
  function fontK() {
    return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fs-k")) || 1;
  }
  function setFontScale(v) {
    Local.set("fontScale", v);
    const r = document.documentElement;
    if (v === "l" || v === "xl") {
      r.setAttribute("data-fs", v);
    } else {
      r.removeAttribute("data-fs");
    }
  }
  if (TEST_PR) {
    document.title = "TEST #" + TEST_PR + " · Workout deník";
  }
  setTheme(themePref());
  setFontScale(fontScalePref());

  /* ---------- start appky ---------- */
  render.toEx = true; // F1-11: otevřená appka s rozdělaným tréninkem ukáže naposledy změněný cvik
  render();
  (async function boot() {
    downloads = LocalDownloads;
    // požádat Chrome, ať data appky nikdy sám nemaže (u nainstalované PWA obvykle povolí bez dotazu)
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
    const ok = await Store.init(IndexedDbBackend(), applyDoc, () => {
      updSync();
      scheduleRender();
      autoPoint();
      migrateEx();
    });
    if (ok) {
      pointsApi = LocalPoints;
      photosLoad();
      scheduleRender();
      autoPoint();
      migrateEx();
    }
    if (ok && !S.active) {
      const a = await Store.fetchActive();
      if (a) {
        S.active = a;
        Local.set("active", a);
        scheduleRender();
      }
    }
    if (S.restEnd > Date.now() && !S.restFired) {
      restPost();
    } // po znovuotevření appky znovu naplánovat oznámení (F1-04)
  })();
})();
