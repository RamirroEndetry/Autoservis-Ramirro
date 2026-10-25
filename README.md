# Servisní kniha

## Soukromá webová aplikace

Adresa: https://ramirroendetry.github.io/Autoservis-Ramirro/

Web na GitHub Pages používá Supabase Auth a Postgres. Přihlášení je e-mailem a heslem, veřejná registrace je vypnutá. Přístup k datům vynucuje databáze: RLS dovolí číst pouze vlastní existující řádek, zapisovat lze jen přes funkci save_garage s kontrolou verze. Nového vlastníka může povolit pouze administrátor. Do kódu patří jen veřejný publishable key; nikdy secret nebo service_role.

Po uložení sledujte stav **Uloženo v databázi** v horní liště. Čekající změny jsou uchované místně a po obnovení spojení se odešlou. Nové přihlášení a otevření garáže vyžaduje internet. Ostatní zařízení načítají změny každých 15 sekund při otevřené kartě, případně tlačítkem Synchronizovat. Rozpracovaný formulář synchronizaci pozastaví, aby se nepřepsal. V jednom profilu prohlížeče je povolená jedna aktivní karta aplikace.

Různé záznamy se slučují. Změny stejného záznamu nebo smazání vozidla proti novému servisu vyvolají konflikt; nic se automaticky nepřepíše. **Vyřešit konflikt** stáhne místní zálohu a po potvrzení načte databázi. Potřebné úpravy lze znovu zadat. Mazání a nahrazující import se projeví také na ostatních zařízeních. Export záloh zůstává dostupný.

Původní klíče místní garáže se nemění. Po přihlášení tlačítko **Převést původní garáž** stáhne původní zálohu a připojí záznamy do databáze. Rozdílné verze stejného ID převod zastaví k ručnímu porovnání. Z jiné adresy nebo počítačové verze použijte původní JSON export přes Zálohy. Tato migrace není automatický upload soukromých souborů z repozitáře.

## Provoz a nasazení

Schéma je v supabase/schema.sql; administrátor následně vloží do garage_state pouze UUID povoleného uživatele z Auth. supabase/checks.sql prověří přístup vlastníka, zamítnutí cizího a anonymního účtu, validaci dat a odmítnutí zastaralého zápisu, vše v transakci s rollbackem. Při zakládání dalšího projektu nastavte Site URL a přesnou Redirect URL na adresu webu, zakažte veřejnou registraci a anonymní přihlášení.

Obnova hesla používá e-mail Supabase. Doručování závisí na nastavení odesílatele a limitech služby; před spoléháním na obnovu je ověřte pro svůj účet. Správce má alternativně k dispozici správu účtů v dashboardu. Heslo se nikdy neukládá do zdrojového kódu.

Publikování zajišťuje .github/workflows/pages.yml při změně main. Build node scripts/build-site.cjs vytvoří nový dist pouze z allowlistu. Soukromé zálohy, js/garage-data.js a testovací snímky se nepublikují. Platební účet a publishable key jsou záměrně veřejné. Místní vývoj vyžaduje HTTP server; produkce HTTPS.

Knihovna Supabase JS 2.118.0 je lokálně v js/vendor/supabase.js (MIT, přiložená licence). SHA-256: EE3BE8DE192B97CB1D73D1E95D6B82BB1F6B658C0F97C4EF757FC331996ED3D3.

Kontroly: node tests/sync-model.cjs a node tests/cloud-browser.cjs. Druhý test používá skutečnou knihovnu Supabase s testovacími HTTP odpověďmi, dvě oddělená zařízení, výpadky, konflikty, opakovaný zápis, odhlášení, QR a chybu místního úložiště. Regresní testy katalogů a QR používají izolovaný místní testovací start bez autentizace; produkční aplikace takový přepínač nemá.

## Klienti a úhrady

Tlačítko **Klienti a úhrady** otevře karty klientů (jméno/firma, telefon, e-mail a interní poznámka), jejich vozidla a přehled známých neuhrazených částek. Klienta založte a v **Upravit stroj → Klient** jej přiřaďte k jednomu nebo více vozidlům. Hledání v kartách i garáži pracuje se jménem, SPZ a VIN; karty navíc s kontakty a poznámkou. Kontakty se nikam automaticky neodesílají a interní poznámky klienta nejsou na protokolu.

U servisu zvolte **Neuvedeno / Nezaplaceno / Částečně zaplaceno / Zaplaceno**. Částečná úhrada eviduje souhrnnou již přijatou částku v Kč; nejde o bankovní napojení ani historii jednotlivých plateb. Stav a doplatek jsou vidět v historii i na protokolu. Starší záznamy zůstávají bez uvedeného stavu a nejsou započítané jako dluh. Při zvýšení ceny již zaplaceného servisu se zachová původní uhrazená částka; snížení ceny pod úhradu vyžaduje ruční vyřešení přeplatku.

Klienti jsou součástí settings.clients v existujícím zabezpečeném payloadu a zálohách. Vazba vozidla je clientId, úhrada servisu settlement. Nevyžaduje se změna databázové struktury. Synchronizace slučuje různé klienty podle ID, změnu stejného klienta chrání konfliktem. Import Připojit chybějící zachová současné karty se stejným ID.

Ověření: node tests/clients-settlement.cjs --browser — formuláře klientů, přiřazení vozidla, hledání, úhrady, skutečné nezávislé dekódování QR s doplatkem, obnovení zálohy a mobilní zobrazení.

## Faktury za díly

V záložce **Nový záznam** vyberte PDF, JPG, PNG nebo WebP v části **Načíst díly z faktury**. Aplikace přečte text PDF, u skenu nebo fotky použije české a anglické OCR. Limit je 20 MB a 15 stran PDF. Zpracování běží v prohlížeči; z CDN se stahují knihovny PDF.js 4.10.38, Tesseract.js 5.1.1 a jazyková data. Bez jejich načtení je potřeba zadat díly ručně.

Zkontrolujte návrh, upravte ceny nebo názvy a zvolte **Přidat položky do záznamu**. Doplní se vlastní úkony a zapne se součet. Nakonec doplňte datum a tachometr a uložte záznam. Původní faktura se nearchivuje. Ceny v aplikaci i tiskových výstupech zachovávají haléře.

U tabulky Zboží / Množství / Netto za jednotku / Daň % / Netto / DPH / Brutto aplikace čte konečné Brutto za celý řádek, kontroluje Netto + DPH a připojí popis z následujícího řádku ke kódu dílu. Množství zachová v názvu; cenu za celý řádek znovu nenásobí. Vynechá data dokladu, poznámky o záruce, ceny před slevou a nulové řádky pro osobní odběr či platbu. Rozpozná i souhrn „Celkem:“.

U jiných tabulek použije orientační návrh poslední částky na řádku a výslovně požádá o kontrolu. Nejde o univerzální účetní parser. DPH nepřepočítává. Neúplné nebo početně nesouhlasící řádky rozpoznané tabulky přeskočí; rozdíl proti celkové částce zobrazí. U neobvyklých sloupců, smíšeného textu se skenem nebo nekvalitní fotografie mohou položky vyžadovat doplnění. Detekovaná cizí měna import blokuje.

## QR platba na servisním protokolu

U servisního záznamu zapněte **Přidat QR platbu na zbývající částku**, případně vyplňte variabilní symbol (1–10 číslic), a záznam uložte. Potom v historii otevřete **Protokol**. Náhled, tisk i export PDF obsahují QR kód a čitelné platební údaje. Částka odpovídá zbývajícímu doplatku v Kč včetně haléřů po odečtení evidované úhrady. U zaplaceného servisu se QR nezobrazí. Při neuvedeném stavu se pro zpětnou kompatibilitu použije celková cena. Starší záznamy ji mají vypnutou a kompletní servisní knížka platební QR neobsahuje.

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
