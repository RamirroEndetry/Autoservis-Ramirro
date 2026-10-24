# Servisní kniha

Otevřete `index.html` v aktuálním Edge nebo Chrome. Data se ukládají v prohlížeči pro konkrétní adresu aplikace; před změnou adresy si exportujte zálohu.

## Webová verze – GitHub Pages

Adresa nasazení: https://ramirroendetry.github.io/Autoservis-Ramirro/

Publikování zajišťuje `.github/workflows/pages.yml` při změně větve `main`. V repozitáři musí být **Settings → Pages → Source: GitHub Actions**. Build `node scripts/build-site.cjs` kopíruje do nového adresáře `dist` pouze výslovně povolené soubory aplikace. Zálohy, soukromá garáž, testy a dokumentace se jako web nepublikují. Git ignoruje místní JSON zálohy, `js/garage-data.js` i testovací snímky.

Nová instalace začíná prázdnou garáží. Pro přenos dat nejprve v původní aplikaci zvolte **Záloha → Stáhnout zálohu**, pak na webu **Importovat soubor zálohy → Připojit chybějící**. Import probíhá místně v prohlížeči. Úložiště není společná cloudová databáze; mezi zařízeními se nepřenáší automaticky a po vymazání dat prohlížeče je potřeba záloha. Web nemá přihlašování. Platební účet je součástí veřejné aplikace.

Ověření sestaveného webu pod cestou repozitáře: `node tests/hosting.cjs` (Playwright + Edge). Ověřuje prázdný start, import/export zálohy, zachování dat při obnovení stránky, relativní adresy souborů a tiskový náhled s QR platbou.

## Faktury za díly

V záložce **Nový záznam** vyberte PDF, JPG, PNG nebo WebP v části **Načíst díly z faktury**. Aplikace přečte text PDF, u skenu nebo fotky použije české a anglické OCR. Limit je 20 MB a 15 stran PDF. Zpracování běží v prohlížeči; z CDN se stahují knihovny PDF.js 4.10.38, Tesseract.js 5.1.1 a jazyková data. Bez jejich načtení je potřeba zadat díly ručně.

Zkontrolujte návrh, upravte ceny nebo názvy a zvolte **Přidat položky do záznamu**. Doplní se vlastní úkony a poznámka s názvem souboru, zapne se součet. Nakonec doplňte datum a tachometr a uložte záznam. Původní faktura se nearchivuje. Ceny v aplikaci i tiskových výstupech zachovávají haléře.

U tabulky Zboží / Množství / Netto za jednotku / Daň % / Netto / DPH / Brutto aplikace čte konečné Brutto za celý řádek, kontroluje Netto + DPH a připojí popis z následujícího řádku ke kódu dílu. Množství zachová v názvu; cenu za celý řádek znovu nenásobí. Vynechá data dokladu, poznámky o záruce, ceny před slevou a nulové řádky pro osobní odběr či platbu. Rozpozná i souhrn „Celkem:“.

U jiných tabulek použije orientační návrh poslední částky na řádku a výslovně požádá o kontrolu. Nejde o univerzální účetní parser. DPH nepřepočítává. Neúplné nebo početně nesouhlasící řádky rozpoznané tabulky přeskočí; rozdíl proti celkové částce zobrazí. U neobvyklých sloupců, smíšeného textu se skenem nebo nekvalitní fotografie mohou položky vyžadovat doplnění. Detekovaná cizí měna import blokuje.

## QR platba na servisním protokolu

U servisního záznamu zapněte **Přidat QR platbu k úhradě celkové ceny servisu**, případně vyplňte variabilní symbol (1–10 číslic), a záznam uložte. Potom v historii otevřete **Protokol**. Náhled, tisk i export PDF obsahují QR kód a čitelné platební údaje. Částka odpovídá uložené celkové ceně v Kč včetně haléřů; neodečítají se zálohy ani částečné úhrady. U uhrazeného servisu volbu vypněte. Starší záznamy ji mají vypnutou a kompletní servisní knížka platební QR neobsahuje.

Příjemce: **824880004/5500**, IBAN **CZ9555000000000824880004**. Formát [QR Platba / SPAYD 1.0](https://qr-platba.cz/pro-vyvojare/specifikace-formatu/), měna CZK, korekce chyb M, bílý okraj 4 moduly. Číslo protokolu není číslem faktury, proto se z něj automaticky nevymýšlí VS. Prázdný VS znamená platbu bez symbolu. Nulová, záporná, neplatná či příliš vysoká částka QR platbu blokuje.

QR se generuje lokálně pomocí `js/payment.js` a lokální knihovny `qrcode-generator` 2.0.4 (MIT, `js/vendor/qrcode-LICENSE`). Nevyžaduje internet a platební údaje se neposílají službě pro generování obrázků. Export tlačítkem Stáhnout PDF nadále používá původní CDN knihovnu html2pdf; bez internetu lze použít **Vytisknout → Uložit jako PDF**.

- Zdroj knihovny: https://github.com/kazuhikoarase/qrcode-generator/tree/js2.0.4
- SHA-256 `js/vendor/qrcode.js`: `79ec86f82856005b1c887905cfccfcfbec3821ca61c7fd5a952faa5f778f791c`
- `node tests/payment.cjs --browser`: validace platebního řetězce a IBAN, haléře, VS s úvodními nulami, uložení a obnovení formuláře, výchozí vypnutí, staré záznamy a tiskový obrázek. QR z obrázku v tiskové velikosti se nezávisle dekóduje pomocí testovací knihovny jsQR 1.4.0 (Apache-2.0, `tests/vendor/jsQR-LICENSE`). Test neprovádí bankovní platbu.

## Kontroly katalogu a faktur

Škoda, Volkswagen, Audi, Yamaha a Honda mají doplněné evropské nabídky v `js/catalogue-data.js`. Přesný rozsah, opravy a omezení jsou v [CATALOGUE.md](CATALOGUE.md). Doložené nabídky a původní orientační seznam jsou ve formuláři oddělené; ruční motorizace a zachování starších údajů fungují u všech značek.

- `node tests/catalogue.cjs --browser`: nové nabídky všech pěti značek, ukládání, ruční motory, starší modely a roky, mobilní zobrazení.

Ford má samostatný evropský katalog v `js/ford-data.js`. Rozsah, omezení a odkazy na podklady jsou v [FORD-CATALOGUE.md](FORD-CATALOGUE.md). V nabídce se vybírá konkrétní generace/modernizace a výkon motoru. Chybějící motorizaci lze zadat ručně; starší záznamy zůstávají zachované. Specifikace oleje se z objemu motoru neodvozují.

- `node tests/ford-catalogue.cjs --browser`: konzistence katalogu Ford, uložení motoru a roku, ruční motorizace, zachování starších modelů a původních značek (Playwright + Edge).

Soukromé regresní testy faktur a jejich podklady zůstávají pouze v původní místní pracovní složce a nejsou součástí veřejného repozitáře.

Pro prohlížečové testy je potřeba Playwright a nainstalovaný Microsoft Edge. Cestu ke sdíleným Node balíčkům lze nastavit přes `NODE_PATH`.
