export interface LeafInfo {
  id: number;
  name: { en: string; fr: string };
  aliases: string[];
  highlights: {
    proteins_percent?: number;
    antioxidant_classification?: string;
    calcium_mg_per_100g?: number;
    flavonoids_mg_per_100g?: number;
    polyphenols_mg_per_100g?: number;
  };
  compounds?: string[];
  safety?: string;
  summary: string;
}

export const leaves: LeafInfo[] = [
  {
    id: 1,
    name: { en: "Onion leaves", fr: "Feuilles d’oignon" },
    aliases: ["green onion", "spring onion", "scallion"],
    highlights: {
      polyphenols_mg_per_100g: 160.94,
      flavonoids_mg_per_100g: 67.4,
      antioxidant_classification: "Very high",
    },
    compounds: [
      "Quercetin", "Isorhamnetin", "Kaempferol", "Luteolin",
      "Organosulfur compounds (onionin A, thiosulfinates, cepaenes, sulfones)"
    ],
    safety: "Safe for human consumption",
    summary: "Rich in flavonoids and organosulfur compounds with antioxidant, anti-inflammatory and antimicrobial activities."
  },
  {
    id: 2,
    name: { en: "Fennel leaves", fr: "Feuille de Fenouil" },
    aliases: ["fennel fronds"],
    highlights: {
      proteins_percent: 21.74,
      calcium_mg_per_100g: 126.18,
    },
    compounds: ["Phenolic acids", "Flavonoids"],
    safety: "Generally safe",
    summary: "Balanced mineral profile with good protein density; excellent Ca/P and Na/K ratios."
  },
  {
    id: 3,
    name: { en: "Carrot leaves", fr: "Feuille de carotte" },
    aliases: ["carrot tops"],
    highlights: {
      polyphenols_mg_per_100g: 181.955,
      flavonoids_mg_per_100g: 75.6,
      antioxidant_classification: "Very high",
    },
    compounds: ["Phenolic acids", "Flavonoids"],
    safety: "Generally safe",
    summary: "High polyphenols and flavonoids; very strong overall antioxidant profile."
  },
  {
    id: 4,
    name: { en: "Kohlrabi leaves", fr: "Feuille de chou rave" },
    aliases: ["kohlrabi greens"],
    highlights: {
      proteins_percent: 30.8,
      calcium_mg_per_100g: 247.53,
      flavonoids_mg_per_100g: 123.20,
      antioxidant_classification: "Very high",
    },
    compounds: ["Flavonoids", "Phenolic compounds"],
    safety: "Generally safe",
    summary: "Very protein-dense leafy green with rich antioxidant content."
  },
  {
    id: 5,
    name: { en: "Beet leaves", fr: "Feuille de Betterave Rouge" },
    aliases: ["beet greens"],
    highlights: {
      calcium_mg_per_100g: 199.58,
      polyphenols_mg_per_100g: 141.09,
      antioxidant_classification: "High",
    },
    compounds: ["Phenolic acids", "Flavonoids"],
    safety: "Generally safe",
    summary: "Calcium-rich with high antioxidant activity and notable mineral density."
  },
  {
    id: 6,
    name: { en: "Radish leaves", fr: "Feuille de Radis" },
    aliases: ["radish greens"],
    highlights: {
      polyphenols_mg_per_100g: 148.31,
      flavonoids_mg_per_100g: 62.11,
      antioxidant_classification: "Very high",
    },
    compounds: ["Flavonoids", "Phenolic compounds"],
    safety: "Generally safe",
    summary: "Very high overall antioxidant classification with solid mineral presence."
  },
  {
    id: 7,
    name: { en: "Leek leaves", fr: "Feuille de Poireau" },
    aliases: ["leek greens"],
    highlights: {
      polyphenols_mg_per_100g: 69.58,
      antioxidant_classification: "Low to moderate",
    },
    compounds: ["Phenolics", "Flavonoids (lower levels)"],
    safety: "Generally safe",
    summary: "Moderate antioxidant profile; excellent Na/K ratio and useful minerals."
  },
  {
    id: 8,
    name: { en: "Turnip leaves", fr: "Feuille de Navet" },
    aliases: ["turnip greens"],
    highlights: {
      proteins_percent: 25.64,
      calcium_mg_per_100g: 198.7,
      antioxidant_classification: "Moderate to high",
    },
    compounds: ["Flavonoids", "Phenolic compounds"],
    safety: "Generally safe",
    summary: "Protein-dense with strong mineral density; widely noted for nutrition."
  },
  {
    id: 9,
    name: { en: "Artichoke leaves", fr: "Feuille d’Artichaut" },
    aliases: ["artichoke greens"],
    highlights: {
      polyphenols_mg_per_100g: 155.13,
      flavonoids_mg_per_100g: 115.32,
      antioxidant_classification: "Very high (corrected)",
    },
    compounds: ["Phenolic acids", "Flavonoids"],
    safety: "Generally safe",
    summary: "Very high corrected antioxidant score; dense in bioactive compounds."
  },
];


