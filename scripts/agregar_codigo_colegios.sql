-- ============================================
-- AÑADIR COLUMNA codigo A LA TABLA colegios
-- Thinking Skills Program v2
-- ============================================
-- Ejecuta este script en Supabase SQL Editor ANTES de
-- asociar_estudiantes_a_institucion.sql si tu tabla colegios
-- no tiene la columna codigo (ej. fue creada por otra app).
-- ============================================

-- Añadir columna si no existe
ALTER TABLE colegios ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Rellenar codigo para filas que lo tengan NULL (COL001, COL002, ...)
WITH numerados AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM colegios
  WHERE codigo IS NULL OR codigo = ''
)
UPDATE colegios c
SET codigo = 'COL' || LPAD(n.rn::text, 3, '0')
FROM numerados n
WHERE c.id = n.id;

-- Marcar como NOT NULL (solo si no hay nulls)
UPDATE colegios SET codigo = 'COL000' WHERE codigo IS NULL OR codigo = '';
ALTER TABLE colegios ALTER COLUMN codigo SET NOT NULL;

-- Índice único para codigo (evita duplicados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'colegios_codigo_key'
  ) THEN
    ALTER TABLE colegios ADD CONSTRAINT colegios_codigo_key UNIQUE (codigo);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Algunos códigos quedaron duplicados. Revisa la tabla colegios y asigna códigos únicos.';
END $$;

-- Índice para búsquedas por codigo
CREATE INDEX IF NOT EXISTS idx_colegios_codigo ON colegios(codigo);

-- Verificación
SELECT id, codigo, nombre, activo FROM colegios ORDER BY codigo LIMIT 20;
