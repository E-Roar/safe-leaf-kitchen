import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, MicOff, Volume2, VolumeX, Camera } from 'lucide-react';
import CameraView from './CameraView';
import { APP_CONFIG } from '@/config/app.config';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  leafData?: any;
}

interface ChatInterfaceProps {
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'السلام عليكم! Welcome to SafeLeafKitchen! I\'m here to help you discover the nutritional benefits of Moroccan leafy vegetables. You can chat with me, use voice commands, or scan leaves with your camera. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = APP_CONFIG.SPEECH_LANG;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthesisRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string, leafData?: any) => {
    if (!content.trim() && !leafData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content || 'I scanned a leaf',
      timestamp: new Date(),
      leafData
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate API call to OpenRouter
      const response = await simulateAPICall(content, leafData);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Text-to-speech for assistant response
      if (synthesisRef.current && !isSpeaking) {
        speakText(response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAPICall = async (content: string, leafData?: any): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (leafData) {
      return `I can see you've scanned a ${leafData.predictions[0]?.class || 'leafy vegetable'}! This is an excellent source of vitamins A, C, and K, along with folate and iron. In Moroccan cuisine, this leaf is often used in tagines and soups. Would you like me to suggest some traditional recipes that highlight its nutritional benefits?`;
    }
    
    return `Thank you for your question about "${content}". I'd be happy to help you with nutritional information and Moroccan recipes featuring leafy vegetables. Could you tell me more about what specific information you're looking for?`;
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!synthesisRef.current) return;

    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = APP_CONFIG.SPEECH_LANG;
    utterance.rate = 0.9;
    
    // Try to use a female voice
    const voices = synthesisRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'))
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleLeafDetected = (detectionData: any) => {
    sendMessage('', detectionData);
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero moroccan-pattern flex flex-col">
      {/* Header */}
      <div className="glass-card p-4 m-4 mb-0 organic-border">
        <div className="flex items-center justify-between">
          <Button variant="glass" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SafeLeaf Chat
          </h1>
          <Button
            variant="camera"
            size="icon"
            onClick={() => setShowCamera(!showCamera)}
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      {showCamera && (
        <div className="mx-4 mb-4">
          <CameraView
            isVisible={showCamera}
            onToggleCamera={() => setShowCamera(false)}
            onLeafDetected={handleLeafDetected}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 mx-4">
        <Card className="glass-card h-full organic-border">
          <ScrollArea ref={scrollAreaRef} className="h-[60vh] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gradient-primary text-primary-foreground organic-border-alt'
                        : 'glass-card text-foreground organic-border'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-card p-3 organic-border">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-glow rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary-glow rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-primary-glow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Input Area */}
      <div className="p-4">
        <Card className="glass-card p-4 organic-border">
          <div className="flex items-center space-x-2">
            <Button
              variant="camera"
              size="icon"
              onClick={toggleListening}
              className={isListening ? 'glow-pulse' : ''}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about nutrition, recipes, or scan a leaf..."
              className="flex-1 glass-button border-0"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputValue)}
            />

            <Button
              variant="camera"
              size="icon"
              onClick={isSpeaking ? stopSpeaking : () => {}}
              className={isSpeaking ? 'glow-pulse' : ''}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>

            <Button
              variant="hero"
              size="icon"
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatInterface;