/* Ukázková (vymyšlená) data pro snímky do návodu: 2 fitka, 3 šablony, 16 týdnů tréninků
   (Push / Pull / Nohy s postupným přidáváním váhy) a týdenní měření. Nejsou to data uživatele. */
const DAY = 86400000;
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const d2 = n => String(n).padStart(2, "0");
const mk = t => { const d = new Date(t); return d.getFullYear() + "-" + d2(d.getMonth() + 1); };
const round = (v, s) => Math.round(v / s) * s;

const G1 = "gDemoCentrum", G2 = "gDemoSever";
// cvik: [základní váha, přírůstek za týden, krok, zahřívací?, opakování, rozdíl ve Fitku Sever]
const P = {
  "bench-press-barbell": [62.5, 0.9, 2.5, true, [8, 8, 7], -5],
  "incline-bench-press-dumbbell": [20, 0.35, 2, false, [10, 10, 9], 0],
  "overhead-press-barbell": [37.5, 0.45, 2.5, true, [8, 7, 7], 0],
  "lateral-raise-dumbbell": [8, 0.12, 1, false, [12, 12, 11], 0],
  "triceps-pushdown": [25, 0.45, 2.5, false, [12, 11, 10], 5],
  "lat-pulldown-cable": [55, 0.9, 2.5, false, [10, 9, 8], -10],
  "seated-cable-row-v-grip-cable": [50, 0.8, 2.5, false, [10, 10, 9], -5],
  "pull-up": [0, 0, 1, false, [7, 6, 5], 0],
  "bicep-curl-dumbbell": [12, 0.18, 1, false, [10, 10, 9], 0],
  "squat-barbell": [80, 1.3, 2.5, true, [6, 6, 6], 0],
  "romanian-deadlift-barbell": [70, 1.1, 2.5, false, [8, 8, 8], 0],
  "leg-press-machine": [140, 2.5, 10, false, [10, 10, 10], 30],
  "lying-leg-curl-machine": [35, 0.5, 2.5, false, [12, 11, 10], -5],
  "seated-calf-raise": [40, 0.6, 5, false, [15, 14, 12], 10]
};
const TPL = {
  tPush: ["Push", ["bench-press-barbell", "incline-bench-press-dumbbell", "overhead-press-barbell", "lateral-raise-dumbbell", "triceps-pushdown"]],
  tPull: ["Pull", ["lat-pulldown-cable", "seated-cable-row-v-grip-cable", "pull-up", "bicep-curl-dumbbell"]],
  tLegs: ["Nohy", ["squat-barbell", "romanian-deadlift-barbell", "leg-press-machine", "lying-leg-curl-machine", "seated-calf-raise"]]
};

function sets(exId, week, gym, t0) {
  const [base, inc, step, warm, reps, sever] = P[exId];
  const out = [];
  let at = t0;
  if (exId === "pull-up") {
    const extra = Math.floor(week / 4);
    reps.forEach(r => { at += 150000; out.push({ t: "n", kg: 0, reps: r + extra - (rnd() < .3 ? 1 : 0), at }); });
    return out;
  }
  const kg = Math.max(step, round(base + inc * week + (gym === G2 ? sever : 0), step));
  if (warm) { at += 120000; out.push({ t: "w", kg: round(kg * 0.5, 2.5), reps: 10, at }); }
  reps.forEach((r, i) => { at += 150000 + Math.round(rnd() * 40000); out.push({ t: "n", kg, reps: Math.max(4, r - (rnd() < .25 ? 1 : 0) + (i === 0 && rnd() < .3 ? 1 : 0)), at }); });
  return out;
}

function build(now) {
  const months = {};
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const start = today.getTime() - 16 * 7 * DAY;
  const order = ["tPush", "tPull", "tLegs"];
  let k = 0, n = 0;
  const lastSets = {};
  for (let t = start; t < today.getTime(); t += DAY) {
    const wd = new Date(t).getDay();
    if (![1, 3, 5].includes(wd)) continue;
    if (rnd() < 0.12) continue; // občas vynechaný trénink
    const tplId = order[k++ % 3];
    const gym = n++ % 4 === 3 ? G2 : G1;
    const week = (t - start) / (7 * DAY);
    const s0 = t + (17 * 60 + 20 + Math.round(rnd() * 40)) * 60000;
    let at = s0;
    const ex = TPL[tplId][1].map(exId => { const ss = sets(exId, week, gym, at); at = ss[ss.length - 1].at + 60000; lastSets[exId] = ss; return { exId, sets: ss }; });
    if (tplId === "tLegs" && rnd() < 0.5) ex.push({ exId: "plank", sets: [{ t: "n", kg: 0, reps: 0, sec: 60 + Math.round(week) * 3, at: at += 120000 }, { t: "n", kg: 0, reps: 0, sec: 50 + Math.round(week) * 3, at: at += 90000 }] });
    const w = { title: TPL[tplId][0], start: s0, end: at + 3 * 60000, gymId: gym, tplId, ex };
    const m = mk(s0);
    (months[m] = months[m] || {})["wDemo" + n] = w;
  }
  const templates = {};
  Object.entries(TPL).forEach(([id, [name, list]], i) => {
    templates[id] = { name, order: i, items: list.map(exId => ({ exId, sets: (lastSets[exId] || []).map(s => ({ t: s.t, kg: s.kg, reps: s.reps, sec: 0, km: 0 })) })) };
  });
  const body = {};
  for (let i = 0; i < 16; i++) {
    const t = start + i * 7 * DAY + 8 * 3600000 - 2 * 3600000;
    const wgt = +(83.4 - i * 0.16 + (rnd() - .5) * 0.7).toFixed(1);
    body["bDemo" + i] = { date: t, weight: wgt, fat: +(19.2 - i * 0.12 + (rnd() - .5) * .4).toFixed(1), muscle: +(41.0 + i * 0.07 + (rnd() - .5) * .3).toFixed(1), waist: +(88 - i * 0.2).toFixed(1) };
  }
  const docs = {
    "config/main": { gyms: [{ id: G1, name: "Fitko Centrum" }, { id: G2, name: "Fitko Sever" }], defaultGymId: G1, restSec: 120, bodyWeight: 81 },
    "config/exercises": { v: 2, items: {} },
    "config/templates": { items: templates },
    "body/all": { items: body }
  };
  for (const m in months) docs["workouts/" + m] = { items: months[m] };
  return docs;
}
module.exports = { build };
