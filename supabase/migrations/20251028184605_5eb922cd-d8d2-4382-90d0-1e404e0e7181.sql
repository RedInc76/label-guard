-- Crear función para obtener usuarios con emails (solo admins)
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email
  FROM auth.users au
$$;

-- Comentario explicativo
COMMENT ON FUNCTION public.get_users_for_admin() IS 'Returns user emails for admin log filtering. Only callable by admins via RLS.';
