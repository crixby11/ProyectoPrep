-- ============================================
-- ACTUALIZACIÓN: Mejoras a la tabla courses
-- Agregar campo de visibilidad, auto-código, auditoría y modalidad
-- ============================================

-- Agregar campos a courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20) DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'hibrido')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Agregar campos a course_sections (ubicación va por sección ya que cada sección puede tener diferente aula/enlace)
ALTER TABLE course_sections
  ADD COLUMN IF NOT EXISTS modalidad VARCHAR(20) DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'hibrido')),
  ADD COLUMN IF NOT EXISTS ubicacion TEXT;

-- Crear secuencia para códigos de curso
CREATE SEQUENCE IF NOT EXISTS course_code_seq START 1000;

-- Función para generar código de curso automáticamente
CREATE OR REPLACE FUNCTION generate_course_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_code TEXT;
BEGIN
  next_num := NEXTVAL('course_code_seq');
  new_code := 'CRS-' || LPAD(next_num::TEXT, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar código si no se proporciona
CREATE OR REPLACE FUNCTION set_course_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generate_course_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_course_code ON courses;
CREATE TRIGGER trigger_set_course_code
  BEFORE INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION set_course_code();

-- Trigger para actualizar updated_at en courses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_courses_updated_at ON courses;
CREATE TRIGGER trigger_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON COLUMN courses.visible IS 'Si el curso es visible para los estudiantes (oculto vs visible)';
COMMENT ON COLUMN courses.modalidad IS 'Modalidad del curso: presencial, virtual o híbrido';
COMMENT ON COLUMN courses.created_by IS 'ID del usuario que creó el curso';
COMMENT ON COLUMN courses.updated_by IS 'ID del usuario que actualizó el curso por última vez';
COMMENT ON COLUMN course_sections.modalidad IS 'Modalidad de la sección: presencial, virtual o híbrido';
COMMENT ON COLUMN course_sections.ubicacion IS 'Aula física o enlace virtual según la modalidad';

-- NOTA: created_at y updated_at ya existen por defecto en las tablas
-- NOTA: El campo cupos (cupo_maximo) ya existe en course_sections
