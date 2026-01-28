-- ============================================
-- VERIFICAR ESTRUCTURA DE TABLA USUARIOS
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script muestra la estructura completa de la tabla usuarios
-- para verificar qué campos existen y ajustar el RLS si es necesario
-- ============================================

-- Ver estructura de columnas de la tabla usuarios
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'usuarios'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver índices de la tabla usuarios
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'usuarios'
  AND schemaname = 'public';

-- Ver constraints de la tabla usuarios
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'usuarios'::regclass
ORDER BY contype, conname;

-- Verificar si existe columna 'documento'
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'usuarios' 
    AND column_name = 'documento'
) AS tiene_documento;

-- Verificar si existe columna 'username'
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'usuarios' 
    AND column_name = 'username'
) AS tiene_username;

-- Ver algunos registros de ejemplo para entender la estructura
SELECT 
  id,
  email,
  nombre,
  apellidos,
  tipo_usuario,
  codigo_estudiante,
  activo,
  grado
FROM usuarios
WHERE activo = true
LIMIT 5;
