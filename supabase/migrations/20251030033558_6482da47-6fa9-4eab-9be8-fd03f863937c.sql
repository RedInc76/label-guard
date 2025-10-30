-- Eliminar scans sin ingredientes suficientes
-- Esto elimina historiales con ingredientes NULL, vacíos o muy cortos (< 30 caracteres)
-- que generan análisis incorrectos y no son consistentes con la lógica actual
DELETE FROM scan_history
WHERE ingredients_text IS NULL 
   OR ingredients_text = '' 
   OR LENGTH(ingredients_text) < 30;