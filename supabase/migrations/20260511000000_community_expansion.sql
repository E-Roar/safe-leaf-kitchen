-- SafeLeafKitchen Community Platform - Phase 6 Migration
-- IMPORTANT: Run this entire script in the Supabase Dashboard SQL Editor

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' 
        CHECK (role IN ('admin','user','chef','cooperatif','business','farmer','researcher','restaurant','hotel')),
    avatar_emoji TEXT DEFAULT '👤',
    avatar_url TEXT,
    bio TEXT DEFAULT '',
    location TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Allow service_role to do everything (needed for seed scripts)
CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (true);


-- 2. RECIPE CATEGORIES
CREATE TABLE IF NOT EXISTS public.recipe_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    emoji TEXT DEFAULT '🍽️',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.recipe_categories FOR SELECT USING (true);
CREATE POLICY "Admin manage categories" ON public.recipe_categories FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed Moroccan dish categories
INSERT INTO public.recipe_categories (slug, name_fr, name_en, name_ar, emoji, sort_order) VALUES
    ('salades', 'Salades', 'Salads', 'سلطات', '🥗', 1),
    ('soupes', 'Soupes', 'Soups', 'شوربات', '🥣', 2),
    ('tajines', 'Tajines', 'Tagines', 'طواجن', '🥘', 3),
    ('couscous', 'Couscous', 'Couscous', 'كسكس', '🍲', 4),
    ('jus', 'Jus & Smoothies', 'Juices & Smoothies', 'عصائر', '🥤', 5),
    ('infusions', 'Infusions & Tisanes', 'Herbal Teas', 'أعشاب', '🍵', 6),
    ('pains', 'Pains & Galettes', 'Breads & Flatbreads', 'خبز', '🫓', 7),
    ('epices', 'Épices & Condiments', 'Spices & Condiments', 'توابل', '🌶️', 8),
    ('accompagnements', 'Accompagnements', 'Side Dishes', 'مقبلات', '🥙', 9),
    ('conserves', 'Conserves & Séchage', 'Preserves & Drying', 'مربيات', '🫙', 10),
    ('plats', 'Plats Principaux', 'Main Courses', 'أطباق رئيسية', '🍛', 11),
    ('desserts', 'Desserts', 'Desserts', 'حلويات', '🍮', 12)
ON CONFLICT (slug) DO NOTHING;


-- 3. EXTEND RECIPES TABLE
-- Note: 'recipes' table already exists, we are altering it
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES recipe_categories(id);
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' 
    CHECK (status IN ('draft','pending','approved','rejected'));
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS moderation_note TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS gps_lat DOUBLE PRECISION;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS gps_lng DOUBLE PRECISION;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS background_history TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS known_benefits TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS prep_time_minutes INT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS servings INT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

-- 4. COMMENTS, LIKES, FOLLOWS, NOTIFICATIONS
-- Recipe comments
CREATE TABLE IF NOT EXISTS public.recipe_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    emoji TEXT,
    parent_id UUID REFERENCES recipe_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON public.recipe_comments FOR SELECT USING (true);
CREATE POLICY "Auth users create comments" ON public.recipe_comments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.recipe_comments FOR DELETE 
    USING (auth.uid() = user_id);

-- Recipe likes
CREATE TABLE IF NOT EXISTS public.recipe_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(recipe_id, user_id)
);
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read likes" ON public.recipe_likes FOR SELECT USING (true);
CREATE POLICY "Auth users manage own likes" ON public.recipe_likes FOR ALL USING (auth.uid() = user_id);

-- Profile follows
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Auth users manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'recipe_approved','recipe_rejected','recipe_liked','recipe_commented',
        'new_follower','system'
    )),
    title TEXT NOT NULL,
    body TEXT,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 5. TRIGGERS
-- Trigger function: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update recipe likes_count
CREATE OR REPLACE FUNCTION public.update_recipe_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.recipes SET likes_count = likes_count + 1 WHERE id = NEW.recipe_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.recipes SET likes_count = likes_count - 1 WHERE id = OLD.recipe_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_recipe_like ON recipe_likes;
CREATE TRIGGER on_recipe_like
    AFTER INSERT OR DELETE ON recipe_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_recipe_likes_count();

-- Trigger to update recipe comments_count
CREATE OR REPLACE FUNCTION public.update_recipe_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.recipes SET comments_count = comments_count + 1 WHERE id = NEW.recipe_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.recipes SET comments_count = comments_count - 1 WHERE id = OLD.recipe_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_recipe_comment ON recipe_comments;
CREATE TRIGGER on_recipe_comment
    AFTER INSERT OR DELETE ON recipe_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_recipe_comments_count();
