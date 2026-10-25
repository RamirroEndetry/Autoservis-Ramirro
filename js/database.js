/**
 * Servisní kniha vozidel a motocyklů
 * ------------------------------------------------------------------
 * Katalog značek, modelů a motorizací + strukturovaný katalog
 * servisních úkonů a doporučených servisních intervalů.
 *
 * Klíčové pojmy:
 *   brand.type ... "car" | "moto"                     (skupina v UI)
 *   model.kind ... "car" | "motorcycle" | "scooter"
 *        Rozlišuje nabízené úkony: skútr má variátor, motocykl řetěz,
 *        automobil kabinový filtr a rozvody.
 */

const VEHICLE_DB = {
  /* ================================ AUTOMOBILY ============================ */
  ford: {
    type: "car",
    name: "Ford",
    logo: "assets/ford.svg",
    color: "#287bc1",
    // Bez omezení generace; konkrétní motor lze uvést v poli Kód motoru.
    // Specifikace oleje se bez znalosti konkrétní motorizace nedoplňují.
    models: {
      focus: { name: "Focus", kind: "car", engines: [] },
      mondeo: { name: "Mondeo", kind: "car", engines: [] },
      fiesta: { name: "Fiesta", kind: "car", engines: [] },
      fusion: { name: "Fusion", kind: "car", engines: [] },
      kuga: { name: "Kuga", kind: "car", engines: [] },
      puma: { name: "Puma", kind: "car", engines: [] },
      c_max: { name: "C-MAX", kind: "car", engines: [] },
      s_max: { name: "S-MAX", kind: "car", engines: [] },
      galaxy: { name: "Galaxy", kind: "car", engines: [] },
      ecosport: { name: "EcoSport", kind: "car", engines: [] },
      ka: { name: "Ka", kind: "car", engines: [] },
      mustang: { name: "Mustang", kind: "car", engines: [] },
      ranger: { name: "Ranger", kind: "car", engines: [] },
      transit: { name: "Transit", kind: "car", engines: [] },
      transit_custom: { name: "Transit Custom", kind: "car", engines: [] },
      tourneo_connect: { name: "Tourneo Connect", kind: "car", engines: [] },
      tourneo_custom: { name: "Tourneo Custom", kind: "car", engines: [] },
      other: { name: "Jiný model Ford", kind: "car", engines: [] }
    }
  },
  skoda: {
    type: "car",
    name: "Škoda",
    logo: "assets/skoda.png",
    color: "#4ba82e",
    models: {
      octavia_1: {
        name: "Octavia I (1U)", kind: "car", years: [1996, 2010],
        engines: [
          { name: "1.9 TDI 66 kW (AGR, ALH)", fuel: "diesel", oilSpec: "5W-40 VW 505.00 / 505.01", oilCapacity: "4,3 L" },
          { name: "1.9 TDI 81 kW (AHF, ASV)", fuel: "diesel", oilSpec: "5W-40 VW 505.00 / 505.01", oilCapacity: "4,3 L" },
          { name: "1.9 TDI PD 74 kW (ATD, AXR)", fuel: "diesel", oilSpec: "5W-40 VW 505.01 (PD)", oilCapacity: "4,3 L" },
          { name: "1.9 TDI PD 96 kW (ASZ)", fuel: "diesel", oilSpec: "5W-40 VW 505.01 (PD)", oilCapacity: "4,3 L" },
          { name: "1.6 MPI 74/75 kW (AKL, AVU, BFQ)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,5 L" },
          { name: "1.8 T 20V 110 kW (AGU, AUM)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,5 L" },
          { name: "1.8 T RS 132 kW (AUQ)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,5 L" }
        ]
      },
      octavia_2: {
        name: "Octavia II (1Z)", kind: "car", years: [2004, 2013],
        engines: [
          { name: "1.9 TDI PD 77 kW (BKC, BXE, BLS)", fuel: "diesel", oilSpec: "5W-30 VW 507.00 / 5W-40 505.01", oilCapacity: "3,8 L" },
          { name: "2.0 TDI PD 103 kW 16V (BKD)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "3,8 L" },
          { name: "2.0 TDI PD 103 kW 8V (BMM, DPF)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "3,8 L" },
          { name: "2.0 TDI CR 103 kW (CFHC, CLCB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "2.0 TDI RS 125 kW (BMN, CEGA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.6 TDI CR 77 kW (CAYC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.6 MPI 75 kW (BSE, BSF)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,5 L" },
          { name: "1.4 TSI 90 kW (CAXA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,6 L" },
          { name: "1.8 TSI 118 kW (CDAA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" },
          { name: "2.0 TFSI RS 147 kW (BWA, CCZA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" }
        ]
      },
      octavia_3: {
        name: "Octavia III (5E)", kind: "car", years: [2012, 2020],
        engines: [
          { name: "1.6 TDI CR 77/81/85 kW (CLHA, CXXB, DDYA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "2.0 TDI CR 110 kW (CKFC, CRMB, DFHA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "2.0 TDI RS 135 kW (CUPA, CUNA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "1.4 TSI 103/110 kW (CHPA, CZDA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,0 L" },
          { name: "1.5 TSI Evo 110 kW (DADA, DPCA)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,3 L" },
          { name: "2.0 TSI RS 162/169/180 kW (CHHA, DLBA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "5,7 L" }
        ]
      },
      fabia_1: {
        name: "Fabia I (6Y)", kind: "car", years: [1999, 2007],
        engines: [
          { name: "1.2 HTP 12V 47 kW (AZQ, BME)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "2,8 L" },
          { name: "1.4 MPI 50 kW (AME, AQW)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,0 L" },
          { name: "1.4 16V 55/74 kW (BBY, BBZ)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "3,2 L" },
          { name: "1.9 TDI PD 74 kW (ATD, AXR)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "4,3 L" },
          { name: "1.9 TDI RS 96 kW (ASZ, BLT)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "4,3 L" }
        ]
      },
      fabia_2: {
        name: "Fabia II (5J)", kind: "car", years: [2007, 2014],
        engines: [
          { name: "1.2 HTP 51 kW (CGPA)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "2,8 L" },
          { name: "1.2 TSI 63/77 kW (CBZA, CBZB)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,9 L" },
          { name: "1.4 16V 63 kW (BXW, CGGB)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "3,2 L" },
          { name: "1.6 TDI CR 55/66/77 kW (CAYA, CAYB, CAYC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" }
        ]
      },
      fabia_3: {
        name: "Fabia III (NJ)", kind: "car", years: [2014, 2020],
        engines: [
          { name: "1.0 MPI 44/55 kW (CHYA, CHYB)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,6 L" },
          { name: "1.0 TSI 70/81/85 kW (CHZC, DKRF)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,0 L" },
          { name: "1.4 TDI CR 66/77/81 kW (CUSB, CUTA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" }
        ]
      },
      superb_2: {
        name: "Superb II (3T)", kind: "car", years: [2008, 2015],
        engines: [
          { name: "2.0 TDI CR 103/125 kW (CFFB, CFGB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.8 TSI 118 kW (CDAA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" },
          { name: "2.0 TSI 147 kW (CCZA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" },
          { name: "3.6 V6 FSI 4x4 191 kW (CDVA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "5,5 L" }
        ]
      },
      superb_3: {
        name: "Superb III (3V)", kind: "car", years: [2015, 2020],
        engines: [
          { name: "2.0 TDI CR 110/140 kW (CRLB, DFHA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "1.4 TSI 110 kW (CZDA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,0 L" },
          { name: "2.0 TSI 162/206 kW (CHHA, CJXA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "5,7 L" }
        ]
      },
      kodiaq: {
        name: "Kodiaq (NS)", kind: "car", years: [2016, 2020],
        engines: [
          { name: "2.0 TDI 110/140/176 kW (DFGA, DFHA, CUAA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "1.4 / 1.5 TSI 110 kW (CZDA, DADA)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,3 L" }
        ]
      },
      karoq: {
        name: "Karoq (NU)", kind: "car", years: [2017, 2020],
        engines: [
          { name: "1.5 TSI 110 kW (DADA, DPCA)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,3 L" },
          { name: "2.0 TDI 110/140 kW (DFFA, DFHA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" }
        ]
      },
      rapid: {
        name: "Rapid / Spaceback (NH)", kind: "car", years: [2012, 2019],
        engines: [
          { name: "1.2 TSI 63/77/81 kW (CBZA, CBZB, CJZD)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,9 L" },
          { name: "1.6 TDI 66/77/85 kW (CAYC, CXZB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" }
        ]
      },
      yeti: {
        name: "Yeti (5L)", kind: "car", years: [2009, 2017],
        engines: [
          { name: "1.2 TSI 77/81 kW (CBZB, CYVB)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,9 L" },
          { name: "2.0 TDI 81/103/125 kW (CFHC, CFJA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" }
        ]
      },
      roomster: {
        name: "Roomster (5J)", kind: "car", years: [2006, 2015],
        engines: [
          { name: "1.2 TSI 63/77 kW (CBZA, CBZB)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,9 L" },
          { name: "1.6 TDI CR 66/77 kW (CAYB, CAYC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.9 TDI PD 77 kW (BSW, BLS)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "3,8 L" }
        ]
      }
    }
  },

  vw: {
    type: "car",
    name: "Volkswagen",
    logo: "assets/vw.svg",
    color: "#1e88e5",
    models: {
      golf_4: {
        name: "Golf IV / Bora (1J)", kind: "car", years: [1997, 2006],
        engines: [
          { name: "1.9 TDI 66/81 kW (AGR, ALH, AHF, ASV)", fuel: "diesel", oilSpec: "5W-40 VW 505.00", oilCapacity: "4,3 L" },
          { name: "1.9 TDI PD 74/96/110 kW (ATD, AXR, ASZ, ARL)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "4,3 L" },
          { name: "1.6 8V/16V 74/77 kW (AKL, AZD, BCB)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "3,5 L" },
          { name: "1.8 T 20V 110/132 kW (AGU, AUM, AUQ)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,5 L" }
        ]
      },
      golf_5: {
        name: "Golf V / Jetta (1K)", kind: "car", years: [2003, 2009],
        engines: [
          { name: "1.9 TDI PD 77 kW (BKC, BXE, BLS)", fuel: "diesel", oilSpec: "5W-40 505.01 / 5W-30 507.00", oilCapacity: "3,8 L" },
          { name: "2.0 TDI PD 103/125 kW (BKD, BMM, BMN)", fuel: "diesel", oilSpec: "5W-40 505.01 / 5W-30 507.00", oilCapacity: "3,8 L" },
          { name: "1.6 8V 75 kW (BSE, BSF)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,5 L" },
          { name: "2.0 TFSI GTI 147 kW (BWA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" }
        ]
      },
      golf_6: {
        name: "Golf VI (5K)", kind: "car", years: [2008, 2013],
        engines: [
          { name: "1.6 TDI CR 77 kW (CAYC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "2.0 TDI CR 103/125 kW (CFFB, CBBB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.4 TSI 90/118 kW (CAXA, CAVD)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,6 L" }
        ]
      },
      golf_7: {
        name: "Golf VII (5G)", kind: "car", years: [2012, 2020],
        engines: [
          { name: "1.6 TDI 77/81/85 kW (CLHA, CXXB, DDYA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "2.0 TDI 110/135 kW (CKFC, CUNA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "1.4 / 1.5 TSI 90/110 kW (CZDA, DADA)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,3 L" },
          { name: "2.0 TSI GTI / R 162/221 kW (CHHA, CJXC)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "5,7 L" }
        ]
      },
      polo_9n: {
        name: "Polo IV (9N)", kind: "car", years: [2001, 2009],
        engines: [
          { name: "1.2 6V/12V 40/47 kW (AWY, BME)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "2,8 L" },
          { name: "1.4 16V 55/74 kW (BBY, BKY)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "3,2 L" },
          { name: "1.9 TDI PD 74/96 kW (ATD, ASZ)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "4,3 L" }
        ]
      },
      passat_b5: {
        name: "Passat B5 / B5.5 (3B, 3BG)", kind: "car", years: [1996, 2005],
        engines: [
          { name: "1.9 TDI 81 kW / PD 74/96 kW (AFN, AVB, AWX, AVF)", fuel: "diesel", oilSpec: "5W-40 VW 505.00 / 505.01", oilCapacity: "3,8 L" },
          { name: "2.5 V6 TDI 110/120 kW (AKN, BDG)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "5,4 L" },
          { name: "1.8 T 20V 110 kW (AWT)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,0 L" }
        ]
      },
      passat_b6: {
        name: "Passat B6 / CC (3C)", kind: "car", years: [2005, 2010],
        engines: [
          { name: "1.9 TDI PD 77 kW (BKC, BXE, BLS)", fuel: "diesel", oilSpec: "5W-40 505.01 / 5W-30 507.00", oilCapacity: "3,8 L" },
          { name: "2.0 TDI PD 103/125 kW (BKP, BMP, BMR)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "3,8 L" },
          { name: "2.0 TDI CR 103/125 kW (CBAB, CBBB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" }
        ]
      },
      passat_b7: {
        name: "Passat B7 (36)", kind: "car", years: [2010, 2014],
        engines: [
          { name: "2.0 TDI CR 103/130 kW (CFFB, CFGC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.8 TSI 118 kW (CDAA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" }
        ]
      },
      passat_b8: {
        name: "Passat B8 (3G)", kind: "car", years: [2014, 2020],
        engines: [
          { name: "2.0 TDI CR 110/140/176 kW (CRLB, DFHA, CUAA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "1.5 TSI 110 kW (DADA, DPCA)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,3 L" },
          { name: "2.0 TSI 162/206 kW (CHHA, CJXA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "5,7 L" }
        ]
      },
      tiguan_1: {
        name: "Tiguan I (5N)", kind: "car", years: [2007, 2016],
        engines: [
          { name: "2.0 TDI CR 103/125 kW (CBAB, CFFB, CBBB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "2.0 TSI 125/155 kW (CAWA, CCZB)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" }
        ]
      },
      touran_1: {
        name: "Touran I (1T)", kind: "car", years: [2003, 2015],
        engines: [
          { name: "1.9 TDI PD 77 kW (BXE, BLS)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "3,8 L" },
          { name: "2.0 TDI 103/125 kW (BKD, CFHC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.4 TSI 103/125 kW (CAVB, CTHD)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "3,6 L" }
        ]
      },
      touareg_1: {
        name: "Touareg I (7L)", kind: "car", years: [2002, 2010],
        engines: [
          { name: "2.5 R5 TDI 128 kW (BAC, BPE)", fuel: "diesel", oilSpec: "0W-30 VW 506.01", oilCapacity: "8,9 L" },
          { name: "3.0 V6 TDI 165/176 kW (BKS, CASA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "8,3 L" }
        ]
      },
      transporter_t5: {
        name: "Transporter / Multivan T5 (7H)", kind: "car", years: [2003, 2015],
        engines: [
          { name: "1.9 TDI PD 77 kW (AXB, BRS)", fuel: "diesel", oilSpec: "5W-40 505.01 / 5W-30 507.00", oilCapacity: "5,8 L" },
          { name: "2.5 R5 TDI 96/128 kW (AXD, AXE, BNZ, BPC)", fuel: "diesel", oilSpec: "0W-30 506.01 / 5W-30 507.00 (DPF)", oilCapacity: "8,9 L" },
          { name: "2.0 TDI CR 103/132 kW (CCHA, CFCA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "7,0 L" }
        ]
      }
    }
  },

  audi: {
    type: "car",
    name: "Audi",
    logo: "assets/audi.svg",
    color: "#bb0a30",
    models: {
      a3_8p: {
        name: "A3 (8P)", kind: "car", years: [2003, 2012],
        engines: [
          { name: "1.9 TDI PD 77 kW (BKC, BXE, BLS)", fuel: "diesel", oilSpec: "5W-40 505.01 / 5W-30 507.00", oilCapacity: "3,8 L" },
          { name: "2.0 TDI PD / CR 103/125 kW (BKD, BMM, CBBB, CFGB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,3 L" },
          { name: "1.8 TFSI 118 kW (BYT, BZB, CDAA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" },
          { name: "2.0 TFSI 147 kW (AXX, BWA, CCZA)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" }
        ]
      },
      a3_8v: {
        name: "A3 (8V)", kind: "car", years: [2012, 2020],
        engines: [
          { name: "1.6 TDI 77/81/85 kW (CLHA, CXXB, DDYA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "2.0 TDI 110/135 kW (CRBC, CRLB, CUNA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "1.4 / 1.5 TFSI 110 kW (CZDA, DADA)", fuel: "petrol", oilSpec: "0W-20 VW 508.00", oilCapacity: "4,3 L" }
        ]
      },
      a4_b6: {
        name: "A4 (B6)", kind: "car", years: [2000, 2004],
        engines: [
          { name: "1.9 TDI PD 74/96 kW (AVB, AWX, AVF)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "3,8 L" },
          { name: "2.5 V6 TDI 120/132 kW (BDG, BAU)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "5,4 L" },
          { name: "1.8 T 20V 110/120/140 kW (AVJ, BFB, BEX)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,0 L" }
        ]
      },
      a4_b7: {
        name: "A4 (B7)", kind: "car", years: [2004, 2008],
        engines: [
          { name: "2.0 TDI PD 103/125 kW (BPW, BRD)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "3,8 L" },
          { name: "3.0 V6 TDI 150/171 kW (BKN, ASB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "8,2 L" },
          { name: "2.0 TFSI 147/162 kW (BGB, BWE)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,5 L" }
        ]
      },
      a4_b8: {
        name: "A4 (B8) / Allroad", kind: "car", years: [2007, 2015],
        engines: [
          { name: "2.0 TDI CR 105/125/130 kW (CAGA, CAHA, CGLC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "5,0 L" },
          { name: "3.0 V6 TDI CR 176/180 kW (CCWA, CDUC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "7,7 L" },
          { name: "1.8 / 2.0 TFSI 118/155 kW (CDHA, CDNC)", fuel: "petrol", oilSpec: "5W-30 VW 504.00", oilCapacity: "4,6 L" }
        ]
      },
      a4_b9: {
        name: "A4 (B9) / Allroad", kind: "car", years: [2015, 2020],
        engines: [
          { name: "2.0 TDI CR 110/140/150 kW (DEUA, DETA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "4,7 L" },
          { name: "3.0 V6 TDI CR 200 kW (CRTC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "6,1 L" },
          { name: "2.0 TFSI 140/185 kW (CVKB, CYRB)", fuel: "petrol", oilSpec: "0W-20 508.00 / 5W-30 504.00", oilCapacity: "5,2 L" }
        ]
      },
      a6_c5: {
        name: "A6 (C5) / Allroad", kind: "car", years: [1997, 2005],
        engines: [
          { name: "1.9 TDI PD 96 kW (AVF, AWX)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "4,3 L" },
          { name: "2.5 V6 TDI 114/132 kW (AKE, BDH)", fuel: "diesel", oilSpec: "5W-40 VW 505.01", oilCapacity: "5,4 L" },
          { name: "1.8 T 20V 110/140 kW (AWT, AMB)", fuel: "petrol", oilSpec: "5W-40 VW 502.00", oilCapacity: "4,0 L" }
        ]
      },
      a6_c6: {
        name: "A6 (C6) / Allroad", kind: "car", years: [2004, 2011],
        engines: [
          { name: "2.0 TDI CR 125 kW (CAHA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "5,0 L" },
          { name: "2.7 / 3.0 V6 TDI 140/176 kW (BPP, ASB, CDYA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "8,2 L" }
        ]
      },
      a6_c7: {
        name: "A6 (C7) / Allroad", kind: "car", years: [2011, 2018],
        engines: [
          { name: "2.0 TDI CR 130/140 kW (CGLC, CNHA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "5,0 L" },
          { name: "3.0 V6 TDI CR 180/200/235 kW (CDUC, CGQB)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "6,4 L" }
        ]
      },
      q5_8r: {
        name: "Q5 (8R)", kind: "car", years: [2008, 2017],
        engines: [
          { name: "2.0 TDI CR 125/130 kW (CAHA, CGLC)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "5,0 L" },
          { name: "3.0 V6 TDI CR 176/180 kW (CCWA, CDUD)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "7,7 L" }
        ]
      },
      q7_4l: {
        name: "Q7 (4L)", kind: "car", years: [2005, 2015],
        engines: [
          { name: "3.0 V6 TDI CR 171/176/180 kW (BUG, CASA, CRCA)", fuel: "diesel", oilSpec: "5W-30 VW 507.00", oilCapacity: "8,2 L" }
        ]
      }
    }
  },

  /* ================================ MOTOCYKLY ============================= */
  yamaha: {
    type: "moto",
    name: "Yamaha",
    logo: "assets/yamaha.png",
    color: "#e4002b",
    models: {
      xmax_250_2007: {
        name: "X-Max 250 (YP250R)", kind: "scooter", years: [2005, 2013],
        engines: [
          { name: "250 cm³ 4T jednoválec, 15,6 kW (G389E)", fuel: "petrol", oilSpec: "10W-40 4T JASO MA/MB", oilCapacity: "1,4 L (výměna 1,2 L)" }
        ]
      },
      xmax_125: {
        name: "X-Max 125 (YP125R)", kind: "scooter", years: [2006, 2017],
        engines: [
          { name: "125 cm³ 4T jednoválec, 10 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA/MB", oilCapacity: "1,15 L" }
        ]
      },
      tmax_500: {
        name: "T-Max 500 (SJ04, SJ08)", kind: "scooter", years: [2001, 2011],
        engines: [
          { name: "499 cm³ 4T dvouválec, 33 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "2,9 L" }
        ]
      },
      mt07: {
        name: "MT-07 (RM04, RM17)", kind: "motorcycle", years: [2014, 2020],
        engines: [
          { name: "689 cm³ 4T dvouválec CP2, 55 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "2,9 L (s filtrem 3,0 L)" }
        ]
      },
      fz6: {
        name: "FZ6 / Fazer S2 (RJ14)", kind: "motorcycle", years: [2004, 2010],
        engines: [
          { name: "600 cm³ 4T řadový čtyřválec, 72 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "2,9 L (s filtrem 3,1 L)" }
        ]
      },
      xt660: {
        name: "XT 660 R / X", kind: "motorcycle", years: [2004, 2016],
        engines: [
          { name: "660 cm³ 4T jednoválec, 35 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "2,6 L" }
        ]
      }
    }
  },

  honda: {
    type: "moto",
    name: "Honda",
    logo: "assets/honda.svg",
    color: "#cc0000",
    models: {
      cbf_600_2007: {
        name: "CBF 600 / 600S (PC38, PC43)", kind: "motorcycle", years: [2004, 2013],
        engines: [
          { name: "599 cm³ 4T řadový čtyřválec, 57 kW", fuel: "petrol", oilSpec: "10W-30 / 10W-40 4T JASO MA2", oilCapacity: "3,8 L (s filtrem 3,5 L)" }
        ]
      },
      cbf_1000_2007: {
        name: "CBF 1000 (SC58)", kind: "motorcycle", years: [2006, 2010],
        engines: [
          { name: "998 cm³ 4T řadový čtyřválec, 72 kW", fuel: "petrol", oilSpec: "10W-30 / 10W-40 4T JASO MA2", oilCapacity: "3,6 L" }
        ]
      },
      cbf_500_2007: {
        name: "CBF 500 (PC39)", kind: "motorcycle", years: [2004, 2008],
        engines: [
          { name: "499 cm³ 4T dvouválec, 42 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "3,1 L" }
        ]
      },
      cbf_125_250_2007: {
        name: "CBF 125 / CBF 250", kind: "motorcycle", years: [2004, 2014],
        engines: [
          { name: "125 cm³ 4T jednoválec, 8,3 kW", fuel: "petrol", oilSpec: "10W-30 / 10W-40 4T JASO MA2", oilCapacity: "1,0 L" },
          { name: "250 cm³ 4T jednoválec, 16 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "1,5 L" }
        ]
      },
      hornet_600: {
        name: "CB 600 F Hornet (PC36, PC41)", kind: "motorcycle", years: [2000, 2013],
        engines: [
          { name: "599 cm³ 4T řadový čtyřválec, 71–75 kW", fuel: "petrol", oilSpec: "10W-40 4T JASO MA2", oilCapacity: "3,5 L" }
        ]
      },
      nc700_750: {
        name: "NC 700 X / NC 750 X", kind: "motorcycle", years: [2012, 2020],
        engines: [
          { name: "670 / 745 cm³ 4T dvouválec, 35–40 kW", fuel: "petrol", oilSpec: "10W-30 4T JASO MA2", oilCapacity: "3,4 L" }
        ]
      },
      pcx_125: {
        name: "PCX 125 (JF28, JF56)", kind: "scooter", years: [2010, 2020],
        engines: [
          { name: "125 cm³ 4T jednoválec eSP, 8,6 kW", fuel: "petrol", oilSpec: "10W-30 4T JASO MB", oilCapacity: "0,8 L" }
        ]
      },
      sh_125_150: {
        name: "SH 125i / SH 150i", kind: "scooter", years: [2005, 2020],
        engines: [
          { name: "125 / 150 cm³ 4T jednoválec, 8–10 kW", fuel: "petrol", oilSpec: "10W-30 4T JASO MB", oilCapacity: "0,9 L" }
        ]
      }
    }
  }
};

/* Zpětná kompatibilita se starším názvem proměnné. */
const VAG_DATABASE = VEHICLE_DB;

/* ==========================================================================
   KATALOG SERVISNÍCH ÚKONŮ
   `applies` určuje, pro jaký druh stroje se úkon nabízí.
   ========================================================================== */

const KIND_LABELS = {
  car: "Automobil",
  motorcycle: "Motocykl",
  scooter: "Skútr"
};

const ALL_KINDS = ["car", "motorcycle", "scooter"];
const MOTO_KINDS = ["motorcycle", "scooter"];

const SERVICE_CATEGORIES = [
  {
    id: "oil",
    name: "Olej a filtry",
    icon: "fa-oil-can",
    hint: "Základní pravidelná údržba",
    items: [
      { id: "oil_engine", label: "Motorový olej + olejový filtr", applies: ALL_KINDS, detail: "oil" },
      { id: "oil_air_filter", label: "Vzduchový filtr", applies: ALL_KINDS },
      { id: "oil_cabin_filter", label: "Kabinový (pylový) filtr", applies: ["car"], detail: "cabin" },
      { id: "oil_fuel_filter", label: "Palivový filtr", applies: ["car"] },
      { id: "oil_fuel_filter_moto", label: "Palivový filtr / sítko v nádrži", applies: MOTO_KINDS }
    ]
  },
  {
    id: "brakes",
    name: "Brzdová soustava",
    icon: "fa-car-burst",
    hint: "Destičky, kotouče, kapalina",
    items: [
      { id: "brake_pads_front", label: "Přední brzdové destičky", applies: ALL_KINDS },
      { id: "brake_discs_front", label: "Přední brzdové kotouče", applies: ALL_KINDS },
      { id: "brake_pads_rear", label: "Zadní brzdové destičky", applies: ALL_KINDS },
      { id: "brake_discs_rear", label: "Zadní brzdové kotouče", applies: ALL_KINDS },
      { id: "brake_shoes_rear", label: "Zadní brzdové čelisti (bubnová brzda)", applies: ALL_KINDS },
      { id: "brake_fluid", label: "Brzdová kapalina – výměna a odvzdušnění", applies: ALL_KINDS },
      { id: "brake_hoses", label: "Brzdové hadice a potrubí", applies: ALL_KINDS },
      { id: "brake_caliper", label: "Brzdový třmen – renovace nebo výměna", applies: ALL_KINDS },
      { id: "brake_parking", label: "Ruční / parkovací brzda – seřízení, lanka", applies: ["car"] }
    ]
  },
  {
    id: "wheels",
    name: "Kola a pneumatiky",
    icon: "fa-dharmachakra",
    hint: "Pneu, vyvážení, geometrie",
    items: [
      { id: "tyre_front", label: "Pneumatika – přední", applies: ALL_KINDS },
      { id: "tyre_rear", label: "Pneumatika – zadní", applies: ALL_KINDS },
      { id: "tyre_swap", label: "Přezutí (letní / zimní sada)", applies: ["car"] },
      { id: "wheel_balance", label: "Vyvážení kol", applies: ALL_KINDS },
      { id: "wheel_geometry", label: "Geometrie / sbíhavost", applies: ["car"] },
      { id: "wheel_bearing", label: "Ložisko kola", applies: ALL_KINDS },
      { id: "wheel_valves", label: "Ventilky / senzory TPMS", applies: ["car"] }
    ]
  },
  {
    id: "engine",
    name: "Motor a zapalování",
    icon: "fa-gears",
    hint: "Svíčky, rozvody, chlazení",
    items: [
      { id: "eng_spark_plugs", label: "Zapalovací svíčky", applies: ALL_KINDS },
      { id: "eng_coils", label: "Zapalovací cívky / kabely", applies: ALL_KINDS },
      { id: "eng_glow_plugs", label: "Žhavicí svíčky (diesel)", applies: ["car"] },
      { id: "eng_valve_clearance", label: "Seřízení vůle ventilů", applies: ALL_KINDS },
      { id: "eng_timing_belt", label: "Rozvodový řemen + napínák + vodní pumpa", applies: ["car"] },
      { id: "eng_timing_chain", label: "Rozvodový řetěz + napínák", applies: ALL_KINDS },
      { id: "eng_aux_belt", label: "Drážkový (klínový) řemen + napínák", applies: ["car"] },
      { id: "eng_coolant", label: "Chladicí kapalina – výměna", applies: ALL_KINDS },
      { id: "eng_water_pump", label: "Vodní pumpa / termostat", applies: ALL_KINDS },
      { id: "eng_injectors", label: "Vstřikovače – čištění nebo výměna", applies: ["car"] },
      { id: "eng_carb", label: "Karburátor / throttle body – čištění", applies: MOTO_KINDS },
      { id: "eng_throttle_sync", label: "Synchronizace škrticích klapek", applies: ["motorcycle"] },
      { id: "eng_turbo", label: "Turbodmychadlo", applies: ["car"] },
      { id: "eng_mounts", label: "Silentbloky uložení motoru", applies: ["car"] },
      { id: "eng_compression", label: "Měření komprese", applies: ALL_KINDS }
    ]
  },
  {
    id: "trans_car",
    name: "Převodovka a spojka",
    icon: "fa-gear",
    hint: "Pouze automobil",
    items: [
      { id: "trs_gear_oil", label: "Převodový olej (manuál / automat)", applies: ["car"] },
      { id: "trs_dsg", label: "Servis DSG – olej a filtr", applies: ["car"] },
      { id: "trs_haldex", label: "Servis spojky Haldex (4x4)", applies: ["car"] },
      { id: "trs_clutch", label: "Spojková sada + vysouvací ložisko", applies: ["car"] },
      { id: "trs_dmf", label: "Dvouhmotový setrvačník", applies: ["car"] },
      { id: "trs_driveshaft", label: "Poloosa / homokinetický kloub + manžeta", applies: ["car"] }
    ]
  },
  {
    id: "chain",
    name: "Sekundární pohon – řetěz",
    icon: "fa-link",
    hint: "Pouze motocykl",
    items: [
      { id: "mc_chain_kit", label: "Řetězová sada (řetěz + obě rozety)", applies: ["motorcycle"] },
      { id: "mc_chain_service", label: "Čištění, mazání a napnutí řetězu", applies: ["motorcycle"] },
      { id: "mc_sprocket_front", label: "Přední rozeta (pastorek)", applies: ["motorcycle"] },
      { id: "mc_sprocket_rear", label: "Zadní rozeta", applies: ["motorcycle"] },
      { id: "mc_clutch", label: "Spojkové lamely / spojkový koš", applies: ["motorcycle"] },
      { id: "mc_final_drive", label: "Kardan / koncový převod – olej", applies: ["motorcycle"] }
    ]
  },
  {
    id: "cvt",
    name: "Variátor a CVT",
    icon: "fa-arrows-spin",
    hint: "Pouze skútr",
    items: [
      { id: "sc_belt", label: "Řemen variátoru", applies: ["scooter"] },
      { id: "sc_rollers", label: "Válečky variátoru + vodítka", applies: ["scooter"] },
      { id: "sc_clutch_shoes", label: "Spojkové čelisti + zvon spojky", applies: ["scooter"] },
      { id: "sc_gear_oil", label: "Olej koncového převodu (převodovka)", applies: ["scooter"] },
      { id: "sc_clean", label: "Čištění variátorové komory", applies: ["scooter"] },
      { id: "sc_kickstart", label: "Startovací mechanismus / volnoběžka", applies: ["scooter"] }
    ]
  },
  {
    id: "chassis",
    name: "Podvozek a řízení",
    icon: "fa-arrows-up-down",
    hint: "Tlumiče, čepy, vidlice",
    items: [
      { id: "ch_shocks_front", label: "Přední tlumiče", applies: ["car"] },
      { id: "ch_shocks_rear", label: "Zadní tlumiče", applies: ["car"] },
      { id: "ch_springs", label: "Pružiny", applies: ["car"] },
      { id: "ch_bushings", label: "Silentbloky a uložení ramen", applies: ["car"] },
      { id: "ch_ball_joints", label: "Kulové čepy / ramena", applies: ["car"] },
      { id: "ch_tie_rods", label: "Táhla a hlavy řízení", applies: ["car"] },
      { id: "ch_steering", label: "Posilovač řízení / servočerpadlo", applies: ["car"] },
      { id: "ch_stabilizer", label: "Tyčky a pouzdra stabilizátoru", applies: ["car"] },
      { id: "ch_fork_oil", label: "Olej v přední vidlici + gufera", applies: MOTO_KINDS },
      { id: "ch_rear_shock", label: "Zadní tlumič / progresivní uložení", applies: MOTO_KINDS },
      { id: "ch_head_bearing", label: "Ložiska hlavy řízení", applies: MOTO_KINDS },
      { id: "ch_swingarm", label: "Ložiska kyvné vidlice", applies: MOTO_KINDS }
    ]
  },
  {
    id: "electric",
    name: "Elektro a osvětlení",
    icon: "fa-bolt",
    hint: "Baterie, dobíjení, světla",
    items: [
      { id: "el_battery", label: "Akumulátor (baterie)", applies: ALL_KINDS },
      { id: "el_alternator", label: "Alternátor / dobíjecí cívka", applies: ALL_KINDS },
      { id: "el_regulator", label: "Regulátor–usměrňovač dobíjení", applies: MOTO_KINDS },
      { id: "el_starter", label: "Startér / spouštěč", applies: ALL_KINDS },
      { id: "el_bulbs", label: "Žárovky a světelné zdroje", applies: ALL_KINDS },
      { id: "el_headlight_adjust", label: "Seřízení světlometů", applies: ALL_KINDS },
      { id: "el_wiring", label: "Pojistky, relé, kabeláž", applies: ALL_KINDS },
      { id: "el_diagnostics", label: "Diagnostika – čtení a mazání chyb", applies: ALL_KINDS }
    ]
  },
  {
    id: "exhaust",
    name: "Výfuk a emise",
    icon: "fa-smog",
    hint: "DPF, EGR, lambda",
    items: [
      { id: "ex_exhaust", label: "Výfukové potrubí / tlumič výfuku", applies: ALL_KINDS },
      { id: "ex_lambda", label: "Lambda sonda", applies: ALL_KINDS },
      { id: "ex_catalyst", label: "Katalyzátor", applies: ALL_KINDS },
      { id: "ex_dpf", label: "DPF – čištění, regenerace, výměna", applies: ["car"] },
      { id: "ex_egr", label: "Ventil EGR – čištění nebo výměna", applies: ["car"] },
      { id: "ex_adblue", label: "AdBlue / systém SCR", applies: ["car"] }
    ]
  },
  {
    id: "body",
    name: "Karoserie, komfort a péče",
    icon: "fa-spray-can-sparkles",
    hint: "Klima, stěrače, čištění",
    items: [
      { id: "bd_wipers", label: "Stěrače", applies: ["car"] },
      { id: "bd_ac", label: "Servis klimatizace – plnění a dezinfekce", applies: ["car"] },
      { id: "bd_glass", label: "Sklo – oprava nebo výměna", applies: ["car"] },
      { id: "bd_rust", label: "Ošetření koroze / lakování", applies: ALL_KINDS },
      { id: "bd_cleaning", label: "Kompletní čištění / detailing", applies: ALL_KINDS },
      { id: "bd_plastics", label: "Plasty a kapotáž", applies: MOTO_KINDS },
      { id: "bd_cables", label: "Lanka (plyn, spojka) – mazání nebo výměna", applies: MOTO_KINDS },
      { id: "bd_winterize", label: "Zazimování / uvedení do provozu", applies: MOTO_KINDS }
    ]
  },
  {
    id: "inspection",
    name: "Kontroly, revize a poplatky",
    icon: "fa-clipboard-check",
    hint: "STK, emise, pojištění",
    items: [
      { id: "in_stk", label: "STK – technická kontrola", applies: ALL_KINDS },
      { id: "in_emission", label: "Měření emisí", applies: ALL_KINDS },
      { id: "in_insurance", label: "Pojištění (povinné ručení / havarijní)", applies: ALL_KINDS },
      { id: "in_vignette", label: "Dálniční známka", applies: ["car"] },
      { id: "in_check", label: "Sezónní prohlídka / kontrola před cestou", applies: ALL_KINDS }
    ]
  }
];

/* ==========================================================================
   DOPORUČENÉ SERVISNÍ INTERVALY (podklad pro připomínky)
   km ... podle druhu stroje; months ... interval v měsících
   ========================================================================== */

const MAINTENANCE_PLAN = [
  { itemId: "oil_engine",          label: "Výměna oleje a olejového filtru", km: { car: 15000, motorcycle: 6000, scooter: 5000 }, months: 12 },
  { itemId: "oil_air_filter",      label: "Vzduchový filtr",                 km: { car: 30000, motorcycle: 12000, scooter: 10000 }, months: 24 },
  { itemId: "oil_cabin_filter",    label: "Kabinový filtr",                  km: { car: 15000 }, months: 12 },
  { itemId: "brake_fluid",         label: "Brzdová kapalina",                km: null, months: 24 },
  { itemId: "eng_coolant",         label: "Chladicí kapalina",               km: null, months: 48 },
  { itemId: "eng_spark_plugs",     label: "Zapalovací svíčky",               km: { car: 60000, motorcycle: 12000, scooter: 10000 }, months: 48 },
  { itemId: "eng_valve_clearance", label: "Vůle ventilů",                    km: { car: 90000, motorcycle: 24000, scooter: 12000 }, months: null },
  { itemId: "eng_timing_belt",     label: "Rozvodový řemen",                 km: { car: 120000 }, months: 60 },
  { itemId: "mc_chain_kit",        label: "Řetězová sada",                   km: { motorcycle: 25000 }, months: null },
  { itemId: "sc_belt",             label: "Řemen variátoru",                 km: { scooter: 20000 }, months: null },
  { itemId: "sc_rollers",          label: "Válečky variátoru",               km: { scooter: 15000 }, months: null },
  { itemId: "sc_gear_oil",         label: "Olej koncového převodu",          km: { scooter: 10000 }, months: 24 },
  { itemId: "ch_fork_oil",         label: "Olej v přední vidlici",           km: { motorcycle: 30000, scooter: 25000 }, months: 48 },
  { itemId: "trs_gear_oil",        label: "Převodový olej",                  km: { car: 90000 }, months: null },
  { itemId: "trs_dsg",             label: "Servis DSG",                      km: { car: 60000 }, months: null }
];

/* Doklady s pevným datem platnosti – evidují se u vozidla. */
const DOCUMENT_FIELDS = [
  { key: "stkUntil",       label: "STK platná do",       icon: "fa-clipboard-check", applies: ALL_KINDS },
  { key: "emissionUntil",  label: "Emise platné do",     icon: "fa-smog",            applies: ALL_KINDS },
  { key: "insuranceUntil", label: "Pojištění platné do", icon: "fa-shield-halved",   applies: ALL_KINDS },
  { key: "vignetteUntil",  label: "Dálniční známka do",  icon: "fa-road",            applies: ["car"] }
];

/* ==========================================================================
   PŘEKLAD STARŠÍCH ZÁZNAMŮ
   Původní verze aplikace používala jiná id úkonů i kategorií.
   ========================================================================== */

const LEGACY_ITEM_MAP = {
  filter_oil: "oil_engine",
  filter_air: "oil_air_filter",
  filter_cabin: "oil_cabin_filter",
  filter_fuel: "oil_fuel_filter",
  moto_chain: "mc_chain_kit",
  moto_variator_belt: "sc_belt",
  moto_variator_rollers: "sc_rollers",
  moto_clutch: "mc_clutch",
  moto_transmission_oil: "sc_gear_oil",
  fluid_brake: "brake_fluid",
  fluid_coolant: "eng_coolant",
  fluid_fork_oil: "ch_fork_oil",
  fluid_gearbox: "trs_gear_oil",
  brake_front_pads: "brake_pads_front",
  brake_front_discs: "brake_discs_front",
  brake_rear_pads: "brake_pads_rear",
  brake_rear_discs: "brake_discs_rear",
  brake_parking: "brake_parking",
  susp_tires: "tyre_front",
  engine_spark_plugs: "eng_spark_plugs",
  engine_battery: "el_battery",
  engine_valves: "eng_valve_clearance",
  engine_timing_belt: "eng_timing_belt",
  engine_serpentine_belt: "eng_aux_belt",
  engine_dpf: "ex_dpf"
};

const LEGACY_CATEGORY_MAP = {
  filters: "oil",
  moto_drivetrain: "chain",
  fluids: "engine",
  brakes: "brakes",
  engine: "engine"
};

/* ============================== POMOCNÉ FUNKCE ========================== */

const VehicleCatalog = {
  brand(brandKey) {
    return VEHICLE_DB[brandKey] || null;
  },

  brandName(brandKey, fallback) {
    const b = VEHICLE_DB[brandKey];
    return b ? b.name : (fallback || brandKey || "Neznámá značka");
  },

  model(brandKey, modelKey) {
    const b = VEHICLE_DB[brandKey];
    return b && b.models[modelKey] ? b.models[modelKey] : null;
  },

  /** Druh stroje: car / motorcycle / scooter */
  kindOf(vehicle) {
    if (!vehicle) return "car";
    if (vehicle.kind && KIND_LABELS[vehicle.kind]) return vehicle.kind;
    const model = this.model(vehicle.brand, vehicle.modelKey);
    if (model && model.kind) return model.kind;
    const brand = this.brand(vehicle.brand);
    if (brand) return brand.type === "moto" ? "motorcycle" : "car";
    return "car";
  },

  isMoto(vehicle) {
    return MOTO_KINDS.indexOf(this.kindOf(vehicle)) >= 0;
  },

  /** Roky výroby modelu sestupně; omezené aktuálním rokem. */
  yearsFor(brandKey, modelKey) {
    const model = this.model(brandKey, modelKey);
    const currentYear = new Date().getFullYear();
    let from = 1990;
    let to = currentYear;
    if (model && Array.isArray(model.years)) {
      from = model.years[0];
      to = Math.min(model.years[1] || currentYear, currentYear);
    }
    const out = [];
    for (let y = to; y >= from; y--) out.push(y);
    return out;
  },

  engine(vehicle) {
    const model = this.model(vehicle.brand, vehicle.modelKey);
    if (!model) return null;
    const matched = model.engines.find(e => e.name === vehicle.engineName);
    return matched || null;
  },

  /** Kategorie a úkony platné pro daný druh stroje. */
  categoriesFor(kind) {
    return SERVICE_CATEGORIES
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        hint: cat.hint,
        items: cat.items.filter(item => item.applies.indexOf(kind) >= 0)
      }))
      .filter(cat => cat.items.length > 0);
  },

  /** Najde úkon podle id, včetně starých id. */
  findItem(itemId) {
    const id = LEGACY_ITEM_MAP[itemId] || itemId;
    for (let i = 0; i < SERVICE_CATEGORIES.length; i++) {
      const cat = SERVICE_CATEGORIES[i];
      const found = cat.items.find(item => item.id === id);
      if (found) {
        return {
          id: found.id,
          label: found.label,
          applies: found.applies,
          detail: found.detail,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon
        };
      }
    }
    return null;
  },

  categoryName(categoryId) {
    const id = LEGACY_CATEGORY_MAP[categoryId] || categoryId;
    if (id === "custom") return "Vlastní úkon";
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : "Servisní úkon";
  },

  categoryIcon(categoryId) {
    const id = LEGACY_CATEGORY_MAP[categoryId] || categoryId;
    if (id === "custom") return "fa-wrench";
    const cat = SERVICE_CATEGORIES.find(c => c.id === id);
    return cat ? cat.icon : "fa-screwdriver-wrench";
  },

  /** Převede staré id úkonu na aktuální. */
  normalizeItemId(itemId) {
    return LEGACY_ITEM_MAP[itemId] || itemId;
  },

  /** Doporučené intervaly pro daný druh stroje. */
  planFor(kind) {
    return MAINTENANCE_PLAN
      .map(p => ({
        itemId: p.itemId,
        label: p.label,
        km: p.km ? (p.km[kind] || null) : null,
        months: p.months || null
      }))
      .filter(p => p.km || p.months)
      .filter(p => {
        const item = VehicleCatalog.findItem(p.itemId);
        return item ? item.applies.indexOf(kind) >= 0 : false;
      });
  },

  documentsFor(kind) {
    return DOCUMENT_FIELDS.filter(d => d.applies.indexOf(kind) >= 0);
  },

  /** Nabídka olejů pro ruční zápis; bez doložené specifikace nic nepředvolit. */
  oilOptions(vehicle) {
    if (vehicle.brand === "ford") {
      return ["Dle specifikace konkrétního motoru", "0W-20", "0W-30", "5W-20", "5W-30", "5W-40", "10W-40"];
    }
    const kind = this.kindOf(vehicle);
    const base = kind === "car"
      ? [
          "0W-20 VW 508.00 / 509.00",
          "5W-30 VW 504.00 / 507.00",
          "5W-40 VW 502.00 / 505.01",
          "5W-40 VW 505.00",
          "0W-30 VW 506.01",
          "10W-40 polosyntetický"
        ]
      : [
          "10W-40 4T JASO MA2",
          "10W-40 4T JASO MA/MB",
          "10W-30 4T JASO MA2",
          "10W-30 4T JASO MB (skútr)",
          "15W-50 4T JASO MA2",
          "5W-40 4T plně syntetický"
        ];

    const eng = this.engine(vehicle);
    if (eng && eng.oilSpec && base.indexOf(eng.oilSpec) < 0) {
      base.unshift(eng.oilSpec);
    }
    if (!eng || !eng.oilSpec) base.unshift("Dle specifikace konkrétního motoru");
    return base;
  }
};
