/* European Ford catalogue. Source editions are snapshots, not a VIN decoder.
 * Years describe model phases; exact national/year availability can differ.
 * No oil specification or fill quantity is inferred from engine displacement.
 */
const FORD_SOURCES = {
  focus3: ['Ford Focus III, evropské technické údaje po modernizaci', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Focus/FordFocus_TechSpecs_EU.pdf'],
  focus4: ['Ford Focus IV, technické údaje 2018', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Focus/2018/FORD_FOCUS_2018_MediaDrive_TechSpecs_EU.pdf'],
  fiesta: ['Ford Fiesta, technické údaje 2017', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Fiesta/FordFiesta2017_FiestaDrive_TechSpecs_EU.pdf'],
  fusion: ['Ford Fusion, evropský katalog 2007', 'https://www.xr793.com/wp-content/uploads/2022/09/2007-Ford-Fusion-UK.pdf'],
  mondeo: ['Ford Mondeo, evropské technické údaje', 'https://media.lincoln.com/content/dam/fordmedia/Europe/documents/productReleases/Mondeo/FordMondeo_TechnicalSpecifications_EU.pdf'],
  kuga: ['Ford Kuga II, evropské technické údaje', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Kuga/FordKuga_TechnicalSpecifications_EU.pdf'],
  cmax: ['Ford C-MAX, evropské technické údaje po modernizaci', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/C-Max/FordC-MAX_TechnicalSpecifications_EU.pdf'],
  smax: ['Ford S-MAX, nabídka motorů 2015', 'https://media.ford.com/content/fordmedia/feu/nl/nl/news/2015/03/30/ford-presenteert-op-autorai-2015-vier-nederlandse-primeurs--actu.html'],
  galaxy: ['Ford Galaxy, technické údaje 2015', 'https://media.ford.com/content/dam/fordmedia/Europe/gb/2015/06/FordGalaxy_TechnicalSpecifications_240615.pdf'],
  ecosport: ['Ford EcoSport, evropské technické údaje', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/EcoSport/EcoSportSpecifications_EU.pdf'],
  ka: ['Ford Ka, evropský katalog 2011', 'https://xr793.com/wp-content/uploads/2022/09/2011-Ford-Ka-UK.pdf'],
  kaplus: ['Ford KA+, technické údaje 2018', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Ka%2B/2018FordKA%2B_TechSpecs_EU.pdf'],
  puma: ['Ford Puma, evropská nabídka 2020', 'https://media.ford.com/content/fordmedia/feu/it/it/news/2020/01/13/innovative-new-ford-puma-fuses-mild-hybrid-efficiency--best-in-c.html'],
  puma24: ['Ford Puma, technické údaje 2024', 'https://media.ford.com/content/dam/fordmedia/Europe/en/2024/02/NewPuma/2024Ford_Puma_TechSpec.pdf'],
  mustang: ['Ford Performance, evropská nabídka 2016', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Focus%20RS/FocusRS_Production_EU.pdf'],
  ranger: ['Ford Ranger, evropský katalog s motory Duratorq', 'https://www.ford.co.uk/content/dam/guxeu/uk/documents/feature-pdfs/FT-Ranger.pdf'],
  transit: ['Ford Transit a Transit Custom, EcoBlue 2016', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/Transit/Transit2016_MediaDrive_EU.pdf'],
  connect: ['Ford Tourneo Connect, evropské technické údaje 1.6 TDCi', 'https://media.ford.com/content/dam/fordmedia/Europe/documents/productReleases/TourneoConnect/FordTourneoConnect-Specifications_EU.pdf'],
  custom: ['Ford Tourneo Custom, ceník 26. 8. 2016', 'https://media.ford.com/content/dam/fordmedia/Europe/de/Produkte/Nutzfahrzeuge/Campingmobile/Preisliste%20Ford%20Tourneo%20Custom%20Basis%20Euroline.pdf']
};

(() => {
  const legacy = VEHICLE_DB.ford.models;
  const models = {};
  const add = (key, name, years, source, groups) => {
    models[key] = {
      name, kind: 'car', years, source,
      engines: groups.flatMap(([label, fuel, powers]) => powers.map(power => ({
        name: label + ' ' + power + ' kW', fuel, power, source
      })))
    };
  };
  add('focus_3_fl', 'Focus III – modernizace', [2014, 2018], 'focus3', [
    ['1.0 EcoBoost', 'petrol', [74, 92]], ['1.5 EcoBoost', 'petrol', [110, 134]],
    ['1.6 Ti-VCT', 'petrol', [63, 77, 92]], ['1.5 TDCi', 'diesel', [70, 77, 88]],
    ['1.6 TDCi', 'diesel', [70, 84]], ['2.0 TDCi', 'diesel', [110]]
  ]);
  add('focus_4', 'Focus IV – před modernizací', [2018, 2021], 'focus4', [
    ['1.0 EcoBoost', 'petrol', [63, 74, 92]], ['1.5 EcoBoost', 'petrol', [110, 134]],
    ['1.5 EcoBlue', 'diesel', [70, 88]], ['2.0 EcoBlue', 'diesel', [110]]
  ]);
  add('fiesta_7', 'Fiesta – generace od 2017, před modernizací', [2017, 2021], 'fiesta', [
    ['1.1 Ti-VCT', 'petrol', [52, 63]], ['1.0 EcoBoost', 'petrol', [74, 92, 103]],
    ['1.5 TDCi', 'diesel', [63, 88]]
  ]);
  add('fusion_eu', 'Fusion – evropské MPV', [2002, 2012], 'fusion', [
    ['1.4 Duratec', 'petrol', [59]], ['1.6 Duratec', 'petrol', [74]],
    ['1.4 TDCi', 'diesel', [50]], ['1.6 TDCi', 'diesel', [66]]
  ]);
  add('mondeo_5', 'Mondeo – generace od 2014, před modernizací', [2014, 2018], 'mondeo', [
    ['1.0 EcoBoost', 'petrol', [92]], ['1.5 EcoBoost', 'petrol', [118]],
    ['2.0 EcoBoost', 'petrol', [149, 177]], ['1.5 TDCi', 'diesel', [88]],
    ['2.0 TDCi', 'diesel', [110, 132]]
  ]);
  add('kuga_2_15', 'Kuga II – motory od 2015', [2015, 2019], 'kuga', [
    ['1.5 EcoBoost', 'petrol', [88, 110, 134]], ['2.0 TDCi', 'diesel', [88, 110, 132]]
  ]);
  add('c_max_2_fl', 'C-MAX II – modernizace', [2015, 2019], 'cmax', [
    ['1.0 EcoBoost', 'petrol', [74, 92]], ['1.5 EcoBoost', 'petrol', [110, 134]],
    ['1.6 Ti-VCT', 'petrol', [63, 88]], ['1.5 TDCi', 'diesel', [70, 88]], ['1.5 TDCi ECOnetic', 'diesel', [77]],
    ['1.6 TDCi', 'diesel', [84]], ['2.0 TDCi', 'diesel', [110, 125]]
  ]);
  add('grand_c_max_2_fl', 'Grand C-MAX – modernizace', [2015, 2019], 'cmax', [
    ['1.0 EcoBoost', 'petrol', [74, 92]], ['1.5 EcoBoost', 'petrol', [110, 134]],
    ['1.6 Ti-VCT', 'petrol', [92]], ['1.5 TDCi', 'diesel', [70, 88]],
    ['1.6 TDCi', 'diesel', [84]], ['2.0 TDCi', 'diesel', [110, 125]]
  ]);
  add('s_max_2', 'S-MAX II – původní nabídka', [2015, 2018], 'smax', [
    ['1.5 EcoBoost', 'petrol', [118]], ['2.0 EcoBoost', 'petrol', [177]],
    ['2.0 TDCi', 'diesel', [88, 110, 132]]
  ]);
  add('galaxy_3', 'Galaxy III – původní nabídka', [2015, 2018], 'galaxy', [
    ['1.5 EcoBoost', 'petrol', [118]], ['2.0 EcoBoost', 'petrol', [177]],
    ['2.0 TDCi', 'diesel', [88, 110, 132]], ['2.0 TDCi Bi-Turbo', 'diesel', [154]]
  ]);
  add('ecosport_2', 'EcoSport II – původní evropská nabídka', [2014, 2017], 'ecosport', [
    ['1.0 EcoBoost', 'petrol', [92]], ['1.5 Ti-VCT', 'petrol', [82]]
  ]);
  add('ka_2', 'Ka II', [2008, 2016], 'ka', [
    ['1.2 Duratec', 'petrol', [51]], ['1.3 Duratorq TDCi', 'diesel', [55]]
  ]);
  add('ka_plus_fl', 'KA+ / KA+ Active – modernizace', [2018, 2020], 'kaplus', [
    ['1.2 Ti-VCT', 'petrol', [63]], ['1.5 TDCi', 'diesel', [70]]
  ]);
  add('puma_crossover', 'Puma – crossover, původní nabídka', [2019, 2023], 'puma', [
    ['1.0 EcoBoost', 'petrol', [92]], ['1.0 EcoBoost mHEV', 'hybrid', [92, 114]]
  ]);
  add('puma_2024', 'Puma – modernizace 2024', [2024, 2026], 'puma24', [
    ['1.0 EcoBoost mHEV', 'hybrid', [92, 114]], ['1.0 EcoBoost mHEV ST Powershift', 'hybrid', [125]]
  ]);
  add('mustang_6', 'Mustang VI – evropská verze před modernizací', [2015, 2017], 'mustang', [
    ['2.3 EcoBoost', 'petrol', [233]], ['5.0 V8 GT', 'petrol', [310]]
  ]);
  add('ranger_t6_fl', 'Ranger T6 – modernizace, Duratorq', [2016, 2018], 'ranger', [
    ['2.2 Duratorq TDCi', 'diesel', [96, 118]], ['3.2 Duratorq TDCi', 'diesel', [147]]
  ]);
  add('transit_ecoblue', 'Transit – první nabídka EcoBlue', [2016, 2019], 'transit', [
    ['2.0 EcoBlue', 'diesel', [77, 96, 125]]
  ]);
  add('transit_custom_ecoblue', 'Transit Custom I – první nabídka EcoBlue', [2016, 2018], 'transit', [
    ['2.0 EcoBlue', 'diesel', [77, 96, 125]]
  ]);
  add('tourneo_connect_2', 'Tourneo Connect II / Grand – 1.6 TDCi', [2013, 2015], 'connect', [
    ['1.6 Duratorq TDCi', 'diesel', [55, 70, 85]]
  ]);
  add('tourneo_custom_ecoblue', 'Tourneo Custom I – první nabídka EcoBlue', [2016, 2018], 'custom', [
    ['2.0 EcoBlue TDCi', 'diesel', [96, 125]]
  ]);
  // Keep every old model key valid without silently assigning a generation/engine.
  for (const [key, model] of Object.entries(legacy)) {
    models[key] = { ...model, legacy: key !== 'other' };
  }
  VEHICLE_DB.ford.models = models;
})();
