/* European manufacturer catalogues, checked 2026-10-23.
 * An edition is a documented offer, not proof of availability in every year/market.
 * Original keys remain available; saved vehicle records are never migrated here.
 */
const CATALOGUE_SOURCES = {
  fabia17: ['Škoda Fabia, technické údaje 2017', 'https://cdn.skoda-storyboard.com/2016/05/FABIA-en.pdf'],
  octavia17: ['Škoda Octavia, nabídka 2017', 'https://www.skoda-storyboard.com/en/press-kits/skoda-octavia-bestseller-in-new-top-shape-following-comprehensive-revisions/'],
  octavia20: ['Škoda Octavia IV, přehled motorů 2020', 'https://cdn.skoda-storyboard.com/2020/03/OCTAVIA_EN_Engines.pdf'],
  superb16: ['Škoda Superb, technické údaje 2016', 'https://cdn.skoda-storyboard.com/2016/12/TD_SUPERB_en.pdf'],
  rapid17: ['Škoda Rapid, nabídka 2017', 'https://cdn.skoda-storyboard.com/2017/05/SKODA_RAPID_-Press_Kit_EN_with_TD.pdf'],
  karoq17: ['Škoda Karoq, technické údaje 2017', 'https://cdn.skoda-storyboard.com/2017/09/TD-KAROQ-en.pdf'],
  kodiaq16: ['Škoda Kodiaq, nabídka při uvedení', 'https://www.skoda-storyboard.com/en/press-kits/skoda-kodiaq-paris-press-kit-2016/'],
  golf4: ['Volkswagen Classic: Golf IV', 'https://www.volkswagen-newsroom.com/en/motor-versions-golf-4-profile-19479'],
  golf4v: ['Volkswagen Classic: Golf IV Variant', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-4-variant-profile-19524'],
  golf4gti: ['Volkswagen Classic: Golf IV GTI', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-4-gti-profile-19510'],
  golf5: ['Volkswagen Classic: Golf V', 'https://www.volkswagen-newsroom.com/en/motor-versions-5-golf-profile-19482'],
  golf5v: ['Volkswagen Classic: Golf V Variant', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-5-variant-profile-19527'],
  golf5gti: ['Volkswagen Classic: Golf V GTI', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-5-gti-profile-19513'],
  golf6: ['Volkswagen Classic: Golf VI', 'https://www.volkswagen-newsroom.com/en/motor-versions-golf-6-profile-19486'],
  golf6v: ['Volkswagen Classic: Golf VI Variant', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-6-variant-profile-19530'],
  golf6gti: ['Volkswagen Classic: Golf VI GTI', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-6-gti-profile-19516'],
  golf7: ['Volkswagen Classic: Golf VII', 'https://www.volkswagen-newsroom.com/en/engine-versions-golf-7-profile-20040'],
  passat5: ['Volkswagen Classic: Passat B5 / B5.5', 'https://www.volkswagen-newsroom.com/en/engine-versions-passat-b5-profile-19548'],
  passat6: ['Volkswagen Classic: Passat B6', 'https://www.volkswagen-newsroom.com/en/engine-versions-passat-b6-profile-19551'],
  passat7: ['Volkswagen Classic: Passat B7', 'https://www.volkswagen-newsroom.com/en/engine-versions-passat-b7-profile-20038'],
  a419: ['Audi A4 / S4, nabídka 2019 (Německo)', 'https://www.audi-mediacenter.com/en/the-audi-a4-major-upgrade-for-the-bestseller-11884/download'],
  a3phev20: ['Audi A3 Sportback 40 / 45 TFSI e, nabídka 2020', 'https://www.audi-mediacenter.com/en/press-releases/compact-hybrid-with-245-ps-system-outputthe-audi-a3-sportback-45-tfsi-e-13452/download'],
  q3phev21: ['Audi Q3 45 TFSI e, uvedení 2021', 'https://www.audi-mediacenter.com/en/press-releases/high-efficiency-and-outstanding-driving-pleasurethe-audi-q3-as-a-plug-in-hybrid-13447/download'],
  sq521: ['Audi SQ5 TDI, modernizace pro rok 2021', 'https://www.audi-mediacenter.com/en/press-releases/sporty-powerful-and-efficientaudi-presents-the-new-generation-of-the-sq5-tdi-13344/download'],
  mt0714: ['Yamaha MT-07, modelový rok 2014', 'https://cdn2.yamaha-motor.eu/prod/product-assets/2014/MT07/Factsheets/2014-MT07_en.pdf'],
  mt0724: ['Yamaha MT-07, modelový rok 2024', 'https://cdn2.yamaha-motor.eu/prod/product-assets/2024/MT07A/Factsheets/2024-MT07A_fr-FR.pdf'],
  xmax30024: ['Yamaha XMAX 300, modelový rok 2024', 'https://cdn2.yamaha-motor.eu/prod/product-assets/2024/XMAX300/Factsheets/2024-XMAX300_en.pdf'],
  tmax24: ['Yamaha TMAX Tech MAX, modelový rok 2024', 'https://cdn2.yamaha-motor.eu/prod/product-assets/2024/XP500ADX/Factsheets/2024-XP500ADX_en-GB.pdf'],
  cbf12511: ['Honda CBF125, evropský model 2011', 'https://hondanews.eu/eu/cs/cars/media/pressreleases/34824/cbf125-press-pack'],
  nc70012: ['Honda NC700S / NC700X, evropská nabídka 2012', 'https://hondanews.eu/eu/fi/cars/media/pressreleases/1917/honda-at-eicma-2011'],
  nc75014: ['Honda NC750X, modelový rok 2014', 'https://hondanews.eu/it/it/cars/media/pressreleases/48656/honda-nc750x-2014'],
  sh15020: ['Honda SH150i, modelový rok 2020', 'https://hondanews.eu/eu/en/motorcycles/media/pressreleases/195829/2020-honda-sh150i-1'],
  pcx25: ['Honda PCX125, modelový rok 2025 (Rakousko)', 'https://hondanews.eu/at/de/motorcycles/media/pressreleases/509493/honda-pcx125-modelljahrgang-2025']
};

(() => {
  const brands = ['skoda', 'vw', 'audi', 'yamaha', 'honda'];
  // Historical entries are retained for editing and for years not covered by an edition.
  // Oil figures in that seed catalogue were not sourced and must not be auto-recommended.
  for (const brand of brands) for (const model of Object.values(VEHICLE_DB[brand].models)) {
    model.catalogueStatus = 'reference';
    for (const engine of model.engines) {
      delete engine.oilSpec;
      delete engine.oilCapacity;
    }
  }
  // Confirmed correction; existing saved engineName strings remain untouched.
  VEHICLE_DB.skoda.models.fabia_3.engines = VEHICLE_DB.skoda.models.fabia_3.engines
    .filter(e => !e.name.startsWith('1.4 TDI'))
    .concat([55, 66, 77].map(power => ({name: `1.4 TDI ${power} kW`, fuel: 'diesel', power, source: 'fabia17'})));

  const add = (brand, key, name, years, source, groups, kind = 'car', edition = '') => {
    VEHICLE_DB[brand].models[key] = {
      name, kind, years, source, edition, catalogueStatus: 'sourced',
      engines: groups.flatMap(([label, fuel, powers]) => powers.map(power => ({
        name: `${label} ${String(power).replace('.', ',')} kW`, fuel, power, source
      })))
    };
  };
  // Annual editions deliberately do not claim availability for adjacent model years.
  add('skoda', 'fabia_3_2017', 'Fabia III – nabídka 2017', [2017, 2017], 'fabia17', [
    ['1.0 MPI', 'petrol', [44, 55]], ['1.0 TSI', 'petrol', [70, 81]], ['1.4 TDI', 'diesel', [55, 66, 77]]
  ], 'car', '2017');
  add('skoda', 'octavia_3_2017', 'Octavia III – modernizace, nabídka 2017', [2017, 2017], 'octavia17', [
    ['1.2 TSI', 'petrol', [63]], ['1.0 TSI', 'petrol', [85]], ['1.4 TSI', 'petrol', [110]], ['1.8 TSI', 'petrol', [132]],
    ['1.4 G-TEC (CNG)', 'cng', [81]], ['1.6 TDI', 'diesel', [66, 85]], ['2.0 TDI', 'diesel', [110, 135]]
  ], 'car', '2017');
  add('skoda', 'octavia_4_2020', 'Octavia IV – nabídka 2020', [2020, 2020], 'octavia20', [
    ['1.0 TSI', 'petrol', [81]], ['1.5 TSI', 'petrol', [110]], ['2.0 TSI', 'petrol', [140]],
    ['2.0 TDI', 'diesel', [85, 110, 147]], ['1.5 G-TEC (CNG)', 'cng', [96]],
    ['1.0 e-TEC (mHEV)', 'petrol', [81]], ['1.5 e-TEC (mHEV)', 'petrol', [110]], ['1.4 iV (PHEV, systémový výkon)', 'hybrid', [150]]
  ], 'car', '2020');
  add('skoda', 'superb_3_2016', 'Superb III – nabídka 2016, přední pohon', [2016, 2016], 'superb16', [
    ['1.4 TSI', 'petrol', [92]], ['1.4 TSI ACT', 'petrol', [110]], ['1.8 TSI', 'petrol', [132]], ['2.0 TSI', 'petrol', [162]],
    ['1.6 TDI', 'diesel', [88]], ['2.0 TDI', 'diesel', [110, 140]]
  ], 'car', '2016');
  add('skoda', 'rapid_2017', 'Rapid – modernizace, nabídka 2017', [2017, 2017], 'rapid17', [
    ['1.0 TSI', 'petrol', [70, 81]], ['1.4 TSI', 'petrol', [92]], ['1.4 TDI', 'diesel', [66]], ['1.6 TDI', 'diesel', [85]]
  ], 'car', '2017');
  add('skoda', 'karoq_2017', 'Karoq – nabídka při uvedení 2017', [2017, 2017], 'karoq17', [
    ['1.0 TSI', 'petrol', [85]], ['1.5 TSI', 'petrol', [110]], ['1.6 TDI', 'diesel', [85]], ['2.0 TDI', 'diesel', [110, 140]]
  ], 'car', '2017');
  add('skoda', 'kodiaq_2017', 'Kodiaq – nabídka při uvedení 2017', [2017, 2017], 'kodiaq16', [
    ['1.4 TSI', 'petrol', [92, 110]], ['2.0 TSI', 'petrol', [132]], ['2.0 TDI', 'diesel', [110, 140]]
  ], 'car', 'uvedení 2016/2017');

  add('vw', 'golf_4_hatch', 'Golf IV – hatchback', [1997, 2003], 'golf4', [
    ['1.4', 'petrol', [55]], ['1.6', 'petrol', [74]], ['1.6 16V', 'petrol', [77]], ['1.6 FSI', 'petrol', [81]],
    ['1.8', 'petrol', [92]], ['1.8 T', 'petrol', [110]], ['2.0', 'petrol', [85]], ['2.3 V5', 'petrol', [110, 125]],
    ['2.8 V6', 'petrol', [150]], ['3.2 R32', 'petrol', [177]], ['1.9 SDI', 'diesel', [50]], ['1.9 TDI', 'diesel', [66, 74, 81, 85, 96, 110]]
  ]);
  add('vw', 'golf_4_variant', 'Golf IV Variant', [1999, 2006], 'golf4v', [
    ['1.4', 'petrol', [55]], ['1.6', 'petrol', [74, 75]], ['1.6 16V', 'petrol', [77]], ['1.6 FSI', 'petrol', [81]], ['2.0', 'petrol', [85]],
    ['2.0 BiFuel (CNG, výkon na plyn)', 'cng', [75]], ['1.9 SDI', 'diesel', [50]], ['1.9 TDI', 'diesel', [66, 74, 81, 85, 96]]
  ]);
  add('vw', 'golf_4_gti', 'Golf IV GTI', [1997, 2003], 'golf4gti', [
    ['1.8 T GTI', 'petrol', [110, 132]], ['2.3 V5', 'petrol', [110, 125]], ['1.9 TDI', 'diesel', [81, 85, 96, 110]]
  ]);
  add('vw', 'golf_5_hatch', 'Golf V – hatchback', [2003, 2008], 'golf5', [
    ['1.4 16V', 'petrol', [55, 59]], ['1.4 FSI', 'petrol', [66]], ['1.4 TSI', 'petrol', [90, 103, 125]], ['1.6', 'petrol', [75]],
    ['1.6 FSI', 'petrol', [85]], ['2.0 FSI', 'petrol', [110]], ['3.2 R32', 'petrol', [184]], ['1.9 TDI', 'diesel', [66, 77]],
    ['2.0 SDI', 'diesel', [55]], ['2.0 TDI', 'diesel', [100, 103, 125]]
  ]);
  add('vw', 'golf_5_variant', 'Golf V Variant', [2007, 2009], 'golf5v', [
    ['1.4', 'petrol', [59]], ['1.4 TSI', 'petrol', [90, 103, 118, 125]], ['1.6', 'petrol', [75]], ['1.9 TDI', 'diesel', [77]], ['2.0 TDI', 'diesel', [103]]
  ]);
  add('vw', 'golf_5_gti', 'Golf V GTI', [2004, 2008], 'golf5gti', [
    ['2.0 TFSI GTI', 'petrol', [147]], ['2.0 TFSI GTI Edition 30 / Pirelli', 'petrol', [169]]
  ]);
  add('vw', 'golf_6_hatch', 'Golf VI – hatchback', [2008, 2012], 'golf6', [
    ['1.2 TSI', 'petrol', [63, 77]], ['1.4', 'petrol', [59]], ['1.4 TSI', 'petrol', [90, 118]], ['1.6', 'petrol', [75]],
    ['1.6 BiFuel (LPG, výkon na plyn)', 'lpg', [72]], ['1.8 TSI', 'petrol', [118]], ['2.0 R', 'petrol', [199]],
    ['1.6 TDI', 'diesel', [77]], ['2.0 TDI', 'diesel', [81, 103]], ['2.0 GTD', 'diesel', [125]]
  ]);
  add('vw', 'golf_6_variant', 'Golf VI Variant', [2009, 2013], 'golf6v', [
    ['1.2 TSI', 'petrol', [63, 77]], ['1.4', 'petrol', [59]], ['1.4 TSI', 'petrol', [90, 118]], ['1.6', 'petrol', [75]],
    ['1.6 TDI', 'diesel', [77]], ['2.0 TDI', 'diesel', [103]]
  ]);
  add('vw', 'golf_6_gti', 'Golf VI GTI', [2009, 2012], 'golf6gti', [
    ['2.0 TSI GTI', 'petrol', [155]], ['2.0 TSI GTI Edition 35', 'petrol', [173]]
  ]);
  add('vw', 'golf_7_hatch', 'Golf VII – hatchback, výběr spalovacích motorů', [2012, 2019], 'golf7', [
    ['1.0 TSI', 'petrol', [63, 85]], ['1.2 TSI', 'petrol', [63, 77, 81]], ['1.4 TSI', 'petrol', [90]], ['1.4 TSI ACT', 'petrol', [103]],
    ['1.5 TSI Evo ACT', 'petrol', [96, 110]], ['1.4 TGI (CNG)', 'cng', [81]], ['1.6 TDI', 'diesel', [66, 77, 81, 85]],
    ['2.0 TDI', 'diesel', [110]], ['2.0 GTD', 'diesel', [135]], ['1.4 GTE (PHEV, systémový výkon)', 'hybrid', [150]], ['2.0 R', 'petrol', [221, 228]]
  ]);
  add('vw', 'passat_b5_3b', 'Passat B5 (3B) – před modernizací', [1996, 2000], 'passat5', [
    ['1.6', 'petrol', [74]], ['1.8', 'petrol', [92]], ['1.8 T', 'petrol', [110]], ['2.0', 'petrol', [88]], ['2.3 VR5', 'petrol', [110]],
    ['2.8 V6', 'petrol', [142]], ['1.9 TDI', 'diesel', [66, 74, 81, 85]], ['2.5 V6 TDI', 'diesel', [110]]
  ]);
  add('vw', 'passat_b5_3bg', 'Passat B5.5 (3BG) – modernizace', [2000, 2005], 'passat5', [
    ['1.6', 'petrol', [75]], ['2.0', 'petrol', [85, 96]], ['1.8 T', 'petrol', [110]], ['2.3 V5', 'petrol', [125]], ['2.8 V6', 'petrol', [142]],
    ['4.0 W8', 'petrol', [202]], ['1.9 TDI', 'diesel', [74, 96]], ['2.0 TDI', 'diesel', [100]], ['2.5 V6 TDI', 'diesel', [110, 120, 132]]
  ]);
  add('vw', 'passat_b6_sourced', 'Passat B6 – bez CC', [2005, 2010], 'passat6', [
    ['1.4 TSI', 'petrol', [90]], ['1.4 EcoFuel (CNG)', 'cng', [110]], ['1.6', 'petrol', [75]], ['1.6 FSI', 'petrol', [85]],
    ['1.8 TSI', 'petrol', [118]], ['2.0 FSI', 'petrol', [110]], ['2.0 TFSI', 'petrol', [147]], ['2.0 TSI', 'petrol', [147]],
    ['3.2 V6 FSI', 'petrol', [184]], ['3.6 R36', 'petrol', [220]], ['1.6 TDI', 'diesel', [77]], ['1.9 TDI', 'diesel', [77]],
    ['2.0 TDI', 'diesel', [81, 103, 125]], ['2.0 BlueTDI', 'diesel', [105]]
  ]);
  // B7 source has an inconsistent 110 kW / 140 PS row: omit that row pending corroboration.
  add('vw', 'passat_b7_sourced', 'Passat B7 – ověřený výběr', [2010, 2014], 'passat7', [
    ['1.4 TSI', 'petrol', [90, 118]], ['1.8 TSI', 'petrol', [118]], ['2.0 TSI', 'petrol', [155]], ['3.6 FSI', 'petrol', [220]],
    ['1.4 EcoFuel (CNG)', 'cng', [110]], ['1.6 TDI', 'diesel', [77]], ['2.0 BlueTDI', 'diesel', [103]], ['2.0 TDI', 'diesel', [125, 130]]
  ]);

  add('audi', 'a4_b9_2019', 'A4 B9 – modernizace, nabídka 2019 (sedan / Avant)', [2019, 2019], 'a419', [
    ['2.0 35 TFSI (mHEV)', 'petrol', [110]], ['2.0 40 TFSI (mHEV)', 'petrol', [140]], ['2.0 45 TFSI (mHEV)', 'petrol', [180]],
    ['2.0 30 TDI (mHEV)', 'diesel', [100]], ['2.0 35 TDI (mHEV)', 'diesel', [120]], ['2.0 40 TDI', 'diesel', [140]], ['3.0 45 TDI', 'diesel', [170]]
  ], 'car', '2019, německá nabídka');
  add('audi', 's4_b9_2019', 'S4 B9 TDI – nabídka 2019', [2019, 2019], 'a419', [['3.0 V6 TDI (mHEV)', 'diesel', [255]]], 'car', '2019, evropská verze');
  add('audi', 'a3_8y_phev2020', 'A3 Sportback 8Y – plug-in hybrid 2020', [2020, 2020], 'a3phev20', [
    ['1.4 40 TFSI e (PHEV, systémový výkon)', 'hybrid', [150]], ['1.4 45 TFSI e (PHEV, systémový výkon)', 'hybrid', [180]]
  ], 'car', '2020');
  add('audi', 'q3_phev2021', 'Q3 – plug-in hybrid 2021', [2021, 2021], 'q3phev21', [['1.4 45 TFSI e (PHEV, systémový výkon)', 'hybrid', [180]]], 'car', '2021, německá nabídka');
  add('audi', 'sq5_2021', 'SQ5 TDI – modernizace 2021', [2021, 2021], 'sq521', [['3.0 V6 TDI (mHEV)', 'diesel', [251]]], 'car', '2021, německá nabídka');

  add('yamaha', 'mt07_2014', 'MT-07 – modelový rok 2014', [2014, 2014], 'mt0714', [
    ['689 cm³ CP2', 'petrol', [55]], ['689 cm³ CP2 (A2)', 'petrol', [35]]
  ], 'motorcycle', '2014');
  add('yamaha', 'mt07_2024', 'MT-07 – modelový rok 2024', [2024, 2024], 'mt0724', [
    ['689 cm³ CP2', 'petrol', [54]], ['689 cm³ CP2 (A2)', 'petrol', [35]]
  ], 'motorcycle', '2024');
  add('yamaha', 'xmax300_2024', 'XMAX 300 – modelový rok 2024', [2024, 2024], 'xmax30024', [['292 cm³ jednoválec', 'petrol', [20.6]]], 'scooter', '2024');
  add('yamaha', 'tmax_2024', 'TMAX Tech MAX 560 – modelový rok 2024', [2024, 2024], 'tmax24', [['562 cm³ dvouválec', 'petrol', [35]]], 'scooter', '2024');

  add('honda', 'cbf125_2011', 'CBF125 – modelový rok 2011', [2011, 2011], 'cbf12511', [['124,7 cm³ jednoválec', 'petrol', [8.3]]], 'motorcycle', '2011');
  add('honda', 'nc700s_2012', 'NC700S – modelový rok 2012', [2012, 2012], 'nc70012', [['670 cm³ dvouválec', 'petrol', [35]]], 'motorcycle', '2012');
  add('honda', 'nc700x_2012', 'NC700X – modelový rok 2012', [2012, 2012], 'nc70012', [['670 cm³ dvouválec', 'petrol', [35]]], 'motorcycle', '2012');
  add('honda', 'nc750x_2014', 'NC750X – modelový rok 2014', [2014, 2014], 'nc75014', [['745 cm³ dvouválec', 'petrol', [40.3]]], 'motorcycle', '2014');
  add('honda', 'sh150_2020', 'SH150i – modelový rok 2020', [2020, 2020], 'sh15020', [['156,9 cm³ eSP+', 'petrol', [12.4]]], 'scooter', '2020');
  add('honda', 'pcx125_2025', 'PCX125 – modelový rok 2025', [2025, 2025], 'pcx25', [['125 cm³ eSP+', 'petrol', [9.2]]], 'scooter', '2025');
})();
