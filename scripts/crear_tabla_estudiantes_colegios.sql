-- ============================================
-- CREAR TABLA estudiantes_colegios
-- Thinking Skills Program v2
-- ============================================
-- Ejecuta este script en Supabase SQL Editor si obtienes
-- "Could not find the table 'public.estudiantes_colegios' in the schema cache".
-- Requiere que existan las tablas: colegios, usuarios.
-- ============================================

CREATE TABLE IF NOT EXISTS estudiantes_colegios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT estudiantes_colegios_estudiante_unique UNIQUE (estudiante_id)
);

CREATE INDEX IF NOT EXISTS idx_estudiantes_colegios_estudiante_id ON estudiantes_colegios(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_colegios_colegio_id ON estudiantes_colegios(colegio_id);

-- Recargar esquema para que PostgREST/API vea la tabla
NOTIFY pgrst, 'reload schema';
