-- Add 'confirmed' to the sessions status check constraint
ALTER TABLE public.sessions 
DROP CONSTRAINT sessions_status_check;

ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text]));