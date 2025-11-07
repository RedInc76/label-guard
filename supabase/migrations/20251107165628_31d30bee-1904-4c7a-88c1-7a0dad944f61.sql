-- Agregar columna para URL de foto nutricional en tabla ai_analyzed_products
ALTER TABLE ai_analyzed_products 
ADD COLUMN IF NOT EXISTS nutrition_photo_url text;

COMMENT ON COLUMN ai_analyzed_products.nutrition_photo_url IS 'URL de la foto de la tabla nutricional (opcional)';