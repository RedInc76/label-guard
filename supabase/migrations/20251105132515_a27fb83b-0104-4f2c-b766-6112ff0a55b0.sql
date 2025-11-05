-- Eliminar el constraint antiguo
ALTER TABLE scan_history 
DROP CONSTRAINT IF EXISTS scan_history_analysis_type_check;

-- Crear el nuevo constraint que incluye 'openfoodfacts'
ALTER TABLE scan_history 
ADD CONSTRAINT scan_history_analysis_type_check 
CHECK (analysis_type IN ('barcode', 'ai_photo', 'ai_cache', 'openfoodfacts'));