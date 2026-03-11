-- =====================================================
-- Tabla de Permisos por Rol
-- =====================================================
-- Controla qué módulos puede acceder cada rol

-- Tabla de permisos de rol a módulo
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rol VARCHAR(50) NOT NULL,  -- teacher, student, admin, parent
  module VARCHAR(100) NOT NULL,  -- nombre del módulo (dashboard, courses, students, etc.)
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rol, module)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_role_permissions_rol ON role_permissions(rol);
CREATE INDEX idx_role_permissions_module ON role_permissions(module);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_role_permissions_updated_at();

-- =====================================================
-- Permisos por Defecto
-- =====================================================

-- ADMIN: Acceso total a todo
INSERT INTO role_permissions (rol, module, can_view, can_create, can_edit, can_delete) VALUES
('admin', 'dashboard', true, true, true, true),
('admin', 'courses', true, true, true, true),
('admin', 'students', true, true, true, true),
('admin', 'teachers', true, true, true, true),
('admin', 'enrollments', true, true, true, true),
('admin', 'grades', true, true, true, true),
('admin', 'attendance', true, true, true, true),
('admin', 'tasks', true, true, true, true),
('admin', 'resources', true, true, true, true),
('admin', 'messages', true, true, true, true),
('admin', 'users', true, true, true, true),
('admin', 'settings', true, true, true, true)
ON CONFLICT (rol, module) DO NOTHING;

-- TEACHER: Permisos para profesores
INSERT INTO role_permissions (rol, module, can_view, can_create, can_edit, can_delete) VALUES
('teacher', 'dashboard', true, false, false, false),
('teacher', 'courses', true, false, true, false),  -- Ver y editar cursos asignados
('teacher', 'students', true, false, false, false),  -- Solo ver estudiantes
('teacher', 'teachers', false, false, false, false),  -- No ver otros profesores
('teacher', 'enrollments', true, false, false, false),  -- Ver inscripciones
('teacher', 'grades', true, true, true, false),  -- Gestionar calificaciones
('teacher', 'attendance', true, true, true, false),  -- Gestionar asistencia
('teacher', 'tasks', true, true, true, true),  -- Gestionar tareas
('teacher', 'resources', true, true, true, false),  -- Subir recursos
('teacher', 'messages', true, true, true, false),  -- Mensajes
('teacher', 'users', false, false, false, false),  -- Sin acceso a usuarios
('teacher', 'settings', false, false, false, false)  -- Sin acceso a configuración
ON CONFLICT (rol, module) DO NOTHING;

-- STUDENT: Permisos para estudiantes
INSERT INTO role_permissions (rol, module, can_view, can_create, can_edit, can_delete) VALUES
('student', 'dashboard', true, false, false, false),
('student', 'courses', true, false, false, false),  -- Solo ver cursos inscritos
('student', 'students', false, false, false, false),  -- No ver otros estudiantes
('student', 'teachers', true, false, false, false),  -- Ver profesores
('student', 'enrollments', false, false, false, false),  -- Sin acceso a inscripciones
('student', 'grades', true, false, false, false),  -- Ver sus calificaciones
('student', 'attendance', true, false, false, false),  -- Ver su asistencia
('student', 'tasks', true, true, false, false),  -- Ver y entregar tareas
('student', 'resources', true, false, false, false),  -- Ver recursos
('student', 'messages', true, true, true, false),  -- Mensajes
('student', 'users', false, false, false, false),
('student', 'settings', false, false, false, false)
ON CONFLICT (rol, module) DO NOTHING;

-- PARENT: Permisos para padres/tutores
INSERT INTO role_permissions (rol, module, can_view, can_create, can_edit, can_delete) VALUES
('parent', 'dashboard', true, false, false, false),
('parent', 'courses', true, false, false, false),  -- Ver cursos de sus hijos
('parent', 'students', true, false, false, false),  -- Ver info de sus hijos
('parent', 'teachers', true, false, false, false),  -- Ver profesores
('parent', 'enrollments', false, false, false, false),
('parent', 'grades', true, false, false, false),  -- Ver calificaciones de sus hijos
('parent', 'attendance', true, false, false, false),  -- Ver asistencia
('parent', 'tasks', true, false, false, false),  -- Ver tareas
('parent', 'resources', true, false, false, false),  -- Ver recursos
('parent', 'messages', true, true, true, false),  -- Mensajes con profesores
('parent', 'users', false, false, false, false),
('parent', 'settings', false, false, false, false)
ON CONFLICT (rol, module) DO NOTHING;

-- =====================================================
-- Políticas RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver y modificar permisos
CREATE POLICY "Admins pueden ver todos los permisos"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );

CREATE POLICY "Admins pueden insertar permisos"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );

CREATE POLICY "Admins pueden actualizar permisos"
  ON role_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );

CREATE POLICY "Admins pueden eliminar permisos"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.rol = 'admin'
    )
  );

-- Usuarios pueden ver sus propios permisos
CREATE POLICY "Usuarios pueden ver permisos de su rol"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    rol IN (
      SELECT profiles.rol FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
