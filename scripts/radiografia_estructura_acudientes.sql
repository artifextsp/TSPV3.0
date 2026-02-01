-- ============================================
-- RADIOGRAFÍA DE LA ESTRUCTURA - acudientes
-- Thinking Skills Program v2
-- ============================================
-- Ejecuta este script en Supabase SQL Editor y copia el resultado.
-- Con eso ajustamos el script de corrección de hashes sin fallos.
-- ============================================

-- 1) Columnas de la tabla acudientes
SELECT
  'acudientes' AS tabla,
  column_name AS columna,
  data_type AS tipo_dato,
  character_maximum_length AS long_max,
  is_nullable AS permite_nulo,
  column_default AS valor_defecto,
  ordinal_position AS orden
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'acudientes'
ORDER BY ordinal_position;

-- 2) Resumen en una sola línea (para pegar rápido)
SELECT
  string_agg(column_name, ', ' ORDER BY ordinal_position) AS columnas_acudientes
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'acudientes';

-- 3) Si existe la tabla usuarios y quieres comparar campos de login
SELECT
  'usuarios' AS tabla,
  column_name AS columna,
  data_type AS tipo_dato,
  is_nullable AS permite_nulo,
  ordinal_position AS orden
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name IN ('password_hash', 'primera_vez', 'updated_at', 'contrasena', 'pass_hash', 'clave')
ORDER BY ordinal_position;
