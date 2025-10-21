-- Agregar columnas de geolocalización a scan_history
ALTER TABLE scan_history 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Agregar índice para búsquedas por ubicación (opcional, para features futuras)
CREATE INDEX idx_scan_history_location ON scan_history(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN scan_history.latitude IS 'Latitud GPS donde se escaneó el producto';
COMMENT ON COLUMN scan_history.longitude IS 'Longitud GPS donde se escaneó el producto';