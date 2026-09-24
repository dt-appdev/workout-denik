/* Registrace service workeru (offline běh) a spolehlivá aktualizace.

   Jak aktualizace funguje:
   1. Při každém otevření appky (a při návratu do ní) se Chrome podívá, jestli
      se na webu změnil soubor sw.js nebo js/verze.js (mění se při každém nasazení).
   2. Pokud ano, nový service worker stáhne všechny soubory appky do nové cache
      a hned převezme řízení (skipWaiting + clients.claim v sw.js).
   3. Stránka se pak jednou sama znovu načte, aby běžela nová verze:
      hned, pokud je appka otevřená teprve chvíli nebo je na pozadí,
      jinak až při příštím přepnutí pryč z appky (aby nezmizelo, co zrovna píšeš).
   Rozdělaný trénink i neuložené zápisy jsou v localStorage, reload je nesmaže.
   updateViaCache:"none" = Chrome při kontrole nebere sw.js ani verze.js z HTTP cache.
   window.PWA.check() = ruční kontrola z Nastavení (F0-04), při novince načte hned. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  const loadedAt = Date.now();
  // false = úplně první spuštění, nic nenačítat znovu. Cizí service worker (jiná kopie appky
  // o úroveň výš) se nepočítá, stránku pak převezme vlastní worker.
  const ctl = navigator.serviceWorker.controller;
  const hadController = !!ctl && ctl.scriptURL === new URL("sw.js", location.href).href;
  let pending = false,
    reloading = false,
    manual = false;
  function reload() {
    if (reloading) return;
    reloading = true;
    location.reload();
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    if (manual || document.visibilityState === "hidden" || Date.now() - loadedAt < 15000) {
      reload();
    } else {
      pending = true;
    }
  });
  const ready = navigator.serviceWorker
    .register("sw.js", { updateViaCache: "none" })
    .then((reg) => {
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          if (pending) {
            reload();
          }
        } else {
          reg.update().catch(() => {});
        }
      });
      return reg;
    })
    .catch(() => null);
  window.PWA = {
    // výsledek: "new" (stahuje se nová verze), "same" (nejnovější), "offline", "none" (bez service workeru)
    async check() {
      const reg = await ready;
      if (!reg) return "none";
      if (pending) {
        reload();
        return "new";
      }
      manual = true; // nová verze nalezená touto kontrolou se načte hned
      try {
        await reg.update();
      } catch (e) {
        manual = false;
        return "offline";
      }
      if (reg.installing || reg.waiting) return "new";
      manual = false;
      return "same";
    },
  };
})();
