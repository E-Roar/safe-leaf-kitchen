import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

export interface UserStats {
  total_scans: number;
  total_chats: number;
  total_recipe_uses: number;
  total_recipe_views: number;
  total_recipe_favorites: number;
  total_leaf_views: number;
}

const LOCAL_STATS_KEY = 'safeleafkitchen_user_stats';

function getLocalStats(): UserStats {
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    return raw ? JSON.parse(raw) : {
      total_scans: 0,
      total_chats: 0,
      total_recipe_uses: 0,
      total_recipe_views: 0,
      total_recipe_favorites: 0,
      total_leaf_views: 0,
    };
  } catch {
    return {
      total_scans: 0,
      total_chats: 0,
      total_recipe_uses: 0,
      total_recipe_views: 0,
      total_recipe_favorites: 0,
      total_leaf_views: 0,
    };
  }
}

function setLocalStats(stats: UserStats): void {
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
  } catch {}
}

export class UserStatsService {
  static async recordRecipeUse(userId: string | null, recipeId: number, leafTypes?: string[]): Promise<void> {
    const local = getLocalStats();
    local.total_recipe_uses += 1;
    setLocalStats(local);

    if (userId) {
      try {
        await supabase.rpc('increment_user_stat', {
          p_user_id: userId,
          p_stat_field: 'total_recipe_uses',
          p_increment: 1,
        });
        await supabase.from('user_recipe_uses').insert({
          user_id: userId,
          recipe_id: recipeId,
          leaf_types: leafTypes || [],
        });
      } catch (err) {
        logger.warn('Failed to sync recipe use to Supabase:', err);
      }
    }
  }

  static async recordRecipeView(userId: string | null, _recipeId: number): Promise<void> {
    const local = getLocalStats();
    local.total_recipe_views += 1;
    setLocalStats(local);

    if (userId) {
      try {
        await supabase.rpc('increment_user_stat', {
          p_user_id: userId,
          p_stat_field: 'total_recipe_views',
          p_increment: 1,
        });
      } catch (err) {
        logger.warn('Failed to sync recipe view to Supabase:', err);
      }
    }
  }

  static async recordScan(userId: string | null): Promise<void> {
    const local = getLocalStats();
    local.total_scans += 1;
    setLocalStats(local);

    if (userId) {
      try {
        await supabase.rpc('increment_user_stat', {
          p_user_id: userId,
          p_stat_field: 'total_scans',
          p_increment: 1,
        });
      } catch (err) {
        logger.warn('Failed to sync scan to Supabase:', err);
      }
    }
  }

  static async recordChat(userId: string | null): Promise<void> {
    const local = getLocalStats();
    local.total_chats += 1;
    setLocalStats(local);

    if (userId) {
      try {
        await supabase.rpc('increment_user_stat', {
          p_user_id: userId,
          p_stat_field: 'total_chats',
          p_increment: 1,
        });
      } catch (err) {
        logger.warn('Failed to sync chat to Supabase:', err);
      }
    }
  }

  static async recordFavorite(userId: string | null): Promise<void> {
    const local = getLocalStats();
    local.total_recipe_favorites += 1;
    setLocalStats(local);

    if (userId) {
      try {
        await supabase.rpc('increment_user_stat', {
          p_user_id: userId,
          p_stat_field: 'total_recipe_favorites',
          p_increment: 1,
        });
      } catch (err) {
        logger.warn('Failed to sync favorite to Supabase:', err);
      }
    }
  }

  static async recordLeafView(userId: string | null): Promise<void> {
    const local = getLocalStats();
    local.total_leaf_views += 1;
    setLocalStats(local);

    if (userId) {
      try {
        await supabase.rpc('increment_user_stat', {
          p_user_id: userId,
          p_stat_field: 'total_leaf_views',
          p_increment: 1,
        });
      } catch (err) {
        logger.warn('Failed to sync leaf view to Supabase:', err);
      }
    }
  }

  static async getStats(userId: string | null): Promise<UserStats> {
    const local = getLocalStats();

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          return {
            total_scans: data.total_scans ?? 0,
            total_chats: data.total_chats ?? 0,
            total_recipe_uses: data.total_recipe_uses ?? 0,
            total_recipe_views: data.total_recipe_views ?? 0,
            total_recipe_favorites: data.total_recipe_favorites ?? 0,
            total_leaf_views: data.total_leaf_views ?? 0,
          };
        }
      } catch (err) {
        logger.warn('Failed to fetch stats from Supabase, using local:', err);
      }
    }

    return local;
  }

  static async getRecipeUses(userId: string | null): Promise<number> {
    if (userId) {
      try {
        const { count, error } = await supabase
          .from('user_recipe_uses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (!error && count !== null) {
          return count;
        }
      } catch {}
    }
    return getLocalStats().total_recipe_uses;
  }
}
