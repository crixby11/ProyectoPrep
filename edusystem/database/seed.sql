-- ============================================
-- DATOS DE PRUEBA PARA EDUSYSTEM
-- ============================================

-- Insertar institución de prueba
INSERT INTO instituciones (id, nombre, tipo, email, telefono)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Universidad Tecnológica', 'universidad', 'contacto@utech.edu', '555-0100'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Escuela Primaria El Saber', 'escuela', 'info@elsaber.edu', '555-0200');

-- NOTA: Los perfiles se crean automáticamente cuando un usuario se registra via Supabase Auth
-- Este es un ejemplo de cómo se vería:

/*
INSERT INTO profiles (id, email, rol, nombre, apellido, institucion_id)
VALUES 
  -- Administrador
  ('550e8400-e29b-41d4-a716-446655440010', 'admin@utech.edu', 'admin', 'Carlos', 'Administrador', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Maestros
  ('550e8400-e29b-41d4-a716-446655440011', 'prof.martinez@utech.edu', 'teacher', 'Ana', 'Martínez', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440012', 'prof.lopez@utech.edu', 'teacher', 'Luis', 'López', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Estudiantes
  ('550e8400-e29b-41d4-a716-446655440013', 'juan.perez@estudiante.utech.edu', 'student', 'Juan', 'Pérez', '550e8400-e29b-41d4-a716-446655440001'),
  ('550e8400-e29b-41d4-a716-446655440014', 'maria.garcia@estudiante.utech.edu', 'student', 'María', 'García', '550e8400-e29b-41d4-a716-446655440001'),
  
  -- Padre (solo para escuela)
  ('550e8400-e29b-41d4-a716-446655440015', 'padre.gonzalez@gmail.com', 'parent', 'Roberto', 'González', '550e8400-e29b-41d4-a716-446655440002');
*/

-- Insertar cursos de prueba
INSERT INTO courses (id, institucion_id, nombre, codigo, descripcion, creditos, nivel)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', 'Programación Web', 'CS-101', 'Introducción al desarrollo web', 4, 'Primer semestre'),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440001', 'Bases de Datos', 'CS-201', 'Fundamentos de bases de datos relacionales', 4, 'Segundo semestre'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440001', 'Matemáticas Discretas', 'MATH-101', 'Lógica y teoría de conjuntos', 3, 'Primer semestre');

-- Las secciones de cursos se crearán cuando haya maestros registrados
/*
INSERT INTO course_sections (id, course_id, teacher_id, nombre, periodo, cupo_maximo)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440011', 'Grupo A', '2026-A', 30),
  ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440012', 'Grupo B', '2026-A', 25);
*/

-- Para crear usuarios de prueba, usa la consola de Supabase Auth o el registro normal
-- Luego puedes ejecutar queries para asignarlos a students, enrollments, etc.
