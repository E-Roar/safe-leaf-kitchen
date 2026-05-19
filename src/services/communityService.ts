import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/lib/logger";
import type { 
  Profile, 
  CommunityRecipe, 
  RecipeComment, 
  RecipeCategory,
  Notification 
} from "@/types/community";

export class CommunityService {
  /**
   * ── PROFILES ──────────────────────────────────────────────────────────────
   */

  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      logger.warn("CommunityService.getProfile: no profile found", err);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error("CommunityService.updateProfile error:", err);
      return false;
    }
  }

  /**
   * ── RECIPES ──────────────────────────────────────────────────────────────
   */

  static async getRecipes(options?: { 
    limit?: number; 
    offset?: number; 
    categoryId?: string;
    status?: string;
  }): Promise<CommunityRecipe[]> {
    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          author:profiles(*),
          category:recipe_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      if (options?.categoryId) query = query.eq('category_id', options.categoryId);
      if (options?.status) query = query.eq('status', options.status);
      else query = query.eq('status', 'approved');

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as CommunityRecipe[];
    } catch (err) {
      logger.error("CommunityService.getRecipes error:", err);
      return [];
    }
  }

  static async createRecipe(recipe: Partial<CommunityRecipe>): Promise<CommunityRecipe | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          ...recipe,
          status: 'pending'
        })
        .select(`
          *,
          author:profiles(*),
          category:recipe_categories(*)
        `)
        .single();

      if (error) throw error;
      return data as CommunityRecipe;
    } catch (err) {
      logger.error("CommunityService.createRecipe error:", err);
      return null;
    }
  }

  static async updateRecipe(recipeId: string, updates: Partial<CommunityRecipe>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', recipeId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error("CommunityService.updateRecipe error:", err);
      return false;
    }
  }

  static async approveRecipe(recipeId: string): Promise<boolean> {
    return this.updateRecipe(recipeId, { status: 'approved' } as any);
  }

  static async rejectRecipe(recipeId: string): Promise<boolean> {
    return this.updateRecipe(recipeId, { status: 'rejected' } as any);
  }

  static async deleteRecipe(recipeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error("CommunityService.deleteRecipe error:", err);
      return false;
    }
  }

  static async likeRecipe(recipeId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipe_likes')
        .insert({ recipe_id: recipeId, user_id: userId });

      if (error) {
        if (error.code === '23505') return true; // Already liked
        throw error;
      }
      return true;
    } catch (err) {
      logger.error("CommunityService.likeRecipe error:", err);
      return false;
    }
  }

  static async unlikeRecipe(recipeId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipe_likes')
        .delete()
        .match({ recipe_id: recipeId, user_id: userId });

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error("CommunityService.unlikeRecipe error:", err);
      return false;
    }
  }

  /**
   * ── COMMENTS ─────────────────────────────────────────────────────────────
   */

  static async getComments(recipeId: string): Promise<RecipeComment[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_comments')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as RecipeComment[];
    } catch (err) {
      logger.error("CommunityService.getComments error:", err);
      return [];
    }
  }

  static async addComment(recipeId: string, userId: string, content: string, parentId?: string): Promise<RecipeComment | null> {
    try {
      const { data, error } = await supabase
        .from('recipe_comments')
        .insert({ 
          recipe_id: recipeId, 
          user_id: userId, 
          content, 
          parent_id: parentId 
        })
        .select(`
          *,
          author:profiles(*)
        `)
        .single();

      if (error) throw error;
      return data as RecipeComment;
    } catch (err) {
      logger.error("CommunityService.addComment error:", err);
      return null;
    }
  }

  /**
   * ── CATEGORIES ───────────────────────────────────────────────────────────
   */

  static async getCategories(): Promise<RecipeCategory[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as RecipeCategory[];
    } catch (err) {
      logger.error("CommunityService.getCategories error:", err);
      return [];
    }
  }

  /**
   * ── NOTIFICATIONS ────────────────────────────────────────────────────────
   */

  static async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          recipe:recipes(*),
          from_user:profiles(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Notification[];
    } catch (err) {
      logger.error("CommunityService.getNotifications error:", err);
      return [];
    }
  }

  static async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      logger.error("CommunityService.getUnreadNotificationCount error:", err);
      return 0;
    }
  }

  static async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (err) {
      logger.error("CommunityService.markNotificationRead error:", err);
      return false;
    }
  }
}
