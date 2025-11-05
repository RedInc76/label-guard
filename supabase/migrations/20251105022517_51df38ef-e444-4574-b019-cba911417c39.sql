-- Tabla para controlar límite de escaneos
CREATE TABLE scan_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scan_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consultas rápidas
CREATE INDEX idx_scan_rate_limit_user_window 
ON scan_rate_limit(user_id, window_start);

-- RLS: Denegar acceso público (solo service role)
ALTER TABLE scan_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all public access to scan_rate_limit"
ON scan_rate_limit
FOR ALL
USING (false);

-- Función de limpieza automática (eliminar registros >24h)
CREATE OR REPLACE FUNCTION cleanup_scan_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM scan_rate_limit
  WHERE window_start < now() - INTERVAL '24 hours';
END;
$$;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_scan_rate_limit_updated_at
BEFORE UPDATE ON scan_rate_limit
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();