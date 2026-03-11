-- ============================================
-- CREACIÓN DE TABLAS PARA SISTEMA ACADÉMICO
-- Inscripciones, Asistencia, Tareas y Calificaciones
-- ============================================

-- ============================================
-- ELIMINAR TABLAS EXISTENTES (si existen)
-- Orden: de dependientes a independientes
-- ============================================
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS teacher_attendance CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;

-- ============================================
-- 1. TABLA DE INSCRIPCIONES (ENROLLMENTS)
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed', 'withdrawn')),
  final_grade DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(student_id, section_id)
);

COMMENT ON TABLE enrollments IS 'Inscripciones de estudiantes a secciones de cursos';
COMMENT ON COLUMN enrollments.student_id IS 'ID del estudiante inscrito';
COMMENT ON COLUMN enrollments.section_id IS 'ID de la sección del curso';
COMMENT ON COLUMN enrollments.enrollment_date IS 'Fecha de inscripción';
COMMENT ON COLUMN enrollments.status IS 'Estado de la inscripción';
COMMENT ON COLUMN enrollments.final_grade IS 'Calificación final del curso';

-- ============================================
-- 2. TABLA DE TAREAS/ASIGNACIONES (ASSIGNMENTS)
-- ============================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignment_type VARCHAR(50) NOT NULL DEFAULT 'homework' CHECK (assignment_type IN ('homework', 'exam', 'quiz', 'project', 'lab', 'participation')),
  max_points DECIMAL(5, 2) NOT NULL DEFAULT 100,
  due_date TIMESTAMPTZ,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE assignments IS 'Tareas y asignaciones de cursos';
COMMENT ON COLUMN assignments.section_id IS 'Sección a la que se asigna la tarea';
COMMENT ON COLUMN assignments.assignment_type IS 'Tipo de asignación';
COMMENT ON COLUMN assignments.max_points IS 'Puntos máximos posibles';
COMMENT ON COLUMN assignments.due_date IS 'Fecha límite de entrega';

-- ============================================
-- 3. TABLA DE CALIFICACIONES (GRADES)
-- ============================================
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL,
  max_score DECIMAL(5, 2) NOT NULL,
  percentage DECIMAL(5, 2) GENERATED ALWAYS AS ((score / NULLIF(max_score, 0)) * 100) STORED,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  graded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id, assignment_id)
);

COMMENT ON TABLE grades IS 'Calificaciones de estudiantes en asignaciones';
COMMENT ON COLUMN grades.enrollment_id IS 'Inscripción del estudiante';
COMMENT ON COLUMN grades.assignment_id IS 'Asignación calificada';
COMMENT ON COLUMN grades.score IS 'Puntos obtenidos';
COMMENT ON COLUMN grades.percentage IS 'Porcentaje calculado automáticamente';

-- ============================================
-- 4. TABLA DE ASISTENCIA DE ESTUDIANTES
-- ============================================
CREATE TABLE student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  UNIQUE(enrollment_id, attendance_date)
);

COMMENT ON TABLE student_attendance IS 'Registro de asistencia de estudiantes';
COMMENT ON COLUMN student_attendance.enrollment_id IS 'Inscripción del estudiante';
COMMENT ON COLUMN student_attendance.attendance_date IS 'Fecha de la clase';
COMMENT ON COLUMN student_attendance.status IS 'Estado de asistencia';

-- ============================================
-- 5. TABLA DE ASISTENCIA DE PROFESORES
-- ============================================
CREATE TABLE teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'sick_leave', 'vacation', 'permission')),
  hours_worked DECIMAL(4, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES profiles(id),
  UNIQUE(teacher_id, attendance_date)
);

COMMENT ON TABLE teacher_attendance IS 'Registro de asistencia de profesores';
COMMENT ON COLUMN teacher_attendance.teacher_id IS 'ID del profesor';
COMMENT ON COLUMN teacher_attendance.attendance_date IS 'Fecha de trabajo';
COMMENT ON COLUMN teacher_attendance.hours_worked IS 'Horas trabajadas ese día';

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

CREATE INDEX IF NOT EXISTS idx_assignments_section ON assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON grades(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment ON grades(assignment_id);

CREATE INDEX IF NOT EXISTS idx_student_attendance_enrollment ON student_attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON student_attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_teacher ON teacher_attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON teacher_attendance(attendance_date);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enrollments_select ON enrollments;
DROP POLICY IF EXISTS enrollments_insert ON enrollments;
DROP POLICY IF EXISTS enrollments_update ON enrollments;
DROP POLICY IF EXISTS enrollments_delete ON enrollments;

CREATE POLICY enrollments_select ON enrollments FOR SELECT TO authenticated USING(true);
CREATE POLICY enrollments_insert ON enrollments FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY enrollments_update ON enrollments FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY enrollments_delete ON enrollments FOR DELETE TO authenticated USING(true);

-- Assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assignments_select ON assignments;
DROP POLICY IF EXISTS assignments_insert ON assignments;
DROP POLICY IF EXISTS assignments_update ON assignments;
DROP POLICY IF EXISTS assignments_delete ON assignments;

CREATE POLICY assignments_select ON assignments FOR SELECT TO authenticated USING(true);
CREATE POLICY assignments_insert ON assignments FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY assignments_update ON assignments FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY assignments_delete ON assignments FOR DELETE TO authenticated USING(true);

-- Grades
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grades_select ON grades;
DROP POLICY IF EXISTS grades_insert ON grades;
DROP POLICY IF EXISTS grades_update ON grades;
DROP POLICY IF EXISTS grades_delete ON grades;

CREATE POLICY grades_select ON grades FOR SELECT TO authenticated USING(true);
CREATE POLICY grades_insert ON grades FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY grades_update ON grades FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY grades_delete ON grades FOR DELETE TO authenticated USING(true);

-- Student Attendance
ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_attendance_select ON student_attendance;
DROP POLICY IF EXISTS student_attendance_insert ON student_attendance;
DROP POLICY IF EXISTS student_attendance_update ON student_attendance;
DROP POLICY IF EXISTS student_attendance_delete ON student_attendance;

CREATE POLICY student_attendance_select ON student_attendance FOR SELECT TO authenticated USING(true);
CREATE POLICY student_attendance_insert ON student_attendance FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY student_attendance_update ON student_attendance FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY student_attendance_delete ON student_attendance FOR DELETE TO authenticated USING(true);

-- Teacher Attendance
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_attendance_select ON teacher_attendance;
DROP POLICY IF EXISTS teacher_attendance_insert ON teacher_attendance;
DROP POLICY IF EXISTS teacher_attendance_update ON teacher_attendance;
DROP POLICY IF EXISTS teacher_attendance_delete ON teacher_attendance;

CREATE POLICY teacher_attendance_select ON teacher_attendance FOR SELECT TO authenticated USING(true);
CREATE POLICY teacher_attendance_insert ON teacher_attendance FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY teacher_attendance_update ON teacher_attendance FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY teacher_attendance_delete ON teacher_attendance FOR DELETE TO authenticated USING(true);
