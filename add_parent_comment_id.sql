-- Add parent_comment_id column to bounty_comments table to support threaded replies

ALTER TABLE public.bounty_comments 
ADD COLUMN parent_comment_id uuid REFERENCES public.bounty_comments(id) ON DELETE CASCADE;

-- Create index for better performance when querying replies
CREATE INDEX idx_bounty_comments_parent_id ON public.bounty_comments(parent_comment_id);