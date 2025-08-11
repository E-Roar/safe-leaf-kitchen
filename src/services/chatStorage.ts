interface StoredMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  leafData?: any;
}

interface ChatSession {
  id: string;
  messages: StoredMessage[];
  lastUpdated: string;
}

class ChatStorageService {
  private readonly STORAGE_KEY = 'safeleaf_chat_history';
  private readonly MAX_SESSIONS = 10;
  private readonly MAX_MESSAGES_PER_SESSION = 100;

  // Get current session or create new one
  getCurrentSession(): ChatSession {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      return this.createNewSession();
    }
    
    // Return the most recent session
    return sessions[0];
  }

  // Create a new chat session
  createNewSession(): ChatSession {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      messages: [{
        id: '1',
        type: 'assistant',
        content: 'السلام عليكم! Welcome to SafeLeafKitchen! I\'m here to help you discover the nutritional benefits of Moroccan leafy vegetables. You can chat with me, use voice commands, or scan leaves with your camera. How can I assist you today?',
        timestamp: new Date().toISOString()
      }],
      lastUpdated: new Date().toISOString()
    };

    this.saveSession(newSession);
    return newSession;
  }

  // Save a message to current session
  saveMessage(message: Omit<StoredMessage, 'timestamp'>) {
    const session = this.getCurrentSession();
    
    const storedMessage: StoredMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };

    session.messages.push(storedMessage);
    
    // Keep only the latest messages
    if (session.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
    }
    
    session.lastUpdated = new Date().toISOString();
    this.saveSession(session);
  }

  // Get all chat sessions
  getAllSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  // Save session to storage
  private saveSession(session: ChatSession) {
    try {
      let sessions = this.getAllSessions();
      
      // Update existing session or add new one
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session); // Add to beginning
      }
      
      // Keep only recent sessions
      sessions = sessions.slice(0, this.MAX_SESSIONS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  // Clear all chat history
  clearHistory() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }

  // Convert stored messages to component format
  convertToMessages(storedMessages: StoredMessage[]) {
    return storedMessages.map(msg => ({
      id: msg.id,
      type: msg.type,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      leafData: msg.leafData
    }));
  }
}

export const chatStorage = new ChatStorageService();
