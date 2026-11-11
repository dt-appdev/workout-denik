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
   Doplňky Capacitoru se volají přes window.Capacitor bez npm a bez build kroku (Capacitor je do stránky
   vloží sám). Nový nativní doplněk = balíček v nativni/package.json a jeho volání tady. */
(function () {
  "use strict";
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;

  // doplněk podle názvu (Capacitor ho do stránky vloží, když je v APK)
  function plugin(name) {
    return (cap.Plugins && cap.Plugins[name]) || cap.registerPlugin(name);
  }
  const Filesystem = plugin("Filesystem");
  const Share = plugin("Share");
  const SystemBars = plugin("SystemBars");

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

  window.NATIVNI = {
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
  };

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
