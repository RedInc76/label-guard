-- Unificación semántica de analysis_type en v1.14.4
-- Paso 1: Eliminar constraint existente primero
ALTER TABLE scan_history 
DROP CONSTRAINT IF EXISTS scan_history_analysis_type_check;

-- Paso 2: Actualizar registros existentes
UPDATE scan_history 
SET analysis_type = 'openfood_api' 
WHERE analysis_type IN ('barcode', 'openfoodfacts');

-- Paso 3: Aplicar nuevo constraint con tipos válidos
ALTER TABLE scan_history 
ADD CONSTRAINT scan_history_analysis_type_check 
CHECK (analysis_type IN ('openfood_api', 'ai_cache', 'ai_photo'));