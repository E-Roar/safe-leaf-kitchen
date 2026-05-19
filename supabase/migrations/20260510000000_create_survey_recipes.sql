-- Create the survey recipes table
CREATE TABLE IF NOT EXISTS public.survey_recipes (
    id SERIAL PRIMARY KEY,
    respondent TEXT NOT NULL,
    species TEXT NOT NULL,
    preparation_method TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.survey_recipes ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON public.survey_recipes
    FOR SELECT USING (true);

-- Allow authenticated users to insert (or you can use service_role to bypass)
CREATE POLICY "Auth users insert" ON public.survey_recipes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
