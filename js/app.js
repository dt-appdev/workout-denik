(function(){
"use strict";
/* ---------- constants ---------- */
const MUSCLES={chest:"Hrudník",back:"Záda",shoulders:"Ramena",biceps:"Biceps",triceps:"Triceps",forearms:"Předloktí",quads:"Kvadricepsy",hams:"Hamstringy",glutes:"Hýždě",adductors:"Přitahovače",calves:"Lýtka",abs:"Břicho",lowback:"Spodní záda",neck:"Krk",other:"Ostatní"};
const EQUIP={barbell:"Velká činka",dumbbell:"Jednoručky",machine:"Stroj",cable:"Kladka",smith:"Multipress",bodyweight:"Vlastní váha",band:"Guma",kettlebell:"Kettlebell",other:"Jiné"};
const GYMDEP_EQUIP={machine:1,cable:1,smith:1};
const TYPES=["n","w","d","f"]; // cycle order
const TYPE_NAME={n:"Pracovní",w:"Zahřívací",d:"Drop set",f:"Do selhání"};
const MONTHS=["led","úno","bře","dub","kvě","čvn","čvc","srp","zář","říj","lis","pro"];
const MONTHS_FULL=["leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"];
const DAY=86400000;
const IC={
  train:'<svg viewBox="0 0 24 24"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/></svg>',
  hist:'<svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10"/></svg>',
  ex:'<svg viewBox="0 0 24 24"><path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5v13"/></svg>',
  stats:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  body:'<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><path d="M5 9h14M12 9v6M12 15l-3.5 6M12 15l3.5 6"/></svg>',
  set:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
};


/* ---------- svalová mapa ----------
   Anatomické SVG: Ryan Graves, CC BY 4.0 (balíček flutter-body-atlas).
   Každá svalová vrstva bere barvu z proměnné --f-<klíč>, takže se obarvuje
   nastavením stylu na obalu, ne přestavbou SVG. */
/* ATLAS (anatomické SVG) je v js/atlas.js */
const MUSCLE_MAP=(function(){
  const NAMES={neck:"Krk",chest:"Hrudník",delts:"Ramena",traps:"Trapézy",upperback:"Horní záda",lats:"Široký sval zádový",lowback:"Spodní záda",biceps:"Biceps",triceps:"Triceps",forearm:"Předloktí",abs:"Přímý sval břišní",oblique:"Šikmé svaly",glutes:"Hýždě",quads:"Kvadricepsy",adductor:"Přitahovače",hams:"Hamstringy",calves:"Lýtka"};
  const KEYS=Object.keys(NAMES);
  function svg(view,fillOf,label){
    // ramena jsou jedna partie, v atlasu ale tři vrstvy (přední, boční, zadní)
    const st=KEYS.map(k=>{const f=fillOf(k);return (k==="delts"?["delt_f","delt_s","delt_r"]:[k]).map(v=>"--f-"+v+":"+f).join(";")}).join(";");
    return '<div class="fig" style="'+st+'">'+ATLAS[view].replace("__L__",esc(label||""))+'</div>';
  }
  function exSvg(view,pri,sec,label){return svg(view,k=>pri.indexOf(k)>=0?"var(--m-pri)":sec.indexOf(k)>=0?"var(--m-sec)":"var(--m-idle)",label)}
  return {svg,exSvg,NAMES};
})();
const MKEYS=Object.keys(MUSCLE_MAP.NAMES);
const GROUP_OF={neck:"neck",chest:"chest",delts:"shoulders",traps:"back",upperback:"back",lats:"back",lowback:"lowback",biceps:"biceps",triceps:"triceps",forearm:"forearms",abs:"abs",oblique:"abs",glutes:"glutes",quads:"quads",adductor:"adductors",hams:"hams",calves:"calves"};
/* Databáze cviků = výchozí EX_DB (js/cviky.js) + odchylky uložené v config/exercises.
   V config/exercises je {v:2, items:{id: jen změněná pole | celý vlastní cvik}}.
   Starší data (bez v:2) obsahují celé kopie cviků; při načtení se z nich nechá jen to,
   co se liší od výchozí databáze. Původní partie (EX_DB_OLD) se nahradí novými,
   ručně změněné partie zůstanou.
   partial = položky už jsou jen odchylky (načtené z config/exercises v:2), jinak celé cviky. */
const EX_V=2, DELT={delt_f:"delts",delt_s:"delts",delt_r:"delts"};
const mNorm=a=>Array.isArray(a)?a.map(k=>DELT[k]||k).filter((k,i,x)=>x.indexOf(k)===i):[];
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function exPack(items,legacy,partial){
  const out={};
  for(const id in items||{}){
    const it=items[id],b=EX_DB[id];if(!it||typeof it!=="object")continue;
    if(!b){const o=Object.assign({},it);if(o.pri)o.pri=mNorm(o.pri);if(o.sec)o.sec=mNorm(o.sec);out[id]=o;continue}
    const o={},old=legacy&&EX_DB_OLD[id],oldMus=old&&same(it.pri,old[0])&&same(it.sec,old[1]);
    for(const k in it){
      if(k==="muscle"||k==="custom")continue;
      if((k==="pri"||k==="sec")&&oldMus)continue;
      const v=k==="pri"||k==="sec"?mNorm(it[k]):it[k];
      if(!v&&!b[k])continue;
      if(!same(v,b[k]))o[k]=v;
    }
    // smazaný text (český název, popis, odkaz) u výchozího cviku se uloží jako prázdný
    if(!partial)for(const k of ["cz","desc","url"])if(b[k]&&!(k in it))o[k]="";
    if(Object.keys(o).length)out[id]=o;
  }
  return out;
}
function exMerge(packed){
  const out={};
  for(const id in EX_DB){const o=Object.assign({},EX_DB[id],packed[id]);o.muscle=GROUP_OF[(o.pri||[])[0]]||"other";out[id]=o}
  for(const id in packed)if(!EX_DB[id])out[id]=Object.assign({},packed[id]);
  for(const id in out){const o=out[id];if(o.pri&&o.sec)o.sec=o.sec.filter(k=>!o.pri.includes(k))}
  return out;
}
const exLoad=(items,legacy,partial)=>exMerge(exPack(items,legacy,partial));
function putEx(items){put("config/exercises",{v:EX_V,items:exPack(items,false)})}
const exChanged=id=>!!(EX_DB[id]&&exPack({[id]:S.exLib[id]},false)[id]);
const exOf=id=>S.exLib[id]||{name:id};
const exGroup=e=>(e.pri&&e.pri.length?GROUP_OF[e.pri[0]]:e.muscle)||"other";
const exPri=e=>e.pri&&e.pri.length?e.pri:(e.muscle?Object.keys(GROUP_OF).filter(k=>GROUP_OF[k]===e.muscle).slice(0,1):[]);
const exLink=e=>e.url||("https://www.youtube.com/results?search_query="+encodeURIComponent(e.name+" exercise form"));
// hledání bez ohledu na velikost písmen a diakritiku („tlak" najde „Tlak", „stehna" i „stehná")
const fold=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const exMatch=(e,q)=>{if(!q)return true;q=fold(q).trim();return fold(e.name).includes(q)||fold(e.cz).includes(q)};
const isAssisted=id=>/assisted/.test(id);
const isBodyweight=id=>{const e=S.exLib[id];return !!(e&&e.equip==="bodyweight")};
function exFigures(e,small){
  const pri=exPri(e),sec=e.sec||[];
  return '<div class="figs'+(small?' sm':'')+'"><figure>'+MUSCLE_MAP.exSvg("front",pri,sec,"Zepředu")+'<figcaption>Zepředu</figcaption></figure><figure>'+MUSCLE_MAP.exSvg("back",pri,sec,"Zezadu")+'<figcaption>Zezadu</figcaption></figure></div>';
}
function exTags(e){
  const pri=exPri(e),sec=e.sec||[];
  return '<div class="mus">'+pri.map(k=>'<span class="tag p">'+esc(MUSCLE_MAP.NAMES[k]||k)+'</span>').join("")+sec.map(k=>'<span class="tag s">'+esc(MUSCLE_MAP.NAMES[k]||k)+'</span>').join("")+'</div>';
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
   ===================================================================== */
const Local={ // drobnosti v zařízení (cache, fronta, nastavení zobrazení)
  P:"zd1:",
  get(k,d){try{const v=localStorage.getItem(this.P+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{if(v===undefined||v===null)localStorage.removeItem(this.P+k);else localStorage.setItem(this.P+k,JSON.stringify(v))}catch(e){}}
};
const lsGet=(k,d)=>Local.get(k,d), lsSet=(k,v)=>Local.set(k,v);

/* IndexedDB "workout-denik":
     docs   – dokumenty appky, klíč = cesta ("config/main", "workouts/2026-09", …)
     points – body obnovy, klíč = id, hodnota {id, at, data (JSON text zálohy)} */
const Idb={
  NAME:"workout-denik", VER:1, db:null,
  open(){
    if(this.db)return Promise.resolve(this.db);
    return new Promise((res,rej)=>{
      let rq;try{rq=indexedDB.open(this.NAME,this.VER)}catch(e){rej(e);return}
      rq.onupgradeneeded=()=>{
        const db=rq.result;
        if(!db.objectStoreNames.contains("docs"))db.createObjectStore("docs");
        if(!db.objectStoreNames.contains("points"))db.createObjectStore("points");
      };
      rq.onsuccess=()=>{this.db=rq.result;this.db.onversionchange=()=>{this.db.close();this.db=null};res(this.db)};
      rq.onerror=()=>rej(rq.error);
      rq.onblocked=()=>rej(new Error("blocked"));
    });
  },
  // jedna operace nad jedním úložištěm; výsledek až po dokončení transakce (zápis je na disku)
  async run(store,mode,fn){
    const db=await this.open();
    return new Promise((res,rej)=>{
      const tx=db.transaction(store,mode),rq=fn(tx.objectStore(store));
      tx.oncomplete=()=>res(rq?rq.result:undefined);
      tx.onerror=()=>rej(Idb.err(tx.error));
      tx.onabort=()=>rej(Idb.err(tx.error));
    });
  },
  err(e){if(e&&e.name==="QuotaExceededError"){const x=new Error("Úložiště v telefonu je plné.");x.code="quota_exceeded";return x}return e||new Error("IndexedDB")},
  get(store,key){return this.run(store,"readonly",s=>s.get(key))},
  put(store,key,val){return this.run(store,"readwrite",s=>s.put(val,key))},
  del(store,key){return this.run(store,"readwrite",s=>s.delete(key))},
  async all(store){
    const db=await this.open();
    return new Promise((res,rej)=>{
      const out=[],tx=db.transaction(store,"readonly"),rq=tx.objectStore(store).openCursor();
      rq.onsuccess=()=>{const c=rq.result;if(c){out.push([c.key,c.value]);c.continue()}};
      tx.oncomplete=()=>res(out);
      tx.onerror=()=>rej(tx.error);
    });
  }
};

function IndexedDbBackend(){
  return {
    name:"indexeddb",
    async open(){if(!window.indexedDB)return false;try{await Idb.open();return true}catch(e){return false}},
    watch(onDoc,onReady,onErr){
      // IndexedDB je jen v tomto zařízení, nic jiného ho nemění: stačí načíst jednou při startu
      Idb.all("docs").then(rows=>{
        const months=[];
        for(const [path,data] of rows){
          if(path.startsWith("workouts/"))months.push(path.slice(9));
          if(path!=="state/active")onDoc(path,data);
        }
        onDoc("workouts/*",{present:months});
        onReady();
      },onErr);
    },
    set(path,data){return Idb.put("docs",path,data)},
    del(path){return Idb.del("docs",path)},
    async get(path){const d=await Idb.get("docs",path);return d===undefined?null:d}
  };
}

/* body obnovy v IndexedDB (dřív assets artefaktu) — stejné rozhraní, jaké používal kód zálohy */
const LocalPoints={
  async upload(blob){
    const data=await blob.text(),id="pt"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    try{await Idb.put("points",id,{id,at:Date.now(),data})}
    catch(e){const x=new Error(e.message);x.code=e.code==="quota_exceeded"?"quota_or_state":"write_failed";throw x}
    return {id,sizeBytes:blob.size};
  },
  delete(id){return Idb.del("points",id)},
  async read(id){const p=await Idb.get("points",id);if(!p)throw new Error("Bod obnovy už v telefonu není.");return p.data}
};

/* stažení souboru do telefonu (dřív downloads artefaktu) — Chrome ho uloží do složky Stažené */
const LocalDownloads={
  async save({filename,data}){
    const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
    const a=document.createElement("a");
    a.href=url;a.download=filename;a.style.display="none";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
};

const Store={
  backend:null, state:"connecting", Q:Local.get("queue",{}), flushing:false, onDoc:null, onChange:null,
  pending(){return Object.keys(this.Q).length},
  async init(backend,onDoc,onChange){
    this.onDoc=onDoc;this.onChange=onChange;
    const ok=await backend.open();
    if(!ok){this.state="off";onChange();return false}
    this.backend=backend;this.state="connecting";onChange();
    backend.watch(
      (path,data)=>{
        if(path==="workouts/*"){for(const mk of Object.keys(S.months)){const p="workouts/"+mk;if(!data.present.includes(mk)&&!(p in this.Q))onDoc(p,null)}return}
        if(path in this.Q)return; // lokální změna ještě čeká na odeslání
        onDoc(path,data);
      },
      ()=>{this.state="ok";onChange()},
      e=>{if(e&&e.code==="revoked"){this.state="off";onChange()}}
    );
    this.flush();
    return true;
  },
  put(path,data){
    this.Q[path]=data===null?null:JSON.parse(JSON.stringify(data));
    Local.set("queue",this.Q);this.onChange&&this.onChange();this.flush();
  },
  async flush(){
    const b=this.backend;if(!b||this.flushing)return;
    this.flushing=true;let failed=false;
    try{
      for(const p of Object.keys(this.Q)){
        const d=this.Q[p];
        try{
          if(d===null)await b.del(p);else await b.set(p,d);
          if(this.Q[p]===d)delete this.Q[p];
          Local.set("queue",this.Q);
        }catch(e){
          if(e&&(e.code==="invalid_argument"||e.code==="transform_error")){delete this.Q[p];Local.set("queue",this.Q);toast("Zápis se nepodařil: "+(e.message||e.code));}
          else if(e&&e.code==="quota_exceeded"){toast("Databáze je plná — smaž staré záznamy.");failed=true;break;}
          else{failed=true;break;}
        }
      }
    }finally{this.flushing=false;this.onChange&&this.onChange();}
    // chyba spojení: zkusit za 6 s; nové změny přidané během odesílání: odeslat hned
    if(this.pending()&&this.backend)setTimeout(()=>this.flush(),failed?6000:50);
  },
  // cache celé databáze v zařízení (rychlý start, offline)
  loadCache(){return Local.get("cache",null)},
  saveCache(snap){clearTimeout(this._ct);this._ct=setTimeout(()=>Local.set("cache",snap()),800)},
  // rozdělaný trénink
  loadActive(){return Local.get("active",null)},
  saveActive(draft){
    Local.set("active",draft);
    clearTimeout(this._at);
    this._at=setTimeout(()=>{if(this.backend)this.backend.set("state/active",{draft:draft?JSON.stringify(draft):""}).catch(()=>{})},2500);
  },
  async fetchActive(){if(!this.backend)return null;try{const a=await this.backend.get("state/active");return a&&a.draft?JSON.parse(a.draft):null}catch(e){return null}}
};

/* ---------- state ---------- */
const S={
  cfg:{gyms:[],defaultGymId:null,restSec:120},
  exLib:exLoad({}), exV:0, exLegacy:null, templates:{}, months:{}, body:{},
  bk:{last:null,points:[]}, // config/backup: datum poslední zálohy do souboru + body obnovy
  active:Store.loadActive(),
  editDraft:null,
  route:lsGet("route","train"),
  nav:[], // kam se vrátit ze stránky cviku / úpravy (F0-06), viz navBack
  exDetail:null, exPart:"info",
  exlQ:"", exlM:lsGet("exlM","all"), exlEq:lsGet("exlEq","all"), exlSort:lsGet("exlSort","last"), exlHid:false,
  histGym:"all", statsGym:"all", statsMetric:"count", statsRange:lsGet("statsRange","30d"), sumPeriod:"month", exSearch:"", exMuscle:"all",
  detailMetric:"e1rm", detailRange:"1y", detailGym:"all",
  bodyMetric:"weight", bodyRange:"all",
  selGym:null
};
let downloads=null, pointsApi=null;

(function loadCache(){
  const c=Store.loadCache();
  if(!c)return;
  S.cfg=c.cfg||S.cfg;S.exLib=exLoad(c.exLib,c.exV!==EX_V);S.templates=c.templates||{};S.months=c.months||{};S.body=c.body||{};if(c.bk)S.bk=c.bk;
})();
const snapshot=()=>({cfg:S.cfg,exLib:S.exLib,exV:EX_V,templates:S.templates,months:S.months,body:S.body,bk:S.bk});
function saveCache(){Store.saveCache(snapshot)}

function applyDoc(path,data){
  const [col,id]=path.split("/");
  if(col==="config"){
    if(id==="main")S.cfg=Object.assign({gyms:[],defaultGymId:null,restSec:120},data||{});
    else if(id==="exercises"){const items=(data&&data.items)||{};S.exV=data&&data.v||0;S.exLegacy=S.exV!==EX_V&&Object.keys(items).length?items:null;S.exLib=exLoad(items,S.exV!==EX_V,S.exV===EX_V)}
    else if(id==="templates")S.templates=(data&&data.items)||{};
    else if(id==="backup")S.bk=Object.assign({last:null,points:[]},data||{});
  }else if(col==="workouts"){
    if(data)S.months[id]=data.items||{};else delete S.months[id];
  }else if(col==="body"&&id==="all"){S.body=(data&&data.items)||{}}
  dirty();saveCache();
}
function put(path,data){applyDoc(path,data);Store.put(path,data)}
function updSync(){
  const el=document.getElementById("sync");if(!el)return;
  const n=Store.pending(),st=Store.state;
  el.className="sync"+(st==="off"?" off":n?" pending":"");
  el.innerHTML="<i></i>"+(st==="off"?"Jen v zařízení":n?"Ukládám…":st==="connecting"?"Připojuji":"Uloženo");
}
function saveActive(){Store.saveActive(S.active)}

/* ---------- utils ---------- */
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=p=>(p||"")+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const num=v=>{if(v===""||v==null)return NaN;const n=parseFloat(String(v).replace(",","."));return isFinite(n)?n:NaN};
const fmtKg=v=>{if(!isFinite(v))return "–";return (Math.round(v*100)/100).toLocaleString("cs-CZ",{maximumFractionDigits:2})};
const fmtInt=v=>Math.round(v).toLocaleString("cs-CZ");
const d2=n=>String(n).padStart(2,"0");
const fmtDate=t=>{const d=new Date(t);return d.getDate()+". "+(d.getMonth()+1)+". "+d.getFullYear()};
const fmtDateS=t=>{const d=new Date(t);return d.getDate()+". "+(d.getMonth()+1)+"."};
const fmtDay=t=>{const d=new Date(t);return ["ne","po","út","st","čt","pá","so"][d.getDay()]+" "+d.getDate()+". "+(d.getMonth()+1)+"."};
const fmtTime=t=>{const d=new Date(t);return d.getHours()+":"+d2(d.getMinutes())};
const fmtDur=ms=>{const m=Math.max(0,Math.round(ms/60000));return m>=60?Math.floor(m/60)+" h "+(m%60)+" min":m+" min"};
const fmtDurS=ms=>{const m=Math.max(0,Math.round(ms/60000));return m>=60?Math.floor(m/60)+":"+d2(m%60)+" h":m+" min"};
const fmtClock=s=>{s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+d2(s%60)};
const monthKey=t=>{const d=new Date(t);return d.getFullYear()+"-"+d2(d.getMonth()+1)};
const e1rm=(kg,r)=>(kg>0&&r>0&&r<=20)?(r===1?kg:kg*(1+r/30)):0;
const isWork=t=>t!=="w";
const exName=id=>(S.exLib[id]&&S.exLib[id].name)||id;
const gymName=id=>{const g=S.cfg.gyms.find(g=>g.id===id);return g?g.name:"Neznámé fitko"};
const gymIdx=id=>{const i=S.cfg.gyms.findIndex(g=>g.id===id);return i<0?0:i};
const gymColor=id=>"var(--s"+((gymIdx(id)%6)+1)+")";
const toDateInput=t=>{const d=new Date(t);return d.getFullYear()+"-"+d2(d.getMonth()+1)+"-"+d2(d.getDate())};
const toTimeInput=t=>{const d=new Date(t);return d2(d.getHours())+":"+d2(d.getMinutes())};


/* ---------- TYPY CVIKŮ ----------
   Určují, co se u série zapisuje a jak se počítá zátěž.
   wr     váha × opakování          zátěž = váha
   bw     vlastní váha              zátěž = tělesná hmotnost
   bwplus vlastní váha + zátěž      zátěž = hmotnost + přidané kg
   assist s dopomocí                zátěž = hmotnost − dopomoc
   time   na čas                    bez objemu, rekord nejdelší výdrž
   timew  na čas se zátěží          bez objemu, rekord nejdelší výdrž
   dist   vzdálenost a čas          rekordy vzdálenost, čas a tempo         */
const KIND={
  wr:{l:"Váha a opakování",f:["kg","reps"],ex:"Bench press, bicepsový zdvih"},
  bw:{l:"Vlastní váha",f:["reps"],ex:"Shyby, kliky, sedy-lehy"},
  bwplus:{l:"Vlastní váha se zátěží",f:["plus","reps"],ex:"Shyby a kliky na bradlech se zátěží"},
  assist:{l:"S dopomocí",f:["minus","reps"],ex:"Shyby a kliky s dopomocí stroje"},
  time:{l:"Na čas",f:["sec"],ex:"Plank, výdrž, vis"},
  timew:{l:"Na čas se zátěží",f:["kg","sec"],ex:"Plank se zátěží, farmářská chůze"},
  dist:{l:"Vzdálenost a čas",f:["km","sec"],ex:"Běh, veslovací trenažér"}
};
const KIND_ORDER=["wr","bw","bwplus","assist","time","timew","dist"];
const FLD={kg:{lab:"kg",mode:"decimal"},plus:{lab:"+kg",mode:"decimal"},minus:{lab:"−kg",mode:"decimal"},reps:{lab:"Opak.",mode:"numeric"},sec:{lab:"Čas",mode:"numeric"},km:{lab:"km",mode:"decimal"}};
const kindOf=id=>{const e=S.exLib[id];return (e&&KIND[e.kind])?e.kind:"wr"};
const kFields=k=>KIND[k].f;
const hasReps=k=>KIND[k].f.includes("reps");
const isTimed=k=>KIND[k].f.includes("sec");
const usesKg=k=>KIND[k].f.some(f=>f==="kg"||f==="plus"||f==="minus");
/* tělesná hmotnost k datu: nejbližší dřívější měření, jinak hodnota z nastavení */
function bodyWeightAt(t){
  const xs=Object.values(S.body||{}).filter(b=>isFinite(+b.weight)&&+b.weight>0).sort((a,b)=>a.date-b.date);
  if(!xs.length)return +S.cfg.bodyWeight||80;
  let best=xs[0];
  for(const x of xs){if(x.date<=t)best=x;else break}
  return +best.weight;
}
function setLoad(kind,s,t){
  const kg=+s.kg||0;
  if(kind==="wr"||kind==="timew")return kg;
  if(kind==="bw")return bodyWeightAt(t);
  if(kind==="bwplus")return bodyWeightAt(t)+kg;
  if(kind==="assist")return Math.max(0,bodyWeightAt(t)-kg);
  return 0;
}
const setVol=(kind,s,t)=>hasReps(kind)?setLoad(kind,s,t)*(+s.reps||0):0;
const fmtSec=v=>{v=Math.max(0,Math.round(v));const h=Math.floor(v/3600);return h?h+":"+d2(Math.floor(v%3600/60))+":"+d2(v%60):Math.floor(v/60)+":"+d2(v%60)};
const parseSec=v=>{
  if(v==null||v==="")return NaN;
  v=String(v).trim().replace(",",":");
  if(/^\d+$/.test(v))return +v;
  const p=v.split(":").map(x=>+x);
  if(p.some(x=>!isFinite(x)))return NaN;
  return p.length>=3?p[0]*3600+p[1]*60+(p[2]||0):p[0]*60+(p[1]||0);
};
const fmtPace=(sec,km)=>km>0?fmtSec(sec/km)+" /km":"–";
/* zápis jedné série textem */
function setStr(kind,s){
  if(kind==="time")return fmtSec(s.sec||0);
  if(kind==="timew")return (s.kg?fmtKg(s.kg)+" kg · ":"")+fmtSec(s.sec||0);
  if(kind==="dist")return (s.km?fmtKg(s.km)+" km · ":"")+fmtSec(s.sec||0);
  if(kind==="bw")return (s.reps||0)+"×";
  if(kind==="bwplus")return (s.kg?"+"+fmtKg(s.kg)+" × ":"")+(s.reps||0);
  if(kind==="assist")return (s.kg?"−"+fmtKg(s.kg)+" × ":"")+(s.reps||0);
  return (s.kg?fmtKg(s.kg)+"×":"")+(s.reps||0);
}

/* ---------- derived data ---------- */
let D=null;
function dirty(){D=null;scheduleRender();}
function derive(){
  if(D)return D;
  const all=[];
  for(const mk in S.months){const items=S.months[mk];for(const id in items){all.push(Object.assign({id,mk},items[id]))}}
  all.sort((a,b)=>b.start-a.start);
  const byEx={};
  for(const w of all){
    for(const e of (w.ex||[])){
      const kind=kindOf(e.exId);
      let vol=0,maxKg=0,best=0,bestSet=null,maxReps=0,nWork=0,maxSec=0,totSec=0,maxKm=0,totKm=0,speed=0;
      for(const s of e.sets){
        if(!isWork(s.t))continue;
        nWork++;
        if(hasReps(kind)){
          const L=setLoad(kind,s,w.start),reps=+s.reps||0;
          vol+=L*reps;
          if(L>maxKg)maxKg=L;
          if(reps>maxReps)maxReps=reps;
          const r=e1rm(L,reps);if(r>best){best=r;bestSet=Object.assign({},s,{load:L})}
        }
        if(isTimed(kind)){const sec=+s.sec||0;totSec+=sec;if(sec>maxSec)maxSec=sec}
        if(kind==="dist"){const km=+s.km||0,sec=+s.sec||0;totKm+=km;if(km>maxKm)maxKm=km;const v=sec>0?km/(sec/3600):0;if(v>speed)speed=v}
      }
      (byEx[e.exId]=byEx[e.exId]||[]).push({w,e,kind,vol,maxKg,best,bestSet,maxReps,nWork,maxSec,totSec,maxKm,totKm,speed});
    }
  }
  D={all,byEx};
  return D;
}
function exCtxGym(exId,gymId){const ex=S.exLib[exId];return ex&&ex.gymDep?gymId:null}
function lastSession(exId,gymId,excludeId){
  const list=derive().byEx[exId]||[];
  const g=exCtxGym(exId,gymId);
  for(const s of list){if(s.w.id===excludeId)continue;if(g&&s.w.gymId!==g)continue;return s}
  return null;
}
function setsStr(sets,onlyWork,kind){
  kind=kind||"wr";
  return sets.filter(s=>!onlyWork||isWork(s.t)).map(s=>setStr(kind,s)).join(" · ");
}


/* ---------- REKORDY ----------
   Počítají se chronologicky z celé historie (zpětně i pro importovaná data).
   Kontext: cvik vázaný na fitko -> zvlášť pro každé fitko, jinak globálně.
   První trénink s cvikem v kontextu (a první výskyt daného typu) rekord nezakládá.
   Typy: maxKg (max. váha), e1rm (odh. 1RM), bestSet (kg × opak. nejvyšší součin),
         vol (objem cviku v tréninku), reps (max. opakování bez zátěže u cviků s vlastní vahou). */
const REC={maxKg:"Max. zátěž",e1rm:"Odh. 1RM",bestSet:"Nejlepší série",vol:"Objem cviku",reps:"Max. opakování",maxSec:"Nejdelší výdrž",totSec:"Celkový čas",maxKm:"Nejdelší vzdálenost",totKm:"Vzdálenost v tréninku",speed:"Nejvyšší tempo"};
const recLow=t=>t==="e1rm"?"odh. 1RM":REC[t].toLowerCase();
const REC_ORDER=["maxKg","e1rm","bestSet","vol","reps","maxSec","totSec","maxKm","totKm","speed"];
const EPS=1e-6;
function recCtx(exId,gymId){const e=S.exLib[exId];return exId+"|"+(e&&e.gymDep?gymId:"*")}
function recFmt(type,v,set){
  if(type==="reps")return fmtInt(v)+" opak.";
  if(type==="bestSet"&&set)return fmtKg(set.load!=null?set.load:set.kg)+" kg × "+set.reps;
  if(type==="e1rm")return fmtKg(Math.round(v*10)/10)+" kg";
  if(type==="vol")return fmtInt(v)+" kg";
  if(type==="maxSec"||type==="totSec")return fmtSec(v);
  if(type==="maxKm"||type==="totKm")return fmtKg(v)+" km";
  if(type==="speed")return fmtKg(Math.round(v*10)/10)+" km/h";
  return fmtKg(v)+" kg";
}
// metriky jedné sady sérií (jen pracovní). Vrací {type:{v,set,j}}
function exMetrics(exId,sets,t){
  const kind=kindOf(exId);
  const m={};let vol=0,totSec=0,totKm=0,any=false;
  sets.forEach((s,j)=>{
    if(!isWork(s.t))return;
    if(hasReps(kind)){
      const reps=+s.reps||0;if(reps<=0)return;any=true;
      const L=setLoad(kind,s,t);
      if(L>0){
        vol+=L*reps;
        if(!m.maxKg||L>m.maxKg.v+EPS||(Math.abs(L-m.maxKg.v)<EPS&&reps>m.maxKg.set.reps))m.maxKg={v:L,set:Object.assign({},s,{load:L}),j};
        const r=e1rm(L,reps);if(r>0&&(!m.e1rm||r>m.e1rm.v+EPS))m.e1rm={v:r,set:Object.assign({},s,{load:L}),j};
        const p=L*reps;if(!m.bestSet||p>m.bestSet.v+EPS)m.bestSet={v:p,set:Object.assign({},s,{load:L}),j};
      }
      if(kind==="bw"||kind==="assist"||kind==="bwplus"){if(!m.reps||reps>m.reps.v)m.reps={v:reps,set:s,j}}
    }
    if(isTimed(kind)){
      const sec=+s.sec||0;if(sec<=0)return;any=true;totSec+=sec;
      if(!m.maxSec||sec>m.maxSec.v+EPS)m.maxSec={v:sec,set:s,j};
    }
    if(kind==="dist"){
      const km=+s.km||0,sec=+s.sec||0;if(km<=0)return;any=true;totKm+=km;
      if(!m.maxKm||km>m.maxKm.v+EPS)m.maxKm={v:km,set:s,j};
      const v=sec>0?km/(sec/3600):0;
      if(v>0&&(!m.speed||v>m.speed.v+EPS))m.speed={v,set:s,j};
    }
  });
  if(vol>0)m.vol={v:vol};
  if(totSec>0&&kind!=="dist")m.totSec={v:totSec};
  if(totKm>0)m.totKm={v:totKm};
  return any?m:null;
}
function computeRecords(){
  const best={};   // ctx -> {type:{v,set,w}}
  const seen={};   // ctx -> true po prvním tréninku
  const byW={};    // workoutId -> [{exId,type,v,prev,set}]
  const byEx={};   // exId -> [{w,type,v,prev,set,ctx}]
  const list=derive().all.slice().reverse();
  for(const w of list){
    // sloučit případné duplicitní cviky v tréninku
    const grouped={};
    for(const e of w.ex||[])(grouped[e.exId]=grouped[e.exId]||[]).push(...e.sets);
    for(const exId in grouped){
      const m=exMetrics(exId,grouped[exId],w.start);if(!m)continue;
      const ctx=recCtx(exId,w.gymId);
      const b=best[ctx]||(best[ctx]={});
      const first=!seen[ctx];seen[ctx]=true;
      for(const type in m){
        const cur=m[type],prev=b[type];
        if(!prev){b[type]={v:cur.v,set:cur.set,w};continue}
        if(cur.v>prev.v+EPS){
          if(!first){
            const r={exId,type,v:cur.v,prev:prev.v,set:cur.set,prevSet:prev.set,ctx,gymId:w.gymId};
            (byW[w.id]=byW[w.id]||[]).push(r);
            (byEx[exId]=byEx[exId]||[]).push(Object.assign({w},r));
          }
          b[type]={v:cur.v,set:cur.set,w};
        }
      }
    }
  }
  return {best,byW,byEx};
}
function recs(){const d=derive();if(!d.rec)d.rec=computeRecords();return d.rec}
function wRecs(w){return recs().byW[w.id]||[]}
// živé medaile pro rozdělaný trénink: vrací {j:[types]} pro cvik i a seznam typů cviku
function liveRecords(d,i){
  const e=d.ex[i];
  const kind=kindOf(e.exId);
  const b=recs().best[recCtx(e.exId,d.gymId)];
  const out={sets:{},ex:[]};
  if(!b)return out;                        // první trénink s cvikem v tomto kontextu
  const conv=s=>({t:s.t,kg:num(s.kg)||0,reps:num(s.reps)||0,sec:parseSec(s.sec)||0,km:num(s.km)||0});
  const done=e.sets.map(s=>s.done?conv(s):{t:"w"});
  const extra=[];d.ex.forEach((x,k)=>{if(k!==i&&x.exId===e.exId)for(const s of x.sets)if(s.done)extra.push(conv(s))});
  const m=exMetrics(e.exId,done.concat(extra),d.start);if(!m)return out;
  for(const type in m){
    const prev=b[type];if(!prev||!(m[type].v>prev.v+EPS))continue;
    out.ex.push(type);
    if(m[type].j!=null&&m[type].j<done.length)(out.sets[m[type].j]=out.sets[m[type].j]||[]).push(type);
  }
  return out;
}
function recListHtml(list,withEx){
  if(!list.length)return "";
  return '<div class="reclist">'+list.map(r=>'<div class="rec"><span class="md">🏅</span><div class="grow">'+(withEx?'<b>'+esc(exName(r.exId))+'</b> · ':'')+esc(REC[r.type])+': <b>'+esc(recFmt(r.type,r.v,r.set))+'</b><span class="muted"> (dříve '+esc(recFmt(r.type,r.prev,r.prevSet))+')</span></div></div>').join("")+'</div>';
}
const plural=(n,a,b,c)=>n===1?a:(n>=2&&n<=4?b:c);

/* ---------- rendering ---------- */
const CK={};                       // posun posuvných nabídek podle klíče
function saveChipScroll(root){(root||document).querySelectorAll("[data-ck]").forEach(el=>{CK[el.dataset.ck]=el.scrollLeft})}
function restoreChipScroll(root){
  (root||document).querySelectorAll("[data-ck]").forEach(el=>{
    const v=CK[el.dataset.ck];if(v!=null)el.scrollLeft=v;
    const cur=el.querySelector('[aria-pressed="true"]');if(!cur)return;
    const l=cur.offsetLeft,r=l+cur.offsetWidth;
    if(l<el.scrollLeft+4||r>el.scrollLeft+el.clientWidth-4)el.scrollLeft=Math.max(0,l-(el.clientWidth-cur.offsetWidth)/2);
  });
}
let rq=false;
function scheduleRender(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;render()})}
function toast(msg){const r=document.getElementById("toastRoot");r.innerHTML='<div class="toast" role="status">'+esc(msg)+'</div>';clearTimeout(toast.t);toast.t=setTimeout(()=>r.innerHTML="",2600)}

function renderTabs(){
  const t=[["train","Trénink"],["hist","Historie"],["ex","Cviky"],["stats","Statistiky"],["body","Tělo"],["set","Nastavení"]];
  // stránka cviku patří pod Statistiky, jen když se na ni přišlo odtamtud, jinak pod Cviky
  const cur=S.route==="exd"?(S.prevRoute==="stats"?"stats":"ex"):S.route;
  document.getElementById("tabs").innerHTML=t.map(([k,l])=>'<button data-act="tab" data-v="'+k+'" aria-current="'+(cur===k)+'">'+IC[k]+(k==="train"&&S.active&&S.route!=="train"?'<span class="dot"></span>':'')+l+'</button>').join("");
}
function topbar(title,sub,left,subCls){
  return '<header class="top">'+(left||"")+'<h1'+(String(title).length>18?' class="long"':'')+'>'+esc(title)+(sub?'<small'+(subCls?' class="'+subCls+'"':'')+'>'+esc(sub)+'</small>':'')+'</h1><span class="sync" id="sync"></span></header>';
}
function render(){
  const app=document.getElementById("app");
  const y=window.scrollY;
  let h="";
  try{
    if(S.route==="edit"&&S.editDraft)h=vEditor(S.editDraft);
    else if(S.route==="train")h=S.active?vEditor(S.active):vHome();
    else if(S.route==="hist")h=vHist();
    else if(S.route==="ex")h=vExList();
    else if(S.route==="stats")h=vStats();
    else if(S.route==="exd")h=vExDetail();
    else if(S.route==="body")h=vBody();
    else if(S.route==="set")h=vSettings();
    else{S.route="train";h=vHome()}
  }catch(err){console.error(err);h=topbar("Chyba")+'<div class="banner">'+esc(err.message)+'</div>'}
  const focusId=document.activeElement&&document.activeElement.id;
  app.innerHTML=h;
  renderTabs();updSync();drawCharts();renderRest();restoreChipScroll(app);
  if(focusId){const f=document.getElementById(focusId);if(f&&f.tagName==="INPUT"&&f.type!=="checkbox"){f.focus();try{const l=f.value.length;f.setSelectionRange(l,l)}catch(e){}}}
  if(render.keepScroll)window.scrollTo(0,y);
  if(render.restoreY!=null){window.scrollTo(0,render.restoreY);render.restoreY=null}
  render.keepScroll=true;
  navEnsure();
}
function go(route){if(route!=="exd"&&route!=="edit")S.nav=[];S.route=route;const base=r=>r==="edit"||r==="exd"?"train":r;lsSet("route",route==="exd"?base(S.prevRoute||"ex"):base(route));render.keepScroll=false;scheduleRender();window.scrollTo(0,0)}

/* ---------- HOME ---------- */
function curGym(){return S.selGym||S.cfg.defaultGymId||(S.cfg.gyms[0]&&S.cfg.gyms[0].id)||null}
function vHome(){
  const {all}=derive();
  const now=Date.now();
  const w30=all.filter(w=>w.start>now-30*DAY);
  const weekStart=startOfWeek(now);
  const thisWeek=all.filter(w=>w.start>=weekStart).length;
  const vol30=w30.reduce((a,w)=>a+wVol(w),0);
  let h=topbar("Workout deník",new Date().toLocaleDateString("cs-CZ",{weekday:"long",day:"numeric",month:"long"}));
  if(Store.state==="off")h+='<div class="banner">Úložiště v prohlížeči teď není dostupné. Záznamy se drží v telefonu a uloží se, až bude znovu dostupné.</div>';
  h+=backupBanner();
  h+='<div class="kpis"><div class="kpi"><b>'+thisWeek+'</b><span>Tento týden</span></div><div class="kpi"><b>'+w30.length+'</b><span>Za 30 dní</span></div><div class="kpi"><b>'+(vol30>=1000?fmtKg(Math.round(vol30/100)/10)+" t":fmtInt(vol30)+" kg")+'</b><span>Objem 30 dní</span></div></div>';
  h+='<section class="sec"><div class="sec-h"><h2>Kde dnes cvičíš</h2></div><div class="chips" data-ck="selGym">'+S.cfg.gyms.map(g=>'<button class="chip" data-act="selGym" data-v="'+g.id+'" aria-pressed="'+(curGym()===g.id)+'"><span class="sw" style="background:'+gymColor(g.id)+'"></span>'+esc(g.name)+'</button>').join("")+'</div></section>';
  h+='<section class="sec startbar"><button class="btn primary block" data-act="startEmpty">'+IC.plus.replace('<svg','<svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2.4"')+' Začít prázdný trénink</button></section>';
  const tpls=Object.entries(S.templates).sort((a,b)=>(a[1].order||0)-(b[1].order||0)||a[1].name.localeCompare(b[1].name));
  h+='<section class="sec"><div class="sec-h"><h2>Šablony</h2><button class="btn sm" data-act="newTpl">+ Nová šablona</button></div><div class="stack">';
  if(!tpls.length)h+='<div class="empty">Zatím žádné šablony. Vytvoř si třeba Push / Pull / Legs.</div>';
  for(const [id,t] of tpls){
    const last=all.find(w=>w.tplId===id||w.title===t.name);
    h+='<div class="card tpl"><div class="grow"><h3>'+esc(t.name)+'</h3><p>'+esc((t.items||[]).map(i=>exName(i.exId)).join(", "))+'</p><p class="xs">'+(t.items||[]).length+' cviků'+(last?' · naposledy '+fmtDateS(last.start)+' ('+esc(gymName(last.gymId))+')':'')+'</p></div><div class="stack" style="gap:6px"><button class="btn sm primary" data-act="startTpl" data-v="'+id+'">Začít</button><button class="btn sm" data-act="editTpl" data-v="'+id+'">Upravit</button></div></div>';
  }
  h+='</div></section>';
  return h;
}
function startOfWeek(t){const d=new Date(t);d.setHours(0,0,0,0);const wd=(d.getDay()+6)%7;return d.getTime()-wd*DAY}
function wVol(w){let v=0;for(const e of w.ex||[]){const k=kindOf(e.exId);for(const s of e.sets)if(isWork(s.t))v+=setVol(k,s,w.start)}return v}
function wSets(w){let n=0;for(const e of w.ex||[])for(const s of e.sets)if(isWork(s.t))n++;return n}

/* ---------- EDITOR (active / edit past / template) ---------- */
function newSetFrom(s){return {t:s?s.t:"n",kg:s&&s.kg?String(s.kg):"",reps:s&&s.reps?String(s.reps):"",sec:s&&s.sec?(typeof s.sec==="string"?s.sec:fmtSec(s.sec)):"",km:s&&s.km?String(s.km):"",done:false}}
function exEntryFor(exId,gymId,fromTplSets){
  const last=lastSession(exId,gymId);
  let sets;
  if(fromTplSets&&fromTplSets.length)sets=fromTplSets.map(newSetFrom);
  else if(last)sets=last.e.sets.map(newSetFrom);
  else sets=[newSetFrom(null),newSetFrom(null),newSetFrom(null)];
  return {k:uid("e"),exId,note:"",sets};
}
function startWorkout(tplId){
  const gymId=curGym();
  const t=tplId&&S.templates[tplId];
  const d={mode:"active",id:null,title:t?t.name:defaultTitle(),gymId,start:Date.now(),tplId:tplId||null,ex:[]};
  if(t)for(const it of t.items||[])d.ex.push(exEntryFor(it.exId,gymId,it.sets));
  S.active=d;saveActive();S.restEnd=null;go("train");
}
function defaultTitle(){const h=new Date().getHours();return h<11?"Ranní trénink":h<17?"Odpolední trénink":"Večerní trénink"}
const END_PAD=3*60000; // pár minut po poslední sérii
function lastSetAt(d){let t=0;for(const e of d.ex)for(const s of e.sets)if(s.done&&s.at>t)t=s.at;return t||null}
function suggestEnd(d){const t=lastSetAt(d);const now=Date.now();return t?Math.min(now,t+END_PAD):now}
function finEndValue(d){const el=document.getElementById("fin-end");if(!el||!el.value)return null;const [h,m]=el.value.split(":").map(Number);const x=new Date(d.start);x.setHours(h,m,0,0);let t=x.getTime();if(t<d.start-60000)t+=DAY;return t}
function finInfo(d,end,lastAt){return 'Délka <b>'+fmtDur(end-d.start)+'</b>'+(lastAt?' · poslední série v '+fmtTime(lastAt)+', navrženo +3 min':' · bez časů sérií, navržen aktuální čas')}
function durLabel(w){const dur=fmtDur((w.end||w.start)-w.start);return w.endOrig?'<span title="Délka upravena ručně, původně '+fmtDur(w.endOrig-w.start)+'">'+dur+' <span class="edited">✎ upraveno</span></span>':'<span>'+dur+'</span>'}
function curDraft(){return S.route==="edit"?S.editDraft:S.active}
function touchDraft(){const d=curDraft();if(d&&d.mode==="active")saveActive();}

function vEditor(d){
  const mode=d.mode;
  let h="";
  const left=mode==="active"?"":'<button class="iconbtn" data-act="edCancel" aria-label="Zpět">'+IC.back+'</button>';
  const heading=mode==="template"?(d.id?"Úprava šablony":"Nová šablona"):mode==="edit"?"Úprava tréninku":"Probíhá trénink";
  h+=topbar(heading,mode==="active"?"Začátek "+fmtTime(d.start):"",left);
  let vol=0,done=0;
  for(const e of d.ex){const k=kindOf(e.exId);for(const s of e.sets){if(mode==="active"&&!s.done)continue;if(!isWork(s.t))continue;done++;vol+=setVol(k,{kg:num(s.kg)||0,reps:num(s.reps)||0},d.start)}}
  h+='<div class="ed-head"><input class="ed-title" id="ed-title" data-f="title" value="'+esc(d.title)+'" aria-label="Název" placeholder="Název">';
  if(mode!=="template"){
    h+='<div class="row wrap-r"><label class="f grow" style="min-width:150px">Fitko<select class="inp" id="ed-gym" data-f="gymId">'+S.cfg.gyms.map(g=>'<option value="'+g.id+'"'+(g.id===d.gymId?" selected":"")+'>'+esc(g.name)+'</option>').join("")+'</select></label>';
    if(mode==="edit")h+='<label class="f">Datum<input class="inp" type="date" id="ed-date" data-f="date" value="'+toDateInput(d.start)+'"></label><label class="f">Začátek<input class="inp" type="time" id="ed-time" data-f="time" value="'+toTimeInput(d.start)+'"></label><label class="f">Délka (min)<input class="inp" inputmode="numeric" id="ed-dur" data-f="dur" value="'+Math.round(((d.end||d.start)-d.start)/60000)+'" style="width:90px"></label>';
    h+='</div>';
    h+='<div class="ed-meta">'+(mode==="active"?'<div class="stat"><b data-elapsed>'+fmtClock((Date.now()-d.start)/1000)+'</b><span>Čas</span></div>':'')+'<div class="stat"><b>'+fmtInt(vol)+' kg</b><span>Objem</span></div><div class="stat"><b>'+done+'</b><span>'+(mode==="active"?"Hotové série":"Pracovní série")+'</span></div></div>';
  }
  h+='</div>';
  h+='<div class="stack" style="margin-top:12px">';
  d.ex.forEach((e,i)=>{h+=vExCard(d,e,i)});
  h+='</div>';
  h+='<div class="stack" style="margin-top:12px"><button class="btn block" data-act="addEx">+ Přidat cvik</button>';
  if(mode==="active")h+='<button class="btn primary block" data-act="finish">Dokončit trénink</button><button class="btn ghost danger block" data-act="discard">Zahodit trénink</button>';
  else if(mode==="edit")h+='<button class="btn primary block" data-act="saveEdit">Uložit změny</button><button class="btn ghost danger block" data-act="delWorkout">Smazat trénink</button>';
  else h+='<button class="btn primary block" data-act="saveTpl">Uložit šablonu</button>'+(d.id?'<button class="btn ghost danger block" data-act="delTpl">Smazat šablonu</button>':'');
  h+='</div>';
  return h;
}
function vExCard(d,e,i){
  const ex=S.exLib[e.exId]||{name:e.exId};
  const last=lastSession(e.exId,d.gymId,d.id);
  const mode=d.mode;
  const kind=kindOf(e.exId),flds=kFields(kind);
  const lr=mode==="active"?liveRecords(d,i):{sets:{},ex:[]};
  let h='<article class="exc" data-i="'+i+'"><div class="exc-h"><div class="grow"><h3><button data-act="openEx" data-v="'+esc(e.exId)+'">'+esc(ex.name)+'</button></h3>'+(ex.cz?'<div class="cz">'+esc(ex.cz)+'</div>':'');
  h+='<div class="row wrap-r" style="margin-top:4px;gap:6px">'+(ex.gymDep?'<span class="pill gd" title="Progres se počítá zvlášť pro každé fitko">vázáno na fitko</span>':'<span class="pill">univerzální</span>')+(kind!=="wr"?'<span class="pill">'+esc(KIND[kind].l.toLowerCase())+'</span>':'')+(lr.ex.length?'<span class="exmedal" title="'+esc(lr.ex.map(t=>REC[t]).join(", "))+'">🏅 '+esc(lr.ex.map(recLow).join(", "))+'</span>':'')+'</div></div><button class="iconbtn" data-act="exMenu" data-i="'+i+'" aria-label="Možnosti cviku">'+IC.more+'</button></div>';
  if(mode!=="template"){
    h+='<div class="exc-prev">'+(last?'Minule'+(ex.gymDep?' v '+esc(gymName(last.w.gymId)):'')+' ('+fmtDateS(last.w.start)+'): <span class="num">'+esc(setsStr(last.e.sets,true,kind))+'</span>':(ex.gymDep?'V tomto fitku zatím bez záznamu':'Zatím bez záznamu'))+'</div>';
  }
  if(e.note||e.showNote)h+='<textarea class="exc-note" id="note-'+e.k+'" data-f="note" data-i="'+i+'" rows="1" placeholder="Poznámka ke cviku">'+esc(e.note||"")+'</textarea>';
  h+='<table class="sets"><thead><tr><th class="c-type">Série</th>'+(mode!=="template"?'<th class="c-prev">Minule</th>':'')+flds.map(f=>'<th class="c-in">'+FLD[f].lab+'</th>').join("")+(mode==="active"?'<th class="c-ok"><span aria-label="Hotovo">✓</span></th>':'')+'<th class="c-x"></th></tr></thead><tbody>';
  let wn=0;
  const prevSets=last?last.e.sets:[];
  const fval=(s,f)=>f==="sec"?(s.sec||""):f==="km"?(s.km||""):f==="reps"?(s.reps||""):(s.kg||"");
  const phOf=(p,f)=>{if(!p)return "";if(f==="sec")return fmtSec(p.sec||0);if(f==="km")return String(p.km||"");if(f==="reps")return String(p.reps||"");return p.kg?fmtKg(p.kg).replace(/\s/g,""):""};
  e.sets.forEach((s,j)=>{
    const lbl=s.t==="w"?"W":s.t==="d"?"D":s.t==="f"?"F":String(++wn);
    const p=prevSets[j];
    h+='<tr class="'+(s.done?"done":"")+'"><td class="c-type"><button class="stype '+s.t+'" data-act="cycType" data-i="'+i+'" data-j="'+j+'" title="'+TYPE_NAME[s.t]+' — klepnutím změníš">'+lbl+(lr.sets[j]?'<span class="medal" title="'+esc(lr.sets[j].map(t=>REC[t]).join(", "))+'">🏅</span>':'')+'</button></td>';
    if(mode!=="template")h+='<td class="c-prev num">'+(p?esc(setStr(kind,p)):"–")+'</td>';
    for(const f of flds){
      const fld=f==="plus"||f==="minus"?"kg":f;
      h+='<td class="c-in"><input class="cell" id="in-'+e.k+'-'+j+'-'+f+'" inputmode="'+FLD[f].mode+'" data-f="'+fld+'" data-i="'+i+'" data-j="'+j+'" value="'+esc(fval(s,fld))+'" placeholder="'+esc(phOf(p,fld))+'" aria-label="'+FLD[f].lab+'"></td>';
    }
    if(mode==="active")h+='<td class="c-ok"><button class="okb" data-act="done" data-i="'+i+'" data-j="'+j+'" aria-pressed="'+!!s.done+'" aria-label="Série hotová">'+IC.check+'</button></td>';
    h+='<td class="c-x"><button class="xb" data-act="delSet" data-i="'+i+'" data-j="'+j+'" aria-label="Smazat sérii">×</button></td></tr>';
  });
  h+='</tbody></table><div class="exc-f"><button class="btn sm" data-act="addSet" data-i="'+i+'">+ Série</button><button class="btn sm" data-act="addWarm" data-i="'+i+'">+ Zahřívací</button></div></article>';
  return h;
}
function draftToWorkout(d,onlyDone){
  const ex=[];
  for(const e of d.ex){
    const kind=kindOf(e.exId),flds=kFields(kind);
    const sets=[];
    for(const s of e.sets){
      if(onlyDone&&!s.done)continue;
      const o={t:s.t};let any=false;
      if(flds.some(f=>f==="kg"||f==="plus"||f==="minus")){const kg=num(s.kg);o.kg=isFinite(kg)?kg:0;if(isFinite(kg))any=true}else o.kg=0;
      if(hasReps(kind)){const r=num(s.reps);o.reps=isFinite(r)?Math.round(r):0;if(isFinite(r))any=true}else o.reps=0;
      if(isTimed(kind)){const sec=parseSec(s.sec);if(isFinite(sec)&&sec>0){o.sec=Math.round(sec);any=true}}
      if(kind==="dist"){const km=num(s.km);if(isFinite(km)&&km>0){o.km=km;any=true}}
      if(!any)continue;
      if(s.rpe)o.rpe=s.rpe;if(s.at)o.at=s.at;
      sets.push(o);
    }
    if(sets.length){const o={exId:e.exId,sets};if(e.note)o.note=e.note;ex.push(o)}
  }
  return ex;
}
function saveWorkout(id,w,oldMk){
  const mk=monthKey(w.start);
  if(oldMk&&oldMk!==mk){const items=Object.assign({},S.months[oldMk]||{});delete items[id];put("workouts/"+oldMk,{items})}
  const items=Object.assign({},S.months[mk]||{});items[id]=w;put("workouts/"+mk,{items});
}
function workoutToDraft(w,mode){
  return {mode,id:w.id,mk:w.mk,title:w.title,gymId:w.gymId,start:w.start,end:w.end,endOrig:w.endOrig,tplId:w.tplId||null,note:w.note||"",
    ex:(w.ex||[]).map(e=>({k:uid("e"),exId:e.exId,note:e.note||"",sets:e.sets.map(s=>({t:s.t,kg:s.kg?String(s.kg):"",reps:s.reps?String(s.reps):"",sec:s.sec?fmtSec(s.sec):"",km:s.km?String(s.km):"",done:true,rpe:s.rpe,at:s.at}))}))};
}

/* ---------- HISTORY ---------- */
function gymChips(act,cur,withAll){
  return '<div class="chips" data-ck="'+act+'">'+(withAll?'<button class="chip" data-act="'+act+'" data-v="all" aria-pressed="'+(cur==="all")+'">Všechna fitka</button>':'')+S.cfg.gyms.map(g=>'<button class="chip" data-act="'+act+'" data-v="'+g.id+'" aria-pressed="'+(cur===g.id)+'"><span class="sw" style="background:'+gymColor(g.id)+'"></span>'+esc(g.name)+'</button>').join("")+'</div>';
}
function vHist(){
  const {all}=derive();
  const list=all.filter(w=>S.histGym==="all"||w.gymId===S.histGym);
  let h=topbar("Historie",list.length+" tréninků");
  h+=gymChips("histGym",S.histGym,true);
  if(!list.length)return h+'<div class="empty" style="margin-top:14px">Žádné tréninky.</div>';
  let curM="";const lim=S.histLimit||40;
  list.slice(0,lim).forEach(w=>{
    const d=new Date(w.start);const m=MONTHS_FULL[d.getMonth()]+" "+d.getFullYear();
    if(m!==curM){curM=m;h+='<div class="mhead">'+m+'</div>'}
    h+='<button class="hw" data-act="openW" data-v="'+esc(w.id)+'" data-m="'+w.mk+'" style="margin-bottom:8px"><div class="row"><h3 class="grow">'+esc(w.title)+(wRecs(w).length?' <span class="medals">🏅 '+wRecs(w).length+'</span>':'')+'</h3><span class="pill"><span class="sw" style="background:'+gymColor(w.gymId)+'"></span>'+esc(gymName(w.gymId))+'</span></div><div class="line num"><span>'+fmtDay(w.start)+' '+fmtTime(w.start)+'</span>'+durLabel(w)+'<span>'+fmtInt(wVol(w))+' kg</span><span>'+wSets(w)+' sérií</span></div><div class="exs">'+esc((w.ex||[]).map(e=>e.sets.length+"× "+exName(e.exId)).join(", "))+'</div></button>';
  });
  if(list.length>lim)h+='<button class="btn block" data-act="histMore">Zobrazit další</button>';
  return h;
}
function sheetWorkout(w,justSaved){
  let b='<div class="row wrap-r small muted num"><span class="pill"><span class="sw" style="background:'+gymColor(w.gymId)+'"></span>'+esc(gymName(w.gymId))+'</span><span>'+fmtDay(w.start)+' '+fmtTime(w.start)+'</span>'+durLabel(w)+'<span>'+fmtInt(wVol(w))+' kg</span></div>'+(w.endOrig?'<div class="xs muted">Délka upravena ručně: původně '+fmtDur(w.endOrig-w.start)+' (konec '+fmtTime(w.endOrig)+'), uloženo '+fmtDur(w.end-w.start)+' (konec '+fmtTime(w.end)+').</div>':'');
  const R=wRecs(w);
  if(justSaved||R.length)b+=R.length?'<div class="recbox"><h3>🏅 '+R.length+' '+plural(R.length,"rekord","rekordy","rekordů")+'</h3>'+recListHtml(R,true)+'</div>':'<div class="small muted">Tentokrát bez nového rekordu.</div>';
  for(const e of w.ex||[]){
    let wn=0;
    const er=R.filter(r=>r.exId===e.exId);
    b+='<div class="card"><div style="font-weight:700;color:var(--accent-2)"><button class="linkbtn" data-act="openEx" data-v="'+esc(e.exId)+'">'+esc(exName(e.exId))+'</button>'+(er.length?' <span class="medals">🏅 '+er.length+'</span>':'')+'</div>'+(e.note?'<div class="xs muted">'+esc(e.note)+'</div>':'')+'<div class="dset">'+(()=>{const k=kindOf(e.exId);return e.sets.map(s=>{const l=s.t==="w"?"W":s.t==="d"?"D":s.t==="f"?"F":++wn;const L=setLoad(k,s,w.start);const r=hasReps(k)&&L&&s.reps?e1rm(L,s.reps):0;return '<div><span class="lbl '+s.t+'">'+l+'</span><span>'+esc(setStr(k,s))+(s.rpe?' @'+s.rpe:'')+'</span>'+(isWork(s.t)&&r?'<span class="muted">1RM ≈ '+fmtKg(Math.round(r*10)/10)+'</span>':'')+'</div>'}).join("")})()+'</div></div>';
  }
  openSheet((justSaved?"Hotovo · ":"")+w.title,b,'<button class="btn grow" data-act="wToTpl" data-v="'+esc(w.id)+'" data-m="'+w.mk+'">Uložit jako šablonu</button><button class="btn primary grow" data-act="editW" data-v="'+esc(w.id)+'" data-m="'+w.mk+'">Upravit</button>');
}


/* ---------- STATS ---------- */
const RANGES=[["7d","7 dní",7],["30d","30 dní",30],["3m","3M",91],["6m","6M",182],["1y","Rok",365],["all","Vše",null]];
function rangeSince(k){const r=RANGES.find(x=>x[0]===k);return r&&r[2]?Date.now()-r[2]*DAY:-Infinity}
function rangeSeg(act,cur){return '<div class="seg seg-wide">'+RANGES.map(([k,l])=>'<button data-act="'+act+'" data-v="'+k+'" aria-pressed="'+(cur===k)+'">'+l+'</button>').join("")+'</div>'}
function filtW(g){return derive().all.filter(w=>g==="all"||w.gymId===g)}
const wDur=w=>Math.max(0,(w.end||w.start)-w.start);
function fmtVol(v){return v>=10000?fmtKg(Math.round(v/100)/10)+" t":fmtInt(v)+" kg"}
function fmtHours(ms){const h=ms/3600000;return h>=10?fmtInt(h)+" h":fmtDurS(ms)}
// souhrn za seznam tréninků
function summarize(ws){
  const s={n:ws.length,dur:0,vol:0,sets:0,recs:0,ex:{},gyms:{},mus:{}};
  for(const w of ws){
    s.dur+=wDur(w);s.vol+=wVol(w);s.sets+=wSets(w);s.recs+=wRecs(w).length;
    s.gyms[w.gymId]=(s.gyms[w.gymId]||0)+1;
    for(const e of w.ex||[]){
      const n=e.sets.filter(x=>isWork(x.t)).length;
      const r=s.ex[e.exId]||(s.ex[e.exId]={sets:0,n:0,vol:0});r.sets+=n;r.n++;
      {const k=kindOf(e.exId);for(const x of e.sets)if(isWork(x.t))r.vol+=setVol(k,x,w.start)}
      for(const k of exPri(exOf(e.exId)))s.mus[k]=(s.mus[k]||0)+n;
    }
  }
  for(const id in s.ex)s.ex[id].n=ws.filter(w=>(w.ex||[]).some(e=>e.exId===id)).length;
  return s;
}
function kpiGrid(s){
  return '<div class="kpis k6">'+
    '<div class="kpi"><b>'+s.n+'</b><span>Tréninky</span></div>'+
    '<div class="kpi"><b>'+fmtHours(s.dur)+'</b><span>Čas</span></div>'+
    '<div class="kpi"><b>'+fmtVol(s.vol)+'</b><span>Objem</span></div>'+
    '<div class="kpi"><b>'+fmtInt(s.sets)+'</b><span>Série</span></div>'+
    '<div class="kpi"><b>'+s.recs+'</b><span>Rekordy</span></div>'+
    '<div class="kpi"><b>'+(s.n?fmtDurS(s.dur/s.n):"–")+'</b><span>Ø délka</span></div></div>';
}
function hbarList(rows,stk){
  if(!rows.length)return '<div class="muted small">Nic.</div>';
  const mx=Math.max(...rows.map(r=>r.v))||1;
  return '<div class="hbars'+(stk?' stk':'')+'">'+rows.map(r=>'<div class="hbar"'+(r.act?' role="button" data-act="'+r.act+'" data-v="'+esc(r.id)+'"':'')+'><span class="hl" title="'+esc(r.label)+'">'+(r.sw?'<span class="sw" style="background:'+r.sw+'"></span>':'')+esc(r.label)+'</span><div class="t" style="width:'+Math.max(2,r.v/mx*100)+'%'+(r.sw?';background:'+r.sw:'')+'"></div><span class="v">'+esc(r.txt||String(r.v))+'</span></div>').join("")+'</div>';
}
function topExRows(s,n){
  return Object.entries(s.ex).sort((a,b)=>b[1].sets-a[1].sets||b[1].n-a[1].n).slice(0,n).map(([id,r])=>({id,act:"openEx",label:exName(id),v:r.sets,txt:r.n+"× · "+r.sets+" sérií"}));
}
function gymRows(s){
  return Object.entries(s.gyms).sort((a,b)=>b[1]-a[1]).map(([g,n])=>({label:gymName(g),v:n,sw:gymColor(g),txt:n+"× · "+Math.round(n/s.n*100)+" %"}));
}
function summaryBlock(s,withGyms){
  let h=kpiGrid(s);
  h+='<div class="subh">Nejčastější cviky</div>'+hbarList(topExRows(s,5),true);
  if(withGyms)h+='<div class="subh">Podle fitek</div>'+hbarList(gymRows(s));
  return h;
}
// kalendářní období
function calPeriods(){
  const now=new Date();const y=now.getFullYear(),m=now.getMonth();
  const lm=new Date(y,m-1,1),lmE=new Date(y,m,1);
  const hy=m>=6?{a:new Date(y,0,1),b:new Date(y,6,1),l:"Leden–červen "+y}:{a:new Date(y-1,6,1),b:new Date(y,0,1),l:"Červenec–prosinec "+(y-1)};
  return {
    month:{a:lm.getTime(),b:lmE.getTime(),l:MONTHS_FULL[lm.getMonth()].replace(/^./,c=>c.toUpperCase())+" "+lm.getFullYear(),short:"Minulý měsíc"},
    half:{a:hy.a.getTime(),b:hy.b.getTime(),l:hy.l,short:"Pololetí"},
    year:{a:new Date(y-1,0,1).getTime(),b:new Date(y,0,1).getTime(),l:"Rok "+(y-1),short:"Minulý rok"}
  };
}
function bucketsFor(range,ws){
  const now=Date.now();let unit,count,start;
  const sod=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
  const som=t=>{const d=new Date(t);return new Date(d.getFullYear(),d.getMonth(),1).getTime()};
  if(range==="7d"){unit="day";count=7;start=sod(now)-6*DAY}
  else if(range==="30d"){unit="week";count=5;start=startOfWeek(now)-4*7*DAY}
  else if(range==="3m"){unit="week";count=13;start=startOfWeek(now)-12*7*DAY}
  else if(range==="6m"){unit="week";count=26;start=startOfWeek(now)-25*7*DAY}
  else if(range==="1y"){unit="month";count=12;const d=new Date();start=new Date(d.getFullYear(),d.getMonth()-11,1).getTime()}
  else{unit="month";const first=ws.length?ws[ws.length-1].start:now;const a=new Date(first),b=new Date();count=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth()+1;start=som(first);if(count>36){unit="quarter";const qa=new Date(a.getFullYear(),Math.floor(a.getMonth()/3)*3,1);start=qa.getTime();count=Math.ceil(((b.getFullYear()-qa.getFullYear())*12+b.getMonth()-qa.getMonth()+1)/3)}}
  const B=[];
  for(let i=0;i<count;i++){
    let t;
    if(unit==="day")t=start+i*DAY;else if(unit==="week")t=start+i*7*DAY;
    else{const d=new Date(start);d.setMonth(d.getMonth()+i*(unit==="quarter"?3:1));t=d.getTime()}
    B.push({t,count:0,vol:0,sets:0,dur:0,unit});
  }
  const key=t=>{
    if(unit==="day")return sod(t);if(unit==="week")return startOfWeek(t);
    const d=new Date(t);return new Date(d.getFullYear(),unit==="quarter"?Math.floor(d.getMonth()/3)*3:d.getMonth(),1).getTime();
  };
  const idx={};B.forEach((b,i)=>idx[b.t]=i);
  for(const w of ws){const i=idx[key(w.start)];if(i==null)continue;const b=B[i];b.count++;b.vol+=wVol(w);b.sets+=wSets(w);b.dur+=wDur(w)/60000}
  const lab=b=>{const d=new Date(b.t);if(unit==="day")return ["ne","po","út","st","čt","pá","so"][d.getDay()];if(unit==="week")return fmtDateS(b.t);if(unit==="quarter")return "Q"+(Math.floor(d.getMonth()/3)+1)+" "+String(d.getFullYear()).slice(2);return MONTHS[d.getMonth()]+(d.getMonth()===0||count<=12?"":"")};
  const tipLab=b=>{const d=new Date(b.t);if(unit==="day")return fmtDay(b.t);if(unit==="week")return "týden od "+fmtDateS(b.t);if(unit==="quarter")return "Q"+(Math.floor(d.getMonth()/3)+1)+" "+d.getFullYear();return MONTHS_FULL[d.getMonth()]+" "+d.getFullYear()};
  const every=count<=13?1:count<=26?4:Math.ceil(count/8);
  return B.map((b,i)=>({x:b.t,label:(i%every===(count-1)%every)?lab(b):"",tip:tipLab(b),count:b.count,vol:b.vol,sets:b.sets,dur:b.dur}));
}
function vStats(){
  const g=S.statsGym,range=S.statsRange;
  const wsAll=filtW(g);
  const since=rangeSince(range);
  const ws=wsAll.filter(w=>w.start>=since);
  const s=summarize(ws);
  let h=topbar("Statistiky",g==="all"?"Všechna fitka":gymName(g));
  h+=gymChips("statsGym",g,true);
  h+='<section class="sec">'+rangeSeg("statsRange",range)+'<div style="margin-top:10px">'+kpiGrid(s)+'</div></section>';
  // graf
  const m=S.statsMetric;
  const lab={count:"Tréninky",sets:"Pracovní série",vol:"Objem (kg)",dur:"Čas (min)"};
  const bars=bucketsFor(range,ws.length?ws:wsAll);
  h+='<section class="sec"><div class="sec-h"><h2>Průběh</h2><div class="seg">'+Object.keys(lab).map(k=>'<button data-act="statsMetric" data-v="'+k+'" aria-pressed="'+(m===k)+'">'+({count:"Tréninky",sets:"Série",vol:"Objem",dur:"Čas"}[k])+'</button>').join("")+'</div></div><div class="card">'+chartPh({type:"bar",label:lab[m],unit:m==="vol"?" kg":m==="dur"?" min":"",bars:bars.map(b=>({x:b.x,label:b.label,tip:b.tip,v:b[m]}))},180)+'</div></section>';
  // partie
  const mv=Object.entries(s.mus).sort((a,b)=>b[1]-a[1]);
  const mx=mv.length?mv[0][1]:1;
  const heat=k=>{const v=s.mus[k]||0;if(!v)return "var(--m-idle)";const a=0.25+0.75*v/mx;return "color-mix(in srgb, var(--m-pri) "+Math.round(a*100)+"%, var(--m-idle))"};
  h+='<section class="sec"><div class="sec-h"><h2>Pracovní série podle partie</h2></div><div class="card">'+(mv.length?'<div class="figs sm">'+'<figure>'+MUSCLE_MAP.svg("front",heat,"Zepředu")+'<figcaption>Zepředu</figcaption></figure><figure>'+MUSCLE_MAP.svg("back",heat,"Zezadu")+'<figcaption>Zezadu</figcaption></figure></div>'+hbarList(mv.map(([k,v])=>({label:MUSCLE_MAP.NAMES[k],v}))):'<div class="muted small">V tomto období nic.</div>')+'<p class="xs muted" style="margin:8px 0 0">Počítá se hlavní partie cviku.</p></div></section>';
  h+='<section class="sec"><div class="sec-h"><h2>Nejčastější cviky</h2></div><div class="card">'+hbarList(topExRows(s,8),true)+'</div></section>';
  if(g==="all")h+='<section class="sec"><div class="sec-h"><h2>Podle fitek</h2></div><div class="card">'+hbarList(gymRows(s))+'</div></section>';
  // kalendářní souhrny
  const P=calPeriods();const pk=S.sumPeriod;const p=P[pk];
  const ps=summarize(wsAll.filter(w=>w.start>=p.a&&w.start<p.b));
  h+='<section class="sec"><div class="sec-h"><h2>Souhrn · '+esc(p.l)+'</h2></div><div class="seg seg-wide" style="margin-bottom:10px">'+Object.entries(P).map(([k,v])=>'<button data-act="sumPeriod" data-v="'+k+'" aria-pressed="'+(pk===k)+'">'+v.short+'</button>').join("")+'</div><div class="card">'+(ps.n?summaryBlock(ps,g==="all"):'<div class="muted small">V tomto období žádný trénink.</div>')+'</div></section>';
  // seznam cviků
  const {byEx}=derive();
  let rows=[];
  for(const id in byEx){
    const ss=byEx[id].filter(x=>(g==="all"||x.w.gymId===g));if(!ss.length)continue;
    const ex=exOf(id);
    if(S.exMuscle!=="all"&&exGroup(ex)!==S.exMuscle)continue;
    if(!exMatch(ex,S.exSearch))continue;
    let best=0;for(const x of ss)if(x.best>best)best=x.best;
    const inR=ss.filter(x=>x.w.start>=since).length;
    rows.push({id,ex,n:ss.length,inR,last:ss[0].w.start,best,gyms:new Set(ss.map(x=>x.w.gymId)).size});
  }
  rows.sort((a,b)=>b.last-a.last);
  h+='<section class="sec"><div class="sec-h"><h2>Cviky</h2><span class="xs muted">'+rows.length+'</span></div><input class="inp" id="exSearch" data-f="exSearch" placeholder="Hledat cvik (anglicky i česky)…" value="'+esc(S.exSearch)+'"><div class="chips" data-ck="exMuscle" style="margin-top:8px"><button class="chip" data-act="exMuscle" data-v="all" aria-pressed="'+(S.exMuscle==="all")+'">Vše</button>'+Object.entries(MUSCLES).filter(([k])=>k!=="other").map(([k,l])=>'<button class="chip" data-act="exMuscle" data-v="'+k+'" aria-pressed="'+(S.exMuscle===k)+'">'+l+'</button>').join("")+'</div><div class="stack" style="margin-top:10px;gap:6px">';
  for(const r of rows.slice(0,S.exLimit||60)){
    h+='<button class="exrow" data-act="openEx" data-v="'+esc(r.id)+'"><div class="grow"><div class="n">'+esc(r.ex.name)+'</div>'+(r.ex.cz?'<div class="cz">'+esc(r.ex.cz)+'</div>':'')+'<div class="m">'+esc(MUSCLES[exGroup(r.ex)]||"")+' · '+r.n+'×'+(range!=="all"?' ('+r.inR+'× v období)':'')+' · naposledy '+fmtDateS(r.last)+(r.ex.gymDep&&r.gyms>1&&g==="all"?' · '+r.gyms+' fitka':'')+'</div></div><div class="r">'+(r.best?fmtKg(Math.round(r.best))+'<small>odh. 1RM</small>':'–')+'</div></button>';
  }
  if(rows.length>(S.exLimit||60))h+='<button class="btn block" data-act="exMore">Další cviky</button>';
  h+='</div></section>';
  return h;
}

/* ---------- ZÁLOŽKA CVIKY (F0-05) ---------- */
function vExList(){
  const {byEx}=derive();
  const all=Object.entries(S.exLib);
  const nHid=all.filter(([,e])=>e.archived).length;
  if(!nHid)S.exlHid=false;
  const rows=all.filter(([,e])=>
    // skrytých je málo, filtry partie a vybavení se na ně nepoužijí (jen hledání)
    (S.exlHid?!!e.archived:!e.archived&&(S.exlM==="all"||exGroup(e)===S.exlM)&&(S.exlEq==="all"||e.equip===S.exlEq))&&
    exMatch(e,S.exlQ)).map(([id,e])=>{const l=byEx[id];return {id,e,n:l?l.length:0,last:l?l[0].w.start:0}});
  // Naposledy: cvičené nahoře od posledního, pod nimi ostatní podle abecedy; A–Z: všechny podle abecedy
  const az=(a,b)=>a.e.name.localeCompare(b.e.name,"cs");
  rows.sort(S.exlSort==="az"?az:(a,b)=>b.last-a.last||az(a,b));
  const lim=S.exlLimit||100;
  let h=topbar("Cviky",all.length+" "+plural(all.length,"cvik","cviky","cviků")+" v databázi");
  h+='<input class="inp" id="exlQ" data-f="exlQ" placeholder="Hledat cvik (anglicky i česky)…" value="'+esc(S.exlQ)+'" autocomplete="off">';
  h+='<div class="chips" data-ck="exlM" style="margin-top:8px"><button class="chip" data-act="exlM" data-v="all" aria-pressed="'+(S.exlM==="all")+'">Všechny partie</button>'+Object.entries(MUSCLES).filter(([k])=>k!=="other").map(([k,l])=>'<button class="chip" data-act="exlM" data-v="'+k+'" aria-pressed="'+(S.exlM===k)+'">'+l+'</button>').join("")+'</div>';
  h+='<div class="chips" data-ck="exlEq" style="margin-top:6px"><button class="chip" data-act="exlEq" data-v="all" aria-pressed="'+(S.exlEq==="all")+'">Všechno vybavení</button>'+Object.entries(EQUIP).map(([k,l])=>'<button class="chip" data-act="exlEq" data-v="'+k+'" aria-pressed="'+(S.exlEq===k)+'">'+l+'</button>').join("")+'</div>';
  h+='<div class="row wrap-r" style="margin-top:8px;gap:8px"><div class="seg">'+[["last","Naposledy"],["az","A–Z"]].map(([k,l])=>'<button data-act="exlSort" data-v="'+k+'" aria-pressed="'+(S.exlSort===k)+'">'+l+'</button>').join("")+'</div>'+(nHid?'<button class="chip" data-act="exlHid" aria-pressed="'+S.exlHid+'">Skryté ('+nHid+')</button>':'')+'<span class="grow"></span><button class="btn sm" data-act="exlNew">+ Nový cvik</button></div>';
  h+='<section class="sec"><div class="sec-h"><h2>'+(S.exlHid?"Skryté cviky":"Seznam")+'</h2><span class="xs muted">'+rows.length+'</span></div>';
  if(S.exlHid)h+='<p class="xs muted" style="margin:0 0 8px">Skryté cviky se nenabízejí při přidávání do tréninku. Historie i statistiky zůstávají. Vrátíš je přes Upravit → Zobrazit.</p>';
  if(!rows.length)h+='<div class="empty">Nic neodpovídá hledání nebo filtru.</div>';
  h+='<div class="stack" style="gap:6px">';
  for(const r of rows.slice(0,lim)){
    const e=r.e;
    h+='<button class="exrow" data-act="openEx" data-v="'+esc(r.id)+'"><div class="grow"><div class="n">'+esc(e.name)+(e.custom?' <span class="xs muted">(vlastní)</span>':'')+'</div>'+(e.cz?'<div class="cz">'+esc(e.cz)+'</div>':'')+'<div class="m">'+esc(exPri(e).map(k=>MUSCLE_MAP.NAMES[k]).join(", ")||MUSCLES[e.muscle]||"")+' · '+esc(EQUIP[e.equip]||"")+(r.n?' · '+r.n+'× · naposledy '+fmtDateS(r.last):'')+'</div></div></button>';
  }
  if(rows.length>lim)h+='<button class="btn block" data-act="exlMore">Další cviky ('+(rows.length-lim)+')</button>';
  h+='</div></section>';
  return h;
}

/* ---------- STRÁNKA CVIKU ---------- */
function vExDetail(){
  const id=S.exDetail;const ex=exOf(id);
  const list=(derive().byEx[id]||[]);
  let h=topbar(ex.name,ex.cz||"",'<button class="iconbtn" data-act="exBack" aria-label="Zpět">'+IC.back+'</button>',"czsub");
  h+='<div class="seg seg-wide" style="margin-bottom:10px">'+[["info","Popis"],["stats","Statistiky"+(list.length?" ("+list.length+"×)":"")]].map(([k,l])=>'<button data-act="exPart" data-v="'+k+'" aria-pressed="'+(S.exPart===k)+'">'+l+'</button>').join("")+'</div>';
  if(S.exPart!=="stats"){
  // popis
  h+='<div class="card exinfo">'+exFigures(ex)+exTags(ex)+(ex.desc?'<p class="desc">'+esc(ex.desc)+'</p>':'<p class="desc muted">Popis provedení zatím chybí.</p>')+
    '<div class="row wrap-r" style="justify-content:space-between"><a class="link" href="'+esc(exLink(ex))+'" target="_blank" rel="noopener">'+(ex.url?"Otevřít na Hevy ↗":"Hledat video ↗")+'</a><span class="xs muted">'+esc(EQUIP[ex.equip]||"")+'</span></div>'+
    '<div class="row wrap-r" style="margin-top:10px;gap:8px"><button class="btn sm" data-act="editExDetail" data-v="'+esc(id)+'">Upravit cvik</button></div></div>';
  h+='<div class="card" style="margin-top:10px"><label class="switch"><input type="checkbox" id="gymDepToggle" data-act="toggleGymDep" '+(ex.gymDep?"checked":"")+'><span><b>Vázáno na fitko</b><br><span class="xs muted">'+(ex.gymDep?"Každé fitko má vlastní progres, grafy i rekordy.":"Data ze všech fitek se sčítají dohromady.")+'</span></span></label></div>';
  if(ex.archived)h+='<div class="card small" style="margin-top:10px"><b>Skrytý cvik.</b> <span class="muted">Nenabízí se při přidávání do tréninku. Vrátíš ho přes Upravit cvik → Zobrazit.</span></div>';
  h+='<p class="small muted" style="margin-top:12px">'+(list.length?'Cvičeno '+list.length+'× · naposledy '+fmtDate(list[0].w.start)+' <button class="linkbtn" data-act="exPart" data-v="stats" style="color:var(--accent-2);font-weight:600">Statistiky →</button>':'S tímto cvikem zatím nemáš žádný záznam.')+'</p>';
  return h;
  }
  // statistiky
  if(!list.length)return h+'<div class="empty" style="margin-top:14px">S tímto cvikem zatím nemáš žádný záznam.</div>';
  h+='<p class="xs muted" style="margin:0 0 8px">'+(ex.gymDep?'Vázáno na fitko: počítá se zvlášť pro každé fitko.':'Nevázáno na fitko: data ze všech fitek se sčítají.')+' Změníš v Popisu.</p>';
  const gymsWith=[...new Set(list.map(s=>s.w.gymId))];
  if(ex.gymDep&&gymsWith.length>1){
    h+='<div class="sec"><div class="chips" data-ck="detailGym"><button class="chip" data-act="detailGym" data-v="all" aria-pressed="'+(S.detailGym==="all")+'">Všechna (zvlášť)</button>'+gymsWith.map(g=>'<button class="chip" data-act="detailGym" data-v="'+g+'" aria-pressed="'+(S.detailGym===g)+'"><span class="sw" style="background:'+gymColor(g)+'"></span>'+esc(gymName(g))+'</button>').join("")+'</div></div>';
  }
  const kind=kindOf(id);
  const bw=hasReps(kind)&&kind!=="wr";
  const M=isTimed(kind)&&kind!=="dist"?{sec:["Nejdelší výdrž","maxSec"," s"],tsec:["Čas celkem","totSec"," s"]}
    :kind==="dist"?{km:["Nejdelší","maxKm"," km"],tkm:["Vzdálenost","totKm"," km"],speed:["Tempo","speed"," km/h"]}
    :{e1rm:["Odh. 1RM","best"," kg"],max:["Max zátěž","maxKg"," kg"],vol:["Objem","vol"," kg"],reps:["Max opak.","maxReps",""]};
  if(!M[S.detailMetric])S.detailMetric="e1rm";
  const since=rangeSince(S.detailRange);
  let sel=list.filter(s=>s.w.start>=since&&s.nWork>0);
  if(ex.gymDep&&S.detailGym!=="all")sel=sel.filter(s=>s.w.gymId===S.detailGym);
  // souhrn za období
  let pv=0,ps=0;for(const s of sel){pv+=s.vol;ps+=s.nWork}
  const pr=(recs().byEx[id]||[]).filter(r=>r.w.start>=since&&(!ex.gymDep||S.detailGym==="all"||r.gymId===S.detailGym)).length;
  h+='<section class="sec">'+rangeSeg("detailRange",S.detailRange)+'<div class="kpis k4" style="margin-top:10px"><div class="kpi"><b>'+sel.length+'</b><span>Tréninky</span></div><div class="kpi"><b>'+ps+'</b><span>Série</span></div><div class="kpi"><b>'+fmtVol(pv)+'</b><span>Objem</span></div><div class="kpi"><b>'+pr+'</b><span>Rekordy</span></div></div></section>';
  const key=M[S.detailMetric][1];
  let series;
  if(ex.gymDep){
    const by={};for(const s of sel){(by[s.w.gymId]=by[s.w.gymId]||[]).push(s)}
    series=Object.keys(by).sort((a,b)=>gymIdx(a)-gymIdx(b)).map(g=>({name:gymName(g),color:gymColor(g),pts:by[g].map(s=>({x:s.w.start,y:s[key],s})).filter(p=>p.y>0).reverse()}));
  }else{
    series=[{name:"Všechna fitka",color:"var(--s1)",pts:sel.map(s=>({x:s.w.start,y:s[key],s})).filter(p=>p.y>0).reverse()}];
  }
  h+='<section class="sec"><div class="seg" style="margin-bottom:10px">'+Object.keys(M).map(k=>'<button data-act="detailMetric" data-v="'+k+'" aria-pressed="'+(S.detailMetric===k)+'">'+M[k][0]+'</button>').join("")+'</div>';
  h+='<div class="card">'+chartPh({type:"line",label:M[S.detailMetric][0],unit:M[S.detailMetric][2],series},200)+(series.length>1?'<div class="legend">'+series.map(s=>'<span><i style="background:'+s.color+'"></i>'+esc(s.name)+'</span>').join("")+'</div>':'')+'</div></section>';
  // rekordy
  const R=recs();
  const ctxs=ex.gymDep?gymsWith.map(g=>({g,name:gymName(g),b:R.best[id+"|"+g]})):[{g:null,name:"",b:R.best[id+"|*"]}];
  h+='<section class="sec"><div class="sec-h"><h2>Osobní rekordy</h2></div><div class="stack" style="gap:8px">';
  for(const c of ctxs){
    if(!c.b)continue;
    h+='<div class="card recgrid">'+(ex.gymDep?'<div class="rg-h"><span class="pill"><span class="sw" style="background:'+gymColor(c.g)+'"></span>'+esc(c.name)+'</span></div>':'')+REC_ORDER.filter(t=>c.b[t]).map(t=>{const r=c.b[t];
      const sub=(t==="e1rm"||t==="maxKg")?fmtKg(r.set.kg)+" × "+r.set.reps+" · ":t==="bestSet"?fmtInt(r.v)+" kg · ":"";
      return '<div class="rg-r"><span class="rg-l">'+REC[t]+'</span><b>'+esc(recFmt(t,r.v,r.set))+'</b><span class="rg-s">'+sub+fmtDate(r.w.start)+'</span></div>'}).join("")+'</div>';
  }
  h+='</div>';
  const rl=(R.byEx[id]||[]).slice().reverse().slice(0,8);
  if(rl.length)h+='<div class="card" style="margin-top:8px"><div class="subh" style="margin-top:0">Poslední rekordy</div>'+rl.map(r=>'<div class="rec"><span class="md">🏅</span><div class="grow">'+esc(REC[r.type])+': <b>'+esc(recFmt(r.type,r.v,r.set))+'</b> <span class="muted">· '+fmtDate(r.w.start)+(ex.gymDep?' · '+esc(gymName(r.gymId)):'')+'</span></div></div>').join("")+'</div>';
  h+='<p class="xs muted">Odhad 1RM podle Epleyho: váha × (1 + opakování / 30). Zahřívací série se nepočítají. První trénink s cvikem'+(ex.gymDep?' v každém fitku':'')+' rekord nezakládá.'+(bw?' U tohoto typu se zátěž počítá z tvé tělesné hmotnosti ('+fmtKg(bodyWeightAt(Date.now()))+' kg).':'')+'</p></section>';
  // historie
  h+='<section class="sec"><div class="sec-h"><h2>Historie cviku</h2><span class="xs muted">'+list.length+'×</span></div><div class="stack" style="gap:6px">';
  for(const s of list.slice(0,S.exHistLimit||25)){
    const nr=wRecs(s.w).filter(r=>r.exId===id).length;
    h+='<div class="card" style="padding:10px 12px"><div class="row small"><b class="grow">'+fmtDay(s.w.start)+' '+new Date(s.w.start).getFullYear()+(nr?' <span class="medals">🏅'+(nr>1?'×'+nr:'')+'</span>':'')+'</b><span class="pill"><span class="sw" style="background:'+gymColor(s.w.gymId)+'"></span>'+esc(gymName(s.w.gymId))+'</span></div><div class="small num" style="margin-top:4px">'+s.e.sets.map(st=>'<span class="'+(st.t==="w"?"muted":"")+'">'+(st.t!=="n"?'<span class="lbl '+st.t+'" style="font-weight:700">'+st.t.toUpperCase()+'</span> ':'')+esc(setStr(s.kind,st))+'</span>').join(' · ')+'</div></div>';
  }
  if(list.length>(S.exHistLimit||25))h+='<button class="btn block" data-act="exHistMore">Starší</button>';
  h+='</div></section>';
  return h;
}

/* ---------- BODY ---------- */
const BODY_F=[["weight","Hmotnost","kg"],["fat","Tělesný tuk","%"],["fatMass","Hmotnost tuku","kg"],["muscleMass","Kosterní sval","kg"],["muscle","Kosterní sval","%"],["water","Tělesná voda","kg"],["bmr","Bazální metabolismus","kcal"],["bmi","BMI",""],["visceral","Viscerální tuk","úroveň"],["waist","Pas","cm"],["chest","Hrudník","cm"],["arm","Paže","cm"],["thigh","Stehno","cm"]];
function vBody(){
  const items=Object.entries(S.body).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>b.date-a.date);
  let h=topbar("Tělo",items.length?"Poslední měření "+fmtDate(items[0].date):"Hmotnost, složení, obvody");
  h+='<button class="btn primary block" data-act="addBody">+ Nové měření</button>';
  const m=S.bodyMetric;const f=BODY_F.find(x=>x[0]===m)||BODY_F[0];
  const since=rangeSince(S.bodyRange);
  const all=items.filter(i=>isFinite(+i[m])&&i[m]!==null&&i[m]!=="");
  // víc měření v jednom dni sloučím do denního průměru
  const byDay={};
  for(const i of all){if(i.date<since)continue;const d=new Date(i.date);d.setHours(12,0,0,0);const k=d.getTime();(byDay[k]=byDay[k]||[]).push(+i[m])}
  const pts=Object.keys(byDay).map(Number).sort((a,b)=>a-b).map(k=>({x:k,y:byDay[k].reduce((s,v)=>s+v,0)/byDay[k].length}));
  // klouzavý průměr: středové okno 7 dní
  const WIN=7*DAY;
  const avg=pts.map(p=>{
    let sum=0,n=0;
    for(const q of pts){if(Math.abs(q.x-p.x)<=WIN/2){sum+=q.y;n++}}
    return {x:p.x,y:sum/n,n};
  });
  const avgNow=avg.length?avg[avg.length-1].y:null;
  h+='<section class="sec"><div class="chips" data-ck="bodyMetric">'+BODY_F.map(([k,l,u])=>'<button class="chip" data-act="bodyMetric" data-v="'+k+'" aria-pressed="'+(m===k)+'">'+l+(u&&u!=="kg"&&u!=="cm"?' ('+u+')':u==="kg"&&(k==="fatMass"||k==="muscleMass"||k==="water")?' (kg)':'')+'</button>').join("")+'</div>';
  h+='<div style="margin-top:8px">'+rangeSeg("bodyRange",S.bodyRange)+'</div>';
  if(pts.length){
    const lastV=pts[pts.length-1].y,firstV=pts[0].y,diff=lastV-firstV;
    const unit=f[2]?" "+f[2]:"";
    const dAvg=avg.length>1?avg[avg.length-1].y-avg[0].y:0;
    h+='<div class="card" style="margin-top:10px"><div class="row" style="align-items:flex-end;margin-bottom:6px"><div class="grow"><div class="xs muted" style="text-transform:uppercase;letter-spacing:.06em;font-weight:600">'+esc(f[1])+'</div><div style="font-family:var(--display);font-size:34px;font-weight:600;line-height:1" class="num">'+fmtKg(lastV)+' <span style="font-size:18px">'+esc(f[2])+'</span></div>'+(avgNow!=null?'<div class="xs muted num">průměr 7 dní '+fmtKg(Math.round(avgNow*10)/10)+unit+'</div>':'')+'</div><div class="small muted num" style="text-align:right">'+(pts.length>1?(diff>0?"+":"")+fmtKg(Math.round(diff*10)/10)+unit+' od '+fmtDateS(pts[0].x)+'<div class="xs">průměr '+(dAvg>0?"+":"")+fmtKg(Math.round(dAvg*10)/10)+unit+'</div>':'')+'</div></div>'+
      chartPh({type:"line",label:f[1],unit:unit,series:[
        {name:"Měření",color:"var(--ink-3)",pts,noLine:true,dots:true},
        {name:"Klouzavý průměr 7 dní",color:"var(--s1)",pts:avg,noDots:true,w:2.4}
      ]},190)+
      '<div class="legend"><span><i style="background:var(--s1)"></i>Klouzavý průměr 7 dní</span><span><i style="background:var(--ink-3);height:7px;width:7px;border-radius:50%"></i>Jednotlivá měření</span></div>'+
      '<div class="xs muted" style="margin-top:6px">'+pts.length+' '+plural(pts.length,"den s měřením","dny s měřením","dnů s měřením")+' v období'+(all.length>pts.length?' z '+all.length+' měření celkem':'')+'</div></div>';
  }else h+='<div class="empty" style="margin-top:10px">Pro „'+esc(f[1])+'“ v tomto období žádné měření.</div>';
  h+='</section><section class="sec"><div class="sec-h"><h2>Měření</h2><span class="xs muted">'+items.length+'</span></div><div class="stack" style="gap:6px">';
  for(const i of items.slice(0,S.bodyLimit||30)){
    h+='<button class="hw" data-act="editBody" data-v="'+i.id+'"><div class="row"><b class="grow">'+fmtDate(i.date)+'</b>'+(i.note?'<span class="pill">'+esc(i.note)+'</span>':'')+'</div><div class="line num">'+BODY_F.filter(([k])=>i[k]!==undefined&&i[k]!==null&&i[k]!=="").map(([k,l,u])=>'<span>'+esc(l)+' <b>'+fmtKg(+i[k])+'</b> '+esc(u)+'</span>').join("")+'</div></button>';
  }
  if(!items.length)h+='<div class="empty">Zatím žádná měření.</div>';
  if(items.length>(S.bodyLimit||30))h+='<button class="btn block" data-act="bodyMore">Starší měření</button>';
  h+='</div></section>';
  return h;
}
function sheetBody(id){
  const v=id?S.body[id]:{date:Date.now()};
  let b='<label class="f">Datum<input class="inp" type="date" id="b-date" value="'+toDateInput(v.date)+'"></label><div class="grid2">';
  for(const [k,l,u] of BODY_F)b+='<label class="f">'+esc(l)+(u?' ('+esc(u)+')':'')+'<input class="inp" id="b-'+k+'" inputmode="decimal" value="'+(v[k]!=null?esc(String(v[k]).replace(".",",")):"")+'"></label>';
  b+='</div><label class="f">Poznámka<input class="inp" id="b-note" value="'+esc(v.note||"")+'"></label>';
  openSheet(id?"Upravit měření":"Nové měření",b,(id?'<button class="btn danger" data-act="delBody" data-v="'+id+'">Smazat</button>':'')+'<button class="btn primary grow" data-act="saveBody" data-v="'+(id||"")+'">Uložit</button>');
}

/* ---------- SETTINGS ---------- */
function vSettings(){
  let h=topbar("Nastavení","Fitka, vzhled, záloha");
  const counts={};for(const w of derive().all)counts[w.gymId]=(counts[w.gymId]||0)+1;
  h+='<section class="sec"><div class="sec-h"><h2>Fitka</h2><button class="btn sm" data-act="addGym">+ Přidat</button></div><div class="stack" style="gap:6px">';
  for(const g of S.cfg.gyms){
    h+='<div class="card row" style="padding:10px 12px"><span class="sw" style="width:12px;height:12px;border-radius:50%;background:'+gymColor(g.id)+'"></span><div class="grow"><b>'+esc(g.name)+'</b><div class="xs muted">'+(counts[g.id]||0)+' tréninků'+(S.cfg.defaultGymId===g.id?' · výchozí':'')+'</div></div><button class="btn sm" data-act="editGym" data-v="'+g.id+'">Upravit</button></div>';
  }
  h+='</div></section>';
  h+='<section class="sec"><div class="sec-h"><h2>Vzhled</h2></div><div class="card row"><span class="grow">Motiv</span><div class="seg">'+[["dark","Tmavý"],["light","Světlý"],["auto","Podle systému"]].map(([k,l])=>'<button data-act="theme" data-v="'+k+'" aria-pressed="'+(themePref()===k)+'">'+l+'</button>').join("")+'</div></div></section>';
  h+='<section class="sec"><div class="sec-h"><h2>Tělesná hmotnost</h2></div><div class="card stack"><div class="row"><span class="grow small">Používá se u cviků s vlastní vahou pro objem a odhad 1RM.</span><label class="f" style="width:110px">kg<input class="inp" id="bwInp" data-f="bodyWeight" inputmode="decimal" value="'+esc(S.cfg.bodyWeight||80)+'"></label></div><div class="xs muted">'+(Object.values(S.body||{}).some(b=>isFinite(+b.weight))?'Máš uložená měření v záložce Tělo, takže se k datu tréninku bere nejbližší dřívější měření. Tahle hodnota slouží jen pro starší tréninky před prvním měřením.':'Zatím nemáš žádné měření v záložce Tělo. Až nějaké přidáš, bude se brát ono.')+'</div></div></section>';
  h+='<section class="sec"><div class="sec-h"><h2>Odpočinek mezi sériemi</h2></div><div class="card row"><span class="grow">Výchozí časovač</span><div class="seg">'+[60,90,120,150,180].map(s=>'<button data-act="restSec" data-v="'+s+'" aria-pressed="'+(S.cfg.restSec===s)+'">'+fmtClock(s)+'</button>').join("")+'</div></div></section>';
  h+='<section class="sec"><div class="sec-h"><h2>O aplikaci</h2></div><div class="card small muted">Schéma svalů vychází z anatomických kreseb <b>Ryana Gravese</b>, použitých pod licencí <a class="link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> (balíček flutter-body-atlas). Odkazy na cviky vedou na hevyapp.com.</div></section>';
  h+=backupSettings();
  return h;
}
function sheetGym(id){
  const g=id?S.cfg.gyms.find(x=>x.id===id):{name:""};
  const cnt=id?derive().all.filter(w=>w.gymId===id).length:0;
  let b='<label class="f">Název<input class="inp" id="g-name" value="'+esc(g.name)+'" placeholder="např. Fitness Brno-střed"></label><label class="switch"><input type="checkbox" id="g-def" '+(id&&S.cfg.defaultGymId===id?"checked":"")+'> Výchozí fitko</label>';
  if(id&&cnt)b+='<div class="small muted">Fitko má '+cnt+' tréninků, proto ho nelze smazat. Tréninky můžeš přesunout jinam v Historii → Upravit.</div>';
  openSheet(id?"Upravit fitko":"Nové fitko",b,(id&&!cnt&&S.cfg.gyms.length>1?'<button class="btn danger" data-act="delGym" data-v="'+id+'">Smazat</button>':'')+'<button class="btn primary grow" data-act="saveGym" data-v="'+(id||"")+'">Uložit</button>');
}

/* ---------- výběr cviků ---------- */
let pick={sel:[],q:"",m:"all",eq:"all",hist:false,mode:"add",replaceI:null};
function openPicker(mode,replaceI){pick={sel:[],q:"",m:"all",eq:"all",hist:pick.hist,mode,replaceI};renderPicker()}
function pickerRows(){
  const {byEx}=derive();
  const recent={};
  for(const w of derive().all.slice(0,60))for(const e of w.ex||[])recent[e.exId]=(recent[e.exId]||0)+1;
  let arr=Object.entries(S.exLib).filter(([id,e])=>
    !e.archived&&
    (pick.m==="all"||exGroup(e)===pick.m)&&
    (pick.eq==="all"||e.equip===pick.eq)&&
    (!pick.hist||byEx[id])&&
    exMatch(e,pick.q));
  arr.sort((a,b)=>(recent[b[0]]||0)-(recent[a[0]]||0)||(byEx[b[0]]?1:0)-(byEx[a[0]]?1:0)||a[1].name.localeCompare(b[1].name));
  return arr;
}
function pickerList(){
  const {byEx}=derive();
  const arr=pickerRows();
  if(!arr.length)return '<div class="empty">Nic neodpovídá filtru.</div>';
  let h='';
  for(const [id,e] of arr.slice(0,pick.limit||120)){
    const on=pick.sel.includes(id);const n=byEx[id]?byEx[id].length:0;
    h+='<div class="pickrow"><button class="pick" data-act="pickToggle" data-v="'+esc(id)+'" aria-pressed="'+on+'"><span class="chk">'+(on?IC.check:"")+'</span><div class="grow"><div style="font-weight:600">'+esc(e.name)+'</div>'+(e.cz?'<div class="cz">'+esc(e.cz)+'</div>':'')+'<div class="xs muted">'+esc(exPri(e).map(k=>MUSCLE_MAP.NAMES[k]).join(", ")||MUSCLES[e.muscle]||"")+' · '+esc(EQUIP[e.equip]||"")+(n?' · '+n+'× v historii':'')+(e.gymDep?' · vázáno na fitko':'')+'</div></div></button><button class="infob" data-act="exInfo" data-v="'+esc(id)+'" aria-label="Info o cviku '+esc(e.name)+'" title="Popis a statistiky">i</button></div>';
  }
  if(arr.length>(pick.limit||120))h+='<button class="btn block" data-act="pickMore">Další cviky ('+(arr.length-(pick.limit||120))+')</button>';
  return h;
}
function pickerBody(){
  const n=pickerRows().length;
  return '<input class="inp" id="pickQ" data-f="pickQ" placeholder="Hledat cvik (anglicky i česky)…" value="'+esc(pick.q)+'" autocomplete="off">'+
    '<div class="chips" data-ck="pickM"><button class="chip" data-act="pickM" data-v="all" aria-pressed="'+(pick.m==="all")+'">Všechny partie</button>'+Object.entries(MUSCLES).filter(([k])=>k!=="other").map(([k,l])=>'<button class="chip" data-act="pickM" data-v="'+k+'" aria-pressed="'+(pick.m===k)+'">'+l+'</button>').join("")+'</div>'+
    '<div class="chips" data-ck="pickEq"><button class="chip" data-act="pickEq" data-v="all" aria-pressed="'+(pick.eq==="all")+'">Vše</button>'+Object.entries(EQUIP).map(([k,l])=>'<button class="chip" data-act="pickEq" data-v="'+k+'" aria-pressed="'+(pick.eq===k)+'">'+l+'</button>').join("")+'</div>'+
    '<div class="row wrap-r" style="justify-content:space-between"><button class="chip" data-act="pickHist" aria-pressed="'+pick.hist+'">Jen cviky z historie</button><span class="xs muted">'+n+' '+plural(n,"cvik","cviky","cviků")+'</span></div>'+
    '<button class="btn sm" data-act="newEx">+ Vytvořit vlastní cvik</button>'+
    '<div class="stack" id="pickList" style="gap:6px">'+pickerList()+'</div>';
}
function renderPicker(keep){
  const sb=document.querySelector(".sheet-b");const st=keep&&sb?sb.scrollTop:0;
  saveChipScroll(sb||undefined);
  const f='<button class="btn primary grow" data-act="pickDone" '+(pick.sel.length?"":"disabled")+'>'+(pick.mode==="replace"?"Nahradit":"Přidat"+(pick.sel.length?" ("+pick.sel.length+")":""))+'</button>';
  openSheet(pick.mode==="replace"?"Nahradit cvik":"Přidat cviky",pickerBody(),f,keep,{re:()=>renderPicker(true)});
  const nb=document.querySelector(".sheet-b");if(nb&&st)nb.scrollTop=st;
  restoreChipScroll(nb||undefined);
}
function refreshPickList(){
  const el=document.getElementById("pickList");if(!el){renderPicker(true);return}
  el.innerHTML=pickerList();
}
/* info o cviku nad výběrem – výběr i hledání zůstanou zachované */
function sheetExInfo(id){
  exEd=null;
  const e=exOf(id);const list=derive().byEx[id]||[];
  const R=recs();const rl=(R.byEx[id]||[]).slice(-3).reverse();
  let b=exFigures(e)+exTags(e)+(e.desc?'<p class="desc">'+esc(e.desc)+'</p>':'<p class="desc muted">Popis provedení zatím chybí.</p>')+
    '<div class="row wrap-r" style="justify-content:space-between"><a class="link" href="'+esc(exLink(e))+'" target="_blank" rel="noopener">'+(e.url?"Otevřít na Hevy ↗":"Hledat video ↗")+'</a><span class="xs muted">'+esc(EQUIP[e.equip]||"")+(e.gymDep?" · vázáno na fitko":"")+'</span></div>';
  if(list.length){
    let best=0,nSets=0;for(const x of list){if(x.best>best)best=x.best;nSets+=x.nWork}
    b+='<div class="kpis k4"><div class="kpi"><b>'+list.length+'</b><span>Tréninků</span></div><div class="kpi"><b>'+nSets+'</b><span>Sérií</span></div><div class="kpi"><b>'+(best?fmtKg(Math.round(best)):"–")+'</b><span>Odh. 1RM</span></div><div class="kpi"><b>'+fmtDateS(list[0].w.start)+'</b><span>Naposledy</span></div></div>';
    b+='<div class="small">Minule: <span class="num">'+esc(setsStr(list[0].e.sets,true,kindOf(id)))+'</span> <span class="muted">('+esc(gymName(list[0].w.gymId))+')</span></div>';
    if(rl.length)b+='<div class="reclist">'+rl.map(r=>'<div class="rec"><span class="md">🏅</span><div class="grow">'+esc(REC[r.type])+': <b>'+esc(recFmt(r.type,r.v,r.set))+'</b> <span class="muted">· '+fmtDate(r.w.start)+'</span></div></div>').join("")+'</div>';
  }else b+='<div class="small muted">S tímto cvikem zatím nemáš žádný záznam.</div>';
  openSheet(e.name,b,'<button class="btn grow" data-act="backPicker">Zpět na výběr</button><button class="btn" data-act="editExInfo" data-v="'+esc(id)+'">Upravit</button><button class="btn primary" data-act="openEx" data-v="'+esc(id)+'" data-p="info">Stránka cviku</button>',true,{lv:2,back:()=>renderPicker(true),re:()=>sheetExInfo(id)});
}
let exEd=null;
const exEdOut=()=>exEd&&(exEd.from==="detail"||exEd.from==="list"); // úprava otevřená mimo výběr cviků
function sheetExEdit(id,from){
  const e=id?S.exLib[id]:{name:(from==="list"?S.exlQ:pick.q)||"",equip:"machine",gymDep:true,pri:[],sec:[]};
  exEd={id,from:from||"picker",pri:exPri(e).slice(),sec:(e.sec||[]).slice()};
  renderExEdit(e);
}
function renderExEdit(e){
  const v=k=>{const el=document.getElementById(k);return el?el.value:null};
  const name=v("x-name")!=null?v("x-name"):e.name, cz=v("x-cz")!=null?v("x-cz"):(e.cz||""), desc=v("x-desc")!=null?v("x-desc"):(e.desc||""), url=v("x-url")!=null?v("x-url"):(e.url||""), equip=v("x-equip")||e.equip, kind=v("x-kind")||(KIND[e.kind]?e.kind:"wr"), gd=document.getElementById("x-gd")?document.getElementById("x-gd").checked:!!e.gymDep;
  const b='<label class="f">Název (anglicky, jako v Hevy)<input class="inp" id="x-name" value="'+esc(name)+'"></label>'+
    '<label class="f">Český název<input class="inp" id="x-cz" value="'+esc(cz)+'"></label>'+
    '<div><div class="f lbl-f" style="margin-bottom:6px">Partie · klepnutím: hlavní → pomocná → nic</div><div class="mpick">'+MKEYS.map(k=>'<button type="button" class="'+(exEd.pri.includes(k)?"p":exEd.sec.includes(k)?"s":"")+'" data-act="xMus" data-v="'+k+'">'+esc(MUSCLE_MAP.NAMES[k])+'</button>').join("")+'</div></div>'+
    exFigures({pri:exEd.pri,sec:exEd.sec},true)+
    '<label class="f">Typ zápisu<select class="inp" id="x-kind">'+KIND_ORDER.map(k=>'<option value="'+k+'"'+(kind===k?" selected":"")+'>'+esc(KIND[k].l)+'</option>').join("")+'</select><span class="xs muted" style="text-transform:none;letter-spacing:0;font-weight:500">'+esc(KIND[kind].ex)+'</span></label>'+
    '<label class="f">Vybavení<select class="inp" id="x-equip" data-f="xEquip">'+Object.entries(EQUIP).map(([k,l])=>'<option value="'+k+'"'+(equip===k?" selected":"")+'>'+l+'</option>').join("")+'</select></label>'+
    '<label class="switch"><input type="checkbox" id="x-gd" '+(gd?"checked":"")+'><span><b>Vázáno na fitko</b><br><span class="xs muted">Zapni u strojů a kladek — v každém fitku mají jiný odpor.</span></span></label>'+
    '<label class="f">Popis provedení<textarea class="inp" id="x-desc" rows="4">'+esc(desc)+'</textarea></label>'+
    '<label class="f">Odkaz (Hevy nebo video)<input class="inp" id="x-url" inputmode="url" value="'+esc(url)+'" placeholder="prázdné = vyhledat video podle názvu"></label>';
  const id=exEd.id;
  // Zpět o úroveň: do info o cviku, do výběru, nebo zavřít (úprava mimo výběr)
  const nav=exEdOut()?{}:exEd.from==="info"?{lv:3,back:()=>sheetExInfo(id)}:{lv:2,back:()=>{exEd=null;renderPicker(true)}};
  const sb=document.querySelector(".sheet-b");const st=sb?sb.scrollTop:null;
  openSheet(id?"Upravit cvik":"Nový cvik",b,(id?'<button class="btn danger" data-act="archEx" data-v="'+esc(id)+'">'+(e.archived?"Zobrazit":"Skrýt")+'</button>':'')+'<button class="btn grow" data-act="backPicker">Zpět</button>'+(id&&exChanged(id)?'<button class="btn" data-act="resetEx" data-v="'+esc(id)+'">Výchozí</button>':'')+'<button class="btn primary grow" data-act="saveEx" data-v="'+esc(id||"")+'">Uložit</button>',false,nav);
  if(st!==null){const sh=document.querySelector(".sheet");if(sh)sh.classList.add("noanim");const nb=document.querySelector(".sheet-b");if(nb)nb.scrollTop=st}
}

/* ---------- sheet ---------- */
// sheetNav: otevřený panel pro tlačítko Zpět – lv = kolik stisků Zpět ho zavře (panel v panelu má víc),
// back = jeden krok zpět, re = znovu otevřít (návrat ze stránky cviku nebo z úpravy tréninku)
let sheetNav=null;
function openSheet(title,body,foot,noanim,nav){
  document.getElementById("sheetRoot").innerHTML='<div class="scrim" data-act="scrim"><div class="sheet'+(noanim?" noanim":"")+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="sheet-h"><h2>'+esc(title)+'</h2><button class="iconbtn" data-act="closeSheet" aria-label="Zavřít">'+IC.close+'</button></div><div class="sheet-b">'+body+'</div>'+(foot?'<div class="sheet-f">'+foot+'</div>':'')+'</div></div>';
  document.body.style.overflow="hidden";
  sheetNav=Object.assign({lv:1,back:closeSheet,re:()=>openSheet(title,body,foot,true,nav)},nav);
}
function closeSheet(){document.getElementById("sheetRoot").innerHTML="";document.body.style.overflow="";sheetNav=null}
function confirmSheet(title,text,btn,act,v){openSheet(title,'<p style="margin:0">'+text+'</p>','<button class="btn grow" data-act="closeSheet">Zrušit</button><button class="btn primary grow" data-act="'+act+'" data-v="'+esc(v||"")+'">'+esc(btn)+'</button>')}

/* ---------- rest timer ---------- */
let audioCtx=null;
function beep(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();[0,0.25,0.5].forEach(t=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=880;g.gain.value=0.15;o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+t);o.stop(audioCtx.currentTime+t+0.15)})}catch(e){}try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
function renderRest(){
  const el=document.getElementById("rest");
  if(!S.restEnd||!S.active){el.hidden=true;return}
  const left=(S.restEnd-Date.now())/1000;
  el.hidden=false;
  el.innerHTML='<div class="rest-in"><div class="bar" id="restBar" style="width:'+Math.max(0,left/S.restTotal*100)+'%"></div><b id="restClock">'+fmtClock(left)+'</b><span>Odpočinek</span><button data-act="restAdj" data-v="-15">−15</button><button data-act="restAdj" data-v="15">+15</button><button data-act="restSkip">Přeskočit</button></div>';
}
setInterval(()=>{
  document.querySelectorAll("[data-elapsed]").forEach(e=>{const d=curDraft();if(d)e.textContent=fmtClock((Date.now()-d.start)/1000)});
  if(S.restEnd){
    const left=(S.restEnd-Date.now())/1000;
    if(left<=0){S.restEnd=null;beep();renderRest();toast("Odpočinek skončil");return}
    const c=document.getElementById("restClock"),b=document.getElementById("restBar");
    if(c)c.textContent=fmtClock(left);if(b)b.style.width=Math.max(0,left/S.restTotal*100)+"%";
  }
},500);

/* ---------- charts ---------- */
const CH={};let chN=0;
function chartPh(spec,h){const id="ch"+(++chN);CH[id]=Object.assign({h},spec);return '<div class="chart" id="'+id+'" data-chart="'+id+'" style="height:'+h+'px"></div>'}
function niceTicks(min,max,n){
  if(min===max){min=min-1;max=max+1}
  const span=max-min,step0=span/n,mag=Math.pow(10,Math.floor(Math.log10(step0))),r=step0/mag;
  const step=(r<1.5?1:r<3?2:r<7?5:10)*mag;
  const lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step;const t=[];for(let v=lo;v<=hi+step/2;v+=step)t.push(+v.toFixed(6));return t;
}
function yFmt(v){return Math.abs(v)>=10000?fmtKg(Math.round(v/100)/10)+"k":fmtKg(v)}
function drawCharts(){
  document.querySelectorAll("[data-chart]").forEach(el=>{
    const sp=CH[el.dataset.chart];if(!sp)return;
    const W=el.clientWidth||320,H=sp.h;
    const padL=40,padR=12,padT=12,padB=24;
    const iw=W-padL-padR,ih=H-padT-padB;
    let svg='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(sp.label)+'">';
    if(sp.type==="bar"){
      const vals=sp.bars.map(b=>b.v);const ticks=niceTicks(0,Math.max(1,...vals),4);const ymax=ticks[ticks.length-1];
      const Y=v=>padT+ih-(v/ymax)*ih;
      for(const t of ticks)svg+='<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+Y(t)+'" y2="'+Y(t)+'"/><text x="'+(padL-6)+'" y="'+(Y(t)+4)+'" text-anchor="end">'+yFmt(t)+'</text>';
      const bw=iw/sp.bars.length;
      sp.hit=[];
      sp.bars.forEach((b,i)=>{
        const x=padL+i*bw+1,w=Math.max(2,bw-2),y=Y(b.v),hh=padT+ih-y;
        if(b.v>0){const r=Math.min(4,w/2,hh);svg+='<path fill="var(--s1)" d="M'+x+','+(padT+ih)+'V'+(y+r)+'Q'+x+','+y+' '+(x+r)+','+y+'H'+(x+w-r)+'Q'+(x+w)+','+y+' '+(x+w)+','+(y+r)+'V'+(padT+ih)+'Z"/>'}
        if(b.tip!==undefined?b.label:(i%4===3||i===sp.bars.length-1&&sp.bars.length<5))svg+='<text x="'+(x+w/2)+'" y="'+(H-6)+'" text-anchor="middle">'+b.label+'</text>';
        sp.hit.push({x:x+w/2,y:Math.min(y,padT+ih-2),html:'<b>'+(b.v>=1000?fmtInt(b.v):fmtKg(Math.round(b.v)))+sp.unit+'</b><br>'+(b.tip||('týden od '+b.label))});
      });
      svg+='<line class="axis" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+(padT+ih)+'" y2="'+(padT+ih)+'"/>';
    }else{
      const pts=sp.series.flatMap(s=>s.pts);
      if(!pts.length){el.innerHTML='<div class="muted small" style="padding-top:60px;text-align:center">V tomto období žádná data.</div>';return}
      let x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x));if(x1-x0<DAY){x0-=3*DAY;x1+=3*DAY}
      let y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));const pad=(y1-y0)*0.08||1;
      const ticks=niceTicks(Math.max(0,y0-pad),y1+pad,4);const ya=ticks[0],yb=ticks[ticks.length-1];
      const X=x=>padL+(x-x0)/(x1-x0)*iw,Y=y=>padT+ih-(y-ya)/(yb-ya)*ih;
      for(const t of ticks)svg+='<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+Y(t)+'" y2="'+Y(t)+'"/><text x="'+(padL-6)+'" y="'+(Y(t)+4)+'" text-anchor="end">'+yFmt(t)+'</text>';
      // x ticks: months
      const span=x1-x0;const stepM=span>730*DAY?6:span>365*DAY?3:span>150*DAY?2:1;
      const d=new Date(x0);d.setDate(1);d.setHours(0,0,0,0);d.setMonth(d.getMonth()+1);
      let lastX=-99;
      while(d.getTime()<=x1){
        if(d.getMonth()%stepM===0||stepM===1){const x=X(d.getTime());if(x-lastX>34){svg+='<text x="'+x+'" y="'+(H-6)+'" text-anchor="middle">'+MONTHS[d.getMonth()]+(d.getMonth()===0?" "+String(d.getFullYear()).slice(2):"")+'</text>';lastX=x}}
        d.setMonth(d.getMonth()+1);
      }
      if(lastX<0)svg+='<text x="'+padL+'" y="'+(H-6)+'">'+fmtDateS(x0)+'</text><text x="'+(W-padR)+'" y="'+(H-6)+'" text-anchor="end">'+fmtDateS(x1)+'</text>';
      svg+='<line class="axis" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+(padT+ih)+'" y2="'+(padT+ih)+'"/>';
      sp.hit=[];
      for(const s of sp.series){
        if(!s.pts.length)continue;
        if(!s.noLine){
          const path=s.pts.map((p,i)=>(i?"L":"M")+X(p.x).toFixed(1)+","+Y(p.y).toFixed(1)).join("");
          svg+='<path d="'+path+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.w||2)+'" stroke-linejoin="round" stroke-linecap="round"/>';
        }
        const many=s.pts.length>60&&!s.dots;
        s.pts.forEach((p,i)=>{
          const last=i===s.pts.length-1;
          if(s.noDots){}
          else if(s.dots)svg+='<circle cx="'+X(p.x)+'" cy="'+Y(p.y)+'" r="2.6" fill="'+s.color+'"/>';
          else if(!many||last)svg+='<circle cx="'+X(p.x)+'" cy="'+Y(p.y)+'" r="'+(last?5:3.2)+'" fill="'+s.color+'" stroke="var(--surface)" stroke-width="2"/>';
          sp.hit.push({x:X(p.x),y:Y(p.y),html:(sp.series.length>1?'<span class="sw" style="background:'+s.color+'"></span>'+esc(s.name)+'<br>':'')+'<b>'+fmtKg(Math.round(p.y*10)/10)+sp.unit+'</b> · '+fmtDate(p.x)+(p.n>1?' ('+p.n+' měření)':'')+(p.s&&p.s.bestSet&&S.detailMetric==="e1rm"?'<br>'+fmtKg(p.s.bestSet.kg)+'×'+p.s.bestSet.reps:'')});
        });
      }
    }
    svg+='<line id="'+el.id+'-cx" x1="0" x2="0" y1="'+padT+'" y2="'+(padT+ih)+'" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/></svg><div class="tip" hidden></div>';
    el.innerHTML=svg;
    const tip=el.querySelector(".tip"),cx=el.querySelector("#"+el.id+"-cx");
    const move=ev=>{
      const r=el.getBoundingClientRect();const mx=ev.clientX-r.left,my=ev.clientY-r.top;
      let best=null,bd=1e9;for(const p of sp.hit){const dd=Math.abs(p.x-mx)+Math.abs(p.y-my)*0.25;if(dd<bd){bd=dd;best=p}}
      if(!best)return;
      tip.hidden=false;tip.innerHTML=best.html;
      const tx=Math.min(Math.max(best.x,70),W-70);tip.style.left=tx+"px";tip.style.top=(best.y-10)+"px";
      cx.setAttribute("x1",best.x);cx.setAttribute("x2",best.x);cx.setAttribute("visibility","visible");
    };
    el.onpointermove=move;el.onpointerdown=move;
    el.onpointerleave=()=>{tip.hidden=true;cx.setAttribute("visibility","hidden")};
  });
}
let rsT;window.addEventListener("resize",()=>{clearTimeout(rsT);rsT=setTimeout(drawCharts,150)});

/* ---------- events ---------- */
document.addEventListener("click",ev=>{
  const t=ev.target.closest("[data-act]");if(!t)return;
  const act=t.dataset.act,v=t.dataset.v,i=+t.dataset.i,j=+t.dataset.j;
  saveChipScroll();saveChipScroll(document.getElementById("sheetRoot"));
  if(act==="scrim"){if(ev.target===t)closeSheet();return}
  const d=curDraft();
  switch(act){
    case "tab":S.exDetail=null;if(S.route==="edit")S.editDraft=null;if(v==="ex"&&S.route!=="ex"&&S.route!=="exd"){S.exlQ="";S.exlLimit=0}go(v);break;
    case "selGym":S.selGym=v;scheduleRender();break;
    case "startEmpty":if(S.active){go("train");break}startWorkout(null);break;
    case "startTpl":if(S.active){toast("Nejdřív dokonči rozdělaný trénink.");go("train");break}startWorkout(v);break;
    case "newTpl":S.editDraft={mode:"template",id:null,title:"Nová šablona",ex:[]};goEdit();break;
    case "editTpl":{const t=S.templates[v];S.editDraft={mode:"template",id:v,title:t.name,gymId:curGym(),ex:(t.items||[]).map(it=>({k:uid("e"),exId:it.exId,note:"",sets:(it.sets||[]).map(s=>({t:s.t,kg:s.kg?String(s.kg):"",reps:s.reps?String(s.reps):""}))}))};goEdit();break}
    case "cycType":{const s=d.ex[i].sets[j];s.t=TYPES[(TYPES.indexOf(s.t)+1)%TYPES.length];touchDraft();scheduleRender();break}
    case "done":{const s=d.ex[i].sets[j];
      const kind=kindOf(d.ex[i].exId);
      if(!s.done){const last=lastSession(d.ex[i].exId,d.gymId,d.id);const p=last&&last.e.sets[j];
        if(p){if(s.kg===""&&p.kg)s.kg=String(p.kg);if(s.reps===""&&p.reps)s.reps=String(p.reps);if(!s.sec&&p.sec)s.sec=fmtSec(p.sec);if(!s.km&&p.km)s.km=String(p.km)}
        if(hasReps(kind)&&!(num(s.reps)>0)){toast("Zadej počet opakování.");break}
        if(isTimed(kind)&&!(parseSec(s.sec)>0)){toast("Zadej čas (např. 45 nebo 1:30).");break}
        if(kind==="dist"&&!(num(s.km)>0)){toast("Zadej vzdálenost.");break}
        s.done=true;s.at=Date.now();S.restTotal=S.cfg.restSec||120;S.restEnd=Date.now()+S.restTotal*1000;
        {const lr=liveRecords(d,i);const t=lr.sets[j];if(t&&t.length)toast("🏅 Nový rekord: "+t.map(recLow).join(", "))}
      }else{s.done=false;delete s.at}
      touchDraft();scheduleRender();break}
    case "delSet":d.ex[i].sets.splice(j,1);touchDraft();scheduleRender();break;
    case "addSet":{const ss=d.ex[i].sets;const l=[...ss].reverse().find(s=>s.t!=="w")||ss[ss.length-1];const n=newSetFrom(l?{t:l.t==="w"?"n":l.t,kg:num(l.kg),reps:num(l.reps)}:null);ss.push(n);touchDraft();scheduleRender();break}
    case "addWarm":{const ss=d.ex[i].sets;let k=0;while(k<ss.length&&ss[k].t==="w")k++;ss.splice(k,0,{t:"w",kg:"",reps:"",done:false});touchDraft();scheduleRender();break}
    case "exMenu":{const e=d.ex[i];openSheet(exName(e.exId),'<div class="stack"><button class="btn block" data-act="exNote" data-i="'+i+'">'+(e.note||e.showNote?"Upravit poznámku":"Přidat poznámku")+'</button><button class="btn block" data-act="exReplace" data-i="'+i+'">Nahradit jiným cvikem</button><div class="grid2"><button class="btn" data-act="exUp" data-i="'+i+'" '+(i===0?"disabled":"")+'>↑ Posunout výš</button><button class="btn" data-act="exDown" data-i="'+i+'" '+(i===d.ex.length-1?"disabled":"")+'>↓ Posunout níž</button></div><button class="btn block" data-act="openEx" data-v="'+esc(e.exId)+'">Stránka cviku (popis, statistiky)</button><button class="btn block danger" data-act="exRemove" data-i="'+i+'">Odebrat cvik z tréninku</button></div>');break}
    case "exNote":d.ex[i].showNote=true;closeSheet();scheduleRender();setTimeout(()=>{const n=document.getElementById("note-"+d.ex[i].k);n&&n.focus()},60);break;
    case "exUp":if(i>0){const x=d.ex.splice(i,1)[0];d.ex.splice(i-1,0,x);touchDraft()}closeSheet();scheduleRender();break;
    case "exDown":if(i<d.ex.length-1){const x=d.ex.splice(i,1)[0];d.ex.splice(i+1,0,x);touchDraft()}closeSheet();scheduleRender();break;
    case "exRemove":d.ex.splice(i,1);touchDraft();closeSheet();scheduleRender();break;
    case "exReplace":openPicker("replace",i);break;
    case "addEx":openPicker("add");break;
    case "pickToggle":
      if(pick.mode==="replace")pick.sel=[v];else{const k=pick.sel.indexOf(v);k<0?pick.sel.push(v):pick.sel.splice(k,1)}
      renderPicker(true);break;
    case "pickM":pick.m=v;pick.limit=0;renderPicker(true);break;
    case "pickEq":pick.eq=v;pick.limit=0;renderPicker(true);break;
    case "pickHist":pick.hist=!pick.hist;pick.limit=0;renderPicker(true);break;
    case "pickMore":pick.limit=(pick.limit||120)+120;refreshPickList();break;
    case "exInfo":sheetExInfo(v);break;
    case "pickDone":{
      const dd=curDraft();if(!dd){closeSheet();break}
      if(pick.mode==="replace"){const e=exEntryFor(pick.sel[0],dd.gymId);dd.ex[pick.replaceI]=e}
      else for(const id of pick.sel)dd.ex.push(dd.mode==="template"?{k:uid("e"),exId:id,note:"",sets:[newSetFrom(null),newSetFrom(null),newSetFrom(null)]}:exEntryFor(id,dd.gymId));
      touchDraft();closeSheet();scheduleRender();break}
    case "newEx":sheetExEdit(null);break;
    case "backPicker":navBack();break;
    case "saveEx":{
      const name=document.getElementById("x-name").value.trim();if(!name){toast("Zadej název cviku.");break}
      const id=v||("c-"+name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").slice(0,40)+"-"+Date.now().toString(36).slice(-4));
      if(!exEd.pri.length){toast("Vyber aspoň jednu hlavní partii.");break}
      const items=Object.assign({},S.exLib);
      const o=Object.assign({},items[id]||{custom:true},{name,cz:document.getElementById("x-cz").value.trim(),pri:exEd.pri.slice(),sec:exEd.sec.slice(),muscle:GROUP_OF[exEd.pri[0]],equip:document.getElementById("x-equip").value,kind:document.getElementById("x-kind").value,gymDep:document.getElementById("x-gd").checked,desc:document.getElementById("x-desc").value.trim()});
      const url=document.getElementById("x-url").value.trim();if(url)o.url=url;else delete o.url;
      if(!o.cz)delete o.cz;if(!o.desc)delete o.desc;
      items[id]=o;putEx(items);
      if(exEd.from==="detail"){closeSheet();toast("Cvik uložen");break}
      if(exEd.from==="info"){exEd=null;renderPicker(true);toast("Cvik uložen");break}
      if(exEd.from==="list"){closeSheet();if(!v){S.nav.push(navFrame());S.exDetail=id;S.exPart="info";S.detailGym="all";S.exHistLimit=25;S.prevRoute="ex";go("exd")}toast("Cvik uložen");break}
      if(!v){if(pick.mode==="replace")pick.sel=[id];else pick.sel.push(id)}
      pick.q="";renderPicker();toast("Cvik uložen");break}
    case "resetEx":{const items=Object.assign({},S.exLib),a=items[v].archived;items[v]=Object.assign({},EX_DB[v]);if(a)items[v].archived=true;putEx(items);
      if(exEdOut()){closeSheet();toast("Cvik vrácen na výchozí");break}
      exEd=null;renderPicker(true);toast("Cvik vrácen na výchozí");break}
    case "archEx":{const items=Object.assign({},S.exLib);const was=!!items[v].archived;items[v]=Object.assign({},items[v]);if(was)delete items[v].archived;else items[v].archived=true;putEx(items);if(!exEd||exEdOut())closeSheet();else renderPicker();toast(was?"Cvik je znovu ve výběru":"Cvik skrytý z výběru");break}
    case "xMus":{const k=v;const P=exEd.pri,Sx=exEd.sec;if(P.includes(k)){P.splice(P.indexOf(k),1);Sx.push(k)}else if(Sx.includes(k)){Sx.splice(Sx.indexOf(k),1)}else P.push(k);renderExEdit({});break}
    case "editExDetail":sheetExEdit(v,"detail");break;
    case "editExInfo":sheetExEdit(v,"info");break;
    case "statsRange":S.statsRange=v;lsSet("statsRange",v);scheduleRender();break;
    case "sumPeriod":S.sumPeriod=v;scheduleRender();break;
    case "closeSheet":closeSheet();break;
    case "restAdj":S.restEnd+=(+v)*1000;S.restTotal=Math.max(S.restTotal,(S.restEnd-Date.now())/1000);renderRest();break;
    case "restSkip":S.restEnd=null;renderRest();break;
    case "finish":{
      const ex=draftToWorkout(d,true);
      const undone=d.ex.reduce((a,e)=>a+e.sets.filter(s=>!s.done).length,0);
      if(!ex.length){toast("Žádná série není označená jako hotová.");break}
      const lastAt=lastSetAt(d);
      const sug=suggestEnd(d);
      let b='<p style="margin:0">'+ex.length+' cviků, '+ex.reduce((a,e)=>a+e.sets.length,0)+' sérií.</p>'+(undone?'<p class="small muted" style="margin:0">'+undone+' neoznačených sérií se neuloží.</p>':'');
      b+='<div class="card stack" style="gap:8px"><div class="row"><label class="f grow">Začátek<input class="inp" type="time" value="'+toTimeInput(d.start)+'" disabled></label><label class="f grow">Konec<input class="inp" type="time" id="fin-end" data-f="finEnd" value="'+toTimeInput(sug)+'"></label></div><div class="small muted" id="fin-info">'+finInfo(d,sug,lastAt)+'</div></div>';
      if(d.tplId&&S.templates[d.tplId])b+='<label class="switch"><input type="checkbox" id="updTpl" checked> Aktualizovat šablonu „'+esc(S.templates[d.tplId].name)+'“ (cviky a váhy)</label>';
      openSheet("Dokončit trénink?",b,'<button class="btn grow" data-act="closeSheet">Zpět</button><button class="btn primary grow" data-act="finishOk">Uložit trénink</button>');break}
    case "finishOk":{
      const ex=draftToWorkout(d,true);const upd=document.getElementById("updTpl");
      const sug=suggestEnd(d);
      const end=finEndValue(d)||sug;
      const w={title:d.title.trim()||defaultTitle(),start:d.start,end,gymId:d.gymId,ex};if(d.tplId)w.tplId=d.tplId;
      if(Math.abs(end-sug)>=60000)w.endOrig=sug;
      const id=uid("w");saveWorkout(id,w,null);
      if(upd&&upd.checked){const items=Object.assign({},S.templates);items[d.tplId]=Object.assign({},items[d.tplId],{items:ex.map(e=>({exId:e.exId,sets:e.sets.map(s=>({t:s.t,kg:s.kg,reps:s.reps}))}))});put("config/templates",{items})}
      S.active=null;S.restEnd=null;saveActive();closeSheet();
      toast("Trénink uložen");go("hist");
      sheetWorkout(Object.assign({id,mk:monthKey(w.start)},w),true);
      break}
    case "discard":confirmSheet("Zahodit trénink?","Rozdělaný trénink se smaže a neuloží.","Zahodit","discardOk");break;
    case "discardOk":S.active=null;S.restEnd=null;saveActive();closeSheet();go("train");break;
    case "edCancel":navBack();break;
    case "edDiscard":closeSheet();navBack(true);break;
    case "saveEdit":{
      const ex=draftToWorkout(d,false);if(!ex.length){toast("Trénink je prázdný.");break}
      const old=(S.months[d.mk]||{})[d.id]||{};
      const w=Object.assign({},old,{title:d.title.trim()||"Trénink",start:d.start,end:d.end,gymId:d.gymId,ex});
      const oldDur=(old.end||old.start)-old.start;
      if(Math.abs((d.end-d.start)-oldDur)>=60000&&!old.endOrig)w.endOrig=d.start+oldDur;
      if(w.endOrig&&Math.abs((w.endOrig-w.start)-(w.end-w.start))<60000)delete w.endOrig;
      saveWorkout(d.id,w,d.mk);S.editDraft=null;toast("Změny uloženy");go("hist");break}
    case "delWorkout":confirmSheet("Smazat trénink?","Trénink „"+esc(d.title)+"“ se trvale smaže.","Smazat","delWorkoutOk");break;
    case "delWorkoutOk":{const items=Object.assign({},S.months[d.mk]||{});delete items[d.id];put("workouts/"+d.mk,{items});S.editDraft=null;closeSheet();toast("Trénink smazán");go("hist");break}
    case "saveTpl":{
      const name=d.title.trim();if(!name){toast("Zadej název šablony.");break}
      const items=Object.assign({},S.templates);const id=d.id||uid("t");
      items[id]={name,order:(items[id]&&items[id].order)||Object.keys(items).length,items:d.ex.map(e=>({exId:e.exId,sets:e.sets.map(s=>({t:s.t,kg:num(s.kg)||0,reps:num(s.reps)||0,sec:parseSec(s.sec)||0,km:num(s.km)||0}))}))};
      put("config/templates",{items});S.editDraft=null;toast("Šablona uložena");go("train");break}
    case "delTpl":confirmSheet("Smazat šablonu?","Šablona „"+esc(d.title)+"“ se smaže. Tréninky podle ní zůstanou.","Smazat","delTplOk");break;
    case "delTplOk":{const items=Object.assign({},S.templates);delete items[S.editDraft.id];put("config/templates",{items});S.editDraft=null;closeSheet();go("train");break}
    case "histGym":S.histGym=v;S.histLimit=40;scheduleRender();break;
    case "histMore":S.histLimit=(S.histLimit||40)+40;scheduleRender();break;
    case "openW":{const w=Object.assign({id:v,mk:t.dataset.m},S.months[t.dataset.m][v]);sheetWorkout(w);break}
    case "editW":{const w=Object.assign({id:v,mk:t.dataset.m},S.months[t.dataset.m][v]);S.editDraft=workoutToDraft(w,"edit");goEdit();break}
    case "wToTpl":{const w=S.months[t.dataset.m][v];const items=Object.assign({},S.templates);const id=uid("t");items[id]={name:w.title,order:Object.keys(items).length,items:(w.ex||[]).map(e=>({exId:e.exId,sets:e.sets.map(s=>({t:s.t,kg:s.kg,reps:s.reps}))}))};put("config/templates",{items});closeSheet();toast("Šablona „"+w.title+"“ vytvořena");break}
    case "statsGym":S.statsGym=v;scheduleRender();break;
    case "statsMetric":S.statsMetric=v;scheduleRender();break;
    case "exMuscle":S.exMuscle=v;scheduleRender();break;
    case "exMore":S.exLimit=(S.exLimit||60)+60;scheduleRender();break;
    // ze záložky Cviky a z výběru se otevře Popis, odjinud (trénink, historie, statistiky) Statistiky
    case "openEx":{const f=S.route!=="exd"?navFrame():null;closeSheet();S.exPart=t.dataset.p||(S.route==="ex"?"info":"stats");S.exDetail=v;S.detailGym="all";S.exHistLimit=25;if(f){S.prevRoute=S.route;S.nav.push(f)}go("exd");break}
    case "exBack":navBack();break;
    case "exPart":S.exPart=v;render.keepScroll=false;scheduleRender();window.scrollTo(0,0);break;
    case "exlM":S.exlM=v;lsSet("exlM",v);S.exlLimit=0;scheduleRender();break;
    case "exlEq":S.exlEq=v;lsSet("exlEq",v);S.exlLimit=0;scheduleRender();break;
    case "exlSort":S.exlSort=v;lsSet("exlSort",v);S.exlLimit=0;scheduleRender();break;
    case "exlHid":S.exlHid=!S.exlHid;S.exlLimit=0;scheduleRender();break;
    case "exlMore":S.exlLimit=(S.exlLimit||100)+100;scheduleRender();break;
    case "exlNew":sheetExEdit(null,"list");break;
    case "detailMetric":S.detailMetric=v;scheduleRender();break;
    case "detailRange":S.detailRange=v;scheduleRender();break;
    case "detailGym":S.detailGym=v;scheduleRender();break;
    case "exHistMore":S.exHistLimit+=25;scheduleRender();break;
    case "toggleGymDep":{const items=Object.assign({},S.exLib);items[S.exDetail]=Object.assign({},items[S.exDetail],{gymDep:t.checked});putEx(items);break}
    case "bodyMetric":S.bodyMetric=v;scheduleRender();break;
    case "bodyRange":S.bodyRange=v;scheduleRender();break;
    case "bodyMore":S.bodyLimit=(S.bodyLimit||30)+30;scheduleRender();break;
    case "addBody":sheetBody(null);break;
    case "editBody":sheetBody(v);break;
    case "saveBody":{
      const o={date:new Date(document.getElementById("b-date").value+"T08:00").getTime()||Date.now()};
      for(const [k] of BODY_F){const n=num(document.getElementById("b-"+k).value);if(isFinite(n))o[k]=n}
      const note=document.getElementById("b-note").value.trim();if(note)o.note=note;
      if(Object.keys(o).length<2){toast("Vyplň aspoň jednu hodnotu.");break}
      const items=Object.assign({},S.body);items[v||uid("b")]=o;put("body/all",{items});closeSheet();toast("Měření uloženo");break}
    case "delBody":{const items=Object.assign({},S.body);delete items[v];put("body/all",{items});closeSheet();break}
    case "addGym":sheetGym(null);break;
    case "editGym":sheetGym(v);break;
    case "saveGym":{
      const name=document.getElementById("g-name").value.trim();if(!name){toast("Zadej název fitka.");break}
      const cfg=JSON.parse(JSON.stringify(S.cfg));let id=v;
      if(id)cfg.gyms.find(g=>g.id===id).name=name;else{id=uid("g");cfg.gyms.push({id,name})}
      if(document.getElementById("g-def").checked)cfg.defaultGymId=id;
      put("config/main",cfg);closeSheet();break}
    case "delGym":{const cfg=JSON.parse(JSON.stringify(S.cfg));cfg.gyms=cfg.gyms.filter(g=>g.id!==v);if(cfg.defaultGymId===v)cfg.defaultGymId=cfg.gyms[0].id;put("config/main",cfg);closeSheet();break}
    case "restSec":{const cfg=Object.assign({},S.cfg,{restSec:+v});put("config/main",cfg);break}
    case "theme":setTheme(v);scheduleRender();break;
    case "export":doExport();break;
    case "importOk":doImport(v);break;
    case "importGo":confirmImport(v);break;
    case "bkNow":makePoint("manual").then(ok=>{if(ok)toast("Bod obnovy vytvořen")});break;
    case "bkRestore":openPoint(v);break;
    case "bkSave":savePoint(v);break;
    case "bkNoHelp":lsSet("bkHelpOff",true);closeSheet();break;
    case "bkHelp":showBackupHelp(true);break;
  }
});
document.addEventListener("input",ev=>{
  const t=ev.target;const f=t.dataset&&t.dataset.f;if(!f)return;
  const d=curDraft();const i=+t.dataset.i,j=+t.dataset.j;
  if(f==="kg"||f==="reps"||f==="sec"||f==="km"){d.ex[i].sets[j][f]=t.value;touchDraft();return}
  if(f==="note"){d.ex[i].note=t.value;touchDraft();return}
  if(f==="title"){d.title=t.value;touchDraft();return}
  if(f==="finEnd"){const a=S.active;if(a){const e=finEndValue(a);const inf=document.getElementById("fin-info");if(e&&inf)inf.innerHTML=finInfo(a,e,lastSetAt(a))}return}
  if(f==="bodyWeight"){const n=num(t.value);if(isFinite(n)&&n>20&&n<300){clearTimeout(S._bwT);S._bwT=setTimeout(()=>put("config/main",Object.assign({},S.cfg,{bodyWeight:n})),700)}return}
  if(f==="exSearch"){S.exSearch=t.value;scheduleRender();return}
  if(f==="exlQ"){S.exlQ=t.value;S.exlLimit=0;scheduleRender();return}
  if(f==="pickQ"){pick.q=t.value;pick.limit=0;refreshPickList();return}
});
document.addEventListener("change",ev=>{
  const t=ev.target;const f=t.dataset&&t.dataset.f;const d=curDraft();
  if(t.id==="impFile"){readImport(t);return}
  if(f==="xEquip"){const gd=document.getElementById("x-gd");if(gd)gd.checked=!!GYMDEP_EQUIP[t.value];return}
  if(t.id==="x-kind"&&exEd){renderExEdit(S.exLib[exEd.id]||{});return}
  if(!f||!d)return;
  if(f==="gymId"){d.gymId=t.value;touchDraft();scheduleRender()}
  if(f==="date"||f==="time"){const ds=document.getElementById("ed-date").value,ts=document.getElementById("ed-time").value;const dur=(d.end||d.start)-d.start;const n=new Date(ds+"T"+(ts||"12:00")).getTime();if(isFinite(n)){d.start=n;d.end=n+dur}}
  if(f==="dur"){const m=num(t.value);if(isFinite(m))d.end=d.start+m*60000}
});

/* ---------- tlačítko Zpět (F0-06) ----------
   Každý stisk systémového Zpět (i gesto) = jeden krok navBack() podle toho, co je na obrazovce:
   panel → o úroveň / zavřít, stránka cviku a úprava → tam, odkud se přišlo, jiná záložka → Trénink.
   Na hlavní obrazovce Tréninku první Zpět jen ukáže hlášku, další appku zavře.
   Historie prohlížeče jen „počítá kroky“: drží se v ní aspoň tolik záznamů, kolik kroků zbývá
   na hlavní obrazovku, + 1 pojistka. Záznamy se přidávají jen po klepnutí – Chrome záznamy
   přidané bez klepnutí může při Zpět přeskočit. Rozdělaný trénink Zpět nikdy neukončí. */
const Nav={pos:0,ignore:false,exit:false};
(function(){const st=history.state;Nav.pos=st&&typeof st.zd==="number"?st.zd:0;try{history.replaceState({zd:Nav.pos},"")}catch(e){}})();
// kolik stisků Zpět zbývá na hlavní obrazovku Tréninku
function navDepth(){
  const r=S.route,top=S.nav[S.nav.length-1];
  return (sheetNav?sheetNav.lv:0)+(r==="exd"||r==="edit"?1+(top?top.d:1):r==="train"?0:1);
}
// místo, kam se vrátit ze stránky cviku nebo z úpravy (i s otevřeným panelem a posunem stránky)
function navFrame(){return {route:S.route,re:sheetNav&&sheetNav.re,y:window.scrollY,d:navDepth()}}
function goEdit(){const f=navFrame();closeSheet();S.nav.push(f);S.editOrig=JSON.stringify(S.editDraft);go("edit")}
function navBack(force){
  if(sheetNav){sheetNav.back();return true}
  const r=S.route;
  if(r==="edit"&&S.editDraft&&!force&&JSON.stringify(S.editDraft)!==S.editOrig){confirmSheet("Zahodit změny?","Neuložené změny se ztratí.","Zahodit","edDiscard");return true}
  if(r==="exd"||r==="edit"){
    const d=S.editDraft;if(r==="edit")S.editDraft=null;
    const f=S.nav.pop();
    if(!f){go(r==="edit"?(d&&d.mode==="template"?"train":"hist"):S.prevRoute&&S.prevRoute!=="exd"&&S.prevRoute!=="edit"?S.prevRoute:"ex");return true}
    go(f.route);render.restoreY=f.y;if(f.re)f.re();
    return true;
  }
  if(r!=="train"){go("train");return true}
  return false;
}
function navEnsure(){
  if(Nav.exit||(navigator.userActivation&&!navigator.userActivation.isActive))return;
  const need=navDepth()+1;
  while(Nav.pos<need){Nav.pos++;history.pushState({zd:Nav.pos},"")}
}
window.addEventListener("popstate",ev=>{
  const p=ev.state&&typeof ev.state.zd==="number"?ev.state.zd:0;
  const fwd=p>Nav.pos;Nav.pos=p;
  if(Nav.ignore){Nav.ignore=false;return}
  if(fwd)return;
  saveChipScroll();
  if(navBack())return;
  // hlavní obrazovka Tréninku: zahodit zbylé kroky, další Zpět appku zavře
  if(p>0){Nav.ignore=true;history.go(-p)}
  Nav.exit=true;toast("Stiskni Zpět ještě jednou pro zavření");
});
// klepnutí do appky obnoví pojistku proti zavření (a doplní kroky po otevření panelu či stránky)
document.addEventListener("click",()=>{Nav.exit=false},true);
document.addEventListener("click",()=>navEnsure());

/* ---------- backup (F0-01) ----------
   Dvě vrstvy ochrany:
   1) Záloha do souboru (JSON) — stáhne se do telefonu, odtud ručně na Disk / e-mail.
      Datum poslední zálohy je v config/backup.last.
      Po 7 dnech bez zálohy ukáže úvodní obrazovka pruh s připomínkou.
   2) Body obnovy uvnitř appky (IndexedDB, úložiště "points"): automaticky jednou za 7 dní,
      vždy před obnovou ze zálohy a ručně. Drží se posledních BK_MAX_POINTS.
   Formát souboru: version 2 = version 1 + pole "photos" (zatím prázdné, pro F2-05).
   Obnova umí "sloučit" (doplní chybějící, nic nepřepíše) a "nahradit vše". */
const BK_VERSION=2, BK_REMIND_DAYS=7, BK_AUTO_DAYS=7, BK_MAX_POINTS=8;
const BK_REASON={auto:"Automatický (týdenní)",pre:"Před obnovou ze zálohy",exdb:"Před aktualizací databáze cviků",manual:"Ručně vytvořený"};
const countW=months=>Object.values(months||{}).reduce((a,m)=>a+Object.keys(m||{}).length,0);
const daysAgo=t=>Math.floor((Date.now()-t)/DAY);
const agoLabel=t=>{const n=daysAgo(t);return n<=0?"dnes":n===1?"včera":"před "+n+" "+plural(n,"dnem","dny","dny")};

function snapshotAll(){
  return {
    app:"workout-denik",version:BK_VERSION,exported:new Date().toISOString(),
    includes:{photos:false},
    cfg:S.cfg,exercises:S.exLegacy||S.exLib,exDb:S.exLegacy?undefined:EX_V,templates:S.templates,months:S.months,body:S.body,
    photos:{} // F2-05: {photoId:{exId,gymId,mime,data(base64)}} — zatím prázdné
  };
}
function lastBackupAt(){const a=+(S.bk&&S.bk.last)||0,b=+lsGet("lastBackup",0)||0;const m=Math.max(a,b);return m||null}
function markBackup(ts){lsSet("lastBackup",ts);put("config/backup",Object.assign({},S.bk,{last:ts}))}

/* připomínka na úvodní obrazovce */
function backupBanner(){
  if(!countW(S.months))return "";
  const last=lastBackupAt();
  if(last&&daysAgo(last)<BK_REMIND_DAYS)return "";
  const txt=last?"Poslední záloha do souboru "+agoLabel(last)+".":"Zatím nemáš žádnou zálohu v souboru.";
  return '<div class="banner act"><span class="grow">'+txt+'</span><button class="btn" data-act="export">Zálohovat</button></div>';
}

/* sekce v Nastavení */
function backupSettings(){
  const last=lastBackupAt();
  let h='<section class="sec"><div class="sec-h"><h2>Záloha</h2></div><div class="card stack">';
  h+='<div class="small muted">Záloha je jeden soubor JSON se vším (tréninky, šablony, cviky, fitka, měření). Ulož si ho mimo telefon, třeba na Google Disk.</div>';
  h+='<div class="row wrap-r"><button class="btn primary grow" data-act="export">Stáhnout zálohu</button><label class="btn grow" for="impFile">Obnovit ze souboru</label><input type="file" id="impFile" accept=".json,application/json" hidden></div>';
  h+='<div class="row"><span class="xs muted grow">Poslední záloha: '+(last?fmtDate(last)+" ("+agoLabel(last)+")":"zatím nikdy")+'</span><button class="btn sm ghost" data-act="bkHelp">Jak na Disk?</button></div>';
  h+='</div></section>';

  h+='<section class="sec"><div class="sec-h"><h2>Body obnovy</h2>'+(pointsApi?'<button class="btn sm" data-act="bkNow">+ Vytvořit teď</button>':'')+'</div><div class="card">';
  if(!pointsApi){
    h+='<div class="small muted">Body obnovy tady nejsou dostupné (prohlížeč nepovolil úložiště).</div>';
  }else{
    h+='<div class="small muted" style="margin-bottom:6px">Kopie dat uložené v appce: automaticky jednou týdně a vždy před obnovou ze zálohy. Chrání před chybou v nové verzi nebo špatnou obnovou, ne před ztrátou telefonu. Drží se posledních '+BK_MAX_POINTS+'.</div>';
    const pts=(S.bk.points||[]);
    if(!pts.length)h+='<div class="xs muted">Zatím žádný bod obnovy.</div>';
    for(const p of pts){
      h+='<div class="bkpt"><div class="grow"><b class="small">'+fmtDate(p.at)+' '+toTimeInput(p.at)+'</b><div class="xs muted">'+esc(BK_REASON[p.reason]||p.reason)+' · '+fmtInt(p.n||0)+' '+plural(p.n||0,"trénink","tréninky","tréninků")+'</div></div><button class="btn sm ghost" data-act="bkSave" data-v="'+esc(p.id)+'">Stáhnout</button><button class="btn sm" data-act="bkRestore" data-v="'+esc(p.id)+'">Obnovit</button></div>';
    }
  }
  h+='</div></section>';
  return h;
}

/* stažení souboru */
async function doExport(){
  const data=JSON.stringify(snapshotAll());
  const name="workout-denik-"+toDateInput(Date.now())+".json";
  if(!downloads){toast("Stahování tady není dostupné.");return}
  try{
    await downloads.save({filename:name,data});
    markBackup(Date.now());scheduleRender();
    if(!lsGet("bkHelpOff",false))showBackupHelp(false,name);else toast("Záloha stažena");
  }catch(e){if(e&&e.code!=="declined")toast("Stažení se nepovedlo ("+(e.code||"chyba")+")")}
}
function showBackupHelp(force,name){
  let b='';
  if(!force)b+='<p style="margin:0">Soubor <b>'+esc(name||"workout-denik-….json")+'</b> je v telefonu ve složce <b>Stažené</b> (Download).</p>';
  b+='<p class="small muted" style="margin:0">Aby záloha přežila i ztrátu telefonu, pošli ji mimo něj:</p>';
  b+='<ol class="steps small"><li>V Chromu klepni na <b>⋮ → Stažené soubory</b> (nebo otevři appku <b>Soubory</b> → Stažené).</li><li>Podrž soubor zálohy a zvol <b>Sdílet</b>.</li><li>Vyber <b>Disk</b> → Uložit (nebo Gmail a pošli si ho).</li></ol>';
  b+='<p class="xs muted" style="margin:0">Obnova: Nastavení → Záloha → Obnovit ze souboru a vybrat soubor (z Disku jde vybrat přímo).</p>';
  const foot=force?'<button class="btn primary grow" data-act="closeSheet">Rozumím</button>':'<button class="btn grow" data-act="bkNoHelp">Příště neukazovat</button><button class="btn primary grow" data-act="closeSheet">Hotovo</button>';
  openSheet(force?"Záloha na Disk":"Záloha stažena",b,foot);
}

/* načtení a kontrola zálohy */
function normBackup(o){
  if(!o||typeof o!=="object"||(o.app!=="zelezny-denik"&&o.app!=="workout-denik"))throw new Error("Tohle není záloha Workout deníku.");
  if((+o.version||1)>BK_VERSION)throw new Error("Záloha je z novější verze appky. Nejdřív appku aktualizuj.");
  const obj=x=>x&&typeof x==="object"&&!Array.isArray(x)?x:{};
  const months={};for(const mk in obj(o.months)){if(/^\d{4}-\d{2}$/.test(mk))months[mk]=obj(o.months[mk])}
  const cfg=Object.assign({gyms:[],defaultGymId:null,restSec:120},obj(o.cfg));
  if(!Array.isArray(cfg.gyms))cfg.gyms=[];
  return {exported:o.exported,cfg,exercises:exLoad(obj(o.exercises),o.exDb!==EX_V),templates:obj(o.templates),months,body:obj(o.body),photos:obj(o.photos)};
}
let importData=null;
function readImport(inp){
  const f=inp.files&&inp.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{try{importSheet(normBackup(JSON.parse(r.result)),"Soubor zálohy")}catch(e){toast(e instanceof SyntaxError?"Soubor není platný JSON.":e.message)}};
  r.readAsText(f);inp.value="";
}
function mergeCount(o){
  let n=0;
  for(const mk in o.months){const cur=S.months[mk]||{};for(const id in o.months[mk])if(!(id in cur))n++}
  return n;
}
function importSheet(o,label){
  importData=o;
  const nb=countW(o.months),nc=countW(S.months),nm=mergeCount(o);
  let b='<p style="margin:0">'+esc(label)+(o.exported?' z <b>'+esc(fmtDate(Date.parse(o.exported)))+'</b>':'')+': '+fmtInt(nb)+' '+plural(nb,"trénink","tréninky","tréninků")+'. V appce je teď '+fmtInt(nc)+'.</p>';
  b+='<div class="card stack" style="gap:6px"><b>Sloučit</b><div class="small muted">Doplní jen to, co v appce chybí (tréninky, cviky, šablony, měření, fitka). Nic se nepřepíše ani nesmaže. Přibude '+fmtInt(nm)+' '+plural(nm,"trénink","tréninky","tréninků")+'.</div><button class="btn primary" data-act="importGo" data-v="merge">Sloučit</button></div>';
  b+='<div class="card stack" style="gap:6px"><b>Nahradit vše</b><div class="small muted">Současná data se smažou a nahradí obsahem zálohy.</div><button class="btn danger" data-act="importGo" data-v="replace">Nahradit vše</button></div>';
  if(pointsApi)b+='<div class="xs muted">Před obnovou se automaticky vytvoří bod obnovy, takže jde krok vrátit.</div>';
  openSheet("Obnovit ze zálohy",b,'<button class="btn grow" data-act="closeSheet">Zrušit</button>');
}
function confirmImport(mode){
  if(mode==="replace")confirmSheet("Nahradit všechna data?","Všechny současné tréninky, šablony, cviky, fitka a měření se nahradí obsahem zálohy.","Nahradit","importOk","replace");
  else doImport("merge");
}
async function doImport(v){
  const o=importData;if(!o)return;
  const force=String(v||"").endsWith("!"),mode=String(v||"merge").replace("!","");
  if(pointsApi&&!force){
    toast("Vytvářím bod obnovy…");
    const ok=await makePoint("pre");
    if(!ok){confirmSheet("Bod obnovy se nepodařilo vytvořit","Pokračovat bez pojistky? Krok pak nepůjde vrátit.","Pokračovat","importOk",mode+"!");return}
  }
  if(mode==="replace"){applyReplace(o);importData=null;closeSheet();toast("Data nahrazena zálohou")}
  else{const r=applyMerge(o);importData=null;closeSheet();toast(r.w||r.other?"Doplněno: "+r.w+" "+plural(r.w,"trénink","tréninky","tréninků")+(r.other?", "+r.other+" dalších položek":""):"Nic nechybělo, vše už v appce je.")}
}
function applyReplace(o){
  put("config/main",o.cfg);putEx(o.exercises);put("config/templates",{items:o.templates});put("body/all",{items:o.body});
  for(const mk in S.months)if(!(mk in o.months))put("workouts/"+mk,null);
  for(const mk in o.months)put("workouts/"+mk,{items:o.months[mk]});
}
function applyMerge(o){
  const r={w:0,other:0};
  const addMissing=(cur,src)=>{const out=Object.assign({},cur);let n=0;for(const k in src)if(!(k in out)){out[k]=src[k];n++}return [out,n]};
  for(const mk in o.months){
    const [items,n]=addMissing(S.months[mk]||{},o.months[mk]);
    if(n){put("workouts/"+mk,{items});r.w+=n}
  }
  let [ex,ne]=addMissing(S.exLib,o.exercises);if(ne){putEx(ex);r.other+=ne}
  let [tp,nt]=addMissing(S.templates,o.templates);if(nt){put("config/templates",{items:tp});r.other+=nt}
  let [bd,nb]=addMissing(S.body,o.body);if(nb){put("body/all",{items:bd});r.other+=nb}
  const have=new Set(S.cfg.gyms.map(g=>g.id)),add=o.cfg.gyms.filter(g=>g&&g.id&&!have.has(g.id));
  if(add.length){put("config/main",Object.assign({},S.cfg,{gyms:S.cfg.gyms.concat(add)}));r.other+=add.length}
  return r;
}

/* převod cviků na výchozí databázi (F0-02): jednou, s bodem obnovy předem */
async function migrateEx(){
  if(!S.exLegacy||!pointsApi||Store.state!=="ok"||migrateEx.busy)return;
  migrateEx.busy=true;
  try{await makePoint("exdb");if(S.exLegacy){S.exLegacy=null;putEx(S.exLib);scheduleRender()}}finally{migrateEx.busy=false}
}

/* body obnovy (IndexedDB) */
async function makePoint(reason){
  if(!pointsApi||makePoint.busy)return false;
  makePoint.busy=true;
  try{
    const data=JSON.stringify(snapshotAll());
    const res=await pointsApi.upload(new Blob([data],{type:"application/json"}),{type:"application/json"});
    const pt={id:res.id,at:Date.now(),reason,n:countW(S.months),bytes:res.sizeBytes};
    const all=[pt].concat(S.bk.points||[]);
    const keep=all.slice(0,BK_MAX_POINTS),drop=all.slice(BK_MAX_POINTS);
    put("config/backup",Object.assign({},S.bk,{points:keep}));
    for(const d of drop)pointsApi.delete(d.id).catch(()=>{});
    scheduleRender();
    return true;
  }catch(e){
    toast(e&&e.code==="quota_or_state"?"Úložiště bodů obnovy je plné.":"Bod obnovy se nepodařilo vytvořit ("+((e&&e.code)||"chyba")+")");
    return false;
  }finally{makePoint.busy=false}
}
function autoPoint(){
  if(autoPoint.armed||!pointsApi||Store.state!=="ok")return;
  autoPoint.armed=true;
  // počkat, až dorazí všechna data z databáze
  setTimeout(()=>{
    if(!countW(S.months))return;
    const lastAuto=Math.max(0,...(S.bk.points||[]).filter(p=>p.reason==="auto").map(p=>+p.at||0));
    if(Date.now()-lastAuto>=BK_AUTO_DAYS*DAY)makePoint("auto");
  },20000);
}
function fetchPoint(id){return pointsApi.read(id)}
async function openPoint(id){
  const p=(S.bk.points||[]).find(x=>x.id===id);
  try{const o=normBackup(JSON.parse(await fetchPoint(id)));importSheet(o,"Bod obnovy "+(p?fmtDate(p.at)+" "+toTimeInput(p.at):""))}
  catch(e){toast(e.message||"Bod obnovy nejde načíst.")}
}
async function savePoint(id){
  const p=(S.bk.points||[]).find(x=>x.id===id);
  if(!downloads){toast("Stahování tady není dostupné.");return}
  try{
    const data=await fetchPoint(id);
    await downloads.save({filename:"workout-denik-bod-obnovy-"+toDateInput(p?p.at:Date.now())+".json",data});
    toast("Bod obnovy stažen");
  }catch(e){if(!(e&&e.code==="declined"))toast(e.message||"Stažení se nepovedlo.")}
}

/* ---------- vzhled ---------- */
function themePref(){return Local.get("theme","dark")}
function setTheme(v){
  Local.set("theme",v);
  const r=document.documentElement;
  if(v==="auto")r.removeAttribute("data-theme");else r.setAttribute("data-theme",v);
  // PWA: barva stavového řádku Androidu podle pozadí appky
  const m=document.querySelector("meta[name=theme-color]");
  if(m)m.content=getComputedStyle(r).getPropertyValue("--bg").trim()||"#0e1013";
}
setTheme(themePref());

/* ---------- boot ---------- */
render();
(async function boot(){
  downloads=LocalDownloads;
  // požádat Chrome, ať data appky nikdy sám nemaže (u nainstalované PWA obvykle povolí bez dotazu)
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  const ok=await Store.init(IndexedDbBackend(),applyDoc,()=>{updSync();scheduleRender();autoPoint();migrateEx()});
  if(ok){pointsApi=LocalPoints;scheduleRender();autoPoint();migrateEx()}
  if(ok&&!S.active){const a=await Store.fetchActive();if(a){S.active=a;Local.set("active",a);scheduleRender()}}
})();
})();
