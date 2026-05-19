import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

export interface ChatMessageDTO {
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestedRecipe?: string;
  suggestedLeafId?: number;
  suggestedLeafName?: string;
  suggestedLeaves?: { id: number; name: string }[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

class ChatHistoryService {
  async getOrCreateConversation(userId: string): Promise<string> {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New Chat' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async saveMessages(conversationId: string, messages: ChatMessageDTO[]): Promise<void> {
    const { error: delError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (delError) {
      logger.error('Failed to clear old messages', delError);
    }

    const rows = messages.map((msg, i) => ({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      metadata: {
        suggestedRecipe: msg.suggestedRecipe,
        suggestedLeafId: msg.suggestedLeafId,
        suggestedLeafName: msg.suggestedLeafName,
        suggestedLeaves: msg.suggestedLeaves,
        order: i,
      },
    }));

    const { error } = await supabase.from('messages').insert(rows);
    if (error) throw error;

    const title = this.generateTitle(messages);
    await supabase
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  async loadMessages(conversationId: string): Promise<ChatMessageDTO[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('role, content, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      role: row.role,
      content: row.content,
      suggestedRecipe: row.metadata?.suggestedRecipe,
      suggestedLeafId: row.metadata?.suggestedLeafId,
      suggestedLeafName: row.metadata?.suggestedLeafName,
      suggestedLeaves: row.metadata?.suggestedLeaves,
    }));
  }

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const summaries: ConversationSummary[] = [];
    for (const conv of data || []) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id);
      summaries.push({
        id: conv.id,
        title: conv.title || 'New Chat',
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        message_count: count || 0,
      });
    }
    return summaries;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    await supabase.from('conversations').delete().eq('id', conversationId);
  }

  async startNewConversation(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New Chat' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private generateTitle(messages: ChatMessageDTO[]): string {
    const firstUser = messages.find(m => m.role === 'user');
    if (!firstUser) return 'New Chat';
    const text = firstUser.content;
    return text.length <= 60 ? text : text.substring(0, 60) + '...';
  }
}

export const chatHistory = new ChatHistoryService();
