import axios from 'axios';

// Settings are managed via SettingsService (with hardcoded defaults)
import { SettingsService } from "@/services/settingsService";

export interface DetectionResult {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowResponse {
  predictions: DetectionResult[];
  image: {
    width: number;
    height: number;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class APIService {
  private static isMuted = false;

  static setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      speechSynthesis.cancel(); // Stop any ongoing speech
    }
  }

  static isTTSMuted(): boolean {
    return this.isMuted;
  }

  static async detectLeaf(imageBase64: string): Promise<RoboflowResponse> {
    try {
      const { roboflowEndpoint, roboflowApiKey } = SettingsService.getSettings();
      const response = await axios({
        method: "POST",
        url: roboflowEndpoint,
        params: { api_key: roboflowApiKey },
        data: imageBase64,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      return response.data;
    } catch (error) {
      console.error("Roboflow API error:", error);
      throw new Error("Failed to detect leaf in image");
    }
  }

  static async sendChatMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const requestBody = {
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      };

      const { openrouterEndpoint, openrouterApiKey } = SettingsService.getSettings();
      const response = await axios.post(openrouterEndpoint, requestBody, {
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json"
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("OpenRouter API error:", error);
      throw new Error("Failed to get response from chat assistant");
    }
  }

  static async generateNutritionInsight(leafType: string, chatMessages?: ChatMessage[]): Promise<string> {
    if (chatMessages) {
      return this.sendChatMessage(chatMessages);
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are SafeLeafKitchen, a knowledgeable cooking and nutrition assistant specializing in vegetable leaves and herbs. Provide comprehensive information including nutritional data, cooking methods, health benefits, and safety considerations.`
      },
      {
        role: "user",
        content: `I've detected ${leafType} leaves. Please provide detailed nutritional information, health benefits, cooking suggestions, and any safety considerations for this plant.`
      }
    ];

    return this.sendChatMessage(messages);
  }

  // Text-to-Speech using Web Speech API with feminine voice
  static speak(text: string): void {
    if (this.isMuted) {
      return; // Don't speak if muted
    }
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2; // Higher pitch for more feminine sound
      utterance.volume = 0.8;
      
      // Try to find a feminine voice
      const voices = speechSynthesis.getVoices();
      const feminineVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('susan')
      );
      
      if (feminineVoice) {
        utterance.voice = feminineVoice;
      } else {
        // Fallback: use first available voice with higher pitch
        const availableVoices = voices.filter(voice => voice.lang.startsWith('en'));
        if (availableVoices.length > 0) {
          utterance.voice = availableVoices[0];
        }
      }
      
      speechSynthesis.speak(utterance);
    }
  }

  // Speech-to-Text using Web Speech API
  static startListening(callback: (text: string) => void): () => void {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      throw new Error("Speech recognition not supported in this browser");
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      callback(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();

    return () => recognition.stop();
  }
}

// Storage service for app statistics
export class StorageService {
  private static getStorageKey(key: string): string {
    return `safeleafkitchen_${key}`;
  }

  static getScans(): number {
    return parseInt(localStorage.getItem(this.getStorageKey('scans')) || '0', 10);
  }

  static incrementScans(): void {
    const current = this.getScans();
    localStorage.setItem(this.getStorageKey('scans'), (current + 1).toString());
  }

  static getChats(): number {
    return parseInt(localStorage.getItem(this.getStorageKey('chats')) || '0', 10);
  }

  static incrementChats(): void {
    const current = this.getChats();
    localStorage.setItem(this.getStorageKey('chats'), (current + 1).toString());
  }

  static addDetectedLeaf(leafType: string): void {
    const key = this.getStorageKey('detected_leaves');
    const stored = localStorage.getItem(key);
    const leaves: Record<string, number> = stored ? JSON.parse(stored) : {};
    leaves[leafType] = (leaves[leafType] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(leaves));
  }

  static getDetectedLeaves(): Record<string, number> {
    const key = this.getStorageKey('detected_leaves');
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  }

  static getRecipeSuggestions(): number {
    return parseInt(localStorage.getItem(this.getStorageKey('recipe_suggestions')) || '0', 10);
  }

  static incrementRecipeSuggestions(): void {
    const current = this.getRecipeSuggestions();
    localStorage.setItem(this.getStorageKey('recipe_suggestions'), (current + 1).toString());
  }

  // Conversation cache management
  static saveConversation(conversationId: string, messages: any[]): void {
    const key = this.getStorageKey('conversation_' + conversationId);
    localStorage.setItem(key, JSON.stringify({
      id: conversationId,
      messages,
      lastUpdated: new Date().toISOString(),
      messageCount: messages.length
    }));
    
    // Update conversation list
    const conversations = this.getConversationList();
    const existingIndex = conversations.findIndex(c => c.id === conversationId);
    const conversationInfo = {
      id: conversationId,
      lastUpdated: new Date().toISOString(),
      messageCount: messages.length,
      preview: messages.length > 1 ? messages[1].content.substring(0, 50) + '...' : 'New conversation'
    };
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversationInfo;
    } else {
      conversations.unshift(conversationInfo);
    }
    
    // Keep only last 10 conversations
    const limitedConversations = conversations.slice(0, 10);
    localStorage.setItem(this.getStorageKey('conversation_list'), JSON.stringify(limitedConversations));
  }

  static loadConversation(conversationId: string): any[] | null {
    const key = this.getStorageKey('conversation_' + conversationId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const conversation = JSON.parse(stored);
      return conversation.messages;
    }
    return null;
  }

  static getConversationList(): any[] {
    const stored = localStorage.getItem(this.getStorageKey('conversation_list'));
    return stored ? JSON.parse(stored) : [];
  }

  static deleteConversation(conversationId: string): void {
    // Remove conversation data
    const key = this.getStorageKey('conversation_' + conversationId);
    localStorage.removeItem(key);
    
    // Update conversation list
    const conversations = this.getConversationList();
    const filteredConversations = conversations.filter(c => c.id !== conversationId);
    localStorage.setItem(this.getStorageKey('conversation_list'), JSON.stringify(filteredConversations));
  }

  static createNewConversationId(): string {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
