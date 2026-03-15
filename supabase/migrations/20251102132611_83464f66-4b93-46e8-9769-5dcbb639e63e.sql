-- Add cancellation and refund fields to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'completed', 'failed'));

-- Add payment tracking to sessions
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded'));

-- Create feedback table for session reviews
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(session_id, reviewer_id)
);

-- Enable RLS on feedback table
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback
CREATE POLICY "Users can view feedback for their sessions"
  ON public.session_feedback FOR SELECT
  USING (
    auth.uid() IN (
      SELECT mentee_id FROM public.sessions WHERE id = session_id
      UNION
      SELECT mentor_id FROM public.sessions WHERE id = session_id
    )
  );

CREATE POLICY "Users can create feedback for completed sessions"
  ON public.session_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE id = session_id 
      AND status = 'completed'
      AND (mentee_id = auth.uid() OR mentor_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own feedback"
  ON public.session_feedback FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Add unavailable dates for mentor availability management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS unavailable_dates jsonb DEFAULT '[]'::jsonb;

-- Add trigger for feedback updated_at
CREATE TRIGGER update_session_feedback_updated_at
  BEFORE UPDATE ON public.session_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON public.session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_reviewee_id ON public.session_feedback(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON public.sessions(mentor_id);