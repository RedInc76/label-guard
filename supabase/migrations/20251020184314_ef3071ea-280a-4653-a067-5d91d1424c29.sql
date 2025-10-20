-- Fix search_path for check_profile_limit function
CREATE OR REPLACE FUNCTION public.check_profile_limit()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 profiles per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;