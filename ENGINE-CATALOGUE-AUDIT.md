# Kontrola katalogu motorů – 25. 10. 2026

Porovnáno všech 126 modelových záznamů stávající aplikace: 108 konkrétních generací/nabídek je namapováno na 121 veřejných katalogových stránek PEMA; 18 obecných položek Ford bez generace (včetně „Jiný model“) zůstává pro ruční zadání. Nejde o import všech značek a všech modelů, které PEMA nabízí.

## Výsledek a pravidla

- Golf VI (5K) nyní přímo nabízí 2.0 TDI 81 kW (CBDC, CLCA), katalogové období 10.2008–11.2012, a další dříve chybějící varianty. Existenci 81 kW potvrzuje také [Volkswagen Classic](https://www.volkswagen-newsroom.com/en/motor-versions-golf-6-profile-19486).
- Staré orientační seznamy se sloučenými výkony jsou nahrazeny jednotlivými katalogovými variantami. Například Transporter T5 rozlišuje AXB 77 kW a BRS 75 kW.
- Přesné nabídky doložené výrobcem zůstávají zachované. Další varianty z PEMA jsou ve zvláštní skupině a mají vlastní zdroj, období a kódy.
- Kódy jsou převzaté z konkrétního řádku katalogu, nikoli odhadnuté podle výkonu. Nabídka více kódů neznamená určení kódu konkrétního vozu. Aplikace jej sama nevyplňuje, umožňuje výběr a upozorní na nesoulad se zvolenou variantou.
- Výkony motocyklů PEMA uvádí zaokrouhlené a motorové kódy zde chybí. Tyto položky jsou výslovně označené; přesné desetinné hodnoty doložené výrobcem se nepřepisují (např. NC750X 40,3 kW nebo XMAX 300 20,6 kW).
- PEMA zahrnuje různé trhy, karoserie i omezené výkonové verze. Bez VIN/technického průkazu nelze garantovat českou dostupnost každé kombinace. Katalog není nezávislým ověřením všech údajů PEMA. Původní evropské nabídky výrobců jsou oddělené.
- Přiřazení karoserií je explicitní v scripts/engine-catalogue-map.cjs. Řádky mimo období daného modelu se vynechávají. Časová shoda sama neprokazuje konkrétní českou výbavu, proto je uveden zdroj.
- Uložené vozy a servisní záznamy se nemigrují. Starý název motoru se při úpravě zachová jako vlastní hodnota. Olejové normy ani objemy se z katalogu nedopočítávají.

## Pokrytí jednotlivých položek

Počty představují volby v konkrétních seznamech, ne unikátní motory celosvětově. Stejná motorizace může být v několika karoseriích či zdrojích.

| Značka / model | Stav | Počet voleb | Zdrojové modely PEMA |
| --- | --- | ---: | --- |
| Ford / Focus III – modernizace | Výrobce + katalogové alternativy | 45 | [9155](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=9155), [9157](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=9157) |
| Ford / Focus IV – před modernizací | Výrobce + katalogové alternativy | 22 | [38611](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=38611), [38774](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=38774) |
| Ford / Fiesta – generace od 2017, před modernizací | Výrobce + katalogové alternativy | 29 | [37787](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=37787) |
| Ford / Fusion – evropské MPV | Výrobce + katalogové alternativy | 11 | [4885](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=4885) |
| Ford / Mondeo – generace od 2014, před modernizací | Výrobce + katalogové alternativy | 26 | [13128](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=13128), [13129](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=13129), [13127](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=13127) |
| Ford / Kuga II – motory od 2015 | Výrobce + katalogové alternativy | 24 | [11097](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=11097) |
| Ford / C-MAX II – modernizace | Výrobce + katalogové alternativy | 39 | [8995](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=8995) |
| Ford / Grand C-MAX – modernizace | Výrobce + katalogové alternativy | 31 | [8996](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=8996) |
| Ford / S-MAX II – původní nabídka | Výrobce + katalogové alternativy | 20 | [13884](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=13884) |
| Ford / Galaxy III – původní nabídka | Výrobce + katalogové alternativy | 21 | [13969](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=13969) |
| Ford / EcoSport II – původní evropská nabídka | Výrobce + katalogové alternativy | 13 | [11479](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=11479) |
| Ford / Ka II | Výrobce + katalogové alternativy | 4 | [8000](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=8000) |
| Ford / KA+ / KA+ Active – modernizace | Výrobce + katalogové alternativy | 8 | [13141](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=13141) |
| Ford / Puma – crossover, původní nabídka | Výrobce + katalogové alternativy | 12 | [39675](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=39675) |
| Ford / Puma – modernizace 2024 | Výrobce + katalogové alternativy | 13 | [39675](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=39675) |
| Ford / Mustang VI – evropská verze před modernizací | Výrobce + katalogové alternativy | 4 | [13370](https://pemacz.cz/autodily/step3?type=V&manufacturer=776&manufacturerName=Ford+USA&model=13370), [13371](https://pemacz.cz/autodily/step3?type=V&manufacturer=776&manufacturerName=Ford+USA&model=13371) |
| Ford / Ranger T6 – modernizace, Duratorq | Výrobce + katalogové alternativy | 13 | [9853](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=9853) |
| Ford / Transit – první nabídka EcoBlue | Výrobce + katalogové alternativy | 15 | [11953](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=36&manufacturerName=Ford&model=11953), [11952](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=36&manufacturerName=Ford&model=11952) |
| Ford / Transit Custom I – první nabídka EcoBlue | Výrobce + katalogové alternativy | 6 | [11095](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=36&manufacturerName=Ford&model=11095), [11096](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=36&manufacturerName=Ford&model=11096) |
| Ford / Tourneo Connect II / Grand – 1.6 TDCi | Výrobce + katalogové alternativy | 6 | [11574](https://pemacz.cz/autodily/step3?type=V&manufacturer=36&manufacturerName=Ford&model=11574) |
| Ford / Tourneo Custom I – první nabídka EcoBlue | Výrobce + katalogové alternativy | 5 | [11094](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=36&manufacturerName=Ford&model=11094) |
| Ford / Focus | Ruční zadání, neurčená generace | 0 | — |
| Ford / Mondeo | Ruční zadání, neurčená generace | 0 | — |
| Ford / Fiesta | Ruční zadání, neurčená generace | 0 | — |
| Ford / Fusion | Ruční zadání, neurčená generace | 0 | — |
| Ford / Kuga | Ruční zadání, neurčená generace | 0 | — |
| Ford / Puma | Ruční zadání, neurčená generace | 0 | — |
| Ford / C-MAX | Ruční zadání, neurčená generace | 0 | — |
| Ford / S-MAX | Ruční zadání, neurčená generace | 0 | — |
| Ford / Galaxy | Ruční zadání, neurčená generace | 0 | — |
| Ford / EcoSport | Ruční zadání, neurčená generace | 0 | — |
| Ford / Ka | Ruční zadání, neurčená generace | 0 | — |
| Ford / Mustang | Ruční zadání, neurčená generace | 0 | — |
| Ford / Ranger | Ruční zadání, neurčená generace | 0 | — |
| Ford / Transit | Ruční zadání, neurčená generace | 0 | — |
| Ford / Transit Custom | Ruční zadání, neurčená generace | 0 | — |
| Ford / Tourneo Connect | Ruční zadání, neurčená generace | 0 | — |
| Ford / Tourneo Custom | Ruční zadání, neurčená generace | 0 | — |
| Ford / Jiný model Ford | Ruční zadání, neurčená generace | 0 | — |
| Škoda / Octavia I (1U) | Obnovený katalog | 19 | [1904](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=1904), [3560](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=3560) |
| Škoda / Octavia II (1Z) | Obnovený katalog | 29 | [5120](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=5120), [5162](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=5162) |
| Škoda / Octavia III (5E) | Obnovený katalog | 33 | [11195](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=11195), [11196](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=11196) |
| Škoda / Fabia I (6Y) | Obnovený katalog | 15 | [4383](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=4383), [4727](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=4727), [4777](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=4777) |
| Škoda / Fabia II (5J) | Obnovený katalog | 17 | [6363](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=6363), [6395](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=6395) |
| Škoda / Fabia III (NJ) | Obnovený katalog | 11 | [13331](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=13331), [13332](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=13332) |
| Škoda / Superb II (3T) | Obnovený katalog | 14 | [7588](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=7588), [8495](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=8495) |
| Škoda / Superb III (3V) | Obnovený katalog | 22 | [14018](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=14018), [14382](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=14382) |
| Škoda / Kodiaq (NS) | Obnovený katalog | 15 | [37164](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=37164) |
| Škoda / Karoq (NU) | Obnovený katalog | 13 | [38149](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=38149) |
| Škoda / Rapid / Spaceback (NH) | Obnovený katalog | 15 | [10587](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=10587), [11519](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=11519) |
| Škoda / Yeti (5L) | Obnovený katalog | 16 | [8486](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=8486) |
| Škoda / Roomster (5J) | Obnovený katalog | 14 | [5507](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=5507) |
| Škoda / Fabia III – nabídka 2017 | Výrobce + katalogové alternativy | 17 | [13331](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=13331), [13332](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=13332) |
| Škoda / Octavia III – modernizace, nabídka 2017 | Výrobce + katalogové alternativy | 38 | [11195](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=11195), [11196](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=11196) |
| Škoda / Octavia IV – nabídka 2020 | Výrobce + katalogové alternativy | 28 | [40538](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=40538), [40412](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=40412) |
| Škoda / Superb III – nabídka 2016, přední pohon | Výrobce + katalogové alternativy | 22 | [14018](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=14018), [14382](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=14382) |
| Škoda / Rapid – modernizace, nabídka 2017 | Výrobce + katalogové alternativy | 14 | [10587](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=10587), [11519](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=11519) |
| Škoda / Karoq – nabídka při uvedení 2017 | Výrobce + katalogové alternativy | 14 | [38149](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=38149) |
| Škoda / Kodiaq – nabídka při uvedení 2017 | Výrobce + katalogové alternativy | 13 | [37164](https://pemacz.cz/autodily/step3?type=V&manufacturer=106&manufacturerName=%C5%A0koda&model=37164) |
| Volkswagen / Golf IV / Bora (1J) | Obnovený katalog | 40 | [1994](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1994), [1995](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1995), [3884](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=3884), [4125](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4125) |
| Volkswagen / Golf V / Jetta (1K) | Obnovený katalog | 41 | [4991](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4991), [6245](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=6245), [5423](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=5423) |
| Volkswagen / Golf VI (5K) | Obnovený katalog | 23 | [7873](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=7873) |
| Volkswagen / Golf VII (5G) | Obnovený katalog | 50 | [10585](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=10585), [11221](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=11221) |
| Volkswagen / Polo IV (9N) | Obnovený katalog | 17 | [4804](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4804) |
| Volkswagen / Passat B5 / B5.5 (3B, 3BG) | Obnovený katalog | 46 | [1568](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1568), [1907](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1907), [4736](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4736), [4737](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4737) |
| Volkswagen / Passat B6 / CC (3C) | Obnovený katalog | 35 | [5398](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=5398), [5427](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=5427), [7375](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=7375) |
| Volkswagen / Passat B7 (36) | Obnovený katalog | 16 | [9003](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=9003), [9004](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=9004) |
| Volkswagen / Passat B8 (3G) | Obnovený katalog | 21 | [12917](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=12917), [12918](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=12918) |
| Volkswagen / Tiguan I (5N) | Obnovený katalog | 21 | [6397](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=6397) |
| Volkswagen / Touran I (1T) | Obnovený katalog | 23 | [4954](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4954), [10449](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=10449) |
| Volkswagen / Touareg I (7L) | Obnovený katalog | 13 | [4920](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4920) |
| Volkswagen / Transporter / Multivan T5 (7H) | Obnovený katalog | 27 | [4988](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=121&manufacturerName=VW&model=4988), [5004](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=121&manufacturerName=VW&model=5004), [5005](https://pemacz.cz/autodily/step3?type=O%2BL&manufacturer=121&manufacturerName=VW&model=5005) |
| Volkswagen / Golf IV – hatchback | Výrobce + katalogové alternativy | 48 | [1994](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1994) |
| Volkswagen / Golf IV Variant | Výrobce + katalogové alternativy | 40 | [1995](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1995) |
| Volkswagen / Golf IV GTI | Výrobce + katalogové alternativy | 25 | [1994](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1994) |
| Volkswagen / Golf V – hatchback | Výrobce + katalogové alternativy | 41 | [4991](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4991) |
| Volkswagen / Golf V Variant | Výrobce + katalogové alternativy | 20 | [6245](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=6245) |
| Volkswagen / Golf V GTI | Výrobce + katalogové alternativy | 4 | [4991](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4991) |
| Volkswagen / Golf VI – hatchback | Výrobce + katalogové alternativy | 36 | [7873](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=7873) |
| Volkswagen / Golf VI Variant | Výrobce + katalogové alternativy | 22 | [8442](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=8442) |
| Volkswagen / Golf VI GTI | Výrobce + katalogové alternativy | 5 | [7873](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=7873) |
| Volkswagen / Golf VII – hatchback, výběr spalovacích motorů | Výrobce + katalogové alternativy | 61 | [10585](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=10585) |
| Volkswagen / Passat B5 (3B) – před modernizací | Výrobce + katalogové alternativy | 32 | [1568](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1568), [1907](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=1907) |
| Volkswagen / Passat B5.5 (3BG) – modernizace | Výrobce + katalogové alternativy | 39 | [4736](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4736), [4737](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=4737) |
| Volkswagen / Passat B6 – bez CC | Výrobce + katalogové alternativy | 42 | [5398](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=5398), [5427](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=5427) |
| Volkswagen / Passat B7 – ověřený výběr | Výrobce + katalogové alternativy | 26 | [9003](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=9003), [9004](https://pemacz.cz/autodily/step3?type=V&manufacturer=121&manufacturerName=VW&model=9004) |
| Audi / A3 (8P) | Obnovený katalog | 29 | [4955](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=4955), [5143](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5143) |
| Audi / A3 (8V) | Obnovený katalog | 51 | [10253](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=10253), [10459](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=10459), [11282](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=11282) |
| Audi / A4 (B6) | Obnovený katalog | 23 | [4731](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=4731), [4797](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=4797) |
| Audi / A4 (B7) | Obnovený katalog | 35 | [5376](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5376), [5377](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5377) |
| Audi / A4 (B8) / Allroad | Obnovený katalog | 45 | [6418](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=6418), [6988](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=6988), [8031](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=8031) |
| Audi / A4 (B9) / Allroad | Obnovený katalog | 44 | [14695](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=14695), [14696](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=14696), [36378](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=36378) |
| Audi / A6 (C5) / Allroad | Obnovený katalog | 49 | [1891](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=1891), [3395](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=3395), [4632](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=4632) |
| Audi / A6 (C6) / Allroad | Obnovený katalog | 38 | [5110](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5110), [5381](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5381), [5546](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5546) |
| Audi / A6 (C7) / Allroad | Obnovený katalog | 39 | [9154](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=9154), [9627](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=9627), [10161](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=10161) |
| Audi / Q5 (8R) | Obnovený katalog | 27 | [7534](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=7534) |
| Audi / Q7 (4L) | Obnovený katalog | 14 | [5461](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=5461) |
| Audi / A4 B9 – modernizace, nabídka 2019 (sedan / Avant) | Výrobce + katalogové alternativy | 39 | [14695](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=14695), [14696](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=14696) |
| Audi / S4 B9 TDI – nabídka 2019 | Výrobce + katalogové alternativy | 3 | [14695](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=14695), [14696](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=14696) |
| Audi / A3 Sportback 8Y – plug-in hybrid 2020 | Výrobce + katalogové alternativy | 3 | [40531](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=40531) |
| Audi / Q3 – plug-in hybrid 2021 | Výrobce + katalogové alternativy | 2 | [38997](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=38997) |
| Audi / SQ5 TDI – modernizace 2021 | Výrobce + katalogové alternativy | 3 | [37161](https://pemacz.cz/autodily/step3?type=V&manufacturer=5&manufacturerName=Audi&model=37161) |
| Yamaha / X-Max 250 (YP250R) | Obnovený katalog | 6 | [12720](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12720) |
| Yamaha / X-Max 125 (YP125R) | Obnovený katalog | 5 | [12720](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12720) |
| Yamaha / T-Max 500 (SJ04, SJ08) | Obnovený katalog | 3 | [12704](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12704) |
| Yamaha / MT-07 (RM04, RM17) | Obnovený katalog | 4 | [12694](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12694) |
| Yamaha / FZ6 / Fazer S2 (RJ14) | Obnovený katalog | 4 | [12687](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12687) |
| Yamaha / XT 660 R / X | Obnovený katalog | 2 | [12722](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12722) |
| Yamaha / MT-07 – modelový rok 2014 | Výrobce + katalogové alternativy | 4 | [12694](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12694) |
| Yamaha / MT-07 – modelový rok 2024 | Výrobce + katalogové alternativy | 6 | [12694](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12694) |
| Yamaha / XMAX 300 – modelový rok 2024 | Výrobce + katalogové alternativy | 3 | [12720](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12720) |
| Yamaha / TMAX Tech MAX 560 – modelový rok 2024 | Výrobce + katalogové alternativy | 2 | [12704](https://pemacz.cz/autodily/step3?type=B&manufacturer=1021&manufacturerName=YAMAHA&model=12704) |
| Honda / CBF 600 / 600S (PC38, PC43) | Obnovený katalog | 3 | [12260](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12260) |
| Honda / CBF 1000 (SC58) | Obnovený katalog | 2 | [12260](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12260) |
| Honda / CBF 500 (PC39) | Obnovený katalog | 4 | [12260](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12260) |
| Honda / CBF 125 / CBF 250 | Obnovený katalog | 2 | [12260](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12260) |
| Honda / CB 600 F Hornet (PC36, PC41) | Obnovený katalog | 10 | [36220](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=36220) |
| Honda / NC 700 X / NC 750 X | Obnovený katalog | 7 | [12282](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12282) |
| Honda / PCX 125 (JF28, JF56) | Obnovený katalog | 1 | [12290](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12290) |
| Honda / SH 125i / SH 150i | Obnovený katalog | 6 | [12298](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12298) |
| Honda / CBF125 – modelový rok 2011 | Výrobce + katalogové alternativy | 2 | [12260](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12260) |
| Honda / NC700S – modelový rok 2012 | Výrobce + katalogové alternativy | 3 | [12282](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12282) |
| Honda / NC700X – modelový rok 2012 | Výrobce + katalogové alternativy | 3 | [12282](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12282) |
| Honda / NC750X – modelový rok 2014 | Výrobce + katalogové alternativy | 3 | [12282](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12282) |
| Honda / SH150i – modelový rok 2020 | Výrobce + katalogové alternativy | 3 | [12298](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12298) |
| Honda / PCX125 – modelový rok 2025 | Výrobce + katalogové alternativy | 3 | [12290](https://pemacz.cz/autodily/step3?type=B&manufacturer=45&manufacturerName=Honda&model=12290) |

## Ověření aplikace

`node tests/engine-catalogue.cjs --browser` kontroluje přesné párování výkonů/kódů se zdrojovými řádky, všechny modelové nabídky, Golf VI 81 kW, uložení a opětovné otevření, export/import zálohy, zachování starých údajů a mobilní šířku. Stávající testy katalogů nadále ověřují původní nabídky výrobců a kompatibilitu uložených vozidel. Data jsou lokální; aplikace při výběru motoru PEMA nekontaktuje.
