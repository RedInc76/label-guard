-- 1. Crear tabla para OTP codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_otp_email_code ON public.otp_codes(email, code);
CREATE INDEX idx_otp_expires ON public.otp_codes(expires_at);

-- RLS para OTP codes
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Solo el sistema puede insertar OTP (se manejará desde edge function)
CREATE POLICY "Service role can manage OTP codes"
ON public.otp_codes
FOR ALL
USING (auth.role() = 'service_role');

-- 2. Crear tabla para usage analytics
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ai_analysis', 'cache_hit', 'openfoodfacts')),
  product_name TEXT NOT NULL,
  barcode TEXT,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_event_type ON public.usage_analytics(event_type);
CREATE INDEX idx_usage_analytics_created_at ON public.usage_analytics(created_at DESC);
CREATE INDEX idx_analytics_aggregation ON public.usage_analytics(event_type, created_at DESC);

-- RLS para usage_analytics
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own analytics"
ON public.usage_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics"
ON public.usage_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
ON public.usage_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. FIX CRÍTICO DE SEGURIDAD: Restringir acceso a ai_analyzed_products
-- Eliminar política insegura que permite a todos leer todos los productos
DROP POLICY IF EXISTS "All users can read cached products" ON public.ai_analyzed_products;

-- Crear nueva política restrictiva: usuarios solo ven sus propios productos
CREATE POLICY "Users can read their own analyzed products"
ON public.ai_analyzed_products
FOR SELECT
USING (auth.uid() = user_id);

-- Admins pueden ver todo
CREATE POLICY "Admins can read all analyzed products"
ON public.ai_analyzed_products
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));