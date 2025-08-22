export interface RecipeTitle {
  fr: string;
  en: string;
  ar: string;
}

export interface RecipeIngredients {
  fr: string[];
  en: string[];
  ar: string[];
}

export interface RecipeSteps {
  fr: string[];
  en: string[];
  ar: string[];
}

export interface RecipeNutrition {
  proteins_g: number;
  fats_g: number;
  ash_g: number;
  moisture_percent: number;
  polyphenols_mg: number;
  flavonoids_mg: number;
  antioxidant_score: string;
}

export interface Recipe {
  id: number;
  title: RecipeTitle;
  ingredients: RecipeIngredients;
  steps: RecipeSteps;
  nutrition: RecipeNutrition;
}

export const recipes: Recipe[] = [
  {
    "id": 1,
    "title": {
      "fr": "Msemen farci aux feuilles d'oignon",
      "en": "Stuffed Msemen with Onion Leaves",
      "ar": "مسمن محشي بورق البصل"
    },
    "ingredients": {
      "fr": ["500 g de semoule fine", "200 g de farine", "1 bol de feuilles d'oignon hachées", "Sel", "Eau tiède", "Huile pour cuisson"],
      "en": ["500 g fine semolina", "200 g flour", "1 bowl chopped onion leaves", "Salt", "Warm water", "Oil for cooking"],
      "ar": ["500غ سميد رقيق", "200غ دقيق", "كوب ورق بصل مفروم", "ملح", "ماء دافئ", "زيت للطبخ"]
    },
    "steps": {
      "fr": ["Préparer une pâte souple avec semoule, farine, eau et sel.", "Laisser reposer 30 min.", "Étaler en galette, garnir de feuilles d'oignon hachées.", "Plier et cuire sur une plaque chaude avec un peu d'huile."],
      "en": ["Prepare a soft dough with semolina, flour, water, and salt.", "Let rest for 30 min.", "Flatten, stuff with chopped onion leaves.", "Fold and cook on a hot plate with oil."],
      "ar": ["تحضير عجينة لينة بالسميد والدقيق والماء والملح.", "اتركها ترتاح 30 دقيقة.", "تفرد وتحشى بورق البصل المفروم.", "تطوى وتطهى فوق مقلاة ساخنة بقليل من الزيت."]
    },
    "nutrition": {
      "proteins_g": 12.5,
      "fats_g": 8.2,
      "ash_g": 2.1,
      "moisture_percent": 35.8,
      "polyphenols_mg": 145.6,
      "flavonoids_mg": 58.3,
      "antioxidant_score": "Très élevé"
    }
  },
  {
    "id": 2,
    "title": {
      "fr": "Galette d'orge aux feuilles d'oignon",
      "en": "Barley Flatbread with Onion Leaves",
      "ar": "خبز الشعير بورق البصل"
    },
    "ingredients": {
      "fr": ["300 g de semoule d'orge", "100 g de farine", "1 bol de feuilles d'oignon hachées", "Sel", "Eau tiède"],
      "en": ["300 g barley semolina", "100 g flour", "1 bowl chopped onion leaves", "Salt", "Warm water"],
      "ar": ["300غ سميد شعير", "100غ دقيق", "كوب ورق بصل مفروم", "ملح", "ماء دافئ"]
    },
    "steps": {
      "fr": ["Mélanger semoule d'orge, farine, sel et eau.", "Incorporer les feuilles d'oignon hachées.", "Former une galette et cuire sur plaque chaude."],
      "en": ["Mix barley semolina, flour, salt, and water.", "Add chopped onion leaves.", "Form a flatbread and cook on hot plate."],
      "ar": ["مزج سميد الشعير والدقيق والملح والماء.", "إضافة ورق البصل المفروم.", "تشكل كخبزة وتطهى فوق مقلاة ساخنة."]
    },
    "nutrition": {
      "proteins_g": 14.8,
      "fats_g": 2.3,
      "ash_g": 1.8,
      "moisture_percent": 42.1,
      "polyphenols_mg": 132.4,
      "flavonoids_mg": 45.7,
      "antioxidant_score": "Élevé"
    }
  },
  {
    "id": 3,
    "title": {
      "fr": "Omelette aux feuilles d'oignon",
      "en": "Omelette with Onion Leaves",
      "ar": "عجة بورق البصل"
    },
    "ingredients": {
      "fr": ["4 œufs", "1 bol de feuilles d'oignon hachées", "Sel", "Poivre", "Huile d'olive"],
      "en": ["4 eggs", "1 bowl chopped onion leaves", "Salt", "Pepper", "Olive oil"],
      "ar": ["4 بيضات", "كوب ورق بصل مفروم", "ملح", "فلفل", "زيت الزيتون"]
    },
    "steps": {
      "fr": ["Battre les œufs avec sel et poivre.", "Ajouter les feuilles d'oignon hachées.", "Cuire dans une poêle avec huile d'olive."],
      "en": ["Beat eggs with salt and pepper.", "Add chopped onion leaves.", "Cook in a pan with olive oil."],
      "ar": ["خفق البيض مع الملح والفلفل.", "إضافة ورق البصل المفروم.", "يطبخ في مقلاة مع زيت الزيتون."]
    },
    "nutrition": {
      "proteins_g": 28.4,
      "fats_g": 18.7,
      "ash_g": 3.2,
      "moisture_percent": 48.9,
      "polyphenols_mg": 168.9,
      "flavonoids_mg": 72.1,
      "antioxidant_score": "Très élevé"
    }
  },
  {
    "id": 4,
    "title": {
      "fr": "Poudre de feuilles d'oignon séchées",
      "en": "Powdered Dried Onion Leaves",
      "ar": "بودرة ورق البصل المجفف"
    },
    "ingredients": {
      "fr": ["Feuilles d'oignon fraîches"],
      "en": ["Fresh onion leaves"],
      "ar": ["ورق بصل طازج"]
    },
    "steps": {
      "fr": ["Laver et sécher les feuilles d'oignon.", "Les faire sécher au soleil ou au four doux.", "Moudre pour obtenir une poudre.", "Utiliser dans les soupes ou sauces."],
      "en": ["Wash and dry onion leaves.", "Sun-dry or oven-dry at low heat.", "Grind into powder.", "Use in soups or sauces."],
      "ar": ["غسل وتجفيف ورق البصل.", "تجفيفه في الشمس أو في فرن معتدل.", "يطحن حتى يصبح مسحوقاً.", "يستعمل في الحساء أو الصلصات."]
    },
    "nutrition": {
      "proteins_g": 18.6,
      "fats_g": 1.2,
      "ash_g": 8.4,
      "moisture_percent": 12.3,
      "polyphenols_mg": 245.7,
      "flavonoids_mg": 98.5,
      "antioxidant_score": "Très élevé"
    }
  }
];
