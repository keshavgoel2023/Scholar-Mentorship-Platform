-- Create user roles enum and table for security
CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'mentee');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add mentor availability and preferences
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{"monday": [], "tuesday": [], "wednesday": [], "thursday": [], "friday": [], "saturday": [], "sunday": []}',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add unread count and typing indicators to messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread 
  ON public.messages(receiver_id) WHERE read = false;

-- Update handle_new_user to automatically assign role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from metadata or default to mentee
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'mentee');
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    user_role
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  RETURN NEW;
END;
$$;

-- Add function to check mentor availability and prevent double booking
CREATE OR REPLACE FUNCTION public.check_mentor_availability(
  p_mentor_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  end_time TIMESTAMP WITH TIME ZONE;
  conflicting_sessions INTEGER;
BEGIN
  end_time := p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Check for overlapping sessions
  SELECT COUNT(*) INTO conflicting_sessions
  FROM public.sessions
  WHERE mentor_id = p_mentor_id
    AND status IN ('scheduled', 'confirmed')
    AND (
      (scheduled_at <= p_scheduled_at AND scheduled_at + (duration_minutes || ' minutes')::INTERVAL > p_scheduled_at)
      OR
      (scheduled_at < end_time AND scheduled_at + (duration_minutes || ' minutes')::INTERVAL >= end_time)
      OR
      (scheduled_at >= p_scheduled_at AND scheduled_at + (duration_minutes || ' minutes')::INTERVAL <= end_time)
    );
  
  RETURN conflicting_sessions = 0;
END;
$$;