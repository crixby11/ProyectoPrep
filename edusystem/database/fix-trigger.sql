-- ============================================
-- FIX COMPLETO: Trigger + RLS para registro
-- Ejecuta esto en el SQL Editor de Supabase Dashboard
-- ============================================

-- 1. ELIMINAR POLÍTICAS RLS CONFLICTIVAS
DROP POLICY IF EXISTS "Los usuarios pueden ver su perfil" ON profiles;
DROP POLICY IF EXISTS "Los admins pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Los maestros pueden ver perfiles de estudiantes" ON profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;
DROP POLICY IF EXISTS "Permitir lectura pública de perfiles" ON profiles;
DROP POLICY IF EXISTS "Permitir actualización de perfiles" ON profiles;
DROP POLICY IF EXISTS "Permitir inserción de perfiles" ON profiles;
DROP POLICY IF EXISTS "Allow public read access" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 2. CREAR NUEVAS POLÍTICAS SIMPLES Y PERMISIVAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (true);

-- 3. ELIMINAR Y RECREAR TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. CREAR FUNCIÓN TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  primer_nombre TEXT;
  segundo_nombre TEXT;
  apellido_paterno TEXT;
  apellido_materno TEXT;
  nombre_completo TEXT;
  user_rol TEXT;
BEGIN
  -- Extraer datos de metadata
  primer_nombre := COALESCE(NEW.raw_user_meta_data->>'primer_nombre', '');
  segundo_nombre := COALESCE(NEW.raw_user_meta_data->>'segundo_nombre', '');
  apellido_paterno := COALESCE(NEW.raw_user_meta_data->>'apellido_paterno', '');
  apellido_materno := COALESCE(NEW.raw_user_meta_data->>'apellido_materno', '');
  user_rol := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Construir nombre completo
  nombre_completo := TRIM(CONCAT_WS(' ', primer_nombre, segundo_nombre, apellido_paterno, apellido_materno));
  IF nombre_completo = '' OR nombre_completo IS NULL THEN
    nombre_completo := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Insertar en profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    rol, 
    nombre, 
    primer_nombre, 
    segundo_nombre, 
    apellido_paterno, 
    apellido_materno, 
    activo
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_rol,
    nombre_completo,
    primer_nombre,
    segundo_nombre,
    apellido_paterno,
    apellido_materno,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. CREAR TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
