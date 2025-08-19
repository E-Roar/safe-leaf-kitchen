
import { useState, useRef, useEffect } from "react";
import { Send, Mic, Camera, MicOff, Volume2, VolumeX, ChefHat, Plus, MessageSquare, Trash2 } from "lucide-react";
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
      
      // If no current conversation, start a new one
      if (!currentConversationId) {
        startNewConversation();
      }
    };
    
    loadConversations();
  }, []);

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
      startNewConversation();
    }
    
    toast.success("Conversation deleted");
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
      
      // Only add system message for the first user message
      if (isFirstMessage) {
        chatMessages.push({
          role: "system",
          content: `You are SafeLeafKitchen, a Moroccan-inspired cooking assistant.

CRITICAL: When users ask for recipes, you must respond with ONLY the exact recipe title from this list, nothing else:
${recipeTitles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

RECIPE RESPONSE RULES:
- If user asks for a recipe: respond with ONLY one exact title from the list above
- Do NOT provide ingredients, instructions, or details
- Do NOT add any extra text, explanations, or formatting
- Just the title exactly as listed

For non-recipe questions: Give short, helpful advice about leaves and nutrition with Moroccan flair.

Examples:
User: "I want a recipe with onion leaves"
You: "Stuffed Msemen with Onion Leaves"

User: "Give me an easy recipe"
You: "Omelette with Onion Leaves"`
        });
        setIsFirstMessage(false);
      }

      // Add conversation history (excluding system messages from UI)
      const conversationHistory = messages
        .filter(m => m.type !== 'system')
        .map(m => ({
          role: m.type === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content
        }));

      chatMessages.push(...conversationHistory);
      chatMessages.push({ role: 'user', content: text });

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
      addMessage('bot', "I'm sorry, I'm having trouble processing your request right now. Please try again.");
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

RECIPE RESPONSE: If suggesting a recipe, respond with ONLY the exact title from this list:
${recipeTitles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

RULES:
- If suggesting recipe: respond with ONLY one exact title from above
- If providing info: give brief nutritional facts about ${leafType}
- Do NOT provide ingredients, instructions, or recipe details
- Keep responses short and helpful

Examples:
- Recipe suggestion: "Stuffed Msemen with Onion Leaves"
- Info response: "${leafType} leaves are rich in antioxidants and vitamins"`
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
        <div className="absolute top-16 left-0 right-0 z-30 glass border-b border-border max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-3">Recent Conversations</h3>
            {conversations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No saved conversations yet</p>
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
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.preview}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {conversation.messageCount} messages
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversation.lastUpdated).toLocaleDateString()}
                        </span>
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
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
