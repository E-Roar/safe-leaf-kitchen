CREATE POLICY allow_insert_events ON public.app_events
FOR INSERT TO anon, authenticated
WITH CHECK (true);
