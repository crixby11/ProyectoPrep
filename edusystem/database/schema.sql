-- ============================================
-- EDUSYSTEM - ESQUEMA DE BASE DE DATOS
-- Supabase PostgreSQL
-- ============================================

-- EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: instituciones
-- Almacena info de escuelas y universidades
-- ============================================
CREATE TABLE instituciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('escuela', 'universidad')),
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: profiles
-- Extiende auth.users con datos del sistema
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('teacher', 'student', 'parent', 'admin')),
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  telefono VARCHAR(20),
  foto_url TEXT,
  institucion_id UUID REFERENCES instituciones(id),
  activo BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: students
-- Datos específicos de estudiantes
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institucion_id UUID REFERENCES instituciones(id),
  matricula VARCHAR(50) UNIQUE NOT NULL,
  fecha_nacimiento DATE,
  grado VARCHAR(50),
  seccion VARCHAR(50),
  tutor_profile_id UUID REFERENCES profiles(id), -- Relación con padre
  direccion TEXT,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'graduado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: courses
-- Materias/Cursos ofrecidos
-- ============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institucion_id UUID REFERENCES instituciones(id),
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) UNIQUE,
  descripcion TEXT,
  creditos INTEGER DEFAULT 0,
  nivel VARCHAR(50), -- Ej: "Primer semestre", "Tercer año"
  departamento VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: course_sections
-- Secciones de cada curso (grupos)
-- ============================================
CREATE TABLE course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id), -- Docente asignado
  nombre VARCHAR(100) NOT NULL, -- Ej: "Grupo A", "Sección 1"
  periodo VARCHAR(50), -- Ej: "2026-A", "Primavera 2026"
  cupo_maximo INTEGER DEFAULT 30,
  aula VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: schedules
-- Horarios de cada sección
-- ============================================
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: enrollments
-- Inscripciones de estudiantes a secciones
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  fecha_inscripcion DATE DEFAULT CURRENT_DATE,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'retirado', 'completado')),
  calificacion_final DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, section_id)
);

-- ============================================
-- TABLA: tasks (Tareas/Actividades)
-- Tareas asignadas por el docente
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) CHECK (tipo IN ('tarea', 'examen', 'proyecto', 'participacion')),
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_limite TIMESTAMP WITH TIME ZONE,
  puntos_max DECIMAL(5,2) DEFAULT 100,
  archivo_url TEXT,
  instrucciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: grades
-- Calificaciones de tareas/actividades
-- ============================================
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id),
  puntos_obtenidos DECIMAL(5,2),
  comentarios TEXT,
  archivo_entrega_url TEXT,
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  calificado BOOLEAN DEFAULT false,
  calificado_por UUID REFERENCES profiles(id),
  fecha_calificacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

-- ============================================
-- TABLA: attendance
-- Registro de asistencia
-- ============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('presente', 'ausente', 'tarde', 'justificado')),
  comentarios TEXT,
  registrado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(section_id, student_id, fecha)
);

-- ============================================
-- TABLA: notifications
-- Notificaciones del sistema
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'falta', 'tarea_pendiente', 'calificacion', 'mensaje'
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  leida BOOLEAN DEFAULT false,
  enlace TEXT, -- URL a la que redirige la notificación
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: messages
-- Mensajería interna
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  remitente_id UUID REFERENCES profiles(id),
  destinatario_id UUID REFERENCES profiles(id),
  asunto VARCHAR(255),
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  fecha_lectura TIMESTAMP WITH TIME ZONE,
  parent_message_id UUID REFERENCES messages(id), -- Para hilos de conversación
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: study_resources
-- Recursos de estudio por curso
-- ============================================
CREATE TABLE study_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) CHECK (tipo IN ('documento', 'video', 'enlace', 'presentacion')),
  url TEXT,
  archivo_url TEXT,
  subido_por UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: study_recommendations
-- Recomendaciones personalizadas
-- ============================================
CREATE TABLE study_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  recomendacion TEXT NOT NULL,
  prioridad VARCHAR(20) CHECK (prioridad IN ('alta', 'media', 'baja')),
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================
CREATE INDEX idx_profiles_institucion ON profiles(institucion_id);
CREATE INDEX idx_profiles_rol ON profiles(rol);
CREATE INDEX idx_students_institucion ON students(institucion_id);
CREATE INDEX idx_students_tutor ON students(tutor_profile_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_section ON enrollments(section_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_task ON grades(task_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_fecha ON attendance(fecha);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_leida ON notifications(leida);
CREATE INDEX idx_messages_destinatario ON messages(destinatario_id);
CREATE INDEX idx_messages_remitente ON messages(remitente_id);

-- ============================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_instituciones_updated_at BEFORE UPDATE ON instituciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
