-- ============================================
-- ACTUALIZACIÓN: Mejoras a la tabla profiles para maestros
-- Agregar campos personales, académicos y laborales
-- ============================================

-- Agregar campos personales
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dni VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
  ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Agregar campos académicos
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS titulo_academico VARCHAR(100),
  ADD COLUMN IF NOT EXISTS especialidad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS grado_academico VARCHAR(50) CHECK (grado_academico IN ('licenciatura', 'maestria', 'doctorado', 'posdoctorado'));

-- Agregar campos laborales
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS anios_experiencia INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(50) CHECK (tipo_contrato IN ('tiempo_completo', 'medio_tiempo', 'por_horas', 'temporal')),
  ADD COLUMN IF NOT EXISTS fecha_contratacion DATE,
  ADD COLUMN IF NOT EXISTS salario DECIMAL(10, 2);

-- Agregar campos de auditoría (si no existen)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Trigger para actualizar updated_at en profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Comentarios
COMMENT ON COLUMN profiles.dni IS 'Documento Nacional de Identidad o identificación oficial';
COMMENT ON COLUMN profiles.fecha_nacimiento IS 'Fecha de nacimiento del maestro';
COMMENT ON COLUMN profiles.genero IS 'Género del maestro';
COMMENT ON COLUMN profiles.direccion IS 'Dirección de residencia del maestro';
COMMENT ON COLUMN profiles.titulo_academico IS 'Título académico principal (ej: Ingeniero en Sistemas)';
COMMENT ON COLUMN profiles.especialidad IS 'Especialidad o área de expertise (ej: Desarrollo Web)';
COMMENT ON COLUMN profiles.grado_academico IS 'Grado académico más alto obtenido';
COMMENT ON COLUMN profiles.anios_experiencia IS 'Años de experiencia docente';
COMMENT ON COLUMN profiles.departamento IS 'Departamento académico al que pertenece';
COMMENT ON COLUMN profiles.tipo_contrato IS 'Tipo de contratación del maestro';
COMMENT ON COLUMN profiles.fecha_contratacion IS 'Fecha de contratación en la institución';
COMMENT ON COLUMN profiles.salario IS 'Salario mensual del maestro';
COMMENT ON COLUMN profiles.created_by IS 'ID del usuario que creó el perfil';
COMMENT ON COLUMN profiles.updated_by IS 'ID del usuario que actualizó el perfil por última vez';
