-- Fix de seguridad crítico: Denegar acceso público a tabla otp_codes
-- La tabla contiene códigos OTP sensibles que solo deben ser accesibles por el sistema

-- Eliminar la política existente que solo permite service_role
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON public.otp_codes;

-- Crear políticas explícitas que NIEGAN todo acceso público
-- Solo el service_role (backend) puede interactuar con esta tabla

CREATE POLICY "Deny all public SELECT on otp_codes"
ON public.otp_codes
FOR SELECT
USING (false);

CREATE POLICY "Deny all public INSERT on otp_codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny all public UPDATE on otp_codes"
ON public.otp_codes
FOR UPDATE
USING (false);

CREATE POLICY "Deny all public DELETE on otp_codes"
ON public.otp_codes
FOR DELETE
USING (false);

-- Nota: El service_role bypassa RLS, por lo que los edge functions
-- usando SUPABASE_SERVICE_ROLE_KEY pueden seguir accediendo a la tabla