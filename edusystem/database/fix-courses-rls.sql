-- ============================================
-- ARREGLAR POLÍTICAS RLS: Tablas de cursos
-- Permitir operaciones CRUD para usuarios autenticados
-- ============================================

-- ========================================
-- TABLA: courses
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS courses_select_policy ON courses;
DROP POLICY IF EXISTS courses_insert_policy ON courses;
DROP POLICY IF EXISTS courses_update_policy ON courses;
DROP POLICY IF EXISTS courses_delete_policy ON courses;

-- Crear políticas simples sin recursión
CREATE POLICY courses_select_policy ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY courses_insert_policy ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY courses_update_policy ON courses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY courses_delete_policy ON courses
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- TABLA: course_sections
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS course_sections_select_policy ON course_sections;
DROP POLICY IF EXISTS course_sections_insert_policy ON course_sections;
DROP POLICY IF EXISTS course_sections_update_policy ON course_sections;
DROP POLICY IF EXISTS course_sections_delete_policy ON course_sections;

-- Crear políticas simples sin recursión
CREATE POLICY course_sections_select_policy ON course_sections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY course_sections_insert_policy ON course_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY course_sections_update_policy ON course_sections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY course_sections_delete_policy ON course_sections
  FOR DELETE
  TO authenticated
  USING (true);

-- ========================================
-- TABLA: schedules
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS schedules_select_policy ON schedules;
DROP POLICY IF EXISTS schedules_insert_policy ON schedules;
DROP POLICY IF EXISTS schedules_update_policy ON schedules;
DROP POLICY IF EXISTS schedules_delete_policy ON schedules;

-- Crear políticas simples sin recursión
CREATE POLICY schedules_select_policy ON schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY schedules_insert_policy ON schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY schedules_update_policy ON schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY schedules_delete_policy ON schedules
  FOR DELETE
  TO authenticated
  USING (true);

-- Comentarios
COMMENT ON TABLE courses IS 'Cursos académicos con políticas RLS simplificadas';
COMMENT ON TABLE course_sections IS 'Secciones de cursos con políticas RLS simplificadas';
COMMENT ON TABLE schedules IS 'Horarios de secciones con políticas RLS simplificadas';
