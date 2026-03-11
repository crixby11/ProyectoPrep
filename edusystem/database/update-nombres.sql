-- ============================================
-- ACTUALIZACIÓN: Campos de nombre completo
-- Ejecutar después del schema.sql original
-- ============================================

-- Agregar nuevos campos a la tabla profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS primer_nombre VARCHAR(100),
  ADD COLUMN IF NOT EXISTS segundo_nombre VARCHAR(100),
  ADD COLUMN IF NOT EXISTS apellido_paterno VARCHAR(100),
  ADD COLUMN IF NOT EXISTS apellido_materno VARCHAR(100);

-- Migrar datos existentes (si los hay)
UPDATE profiles 
SET primer_nombre = COALESCE(nombre, split_part(email, '@', 1))
WHERE primer_nombre IS NULL;

-- Ahora hacer opcional el campo 'nombre' antiguo (lo mantenemos para compatibilidad)
-- pero los campos nuevos son los que se usarán

-- Función helper para obtener nombre completo
CREATE OR REPLACE FUNCTION get_nombre_completo(p_id UUID)
RETURNS TEXT AS $$
DECLARE
  resultado TEXT;
BEGIN
  SELECT 
    TRIM(CONCAT_WS(' ', 
      primer_nombre, 
      segundo_nombre, 
      apellido_paterno, 
      apellido_materno
    ))
  INTO resultado
  FROM profiles
  WHERE id = p_id;
  
  RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Actualizar trigger para usar los nuevos campos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    rol, 
    primer_nombre,
    segundo_nombre,
    apellido_paterno,
    apellido_materno,
    nombre,
    activo
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'primer_nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'segundo_nombre',
    NEW.raw_user_meta_data->>'apellido_paterno',
    NEW.raw_user_meta_data->>'apellido_materno',
    TRIM(CONCAT_WS(' ',
      NEW.raw_user_meta_data->>'primer_nombre',
      NEW.raw_user_meta_data->>'segundo_nombre',
      NEW.raw_user_meta_data->>'apellido_paterno',
      NEW.raw_user_meta_data->>'apellido_materno'
    )),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para facilitar consultas con nombre completo
CREATE OR REPLACE VIEW profiles_with_full_name AS
SELECT 
  id,
  email,
  rol,
  primer_nombre,
  segundo_nombre,
  apellido_paterno,
  apellido_materno,
  TRIM(CONCAT_WS(' ', primer_nombre, segundo_nombre, apellido_paterno, apellido_materno)) as nombre_completo,
  telefono,
  foto_url,
  institucion_id,
  activo,
  metadata,
  created_at,
  updated_at
FROM profiles;
