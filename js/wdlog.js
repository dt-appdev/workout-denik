/* ---------- WD-LOG v2 (F4-18) ----------
   Text pro AI coache za zvolené období: tréninky a měření jako dvě samostatné části, nové cviky na konci.
   Čisté funkce bez přístupu k úložišti a k S (appka předá data, testy je volají přímo v Node:
   tools/testy/wdlog.js). Ovládání (panel Export pro coache) je v js/app.js, sekce EXPORT PRO COACHE (F4-18).
   Pravidla textu (WDLOG.text):
   - čas telefonu (Date), dny jako „RRRR-MM-DD“, období obě data včetně (WDLOG.range, správně i při změně
     letního času), období dnes / 7 dní / tento týden / minulý týden (po–ne) přes WDLOG.period,
   - hlavička „WD-LOG v2 · období OD – DO · export …“ a „Tréninky: N · Měření: M“, prázdné období
     „Žádné tréninky ani měření.“,
   - trénink „## datum den · od–do (N min) · fitko · šablona“ (šablona jen u tréninku ze šablony, která ještě
     existuje), Pocit / Energie / Spánek jen vyplněné, Bolest vždy („ne“ = intenzita 0, „–“ = nevyplněno),
     Pozn.:, cviky v pořadí provedení (první odškrtnutá série s.at) „cz (name)“; ID cviku a poznámka ke cviku
     (e.note, většinou převzatá ze šablony) se nevypisují (přání uživatele 18. 10. 2026),
   - série jako v appce (setStr, F3-38): opakování × váha s jednotkou („10×55kg“), čísla s tečkou bez
     zbytečných nul, zahřívací „W …“ a „ | “, pracovní „RIR R“ (R = 10 − s.rpe, jen vyplněné), F „F (odhad
     RIR R)“ z s.rpeEst, drop set „ + D …“ u předchozí série (RIR jen vyplněné),
   - ## Měření: jeden řádek na měření, hodnoty měření s jedním desetinným místem, obvody s „cm“ jen na
     konci; hmotnost tuku, kosterní sval v kg, voda, BMI a bazální metabolismus se nevypisují; známý zdroj
     měření (F4-19, WDLOG.srcTxt) jako „· zdroj: …“ před poznámkou, měření bez zdroje bez dovětku,
   - ## Nové cviky: cviky z období, které žádný starší trénink neobsahuje. */
const WDLOG = (() => {
  const DAYS = ["ne", "po", "út", "st", "čt", "pá", "so"];
  const DAY_MS = 86400000;
  const d2 = (n) => String(n).padStart(2, "0");
  // číslo s desetinnou tečkou bez zbytečných nul (55, 32.5)
  const num = (v) => String(Math.round((+v || 0) * 100) / 100);
  // hodnota měření s jedním desetinným místem (77.4, 44.0)
  const num1 = (v) => (Math.round((+v || 0) * 10) / 10).toFixed(1);
  const day = (t) => {
    const x = new Date(t);
    return x.getFullYear() + "-" + d2(x.getMonth() + 1) + "-" + d2(x.getDate());
  };
  const time = (t) => {
    const x = new Date(t);
    return d2(x.getHours()) + ":" + d2(x.getMinutes());
  };
  const dayName = (t) => DAYS[new Date(t).getDay()];
  // půlnoc dne „RRRR-MM-DD“ v čase telefonu (ms)
  const midnight = (s) => {
    const p = String(s).split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]).getTime();
  };
  // den posunutý o n dní (přes kalendář, ne o 24 h, kvůli změně času)
  const shift = (s, n) => {
    const p = String(s).split("-").map(Number);
    return day(new Date(p[0], p[1] - 1, p[2] + n).getTime());
  };

  /* období podle volby: today | 7d | week | lastweek → { from, to } („RRRR-MM-DD“, obě včetně) */
  function period(key, now) {
    const today = day(now);
    const back = (new Date(now).getDay() + 6) % 7; // dní od pondělí
    const monday = shift(today, -back);
    if (key === "7d") return { from: shift(today, -6), to: today };
    if (key === "week") return { from: monday, to: shift(monday, 6) };
    if (key === "lastweek") return { from: shift(monday, -7), to: shift(monday, -1) };
    return { from: today, to: today };
  }
  // období na rozsah času [od, do) v ms; obrácené pořadí dat se prohodí
  function range(from, to) {
    const a = from <= to ? from : to;
    const b = from <= to ? to : from;
    return [midnight(a), midnight(shift(b, 1))];
  }
  // název souboru wd-log-OD_DO.md (u jednoho dne jen jedno datum)
  function fileName(from, to) {
    return "wd-log-" + (from === to ? from : from + "_" + to) + ".md";
  }

  /* série */
  // hodnota série bez druhu a RIR (jako setStr v appce, F3-38)
  function setVal(kind, s) {
    const kg = +s.kg || 0;
    const reps = +s.reps || 0;
    const sec = Math.round(+s.sec || 0);
    if (kind === "time") return sec + " s";
    if (kind === "timew") return sec + " s" + (kg ? "×" + num(kg) + "kg" : "");
    if (kind === "dist") return (+s.km ? num(s.km) + " km " : "") + sec + " s";
    if (kind === "distw") return num(+s.m || 0) + "m" + (kg ? "×" + num(kg) + "kg" : "");
    if (kind === "bw") return reps + "×BW";
    if (kind === "bwplus") return reps + "×" + (kg ? "BW+" + num(kg) + "kg" : "BW");
    if (kind === "assist") return reps + "×" + (kg ? "A-" + num(kg) + "kg" : "BW");
    return reps + "×" + num(kg) + "kg";
  }
  // RIR z RPE (RIR = 10 − RPE), nevyplněné ""
  function rir(rpe) {
    const n = +rpe;
    if (rpe == null || rpe === "" || !isFinite(n) || n <= 0 || n > 10) return "";
    return "RIR " + num(10 - n);
  }
  function setTxt(kind, s) {
    let x = setVal(kind, s);
    if (s.t === "f") {
      x += " F";
      const est = rir(s.rpeEst);
      if (est) {
        x += " (odhad " + est + ")";
      }
    } else if (s.t !== "w" && rir(s.rpe)) {
      x += " " + rir(s.rpe);
    }
    return x;
  }
  // série cviku na jednom řádku: „W 10×30kg | 10×55kg RIR 2, 9×35kg F + D 6×25kg“
  function sets(kind, list) {
    const warm = [];
    const work = [];
    for (const s of list || []) {
      const x = setTxt(kind, s);
      if (s.t === "w") {
        warm.push(x);
      } else if (s.t === "d" && work.length) {
        work[work.length - 1] += " + D " + x;
      } else {
        work.push((s.t === "d" ? "D " : "") + x);
      }
    }
    if (!warm.length && !work.length) return "–";
    if (!warm.length) return work.join(", ");
    return "W " + warm.join(", ") + (work.length ? " | " + work.join(", ") : "");
  }

  /* cviky a tréninky; o = data od appky (viz text) */
  // „Český název (English name)“; cvik bez názvu jeho ID
  function exName(o, id) {
    const e = o.ex(id) || {};
    const cz = e.cz || "";
    const en = e.name || "";
    return cz && en && cz !== en ? cz + " (" + en + ")" : cz || en || id;
  }
  const exCz = (o, id) => {
    const e = o.ex(id) || {};
    return e.cz || e.name || id;
  };
  // cviky v pořadí provedení (první odškrtnutá série), bez časů v pořadí seznamu
  function exOrder(w) {
    const list = (w.ex || []).map((e, i) => {
      const times = (e.sets || []).map((s) => +s.at).filter((x) => x > 0);
      return { e, i, t: times.length ? Math.min(...times) : Infinity };
    });
    list.sort((a, b) => (a.t === b.t ? a.i - b.i : a.t - b.t));
    return list.map((x) => x.e);
  }
  const oneLine = (s) =>
    String(s)
      .trim()
      .replace(/\s*\n\s*/g, " ");
  // řádek bolesti: „Bolest: ne“ (intenzita 0), „Bolest: –“ (nevyplněno), jinak místo, intenzita a cvik
  function painTxt(o, w) {
    const p = w.pain || {};
    const where = String(p.where || "").trim();
    const level = p.level === "" || p.level == null || !isFinite(+p.level) ? null : +p.level;
    if (level === 0) return "Bolest: ne";
    if (!where && level == null) return "Bolest: –";
    const parts = [where, level != null ? level + "/10" : ""].filter(Boolean).join(" ");
    return "Bolest: " + parts + (p.exId ? " – " + exCz(o, p.exId) : "");
  }
  function workout(o, w) {
    const end = w.end || w.start;
    const head = [
      `${day(w.start)} ${dayName(w.start)}`,
      `${time(w.start)}–${time(end)} (${Math.round((end - w.start) / 60000)} min)`,
    ];
    const gym = w.gymId ? o.gymName(w.gymId) : "";
    if (gym) {
      head.push(gym);
    }
    const tpl = w.tplId ? o.tplName(w.tplId) : "";
    if (tpl) {
      head.push(tpl);
    }
    const L = ["## " + head.join(" · ")];
    const feel = [];
    for (const [k, l, u] of [
      ["feel", "Pocit", ""],
      ["energy", "Energie", ""],
      ["sleep", "Spánek", " h"],
    ]) {
      if (w[k] != null && w[k] !== "" && isFinite(+w[k])) {
        feel.push(l + " " + num(w[k]) + u);
      }
    }
    if (feel.length) {
      L.push(feel.join(" · "));
    }
    L.push(painTxt(o, w));
    if (w.note && String(w.note).trim()) {
      L.push("Pozn.: " + oneLine(w.note));
    }
    exOrder(w).forEach((e, n) => {
      const kind = (o.ex(e.exId) || {}).kind || "wr";
      L.push(n + 1 + ". " + exName(o, e.exId));
      L.push("   " + sets(kind, e.sets));
    });
    return L.join("\n");
  }

  /* měření */
  const BODY = [
    ["weight", (v) => num1(v) + " kg"],
    ["fat", (v) => "tuk " + num1(v) + " %"],
    ["muscle", (v) => "svaly " + num1(v) + " %"],
    ["visceral", (v) => "viscerální tuk " + num(v)],
  ];
  const GIRTH = [
    ["waist", "pas"],
    ["chest", "hrudník"],
    ["arm", "paže"],
    ["thigh", "stehno"],
  ];
  const filled = (v) => v != null && v !== "" && isFinite(+v);
  // hodnoty měření k vypsání („77.4 kg · tuk 18.1 % · pas 89.5 · stehno 60.0 cm“), nic = ""
  function bodyVals(b) {
    const out = BODY.filter(([k]) => filled(b[k])).map(([k, f]) => f(b[k]));
    const girth = GIRTH.filter(([k]) => filled(b[k])).map(([k, l]) => l + " " + num1(b[k]));
    if (girth.length) {
      girth[girth.length - 1] += " cm";
    }
    return out.concat(girth).join(" · ");
  }
  /* zdroj měření (F4-19) jako text, neznámý = "". b.src: app = ručně v deníku, sh = ručně v Samsung Health,
     watch = hodinky (hmotnost do nich zadaná ručně, složení těla změřily), dev = jiné zařízení, ext = jiná
     aplikace; b.srcName = název hodinek, zařízení nebo aplikace */
  function srcTxt(b) {
    const name = String(b.srcName || "").trim();
    if (b.src === "app") return "ručně v deníku";
    if (b.src === "sh") return "ručně v Samsung Health";
    if (b.src === "watch") return (name || "hodinky") + (filled(b.weight) ? " (hmotnost zadaná ručně)" : "");
    if (b.src === "dev") return name || "jiné zařízení";
    if (b.src === "ext") return name || "jiná aplikace";
    return "";
  }
  function bodyLine(b) {
    let x = `${day(b.date)} ${dayName(b.date)} ${time(b.date)} · ${bodyVals(b)}`;
    const src = srcTxt(b);
    if (src) {
      x += " · zdroj: " + src;
    }
    if (b.note && String(b.note).trim()) {
      x += " · Pozn.: " + oneLine(b.note);
    }
    return x;
  }

  /* výběr dat za období: { ws, bs, fresh } (tréninky a měření chronologicky, nové cviky) */
  function pick(o) {
    const [a, b] = range(o.from, o.to);
    const all = (o.workouts || []).filter((w) => w && isFinite(+w.start));
    const ws = all.filter((w) => w.start >= a && w.start < b).sort((x, y) => x.start - y.start);
    const bs = (o.body || [])
      .filter((m) => m && m.date >= a && m.date < b && bodyVals(m))
      .sort((x, y) => x.date - y.date);
    const before = new Set();
    for (const w of all) {
      if (w.start < a) {
        for (const e of w.ex || []) {
          before.add(e.exId);
        }
      }
    }
    const fresh = [];
    for (const w of ws) {
      for (const e of exOrder(w)) {
        if (!before.has(e.exId) && !fresh.includes(e.exId)) {
          fresh.push(e.exId);
        }
      }
    }
    return { ws, bs, fresh };
  }
  function newEx(o, id) {
    const e = o.ex(id) || {};
    const low = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
    const muscles = (list) => (list && list.length ? list.map((k) => low(o.muscle(k))).join(", ") : "–");
    return [
      "- " + exName(o, id),
      low(o.equip(e.equip)) || "–",
      "primární: " + muscles(e.pri),
      "sekundární: " + muscles(e.sec),
      "gymDep: " + (e.gymDep ? "ano" : "ne"),
    ].join(" · ");
  }
  // počty pro souhrn v panelu
  function counts(o) {
    const p = pick(o);
    return { w: p.ws.length, b: p.bs.length, fresh: p.fresh.length };
  }

  /* celý text. o = { workouts (všechny, kvůli novým cvikům), body (pole měření), from, to, now,
     ex(id) → cvik { cz, name, kind, equip, pri, sec, gymDep }, gymName(id), tplName(id) (neexistující "" ),
     muscle(klíč) a equip(klíč) → český název } */
  function text(o) {
    const p = pick(o);
    const per = o.from === o.to ? o.from : o.from + " – " + o.to;
    const L = [
      `WD-LOG v2 · období ${per} · export ${day(o.now)} ${time(o.now)}`,
      `Tréninky: ${p.ws.length} · Měření: ${p.bs.length}`,
    ];
    if (!p.ws.length && !p.bs.length) {
      L.push("", "Žádné tréninky ani měření.");
      return L.join("\n");
    }
    for (const w of p.ws) {
      L.push("", workout(o, w));
    }
    if (p.bs.length) {
      L.push("", "## Měření", ...p.bs.map(bodyLine));
    }
    if (p.fresh.length) {
      L.push("", "## Nové cviky", ...p.fresh.map((id) => newEx(o, id)));
    }
    return L.join("\n");
  }

  return { period, range, fileName, num, num1, setTxt, sets, srcTxt, bodyLine, counts, text };
})();
if (typeof module !== "undefined") {
  module.exports = WDLOG;
}
