-- ============================================
-- TABLAS ADICIONALES: ANUNCIOS Y MÓDULOS DE CURSO
-- ============================================

-- ============================================
-- TABLA DE ANUNCIOS (ANNOUNCEMENTS)
-- ============================================
DROP TABLE IF EXISTS announcements CASCADE;

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE announcements IS 'Anuncios de cursos';
COMMENT ON COLUMN announcements.section_id IS 'Sección a la que pertenece el anuncio';
COMMENT ON COLUMN announcements.is_pinned IS 'Si el anuncio está fijado al inicio';

CREATE INDEX IF NOT EXISTS idx_announcements_section ON announcements(section_id);
CREATE INDEX IF NOT EXISTS idx_announcements_posted_at ON announcements(posted_at DESC);

-- RLS para announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_select ON announcements;
DROP POLICY IF EXISTS announcements_insert ON announcements;
DROP POLICY IF EXISTS announcements_update ON announcements;
DROP POLICY IF EXISTS announcements_delete ON announcements;

CREATE POLICY announcements_select ON announcements FOR SELECT TO authenticated USING(true);
CREATE POLICY announcements_insert ON announcements FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY announcements_update ON announcements FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY announcements_delete ON announcements FOR DELETE TO authenticated USING(true);

-- ============================================
-- TABLA DE MÓDULOS DE CURSO (COURSE_MODULES)
-- ============================================
DROP TABLE IF EXISTS course_module_items CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;

CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE course_modules IS 'Módulos o unidades temáticas del curso';
COMMENT ON COLUMN course_modules.order_index IS 'Orden de presentación del módulo';

CREATE INDEX IF NOT EXISTS idx_course_modules_section ON course_modules(section_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(order_index);

-- RLS para course_modules
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_modules_select ON course_modules;
DROP POLICY IF EXISTS course_modules_insert ON course_modules;
DROP POLICY IF EXISTS course_modules_update ON course_modules;
DROP POLICY IF EXISTS course_modules_delete ON course_modules;

CREATE POLICY course_modules_select ON course_modules FOR SELECT TO authenticated USING(true);
CREATE POLICY course_modules_insert ON course_modules FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY course_modules_update ON course_modules FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY course_modules_delete ON course_modules FOR DELETE TO authenticated USING(true);

-- ============================================
-- TABLA DE ITEMS DE MÓDULOS (COURSE_MODULE_ITEMS)
-- ============================================
CREATE TABLE course_module_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('file', 'link', 'assignment', 'page', 'quiz', 'discussion')),
  content TEXT,
  url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

COMMENT ON TABLE course_module_items IS 'Items o recursos dentro de cada módulo';
COMMENT ON COLUMN course_module_items.item_type IS 'Tipo de recurso (archivo, enlace, tarea, página, etc.)';

CREATE INDEX IF NOT EXISTS idx_course_module_items_module ON course_module_items(module_id);
CREATE INDEX IF NOT EXISTS idx_course_module_items_order ON course_module_items(order_index);

-- RLS para course_module_items
ALTER TABLE course_module_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_module_items_select ON course_module_items;
DROP POLICY IF EXISTS course_module_items_insert ON course_module_items;
DROP POLICY IF EXISTS course_module_items_update ON course_module_items;
DROP POLICY IF EXISTS course_module_items_delete ON course_module_items;

CREATE POLICY course_module_items_select ON course_module_items FOR SELECT TO authenticated USING(true);
CREATE POLICY course_module_items_insert ON course_module_items FOR INSERT TO authenticated WITH CHECK(true);
CREATE POLICY course_module_items_update ON course_module_items FOR UPDATE TO authenticated USING(true) WITH CHECK(true);
CREATE POLICY course_module_items_delete ON course_module_items FOR DELETE TO authenticated USING(true);
