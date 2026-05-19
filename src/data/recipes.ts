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
  calories_kcal?: number;
}

export interface Recipe {
  id: number;
  leafType: string;
  leafIds?: number[];
  title: RecipeTitle;
  ingredients: RecipeIngredients;
  steps: RecipeSteps;
  nutrition: RecipeNutrition;
  image_url?: string;
  gallery_images?: string[];
  published?: boolean;
}

export const recipes: Recipe[] = [
  {
    "id": 1,
    "leafType": "onion",
    "published": false,
    "title": {
      "fr": "Msemen farci aux feuilles d'oignon",
      "en": "Stuffed Msemen with Onion Leaves",
      "ar": "مسمن محشي بورق البصل"
    },
    "image_url": "https://free-images.com/lg/9ca5/onion_food_red_onion.jpg",
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
    "leafType": "onion",
    "published": false,
    "title": {
      "fr": "Galette d'orge aux feuilles d'oignon",
      "en": "Barley Flatbread with Onion Leaves",
      "ar": "خبز الشعير بورق البصل"
    },
    "image_url": "https://free-images.com/lg/2beb/onion_vegetables_food_market.jpg",
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
    "leafType": "onion",
    "published": false,
    "title": {
      "fr": "Omelette aux feuilles d'oignon",
      "en": "Omelette with Onion Leaves",
      "ar": "عجة بورق البصل"
    },
    "image_url": "https://free-images.com/lg/570c/onion_bulbs_food_fresh.jpg",
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
    "leafType": "onion",
    "published": false,
    "title": {
      "fr": "Poudre de feuilles d'oignon séchées",
      "en": "Powdered Dried Onion Leaves",
      "ar": "بودرة ورق البصل المجفف"
    },
    "image_url": "https://free-images.com/lg/65b3/onion_vegetables_food_agriculture.jpg",
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
  },
  {
    "id": 5,
    "leafType": "beetroot",
    "published": false,
    "title": {
      "fr": "Salade de feuilles de betterave au citron",
      "en": "Beet Leaf Salad with Lemon Vinaigrette",
      "ar": "سلطة ورق الشمندر بالليمون"
    },
    "image_url": "https://free-images.com/lg/99f2/beets_yellow_green_leaves.jpg",
    "ingredients": {
      "fr": ["300 g de feuilles de betterave fraîches", "2 cuillères à soupe d'huile d'olive", "Jus d'un citron", "2 gousses d'ail hachées", "Sel et poivre", "Graines de sésame pour garnir"],
      "en": ["300 g fresh beet leaves", "2 tbsp olive oil", "Juice of 1 lemon", "2 cloves garlic minced", "Salt and pepper", "Sesame seeds for garnish"],
      "ar": ["300 غ ورق شمندر طازج", "2 ملعقة زيت زيتون", "عصير ليمونة", "2 فص ثوم مفروم", "ملح وفلفل", "حبات سمسم للتزيين"]
    },
    "steps": {
      "fr": ["Laver et émincer les feuilles de betterave.", "Blanchir 2 minutes dans l'eau bouillante, égoutter.", "Mélanger l'huile d'olive, le jus de citron et l'ail.", "Verser la vinaigrette sur les feuilles et mélanger.", "Saler, poivrer et garnir de graines de sésame."],
      "en": ["Wash and chop beet leaves.", "Blanch for 2 minutes in boiling water, drain.", "Mix olive oil, lemon juice, and garlic.", "Pour vinaigrette over leaves and toss.", "Season with salt, pepper, and garnish with sesame seeds."],
      "ar": ["غسل وتقطيع ورق الشمندر.", "سلقه لمدة دقيقتين في ماء مغلي ثم تصفيته.", "خلط زيت الزيتون وعصير الليمون والثوم.", "سكب الصلصة فوق الورق وتقليبه.", "تبيله بالملح والفلفل والتزيين بحبات السمسم."]
    },
    "nutrition": {
      "proteins_g": 4.2,
      "fats_g": 7.1,
      "ash_g": 2.5,
      "moisture_percent": 82.3,
      "polyphenols_mg": 141.1,
      "flavonoids_mg": 62.7,
      "antioxidant_score": "Élevé"
    }
  },
  {
    "id": 6,
    "leafType": "beetroot",
    "published": false,
    "title": {
      "fr": "Feuilles de betterave sautées à l'ail",
      "en": "Sautéed Beet Greens with Garlic",
      "ar": "ورق شمندر مقلي بالثوم"
    },
    "image_url": "https://free-images.com/lg/7539/beets_sugar_beet_harvest.jpg",
    "ingredients": {
      "fr": ["400 g de feuilles de betterave", "3 cuillères à soupe d'huile d'olive", "4 gousses d'ail émincées", "1 cuillère à café de cumin", "Sel et poivre", "Jus d'un demi-citron"],
      "en": ["400 g beet leaves", "3 tbsp olive oil", "4 cloves garlic sliced", "1 tsp cumin", "Salt and pepper", "Juice of half a lemon"],
      "ar": ["400 غ ورق شمندر", "3 ملعقة زيت زيتون", "4 فصوص ثوم مقطعة", "1 ملعقة صغيرة كمون", "ملح وفلفل", "عصير نصف ليمونة"]
    },
    "steps": {
      "fr": ["Laver et couper les feuilles en lanières.", "Chauffer l'huile d'olive dans une poêle.", "Ajouter l'ail et le cumin, faire revenir 1 minute.", "Ajouter les feuilles et faire sauter 3-4 minutes.", "Assaisonner et arroser de jus de citron."],
      "en": ["Wash and slice leaves into ribbons.", "Heat olive oil in a pan.", "Add garlic and cumin, sauté 1 minute.", "Add leaves and sauté 3-4 minutes.", "Season and drizzle with lemon juice."],
      "ar": ["غسل وتقطيع الورق إلى شرائح.", "تسخين زيت الزيتون في مقلاة.", "إضافة الثوم والكمون وتقليب لمدة دقيقة.", "إضافة الورق وتقليبه لمدة 3-4 دقائق.", "تبيله ورش عصير الليمون."]
    },
    "nutrition": {
      "proteins_g": 3.8,
      "fats_g": 10.2,
      "ash_g": 2.8,
      "moisture_percent": 78.5,
      "polyphenols_mg": 128.5,
      "flavonoids_mg": 58.3,
      "antioxidant_score": "Élevé"
    }
  },
  {
    "id": 7,
    "leafType": "carrot",
    "published": false,
    "title": {
      "fr": "Pesto de feuilles de carotte",
      "en": "Carrot Leaf Pesto",
      "ar": "بيستو ورق الجزر"
    },
    "image_url": "https://free-images.com/lg/0f25/carrot_plant_farm_garden.jpg",
    "ingredients": {
      "fr": ["200 g de feuilles de carotte", "50 g de noix", "50 g de parmesan râpé", "2 gousses d'ail", "100 ml d'huile d'olive", "Jus d'un citron", "Sel et poivre"],
      "en": ["200 g carrot leaves", "50 g walnuts", "50 g grated parmesan", "2 garlic cloves", "100 ml olive oil", "Juice of 1 lemon", "Salt and pepper"],
      "ar": ["200 غ ورق جزر", "50 غ جوز", "50 غ جبن بارميزان مبشور", "2 فص ثوم", "100 مل زيت زيتون", "عصير ليمونة", "ملح وفلفل"]
    },
    "steps": {
      "fr": ["Laver et sécher les feuilles de carotte.", "Mixer les feuilles, les noix, l'ail et le parmesan.", "Ajouter l'huile d'olive en filet tout en mixant.", "Assaisonner avec le jus de citron, sel et poivre.", "Servir sur des pâtes ou du pain grillé."],
      "en": ["Wash and dry carrot leaves.", "Blend leaves, walnuts, garlic, and parmesan.", "Drizzle in olive oil while blending.", "Season with lemon juice, salt, and pepper.", "Serve on pasta or toasted bread."],
      "ar": ["غسل وتجفيف ورق الجزر.", "خلط الورق والجوز والثوم والبارميزان.", "إضافة زيت الزيتون بالتدريج مع الخلط.", "تبيله بعصير الليمون والملح والفلفل.", "يقدم مع المعكرونة أو الخبز المحمص."]
    },
    "nutrition": {
      "proteins_g": 6.8,
      "fats_g": 28.4,
      "ash_g": 3.1,
      "moisture_percent": 55.2,
      "polyphenols_mg": 182.0,
      "flavonoids_mg": 75.6,
      "antioxidant_score": "Très élevé"
    }
  },
  {
    "id": 8,
    "leafType": "fennel",
    "published": false,
    "title": {
      "fr": "Riz aux feuilles de fenouil et citron",
      "en": "Fennel Leaf and Lemon Rice",
      "ar": "أرز بالشمر والليمون"
    },
    "image_url": "https://free-images.com/lg/0069/fennel_fruit_fennel_sweet.jpg",
    "ingredients": {
      "fr": ["200 g de riz basmati", "1 bouquet de feuilles de fenouil hachées", "1 oignon émincé", "2 cuillères à soupe d'huile d'olive", "Zeste et jus d'un citron", "Sel et poivre"],
      "en": ["200 g basmati rice", "1 bunch fennel leaves chopped", "1 onion diced", "2 tbsp olive oil", "Zest and juice of 1 lemon", "Salt and pepper"],
      "ar": ["200 غ أرز بسمتي", "حزمة شمر مفروم", "1 بصلة مقطعة", "2 ملعقة زيت زيتون", "برش وعصير ليمونة", "ملح وفلفل"]
    },
    "steps": {
      "fr": ["Faire revenir l'oignon dans l'huile d'olive.", "Ajouter le riz et remuer 2 minutes.", "Ajouter 400 ml d'eau bouillante et le zeste de citron.", "Couvrir et cuire 15 minutes à feu doux.", "Incorporer les feuilles de fenouil et le jus de citron.", "Laisser reposer 5 minutes avant de servir."],
      "en": ["Sauté onion in olive oil.", "Add rice and stir for 2 minutes.", "Add 400 ml boiling water and lemon zest.", "Cover and simmer 15 minutes.", "Fold in fennel leaves and lemon juice.", "Rest 5 minutes before serving."],
      "ar": ["تقليب البصل في زيت الزيتون.", "إضافة الأرز وتقليبه لمدة دقيقتين.", "إضافة 400 مل ماء مغلي وبرش الليمون.", "تغطية وطهي لمدة 15 دقيقة.", "إضافة الشمر وعصير الليمون.", "تركه 5 دقائق قبل التقديم."]
    },
    "nutrition": {
      "proteins_g": 5.1,
      "fats_g": 6.8,
      "ash_g": 1.9,
      "moisture_percent": 68.4,
      "polyphenols_mg": 50.1,
      "flavonoids_mg": 23.6,
      "antioxidant_score": "Faible"
    }
  },
  {
    "id": 9,
    "leafType": "kohlrabi",
    "published": false,
    "title": {
      "fr": "Feuilles de chou rave sautées aux tomates",
      "en": "Kohlrabi Leaf Stir-fry with Tomatoes",
      "ar": "ورق الكرنب المسلوق المقلي بالطماطم"
    },
    "image_url": "https://free-images.com/lg/4be9/kohlrabi_vegetables_turnip_kohl.jpg",
    "ingredients": {
      "fr": ["300 g de feuilles de chou rave", "2 tomates mûres coupées en dés", "1 oignon émincé", "2 gousses d'ail hachées", "2 cuillères à soupe d'huile d'olive", "1 cuillère à café de paprika", "Sel et poivre"],
      "en": ["300 g kohlrabi leaves", "2 ripe tomatoes diced", "1 onion diced", "2 garlic cloves minced", "2 tbsp olive oil", "1 tsp paprika", "Salt and pepper"],
      "ar": ["300 غ ورق كرنب", "2 طماطم ناضجة مقطعة", "1 بصلة مقطعة", "2 فص ثوم مفروم", "2 ملعقة زيت زيتون", "1 ملعقة صغيرة بابريكا", "ملح وفلفل"]
    },
    "steps": {
      "fr": ["Laver et couper les feuilles en morceaux.", "Faire revenir l'oignon et l'ail dans l'huile.", "Ajouter les tomates et le paprika, cuire 5 minutes.", "Ajouter les feuilles et faire sauter 5 minutes.", "Assaisonner et servir chaud."],
      "en": ["Wash and chop kohlrabi leaves.", "Sauté onion and garlic in oil.", "Add tomatoes and paprika, cook 5 minutes.", "Add leaves and sauté 5 minutes.", "Season and serve hot."],
      "ar": ["غسل وتقطيع ورق الكرنب.", "تقليب البصل والثوم في الزيت.", "إضافة الطماطم والبابريكا وطهي 5 دقائق.", "إضافة الورق وتقليبه 5 دقائق.", "تبيله وتقديمه ساخناً."]
    },
    "nutrition": {
      "proteins_g": 6.2,
      "fats_g": 7.5,
      "ash_g": 3.4,
      "moisture_percent": 80.1,
      "polyphenols_mg": 153.2,
      "flavonoids_mg": 123.2,
      "antioxidant_score": "Très élevé"
    }
  },
  {
    "id": 10,
    "leafType": "leek",
    "published": false,
    "title": {
      "fr": "Soupe de feuilles de poireau et pommes de terre",
      "en": "Leek Leaf and Potato Soup",
      "ar": "شوربة ورق الكرات والبطاطس"
    },
    "image_url": "https://free-images.com/lg/172f/food_healthy_soup_leek.jpg",
    "ingredients": {
      "fr": ["200 g de feuilles de poireau", "3 pommes de terre moyennes", "1 oignon", "2 cuillères à soupe d'huile d'olive", "750 ml de bouillon de légumes", "Sel et poivre", "Crème fraîche optionnelle"],
      "en": ["200 g leek leaves", "3 medium potatoes", "1 onion", "2 tbsp olive oil", "750 ml vegetable broth", "Salt and pepper", "Optional cream"],
      "ar": ["200 غ ورق كرات", "3 حبات بطاطس متوسطة", "1 بصلة", "2 ملعقة زيت زيتون", "750 مل مرق خضار", "ملح وفلفل", "كريمة طازجة اختياري"]
    },
    "steps": {
      "fr": ["Laver et émincer les feuilles de poireau.", "Faire revenir l'oignon et le poireau dans l'huile.", "Ajouter les pommes de terre coupées en dés.", "Verser le bouillon et porter à ébullition.", "Cuire 20 minutes jusqu'à tendreté.", "Mixer jusqu'à consistance lisse. Ajouter la crème si désiré."],
      "en": ["Wash and slice leek leaves.", "Sauté onion and leek in oil.", "Add diced potatoes.", "Pour in broth and bring to a boil.", "Simmer 20 minutes until tender.", "Blend until smooth. Add cream if desired."],
      "ar": ["غسل وتقطيع ورق الكرات.", "تقليب البصل والكرات في الزيت.", "إضافة البطاطس المقطعة.", "سكب المرق وغليه.", "طهي 20 دقيقة حتى النضج.", "خلط حتى يصبح ناعماً. إضافة الكريمة حسب الرغبة."]
    },
    "nutrition": {
      "proteins_g": 4.5,
      "fats_g": 6.2,
      "ash_g": 2.1,
      "moisture_percent": 85.3,
      "polyphenols_mg": 69.6,
      "flavonoids_mg": 13.7,
      "antioxidant_score": "Faible"
    }
  }
];
