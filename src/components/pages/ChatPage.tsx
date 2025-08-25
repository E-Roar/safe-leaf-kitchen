
import { useState, useRef, useEffect } from "react";
import { Send, Mic, Camera, MicOff, Volume2, VolumeX, ChefHat, Plus, MessageSquare, Trash2, Search, Tag, Filter, Pause, Leaf as LeafIcon } from "lucide-react";
import { APIService, StorageService, ChatMessage } from "@/services/apiService";
import CameraScanner from "@/components/features/CameraScanner";
import { recipes } from "@/data/recipes";
// Removed toast import
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  suggestedRecipe?: string;
  suggestedLeafId?: number;
  suggestedLeafName?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isTTSMuted, setIsTTSMuted] = useState(APIService.isTTSMuted());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [playingMessages, setPlayingMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Get recipe titles for the system prompt
  const recipeTitles = recipes.map(recipe => recipe.title.en);

  // Function to navigate to recipe page
  const navigateToRecipe = (recipeTitle: string) => {
    // Find the recipe by title
    const recipe = recipes.find(r => r.title.en === recipeTitle);
    if (recipe) {
      // Store the selected recipe in localStorage for the recipe page to read
      localStorage.setItem('selectedRecipeId', recipe.id.toString());
      // Navigate to recipes tab (this will be handled by the parent component)
      // For now, we'll use a custom event
      window.dispatchEvent(new CustomEvent('navigateToRecipe', { 
        detail: { recipeId: recipe.id } 
      }));
      // Removed toast notification
    }
  };

  // Function to navigate to a specific leaf profile
  const navigateToLeaf = (leafId: number) => {
    window.dispatchEvent(new CustomEvent('navigateToLeaf', {
      detail: { leafId }
    }));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
    const handleOpenCamera = () => setShowCamera(true);
    window.addEventListener('openCameraScan', handleOpenCamera as EventListener);

    const loadConversations = () => {
      const conversationList = StorageService.getConversationList();
      setConversations(conversationList);
      
      // Try to restore the last active conversation
      const lastConversationId = StorageService.getCurrentConversationId();
      if (lastConversationId && conversationList.find(c => c.id === lastConversationId)) {
        const savedMessages = StorageService.loadConversation(lastConversationId);
        if (savedMessages) {
          setMessages(savedMessages);
          setCurrentConversationId(lastConversationId);
          setIsFirstMessage(false);
          console.log('Restored last active conversation:', lastConversationId);
          return;
        }
      }
      
      // Try to load the most recent conversation if no last active conversation
      if (!currentConversationId && conversationList.length > 0) {
        const mostRecentConversation = conversationList[0];
        const savedMessages = StorageService.loadConversation(mostRecentConversation.id);
        if (savedMessages) {
          setMessages(savedMessages);
          setCurrentConversationId(mostRecentConversation.id);
          setIsFirstMessage(false);
          StorageService.setCurrentConversationId(mostRecentConversation.id);
          console.log('Loaded most recent conversation:', mostRecentConversation.id);
          return;
        }
      }
      
      // Only start new conversation if no conversations exist
      if (!currentConversationId && conversationList.length === 0) {
        startNewConversation();
      }
    };
    
    loadConversations();

    return () => {
      window.removeEventListener('openCameraScan', handleOpenCamera as EventListener);
    };
  }, []);

  // Filter conversations based on search and tags
  useEffect(() => {
    let filteredConversations = StorageService.getConversationList();
    
    if (searchQuery.trim()) {
      filteredConversations = StorageService.searchConversations(searchQuery);
    }
    
    if (selectedTag) {
      filteredConversations = filteredConversations.filter(c => c.tags.includes(selectedTag));
    }
    
    setConversations(filteredConversations);
  }, [searchQuery, selectedTag]);

  // Save conversation whenever messages change
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      StorageService.saveConversation(currentConversationId, messages);
      // Refresh conversation list
      const conversationList = StorageService.getConversationList();
      setConversations(conversationList);
    }
  }, [messages, currentConversationId]);

  const startNewConversation = () => {
    const newConversationId = StorageService.createNewConversationId();
    setCurrentConversationId(newConversationId);
    StorageService.setCurrentConversationId(newConversationId);
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: "Hello! I'm your SafeLeafKitchen assistant. I can help you identify leaves, provide nutritional information, and suggest delicious Moroccan recipes. What would you like to know about?",
        timestamp: new Date()
      }
    ]);
    setIsFirstMessage(true);
    setShowConversations(false);
          // Removed toast notification
  };

  const loadConversation = (conversationId: string) => {
    const savedMessages = StorageService.loadConversation(conversationId);
    if (savedMessages) {
      setMessages(savedMessages);
      setCurrentConversationId(conversationId);
      StorageService.setCurrentConversationId(conversationId);
      setIsFirstMessage(false);
      setShowConversations(false);
      // Removed toast notification
    }
  };

  const deleteConversation = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    StorageService.deleteConversation(conversationId);
    const updatedConversations = StorageService.getConversationList();
    setConversations(updatedConversations);
    
    // If deleting current conversation, start a new one
    if (conversationId === currentConversationId) {
      StorageService.clearCurrentConversationId();
      startNewConversation();
    }
    
          // Removed toast notification
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
  };

  const getAvailableTags = () => {
    const allConversations = StorageService.getConversationList();
    const allTags = new Set<string>();
    allConversations.forEach(conv => {
      conv.tags.forEach((tag: string) => allTags.add(tag));
    });
    return Array.from(allTags);
  };

  const addMessage = (
    type: 'user' | 'bot' | 'system', 
    content: string, 
    suggestedRecipe?: string,
    suggestedLeafId?: number,
    suggestedLeafName?: string
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      suggestedRecipe,
      suggestedLeafId,
      suggestedLeafName
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    addMessage('user', text);
    setInputText("");
    setIsLoading(true);

    try {
      const chatMessages: ChatMessage[] = [];
      
      // ALWAYS add system message to maintain strict recipe response behavior
      chatMessages.push({
        role: "system",
        content: `You are SafeLeafKitchen, a Moroccan-inspired cooking assistant.

CRITICAL: When users ask for recipes, you must respond with ONLY the exact recipe title from this list, nothing else:
${recipeTitles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

RECIPE RESPONSE RULES:
- If user asks for a recipe: respond with ONLY one exact title from the list above
- Do NOT provide ingredients, instructions, or details
- Do NOT add any extra text, explanations, or formatting
- Do NOT provide long nutritional information or cooking advice
- Just the title exactly as listed

For non-recipe questions: Give short, helpful advice about leaves and nutrition with Moroccan flair (max 2 sentences).

Examples:
User: "I want a recipe with onion leaves"
You: "Stuffed Msemen with Onion Leaves"
 
User: "Give me an easy recipe"
You: "Omelette with Onion Leaves"

User: "What about another recipe?"
You: "Barley Flatbread with Onion Leaves"

User: "Tell me about nutrition"
You: "Onion leaves are rich in antioxidants and vitamins. They provide excellent nutritional benefits for cooking.
and use these facts for onions :
{
    "Plante": "Feuilles d’oignon",
    "Classes_de_composés": [
        {
            "Classe": "Flavonoïdes & polyphénols",
            "Molécules_clés": [
                "Quercétine",
                "Isorhamnétine",
                "Kaempférol",
                "Lutéoline",
                "Acides phénoliques (acide gallique, férulique, syringique, protocatéchique, chlorogénique, vanillique, coumarique, cinnamique, benzoïque)"
            ],
            "Activités_biologiques": [
                "Antioxydante",
                "Anti-inflammatoire",
                "Antidiabétique",
                "Neuroprotecteur"
            ]
        },
        {
            "Classe": "Composés organosulfurés",
            "Molécules_clés": [
                "Cystéine sulfoxyde",
                "Onionin A",
                "Thiosulfinates",
                "Cépaènes",
                "Sulfones"
            ],
            "Activités_biologiques": [
                "Antimicrobien",
                "Anti-inflammatoire",
                "Antithrombotique"
            ]
        },
        {
            "Classe": "Anthocyanines",
            "Molécules_clés": [
                "Cyanidine 3-glucosides",
                "Péonidine glucosides",
                "Pétunidine glucoside",
                "Carboxypyranocyanidine"
            ],
            "Activités_biologiques": [
                "Antioxydante",
                "Anti-inflammatoire",
                "Cardioprotecteur",
                "Anticancéreuse"
            ]
        }
    ],
    "Toxicité": "Sûre pour la consommation humaine"
}


{
  "Feuille de": "Fenouil",
  "Ratio_Antioxydants_Protéines": "0.23",
  "Polyphénols_Totaux_mg_100g": "50.054475",
  "Flavonoïdes_Totaux_mg_100g": "23.5943985",
  "Composés_Bioactifs_Totaux": "",
  "Indice_Antioxydant_Global_y": "",
  "Score_Bioactifs_y": "",
  "Classification_Antioxydante_y": "Non déterminé",
  "Indice_Antioxydant_Global_CORRIGÉ": "39.4704444",
  "Score_Bioactifs_CORRIGÉ": "28",
  "Classification_Antioxydante_CORRIGÉ": "Faible",
  "Composés_Bioactifs_Totaux_mg_100g": "73.6488735",
  "Densité_Composés_Bioactifs_%": "0.078"
},
{
  "Feuille de": "carotte",
  "Ratio_Antioxydants_Protéines": "1.494",
  "Polyphénols_Totaux_mg_100g": "181.955",
  "Flavonoïdes_Totaux_mg_100g": "75.6",
  "Composés_Bioactifs_Totaux": "257.555",
  "Indice_Antioxydant_Global_y": "139.413",
  "Score_Bioactifs_y": "95.6",
  "Classification_Antioxydante_y": "Très élevé",
  "Indice_Antioxydant_Global_CORRIGÉ": "",
  "Score_Bioactifs_CORRIGÉ": "",
  "Classification_Antioxydante_CORRIGÉ": "",
  "Composés_Bioactifs_Totaux_mg_100g": "",
  "Densité_Composés_Bioactifs_%": "0.274"
},
{
  "Feuille de": "chou rave",
  "Ratio_Antioxydants_Protéines": "0.497",
  "Polyphénols_Totaux_mg_100g": "153.219519",
  "Flavonoïdes_Totaux_mg_100g": "123.20262",
  "Composés_Bioactifs_Totaux": "",
  "Indice_Antioxydant_Global_y": "",
  "Score_Bioactifs_y": "",
  "Classification_Antioxydante_y": "",
  "Indice_Antioxydant_Global_CORRIGÉ": "141.2127594",
  "Score_Bioactifs_CORRIGÉ": "100",
  "Classification_Antioxydante_CORRIGÉ": "Très élevé",
  "Composés_Bioactifs_Totaux_mg_100g": "276.422139",
  "Densité_Composés_Bioactifs_%": "0.289"
},
{
  "Feuille de": "Betterave Rouge",
  "Ratio_Antioxydants_Protéines": "0.51",
  "Polyphénols_Totaux_mg_100g": "141.08842",
  "Flavonoïdes_Totaux_mg_100g": "62.7181225",
  "Composés_Bioactifs_Totaux": "283.46",
  "Indice_Antioxydant_Global_y": "145.903",
  "Score_Bioactifs_y": "100",
  "Classification_Antioxydante_y": "Très élevé",
  "Indice_Antioxydant_Global_CORRIGÉ": "109.740301",
  "Score_Bioactifs_CORRIGÉ": "77.7",
  "Classification_Antioxydante_CORRIGÉ": "Élevé",
  "Composés_Bioactifs_Totaux_mg_100g": "203.8065425",
  "Densité_Composés_Bioactifs_%": "0.214"
},
{
  "Feuille de": "Radis",
  "Ratio_Antioxydants_Protéines": "0.515",
  "Polyphénols_Totaux_mg_100g": "148.30621",
  "Flavonoïdes_Totaux_mg_100g": "62.1091",
  "Composés_Bioactifs_Totaux": "86.57",
  "Indice_Antioxydant_Global_y": "49.102",
  "Score_Bioactifs_y": "33.7",
  "Classification_Antioxydante_y": "Faible",
  "Indice_Antioxydant_Global_CORRIGÉ": "113.827366",
  "Score_Bioactifs_CORRIGÉ": "80.6",
  "Classification_Antioxydante_CORRIGÉ": "Très élevé",
  "Composés_Bioactifs_Totaux_mg_100g": "210.41531",
  "Densité_Composés_Bioactifs_%": "0.228"
},
{
  "Feuille de": "Oignon",
  "Ratio_Antioxydants_Protéines": "1.088",
  "Polyphénols_Totaux_mg_100g": "160.94",
  "Flavonoïdes_Totaux_mg_100g": "67.4",
  "Composés_Bioactifs_Totaux": "228.34",
  "Indice_Antioxydant_Global_y": "123.524",
  "Score_Bioactifs_y": "84.7",
  "Classification_Antioxydante_y": "Très élevé",
  "Indice_Antioxydant_Global_CORRIGÉ": "",
  "Score_Bioactifs_CORRIGÉ": "",
  "Classification_Antioxydante_CORRIGÉ": "",
  "Composés_Bioactifs_Totaux_mg_100g": "",
  "Densité_Composés_Bioactifs_%": "0.244"
},
{
  "Feuille de": "Poireau",
  "Ratio_Antioxydants_Protéines": "0.365",
  "Polyphénols_Totaux_mg_100g": "69.583755",
  "Flavonoïdes_Totaux_mg_100g": "13.6533",
  "Composés_Bioactifs_Totaux": "214.195",
  "Indice_Antioxydant_Global_y": "115.334",
  "Score_Bioactifs_y": "79",
  "Classification_Antioxydante_y": "Élevé",
  "Indice_Antioxydant_Global_CORRIGÉ": "47.211573",
  "Score_Bioactifs_CORRIGÉ": "33.4",
  "Classification_Antioxydante_CORRIGÉ": "Faible",
  "Composés_Bioactifs_Totaux_mg_100g": "83.237055",
  "Densité_Composés_Bioactifs_%": "0.087"
},
{
  "Feuille de": "Navet",
  "Ratio_Antioxydants_Protéines": "0.28",
  "Polyphénols_Totaux_mg_100g": "71.801817",
  "Flavonoïdes_Totaux_mg_100g": "65.9333535",
  "Composés_Bioactifs_Totaux": "",
  "Indice_Antioxydant_Global_y": "",
  "Score_Bioactifs_y": "",
  "Classification_Antioxydante_y": "",
  "Indice_Antioxydant_Global_CORRIGÉ": "69.4544316",
  "Score_Bioactifs_CORRIGÉ": "49.2",
  "Classification_Antioxydante_CORRIGÉ": "Modéré",
  "Composés_Bioactifs_Totaux_mg_100g": "137.7351705",
  "Densité_Composés_Bioactifs_%": "0.145"
},
{
  "Feuille de": "Artichaut",
  "Ratio_Antioxydants_Protéines": "0.731",
  "Polyphénols_Totaux_mg_100g": "155.1318895",
  "Flavonoïdes_Totaux_mg_100g": "115.3172965",
  "Composés_Bioactifs_Totaux": "77.615",
  "Indice_Antioxydant_Global_y": "41.596",
  "Score_Bioactifs_y": "28.5",
  "Classification_Antioxydante_y": "Faible",
  "Indice_Antioxydant_Global_CORRIGÉ": "139.2060523",
  "Score_Bioactifs_CORRIGÉ": "98.6",
  "Classification_Antioxydante_CORRIGÉ": "Très élevé",
  "Composés_Bioactifs_Totaux_mg_100g": "270.449186",
  "Densité_Composés_Bioactifs_%": "0.283"
}

{
    "Feuille de": "Fenouil",
    "Humidité (%)": "5.11",
    "Cendres (%)": "15.57",
    "Humidité (%)_Écart_Moyenne (%)": "-3.42",
    "Cendres (%)_Écart_Moyenne (%)": "-16.02",
    "Humidité (%)_Percentile": "66.67",
    "Cendres (%)_Percentile": "33.33",
    "Matière Sèche (%)": "94.89",
    "Protéines (%)": "21.74",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "-3.1",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "-0.03",
    "Protéines (%)_Percentile": "55.56",
    "Facteur_Conversion_Protéines_Percentile": "33.33",
    "Ratio Lipides/Protéines": "",
    "Contribution Protéines (%)": "",
    "Ratio_Lipides_Protéines": "",
    "Contribution_Protéines_%": "",
    "Lipides_Moyenne": "",
    "Lipides_EcartType": "",
    "Énergie Lipides (kcal/100g)": "",
    "Contribution Lipides (%)": "",
    "Classification Lipides": "Non déterminé",
    "Lipides_Totaux_%": "",
    "Lipides_EcartType_%": "",
    "Énergie_Lipides_kcal_100g": "",
    "Classification_Lipides": "",
    "Contribution_Énergétique_Lipides_%": "",
    "Contribution_Lipides_%": "",
    "Glucides Estimés (%)": "",
    "Contribution Glucides (%)": "",
    "Glucides_Estimés_%": "",
    "Contribution_Glucides_%": "",
    "Azote Total (%)": "3.48",
    "Azote Total (%)_Écart_Moyenne (%)": "-3.06",
    "Azote Total (%)_Percentile": "55.56",
    "Calcium (mg/100g)": "126.18",
    "Phosphore (mg/100g)": "104.45",
    "Potassium (mg/100g)": "368.49",
    "Magnésium (mg/100g)": "58.23",
    "Sodium (mg/100g)": "147.68",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "-27.21",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "30.54",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "33.49",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "-24.86",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "-46.35",
    "Calcium (mg/100g)_Percentile": "22.22",
    "Phosphore (mg/100g)_Percentile": "77.78",
    "Potassium (mg/100g)_Percentile": "88.89",
    "Magnésium (mg/100g)_Percentile": "33.33",
    "Sodium (mg/100g)_Percentile": "33.33",
    "Fer (mg/100g)": "2.28",
    "Zinc (mg/100g)": "0.48",
    "Cuivre (mg/100g)": "0.14",
    "Manganèse (mg/100g)": "0.34",
    "Bore (mg/100g)": "0.29",
    "Fer (mg/100g)_Écart_Moyenne (%)": "-18.89",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "43.05",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "36.96",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "-50.16",
    "Bore (mg/100g)_Écart_Moyenne (%)": "-34.59",
    "Fer (mg/100g)_Percentile": "55.56",
    "Zinc (mg/100g)_Percentile": "100",
    "Cuivre (mg/100g)_Percentile": "94.44",
    "Manganèse (mg/100g)_Percentile": "27.78",
    "Bore (mg/100g)_Percentile": "11.11",
    "Valeur Énergétique (kcal/100g)": "",
    "Valeur_Énergétique_Recalculée_kcal_100g": "",
    "Densité_Protéique (%)": "22.91",
    "Ratio_Ca_P": "1.21",
    "Ratio_Na_K": "0.4",
    "Densité_Minérale_Totale (mg/100g)": "808.56",
    "Score_Densité_Nutritionnelle": "38.44",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "-3.29",
    "Ratio_Ca_P_Écart_Moyenne (%)": "-46.84",
    "Ratio_Na_K_Écart_Moyenne (%)": "-64.78",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "-8.8",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "3.73",
    "Densité_Protéique (%)_Percentile": "55.56",
    "Ratio_Ca_P_Percentile": "11.11",
    "Ratio_Na_K_Percentile": "33.33",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "44.44",
    "Score_Densité_Nutritionnelle_Percentile": "55.56",
    "Évaluation_Ratio_Ca_P": "Optimal",
    "Évaluation_Ratio_Na_K": "Excellent",
    "Densité Lipidique (%)": "",
    "Densité_Lipidique_%": "",
    "Score_Minéral_Global": "48.79",
    "Indice_Qualité_Protéique": "4.98",
    "Score_Minéral_Global_Écart_Moyenne (%)": "6.14",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "-12.58",
    "Score_Minéral_Global_Percentile": "55.56",
    "Indice_Qualité_Protéique_Percentile": "55.56",
    "Notation_Globale_Étoiles": "4",
    "Alertes_Qualité": "Aucune alerte",
    "Score Lipidique": "",
    "Score_Qualité_Lipidique": "",
    "Indice_Satiété_Lipidique": "",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "0.19",
    "Matière_Organique (%)_Écart_Moyenne (%)": "4.14",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "-8.75",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "-19.3",
    "Matière_Sèche (%)_Percentile": "44.44",
    "Matière_Organique (%)_Percentile": "77.78",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "44.44",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "44.44",
    "Matière_Sèche (%)": "94.89",
    "Matière_Organique (%)": "79.32",
    "Somme_Minéraux_Majeurs (mg/100g)": "805.03",
    "Somme_Oligo_Éléments (mg/100g)": "3.53",
    "Recommandations": "Excellent profil nutritionnel | Riche en protéines | Équilibre Ca/P optimal"
  },
  {
    "Feuille de": "carotte",
    "Humidité (%)": "5.83",
    "Cendres (%)": "17.36",
    "Humidité (%)_Écart_Moyenne (%)": "10.18",
    "Cendres (%)_Écart_Moyenne (%)": "-6.36",
    "Humidité (%)_Percentile": "77.78",
    "Cendres (%)_Percentile": "55.56",
    "Matière Sèche (%)": "94.17",
    "Protéines (%)": "12.18",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "-45.71",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "-0.05",
    "Protéines (%)_Percentile": "11.11",
    "Facteur_Conversion_Protéines_Percentile": "22.22",
    "Ratio Lipides/Protéines": "",
    "Contribution Protéines (%)": "",
    "Ratio_Lipides_Protéines": "0.0862",
    "Contribution_Protéines_%": "15.6",
    "Lipides_Moyenne": "",
    "Lipides_EcartType": "",
    "Énergie Lipides (kcal/100g)": "",
    "Contribution Lipides (%)": "",
    "Classification Lipides": "Non déterminé",
    "Lipides_Totaux_%": "1.05",
    "Lipides_EcartType_%": "0.049",
    "Énergie_Lipides_kcal_100g": "9.5",
    "Classification_Lipides": "Faible",
    "Contribution_Énergétique_Lipides_%": "",
    "Contribution_Lipides_%": "3",
    "Glucides Estimés (%)": "",
    "Contribution Glucides (%)": "",
    "Glucides_Estimés_%": "63.58",
    "Contribution_Glucides_%": "81.4",
    "Azote Total (%)": "1.95",
    "Azote Total (%)_Écart_Moyenne (%)": "-45.68",
    "Azote Total (%)_Percentile": "11.11",
    "Calcium (mg/100g)": "182.92",
    "Phosphore (mg/100g)": "49.99",
    "Potassium (mg/100g)": "175.97",
    "Magnésium (mg/100g)": "77.18",
    "Sodium (mg/100g)": "323.72",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "5.52",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "-37.52",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "-36.26",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "-0.41",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "17.6",
    "Calcium (mg/100g)_Percentile": "55.56",
    "Phosphore (mg/100g)_Percentile": "11.11",
    "Potassium (mg/100g)_Percentile": "11.11",
    "Magnésium (mg/100g)_Percentile": "66.67",
    "Sodium (mg/100g)_Percentile": "66.67",
    "Fer (mg/100g)": "4.91",
    "Zinc (mg/100g)": "0.33",
    "Cuivre (mg/100g)": "0.09",
    "Manganèse (mg/100g)": "0.38",
    "Bore (mg/100g)": "0.55",
    "Fer (mg/100g)_Écart_Moyenne (%)": "74.66",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "-1.66",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "-11.96",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "-44.3",
    "Bore (mg/100g)_Écart_Moyenne (%)": "24.06",
    "Fer (mg/100g)_Percentile": "100",
    "Zinc (mg/100g)_Percentile": "50",
    "Cuivre (mg/100g)_Percentile": "44.44",
    "Manganèse (mg/100g)_Percentile": "44.44",
    "Bore (mg/100g)_Percentile": "100",
    "Valeur Énergétique (kcal/100g)": "",
    "Valeur_Énergétique_Recalculée_kcal_100g": "312.5",
    "Densité_Protéique (%)": "12.93",
    "Ratio_Ca_P": "3.66",
    "Ratio_Na_K": "1.84",
    "Densité_Minérale_Totale (mg/100g)": "816.04",
    "Score_Densité_Nutritionnelle": "26.77",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "-45.4",
    "Ratio_Ca_P_Écart_Moyenne (%)": "61.01",
    "Ratio_Na_K_Écart_Moyenne (%)": "61.68",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "-7.95",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "-27.75",
    "Densité_Protéique (%)_Percentile": "11.11",
    "Ratio_Ca_P_Percentile": "100",
    "Ratio_Na_K_Percentile": "77.78",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "55.56",
    "Score_Densité_Nutritionnelle_Percentile": "33.33",
    "Évaluation_Ratio_Ca_P": "Déséquilibré",
    "Évaluation_Ratio_Na_K": "Élevé",
    "Densité Lipidique (%)": "",
    "Densité_Lipidique_%": "1.115",
    "Score_Minéral_Global": "36",
    "Indice_Qualité_Protéique": "1.58",
    "Score_Minéral_Global_Écart_Moyenne (%)": "-21.69",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "-72.35",
    "Score_Minéral_Global_Percentile": "44.44",
    "Indice_Qualité_Protéique_Percentile": "11.11",
    "Notation_Globale_Étoiles": "1",
    "Alertes_Qualité": "Ratio Ca/P déséquilibré (excès calcium) | Ratio Na/K élevé - attention au sodium | Densité nutritionnelle faible",
    "Score Lipidique": "",
    "Score_Qualité_Lipidique": "",
    "Indice_Satiété_Lipidique": "4.3",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "-0.57",
    "Matière_Organique (%)_Écart_Moyenne (%)": "0.84",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "-8.21",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "43.1",
    "Matière_Sèche (%)_Percentile": "33.33",
    "Matière_Organique (%)_Percentile": "44.44",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "55.56",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "88.89",
    "Matière_Sèche (%)": "94.17",
    "Matière_Organique (%)": "76.81",
    "Somme_Minéraux_Majeurs (mg/100g)": "809.78",
    "Somme_Oligo_Éléments (mg/100g)": "6.26",
    "Recommandations": "Profil nutritionnel à améliorer"
  },
  {
    "Feuille de": "chou rave",
    "Humidité (%)": "4.42",
    "Cendres (%)": "17.92",
    "Humidité (%)_Écart_Moyenne (%)": "-16.46",
    "Cendres (%)_Écart_Moyenne (%)": "-3.34",
    "Humidité (%)_Percentile": "22.22",
    "Cendres (%)_Percentile": "66.67",
    "Matière Sèche (%)": "95.58",
    "Protéines (%)": "30.8",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "37.28",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "-0.03",
    "Protéines (%)_Percentile": "100",
    "Facteur_Conversion_Protéines_Percentile": "44.44",
    "Ratio Lipides/Protéines": "",
    "Contribution Protéines (%)": "",
    "Ratio_Lipides_Protéines": "0.0914",
    "Contribution_Protéines_%": "37.9",
    "Lipides_Moyenne": "",
    "Lipides_EcartType": "",
    "Énergie Lipides (kcal/100g)": "",
    "Contribution Lipides (%)": "",
    "Classification Lipides": "Non déterminé",
    "Lipides_Totaux_%": "2.815",
    "Lipides_EcartType_%": "0.004",
    "Énergie_Lipides_kcal_100g": "25.3",
    "Classification_Lipides": "Modérée",
    "Contribution_Énergétique_Lipides_%": "",
    "Contribution_Lipides_%": "7.8",
    "Glucides Estimés (%)": "",
    "Contribution Glucides (%)": "",
    "Glucides_Estimés_%": "44.045",
    "Contribution_Glucides_%": "54.3",
    "Azote Total (%)": "4.93",
    "Azote Total (%)_Écart_Moyenne (%)": "37.33",
    "Azote Total (%)_Percentile": "100",
    "Calcium (mg/100g)": "247.53",
    "Phosphore (mg/100g)": "107.02",
    "Potassium (mg/100g)": "279.79",
    "Magnésium (mg/100g)": "73.7",
    "Sodium (mg/100g)": "163.48",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "42.79",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "33.75",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "1.35",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "-4.9",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "-40.61",
    "Calcium (mg/100g)_Percentile": "100",
    "Phosphore (mg/100g)_Percentile": "100",
    "Potassium (mg/100g)_Percentile": "66.67",
    "Magnésium (mg/100g)_Percentile": "55.56",
    "Sodium (mg/100g)_Percentile": "44.44",
    "Fer (mg/100g)": "1.59",
    "Zinc (mg/100g)": "0.33",
    "Cuivre (mg/100g)": "0.06",
    "Manganèse (mg/100g)": "0.9",
    "Bore (mg/100g)": "0.46",
    "Fer (mg/100g)_Écart_Moyenne (%)": "-43.44",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "-1.66",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "-41.3",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "31.92",
    "Bore (mg/100g)_Écart_Moyenne (%)": "3.76",
    "Fer (mg/100g)_Percentile": "11.11",
    "Zinc (mg/100g)_Percentile": "50",
    "Cuivre (mg/100g)_Percentile": "11.11",
    "Manganèse (mg/100g)_Percentile": "77.78",
    "Bore (mg/100g)_Percentile": "55.56",
    "Valeur Énergétique (kcal/100g)": "",
    "Valeur_Énergétique_Recalculée_kcal_100g": "324.7",
    "Densité_Protéique (%)": "32.22",
    "Ratio_Ca_P": "2.31",
    "Ratio_Na_K": "0.58",
    "Densité_Minérale_Totale (mg/100g)": "874.86",
    "Score_Densité_Nutritionnelle": "51.2",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "36.03",
    "Ratio_Ca_P_Écart_Moyenne (%)": "1.77",
    "Ratio_Na_K_Écart_Moyenne (%)": "-48.65",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "-1.32",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "38.18",
    "Densité_Protéique (%)_Percentile": "100",
    "Ratio_Ca_P_Percentile": "44.44",
    "Ratio_Na_K_Percentile": "44.44",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "66.67",
    "Score_Densité_Nutritionnelle_Percentile": "88.89",
    "Évaluation_Ratio_Ca_P": "Acceptable",
    "Évaluation_Ratio_Na_K": "Bon",
    "Densité Lipidique (%)": "",
    "Densité_Lipidique_%": "2.945",
    "Score_Minéral_Global": "63.85",
    "Indice_Qualité_Protéique": "9.93",
    "Score_Minéral_Global_Écart_Moyenne (%)": "38.91",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "74.19",
    "Score_Minéral_Global_Percentile": "88.89",
    "Indice_Qualité_Protéique_Percentile": "100",
    "Notation_Globale_Étoiles": "4",
    "Alertes_Qualité": "Aucune alerte",
    "Score Lipidique": "",
    "Score_Qualité_Lipidique": "",
    "Indice_Satiété_Lipidique": "11.45",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "0.92",
    "Matière_Organique (%)_Écart_Moyenne (%)": "1.96",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "-1.21",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "-23.65",
    "Matière_Sèche (%)_Percentile": "88.89",
    "Matière_Organique (%)_Percentile": "55.56",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "66.67",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "33.33",
    "Matière_Sèche (%)": "95.58",
    "Matière_Organique (%)": "77.66",
    "Somme_Minéraux_Majeurs (mg/100g)": "871.52",
    "Somme_Oligo_Éléments (mg/100g)": "3.34",
    "Recommandations": "Excellent profil nutritionnel | Riche en protéines"
  },
  {
    "Feuille de": "Betterave Rouge",
    "Humidité (%)": "4.85",
    "Cendres (%)": "24.07",
    "Humidité (%)_Écart_Moyenne (%)": "-8.34",
    "Cendres (%)_Écart_Moyenne (%)": "29.83",
    "Humidité (%)_Percentile": "55.56",
    "Cendres (%)_Percentile": "88.89",
    "Matière Sèche (%)": "95.15",
    "Protéines (%)": "27.68",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "23.38",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "-0.01",
    "Protéines (%)_Percentile": "77.78",
    "Facteur_Conversion_Protéines_Percentile": "55.56",
    "Ratio Lipides/Protéines": "0.051300578",
    "Contribution Protéines (%)": "37.99327431",
    "Ratio_Lipides_Protéines": "0.0513",
    "Contribution_Protéines_%": "38",
    "Lipides_Moyenne": "1.42",
    "Lipides_EcartType": "0.014",
    "Énergie Lipides (kcal/100g)": "12.78",
    "Contribution Lipides (%)": "4.385423101",
    "Classification Lipides": "Faible",
    "Lipides_Totaux_%": "1.42",
    "Lipides_EcartType_%": "0.008",
    "Énergie_Lipides_kcal_100g": "12.8",
    "Classification_Lipides": "Faible",
    "Contribution_Énergétique_Lipides_%": "4.4",
    "Contribution_Lipides_%": "4.4",
    "Glucides Estimés (%)": "41.98",
    "Contribution Glucides (%)": "57.62130259",
    "Glucides_Estimés_%": "41.98",
    "Contribution_Glucides_%": "57.6",
    "Azote Total (%)": "4.43",
    "Azote Total (%)_Écart_Moyenne (%)": "23.4",
    "Azote Total (%)_Percentile": "77.78",
    "Calcium (mg/100g)": "199.58",
    "Phosphore (mg/100g)": "82.83",
    "Potassium (mg/100g)": "246.56",
    "Magnésium (mg/100g)": "111.24",
    "Sodium (mg/100g)": "475.02",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "15.13",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "3.52",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "-10.68",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "43.54",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "72.56",
    "Calcium (mg/100g)_Percentile": "77.78",
    "Phosphore (mg/100g)_Percentile": "66.67",
    "Potassium (mg/100g)_Percentile": "44.44",
    "Magnésium (mg/100g)_Percentile": "88.89",
    "Sodium (mg/100g)_Percentile": "88.89",
    "Fer (mg/100g)": "2.15",
    "Zinc (mg/100g)": "0.4",
    "Cuivre (mg/100g)": "0.11",
    "Manganèse (mg/100g)": "1.09",
    "Bore (mg/100g)": "0.5",
    "Fer (mg/100g)_Écart_Moyenne (%)": "-23.52",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "19.21",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "7.61",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "59.77",
    "Bore (mg/100g)_Écart_Moyenne (%)": "12.78",
    "Fer (mg/100g)_Percentile": "44.44",
    "Zinc (mg/100g)_Percentile": "72.22",
    "Cuivre (mg/100g)_Percentile": "66.67",
    "Manganèse (mg/100g)_Percentile": "88.89",
    "Bore (mg/100g)_Percentile": "66.67",
    "Valeur Énergétique (kcal/100g)": "291.42",
    "Valeur_Énergétique_Recalculée_kcal_100g": "291.4",
    "Densité_Protéique (%)": "29.09",
    "Ratio_Ca_P": "2.41",
    "Ratio_Na_K": "1.93",
    "Densité_Minérale_Totale (mg/100g)": "1119.48",
    "Score_Densité_Nutritionnelle": "47.01",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "22.8",
    "Ratio_Ca_P_Écart_Moyenne (%)": "6.02",
    "Ratio_Na_K_Écart_Moyenne (%)": "69.32",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "26.27",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "26.86",
    "Densité_Protéique (%)_Percentile": "77.78",
    "Ratio_Ca_P_Percentile": "66.67",
    "Ratio_Na_K_Percentile": "88.89",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "88.89",
    "Score_Densité_Nutritionnelle_Percentile": "66.67",
    "Évaluation_Ratio_Ca_P": "Acceptable",
    "Évaluation_Ratio_Na_K": "Élevé",
    "Densité Lipidique (%)": "1.492380452",
    "Densité_Lipidique_%": "1.492",
    "Score_Minéral_Global": "58.95",
    "Indice_Qualité_Protéique": "8.05",
    "Score_Minéral_Global_Écart_Moyenne (%)": "28.25",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "41.33",
    "Score_Minéral_Global_Percentile": "66.67",
    "Indice_Qualité_Protéique_Percentile": "77.78",
    "Notation_Globale_Étoiles": "2",
    "Alertes_Qualité": "Ratio Na/K élevé - attention au sodium",
    "Score Lipidique": "79.4",
    "Score_Qualité_Lipidique": "79.4",
    "Indice_Satiété_Lipidique": "5.79",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "0.47",
    "Matière_Organique (%)_Écart_Moyenne (%)": "-6.68",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "26.42",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "-2.84",
    "Matière_Sèche (%)_Percentile": "55.56",
    "Matière_Organique (%)_Percentile": "33.33",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "88.89",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "55.56",
    "Matière_Sèche (%)": "95.15",
    "Matière_Organique (%)": "71.08",
    "Somme_Minéraux_Majeurs (mg/100g)": "1115.23",
    "Somme_Oligo_Éléments (mg/100g)": "4.25",
    "Recommandations": "Profil nutritionnel à améliorer | Riche en protéines"
  },
  {
    "Feuille de": "Radis",
    "Humidité (%)": "7.85",
    "Cendres (%)": "22.19",
    "Humidité (%)_Écart_Moyenne (%)": "48.36",
    "Cendres (%)_Écart_Moyenne (%)": "19.69",
    "Humidité (%)_Percentile": "100",
    "Cendres (%)_Percentile": "77.78",
    "Matière Sèche (%)": "92.15",
    "Protéines (%)": "28.81",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "28.41",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "0.01",
    "Protéines (%)_Percentile": "88.89",
    "Facteur_Conversion_Protéines_Percentile": "66.67",
    "Ratio Lipides/Protéines": "0.07757723",
    "Contribution Protéines (%)": "39.59933337",
    "Ratio_Lipides_Protéines": "0.0776",
    "Contribution_Protéines_%": "39.6",
    "Lipides_Moyenne": "2.235",
    "Lipides_EcartType": "0.021",
    "Énergie Lipides (kcal/100g)": "20.115",
    "Contribution Lipides (%)": "6.912014845",
    "Classification Lipides": "Modérée",
    "Lipides_Totaux_%": "2.235",
    "Lipides_EcartType_%": "0.012",
    "Énergie_Lipides_kcal_100g": "20.1",
    "Classification_Lipides": "Modérée",
    "Contribution_Énergétique_Lipides_%": "6.9",
    "Contribution_Lipides_%": "6.9",
    "Glucides Estimés (%)": "38.915",
    "Contribution Glucides (%)": "53.48865179",
    "Glucides_Estimés_%": "38.915",
    "Contribution_Glucides_%": "53.5",
    "Azote Total (%)": "4.61",
    "Azote Total (%)_Écart_Moyenne (%)": "28.41",
    "Azote Total (%)_Percentile": "88.89",
    "Calcium (mg/100g)": "211.94",
    "Phosphore (mg/100g)": "105.25",
    "Potassium (mg/100g)": "329.59",
    "Magnésium (mg/100g)": "85.24",
    "Sodium (mg/100g)": "321.54",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "22.26",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "31.54",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "19.39",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "9.99",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "16.81",
    "Calcium (mg/100g)_Percentile": "88.89",
    "Phosphore (mg/100g)_Percentile": "88.89",
    "Potassium (mg/100g)_Percentile": "77.78",
    "Magnésium (mg/100g)_Percentile": "77.78",
    "Sodium (mg/100g)_Percentile": "55.56",
    "Fer (mg/100g)": "4.56",
    "Zinc (mg/100g)": "0.46",
    "Cuivre (mg/100g)": "0.08",
    "Manganèse (mg/100g)": "0.81",
    "Bore (mg/100g)": "0.51",
    "Fer (mg/100g)_Écart_Moyenne (%)": "62.21",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "37.09",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "-21.74",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "18.73",
    "Bore (mg/100g)_Écart_Moyenne (%)": "15.04",
    "Fer (mg/100g)_Percentile": "88.89",
    "Zinc (mg/100g)_Percentile": "88.89",
    "Cuivre (mg/100g)_Percentile": "27.78",
    "Manganèse (mg/100g)_Percentile": "55.56",
    "Bore (mg/100g)_Percentile": "83.33",
    "Valeur Énergétique (kcal/100g)": "291.015",
    "Valeur_Énergétique_Recalculée_kcal_100g": "291",
    "Densité_Protéique (%)": "31.26",
    "Ratio_Ca_P": "2.01",
    "Ratio_Na_K": "0.98",
    "Densité_Minérale_Totale (mg/100g)": "1059.98",
    "Score_Densité_Nutritionnelle": "57.96",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "31.97",
    "Ratio_Ca_P_Écart_Moyenne (%)": "-11.39",
    "Ratio_Na_K_Écart_Moyenne (%)": "-14.26",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "19.56",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "56.41",
    "Densité_Protéique (%)_Percentile": "88.89",
    "Ratio_Ca_P_Percentile": "33.33",
    "Ratio_Na_K_Percentile": "55.56",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "77.78",
    "Score_Densité_Nutritionnelle_Percentile": "100",
    "Évaluation_Ratio_Ca_P": "Acceptable",
    "Évaluation_Ratio_Na_K": "Bon",
    "Densité Lipidique (%)": "2.42539338",
    "Densité_Lipidique_%": "2.425",
    "Score_Minéral_Global": "75.75",
    "Indice_Qualité_Protéique": "9.01",
    "Score_Minéral_Global_Écart_Moyenne (%)": "64.8",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "58.09",
    "Score_Minéral_Global_Percentile": "100",
    "Indice_Qualité_Protéique_Percentile": "88.89",
    "Notation_Globale_Étoiles": "4",
    "Alertes_Qualité": "Aucune alerte",
    "Score Lipidique": "81.9",
    "Score_Qualité_Lipidique": "81.9",
    "Indice_Satiété_Lipidique": "9.22",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "-2.7",
    "Matière_Organique (%)_Écart_Moyenne (%)": "-8.15",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "19.43",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "46.76",
    "Matière_Sèche (%)_Percentile": "11.11",
    "Matière_Organique (%)_Percentile": "11.11",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "77.78",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "100",
    "Matière_Sèche (%)": "92.15",
    "Matière_Organique (%)": "69.96",
    "Somme_Minéraux_Majeurs (mg/100g)": "1053.56",
    "Somme_Oligo_Éléments (mg/100g)": "6.42",
    "Recommandations": "Excellent profil nutritionnel | Riche en protéines | Excellente richesse minérale"
  },
  {
    "Feuille de": "Oignon",
    "Humidité (%)": "6.31",
    "Cendres (%)": "13.91",
    "Humidité (%)_Écart_Moyenne (%)": "19.26",
    "Cendres (%)_Écart_Moyenne (%)": "-24.97",
    "Humidité (%)_Percentile": "88.89",
    "Cendres (%)_Percentile": "11.11",
    "Matière Sèche (%)": "93.69",
    "Protéines (%)": "14.79",
    "Facteur_Conversion_Protéines": "6.24",
    "Protéines (%)_Écart_Moyenne (%)": "-34.08",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "-0.14",
    "Protéines (%)_Percentile": "22.22",
    "Facteur_Conversion_Protéines_Percentile": "11.11",
    "Ratio Lipides/Protéines": "0.045638945",
    "Contribution Protéines (%)": "18.34447046",
    "Ratio_Lipides_Protéines": "0.0456",
    "Contribution_Protéines_%": "18.3",
    "Lipides_Moyenne": "0.675",
    "Lipides_EcartType": "0.021",
    "Énergie Lipides (kcal/100g)": "6.075",
    "Contribution Lipides (%)": "1.883750136",
    "Classification Lipides": "Très faible",
    "Lipides_Totaux_%": "0.675",
    "Lipides_EcartType_%": "0.012",
    "Énergie_Lipides_kcal_100g": "6.1",
    "Classification_Lipides": "Très faible",
    "Contribution_Énergétique_Lipides_%": "1.9",
    "Contribution_Lipides_%": "1.9",
    "Glucides Estimés (%)": "64.315",
    "Contribution Glucides (%)": "79.77177941",
    "Glucides_Estimés_%": "64.315",
    "Contribution_Glucides_%": "79.8",
    "Azote Total (%)": "2.37",
    "Azote Total (%)_Écart_Moyenne (%)": "-33.98",
    "Azote Total (%)_Percentile": "22.22",
    "Calcium (mg/100g)": "138.43",
    "Phosphore (mg/100g)": "57.07",
    "Potassium (mg/100g)": "278.88",
    "Magnésium (mg/100g)": "53.31",
    "Sodium (mg/100g)": "100.39",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "-20.15",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "-28.67",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "1.02",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "-31.21",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "-63.53",
    "Calcium (mg/100g)_Percentile": "44.44",
    "Phosphore (mg/100g)_Percentile": "33.33",
    "Potassium (mg/100g)_Percentile": "55.56",
    "Magnésium (mg/100g)_Percentile": "11.11",
    "Sodium (mg/100g)_Percentile": "11.11",
    "Fer (mg/100g)": "3.41",
    "Zinc (mg/100g)": "0.09",
    "Cuivre (mg/100g)": "0.14",
    "Manganèse (mg/100g)": "0.82",
    "Bore (mg/100g)": "0.44",
    "Fer (mg/100g)_Écart_Moyenne (%)": "21.3",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "-73.18",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "36.96",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "20.2",
    "Bore (mg/100g)_Écart_Moyenne (%)": "-0.75",
    "Fer (mg/100g)_Percentile": "77.78",
    "Zinc (mg/100g)_Percentile": "11.11",
    "Cuivre (mg/100g)_Percentile": "94.44",
    "Manganèse (mg/100g)_Percentile": "66.67",
    "Bore (mg/100g)_Percentile": "44.44",
    "Valeur Énergétique (kcal/100g)": "322.495",
    "Valeur_Énergétique_Recalculée_kcal_100g": "322.5",
    "Densité_Protéique (%)": "15.79",
    "Ratio_Ca_P": "2.43",
    "Ratio_Na_K": "0.36",
    "Densité_Minérale_Totale (mg/100g)": "632.98",
    "Score_Densité_Nutritionnelle": "20.19",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "-33.36",
    "Ratio_Ca_P_Écart_Moyenne (%)": "6.73",
    "Ratio_Na_K_Écart_Moyenne (%)": "-68.36",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "-28.6",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "-45.51",
    "Densité_Protéique (%)_Percentile": "22.22",
    "Ratio_Ca_P_Percentile": "88.89",
    "Ratio_Na_K_Percentile": "22.22",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "11.11",
    "Score_Densité_Nutritionnelle_Percentile": "22.22",
    "Évaluation_Ratio_Ca_P": "Acceptable",
    "Évaluation_Ratio_Na_K": "Excellent",
    "Densité Lipidique (%)": "0.720461095",
    "Densité_Lipidique_%": "0.72",
    "Score_Minéral_Global": "23.13",
    "Indice_Qualité_Protéique": "2.33",
    "Score_Minéral_Global_Écart_Moyenne (%)": "-49.68",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "-59.02",
    "Score_Minéral_Global_Percentile": "22.22",
    "Indice_Qualité_Protéique_Percentile": "22.22",
    "Notation_Globale_Étoiles": "2",
    "Alertes_Qualité": "Densité nutritionnelle faible",
    "Score Lipidique": "76.9",
    "Score_Qualité_Lipidique": "76.9",
    "Indice_Satiété_Lipidique": "2.77",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "-1.08",
    "Matière_Organique (%)_Écart_Moyenne (%)": "4.74",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "-28.8",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "12.01",
    "Matière_Sèche (%)_Percentile": "22.22",
    "Matière_Organique (%)_Percentile": "88.89",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "11.11",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "77.78",
    "Matière_Sèche (%)": "93.69",
    "Matière_Organique (%)": "79.78",
    "Somme_Minéraux_Majeurs (mg/100g)": "628.08",
    "Somme_Oligo_Éléments (mg/100g)": "4.9",
    "Recommandations": "Profil nutritionnel à améliorer"
  },
  {
    "Feuille de": "Poireau",
    "Humidité (%)": "3.85",
    "Cendres (%)": "15.24",
    "Humidité (%)_Écart_Moyenne (%)": "-27.24",
    "Cendres (%)_Écart_Moyenne (%)": "-17.8",
    "Humidité (%)_Percentile": "11.11",
    "Cendres (%)_Percentile": "22.22",
    "Matière Sèche (%)": "96.15",
    "Protéines (%)": "19.07",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "-15",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "0.05",
    "Protéines (%)_Percentile": "33.33",
    "Facteur_Conversion_Protéines_Percentile": "77.78",
    "Ratio Lipides/Protéines": "",
    "Contribution Protéines (%)": "",
    "Ratio_Lipides_Protéines": "0.0281",
    "Contribution_Protéines_%": "23.4",
    "Lipides_Moyenne": "",
    "Lipides_EcartType": "",
    "Énergie Lipides (kcal/100g)": "",
    "Contribution Lipides (%)": "",
    "Classification Lipides": "Non déterminé",
    "Lipides_Totaux_%": "0.535",
    "Lipides_EcartType_%": "0.012",
    "Énergie_Lipides_kcal_100g": "4.8",
    "Classification_Lipides": "Très faible",
    "Contribution_Énergétique_Lipides_%": "",
    "Contribution_Lipides_%": "1.5",
    "Glucides Estimés (%)": "",
    "Contribution Glucides (%)": "",
    "Glucides_Estimés_%": "61.305",
    "Contribution_Glucides_%": "75.2",
    "Azote Total (%)": "3.05",
    "Azote Total (%)_Écart_Moyenne (%)": "-15.04",
    "Azote Total (%)_Percentile": "33.33",
    "Calcium (mg/100g)": "121.03",
    "Phosphore (mg/100g)": "75.38",
    "Potassium (mg/100g)": "380.24",
    "Magnésium (mg/100g)": "61.71",
    "Sodium (mg/100g)": "124.98",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "-30.18",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "-5.79",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "37.74",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "-20.37",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "-54.6",
    "Calcium (mg/100g)_Percentile": "11.11",
    "Phosphore (mg/100g)_Percentile": "44.44",
    "Potassium (mg/100g)_Percentile": "100",
    "Magnésium (mg/100g)_Percentile": "44.44",
    "Sodium (mg/100g)_Percentile": "22.22",
    "Fer (mg/100g)": "2.13",
    "Zinc (mg/100g)": "0.27",
    "Cuivre (mg/100g)": "0.08",
    "Manganèse (mg/100g)": "0.25",
    "Bore (mg/100g)": "0.35",
    "Fer (mg/100g)_Écart_Moyenne (%)": "-24.23",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "-19.54",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "-21.74",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "-63.36",
    "Bore (mg/100g)_Écart_Moyenne (%)": "-21.05",
    "Fer (mg/100g)_Percentile": "33.33",
    "Zinc (mg/100g)_Percentile": "33.33",
    "Cuivre (mg/100g)_Percentile": "27.78",
    "Manganèse (mg/100g)_Percentile": "11.11",
    "Bore (mg/100g)_Percentile": "22.22",
    "Valeur Énergétique (kcal/100g)": "",
    "Valeur_Énergétique_Recalculée_kcal_100g": "326.3",
    "Densité_Protéique (%)": "19.83",
    "Ratio_Ca_P": "1.61",
    "Ratio_Na_K": "0.33",
    "Densité_Minérale_Totale (mg/100g)": "766.42",
    "Score_Densité_Nutritionnelle": "27.28",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "-16.28",
    "Ratio_Ca_P_Écart_Moyenne (%)": "-29.35",
    "Ratio_Na_K_Écart_Moyenne (%)": "-71.11",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "-13.55",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "-26.38",
    "Densité_Protéique (%)_Percentile": "33.33",
    "Ratio_Ca_P_Percentile": "22.22",
    "Ratio_Na_K_Percentile": "11.11",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "33.33",
    "Score_Densité_Nutritionnelle_Percentile": "44.44",
    "Évaluation_Ratio_Ca_P": "Optimal",
    "Évaluation_Ratio_Na_K": "Excellent",
    "Densité Lipidique (%)": "",
    "Densité_Lipidique_%": "0.556",
    "Score_Minéral_Global": "32.25",
    "Indice_Qualité_Protéique": "3.78",
    "Score_Minéral_Global_Écart_Moyenne (%)": "-29.85",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "-33.62",
    "Score_Minéral_Global_Percentile": "33.33",
    "Indice_Qualité_Protéique_Percentile": "33.33",
    "Notation_Globale_Étoiles": "3",
    "Alertes_Qualité": "Densité nutritionnelle faible",
    "Score Lipidique": "",
    "Score_Qualité_Lipidique": "",
    "Indice_Satiété_Lipidique": "2.17",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "1.52",
    "Matière_Organique (%)_Écart_Moyenne (%)": "6.22",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "-13.47",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "-29.59",
    "Matière_Sèche (%)_Percentile": "100",
    "Matière_Organique (%)_Percentile": "100",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "33.33",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "22.22",
    "Matière_Sèche (%)": "96.15",
    "Matière_Organique (%)": "80.91",
    "Somme_Minéraux_Majeurs (mg/100g)": "763.34",
    "Somme_Oligo_Éléments (mg/100g)": "3.08",
    "Recommandations": "Bon profil nutritionnel | Équilibre Ca/P optimal"
  },
  {
    "Feuille de": "Navet",
    "Humidité (%)": "4.81",
    "Cendres (%)": "24.48",
    "Humidité (%)_Écart_Moyenne (%)": "-9.09",
    "Cendres (%)_Écart_Moyenne (%)": "32.04",
    "Humidité (%)_Percentile": "44.44",
    "Cendres (%)_Percentile": "100",
    "Matière Sèche (%)": "95.19",
    "Protéines (%)": "25.64",
    "Facteur_Conversion_Protéines": "6.25",
    "Protéines (%)_Écart_Moyenne (%)": "14.28",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "0.07",
    "Protéines (%)_Percentile": "66.67",
    "Facteur_Conversion_Protéines_Percentile": "88.89",
    "Ratio Lipides/Protéines": "0.144695788",
    "Contribution Protéines (%)": "34.02899897",
    "Ratio_Lipides_Protéines": "0.1447",
    "Contribution_Protéines_%": "34",
    "Lipides_Moyenne": "3.71",
    "Lipides_EcartType": "0.042",
    "Énergie Lipides (kcal/100g)": "33.39",
    "Contribution Lipides (%)": "11.07866883",
    "Classification Lipides": "Élevée",
    "Lipides_Totaux_%": "3.71",
    "Lipides_EcartType_%": "0.024",
    "Énergie_Lipides_kcal_100g": "33.4",
    "Classification_Lipides": "Élevée",
    "Contribution_Énergétique_Lipides_%": "11.1",
    "Contribution_Lipides_%": "11.1",
    "Glucides Estimés (%)": "41.36",
    "Contribution Glucides (%)": "54.89233219",
    "Glucides_Estimés_%": "41.36",
    "Contribution_Glucides_%": "54.9",
    "Azote Total (%)": "4.1",
    "Azote Total (%)_Écart_Moyenne (%)": "14.21",
    "Azote Total (%)_Percentile": "66.67",
    "Calcium (mg/100g)": "198.7",
    "Phosphore (mg/100g)": "82.75",
    "Potassium (mg/100g)": "242.05",
    "Magnésium (mg/100g)": "119",
    "Sodium (mg/100g)": "495.37",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "14.62",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "3.42",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "-12.32",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "53.56",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "79.96",
    "Calcium (mg/100g)_Percentile": "66.67",
    "Phosphore (mg/100g)_Percentile": "55.56",
    "Potassium (mg/100g)_Percentile": "33.33",
    "Magnésium (mg/100g)_Percentile": "100",
    "Sodium (mg/100g)_Percentile": "100",
    "Fer (mg/100g)": "2.51",
    "Zinc (mg/100g)": "0.4",
    "Cuivre (mg/100g)": "0.12",
    "Manganèse (mg/100g)": "1.21",
    "Bore (mg/100g)": "0.51",
    "Fer (mg/100g)_Écart_Moyenne (%)": "-10.71",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "19.21",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "17.39",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "77.36",
    "Bore (mg/100g)_Écart_Moyenne (%)": "15.04",
    "Fer (mg/100g)_Percentile": "66.67",
    "Zinc (mg/100g)_Percentile": "72.22",
    "Cuivre (mg/100g)_Percentile": "77.78",
    "Manganèse (mg/100g)_Percentile": "100",
    "Bore (mg/100g)_Percentile": "83.33",
    "Valeur Énergétique (kcal/100g)": "301.39",
    "Valeur_Énergétique_Recalculée_kcal_100g": "301.4",
    "Densité_Protéique (%)": "26.94",
    "Ratio_Ca_P": "2.4",
    "Ratio_Na_K": "2.05",
    "Densité_Minérale_Totale (mg/100g)": "1142.62",
    "Score_Densité_Nutritionnelle": "47.92",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "13.7",
    "Ratio_Ca_P_Écart_Moyenne (%)": "5.66",
    "Ratio_Na_K_Écart_Moyenne (%)": "79.87",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "28.88",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "29.33",
    "Densité_Protéique (%)_Percentile": "66.67",
    "Ratio_Ca_P_Percentile": "55.56",
    "Ratio_Na_K_Percentile": "100",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "100",
    "Score_Densité_Nutritionnelle_Percentile": "77.78",
    "Évaluation_Ratio_Ca_P": "Acceptable",
    "Évaluation_Ratio_Na_K": "Élevé",
    "Densité Lipidique (%)": "3.897468221",
    "Densité_Lipidique_%": "3.897",
    "Score_Minéral_Global": "61.92",
    "Indice_Qualité_Protéique": "6.91",
    "Score_Minéral_Global_Écart_Moyenne (%)": "34.7",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "21.21",
    "Score_Minéral_Global_Percentile": "77.78",
    "Indice_Qualité_Protéique_Percentile": "66.67",
    "Notation_Globale_Étoiles": "2",
    "Alertes_Qualité": "Ratio Na/K élevé - attention au sodium",
    "Score Lipidique": "86.1",
    "Score_Qualité_Lipidique": "86.1",
    "Indice_Satiété_Lipidique": "15.12",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "0.51",
    "Matière_Organique (%)_Écart_Moyenne (%)": "-7.17",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "28.98",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "8.59",
    "Matière_Sèche (%)_Percentile": "66.67",
    "Matière_Organique (%)_Percentile": "22.22",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "100",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "66.67",
    "Matière_Sèche (%)": "95.19",
    "Matière_Organique (%)": "70.71",
    "Somme_Minéraux_Majeurs (mg/100g)": "1137.87",
    "Somme_Oligo_Éléments (mg/100g)": "4.75",
    "Recommandations": "Profil nutritionnel à améliorer | Riche en protéines"
  },
  {
    "Feuille de": "Artichaut",
    "Humidité (%)": "4.59",
    "Cendres (%)": "16.12",
    "Humidité (%)_Écart_Moyenne (%)": "-13.25",
    "Cendres (%)_Écart_Moyenne (%)": "-13.05",
    "Humidité (%)_Percentile": "33.33",
    "Cendres (%)_Percentile": "44.44",
    "Matière Sèche (%)": "95.41",
    "Protéines (%)": "21.21",
    "Facteur_Conversion_Protéines": "6.26",
    "Protéines (%)_Écart_Moyenne (%)": "-5.46",
    "Facteur_Conversion_Protéines_Écart_Moyenne (%)": "0.12",
    "Protéines (%)_Percentile": "44.44",
    "Facteur_Conversion_Protéines_Percentile": "100",
    "Ratio Lipides/Protéines": "0.056105611",
    "Contribution Protéines (%)": "26.25731175",
    "Ratio_Lipides_Protéines": "0.0561",
    "Contribution_Protéines_%": "26.3",
    "Lipides_Moyenne": "1.19",
    "Lipides_EcartType": "0.028",
    "Énergie Lipides (kcal/100g)": "10.71",
    "Contribution Lipides (%)": "3.314660642",
    "Classification Lipides": "Faible",
    "Lipides_Totaux_%": "1.19",
    "Lipides_EcartType_%": "0.016",
    "Énergie_Lipides_kcal_100g": "10.7",
    "Classification_Lipides": "Faible",
    "Contribution_Énergétique_Lipides_%": "3.3",
    "Contribution_Lipides_%": "3.3",
    "Glucides Estimés (%)": "56.89",
    "Contribution Glucides (%)": "70.42802761",
    "Glucides_Estimés_%": "56.89",
    "Contribution_Glucides_%": "70.4",
    "Azote Total (%)": "3.39",
    "Azote Total (%)_Écart_Moyenne (%)": "-5.57",
    "Azote Total (%)_Percentile": "44.44",
    "Calcium (mg/100g)": "133.89",
    "Phosphore (mg/100g)": "55.38",
    "Potassium (mg/100g)": "182.91",
    "Magnésium (mg/100g)": "57.85",
    "Sodium (mg/100g)": "325.28",
    "Calcium (mg/100g)_Écart_Moyenne (%)": "-22.77",
    "Phosphore (mg/100g)_Écart_Moyenne (%)": "-30.79",
    "Potassium (mg/100g)_Écart_Moyenne (%)": "-33.74",
    "Magnésium (mg/100g)_Écart_Moyenne (%)": "-25.35",
    "Sodium (mg/100g)_Écart_Moyenne (%)": "18.17",
    "Calcium (mg/100g)_Percentile": "33.33",
    "Phosphore (mg/100g)_Percentile": "22.22",
    "Potassium (mg/100g)_Percentile": "22.22",
    "Magnésium (mg/100g)_Percentile": "22.22",
    "Sodium (mg/100g)_Percentile": "77.78",
    "Fer (mg/100g)": "1.76",
    "Zinc (mg/100g)": "0.26",
    "Cuivre (mg/100g)": "0.1",
    "Manganèse (mg/100g)": "0.34",
    "Bore (mg/100g)": "0.38",
    "Fer (mg/100g)_Écart_Moyenne (%)": "-37.39",
    "Zinc (mg/100g)_Écart_Moyenne (%)": "-22.52",
    "Cuivre (mg/100g)_Écart_Moyenne (%)": "-2.17",
    "Manganèse (mg/100g)_Écart_Moyenne (%)": "-50.16",
    "Bore (mg/100g)_Écart_Moyenne (%)": "-14.29",
    "Fer (mg/100g)_Percentile": "22.22",
    "Zinc (mg/100g)_Percentile": "22.22",
    "Cuivre (mg/100g)_Percentile": "55.56",
    "Manganèse (mg/100g)_Percentile": "27.78",
    "Bore (mg/100g)_Percentile": "33.33",
    "Valeur Énergétique (kcal/100g)": "323.11",
    "Valeur_Énergétique_Recalculée_kcal_100g": "323.1",
    "Densité_Protéique (%)": "22.23",
    "Ratio_Ca_P": "2.42",
    "Ratio_Na_K": "1.78",
    "Densité_Minérale_Totale (mg/100g)": "758.15",
    "Score_Densité_Nutritionnelle": "16.73",
    "Densité_Protéique (%)_Écart_Moyenne (%)": "-6.16",
    "Ratio_Ca_P_Écart_Moyenne (%)": "6.38",
    "Ratio_Na_K_Écart_Moyenne (%)": "56.29",
    "Densité_Minérale_Totale (mg/100g)_Écart_Moyenne (%)": "-14.48",
    "Score_Densité_Nutritionnelle_Écart_Moyenne (%)": "-54.86",
    "Densité_Protéique (%)_Percentile": "44.44",
    "Ratio_Ca_P_Percentile": "77.78",
    "Ratio_Na_K_Percentile": "66.67",
    "Densité_Minérale_Totale (mg/100g)_Percentile": "22.22",
    "Score_Densité_Nutritionnelle_Percentile": "11.11",
    "Évaluation_Ratio_Ca_P": "Acceptable",
    "Évaluation_Ratio_Na_K": "Élevé",
    "Densité Lipidique (%)": "1.247248716",
    "Densité_Lipidique_%": "1.247",
    "Score_Minéral_Global": "13.06",
    "Indice_Qualité_Protéique": "4.72",
    "Score_Minéral_Global_Écart_Moyenne (%)": "-71.6",
    "Indice_Qualité_Protéique_Écart_Moyenne (%)": "-17.25",
    "Score_Minéral_Global_Percentile": "11.11",
    "Indice_Qualité_Protéique_Percentile": "44.44",
    "Notation_Globale_Étoiles": "2",
    "Alertes_Qualité": "Ratio Na/K élevé - attention au sodium | Densité nutritionnelle faible",
    "Score Lipidique": "78.3",
    "Score_Qualité_Lipidique": "78.3",
    "Indice_Satiété_Lipidique": "4.85",
    "Matière_Sèche (%)_Écart_Moyenne (%)": "0.74",
    "Matière_Organique (%)_Écart_Moyenne (%)": "4.1",
    "Somme_Minéraux_Majeurs (mg/100g)_Écart_Moyenne (%)": "-14.38",
    "Somme_Oligo_Éléments (mg/100g)_Écart_Moyenne (%)": "-35.08",
    "Matière_Sèche (%)_Percentile": "77.78",
    "Matière_Organique (%)_Percentile": "66.67",
    "Somme_Minéraux_Majeurs (mg/100g)_Percentile": "22.22",
    "Somme_Oligo_Éléments (mg/100g)_Percentile": "11.11",
    "Matière_Sèche (%)": "95.41",
    "Matière_Organique (%)": "79.29",
    "Somme_Minéraux_Majeurs (mg/100g)": "755.31",
    "Somme_Oligo_Éléments (mg/100g)": "2.84",
    "Recommandations": "Profil nutritionnel à améliorer | Riche en protéines"
  }
   and answer with exact expressions from this json text when needed
   allways in english
   never say the word json, instead say the word data when needed

"`
      });

      // Add conversation history (excluding system messages from UI)
      const conversationHistory = messages
        .filter(m => m.type !== 'system')
        .map(m => ({
          role: m.type === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        }));

      chatMessages.push(...conversationHistory);
      chatMessages.push({ role: 'user', content: text });

      console.log('Final chatMessages being sent:', chatMessages);
      console.log('Total message count:', chatMessages.length);

      const response = await APIService.sendChatMessage(chatMessages);
      
      // Check if the response is a recipe title - more flexible matching
      const suggestedRecipe = recipeTitles.find(title => {
        const cleanResponse = response.trim().toLowerCase();
        const cleanTitle = title.toLowerCase();
        // Exact match or response contains the title
        return cleanResponse === cleanTitle || cleanResponse.includes(cleanTitle) || cleanTitle.includes(cleanResponse);
      });
      
      // Debug logging
      console.log('Response:', response);
      console.log('Found recipe:', suggestedRecipe);
      
      addMessage('bot', response, suggestedRecipe);
      StorageService.incrementChats();
      
      // If a recipe was suggested, increment recipe suggestions metric
      if (suggestedRecipe) {
        StorageService.incrementRecipeSuggestions();
      }
      
      // Speak the response with feminine voice
      APIService.speak(response);
    } catch (error) {
      console.error("Chat error:", error);
      
      // Provide a helpful fallback response
      let fallbackResponse = "I'm having trouble connecting to my AI assistant right now. ";
      
      // If the user was asking for a recipe, suggest one anyway
      if (text.toLowerCase().includes('recipe')) {
        const randomRecipe = recipeTitles[Math.floor(Math.random() * recipeTitles.length)];
        fallbackResponse += `Here's a recipe suggestion: ${randomRecipe}`;
        addMessage('bot', fallbackResponse, randomRecipe);
        StorageService.incrementRecipeSuggestions();
      } else {
        fallbackResponse += "Please check your API configuration and try again.";
        addMessage('bot', fallbackResponse);
      }
      
      // Removed toast notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    sendMessage(inputText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (stopListeningRef.current) {
        stopListeningRef.current();
        stopListeningRef.current = null;
      }
      setIsListening(false);
    } else {
      try {
        const stopFn = APIService.startListening((transcript) => {
          setInputText(transcript);
          setIsListening(false);
          stopListeningRef.current = null;
        });
        stopListeningRef.current = stopFn;
        setIsListening(true);
      } catch (error) {
        console.error("Speech recognition error:", error);
        // Removed toast notification
      }
    }
  };

  const handleCameraDetection = async (detections: any[]) => {
    if (detections.length > 0) {
      const detection = detections[0];
      const leafType = detection.class;
      
      addMessage('system', `📸 Detected: ${leafType} (${(detection.confidence * 100).toFixed(1)}% confidence)`);
      
      try {
        const chatMessages: ChatMessage[] = [];
        
        // Add system message for camera detection
        chatMessages.push({
          role: "system" as const,
          content: `You are SafeLeafKitchen assistant. For detected ${leafType} leaves:

CRITICAL RECIPE RULE: If suggesting a recipe, respond with ONLY the exact title from this list:
${recipeTitles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

STRICT RULES:
- If suggesting recipe: respond with ONLY one exact title from above, nothing else
- If providing info: give brief nutritional facts about ${leafType} (max 2 sentences)
- Do NOT provide ingredients, instructions, or recipe details
- Do NOT add extra text or explanations
- Keep responses short and helpful

Examples:
- Recipe suggestion: "Stuffed Msemen with Onion Leaves"
- Info response: "${leafType} leaves are rich in antioxidants and vitamins. They provide excellent nutritional benefits."`
        });

        chatMessages.push({
          role: 'user',
          content: `I've detected ${leafType} leaves. Please provide detailed nutritional information, health benefits, cooking suggestions, and any safety considerations for this plant.`
        });

        const insight = await APIService.generateNutritionInsight(leafType, chatMessages);
        
        // Check if the response is a recipe title
        const suggestedRecipe = recipeTitles.find(title => 
          insight.trim().toLowerCase() === title.toLowerCase()
        );
        
        addMessage('bot', insight, suggestedRecipe);

        // Offer navigation to leaf profile when a known leaf is detected
        const leafMap: Record<string, { id: number; name: string }> = {
          'onion': { id: 1, name: 'Onion' },
          'green onion': { id: 1, name: 'Onion' },
          'scallion': { id: 1, name: 'Onion' },
          'fennel': { id: 2, name: 'Fennel' },
          'carrot': { id: 3, name: 'Carrot' },
          'kohlrabi': { id: 4, name: 'Kohlrabi' },
          'beet': { id: 5, name: 'Beet' },
          'radish': { id: 6, name: 'Radish' },
          'leek': { id: 7, name: 'Leek' },
          'turnip': { id: 8, name: 'Turnip' },
          'artichoke': { id: 9, name: 'Artichoke' },
        };

        const normalized = (leafType || '').toString().trim().toLowerCase();
        const matched = leafMap[normalized as keyof typeof leafMap];
        if (matched) {
          addMessage('bot', `Open ${matched.name} leaf profile`, undefined, matched.id, matched.name);
        }
        StorageService.addDetectedLeaf(leafType);
        StorageService.incrementScans();
        
        // If a recipe was suggested, increment recipe suggestions metric
        if (suggestedRecipe) {
          StorageService.incrementRecipeSuggestions();
        }
        
        // Removed toast notification
      } catch (error) {
        console.error("Nutrition insight error:", error);
        addMessage('bot', `I've detected ${leafType} leaves, but I'm having trouble providing detailed information right now. Please try asking me about this plant directly.`);
      }
    } else {
      addMessage('system', "No leaves detected in the image. Please try again with a clearer view of the leaf.");
      // Removed toast notification
    }
    setShowCamera(false);
  };

  const speakMessage = (content: string) => {
    // Always allow speaking individual messages, even if global TTS is muted
    APIService.speak(content, true); // Force speak even when muted
  };

  const toggleTTSMute = () => {
    const newMutedState = !isTTSMuted;
    setIsTTSMuted(newMutedState);
    APIService.setMuted(newMutedState);
    
    // If muting, stop any current speech
    if (newMutedState) {
      APIService.stopSpeech();
      setPlayingMessages(new Set()); // Clear all playing states
    }
  };

  // Enhanced speak function for individual messages with toggle functionality
  const handleMessageSpeak = (messageId: string, content: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    
    if (playingMessages.has(messageId)) {
      // Stop speaking this message
      APIService.stopSpeech();
      setPlayingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    } else {
      // Start speaking this message
      setPlayingMessages(prev => new Set([messageId])); // Only one message can play at a time
      
      APIService.speak(
        content, 
        true, // Force speak even when muted
        () => {
          // On speech start
          setPlayingMessages(prev => new Set([messageId]));
        },
        () => {
          // On speech end
          setPlayingMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
          });
        }
      );
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-3 sm:p-4 flex items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="p-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-all duration-300"
            title="Conversations"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            SafeLeaf Assistant
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startNewConversation}
            className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-300"
            title="New Conversation"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={toggleTTSMute}
            className={`p-2 rounded-lg transition-all duration-300 ${
              isTTSMuted 
                ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' 
                : 'bg-accent/20 text-accent hover:bg-accent/30'
            }`}
            title={isTTSMuted ? "Unmute TTS" : "Mute TTS"}
          >
            {isTTSMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Conversations Sidebar */}
      {showConversations && (
        <div className="absolute top-16 left-0 right-0 z-30 glass border-b border-border max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Conversations</h3>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                title="Advanced filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Filter by tags:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getAvailableTags().map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-full transition-colors",
                        selectedTag === tag
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {(searchQuery || selectedTag) && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* Conversations List */}
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery || selectedTag ? "No conversations match your filters" : "No saved conversations yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => loadConversation(conversation.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-muted/50",
                      currentConversationId === conversation.id ? "bg-primary/10 border border-primary/20" : "bg-muted/20"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {conversation.title}
                        </p>
                        {conversation.hasRecipeSuggestions && (
                          <ChefHat className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        {conversation.preview}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {conversation.messageCount} messages
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversation.lastUpdated).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          {conversation.tags.slice(0, 2).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="p-1 rounded hover:bg-destructive/20 text-destructive hover:text-destructive transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 pb-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div             className={`max-w-[85%] sm:max-w-[80%] relative group ${
              message.type === 'user' 
                ? 'bg-gradient-primary text-primary-foreground' 
                : message.type === 'system'
                ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                : 'glass text-foreground'
            } p-2 sm:p-3 rounded-2xl ${
              message.type === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
            }`}>
              <p className={`leading-relaxed ${
                message.type === 'system' ? 'text-base font-medium' : 'text-sm sm:text-sm'
              }`}>{message.content}</p>
              
              {/* Recipe Suggestion Button */}
              {message.type === 'bot' && message.suggestedRecipe && (
                <div className="mt-3">
                  <button
                    onClick={() => navigateToRecipe(message.suggestedRecipe!)}
                    className="btn-organic px-4 py-2 text-sm font-medium text-primary-foreground flex items-center gap-2 hover:scale-105 transition-all duration-300"
                  >
                    <ChefHat className="w-4 h-4" />
                    View Recipe
                  </button>
                </div>
              )}

              {/* Leaf Suggestion Button */}
              {message.type === 'bot' && message.suggestedLeafId && (
                <div className="mt-3">
                  <button
                    onClick={() => navigateToLeaf(message.suggestedLeafId!)}
                    className="btn-organic px-4 py-2 text-sm font-medium text-primary-foreground flex items-center gap-2 hover:scale-105 transition-all duration-300"
                  >
                    <LeafIcon className="w-4 h-4" />
                    {message.suggestedLeafName ? `View ${message.suggestedLeafName}` : 'View Leaf'}
                  </button>
                </div>
              )}
              
              {message.type === 'bot' && (
                <button
                  onClick={(e) => handleMessageSpeak(message.id, message.content, e)}
                  className={`absolute -right-2 -top-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${
                    playingMessages.has(message.id)
                      ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse'
                      : isTTSMuted 
                        ? 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground' 
                        : 'bg-primary/20 hover:bg-primary/40 text-primary hover:scale-110 hover:bg-primary/30'
                  }`}
                  title={
                    playingMessages.has(message.id) 
                      ? "Click to stop speaking" 
                      : isTTSMuted 
                        ? "Click to speak (global TTS muted)" 
                        : "Click to speak message"
                  }
                >
                  {playingMessages.has(message.id) 
                    ? <Pause className="w-3.5 h-3.5" />
                    : isTTSMuted 
                      ? <VolumeX className="w-3.5 h-3.5" /> 
                      : <Volume2 className="w-3.5 h-3.5" />
                  }
                </button>
              )}
              
              <span className="text-xs opacity-70 block mt-1">
                {message.timestamp instanceof Date 
                  ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass p-3 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} data-messages-end />
      </div>

      {/* Input area */}
      <div className="glass border-t border-border p-3 sm:p-4 sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-end gap-1 sm:gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about nutrition, recipes, or scan a leaf..."
              className="input-organic w-full p-2 sm:p-3 pr-12 text-foreground placeholder:text-muted-foreground resize-none min-h-[40px] sm:min-h-[44px] max-h-32 text-sm sm:text-base"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={toggleTTSMute}
            className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
              isTTSMuted 
                ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' 
                : 'bg-primary/20 text-primary hover:bg-primary/30'
            }`}
            disabled={isLoading}
            title={isTTSMuted ? "Unmute TTS" : "Mute TTS"}
          >
            {isTTSMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <button
            onClick={toggleListening}
            className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
              isListening 
                ? 'bg-destructive text-destructive-foreground scale-110' 
                : 'bg-secondary text-secondary-foreground hover:scale-105'
            }`}
            disabled={isLoading}
          >
            {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <button
            onClick={() => setShowCamera(true)}
            className="p-2 sm:p-3 bg-accent text-accent-foreground rounded-xl hover:scale-105 transition-all duration-300 flex-shrink-0"
            disabled={isLoading}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <button
            onClick={handleSendClick}
            disabled={!inputText.trim() || isLoading}
            className="btn-organic p-2 sm:p-3 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {showCamera && (
        <CameraScanner
          onClose={() => setShowCamera(false)}
          onDetection={handleCameraDetection}
        />
      )}
    </div>
  );
}
