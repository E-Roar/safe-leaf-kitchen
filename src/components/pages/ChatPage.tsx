
import { useState, useRef, useEffect } from "react";
import { Send, Mic, Camera, MicOff, Volume2, VolumeX, ChefHat, Plus, MessageSquare, Trash2, Search, Tag, Filter } from "lucide-react";
import { APIService, StorageService, ChatMessage } from "@/services/apiService";
import CameraScanner from "@/components/features/CameraScanner";
import { recipes } from "@/data/recipes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  suggestedRecipe?: string;
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
      toast.success(`Opening ${recipeTitle} recipe!`);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
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
    toast.success("Started new conversation");
  };

  const loadConversation = (conversationId: string) => {
    const savedMessages = StorageService.loadConversation(conversationId);
    if (savedMessages) {
      setMessages(savedMessages);
      setCurrentConversationId(conversationId);
      StorageService.setCurrentConversationId(conversationId);
      setIsFirstMessage(false);
      setShowConversations(false);
      toast.success("Conversation loaded");
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
    
    toast.success("Conversation deleted");
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

  const addMessage = (type: 'user' | 'bot' | 'system', content: string, suggestedRecipe?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      suggestedRecipe
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
You: "Onion leaves are rich in antioxidants and vitamins. They provide excellent nutritional benefits for cooking."`
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
      
      toast.error("Failed to send message");
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
        toast.error("Speech recognition not supported in this browser");
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
        StorageService.addDetectedLeaf(leafType);
        StorageService.incrementScans();
        
        // If a recipe was suggested, increment recipe suggestions metric
        if (suggestedRecipe) {
          StorageService.incrementRecipeSuggestions();
        }
        
        toast.success(`Successfully identified ${leafType}!`);
      } catch (error) {
        console.error("Nutrition insight error:", error);
        addMessage('bot', `I've detected ${leafType} leaves, but I'm having trouble providing detailed information right now. Please try asking me about this plant directly.`);
      }
    } else {
      addMessage('system', "No leaves detected in the image. Please try again with a clearer view of the leaf.");
      toast.error("No leaves detected");
    }
    setShowCamera(false);
  };

  const speakMessage = (content: string) => {
    APIService.speak(content);
  };

  const toggleTTSMute = () => {
    const newMutedState = !isTTSMuted;
    setIsTTSMuted(newMutedState);
    APIService.setMuted(newMutedState);
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
            <div className={`max-w-[85%] sm:max-w-[80%] relative group ${
              message.type === 'user' 
                ? 'bg-gradient-primary text-primary-foreground' 
                : message.type === 'system'
                ? 'bg-accent/20 text-accent-foreground'
                : 'glass text-foreground'
            } p-2 sm:p-3 rounded-2xl ${
              message.type === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
            }`}>
              <p className="text-sm sm:text-sm leading-relaxed">{message.content}</p>
              
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
              
              {message.type === 'bot' && (
                <button
                  onClick={() => speakMessage(message.content)}
                  disabled={isTTSMuted}
                  className={`absolute -right-2 -top-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isTTSMuted 
                      ? 'bg-muted/20 text-muted-foreground cursor-not-allowed opacity-60' 
                      : 'bg-primary/20 hover:bg-primary/30 text-primary opacity-100 hover:scale-110'
                  }`}
                  title={isTTSMuted ? "TTS is muted" : "Speak message"}
                >
                  {isTTSMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
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
        
        <div ref={messagesEndRef} />
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
