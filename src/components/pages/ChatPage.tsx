
import { useState, useRef, useEffect } from "react";
import { Send, Mic, Camera, MicOff, Volume2, VolumeX } from "lucide-react";
import { APIService, StorageService, ChatMessage } from "@/services/apiService";
import CameraScanner from "@/components/features/CameraScanner";
import { toast } from "sonner";

interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your SafeLeafKitchen assistant. I can help you identify leaves, provide nutritional information, and suggest delicious recipes. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isTTSMuted, setIsTTSMuted] = useState(APIService.isTTSMuted());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'bot' | 'system', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
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
          content: `You are SafeLeafKitchen, a witty and friendly Moroccan-inspired cooking and nutrition assistant. 
You specialize in vegetable leaves, herbs, and Mediterranean flavors. 
Always keep responses short, warm, and easy to follow. 

Start by asking the user about:
- Any health conditions to consider
- Dietary preferences (vegan, vegetarian, pescatarian, omnivore, etc.)
- Any allergies
- Favorite flavors or Moroccan dishes they like

Important rules for responses:
- Never use hashtags, emojis, or decorative symbols
- Recipes must always be presented in a clear structured format with these sections:
  • Title  
  • Ingredients (bulleted list)  
  • Instructions (numbered steps)  
  • Serving suggestions or safety notes if needed

Be concise, helpful, and keep a Moroccan flair in tone and suggestions.`
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
      addMessage('bot', response);
      StorageService.incrementChats();
      
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
          content: `You are SafeLeafKitchen, a witty and friendly Moroccan-inspired assistant who gives short, clear insights. 
When a leaf is detected, provide nutritional facts, health benefits, and safe cooking ideas. 
If relevant, suggest a Moroccan-style recipe.

Important rules for responses:
- No hashtags, emojis, or decorative symbols
- Recipes must be structured as:
  • Title  
  • Ingredients (bulleted list)  
  • Instructions (numbered steps)  
  • Serving suggestions or safety notes if needed

Keep answers concise, practical, and with a Moroccan touch.`
        });

        chatMessages.push({
          role: 'user',
          content: `I've detected ${leafType} leaves. Please provide detailed nutritional information, health benefits, cooking suggestions, and any safety considerations for this plant.`
        });

        const insight = await APIService.generateNutritionInsight(leafType, chatMessages);
        addMessage('bot', insight);
        StorageService.addDetectedLeaf(leafType);
        StorageService.incrementScans();
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
        <h2 className="text-base sm:text-lg font-semibold text-foreground">
          SafeLeaf Assistant
        </h2>
        <button
          onClick={toggleTTSMute}
          className={`p-2 rounded-lg transition-all duration-300 ${
            isTTSMuted 
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' 
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          }`}
          title={isTTSMuted ? "Unmute TTS" : "Mute TTS"}
        >
          {isTTSMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>

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
