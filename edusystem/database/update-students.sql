-- ============================================
-- ACTUALIZACIÓN: Mejoras a la tabla profiles para estudiantes
-- Agregar campos personales, académicos, familiares y médicos
-- ============================================

-- Agregar campos académicos de estudiantes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS matricula VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS nivel_educativo VARCHAR(50) CHECK (nivel_educativo IN ('preescolar', 'primaria', 'secundaria', 'preparatoria', 'universidad')),
  ADD COLUMN IF NOT EXISTS grado VARCHAR(20),
  ADD COLUMN IF NOT EXISTS seccion VARCHAR(10),
  ADD COLUMN IF NOT EXISTS fecha_ingreso DATE,
  ADD COLUMN IF NOT EXISTS promedio_general DECIMAL(4, 2);

-- Agregar campos de información familiar
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nombre_tutor VARCHAR(200),
  ADD COLUMN IF NOT EXISTS telefono_tutor VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email_tutor VARCHAR(255),
  ADD COLUMN IF NOT EXISTS relacion_tutor VARCHAR(50) CHECK (relacion_tutor IN ('padre', 'madre', 'abuelo', 'abuela', 'tio', 'tia', 'hermano', 'hermana', 'tutor_legal', 'otro'));

-- Agregar campos médicos
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tipo_sangre VARCHAR(5) CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  ADD COLUMN IF NOT EXISTS alergias TEXT,
  ADD COLUMN IF NOT EXISTS condiciones_medicas TEXT,
  ADD COLUMN IF NOT EXISTS contacto_emergencia VARCHAR(200),
  ADD COLUMN IF NOT EXISTS telefono_emergencia VARCHAR(20);

-- Comentarios para campos de estudiantes
COMMENT ON COLUMN profiles.matricula IS 'Número de matrícula único del estudiante';
COMMENT ON COLUMN profiles.nivel_educativo IS 'Nivel educativo del estudiante';
COMMENT ON COLUMN profiles.grado IS 'Grado o año que cursa el estudiante';
COMMENT ON COLUMN profiles.seccion IS 'Sección o grupo asignado';
COMMENT ON COLUMN profiles.fecha_ingreso IS 'Fecha de ingreso a la institución';
COMMENT ON COLUMN profiles.promedio_general IS 'Promedio general acumulado del estudiante';
COMMENT ON COLUMN profiles.nombre_tutor IS 'Nombre completo del padre/madre/tutor';
COMMENT ON COLUMN profiles.telefono_tutor IS 'Teléfono de contacto del tutor';
COMMENT ON COLUMN profiles.email_tutor IS 'Email de contacto del tutor';
COMMENT ON COLUMN profiles.relacion_tutor IS 'Relación del tutor con el estudiante';
COMMENT ON COLUMN profiles.tipo_sangre IS 'Tipo de sangre del estudiante';
COMMENT ON COLUMN profiles.alergias IS 'Alergias conocidas del estudiante';
COMMENT ON COLUMN profiles.condiciones_medicas IS 'Condiciones médicas o enfermedades crónicas';
COMMENT ON COLUMN profiles.contacto_emergencia IS 'Nombre del contacto de emergencia';
COMMENT ON COLUMN profiles.telefono_emergencia IS 'Teléfono del contacto de emergencia';
