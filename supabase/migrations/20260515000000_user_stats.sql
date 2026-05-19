-- SafeLeafKitchen User Stats - Per-user activity tracking
-- Run this in Supabase Dashboard SQL Editor

-- 1. USER STATS TABLE
CREATE TABLE IF NOT EXISTS public.user_stats (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_scans INTEGER NOT NULL DEFAULT 0,
    total_chats INTEGER NOT NULL DEFAULT 0,
    total_recipe_uses INTEGER NOT NULL DEFAULT 0,
    total_recipe_views INTEGER NOT NULL DEFAULT 0,
    total_recipe_favorites INTEGER NOT NULL DEFAULT 0,
    total_leaf_views INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Users can read only their own stats
CREATE POLICY "Users can view own stats"
    ON public.user_stats
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can upsert their own stats
CREATE POLICY "Users can upsert own stats"
    ON public.user_stats
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
    ON public.user_stats
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. USER RECIPE USES TABLE (detailed log)
CREATE TABLE IF NOT EXISTS public.user_recipe_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL,
    leaf_types TEXT[] DEFAULT '{}',
    used_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_recipe_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipe uses"
    ON public.user_recipe_uses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipe uses"
    ON public.user_recipe_uses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. FUNCTION to increment user stats
CREATE OR REPLACE FUNCTION public.increment_user_stat(p_user_id UUID, p_stat_field TEXT, p_increment INTEGER DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_stats (user_id, updated_at)
    VALUES (p_user_id, now())
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_scans = CASE WHEN p_stat_field = 'total_scans' THEN public.user_stats.total_scans + p_increment ELSE public.user_stats.total_scans END,
        total_chats = CASE WHEN p_stat_field = 'total_chats' THEN public.user_stats.total_chats + p_increment ELSE public.user_stats.total_chats END,
        total_recipe_uses = CASE WHEN p_stat_field = 'total_recipe_uses' THEN public.user_stats.total_recipe_uses + p_increment ELSE public.user_stats.total_recipe_uses END,
        total_recipe_views = CASE WHEN p_stat_field = 'total_recipe_views' THEN public.user_stats.total_recipe_views + p_increment ELSE public.user_stats.total_recipe_views END,
        total_recipe_favorites = CASE WHEN p_stat_field = 'total_recipe_favorites' THEN public.user_stats.total_recipe_favorites + p_increment ELSE public.user_stats.total_recipe_favorites END,
        total_leaf_views = CASE WHEN p_stat_field = 'total_leaf_views' THEN public.user_stats.total_leaf_views + p_increment ELSE public.user_stats.total_leaf_views END,
        updated_at = now();
END;
$$;
