import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type SupportedLang = 'EN' | 'FR' | 'AR';

type Translations = Record<string, Record<SupportedLang, string>>;

const defaultTranslations: Translations = {
  // Tabs
  'tabs.home': { EN: 'Home', FR: 'Accueil', AR: 'الرئيسية' },
  'tabs.chat': { EN: 'Chat', FR: 'Discussion', AR: 'دردشة' },
  'tabs.stats': { EN: 'Insights', FR: 'Statistiques', AR: 'إحصائيات' },
  'tabs.recipes': { EN: 'Recipes', FR: 'Recettes', AR: 'وصفات' },
  'tabs.leaves': { EN: 'Leaves', FR: 'Feuilles', AR: 'أوراق' },

  // Actions / tooltips
  'actions.menu': { EN: 'Menu', FR: 'Menu', AR: 'قائمة' },
  'actions.settings': { EN: 'Settings', FR: 'Paramètres', AR: 'إعدادات' },
  'actions.theme': { EN: 'Theme', FR: 'Thème', AR: 'السمة' },
  'actions.language': { EN: 'Language', FR: 'Langue', AR: 'اللغة' },

  // Landing page
  'landing.tagline': { EN: 'Scan • Discover • Cook — AI that helps Moroccan households transform commonly discarded vegetable leaves into nutritious, affordable meals.', FR: 'Scannez • Découvrez • Cuisinez — Une IA qui aide les ménages marocains à transformer des feuilles de légumes souvent jetées en repas nutritifs et abordables.', AR: 'امسح • اكتشف • اطبخ — ذكاء اصطناعي يساعد الأسر المغربية على تحويل أوراق الخضروات المهملة إلى وجبات مغذية وبأسعار معقولة.' },
  'landing.fact': { EN: '1.3 billion tonnes of food are wasted each year... SafeLeafKitchen turns overlooked leaves into value — for health, wallets, and the planet.', FR: '1,3 milliard de tonnes de nourriture sont gaspillées chaque année... SafeLeafKitchen transforme les feuilles oubliées en valeur — pour la santé, le portefeuille et la planète.', AR: '1.3 مليار طن من الطعام تُهدر سنويًا... يحوّل SafeLeafKitchen الأوراق المُهملة إلى قيمة — للصحة والمال والكوكب.' },
  'landing.scanNow': { EN: 'Scan Now', FR: 'Scanner maintenant', AR: 'ابدأ المسح' },
  'landing.askAssistant': { EN: 'Ask the Assistant', FR: "Demander à l'assistant", AR: 'اسأل المساعد' },
  'landing.sources': { EN: 'Sources: FAO Food Waste (2011), FAO SOFI (2023), FAO Water Stress (2021)', FR: 'Sources : FAO gaspillage alimentaire (2011), FAO SOFI (2023), FAO stress hydrique (2021)', AR: 'المصادر: الفاو هدر الغذاء (2011)، الفاو SOFI (2023)، الفاو ضغط المياه (2021)' },
  'landing.smartScanning': { EN: 'Smart Scanning', FR: 'Scan intelligent', AR: 'مسح ذكي' },
  'landing.recipeIdeas': { EN: 'Recipe Ideas', FR: 'Idées de recettes', AR: 'أفكار وصفات' },
  'landing.chatAndNutrition': { EN: 'Chat & Nutrition Facts', FR: 'Chat & Infos nutritionnelles', AR: 'دردشة ومعلومات غذائية' },
  'landing.moroccanHouseholds': { EN: 'For Moroccan households', FR: 'Pour les ménages marocains', AR: 'للأسر المغربية' },
  'landing.globalImpact': { EN: 'Global impact', FR: 'Impact mondial', AR: 'الأثر العالمي' },
  'landing.scienceBacked': { EN: 'Science-backed', FR: 'Fondé sur la science', AR: 'مدعوم علميًا' },
  'landing.moroccanBody': { EN: 'Morocco cultivates ~8.7M hectares and supports ~4M agricultural jobs. Co-products reach ~2.1M tonnes/year, with a potential economic value near €420M. SafeLeafKitchen helps families valorize edible leaves using trusted recipes and safety guidance.', FR: 'Le Maroc cultive ~8,7 M d’hectares et soutient ~4 M d’emplois agricoles. Les coproduits atteignent ~2,1 M de tonnes/an, avec une valeur économique potentielle proche de 420 M€. SafeLeafKitchen aide les familles à valoriser les feuilles comestibles grâce à des recettes fiables et des conseils de sécurité.', AR: 'يزرع المغرب حوالي 8.7 ملايين هكتار ويدعم حوالي 4 ملايين وظيفة زراعية. تصل المنتجات الثانوية إلى حوالي 2.1 مليون طن/سنة بقيمة اقتصادية محتملة تبلغ 420 مليون يورو. يساعد SafeLeafKitchen العائلات على تثمين الأوراق الصالحة للأكل بوصفات موثوقة وتوجيهات السلامة.' },
  'landing.globalBody': { EN: 'Cutting avoidable waste by even 20% across targeted users reduces emissions and pressure on water and land. Community adoption through cooperatives can scale traceability and local value chains.', FR: 'Réduire de 20 % les gaspillages évitables chez les utilisateurs ciblés diminue les émissions et la pression sur l’eau et les terres. L’adoption communautaire via les coopératives peut développer la traçabilité et les chaînes de valeur locales.', AR: 'تقليل الهدر الممكن تجنبه بنسبة 20٪ لدى المستخدمين المستهدفين يقلل الانبعاثات والضغط على المياه والأراضي. يمكن لاعتماد المجتمع عبر التعاونيات توسيع التتبع وسلاسل القيمة المحلية.' },
  'landing.scienceBody': { EN: 'AI recognition for 9 species with 129 validated scientific parameters. Nutrition examples: Turnip leaves up to 30.8% protein; Beet leaves ~2840 mg Ca/100g; Kohlrabi leaves rich in antioxidants.', FR: 'Reconnaissance par IA de 9 espèces avec 129 paramètres scientifiques validés. Exemples : Feuilles de navet jusqu’à 30,8 % de protéines ; Feuilles de betterave ~2840 mg Ca/100g ; Feuilles de chou-rave riches en antioxydants.', AR: 'تعرف الذكاء الاصطناعي على 9 أنواع مع 129 معلمة علمية موثقة. أمثلة غذائية: أوراق اللفت حتى 30.8% بروتين؛ أوراق الشمندر ~2840 ملغ كالسيوم/100غ؛ أوراق الكرنب غنيّة بمضادات الأكسدة.' },
  'landing.partnersBody': { EN: 'Led with support from FAO (Food and Agriculture Organization) with technology and research partners in Morocco and beyond. Cooperative integration and traceability by design.', FR: 'Porté avec le soutien de la FAO (Organisation des Nations Unies pour l’alimentation et l’agriculture) et des partenaires technologiques et de recherche au Maroc et ailleurs. Intégration coopérative et traçabilité par conception.', AR: 'بدعم من منظمة الفاو وشركاء تقنيين وبحثيين في المغرب وخارجه. تكامل تعاوني وتتبع مدمج في التصميم.' },
  'landing.howItWorks': { EN: 'How it works', FR: 'Comment ça marche', AR: 'كيف يعمل' },
  'landing.hiw.1': { EN: '1. Scan with your smartphone', FR: '1. Scannez avec votre smartphone', AR: '1. امسح بهاتفك' },
  'landing.hiw.2': { EN: '2. AI identifies the leaf', FR: '2. الذكاء الاصطناعي يحدد الورقة', AR: '2. الذكاء الاصطناعي يحدد الورقة' },
  'landing.hiw.3': { EN: '3. Analyze nutrition profile', FR: '3. Analysez le profil nutritionnel', AR: '3. حلل الملف الغذائي' },
  'landing.hiw.4': { EN: '4. Cook with guided recipes', FR: '4. Cuisinez avec des recettes guidées', AR: '4. اطبخ بوصفات موجهة' },
  'landing.partners': { EN: 'Partners', FR: 'Partenaires', AR: 'شركاء' },
  'landing.bottomCtaQuote': { EN: '“Together, let’s transform today’s waste into tomorrow’s resources for a sustainable food future.”', FR: '« Transformons ensemble les déchets d’aujourd’hui en ressources de demain pour un avenir alimentaire durable. »', AR: '"معًا، لنجعل هدر اليوم مورد الغد من أجل مستقبل غذائي مستدام."' },
  'landing.startScanning': { EN: 'Start Scanning', FR: 'Commencer le scan', AR: 'ابدأ المسح' },
  'landing.exploreRecipes': { EN: 'Explore Recipes', FR: 'Explorer les recettes', AR: 'استكشف الوصفات' },
  'landing.leavesEncyclopedia': { EN: 'Leaves Encyclopedia', FR: 'Encyclopédie des feuilles', AR: 'موسوعة الأوراق' },

  // Leaves page
  'leaves.title': { EN: 'Leaves', FR: 'Feuilles', AR: 'أوراق' },
  'leaves.searchPlaceholder': { EN: 'Search leaves...', FR: 'Rechercher des feuilles...', AR: 'ابحث عن الأوراق...' },
  'leaves.keyNutrients': { EN: 'Key nutrients', FR: 'Nutriments clés', AR: 'المغذيات الرئيسية' },
  'leaves.bioactiveDensity': { EN: 'Bioactive density', FR: 'Densité bioactive', AR: 'كثافة المركبات الحيوية' },
  'leaves.antioxidantClass': { EN: 'Antioxidant class', FR: 'Classe antioxydante', AR: 'فئة مضادات الأكسدة' },
  'leaves.summary': { EN: 'Summary', FR: 'Résumé', AR: 'الملخص' },
  'leaves.keyCompounds': { EN: 'Key compounds', FR: 'Composés clés', AR: 'المركبات الرئيسية' },
  'leaves.mainBioactivities': { EN: 'Main bioactivities', FR: 'Activités biologiques principales', AR: 'الأنشطة الحيوية الرئيسية' },
  'leaves.safety': { EN: 'Safety', FR: 'Sécurité', AR: 'السلامة' },
  'leaves.selectLeaf': { EN: 'Select a Leaf', FR: 'Sélectionnez une feuille', AR: 'اختر ورقة' },
  'leaves.selectLeafHint': { EN: 'Choose a leaf from the sidebar to view its nutritional and descriptive profile.', FR: 'Choisissez une feuille dans le menu pour voir son profil nutritionnel et descriptif.', AR: 'اختر ورقة من القائمة لعرض ملفها الغذائي والوصف.' },
  'leaves.highlight.proteins': { EN: 'Proteins', FR: 'Protéines', AR: 'بروتينات' },
  'leaves.highlight.polyphenolsPer100g': { EN: 'Polyphenols / 100g', FR: 'Polyphénols / 100g', AR: 'بوليفينولات / 100غ' },
  'leaves.highlight.flavonoidsPer100g': { EN: 'Flavonoids / 100g', FR: 'Flavonoïdes / 100g', AR: 'فلافونويدات / 100غ' },
  'leaves.highlight.calciumPer100g': { EN: 'Calcium / 100g', FR: 'Calcium / 100g', AR: 'كالسيوم / 100غ' },

  // Recipes page
  'recipes.title': { EN: 'Recipes', FR: 'Recettes', AR: 'وصفات' },
  'recipes.selectHint': { EN: 'Select a recipe to view details', FR: 'Sélectionnez une recette pour voir les détails', AR: 'اختر وصفة لعرض التفاصيل' },
  'recipes.traditionalSubtitle': { EN: 'Traditional Moroccan recipe with fresh, nutritious leaves', FR: 'Recette marocaine traditionnelle avec des feuilles fraîches et nutritives', AR: 'وصفة مغربية تقليدية بأوراق طازجة ومغذية' },
  'recipes.ingredients': { EN: 'Ingredients', FR: 'Ingrédients', AR: 'المكونات' },
  'recipes.instructions': { EN: 'Instructions', FR: 'Instructions', AR: 'الخطوات' },
  'recipes.nutritionalProfile': { EN: 'Nutritional Profile', FR: 'Profil nutritionnel', AR: 'الملف الغذائي' },
  'recipes.useRecipe': { EN: 'Use Recipe', FR: 'Utiliser la recette', AR: 'استخدم الوصفة' },
  'recipes.favorited': { EN: 'Favorited', FR: 'En favori', AR: 'مفضلة' },
  'recipes.addToFavorites': { EN: 'Add to favorites', FR: 'Ajouter aux favoris', AR: 'أضف إلى المفضلة' },
  'recipes.viewFull': { EN: 'View Full Recipe', FR: 'Voir la recette complète', AR: 'عرض الوصفة كاملة' },
  'recipes.selectRecipe': { EN: 'Select a Recipe', FR: 'Sélectionnez une recette', AR: 'اختر وصفة' },
  'recipes.emptyHint': { EN: 'Choose a recipe from the sidebar to view its details, ingredients, and cooking instructions.', FR: 'Choisissez une recette dans le menu pour voir ses détails, ingrédients et instructions de cuisson.', AR: 'اختر وصفة من القائمة لعرض التفاصيل والمكونات وطريقة التحضير.' },
  'recipes.card.proteins': { EN: 'Proteins', FR: 'Protéines', AR: 'بروتينات' },
  'recipes.card.polyphenols': { EN: 'Polyphenols', FR: 'Polyphénols', AR: 'بوليفينولات' },
  'recipes.card.flavonoids': { EN: 'Flavonoids', FR: 'Flavonoïdes', AR: 'فلافونويدات' },
  'recipes.nutrition.fats': { EN: 'Fats', FR: 'Lipides', AR: 'دهون' },
  'recipes.nutrition.moisture': { EN: 'Moisture', FR: 'Humidité', AR: 'رطوبة' },
  'recipes.nutrition.ash': { EN: 'Ash', FR: 'Cendres', AR: 'رماد' },
  'recipes.ingredientsCount': { EN: 'ingredients', FR: 'ingrédients', AR: 'مكونات' },

  // Stats page
  'stats.headerTitle': { EN: 'Your Nutrition Journey', FR: 'Votre parcours nutritionnel', AR: 'رحلتك الغذائية' },
  'stats.headerSubtitle': { EN: 'Track your discoveries and insights', FR: 'Suivez vos découvertes et vos analyses', AR: 'تتبع اكتشافاتك ورؤاك' },
  'stats.controls': { EN: 'Controls', FR: 'Contrôles', AR: 'التحكم' },
  'stats.resetAllData': { EN: 'Reset All Data', FR: 'Réinitialiser toutes les données', AR: 'إعادة تعيين كل البيانات' },
  'stats.mostScannedLeaves': { EN: 'Most Scanned Leaves', FR: 'Feuilles les plus scannées', AR: 'أكثر الأوراق مسحًا' },
  'stats.nutritionalInsights': { EN: 'Nutritional Insights', FR: 'Analyses nutritionnelles', AR: 'رؤى غذائية' },
  'stats.recipeInsights': { EN: 'Recipe Insights', FR: 'Analyses de recettes', AR: 'رؤى الوصفات' },
  'stats.recipeNutritionSummary': { EN: 'Recipe Nutrition Summary', FR: 'Résumé nutritionnel des recettes', AR: 'ملخص تغذية الوصفات' },
  'stats.thisWeekSummary': { EN: "This Week's Summary", FR: 'Récapitulatif de la semaine', AR: 'ملخص هذا الأسبوع' },

  // Stats: cards
  'stats.card.totalScans': { EN: 'Total Scans', FR: 'Scans totaux', AR: 'إجمالي المسحات' },
  'stats.card.chatMessages': { EN: 'Chat Messages', FR: 'Messages de chat', AR: 'رسائل الدردشة' },
  'stats.card.availableRecipes': { EN: 'Available Recipes', FR: 'Recettes disponibles', AR: 'الوصفات المتاحة' },
  'stats.card.highAntioxidant': { EN: 'High Antioxidant', FR: 'Antioxydants élevés', AR: 'مضادات أكسدة مرتفعة' },
  'stats.card.recipesViewed': { EN: 'Recipes Viewed', FR: 'Recettes vues', AR: 'وصفات تم عرضها' },
  'stats.card.favorites': { EN: 'Favorites', FR: 'Favoris', AR: 'المفضلة' },
  'stats.card.savedConversations': { EN: 'Saved Conversations', FR: 'Conversations enregistrées', AR: 'محادثات محفوظة' },
  'stats.card.moneySaved': { EN: 'Money Saved (MAD)', FR: 'Argent économisé (MAD)', AR: 'المال المُوفَّر (درهم)' },
  'stats.card.co2Avoided': { EN: 'CO₂e Avoided (kg)', FR: 'CO₂e évité (kg)', AR: 'الانبعاثات المتجنبة (كغ)' },
  'stats.card.suffix.moroccanInspired': { EN: 'Moroccan inspired', FR: 'Inspiration marocaine', AR: 'مستوحاة من المغرب' },
  'stats.card.suffix.recipesAvailable': { EN: 'recipes available', FR: 'recettes disponibles', AR: 'وصفات متاحة' },
  'stats.card.suffix.fromRecipes': { EN: 'from recipes', FR: 'depuis les recettes', AR: 'من الوصفات' },
  'stats.card.suffix.savedRecipes': { EN: 'saved recipes', FR: 'recettes sauvegardées', AR: 'وصفات محفوظة' },
  'stats.card.suffix.conversationsStored': { EN: 'conversations stored', FR: 'conversations enregistrées', AR: 'محادثات مخزنة' },
  'stats.card.suffix.fromWildLeaves': { EN: 'from wild leaves', FR: 'des feuilles sauvages', AR: 'من الأوراق البرية' },
  'stats.card.suffix.environmentalImpact': { EN: 'environmental impact', FR: "impact environnemental", AR: 'الأثر البيئي' },

  // Stats: insights
  'stats.insight.avgProteins': { EN: 'Avg Proteins', FR: 'Protéines moy.', AR: 'متوسط البروتين' },
  'stats.insight.avgPolyphenols': { EN: 'Avg Polyphenols', FR: 'Polyphénols moy.', AR: 'متوسط البوليفينولات' },
  'stats.insight.avgFlavonoids': { EN: 'Avg Flavonoids', FR: 'Flavonoïdes moy.', AR: 'متوسط الفلافونويدات' },
  'stats.insight.perRecipe': { EN: 'per recipe', FR: 'par recette', AR: 'لكل وصفة' },

  // Stats: nutrition summary labels
  'stats.summary.totalAntioxidantScore': { EN: 'Total Antioxidant Score', FR: 'Score antioxydant total', AR: 'إجمالي مؤشر مضادات الأكسدة' },
  'stats.summary.avgProteins': { EN: 'Average Proteins', FR: 'Protéines moyennes', AR: 'متوسط البروتين' },
  'stats.summary.totalPolyphenols': { EN: 'Total Polyphenols', FR: 'Polyphénols totaux', AR: 'إجمالي البوليفينولات' },
  'stats.summary.highAntioxidantRecipes': { EN: 'High Antioxidant Recipes', FR: 'Recettes à fort pouvoir antioxydant', AR: 'وصفات بمضادات أكسدة عالية' },
  'stats.summary.totalProteinsAll': { EN: 'Total Proteins (All Recipes)', FR: 'Protéines totales (toutes recettes)', AR: 'إجمالي البروتين (كل الوصفات)' },
  'stats.summary.totalPolyphenolsAll': { EN: 'Total Polyphenols (All Recipes)', FR: 'Polyphénols totaux (toutes recettes)', AR: 'إجمالي البوليفينولات (كل الوصفات)' },

  // Stats: impact section
  'stats.impact.header': { EN: 'Environmental & Economic Impact', FR: 'Impact environnemental et économique', AR: 'الأثر البيئي والاقتصادي' },
  'stats.impact.totalMoneySaved': { EN: 'Total Money Saved', FR: 'Argent total économisé', AR: 'إجمالي المال المُوفَّر' },
  'stats.impact.co2eAvoided': { EN: 'CO₂e Avoided', FR: 'CO₂e évité', AR: 'الانبعاثات المتجنبة' },
  'stats.impact.totalLeavesUsed': { EN: 'Total Leaves Used', FR: 'Total des feuilles utilisées', AR: 'إجمالي الأوراق المستخدمة' },
  'stats.impact.wildLeavesNote': { EN: 'Wild leaves harvested instead of bought', FR: 'Feuilles sauvages récoltées au lieu d’être achetées', AR: 'أوراق برية جُمعت بدلًا من شرائها' },
  'stats.impact.polyphenolsGained': { EN: 'Polyphenols Gained', FR: 'Polyphénols gagnés', AR: 'البوليفينولات المكتسبة' },
  'stats.impact.antioxidantCompoundsConsumed': { EN: 'Antioxidant compounds consumed', FR: 'Composés antioxydants consommés', AR: 'مركبات مضادة للأكسدة مستهلكة' },
  'stats.impact.bottomNote': { EN: 'Every wild leaf you use saves money, reduces environmental impact, and boosts your nutrition!', FR: 'Chaque feuille sauvage utilisée permet d’économiser de l’argent, de réduire l’impact environnemental et d’améliorer votre nutrition !', AR: 'كل ورقة برية تستخدمها توفّر المال، وتقلل الأثر البيئي، وتعزز تغذيتك!' },

  // Stats: weekly summary
  'stats.week.mostActiveDay': { EN: 'Most Active Day', FR: 'Jour le plus actif', AR: 'أكثر الأيام نشاطًا' },
  'stats.week.favoriteLeafType': { EN: 'Favorite Leaf Type', FR: 'Type de feuille préféré', AR: 'نوع الورقة المفضل' },
  'stats.week.averageSessionTime': { EN: 'Average Session Time', FR: 'Temps de session moyen', AR: 'متوسط وقت الجلسة' },
  'stats.week.recipesAvailable': { EN: 'Recipes Available', FR: 'Recettes disponibles', AR: 'الوصفات المتاحة' },
  'stats.week.avgCookingTime': { EN: 'Avg Cooking Time', FR: 'Temps de cuisson moy.', AR: 'متوسط وقت الطهي' },
  'stats.week.totalLeafScans': { EN: 'Total Leaf Scans', FR: 'Total des scans de feuilles', AR: 'إجمالي مسحات الأوراق' },
  'stats.week.noDataYet': { EN: 'No data yet', FR: 'Pas encore de données', AR: 'لا توجد بيانات بعد' },
  'stats.common.scans': { EN: 'scans', FR: 'scans', AR: 'مسحات' },
};

interface I18nContextValue {
  lang: SupportedLang;
  setLanguage: (lang: SupportedLang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children, translations }: { children: React.ReactNode; translations?: Translations }) {
  const [lang, setLang] = useState<SupportedLang>(() => (localStorage.getItem('lang') as SupportedLang) || 'EN');

  const dictionary = useMemo(() => ({ ...defaultTranslations, ...(translations || {}) }), [translations]);

  const setLanguage = useCallback((next: SupportedLang) => {
    setLang(next);
    localStorage.setItem('lang', next);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: next } }));
  }, []);

  const t = useCallback((key: string) => {
    const entry = dictionary[key];
    if (!entry) return key;
    return entry[lang] ?? entry['EN'] ?? key;
  }, [dictionary, lang]);

  useEffect(() => {
    const handler = (e: any) => {
      const next = e?.detail?.lang as SupportedLang | undefined;
      if (next) setLang(next);
    };
    window.addEventListener('languageChanged', handler as EventListener);
    return () => window.removeEventListener('languageChanged', handler as EventListener);
  }, []);

  // Update document direction for RTL/LTR
  useEffect(() => {
    const root = document.documentElement;
    const isRtl = lang === 'AR';
    root.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    if (isRtl) {
      root.classList.add('rtl');
    } else {
      root.classList.remove('rtl');
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


