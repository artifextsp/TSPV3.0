-- ============================================
-- CREAR TABLA DE RELACIÓN DOCENTES-COLEGIOS
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script crea la tabla que relaciona docentes con colegios.
-- Un docente puede estar asociado a un colegio específico.
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Los docentes se pueden asociar a colegios desde el dashboard administrativo
-- ============================================

-- ============================================
-- PASO 1: CREAR TABLA DOCENTES_COLEGIOS
-- ============================================

CREATE TABLE IF NOT EXISTS docentes_colegios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Un docente solo puede estar asociado a un colegio a la vez
  CONSTRAINT docentes_colegios_docente_unique UNIQUE (docente_id)
);

-- ============================================
-- PASO 2: CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_docentes_colegios_docente_id ON docentes_colegios(docente_id);
CREATE INDEX IF NOT EXISTS idx_docentes_colegios_colegio_id ON docentes_colegios(colegio_id);

-- ============================================
-- PASO 3: CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_docentes_colegios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_docentes_colegios_updated_at ON docentes_colegios;
CREATE TRIGGER update_docentes_colegios_updated_at
  BEFORE UPDATE ON docentes_colegios
  FOR EACH ROW
  EXECUTE FUNCTION update_docentes_colegios_updated_at();

-- ============================================
-- PASO 4: CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE docentes_colegios ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (la seguridad se maneja en el frontend)
DROP POLICY IF EXISTS "Permitir acceso completo a docentes_colegios" ON docentes_colegios;
DROP POLICY IF EXISTS "Permitir crear docentes_colegios" ON docentes_colegios;
DROP POLICY IF EXISTS "Permitir actualizar docentes_colegios" ON docentes_colegios;
DROP POLICY IF EXISTS "Permitir eliminar docentes_colegios" ON docentes_colegios;

CREATE POLICY "Permitir acceso completo a docentes_colegios"
ON docentes_colegios FOR SELECT
USING (true);

CREATE POLICY "Permitir crear docentes_colegios"
ON docentes_colegios FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualizar docentes_colegios"
ON docentes_colegios FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir eliminar docentes_colegios"
ON docentes_colegios FOR DELETE
USING (true);

-- ============================================
-- PASO 5: VERIFICACIÓN
-- ============================================

-- Verificar que la tabla se creó correctamente
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'docentes_colegios';

-- Verificar índices creados
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename = 'docentes_colegios';

-- Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'docentes_colegios';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- ⚠️ IMPORTANTE: 
-- - Un docente solo puede estar asociado a UN colegio a la vez
-- - Si necesitas que un docente esté en múltiples colegios, 
--   elimina el constraint UNIQUE y ajusta la lógica del frontend
-- 
-- La seguridad se maneja en el frontend del dashboard administrativo.
-- Solo los administradores pueden asociar docentes a colegios.
