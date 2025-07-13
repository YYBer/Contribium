-- Add comment likes functionality

-- Create comment_likes table
CREATE TABLE public.comment_likes (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    comment_id uuid NOT NULL REFERENCES public.bounty_comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure a user can only like a comment once
    UNIQUE(comment_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Add like_count column to bounty_comments for denormalized count
ALTER TABLE public.bounty_comments 
ADD COLUMN like_count integer DEFAULT 0 NOT NULL;

-- Create function to update like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.bounty_comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.bounty_comments 
        SET like_count = like_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update like count
CREATE TRIGGER trigger_comment_like_count
    AFTER INSERT OR DELETE ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_like_count();

-- Grant permissions
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for comment_likes
CREATE POLICY "Users can view all comment likes" ON public.comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id);