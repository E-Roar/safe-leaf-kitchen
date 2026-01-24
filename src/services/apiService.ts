import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import { AnalyticsService } from '@/services/analyticsService';

// Settings are managed via SettingsService (env vars required)
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
  suggestedRecipe?: string;
  suggestedLeafId?: number;
  suggestedLeafName?: string;
  suggestedLeaves?: { id: number; name: string }[];
}

export interface ConversationData {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  tags: string[];
}

export interface RecipeView {
  id: number;
  timestamp: Date;
}

export interface FavoriteRecipe {
  id: number;
  timestamp: Date;
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
      // Use Supabase Secure Edge Function
      const { data, error } = await supabase.functions.invoke('roboflow-scan', {
        body: { imageBase64 }
      });

      if (error) {
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      // Track scan in analytics
      const result = data as RoboflowResponse;
      if (result.predictions && result.predictions.length > 0) {
        const detectedLeaf = result.predictions[0].class;
        AnalyticsService.recordScan(detectedLeaf);
      } else {
        AnalyticsService.recordScan();
      }

      return result;
    } catch (error) {
      logger.error("Roboflow API error:", error);
      throw new Error("Failed to detect leaf in image");
    }
  }

  static async sendChatMessage(messages: ChatMessage[]): Promise<string> {
    try {
      const settings = SettingsService.getSettings();

      let result: string;
      // Choose provider based on settings
      if (settings.chatProvider === 'n8n') {
        result = await this.sendChatMessageToN8N(messages);
      } else {
        result = await this.sendChatMessageToOpenRouter(messages);
      }

      // Track chat in analytics
      AnalyticsService.recordChat();

      return result;
    } catch (error) {
      logger.error("Chat API error:", error);
      throw error;
    }
  }

  static async sendChatMessageToOpenRouter(messages: ChatMessage[]): Promise<string> {
    try {
      logger.debug("Sending request to Secure Chat Edge Function");

      // Use Supabase Secure Edge Function with RAG
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { messages }
      });

      if (error) {
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      logger.debug("Chat response received:", data);

      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from chat function");
      }

      return data.choices[0].message.content;
    } catch (error) {
      logger.error("Chat API error:", error);
      throw new Error("Failed to send chat message");
    }
  }

  static async sendChatMessageToN8N(messages: ChatMessage[]): Promise<string> {
    try {
      const { n8nWebhookUrl } = SettingsService.getSettings();

      if (!n8nWebhookUrl) {
        throw new Error("N8N webhook URL not configured");
      }

      const requestBody = {
        messages: messages,
        timestamp: new Date().toISOString()
      };

      logger.debug("Sending request to N8N webhook:", {
        url: n8nWebhookUrl,
        messageCount: messages.length
      });

      const response = await axios.post(n8nWebhookUrl, requestBody, {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 second timeout
      });

      logger.debug("N8N webhook response:", response.data);

      if (!response.data || typeof response.data.response !== 'string') {
        throw new Error("Invalid response from N8N webhook");
      }

      return response.data.response;
    } catch (error) {
      logger.error("N8N webhook error:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          logger.error("N8N Response Error:", { status: error.response.status, data: error.response.data });
          throw new Error(`N8N Error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
        } else if (error.request) {
          logger.error("Network Error:", error.request);
          throw new Error("Network error: Unable to reach N8N webhook");
        }
      }

      throw new Error("Failed to send chat message via N8N");
    }
  }

  // Text-to-speech methods
  static speak(text: string, force: boolean = false, onStart?: () => void, onEnd?: () => void): void {
    if (this.isMuted && !force) {
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        logger.debug('TTS: Speech started');
        onStart?.();
      };

      utterance.onend = () => {
        logger.debug('TTS: Speech ended');
        onEnd?.();
      };

      utterance.onerror = (event) => {
        logger.error('TTS: Speech synthesis error:', event.error);
        onEnd?.();
      };

      speechSynthesis.speak(utterance);
    } else {
      logger.warn('TTS: Speech synthesis not supported in this browser');
      onEnd?.();
    }
  }

  static stopSpeech(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      logger.debug('TTS: Speech synthesis cancelled');
    }
  }

  // Speech recognition
  static startSpeechRecognition(onResult: (text: string) => void, onError: (error: string) => void): () => void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError("Speech recognition not supported in this browser");
      return () => { };
    }

    const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionStatic;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logger.error("Speech recognition error:", event.error);
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.start();
    return () => recognition.stop();
  }

  // Statistics tracking
  static incrementScans(): number {
    const current = this.getScans();
    const newCount = current + 1;
    if (this.setScans(newCount)) {
      return newCount;
    }
    return current;
  }

  static getScans(): number {
    return this.getStat('scans');
  }

  private static setScans(count: number): boolean {
    return this.setStat('scans', count);
  }

  static incrementChats(): number {
    const current = this.getChats();
    const newCount = current + 1;
    if (this.setChats(newCount)) {
      return newCount;
    }
    return current;
  }

  static getChats(): number {
    return this.getStat('chats');
  }

  private static setChats(count: number): boolean {
    return this.setStat('chats', count);
  }

  // Detected leaves tracking
  static saveDetectedLeaves(leaves: DetectionResult[]): boolean {
    const key = this.getStorageKey('detected_leaves');
    const stored: Array<{ timestamp: number; leaves: DetectionResult[] }> = this.getStorage(key) || [];
    const newEntry = {
      timestamp: Date.now(),
      leaves: leaves
    };

    stored.push(newEntry);
    // Keep only last 100 detections
    if (stored.length > 100) {
      stored.splice(0, stored.length - 100);
    }

    return this.setStorage(key, stored);
  }

  static getDetectedLeaves(): Array<{ timestamp: number; leaves: DetectionResult[] }> {
    const key = this.getStorageKey('detected_leaves');
    const result = this.getStorage(key) || [];
    return Array.isArray(result) ? result : [];
  }

  // Recipe suggestions tracking
  static incrementRecipeSuggestions(): number {
    const current = this.getRecipeSuggestions();
    const newCount = current + 1;
    if (this.setRecipeSuggestions(newCount)) {
      return newCount;
    }
    return current;
  }

  static getRecipeSuggestions(): number {
    return this.getStat('recipe_suggestions');
  }

  private static setRecipeSuggestions(count: number): boolean {
    return this.setStat('recipe_suggestions', count);
  }

  // Recipe views tracking
  static saveRecipeView(recipeId: number): boolean {
    const key = this.getStorageKey('recipe_views');
    const stored = this.getStorage<RecipeView[]>(key) || [];
    const newEntry: RecipeView = { id: recipeId, timestamp: new Date() };

    stored.push(newEntry);
    // Keep only last 200 views
    if (stored.length > 200) {
      stored.splice(0, stored.length - 200);
    }

    // Track recipe view in analytics
    AnalyticsService.recordRecipeView();

    return this.setStorage(key, stored);
  }

  static getRecipeViews(): RecipeView[] {
    const key = this.getStorageKey('recipe_views');
    return this.getStorage<RecipeView[]>(key) || [];
  }

  // Favorite recipes tracking
  static toggleFavoriteRecipe(recipeId: number): boolean {
    const key = this.getStorageKey('favorite_recipes');
    const stored = this.getStorage<FavoriteRecipe[]>(key) || [];
    const existingIndex = stored.findIndex(fav => fav.id === recipeId);

    if (existingIndex >= 0) {
      stored.splice(existingIndex, 1);
    } else {
      stored.push({ id: recipeId, timestamp: new Date() });
    }

    return this.setStorage(key, stored);
  }

  static getFavoriteRecipes(): FavoriteRecipe[] {
    const key = this.getStorageKey('favorite_recipes');
    return this.getStorage<FavoriteRecipe[]>(key) || [];
  }

  static isRecipeFavorited(recipeId: number): boolean {
    const favorites = this.getFavoriteRecipes();
    return favorites.some(fav => fav.id === recipeId);
  }

  // Conversation management
  static saveConversation(conversationId: string, messages: ChatMessage[]): boolean {
    const key = this.getStorageKey(`conversation_${conversationId}`);
    const conversationData = {
      id: conversationId,
      messages: messages,
      timestamp: Date.now()
    };

    logger.debug('Saving conversation', { key, messageCount: messages.length });

    if (!this.setStorage(key, conversationData)) {
      logger.error('Failed to save conversation data');
      return false;
    }

    // Update conversation list
    const listKey = this.getStorageKey('conversation_list');
    const conversationList = this.getStorage<ConversationData[]>(listKey) || [];

    const existingIndex = conversationList.findIndex(conv => conv.id === conversationId);
    const conversationInfo: ConversationData = {
      id: conversationId,
      title: this.generateConversationTitle(messages),
      timestamp: new Date(),
      messageCount: messages.length,
      tags: this.extractConversationTags(messages)
    };

    if (existingIndex >= 0) {
      conversationList[existingIndex] = conversationInfo;
    } else {
      conversationList.unshift(conversationInfo);
    }

    // Keep only last 50 conversations
    const limitedConversations = conversationList.slice(0, 50);

    return this.setStorage(listKey, limitedConversations);
  }

  static loadConversation(conversationId: string): ChatMessage[] | null {
    const key = this.getStorageKey(`conversation_${conversationId}`);
    logger.debug('Loading conversation with key:', key);
    const conversationData = this.getStorage<{ messages: ChatMessage[] }>(key);
    const result = conversationData?.messages || null;
    logger.debug('Loaded messages count:', result?.length || 0);
    return result;
  }

  static getConversationList(): ConversationData[] {
    const key = this.getStorageKey('conversation_list');
    return this.getStorage<ConversationData[]>(key) || [];
  }

  static searchConversations(query: string): ConversationData[] {
    const conversations = this.getConversationList();
    const lowerQuery = query.toLowerCase();

    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  static getConversationsByTag(tag: string): ConversationData[] {
    const conversations = this.getConversationList();
    const lowerTag = tag.toLowerCase();

    return conversations.filter(conv =>
      conv.tags.some(t => t.toLowerCase().includes(lowerTag))
    );
  }

  static getConversationsWithRecipes(): ConversationData[] {
    const conversations = this.getConversationList();
    return conversations.filter(conv => conv.tags.includes('recipe'));
  }

  static deleteConversation(conversationId: string): boolean {
    const key = this.getStorageKey(`conversation_${conversationId}`);
    if (!this.removeStorage(key)) {
      return false;
    }

    // Remove from conversation list
    const listKey = this.getStorageKey('conversation_list');
    const conversationList = this.getConversationList();
    const filteredConversations = conversationList.filter(conv => conv.id !== conversationId);

    return this.setStorage(listKey, filteredConversations);
  }

  static setCurrentConversation(conversationId: string): boolean {
    const key = this.getStorageKey('current_conversation');
    return this.setStorage(key, conversationId);
  }

  static getCurrentConversation(): string | null {
    const key = this.getStorageKey('current_conversation');
    return this.getStorage<string>(key);
  }

  static clearCurrentConversation(): boolean {
    const key = this.getStorageKey('current_conversation');
    return this.removeStorage(key);
  }

  // Utility methods
  private static getStorageKey(suffix: string): string {
    return `safeleafkitchen_${suffix}`;
  }

  private static getStat(key: string): number {
    const stored = this.getStorage<number>(key);
    return stored || 0;
  }

  private static setStat(key: string, value: number): boolean {
    return this.setStorage(key, value);
  }

  private static getStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  }

  private static setStorage<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Failed to write to localStorage: ${key}`, error);
      return false;
    }
  }

  private static removeStorage(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`Failed to remove from localStorage: ${key}`, error);
      return false;
    }
  }

  private static generateConversationTitle(messages: ChatMessage[]): string {
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) return 'New Conversation';

    const firstUserMessage = userMessages[0].content;
    if (firstUserMessage.length <= 50) {
      return firstUserMessage;
    }

    return firstUserMessage.substring(0, 50) + '...';
  }

  private static extractConversationTags(messages: ChatMessage[]): string[] {
    const tags: string[] = [];
    const content = messages.map(msg => msg.content).join(' ').toLowerCase();

    if (content.includes('recipe') || content.includes('cook') || content.includes('ingredient')) {
      tags.push('recipe');
    }
    if (content.includes('leaf') || content.includes('scan') || content.includes('detect')) {
      tags.push('leaf');
    }
    if (content.includes('nutrition') || content.includes('health') || content.includes('vitamin')) {
      tags.push('nutrition');
    }

    return tags;
  }
}
