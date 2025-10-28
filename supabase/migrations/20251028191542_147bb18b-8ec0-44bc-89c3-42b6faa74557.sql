-- FASE 1: Agregar niveles de severidad a restricciones alimentarias

-- Agregar columna severity_level a profile_restrictions
ALTER TABLE public.profile_restrictions 
ADD COLUMN IF NOT EXISTS severity_level TEXT NOT NULL DEFAULT 'moderado' 
CHECK (severity_level IN ('leve', 'moderado', 'severo'));

COMMENT ON COLUMN public.profile_restrictions.severity_level IS 
'Nivel de severidad de la restricción: leve (tolera trazas/menciones indirectas), moderado (estándar), severo (rechaza cualquier mención)';

-- Agregar columna severity_level a profile_custom_restrictions
ALTER TABLE public.profile_custom_restrictions
ADD COLUMN IF NOT EXISTS severity_level TEXT NOT NULL DEFAULT 'moderado'
CHECK (severity_level IN ('leve', 'moderado', 'severo'));

COMMENT ON COLUMN public.profile_custom_restrictions.severity_level IS
'Nivel de severidad de la restricción personalizada';