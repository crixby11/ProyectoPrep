-- ============================================
-- TRIGGER: Crear perfil automáticamente cuando se registra un usuario
-- ============================================

-- Función que se ejecuta cuando se crea un nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar nuevo perfil con los datos del usuario
  INSERT INTO public.profiles (
    id,
    email,
    rol,
    primer_nombre,
    segundo_nombre,
    apellido_paterno,
    apellido_materno,
    activo,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'primer_nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'segundo_nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido_paterno', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido_materno', ''),
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger que se ejecuta después de insertar en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentario
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un nuevo usuario';
