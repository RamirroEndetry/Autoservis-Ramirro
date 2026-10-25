// Explicit model/body mapping reviewed against PEMA on 2026-10-25.
// No fuzzy model-name matching; keys used in saved vehicles remain unchanged.
module.exports = {
 skoda: {
  octavia_1:[1904,3560],octavia_2:[5120,5162],octavia_3:[11195,11196],fabia_1:[4383,4727,4777],fabia_2:[6363,6395],fabia_3:[13331,13332],superb_2:[7588,8495],superb_3:[14018,14382],kodiaq:[37164],karoq:[38149],rapid:[10587,11519],yeti:[8486],roomster:[5507],
  fabia_3_2017:[13331,13332],octavia_3_2017:[11195,11196],octavia_4_2020:[40538,40412],superb_3_2016:[14018,14382],rapid_2017:[10587,11519],karoq_2017:[38149],kodiaq_2017:[37164]
 },
 vw: {
  golf_4:[1994,1995,3884,4125],golf_5:[4991,6245,5423],golf_6:[7873],golf_7:[10585,11221],polo_9n:[4804],passat_b5:[1568,1907,4736,4737],passat_b6:[5398,5427,7375],passat_b7:[9003,9004],passat_b8:[12917,12918],tiguan_1:[6397],touran_1:[4954,10449],touareg_1:[4920],transporter_t5:[4988,5004,5005],
  golf_4_hatch:[1994],golf_4_variant:[1995],golf_4_gti:[1994],golf_5_hatch:[4991],golf_5_variant:[6245],golf_5_gti:[4991],golf_6_hatch:[7873],golf_6_variant:[8442],golf_6_gti:[7873],golf_7_hatch:[10585],passat_b5_3b:[1568,1907],passat_b5_3bg:[4736,4737],passat_b6_sourced:[5398,5427],passat_b7_sourced:[9003,9004]
 },
 audi: {
  a3_8p:[4955,5143],a3_8v:[10253,10459,11282],a4_b6:[4731,4797],a4_b7:[5376,5377],a4_b8:[6418,6988,8031],a4_b9:[14695,14696,36378],a6_c5:[1891,3395,4632],a6_c6:[5110,5381,5546],a6_c7:[9154,9627,10161],q5_8r:[7534],q7_4l:[5461],
  a4_b9_2019:[14695,14696],s4_b9_2019:[14695,14696],a3_8y_phev2020:[40531],q3_phev2021:[38997],sq5_2021:[37161]
 },
 ford: {
  focus_3_fl:[9155,9157],focus_4:[38611,38774],fiesta_7:[37787],fusion_eu:[4885],mondeo_5:[13128,13129,13127],kuga_2_15:[11097],c_max_2_fl:[8995],grand_c_max_2_fl:[8996],s_max_2:[13884],galaxy_3:[13969],ecosport_2:[11479],ka_2:[8000],ka_plus_fl:[13141],puma_crossover:[39675],puma_2024:[39675],mustang_6:[13370,13371],ranger_t6_fl:[9853],transit_ecoblue:[11953,11952],transit_custom_ecoblue:[11095,11096],tourneo_connect_2:[11574],tourneo_custom_ecoblue:[11094]
 },
 // Motorcycle groups span many displacements: exact filters are mandatory.
 honda: {
  cbf_600_2007:{ids:[12260],pattern:'^CBF 600'},cbf_1000_2007:{ids:[12260],pattern:'^CBF 1000$'},cbf_500_2007:{ids:[12260],pattern:'^CBF 500'},cbf_125_250_2007:{ids:[12260],pattern:'^CBF (125|250)'},hornet_600:{ids:[36220],pattern:'^CB 600'},nc700_750:{ids:[12282],pattern:'^NC (700|750) X'},pcx_125:{ids:[12290],pattern:'^PCX ?125'},sh_125_150:{ids:[12298],pattern:'^SH (125|150)'},
  cbf125_2011:{ids:[12260],pattern:'^CBF 125'},nc700s_2012:{ids:[12282],pattern:'^NC 700 S$'},nc700x_2012:{ids:[12282],pattern:'^NC 700 X$'},nc750x_2014:{ids:[12282],pattern:'^NC 750 X$'},sh150_2020:{ids:[12298],pattern:'^SH 150'},pcx125_2025:{ids:[12290],pattern:'^PCX ?125'}
 },
 yamaha: {
  xmax_250_2007:{ids:[12720],pattern:'^X-Max 250'},xmax_125:{ids:[12720],pattern:'^X-Max 125'},tmax_500:{ids:[12704],pattern:'^TMAX 500'},mt07:{ids:[12694],pattern:'^MT-07$'},fz6:{ids:[12687],pattern:'^FZ 6(?: |$)'},xt660:{ids:[12722],pattern:'^XT 660 [RX]$'},
  mt07_2014:{ids:[12694],pattern:'^MT-07$'},mt07_2024:{ids:[12694],pattern:'^MT-07$'},xmax300_2024:{ids:[12720],pattern:'^X-Max 300'},tmax_2024:{ids:[12704],pattern:'^TMAX 560 Tech Max$'}
 }
};
