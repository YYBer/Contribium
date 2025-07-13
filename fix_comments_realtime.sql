-- Fix real-time subscription issues for bounty_comments table

-- Ensure the bounty_comments table has proper RLS policies for real-time
-- First, check if RLS is enabled
ALTER TABLE public.bounty_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all bounty comments" ON public.bounty_comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.bounty_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.bounty_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.bounty_comments;

-- Create comprehensive RLS policies for bounty_comments
CREATE POLICY "Users can view all bounty comments" ON public.bounty_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON public.bounty_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.bounty_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.bounty_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure proper grants for the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bounty_comments TO authenticated;
GRANT USAGE ON SEQUENCE bounty_comments_id_seq TO authenticated;

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounty_comments;

-- Verify indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_bounty_comments_bounty_id ON public.bounty_comments(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bounty_comments_user_id ON public.bounty_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_bounty_comments_created_at ON public.bounty_comments(created_at);

-- Grant necessary permissions for real-time subscriptions
GRANT ALL ON public.bounty_comments TO postgres, service_role;

-- If you're using supabase_realtime role
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
        GRANT SELECT ON public.bounty_comments TO supabase_realtime;
    END IF;
END
$$;