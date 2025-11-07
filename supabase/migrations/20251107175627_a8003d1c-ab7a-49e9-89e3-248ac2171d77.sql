-- Agregar campos de Nutri-Score y NOVA a ai_analyzed_products
ALTER TABLE ai_analyzed_products
ADD COLUMN IF NOT EXISTS nutriscore_grade TEXT,
ADD COLUMN IF NOT EXISTS nova_group INTEGER;

-- Agregar campos de nutriments (necesarios para cálculo)
ALTER TABLE ai_analyzed_products
ADD COLUMN IF NOT EXISTS energy_kj NUMERIC,
ADD COLUMN IF NOT EXISTS proteins NUMERIC,
ADD COLUMN IF NOT EXISTS carbohydrates NUMERIC,
ADD COLUMN IF NOT EXISTS sugars NUMERIC,
ADD COLUMN IF NOT EXISTS fats NUMERIC,
ADD COLUMN IF NOT EXISTS saturated_fats NUMERIC,
ADD COLUMN IF NOT EXISTS fiber NUMERIC,
ADD COLUMN IF NOT EXISTS sodium NUMERIC,
ADD COLUMN IF NOT EXISTS salt NUMERIC;

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_ai_products_nutriscore ON ai_analyzed_products(nutriscore_grade);
CREATE INDEX IF NOT EXISTS idx_ai_products_nova ON ai_analyzed_products(nova_group);

-- Agregar comentarios descriptivos
COMMENT ON COLUMN ai_analyzed_products.nutriscore_grade IS 'Nutri-Score calculado: A (mejor) a E (peor)';
COMMENT ON COLUMN ai_analyzed_products.nova_group IS 'NOVA classification: 1 (sin procesar) a 4 (ultra-procesado)';

-- Actualizar el producto específico 055653111252 con valores conocidos
UPDATE ai_analyzed_products
SET 
  nutriscore_grade = 'e',
  nova_group = 4
WHERE barcode = '055653111252'
  AND nutriscore_grade IS NULL;