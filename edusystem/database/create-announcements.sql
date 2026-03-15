-- ============================================
-- TABLA: announcements
-- Anuncios publicados por docentes en sus cursos
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  importante BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_announcements_section ON announcements(section_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher ON announcements(teacher_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);

-- Agregar trigger para updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF NOT EXISTS update_announcements_updated_at_trigger ON announcements;
CREATE TRIGGER update_announcements_updated_at_trigger BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_announcements_updated_at();
