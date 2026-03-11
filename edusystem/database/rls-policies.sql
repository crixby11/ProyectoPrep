-- ============================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Control de acceso por rol
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: profiles
-- ============================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su perfil"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Los admins pueden ver todos los perfiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- Los maestros pueden ver perfiles de sus estudiantes
CREATE POLICY "Los maestros pueden ver perfiles de estudiantes"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN course_sections cs ON cs.teacher_id = p.id
    JOIN enrollments e ON e.section_id = cs.id
    JOIN students s ON s.id = e.student_id
    WHERE p.id = auth.uid() AND profiles.id = s.profile_id
  )
);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su perfil"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- POLÍTICAS: students
-- ============================================

-- Los estudiantes pueden ver su propia info
CREATE POLICY "Los estudiantes pueden ver su info"
ON students FOR SELECT
USING (profile_id = auth.uid());

-- Los padres pueden ver info de sus hijos
CREATE POLICY "Los padres pueden ver info de hijos"
ON students FOR SELECT
USING (tutor_profile_id = auth.uid());

-- Los maestros pueden ver info de sus estudiantes
CREATE POLICY "Los maestros pueden ver estudiantes de sus cursos"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_sections cs
    JOIN enrollments e ON e.section_id = cs.id
    WHERE cs.teacher_id = auth.uid() AND e.student_id = students.id
  )
);

-- Los admins pueden ver todo
CREATE POLICY "Los admins pueden ver todos los estudiantes"
ON students FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- ============================================
-- POLÍTICAS: enrollments
-- ============================================

-- Los estudiantes pueden ver sus inscripciones
CREATE POLICY "Los estudiantes pueden ver sus inscripciones"
ON enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE id = enrollments.student_id AND profile_id = auth.uid()
  )
);

-- Los maestros pueden ver inscripciones de sus secciones
CREATE POLICY "Los maestros pueden ver inscripciones de sus secciones"
ON enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM course_sections
    WHERE id = enrollments.section_id AND teacher_id = auth.uid()
  )
);

-- ============================================
-- POLÍTICAS: grades
-- ============================================

-- Los estudiantes pueden ver sus calificaciones
CREATE POLICY "Los estudiantes pueden ver sus calificaciones"
ON grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE id = grades.student_id AND profile_id = auth.uid()
  )
);

-- Los padres pueden ver calificaciones de sus hijos
CREATE POLICY "Los padres pueden ver calificaciones de hijos"
ON grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE id = grades.student_id AND tutor_profile_id = auth.uid()
  )
);

-- Los maestros pueden ver y actualizar calificaciones de sus cursos
CREATE POLICY "Los maestros pueden gestionar calificaciones"
ON grades FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN course_sections cs ON cs.id = t.section_id
    WHERE t.id = grades.task_id AND cs.teacher_id = auth.uid()
  )
);

-- Los estudiantes pueden insertar entregas (sin calificación)
CREATE POLICY "Los estudiantes pueden subir tareas"
ON grades FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students
    WHERE id = grades.student_id AND profile_id = auth.uid()
  )
  AND grades.calificado = false
);

-- ============================================
-- POLÍTICAS: attendance
-- ============================================

-- Los estudiantes pueden ver su asistencia
CREATE POLICY "Los estudiantes pueden ver su asistencia"
ON attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE id = attendance.student_id AND profile_id = auth.uid()
  )
);

-- Los padres pueden ver asistencia de hijos
CREATE POLICY "Los padres pueden ver asistencia de hijos"
ON attendance FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE id = attendance.student_id AND tutor_profile_id = auth.uid()
  )
);

-- Los maestros pueden gestionar asistencia de sus secciones
CREATE POLICY "Los maestros pueden gestionar asistencia"
ON attendance FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM course_sections
    WHERE id = attendance.section_id AND teacher_id = auth.uid()
  )
);

-- ============================================
-- POLÍTICAS: notifications
-- ============================================

-- Los usuarios solo ven sus notificaciones
CREATE POLICY "Los usuarios ven sus notificaciones"
ON notifications FOR SELECT
USING (user_id = auth.uid());

-- Los usuarios pueden actualizar (marcar como leída)
CREATE POLICY "Los usuarios pueden actualizar sus notificaciones"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- POLÍTICAS: messages
-- ============================================

-- Los usuarios ven mensajes enviados o recibidos
CREATE POLICY "Los usuarios ven sus mensajes"
ON messages FOR SELECT
USING (
  remitente_id = auth.uid() OR destinatario_id = auth.uid()
);

-- Los usuarios pueden enviar mensajes
CREATE POLICY "Los usuarios pueden enviar mensajes"
ON messages FOR INSERT
WITH CHECK (remitente_id = auth.uid());

-- Los usuarios pueden actualizar (marcar como leído)
CREATE POLICY "Los usuarios pueden actualizar mensajes recibidos"
ON messages FOR UPDATE
USING (destinatario_id = auth.uid());

-- ============================================
-- POLÍTICAS: tasks
-- ============================================

-- Los maestros pueden gestionar tareas de sus secciones
CREATE POLICY "Los maestros pueden gestionar tareas"
ON tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM course_sections
    WHERE id = tasks.section_id AND teacher_id = auth.uid()
  )
);

-- Los estudiantes pueden ver tareas de sus secciones
CREATE POLICY "Los estudiantes pueden ver tareas"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.section_id = tasks.section_id AND s.profile_id = auth.uid()
  )
);

-- ============================================
-- POLÍTICAS: study_resources
-- ============================================

-- Los maestros pueden gestionar recursos de sus cursos
CREATE POLICY "Los maestros pueden gestionar recursos"
ON study_resources FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM course_sections cs
    WHERE cs.id = study_resources.section_id AND cs.teacher_id = auth.uid()
  )
  OR subido_por = auth.uid()
);

-- Los estudiantes pueden ver recursos de sus cursos
CREATE POLICY "Los estudiantes pueden ver recursos"
ON study_resources FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.section_id = study_resources.section_id AND s.profile_id = auth.uid()
  )
);
