/* ---------- NATIVNÍ APPKA (F6-01) ----------
   Appka běží buď jako webová (PWA z GitHub Pages), nebo zabalená v nativní aplikaci pro Android (Capacitor,
   složka nativni/). Kód appky je pro obě stejný, tenhle soubor jen v nativní appce doplní, co zabudovaný
   prohlížeč (WebView) neumí. Ve webové verzi neudělá nic (window.Capacitor tam není).
   - window.NATIVNI: značka „běží nativně“ pro js/app.js a js/pwa.js (service worker se v nativní appce
     neregistruje, soubory appky jsou přímo v APK) a save(): uložení souboru do složky Download (Stažené),
     kterou volá LocalDownloads.save v js/app.js. WebView odkaz s download neumí.
   - navigator.share / navigator.canShare: WebView sdílení souborů neumí, tady ho dělá doplněk Share
     (soubor se zapíše do cache/sdileni/ a předá systémové nabídce Sdílet). Zavření nabídky = AbortError,
     stejně jako v Chromu, appka pak zálohu nepočítá jako hotovou (F0-13).
   - Barva ikon ve stavovém řádku podle pozadí appky (světlý / tmavý motiv), doplněk SystemBars.
   - Zpět (F0-20): WebView systémové Zpět (tlačítko i tah od okraje) samo neobslouží a aplikace by se hned
     zavřela. Doplněk App ho předá appce: NATIVNI.onBack (nastaví js/app.js, sekce tlačítko Zpět),
     NATIVNI.minimize() schová aplikaci na pozadí (běží dál, jako tlačítko Domů).
   - Oznámení o konci pauzy (F6-02): NATIVNI.notif, doplněk LocalNotifications. Android oznámení ukáže sám
     v naplánovaný čas, i když appka spí nebo je displej zamčený. Popis u NATIVNI.notif níže a v js/app.js
     (sekce KONEC PAUZY V NATIVNÍ APPCE).
   - Třída nativni na <html>: styly jen pro nativní appku (pruh pod stavovým řádkem, okraje, css/app.css).
   Doplňky Capacitoru se volají přes window.Capacitor bez npm a bez build kroku (Capacitor je do stránky
   vloží sám). Nový nativní doplněk = balíček v nativni/package.json a jeho volání tady. */
(function () {
  "use strict";
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
  // třída pro styly jen nativní appky (okraj pod stavovým řádkem, css/app.css)
  document.documentElement.classList.add("nativni");

  // doplněk podle názvu (Capacitor ho do stránky vloží, když je v APK)
  function plugin(name) {
    return (cap.Plugins && cap.Plugins[name]) || cap.registerPlugin(name);
  }
  const Filesystem = plugin("Filesystem");
  const Share = plugin("Share");
  const SystemBars = plugin("SystemBars");
  const App = plugin("App");
  const Notif = plugin("LocalNotifications");

  // obsah souboru jako base64 (Filesystem zapisuje binární data jen takhle)
  function toBase64(blob) {
    return new Promise((ok, fail) => {
      const reader = new FileReader();
      reader.onload = () => ok(String(reader.result).replace(/^data:[^,]*,/, ""));
      reader.onerror = () => fail(reader.error);
      reader.readAsDataURL(blob);
    });
  }
  // zapíše soubor (text nebo Blob) do složky dir pod cestu path, vrátí adresu file://
  async function writeFile(path, directory, data) {
    const options = { path, directory, recursive: true };
    if (typeof data === "string") {
      options.data = data;
      options.encoding = "utf8";
    } else {
      options.data = await toBase64(data);
    }
    const res = await Filesystem.writeFile(options);
    return res.uri;
  }
  // název souboru bez lomítek a znaků, které Android v názvu nedovolí
  const safeName = (name) => String(name || "soubor").replace(/[\\/:*?"<>|]+/g, "-");

  /* Oznámení o konci pauzy (F6-02). Zvuk a vibraci oznámení určuje v Androidu „kanál“, ne appka, proto má
     každá volba Na konci pauzy (S.cfg.restAlert) vlastní kanál; kanál jen s vibrací má místo zvuku ticho
     (res/raw/ticho.wav, doplněk kanál bez zvuku neumí). Uživatel si kanály může v nastavení Androidu změnit.
     Volání doplňku jdou za sebou ve frontě (notifRun), aby zrušení nepředběhlo naplánování. */
  const NOTIF_CHANNELS = {
    both: { id: "pauza-zvuk-vibrace", name: "Konec pauzy (zvuk i vibrace)", vibration: true },
    sound: { id: "pauza-zvuk", name: "Konec pauzy (zvuk)", vibration: false },
    vib: { id: "pauza-vibrace", name: "Konec pauzy (vibrace)", vibration: true, sound: "ticho.wav" },
  };
  let notifQueue = Promise.resolve();
  function notifRun(job) {
    notifQueue = notifQueue.then(job).catch(() => {});
    return notifQueue;
  }
  // stav povolení z doplňku na stav, který zná appka ("granted", "denied", "default" = ještě se neptala)
  const permState = (value) => (value === "granted" || value === "denied" ? value : "default");
  const notif = {
    // povolení oznámení a povolení plánovat na přesný čas (Android 12+ „Budíky a připomenutí“)
    perm: "default",
    exact: "granted",
    // zavolá se, když se některé povolení změní (nastaví js/app.js)
    onChange: null,
    // načte obě povolení ze systému (start appky, návrat do appky z nastavení Androidu)
    async refresh() {
      const before = notif.perm + "/" + notif.exact;
      try {
        notif.perm = permState((await Notif.checkPermissions()).display);
        notif.exact =
          (await Notif.checkExactNotificationSetting()).exact_alarm === "granted" ? "granted" : "denied";
      } catch (e) {}
      if (before !== notif.perm + "/" + notif.exact && notif.onChange) {
        notif.onChange();
      }
    },
    // systémový dotaz Povolit oznámení (Android 13+)
    async ask() {
      try {
        await Notif.requestPermissions();
      } catch (e) {}
      await notif.refresh();
    },
    // otevře nastavení Androidu „Budíky a připomenutí“, po návratu načte stav
    async exactAsk() {
      try {
        await Notif.changeExactNotificationSetting();
      } catch (e) {}
      await notif.refresh();
    },
    // naplánuje oznámení id na čas at (ms); mode = klíč kanálu (both / sound / vib). Stejné id nahradí.
    schedule({ id, at, title, body, mode }) {
      const channel = NOTIF_CHANNELS[mode] || NOTIF_CHANNELS.both;
      return notifRun(async () => {
        await Notif.cancel({ notifications: [{ id }] }).catch(() => {});
        await Notif.schedule({
          notifications: [
            {
              id,
              title,
              body,
              channelId: channel.id,
              schedule: { at: new Date(at), allowWhileIdle: true },
              // bez povolení přesného času naplánovat nepřesně; jinak by doplněk sám otevřel nastavení Androidu
              isExactNotification: notif.exact === "granted",
              autoCancel: true,
            },
          ],
        });
      });
    },
    // zruší naplánované oznámení id
    cancel(id) {
      return notifRun(() => Notif.cancel({ notifications: [{ id }] }));
    },
    // odstraní už zobrazená oznámení appky (naplánovaná nechá)
    clear() {
      return notifRun(() => Notif.removeAllDeliveredNotifications());
    },
  };
  for (const channel of Object.values(NOTIF_CHANNELS)) {
    // důležitost 4 = oznámení vyskočí i přes jinou aplikaci; existující kanál Android nechá, jak je
    notifRun(() => Notif.createChannel(Object.assign({ importance: 4, visibility: 1 }, channel)));
  }
  notif.refresh();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      notif.refresh();
    }
  });

  window.NATIVNI = {
    notif,
    // uložení souboru do složky Download v telefonu (stejné místo, kam ukládá Chrome)
    async save({ filename, data, type }) {
      const content = typeof data === "string" ? data : new Blob([data], { type: type || data.type });
      try {
        await writeFile("Download/" + safeName(filename), "EXTERNAL_STORAGE", content);
      } catch (e) {
        const err = new Error((e && e.message) || "zápis se nepovedl");
        err.code = "zápis do Stažených se nepovedl";
        throw err;
      }
    },
    // co udělat při systémovém Zpět (nastaví js/app.js); dokud appka neběží, Zpět aplikaci schová
    onBack: null,
    // schová aplikaci na pozadí (neukončí ji, pauza a rozdělaný trénink běží dál)
    minimize() {
      App.minimizeApp().catch(() => {});
    },
  };

  // systémové Zpět (tlačítko i tah od okraje, F0-20): s posluchačem ho Capacitor nechá celé na appce
  App.addListener("backButton", () => {
    if (window.NATIVNI.onBack) {
      window.NATIVNI.onBack();
    } else {
      window.NATIVNI.minimize();
    }
  });

  // sdílení souborů přes systémovou nabídku Androidu (náhrada navigator.share)
  navigator.canShare = (d) => !!d && (Array.isArray(d.files) ? d.files.length > 0 : !!(d.text || d.url));
  navigator.share = async (d) => {
    d = d || {};
    const opts = {};
    if (d.title) opts.title = d.title;
    if (d.text) opts.text = d.text;
    if (d.url) opts.url = d.url;
    if (Array.isArray(d.files) && d.files.length) {
      opts.files = [];
      for (const f of d.files) {
        opts.files.push(await writeFile("sdileni/" + safeName(f.name), "CACHE", f));
      }
    }
    try {
      await Share.share(opts);
    } catch (e) {
      const msg = (e && e.message) || "";
      throw new DOMException(msg || "Sdílení se nepovedlo", /cancel/i.test(msg) ? "AbortError" : "DataError");
    }
  };

  // ikony ve stavovém řádku: světlé na tmavém pozadí appky, tmavé na světlém
  function barsStyle() {
    let bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    if (/^#[0-9a-f]{3}$/i.test(bg)) {
      bg = "#" + bg[1] + bg[1] + bg[2] + bg[2] + bg[3] + bg[3];
    }
    const m = bg.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return;
    const light = parseInt(m[1], 16) * 0.299 + parseInt(m[2], 16) * 0.587 + parseInt(m[3], 16) * 0.114 > 140;
    SystemBars.setStyle({ style: light ? "LIGHT" : "DARK" }).catch(() => {});
  }
  document.addEventListener("DOMContentLoaded", () => {
    barsStyle();
    new MutationObserver(barsStyle).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", barsStyle);
  });
})();
