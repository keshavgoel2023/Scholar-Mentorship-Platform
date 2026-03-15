-- Add mentor-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_mentor_profile_complete BOOLEAN DEFAULT FALSE;

-- Create index for faster mentor queries
CREATE INDEX IF NOT EXISTS idx_profiles_mentor_complete ON public.profiles(role, is_mentor_profile_complete) WHERE role = 'mentor';