-- ============================================
-- TRIGGER: Crear perfil automáticamente al registrarse
-- Se ejecuta cuando un nuevo usuario se registra via Supabase Auth
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, rol, nombre, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta después de insert en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCIÓN: Crear registro de student para estudiantes
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_student_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el rol es student, crear registro en tabla students
  IF NEW.rol = 'student' THEN
    INSERT INTO public.students (profile_id, institucion_id, matricula, estado)
    VALUES (
      NEW.id,
      NEW.institucion_id,
      'S-' || LPAD(NEXTVAL('student_matricula_seq')::TEXT, 6, '0'),
      'activo'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear secuencia para matrículas
CREATE SEQUENCE IF NOT EXISTS student_matricula_seq START 1;

-- Trigger para crear student cuando se crea un profile de estudiante
DROP TRIGGER IF EXISTS on_student_profile_created ON profiles;
CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.rol = 'student')
  EXECUTE FUNCTION public.handle_new_student_profile();

-- ============================================
-- FUNCIÓN: Notificar faltas al padre
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_parent_on_absence()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  student_name TEXT;
  course_name TEXT;
BEGIN
  -- Solo si es una falta (ausente)
  IF NEW.estado = 'ausente' THEN
    -- Obtener el ID del padre
    SELECT tutor_profile_id, profiles.nombre
    INTO parent_id, student_name
    FROM students
    JOIN profiles ON profiles.id = students.profile_id
    WHERE students.id = NEW.student_id;
    
    -- Si tiene padre asignado, crear notificación
    IF parent_id IS NOT NULL THEN
      -- Obtener nombre del curso
      SELECT courses.nombre INTO course_name
      FROM course_sections
      JOIN courses ON courses.id = course_sections.course_id
      WHERE course_sections.id = NEW.section_id;
      
      -- Crear notificación
      INSERT INTO notifications (user_id, tipo, titulo, mensaje, metadata)
      VALUES (
        parent_id,
        'falta',
        'Falta registrada',
        'Su hijo/a ' || student_name || ' ha faltado a ' || course_name || ' el ' || NEW.fecha::TEXT,
        jsonb_build_object(
          'student_id', NEW.student_id,
          'section_id', NEW.section_id,
          'fecha', NEW.fecha
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar al padre cuando hay una falta
DROP TRIGGER IF EXISTS on_absence_notify_parent ON attendance;
CREATE TRIGGER on_absence_notify_parent
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_parent_on_absence();

-- ============================================
-- FUNCIÓN: Notificar tarea pendiente
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  student_rec RECORD;
BEGIN
  -- Notificar a todos los estudiantes de la sección
  FOR student_rec IN
    SELECT s.profile_id, profiles.nombre
    FROM enrollments e
    JOIN students s ON s.id = e.student_id
    JOIN profiles ON profiles.id = s.profile_id
    WHERE e.section_id = NEW.section_id AND e.estado = 'activo'
  LOOP
    INSERT INTO notifications (user_id, tipo, titulo, mensaje, enlace, metadata)
    VALUES (
      student_rec.profile_id,
      'tarea_pendiente',
      'Nueva tarea asignada',
      'Tienes una nueva tarea: ' || NEW.titulo || '. Fecha límite: ' || NEW.fecha_limite::TEXT,
      '/tasks/' || NEW.id,
      jsonb_build_object('task_id', NEW.id, 'section_id', NEW.section_id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar cuando se asigna una tarea
DROP TRIGGER IF EXISTS on_task_assigned ON tasks;
CREATE TRIGGER on_task_assigned
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();
