-- ============================================
-- REMOVER CONSTRAINT: Foreign Key de profiles.id a auth.users
-- Permite crear perfiles sin usuario autenticado
-- ============================================

-- Eliminar la foreign key constraint en profiles.id
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Comentario
COMMENT ON TABLE profiles IS 'Perfiles de usuarios - ahora permite perfiles sin autenticación';
