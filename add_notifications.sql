-- Add notifications system for submission status changes

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type varchar(50) NOT NULL CHECK (type IN ('submission_accepted', 'submission_rejected', 'bounty_completed', 'comment_reply', 'general')),
    title varchar(255) NOT NULL,
    message text NOT NULL,
    related_bounty_id uuid REFERENCES public.bounties(id) ON DELETE CASCADE,
    related_submission_id uuid REFERENCES public.bounty_submissions(id) ON DELETE CASCADE,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);

-- Add indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Create function to create notification for submission status change
CREATE OR REPLACE FUNCTION create_submission_notification()
RETURNS TRIGGER AS $$
DECLARE
    bounty_title TEXT;
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT;
BEGIN
    -- Only create notification when status changes to 'accepted' or 'rejected'
    IF NEW.status IN ('accepted', 'rejected') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
        -- Get bounty title
        SELECT title INTO bounty_title 
        FROM public.bounties 
        WHERE id = NEW.bounty_id;
        
        -- Set notification content based on status
        IF NEW.status = 'accepted' THEN
            notification_type := 'submission_accepted';
            notification_title := '🎉 Submission Accepted!';
            notification_message := 'Congratulations! Your submission "' || NEW.title || '" for bounty "' || bounty_title || '" has been accepted.';
        ELSE
            notification_type := 'submission_rejected';
            notification_title := '📝 Submission Update';
            notification_message := 'Your submission "' || NEW.title || '" for bounty "' || bounty_title || '" was not accepted this time.';
            
            -- Add feedback if available
            IF NEW.feedback IS NOT NULL AND NEW.feedback != '' THEN
                notification_message := notification_message || ' Feedback: ' || NEW.feedback;
            END IF;
        END IF;
        
        -- Insert notification
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            related_bounty_id,
            related_submission_id
        ) VALUES (
            NEW.user_id,
            notification_type,
            notification_title,
            notification_message,
            NEW.bounty_id,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for submission status changes
CREATE TRIGGER trigger_submission_notification
    AFTER UPDATE ON public.bounty_submissions
    FOR EACH ROW
    EXECUTE FUNCTION create_submission_notification();

-- Grant permissions
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow system to insert notifications (no user check needed as it's done via trigger)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = now() 
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = now() 
    WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::integer 
        FROM public.notifications 
        WHERE user_id = auth.uid() AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;