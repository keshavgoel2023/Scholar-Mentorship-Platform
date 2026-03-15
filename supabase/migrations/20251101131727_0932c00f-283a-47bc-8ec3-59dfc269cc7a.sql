-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'mentee');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure user_roles table has correct structure
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;

-- Recreate the handle_new_user function to ensure it works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Insert user role with proper enum casting
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::public.app_role);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();