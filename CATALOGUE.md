# Evropský katalog ostatních značek

**Navazující kontrola 25. 10. 2026:** viz [ENGINE-CATALOGUE-AUDIT.md](ENGINE-CATALOGUE-AUDIT.md). Původní orientační seznamy nyní při načtení nahrazuje `engine-catalogue.js` a nabídky výrobců doplňuje oddělenými variantami PEMA. Níže je dokumentace původní vrstvy z 23. 10., nikoli úplný popis dnešní nabídky.

Kontrola a doplnění: 23. 10. 2026. Ford má samostatnou dokumentaci v `FORD-CATALOGUE.md`.

Do `js/catalogue-data.js` přibylo 36 nabídek s 229 samostatnými volbami motoru a výkonu. Údaje jsou přepsané z evropských podkladů výrobců; odkazy jsou u každého modelu ve formuláři a v objektu `CATALOGUE_SOURCES` ve zdrojovém souboru. Nejde o úplnou homologovanou databázi všech českých verzí, roků, převodovek, pohonů nebo kódů motoru.

| Značka | Doložené nabídky | Volby motoru | Pokrytí |
|---|---:|---:|---|
| Škoda | 7 | 48 | Fabia III 2017, Octavia III 2017 a IV 2020, Superb III 2016 s předním pohonem, Rapid 2017, Karoq a Kodiaq při uvedení |
| Volkswagen | 14 | 157 | Golf IV–VI zvlášť hatchback, Variant a GTI; výběr spalovacích motorů Golfu VII; Passat B5 a B5.5 zvlášť, B6 bez CC a výběr B7 |
| Audi | 5 | 12 | A4 a S4 po modernizaci 2019, A3 Sportback PHEV 2020, Q3 PHEV a SQ5 TDI 2021 |
| Yamaha | 4 | 6 | MT-07 2014 a 2024 včetně A2, XMAX 300 a TMAX Tech MAX 2024 |
| Honda | 6 | 6 | CBF125 2011, NC700S a NC700X 2012, NC750X 2014, SH150i 2020 a PCX125 2025 |

## Způsob výběru

- Doložené nabídky jsou ve formuláři první skupinou modelů. Roční vydání je uvedené přímo v názvu. U historických přehledů VW jsou uvedené roky modelové řady, nikoli dostupnost všech motorů po celé období.
- U ročních vydání se předvolí doložený rok. Skutečný jiný rok lze vybrat v oddělené skupině „Jiný rok“; takový výběr nedokládá dostupnost motoru v daném roce. Katalog automaticky nefiltruje motory podle roku.
- Každý doložený motor má konkrétní výkon. U plug-in hybridů je výslovně označen systémový výkon, u plynových variant výkon při provozu na plyn. Různé objemy se neslučují do jedné nové volby.
- Ruční motorizace je dostupná u všech značek. První motor se automaticky nepředvoluje. Neznámý uložený název se při editaci přenese do ručního pole beze změny; neznámá motorizace už nespadne na první motor při hledání servisních údajů.

## Kontrola původního seznamu a omezení

Původních 51 klíčů modelů zůstalo zachováno. Jejich původní souhrnné nabídky jsou označené jako orientační, nikoli nově ověřené. Zahrnuje to i historické modely, pro které zatím nebyl nalezen dostatečný primární podklad. Uživatel si je může dál vybrat a přesnou motorizaci zadat ručně. Nové nabídky neznamenají, že byly všechny původní motory individuálně ověřeny.

Konkrétně opravená chyba: původní Fabia III měla skupinu 1.4 TDI 66/77/81 kW. Podle [technických údajů Škoda z roku 2017](https://cdn.skoda-storyboard.com/2016/05/FABIA-en.pdf) jsou zde nově samostatné hodnoty 55, 66 a 77 kW. Již uložený text motoru se automaticky nepřepisuje.

Původní data slučovala také například Golf/Bora/Jetta, Audi A4/Allroad, Honda NC700/750 a SH125/150. Nově doložené nabídky používají konkrétní model, objem a výkon; původní společné položky nejsou důkazem, že každý motor existoval ve všech uvedených karoseriích či ročnících.

U [přehledu Passatu B7](https://www.volkswagen-newsroom.com/en/engine-versions-passat-b7-profile-20038) je rozporný řádek 2.0 TDI „110 kW / 140 PS“. Tento řádek se do doloženého výběru nepřevzal; verze BlueTDI 103 kW a TDI 125/130 kW jsou uvedené samostatně. Nabídka B7 proto výslovně představuje výběr.

Nové nabídky Audi vycházejí převážně z německých evropských materiálů, Honda PCX z rakouského. Česká dostupnost každé varianty není samostatně potvrzena. Q3 PHEV byl oznámen v prosinci 2020, prodej začal v lednu 2021; katalog jej proto vede pod nabídkou 2021.

## Olej a uložená data

Starý seznam obsahoval nesourcedované olejové normy a náplně společné pro několik motorů, někdy i rozporné údaje s filtrem/bez filtru. Tato pole se při sestavení katalogu nepoužívají jako automatické doporučení. Nabídka oleje začíná neutrální volbou a uživatel se řídí příručkou konkrétního motoru. Z výrobního technického listu se nepřebírá celkový objem olejového systému jako servisní náplň.

Neprovádí se migrace ani přepis uživatelské garáže nebo servisních záznamů. Existující hodnoty olejů, ceny, motory a roky v úložišti zůstávají zachované.

## Ověření aplikace

`node tests/catalogue.cjs --browser` ověřuje strukturu všech nových nabídek, konkrétní opravy, druh stroje, uložení a opětovné načtení u všech pěti značek, ruční motorizace, editaci všech původních modelových klíčů, zachování uloženého roku mimo katalog a mobilní šířku. Test používá izolovaný prohlížeč bez uživatelských dat.

Regresní kontroly: `node tests/ford-catalogue.cjs --browser` a `node tests/invoice.test.cjs`.
