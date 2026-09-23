/* Registrace service workeru (offline běh) a spolehlivá aktualizace.

   Jak aktualizace funguje:
   1. Při každém otevření appky (a při návratu do ní) se Chrome podívá, jestli
      se na webu změnil soubor sw.js (změní se, když se v něm zvýší VERSION).
   2. Pokud ano, nový service worker stáhne všechny soubory appky do nové cache
      a hned převezme řízení (skipWaiting + clients.claim v sw.js).
   3. Stránka se pak jednou sama znovu načte, aby běžela nová verze:
      hned, pokud je appka otevřená teprve chvíli nebo je na pozadí,
      jinak až při příštím přepnutí pryč z appky (aby nezmizelo, co zrovna píšeš).
   Rozdělaný trénink i neuložené zápisy jsou v localStorage, reload je nesmaže. */
(function(){
"use strict";
if(!("serviceWorker" in navigator))return;
const loadedAt=Date.now();
const hadController=!!navigator.serviceWorker.controller; // false = úplně první spuštění, nic nenačítat znovu
let pending=false,reloading=false;
function reload(){if(reloading)return;reloading=true;location.reload()}
navigator.serviceWorker.addEventListener("controllerchange",()=>{
  if(!hadController)return;
  if(document.visibilityState==="hidden"||Date.now()-loadedAt<15000)reload();
  else pending=true;
});
navigator.serviceWorker.register("sw.js").then(reg=>{
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="hidden"){if(pending)reload()}
    else reg.update().catch(()=>{});
  });
}).catch(()=>{});
})();
