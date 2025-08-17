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
      const systemMessage: ChatMessage = {
        role: "system",
        content: `You are SafeLeafKitchen, a knowledgeable cooking and nutrition assistant specializing in vegetable leaves and herbs. You provide:

1. Nutritional information about leaves and vegetables
2. Cooking tips and recipe suggestions
3. Health benefits and safety information
4. Seasonal availability and storage tips
5. Identification help for edible plants

Be friendly, informative, and always prioritize food safety. When discussing wild plants, always recommend consulting experts before consumption.`
      };

      const requestBody = {
        model: "openai/gpt-4o-mini",
        messages: [systemMessage, ...messages],
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

  static async generateNutritionInsight(leafType: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: `I've detected ${leafType} leaves. Please provide detailed nutritional information, health benefits, cooking suggestions, and any safety considerations for this plant.`
      }
    ];

    return this.sendChatMessage(messages);
  }

  // Text-to-Speech using Web Speech API (fallback for ElevenLabs)
  static speak(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
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
}