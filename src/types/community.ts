export type UserRole = 'admin' | 'user' | 'chef' | 'cooperatif' | 'business' | 'farmer' | 'researcher' | 'restaurant' | 'hotel';

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  avatar_emoji?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_verified: boolean;
  created_at: string;
}

export interface RecipeCategory {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  name_ar: string;
  emoji: string;
  sort_order: number;
}

export interface CommunityRecipe {
  id: string;
  title: {
    fr: string;
    en: string;
    ar: string;
  };
  steps: {
    fr: string[];
    en: string[];
    ar: string[];
  };
  category_id?: string;
  created_by?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  gps_lat?: number;
  gps_lng?: number;
  region?: string;
  background_history?: string;
  known_benefits?: string;
  prep_time_minutes?: number;
  servings?: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  
  // Joined data
  author?: Profile;
  category?: RecipeCategory;
  is_liked_by_me?: boolean;
  ingredients?: {
    fr: string[];
    en: string[];
    ar: string[];
  } | string[];
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  emoji?: string;
  parent_id?: string;
  created_at: string;
  
  // Joined data
  author?: Profile;
  replies?: RecipeComment[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'recipe_approved' | 'recipe_rejected' | 'recipe_liked' | 'recipe_commented' | 'new_follower' | 'system';
  title: string;
  body?: string;
  recipe_id?: string;
  from_user_id?: string;
  is_read: boolean;
  created_at: string;
  
  // Joined data
  recipe?: CommunityRecipe;
  from_user?: Profile;
}
