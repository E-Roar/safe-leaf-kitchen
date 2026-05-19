import { useState, useRef, useEffect } from "react";
import { logger } from '@/lib/logger';
import { Send, Mic, Camera, MicOff, Volume2, VolumeX, ChefHat, Plus, MessageSquare, Trash2, Search, Tag, Filter, Pause, Leaf as LeafIcon, ExternalLink, LogIn, Sparkles, X } from "lucide-react";
import { APIService, ChatMessage, DetectionResult } from "@/services/apiService";
import { Analytics } from "@/services/analyticsEventService";

import CameraScanner from "@/components/features/CameraScanner";
import LiveCameraScanner from "@/components/features/LiveCameraScanner";
import ScanResultsFeed from "@/components/features/ScanResultsFeed";
import { recipes } from "@/data/recipes";
import { leaves } from "@/data/leaves";
import type { ParallelScanResponse } from "@/services/parallelScanService";
import type { RoboflowPrediction } from "@/services/roboflowInference";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { chatHistory, ChatMessageDTO } from "@/services/chatHistoryService";
import { safeStorage } from "@/lib/safeStorage";
import AuthModal from "@/components/auth/AuthModal";

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  suggestedRecipe?: string;
  suggestedLeafId?: number;
  suggestedLeafName?: string;
  suggestedLeaves?: { id: number; name: string }[];
  scanResult?: ParallelScanResponse;
  leafCard?: {
    leafName: string;
    confidence: number;
    snapshot: string;
    leafId: number;
  };
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [useLiveScanner] = useState(true);
  const [_isFirstMessage, setIsFirstMessage] = useState(true);
  const [isTTSMuted, setIsTTSMuted] = useState(APIService.isTTSMuted());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [playingMessages, setPlayingMessages] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [demoMode, setDemoMode] = useState(() => safeStorage.get('demoMode') === 'true');
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

  // Load conversations from Supabase on mount or auth change
  useEffect(() => {
    const handleOpenCamera = () => setShowCamera(true);
    window.addEventListener('openCameraScan', handleOpenCamera as EventListener);

    async function loadConversations() {
      if (!user) return;
      try {
        const convList = await chatHistory.listConversations(user.id);
        setConversations(convList);

        if (convList.length > 0) {
          const convId = convList[0].id;
          const saved = await chatHistory.loadMessages(convId);
          if (saved.length > 0) {
            const converted: Message[] = saved.map((msg, i) => ({
              id: `${convId}_${i}`,
              type: msg.role === 'user' ? 'user' : 'bot',
              content: msg.content,
              timestamp: new Date(),
              suggestedRecipe: msg.suggestedRecipe,
              suggestedLeafId: msg.suggestedLeafId,
              suggestedLeafName: msg.suggestedLeafName,
              suggestedLeaves: msg.suggestedLeaves,
            }));
            setMessages(converted);
            setCurrentConversationId(convId);
            setIsFirstMessage(false);
            return;
          }
        }
        startNewConversation(user.id);
      } catch (e) {
        logger.error('Failed to load conversations', e);
        startNewConversation(user?.id);
      }
    }

    if (user) loadConversations();

    return () => {
      window.removeEventListener('openCameraScan', handleOpenCamera as EventListener);
    };
  }, [user?.id]);

  // Demo mode welcome messages
  useEffect(() => {
    if (demoMode && messages.length === 0) {
      setMessages([
        {
          id: 'demo_welcome',
          type: 'bot',
          content: 'Welcome to SafeLeafKitchen Demo! 👋\n\nScan any leaf with your camera to identify it, browse our recipe collection, or explore the leaf encyclopedia. Sign in to unlock the full chat experience with personalized recommendations.',
          timestamp: new Date(),
        },
        {
          id: 'demo_tip',
          type: 'system',
          content: '💡 Tap the camera button below to scan a leaf, or use the navigation tabs to explore recipes and leaves.',
          timestamp: new Date(),
        },
      ]);
    }
  }, [demoMode]);

  // Filter conversations based on search and tags
  useEffect(() => {
    if (!user) return;
    chatHistory.listConversations(user.id)
      .then(list => {
        let filtered = list;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = list.filter(c => c.title.toLowerCase().includes(q));
        }
        if (selectedTag) {
          filtered = list.filter(c => c.title.toLowerCase().includes(selectedTag.toLowerCase()));
        }
        setConversations(filtered);
      })
      .catch(() => {});
  }, [searchQuery, selectedTag, user?.id]);

  // Save conversation to Supabase when messages change
  useEffect(() => {
    if (!currentConversationId || !user || messages.length === 0) return;

    const chatMessages: ChatMessageDTO[] = messages.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content,
      suggestedRecipe: msg.suggestedRecipe,
      suggestedLeafId: msg.suggestedLeafId,
      suggestedLeafName: msg.suggestedLeafName,
      suggestedLeaves: msg.suggestedLeaves,
    }));

    const timeout = setTimeout(async () => {
      try {
        await chatHistory.saveMessages(currentConversationId, chatMessages);
        const list = await chatHistory.listConversations(user.id);
        setConversations(list);
      } catch (e) {
        logger.error('Failed to save conversation', e);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [messages, currentConversationId, user?.id]);

  const startNewConversation = async (uid?: string) => {
    try {
      const convId = uid ? await chatHistory.startNewConversation(uid) : `temp_${Date.now()}`;
      setCurrentConversationId(convId);
    } catch (e) {
      setCurrentConversationId(`temp_${Date.now()}`);
    }
    const initialMessages: Message[] = [
      {
        id: `${currentConversationId || Date.now()}_0`,
        type: 'system',
        content: `Welcome to SafeLeafKitchen! I'm your AI cooking assistant specializing in Moroccan cuisine and vegetable leaves. I can help you with:

• Recipe suggestions and cooking tips
• Nutritional information about leaves
• Leaf identification and safety
• Traditional Moroccan cooking techniques

What would you like to know today?`,
        timestamp: new Date(),
      }
    ];
    setMessages(initialMessages);
    setIsFirstMessage(true);
    setShowConversations(false);
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const saved = await chatHistory.loadMessages(conversationId);
      const converted: Message[] = saved.map((msg, i) => ({
        id: `${conversationId}_${i}`,
        type: msg.role === 'user' ? 'user' : 'bot',
        content: msg.content,
        timestamp: new Date(),
        suggestedRecipe: msg.suggestedRecipe,
        suggestedLeafId: msg.suggestedLeafId,
        suggestedLeafName: msg.suggestedLeafName,
        suggestedLeaves: msg.suggestedLeaves,
      }));
      setMessages(converted);
      setCurrentConversationId(conversationId);
      setIsFirstMessage(false);
      setShowConversations(false);
    } catch (e) {
      logger.error('Failed to load conversation', e);
    }
  };

  const deleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await chatHistory.deleteConversation(conversationId);
      if (user) {
        const list = await chatHistory.listConversations(user.id);
        setConversations(list);
      }
      if (conversationId === currentConversationId) {
        startNewConversation(user?.id);
      }
    } catch (e) {
      logger.error('Failed to delete conversation', e);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
  };

  const getAvailableTags = () => {
    return ['recipe', 'leaf', 'nutrition'];
  };

  const addMessage = (
    type: 'user' | 'bot' | 'system',
    content: string,
    suggestedRecipe?: string,
    suggestedLeafId?: number,
    suggestedLeafName?: string,
    suggestedLeaves?: { id: number; name: string }[]
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      suggestedRecipe,
      suggestedLeafId,
      suggestedLeafName,
      suggestedLeaves
    };
    setMessages(prev => [...prev, newMessage]);
  };



  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    addMessage('user', text);
    setInputText("");
    setIsLoading(true);
    Analytics.trackChatMessage(text.length);

    try {
      const chatMessages: ChatMessage[] = [];

      const { buildSystemPrompt } = await import('@/data/aiSystemPrompt');
      chatMessages.push({
        role: "system",
        content: buildSystemPrompt(recipeTitles),
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

      logger.debug('Final chatMessages being sent:', chatMessages);
      logger.debug('Total message count:', chatMessages.length);

      const response = await APIService.sendChatMessage(chatMessages);

      // Check if the response is a recipe title - more flexible matching
      const suggestedRecipe = recipeTitles.find(title => {
        const cleanResponse = response.trim().toLowerCase();
        const cleanTitle = title.toLowerCase();
        // Exact match or response contains the title
        return cleanResponse === cleanTitle || cleanResponse.includes(cleanTitle) || cleanTitle.includes(cleanResponse);
      });

      // Debug logging
      logger.debug('Response:', response);
      logger.debug('Found recipe:', suggestedRecipe);

      addMessage('bot', response, suggestedRecipe);
      APIService.incrementChats();

      // If a recipe was suggested, increment recipe suggestions metric
      if (suggestedRecipe) {
        APIService.incrementRecipeSuggestions();
      }

      // Remove TTS functionality for now since it's not in the new API
      // APIService.speak(response);
    } catch (error) {
      logger.error("Chat error:", error);

      const errorMsg = error instanceof Error ? error.message : '';
      const is402 = errorMsg.includes('402') || errorMsg.includes('insufficient') || errorMsg.includes('payment');

      let fallbackResponse = "I'm having trouble connecting to my AI assistant right now. ";

      if (is402) {
        fallbackResponse += "The AI service requires credits. Please try again later.";
      } else if (text.toLowerCase().includes('recipe')) {
        const randomRecipe = recipeTitles[Math.floor(Math.random() * recipeTitles.length)];
        fallbackResponse += `Here's a recipe suggestion: ${randomRecipe}`;
        addMessage('bot', fallbackResponse, randomRecipe);
        APIService.incrementRecipeSuggestions();
        setIsLoading(false);
        return;
      } else {
        fallbackResponse += "Please try again in a moment.";
      }
      addMessage('bot', fallbackResponse);
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
        const stopFn = APIService.startSpeechRecognition(
          (transcript: string) => {
            setInputText(transcript);
            setIsListening(false);
            stopListeningRef.current = null;
          },
          (error: string) => {
            logger.error('Speech recognition error:', error);
            setIsListening(false);
            stopListeningRef.current = null;
          }
        );
        stopListeningRef.current = stopFn;
        setIsListening(true);
      } catch (error) {
        logger.error("Speech recognition error:", error);
        // Removed toast notification
      }
    }
  };

  const handleCameraDetection = async (result: ParallelScanResponse | DetectionResult[]) => {
    // Support both parallel scan response and legacy detection array
    if (Array.isArray(result)) {
      // Legacy single-model path
      const detections = result as DetectionResult[];
      if (detections.length > 0) {
        const detection = detections[0];
        addMessage('system', `📸 Detected: ${detection.class} (${(detection.confidence * 100).toFixed(1)}% confidence)`);
        APIService.saveDetectedLeaves(detections);
        APIService.incrementScans();
      } else {
        addMessage('system', "No leaves detected in the image. Please try again with a clearer view of the leaf.");
      }
      setShowCamera(false);
      return;
    }

    // Parallel scan path
    const scanResponse = result as ParallelScanResponse;
    const meaningful = scanResponse.ranked.filter(r => r.confidence > 0.1);

    if (meaningful.length > 0) {
      // Add scan results message with the ScanResultsFeed component
      const topLeaf = meaningful[0];
      const scanMsg: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `📸 Scanned with ${scanResponse.modelsResponded} models in ${(scanResponse.scanDurationMs / 1000).toFixed(1)}s`,
        timestamp: new Date(),
        scanResult: scanResponse,
      };
      setMessages(prev => [...prev, scanMsg]);

      // Also get AI insight for the top detected leaf
      try {
        const chatMessages: ChatMessage[] = [{
          role: "system" as const,
          content: `You are SafeLeafKitchen assistant. The camera detected ${topLeaf.leafName} leaves (${(topLeaf.confidence * 100).toFixed(1)}% confidence).

CRITICAL RECIPE RULE: If suggesting a recipe, respond with ONLY the exact title from this list:
${recipeTitles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

STRICT RULES:
- If suggesting recipe: respond with ONLY one exact title from above, nothing else
- If providing info: give brief nutritional facts about ${topLeaf.leafName} (max 2 sentences)
- Keep responses short and helpful`
        }, {
          role: 'user',
          content: `I've detected ${topLeaf.leafName}. What can you tell me about it?`
        }];

        const insight = await APIService.sendChatMessage(chatMessages);
        const suggestedRecipe = recipeTitles.find(title =>
          insight.trim().toLowerCase() === title.toLowerCase()
        );
        addMessage('bot', insight, suggestedRecipe);

        if (suggestedRecipe) {
          APIService.incrementRecipeSuggestions();
        }
      } catch (error) {
        logger.error("Nutrition insight error:", error);
      }

      APIService.incrementScans();
    } else {
      addMessage('system', "No leaves detected in the image. Please try again with a clearer view of the leaf.");
    }
    setShowCamera(false);
  };

  const handleLiveLeafSelect = async (prediction: RoboflowPrediction, snapshot: string) => {
    setShowCamera(false);

    const leafName = prediction.class;
    const conf = Math.round(prediction.confidence * 100);

    const matchedLeaf = leaves.find(l =>
      l.name.en.toLowerCase() === leafName.toLowerCase() ||
      l.name.fr.toLowerCase() === leafName.toLowerCase() ||
      l.aliases.some(a => a.toLowerCase() === leafName.toLowerCase())
    );
    const leafId = matchedLeaf?.id || 0;

    const leafCardMsg: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: '',
      timestamp: new Date(),
      leafCard: {
        leafName,
        confidence: prediction.confidence,
        snapshot,
        leafId,
      },
    };
    setMessages(prev => [...prev, leafCardMsg]);

    APIService.saveDetectedLeaves([{
      class: prediction.class,
      confidence: prediction.confidence,
      x: prediction.bbox.x,
      y: prediction.bbox.y,
      width: prediction.bbox.width,
      height: prediction.bbox.height,
    }]);
    APIService.incrementScans();

    try {
      setIsLoading(true);
      const matchedRecipes = recipes.filter(r => r.leafType === leafName.toLowerCase());
      const recipeList = matchedRecipes.length > 0 ? matchedRecipes : recipes;
      const chatMessages: ChatMessage[] = [{
        role: "system" as const,
        content: `You are SafeLeafKitchen assistant. The camera detected ${leafName} leaves (${conf}% confidence).

CRITICAL RECIPE RULE: If suggesting a recipe, respond with ONLY the exact title from this list:
${recipeList.map(r => r.title.en).map((title, index) => `${index + 1}. ${title}`).join('\n')}

STRICT RULES:
- If suggesting recipe: respond with ONLY one exact title from above, nothing else
- If providing info: give brief nutritional facts about ${leafName} (max 2 sentences)
- Keep responses short and helpful`
      }, {
        role: "user" as const,
        content: `I've detected ${leafName}. What can you tell me about it?`
      }];

      const insight = await APIService.sendChatMessage(chatMessages);
      addMessage("bot", insight);
    } catch (error) {
      logger.error("Live scan chat error:", error);
      addMessage("system", `Detected ${leafName} (${conf}%).`);
    } finally {
      setIsLoading(false);
    }
  };



  const toggleTTSMute = () => {
    const newMutedState = !isTTSMuted;
    setIsTTSMuted(newMutedState);
    APIService.setMuted(newMutedState);

    // If muting, stop any current speech
    if (newMutedState) {
      // Remove TTS functionality for now since it's not in the new API
      // APIService.stopSpeech();
      setPlayingMessages(new Set()); // Clear all playing states
    }
  };

  // Enhanced speak function for individual messages with toggle functionality
  const handleMessageSpeak = (messageId: string, _content: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling

    if (playingMessages.has(messageId)) {
      // Stop speaking this message
      // Remove TTS functionality for now since it's not in the new API
      // APIService.stopSpeech();
      setPlayingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    } else {
      // Start speaking this message
      setPlayingMessages(_prev => new Set([messageId])); // Only one message can play at a time

      // Remove TTS functionality for now since it's not in the new API
      // APIService.speak(
      //   content, 
      //   true, // Force speak even when muted
      //   () => {
      //     // On speech start
      //     setPlayingMessages(prev => new Set([messageId]));
      //   },
      //   () => {
      //     // On speech end
      //     setPlayingMessages(prev => {
      //       const newSet = new Set(prev);
      //       newSet.delete(messageId);
      //       return newSet;
      //   });
      // });
    }
  };

  if (!user && !demoMode) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <MessageSquare className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-3">Sign in to Chat</h2>
        <p className="text-muted-foreground max-w-sm mb-8">
          Create an account or sign in to save your conversations, scan leaves, and get personalized recipe recommendations.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center gap-3"
          >
            <LogIn className="w-5 h-5" />
            Sign In with Email
          </button>
          <button
            onClick={() => {
              safeStorage.set('demoMode', 'true');
              setDemoMode(true);
            }}
            className="px-8 py-3.5 rounded-2xl font-bold border-2 border-amber-400/50 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/20 hover:-translate-y-1 transition-all flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            Try Free Demo
          </button>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="glass border-b border-border p-3 sm:p-4 flex items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="p-2 rounded-lg bg-secondary/20 text-secondary hover:bg-secondary/30 transition-all duration-300"
            title="Conversations"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground whitespace-nowrap">
            SafeLeaf Assistant
          </h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {demoMode && (
            <button
              onClick={() => {
                safeStorage.remove('demoMode');
                setDemoMode(false);
              }}
              className="p-2 rounded-lg bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 transition-all duration-300"
              title="End Demo"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          <button
            onClick={() => startNewConversation(user?.id)}
            className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-300"
            title="New Conversation"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={toggleTTSMute}
            className={`p-2 rounded-lg transition-all duration-300 ${isTTSMuted
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

      {/* Demo Banner */}
      {demoMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-400/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-300 font-medium">Demo Mode</span>
            <span className="text-muted-foreground">— Scan leaves, browse recipes, explore features</span>
          </div>
          <button
            onClick={() => {
              safeStorage.remove('demoMode');
              setDemoMode(false);
            }}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Sign in to enable chat
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 pb-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] sm:max-w-[80%] relative group ${message.type === 'user'
              ? 'bg-gradient-primary text-primary-foreground'
              : message.type === 'system'
                ? 'bg-primary/20 text-primary border-2 border-primary/30 shadow-lg'
                : 'glass text-foreground'
              } p-2 sm:p-3 rounded-2xl ${message.type === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
              }`}>
              {/* Leaf Card from Scanner */}
              {message.leafCard && (
                <div className="mb-2">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/10">
                    <div className="relative aspect-[4/3] bg-black">
                      <img
                        src={message.leafCard.snapshot}
                        alt={message.leafCard.leafName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded tracking-wider">
                          YOLO26 SCAN
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">
                            {message.leafCard.leafName}
                          </h4>
                          <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                            {Math.round(message.leafCard.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {message.leafCard.leafId > 0 && (
                      <div className="p-2">
                        <button
                          onClick={() => navigateToLeaf(message.leafCard!.leafId)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-cyan-400 bg-cyan-400/5 border border-cyan-400/20 hover:bg-cyan-400/10 transition-all"
                        >
                          <LeafIcon className="w-3 h-3" />
                          VIEW LEAF PROFILE
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Parallel Scan Results Feed */}
              {message.scanResult && (
                <ScanResultsFeed
                  response={message.scanResult}
                  onLeafSelect={(leafId) => navigateToLeaf(leafId)}
                />
              )}
              {message.content && (
                <p className={`leading-relaxed ${message.type === 'system' ? 'text-base font-medium' : 'text-sm sm:text-sm'}`}>
                  {message.content}
                </p>
              )}

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

              {/* Multiple Leaf Shortcut Buttons */}
              {message.type === 'bot' && message.suggestedLeaves && message.suggestedLeaves.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestedLeaves.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => navigateToLeaf(l.id)}
                      className="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <LeafIcon className="w-3 h-3" />
                      {l.name}
                    </button>
                  ))}
                </div>
              )}

              {message.type === 'bot' && (
                <button
                  onClick={(e) => handleMessageSpeak(message.id, message.content, e)}
                  className={`absolute -right-2 -top-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${playingMessages.has(message.id)
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
            className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${isTTSMuted
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
            className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${isListening
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
        useLiveScanner ? (
          <LiveCameraScanner
            onClose={() => setShowCamera(false)}
            onLeafSelect={handleLiveLeafSelect}
          />
        ) : (
          <CameraScanner
            onClose={() => setShowCamera(false)}
            onDetection={handleCameraDetection}
          />
        )
      )}
    </div>
  );
}
