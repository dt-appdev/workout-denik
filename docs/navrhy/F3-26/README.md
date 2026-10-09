# Progres po cvicích ve Statistikách (F3-26) – náhledy

Náhledy 9. 10. 2026, nic nerozhodnuto. Statistiky → Cviky, fiktivní data (PPL, dvě fitka, období 3M).

- `dnes-*` – současný stav (zkušební data appky).
- `navrh-naposledy-*` – výchozí řazení: blok Největší zlepšení (5 cviků podle %, místo Nejčastějších cviků),
  Bez zlepšení beze změny, v seznamu vpravo hodnota, ukazatel a změna za období v kg / opak. / čase.
  Pokles šedě (ne červeně), změna pod 1 % = 0, málo dat = –. Leg press vázaný na fitko má řádek za každé fitko.
- `navrh-zlepseni-*` – řazení Zlepšení: podle %, změna v %, cviky bez změny (–) na konci.
- `navrh-7dni-*` – krátké období: změna skoro všude –, blok Největší zlepšení se neukáže.
- `navrh-napoveda-*` – panel nápovědy (otazník u Největšího zlepšení).
- `navrh-pismo-nejvetsi.png` – písmo Největší, šířka 360 px.

`nahled.js` = skript Playwrightu, který do běžící appky (localhost:8765) vloží navržené HTML a vyfotí ho
(`node nahled.js <složka>`, vedle něj `help.html` a `close.html` s ikonami).
