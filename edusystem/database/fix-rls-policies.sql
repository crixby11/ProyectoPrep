-- ============================================
-- SOLUCIÓN: Arreglar políticas RLS para evitar recursión infinita
-- Este problema ocurre cuando las políticas hacen referencia a la misma tabla
-- ============================================

-- Primero, eliminar TODAS las políticas existentes en profiles (antiguas y nuevas)
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

-- Crear políticas simples y sin recursión
-- IMPORTANTE: Estas políticas NO hacen JOIN a la misma tabla

-- 1. Lectura: Todos los usuarios autenticados pueden leer todos los perfiles
CREATE POLICY "profiles_select_policy" 
ON profiles FOR SELECT 
TO authenticated
USING (true);

-- 2. Inserción: Usuarios autenticados pueden crear perfiles
CREATE POLICY "profiles_insert_policy" 
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 3. Actualización: Usuarios autenticados pueden actualizar perfiles
CREATE POLICY "profiles_update_policy" 
ON profiles FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Eliminación: Usuarios autenticados pueden eliminar perfiles
CREATE POLICY "profiles_delete_policy" 
ON profiles FOR DELETE 
TO authenticated
USING (true);

-- Verificar que RLS esté habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTA: Estas políticas son muy permisivas
-- En producción, deberías restringir según roles:
-- USING (auth.uid() = user_id OR rol = 'admin')
-- ============================================
