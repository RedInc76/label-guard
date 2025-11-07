-- Agregar columna gender a user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('hombre', 'mujer') OR gender IS NULL);

COMMENT ON COLUMN user_profiles.gender IS 'Sexo del usuario (hombre/mujer), opcional';