import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { safeStorage } from "@/lib/safeStorage";
import { logger } from "@/lib/logger";

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

  // Hero Section
  'landing.hero.badge': { EN: 'AI-Powered Leaf Recognition', FR: 'Reconnaissance de feuilles par IA', AR: 'تعرف الذكاء الاصطناعي على الأوراق' },
  'landing.hero.trusted': { EN: 'Trusted by 10,000+ families', FR: 'Utilisé par plus de 10 000 familles', AR: 'موثوق من قبل أكثر من 10,000 عائلة' },
  'landing.hero.leafSpecies': { EN: '9 Leaf Species', FR: '9 espèces de feuilles', AR: '9 أنواع من الأوراق' },
  'landing.hero.scientificParams': { EN: '129 Scientific Parameters', FR: '129 paramètres scientifiques', AR: '129 معلمة علمية' },
  'landing.hero.moroccanRecipes': { EN: 'Moroccan Recipes', FR: 'Recettes marocaines', AR: 'وصفات مغربية' },

  // The Problem Section
  'landing.problem.title': { EN: 'The Hidden Food Crisis', FR: 'La crise alimentaire cachée', AR: 'أزمة الغذاء الخفية' },
  'landing.problem.subtitle': { EN: 'Every day, nutritious food goes to waste while families struggle with rising costs and nutritional gaps', FR: 'Chaque jour, des aliments nutritifs sont gaspillés tandis que les familles luttent contre la hausse des coûts et les carences nutritionnelles', AR: 'كل يوم، تُهدر الأطعمة المغذية بينما تعاني العائلات من ارتفاع التكاليف والثغرات الغذائية' },
  'landing.problem.foodWasted.title': { EN: 'Food Wasted', FR: 'Nourriture gaspillée', AR: 'طعام مُهدر' },
  'landing.problem.foodWasted.desc': { EN: 'Of all food produced globally ends up as waste', FR: 'De toute la nourriture produite mondialement finit comme déchet', AR: 'من جميع الأطعمة المنتجة عالمياً ينتهي بها المطاف كنفايات' },
  'landing.problem.leavesDiscarded.title': { EN: 'Leaves Discarded', FR: 'Feuilles jetées', AR: 'أوراق مُهملة' },
  'landing.problem.leavesDiscarded.desc': { EN: 'Nutrient-rich vegetable leaves thrown away daily', FR: 'Feuilles de légumes riches en nutriments jetées quotidiennement', AR: 'أوراق الخضروات الغنية بالمغذيات تُرمى يومياً' },
  'landing.problem.moneyLost.title': { EN: 'Money Lost', FR: 'Argent perdu', AR: 'أموال مفقودة' },
  'landing.problem.moneyLost.desc': { EN: 'Families spending more while wasting valuable nutrition', FR: 'Les familles dépensent plus tout en gaspillant une nutrition précieuse', AR: 'العائلات تنفق أكثر بينما تُهدر التغذية القيمة' },
  'landing.problem.unknownValue.title': { EN: 'Unknown Value', FR: 'Valeur inconnue', AR: 'قيمة مجهولة' },
  'landing.problem.unknownValue.desc': { EN: 'Hidden nutritional benefits remain undiscovered', FR: 'Les bienfaits nutritionnels cachés restent non découverts', AR: 'الفوائد الغذائية الخفية تبقى غير مكتشفة' },

  // Value Propositions
  'landing.valueProps.scanning.desc': { EN: 'AI-powered leaf identification in seconds', FR: 'Identification des feuilles par IA en quelques secondes', AR: 'تعرف على الأوراق بالذكاء الاصطناعي في ثوانٍ' },
  'landing.valueProps.recipes.desc': { EN: 'Traditional Moroccan recipes with nutritious leaves', FR: 'Recettes marocaines traditionnelles avec des feuilles nutritives', AR: 'وصفات مغربية تقليدية بأوراق مغذية' },
  'landing.valueProps.chat.desc': { EN: 'Expert nutrition advice and cooking guidance', FR: 'Conseils nutritionnels experts et guidance culinaire', AR: 'نصائح غذائية متخصصة وإرشاد الطبخ' },

  // Success Metrics
  'landing.metrics.title': { EN: 'Proven Impact', FR: 'Impact prouvé', AR: 'أثر مُثبت' },
  'landing.metrics.subtitle': { EN: 'Real families are already transforming waste into value with measurable results', FR: 'De vraies familles transforment déjà les déchets en valeur avec des résultats mesurables', AR: 'عائلات حقيقية تحول بالفعل النفايات إلى قيمة بنتائج قابلة للقياس' },
  'landing.metrics.coproducts.title': { EN: 'Co-products Potential', FR: 'Potentiel des coproduits', AR: 'إمكانات المنتجات الثانوية' },
  'landing.metrics.coproducts.desc': { EN: 'Available agricultural co-products in Morocco with €420M economic value', FR: 'Coproduits agricoles disponibles au Maroc avec une valeur économique de 420M€', AR: 'منتجات ثانوية زراعية متاحة في المغرب بقيمة اقتصادية 420 مليون يورو' },
  'landing.metrics.nutritional.title': { EN: 'Nutritional Value', FR: 'Valeur nutritionnelle', AR: 'القيمة الغذائية' },
  'landing.metrics.nutritional.desc': { EN: 'Turnip leaves contain up to 30.8% protein - higher than many meat sources', FR: 'Les feuilles de navet contiennent jusqu\'à 30,8% de protéines - plus que de nombreuses sources de viande', AR: 'أوراق اللفت تحتوي على ما يصل إلى 30.8% بروتين - أعلى من مصادر اللحوم العديدة' },
  'landing.metrics.economic.title': { EN: 'Economic Impact', FR: 'Impact économique', AR: 'الأثر الاقتصادي' },
  'landing.metrics.economic.desc': { EN: 'Average savings per family by utilizing discarded vegetable leaves', FR: 'Économies moyennes par famille en utilisant les feuilles de légumes jetées', AR: 'متوسط التوفير لكل عائلة من استخدام أوراق الخضروات المُهملة' },
  'landing.metrics.units.tonnesYear': { EN: 'tonnes/year', FR: 'tonnes/an', AR: 'طن/سنة' },
  'landing.metrics.units.proteinContent': { EN: 'protein content', FR: 'teneur en protéines', AR: 'محتوى البروتين' },
  'landing.metrics.units.madSavedPerKg': { EN: 'MAD saved per kg', FR: 'MAD économisés par kg', AR: 'درهم موفر لكل كيلو' },

  // How it Works
  'landing.howItWorks.subtitle': { EN: 'Simple steps to transform your cooking with AI-powered leaf recognition', FR: 'Étapes simples pour transformer votre cuisine avec la reconnaissance de feuilles par IA', AR: 'خطوات بسيطة لتحويل طبخك بتعرف الذكاء الاصطناعي على الأوراق' },
  'landing.howItWorks.step1.title': { EN: 'Scan', FR: 'Scanner', AR: 'امسح' },
  'landing.howItWorks.step2.title': { EN: 'Identify', FR: 'Identifier', AR: 'تعرّف' },
  'landing.howItWorks.step3.title': { EN: 'Analyze', FR: 'Analyser', AR: 'حلل' },
  'landing.howItWorks.step4.title': { EN: 'Cook', FR: 'Cuisiner', AR: 'اطبخ' },

  // Target Audience
  'landing.audience.title': { EN: 'Who We Serve', FR: 'Qui nous servons', AR: 'من نخدم' },
  'landing.audience.subtitle': { EN: 'SafeLeafKitchen empowers diverse communities to reduce waste and improve nutrition', FR: 'SafeLeafKitchen autonomise diverses communautés pour réduire le gaspillage et améliorer la nutrition', AR: 'يمكّن SafeLeafKitchen مجتمعات متنوعة من تقليل النفايات وتحسين التغذية' },
  'landing.audience.primary.title': { EN: 'Primary Users', FR: 'Utilisateurs principaux', AR: 'المستخدمون الأساسيون' },
  'landing.audience.secondary.title': { EN: 'Secondary Users', FR: 'Utilisateurs secondaires', AR: 'المستخدمون الثانويون' },
  'landing.audience.ecoFamilies.title': { EN: 'Eco-conscious Families', FR: 'Familles éco-conscientes', AR: 'عائلات واعية بيئياً' },
  'landing.audience.ecoFamilies.desc': { EN: 'Households committed to sustainable living and reducing environmental impact', FR: 'Ménages engagés dans un mode de vie durable et la réduction de l\'impact environnemental', AR: 'أسر ملتزمة بالعيش المستدام وتقليل الأثر البيئي' },
  'landing.audience.homeCooks.title': { EN: 'Home Cooks', FR: 'Cuisiniers domestiques', AR: 'طباخون منزليون' },
  'landing.audience.homeCooks.desc': { EN: 'Cooking enthusiasts looking for creative, nutritious recipe ideas', FR: 'Passionnés de cuisine cherchant des idées de recettes créatives et nutritives', AR: 'عشاق الطبخ يبحثون عن أفكار وصفات إبداعية ومغذية' },
  'landing.audience.healthFocused.title': { EN: 'Health-focused Individuals', FR: 'Personnes axées sur la santé', AR: 'أفراد مهتمون بالصحة' },
  'landing.audience.healthFocused.desc': { EN: 'People prioritizing nutrition and wellness in their daily lives', FR: 'Personnes privilégiant la nutrition et le bien-être dans leur vie quotidienne', AR: 'أشخاص يعطون الأولوية للتغذية والعافية في حياتهم اليومية' },
  'landing.audience.students.title': { EN: 'Budget-conscious Students', FR: 'Étudiants soucieux du budget', AR: 'طلاب واعون بالميزانية' },
  'landing.audience.students.desc': { EN: 'Young adults seeking affordable, nutritious meal solutions', FR: 'Jeunes adultes cherchant des solutions de repas nutritifs et abordables', AR: 'شباب يبحثون عن حلول وجبات مغذية وبأسعار معقولة' },
  'landing.audience.restaurants.title': { EN: 'Sustainable Restaurants', FR: 'Restaurants durables', AR: 'مطاعم مستدامة' },
  'landing.audience.restaurants.desc': { EN: 'Food service businesses focused on zero-waste practices', FR: 'Entreprises de restauration axées sur les pratiques zéro déchet', AR: 'شركات خدمات الطعام المركزة على ممارسات عدم الهدر' },
  'landing.audience.influencers.title': { EN: 'Food Influencers', FR: 'Influenceurs culinaires', AR: 'مؤثرون في الطعام' },
  'landing.audience.influencers.desc': { EN: 'Content creators promoting sustainable food and lifestyle choices', FR: 'Créateurs de contenu promouvant l\'alimentation durable et les choix de style de vie', AR: 'منشئو المحتوى يروجون للطعام المستدام وخيارات نمط الحياة' },

  // Team Section
  'landing.team.title': { EN: 'Project Team', FR: 'Équipe de Projet', AR: 'فريق المشروع' },
  'landing.team.subtitle': { EN: 'A multidisciplinary team of experts combining nutrition science, technology, and sustainable development', FR: 'Une équipe multidisciplinaire d\'experts combinant science de la nutrition, technologie et développement durable', AR: 'فريق متعدد التخصصات من الخبراء يجمع بين علوم التغذية والتكنولوجيا والتنمية المستدامة' },
  'landing.team.online': { EN: 'Online', FR: 'En ligne', AR: 'عبر الإنترنت' },
  'landing.team.roles.scientificDirector': { EN: 'Scientific Director', FR: 'Directrice Scientifique', AR: 'مديرة علمية' },
  'landing.team.roles.researcher': { EN: 'Researcher', FR: 'Chercheuse', AR: 'باحثة' },
  'landing.team.roles.projectCoordinator': { EN: 'Project Coordinator', FR: 'Coordinateur Projet', AR: 'منسق المشروع' },
  'landing.team.roles.coordinator': { EN: 'Coordinator', FR: 'Coordinatrice', AR: 'منسقة' },
  'landing.team.roles.specialist': { EN: 'Specialist', FR: 'Spécialiste', AR: 'أخصائي' },
  'landing.team.roles.leadDeveloper': { EN: 'Lead Developer', FR: 'Lead Developer', AR: 'مطور رئيسي' },
  'landing.team.roles.academicAdvisor': { EN: 'Academic Advisor', FR: 'Conseiller Académique', AR: 'مستشار أكاديمي' },
  'landing.team.specialties.nutritionHealth': { EN: 'Nutrition & Public Health', FR: 'Nutrition & Santé Publique', AR: 'التغذية والصحة العامة' },
  'landing.team.specialties.nutritionalAnalysis': { EN: 'Nutritional Analysis', FR: 'Analyses Nutritionnelles', AR: 'التحليل الغذائي' },
  'landing.team.specialties.appDevelopment': { EN: 'Application Development', FR: 'Développement Application', AR: 'تطوير التطبيقات' },
  'landing.team.specialties.cooperatives': { EN: 'Cooperatives', FR: 'Coopératives', AR: 'التعاونيات' },
  'landing.team.specialties.coproductsValorization': { EN: 'Co-products Valorization', FR: 'Valorisation Co-produits', AR: 'تثمين المنتجات الثانوية' },
  'landing.team.specialties.techArchitect': { EN: 'Tech Stack Architect', FR: 'Tech Stack Architect', AR: 'مهندس المكدس التقني' },
  'landing.team.specialties.onlineParticipation': { EN: 'Online Participation', FR: 'Participation en ligne', AR: 'المشاركة عبر الإنترنت' },

  // Acknowledgments
  'landing.acknowledgments.title': { EN: 'Acknowledgments', FR: 'Remerciements', AR: 'شكر وتقدير' },
  'landing.acknowledgments.subtitle': { EN: 'We thank our partners and sponsors who make this project possible', FR: 'Nous remercions nos partenaires et sponsors qui rendent ce projet possible', AR: 'نشكر شركاءنا والرعاة الذين يجعلون هذا المشروع ممكناً' },
  'landing.acknowledgments.organizers': { EN: 'Organizers & Sponsors', FR: 'Organisateurs & Sponsors', AR: 'منظمون ورعاة' },
  'landing.acknowledgments.specialThanks': { EN: 'Special Thanks', FR: 'Remerciements Spéciaux', AR: 'شكر خاص' },
  'landing.acknowledgments.fao.desc': { EN: 'Global Organization', FR: 'Organisation mondiale', AR: 'منظمة عالمية' },
  'landing.acknowledgments.brightidea.desc': { EN: 'Innovation partner', FR: 'Partenaire innovation', AR: 'شريك الابتكار' },
  'landing.acknowledgments.innovationhub.desc': { EN: 'Technology accelerator', FR: 'Accélérateur technologique', AR: 'مسرع التكنولوجيا' },
  'landing.acknowledgments.universities.desc': { EN: 'Academic partners', FR: 'Partenaires académiques', AR: 'شركاء أكاديميون' },
  'landing.acknowledgments.faoHack': { EN: 'for this exceptional opportunity to present SafeLeafKitchen and contribute to global food security through technological innovation and agricultural co-products valorization.', FR: 'pour cette opportunité exceptionnelle de présenter SafeLeafKitchen et contribuer à la sécurité alimentaire mondiale à travers l\'innovation technologique et la valorisation des co-produits agricoles.', AR: 'لهذه الفرصة الاستثنائية لتقديم SafeLeafKitchen والمساهمة في الأمن الغذائي العالمي من خلال الابتكار التكنولوجي وتثمين المنتجات الثانوية الزراعية.' },

  // Access Levels
  'landing.access.title': { EN: 'Start Your Journey', FR: 'Commencez votre parcours', AR: 'ابدأ رحلتك' },
  'landing.access.subtitle': { EN: 'Choose the level of access that fits your sustainable cooking goals', FR: 'Choisissez le niveau d\'accès qui correspond à vos objectifs de cuisine durable', AR: 'اختر مستوى الوصول الذي يناسب أهدافك في الطبخ المستدام' },
  'landing.access.mostPopular': { EN: 'Most Popular', FR: 'Le plus populaire', AR: 'الأكثر شعبية' },
  'landing.access.freeAccess': { EN: 'Free Access', FR: 'Accès gratuit', AR: 'وصول مجاني' },
  'landing.access.perfectStart': { EN: 'Perfect for getting started', FR: 'Parfait pour commencer', AR: 'مثالي للبدء' },
  'landing.access.premiumFeatures': { EN: 'Premium Features', FR: 'Fonctionnalités premium', AR: 'ميزات مميزة' },
  'landing.access.comingSoon': { EN: 'Coming Soon', FR: 'Bientôt disponible', AR: 'قريباً' },
  'landing.access.enhancedExperience': { EN: 'Enhanced experience for power users', FR: 'Expérience améliorée pour les utilisateurs avancés', AR: 'تجربة محسنة للمستخدمين المتقدمين' },
  'landing.access.startFree': { EN: 'Start Free', FR: 'Commencer gratuitement', AR: 'ابدأ مجاناً' },
  'landing.access.notifyWhenAvailable': { EN: 'Notify Me When Available', FR: 'Me notifier quand disponible', AR: 'أشعرني عند التوفر' },
  'landing.access.features.aiScans': { EN: 'AI leaf identification (5 scans/day)', FR: 'Identification IA des feuilles (5 scans/jour)', AR: 'تعرف ذكي على الأوراق (5 مسحات/يوم)' },
  'landing.access.features.basicRecipes': { EN: 'Basic Moroccan recipes library', FR: 'Bibliothèque de base de recettes marocaines', AR: 'مكتبة أساسية للوصفات المغربية' },
  'landing.access.features.nutritionalInfo': { EN: 'Nutritional information & safety tips', FR: 'Informations nutritionnelles et conseils de sécurité', AR: 'معلومات غذائية ونصائح السلامة' },
  'landing.access.features.basicTracking': { EN: 'Basic waste tracking', FR: 'Suivi de base des déchets', AR: 'تتبع أساسي للنفايات' },
  'landing.access.features.unlimitedScans': { EN: 'Unlimited leaf scans & identification', FR: 'Scans et identification illimités des feuilles', AR: 'مسح وتعرف غير محدود على الأوراق' },
  'landing.access.features.exclusiveRecipes': { EN: 'Exclusive chef-designed recipes', FR: 'Recettes exclusives conçues par des chefs', AR: 'وصفات حصرية من تصميم الطهاة' },
  'landing.access.features.advancedAnalytics': { EN: 'Advanced impact analytics & reporting', FR: 'Analyses d\'impact avancées et rapports', AR: 'تحليلات وتقارير تأثير متقدمة' },
  'landing.access.features.familyAccounts': { EN: 'Family account linking & shared goals', FR: 'Liaison de comptes familiaux et objectifs partagés', AR: 'ربط حسابات العائلة والأهداف المشتركة' },
  'landing.access.features.priorityAccess': { EN: 'Priority community features access', FR: 'Accès prioritaire aux fonctionnalités communautaires', AR: 'وصول ذو أولوية لميزات المجتمع' },

  // Future Features
  'landing.future.title': { EN: 'Coming Soon', FR: 'Bientôt disponible', AR: 'قريباً' },
  'landing.future.subtitle': { EN: 'Exciting features in development to enhance your sustainable cooking journey', FR: 'Fonctionnalités passionnantes en développement pour améliorer votre parcours culinaire durable', AR: 'ميزات مثيرة قيد التطوير لتعزيز رحلة الطبخ المستدام' },
  'landing.future.communityHub.title': { EN: 'Community Hub', FR: 'Hub communautaire', AR: 'مركز المجتمع' },
  'landing.future.communityHub.desc': { EN: 'Connect with fellow sustainable cooks', FR: 'Connectez-vous avec d\'autres cuisiniers durables', AR: 'تواصل مع طباخين مستدامين آخرين' },
  'landing.future.wasteTracker.title': { EN: 'Advanced Waste Tracker', FR: 'Traceur de déchets avancé', AR: 'متتبع النفايات المتقدم' },
  'landing.future.wasteTracker.desc': { EN: 'Detailed impact analytics', FR: 'Analyses d\'impact détaillées', AR: 'تحليلات تأثير مفصلة' },
  'landing.future.beta': { EN: 'Beta', FR: 'Bêta', AR: 'تجريبي' },
  'landing.future.features.shareRecipes': { EN: 'Share your creative recipes with the community', FR: 'Partagez vos recettes créatives avec la communauté', AR: 'شارك وصفاتك الإبداعية مع المجتمع' },
  'landing.future.features.joinChallenges': { EN: 'Join sustainability challenges and competitions', FR: 'Rejoignez les défis et compétitions de durabilité', AR: 'انضم لتحديات ومنافسات الاستدامة' },
  'landing.future.features.getTips': { EN: 'Get tips and tricks from experienced users', FR: 'Obtenez des conseils et astuces d\'utilisateurs expérimentés', AR: 'احصل على نصائح وحيل من مستخدمين خبراء' },
  'landing.future.features.followInfluencers': { EN: 'Follow your favorite sustainable food influencers', FR: 'Suivez vos influenceurs culinaires durables préférés', AR: 'تابع مؤثريك المفضلين في الطعام المستدام' },
  'landing.future.features.trackCO2': { EN: 'Track CO₂ emissions avoided per meal', FR: 'Suivez les émissions de CO₂ évitées par repas', AR: 'تتبع انبعاثات CO₂ المتجنبة لكل وجبة' },
  'landing.future.features.monitorSavings': { EN: 'Monitor cumulative economic savings', FR: 'Surveillez les économies économiques cumulatives', AR: 'راقب التوفير الاقتصادي التراكمي' },
  'landing.future.features.visualizeImpact': { EN: 'Visualize your nutritional impact over time', FR: 'Visualisez votre impact nutritionnel au fil du temps', AR: 'تصور تأثيرك الغذائي بمرور الوقت' },
  'landing.future.features.setGoals': { EN: 'Set and achieve sustainability goals', FR: 'Fixez et atteignez des objectifs de durabilité', AR: 'حدد واحقق أهداف الاستدامة' },

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
  
  // Analytics charts
  'stats.charts.dailyScans': { EN: 'Daily Scans Trend', FR: 'Tendance des scans quotidiens', AR: 'اتجاه المسح اليومي' },
  'stats.charts.dailyChats': { EN: 'Daily Chats Trend', FR: 'Tendance des discussions quotidiennes', AR: 'اتجاه الدردشة اليومية' },
  'stats.charts.weeklyActivity': { EN: 'Weekly Activity', FR: 'Activité hebdomadaire', AR: 'النشاط الأسبوعي' },
  'stats.charts.leafTrends': { EN: 'Leaf Detection Trends', FR: 'Tendances de détection des feuilles', AR: 'اتجاهات اكتشاف الأوراق' },
  'stats.charts.noData': { EN: 'No leaf detection data available yet', FR: 'Aucune donnée de détection de feuilles disponible', AR: 'لا توجد بيانات اكتشاف أوراق متاحة بعد' },
  'stats.charts.startScanning': { EN: 'Start scanning leaves to see trends here', FR: 'Commencez à scanner des feuilles pour voir les tendances', AR: 'ابدأ مسح الأوراق لرؤية الاتجاهات هنا' },
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
  'stats.card.moneySaved': { EN: 'Money Saved (MAD)', FR: 'Argent économisé (MAD)', AR: 'المال المُوفَّر (درهم)' },
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
  'stats.impact.totalMoneySaved': { EN: 'Total Money Saved', FR: 'Argent total economise', AR: 'إجمالي المال المُوفَّر' },
  'stats.impact.co2eAvoided': { EN: 'CO₂e Avoided', FR: 'CO₂e evite', AR: 'الانبعاثات المتجنبة' },
  'stats.impact.totalLeavesUsed': { EN: 'Total Leaves Used', FR: 'Total des feuilles utilisees', AR: 'إجمالي الأوراق المستخدمة' },
  'stats.impact.wildLeavesNote': { EN: 'Wild leaves harvested instead of bought', FR: 'Feuilles sauvages recoltees au lieu d\'etre achetees', AR: 'أوراق برية جُمعت بدلًا من شرائها' },
  'stats.impact.polyphenolsGained': { EN: 'Polyphenols Gained', FR: 'Polyphenols gagnes', AR: 'البوليفينولات المكتسبة' },
  'stats.impact.antioxidantCompoundsConsumed': { EN: 'Antioxidant compounds consumed', FR: 'Composes antioxydants consommes', AR: 'مركبات مضادة للأكسدة مستهلكة' },
  'stats.impact.bottomNote': { EN: 'Every wild leaf you use saves money, reduces environmental impact, and boosts your nutrition!', FR: 'Chaque feuille sauvage utilisee permet d\'economiser l\'argent, de reduire l\'impact environnemental et d\'ameliorer votre nutrition !', AR: 'كل ورقة برية تستخدمها توفّر المال، وتقلل الأثر البيئي، وتعزز تغذيتك!' },

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
  const [lang, setLang] = useState<SupportedLang>(() => {
    const savedLang = safeStorage.get('lang') as SupportedLang;
    return savedLang || 'EN';
  });

  const dictionary = useMemo(() => ({ ...defaultTranslations, ...(translations || {}) }), [translations]);

  const setLanguage = useCallback((next: SupportedLang) => {
    setLang(next);
    if (!safeStorage.set('lang', next)) {
      logger.warn('Failed to save language preference to localStorage');
    }
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: next } }));
  }, []);

  const t = useCallback((key: string) => {
    const entry = dictionary[key];
    if (!entry) {
      logger.warn(`Translation key not found: ${key}`);
      return key;
    }
    return entry[lang] ?? entry['EN'] ?? key;
  }, [dictionary, lang]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const next = customEvent?.detail?.lang as SupportedLang | undefined;
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


