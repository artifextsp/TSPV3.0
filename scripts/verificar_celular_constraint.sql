-- ============================================
-- VERIFICAR CAMPO CELULAR Y CONSTRAINT
-- Thinking Skills Program v2
-- ============================================
-- 
-- Script de verificación rápida
-- ============================================

-- Verificar que el campo celular existe
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' 
  AND column_name = 'celular';

-- Verificar el constraint de tipo_usuario
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'usuarios'::regclass
  AND conname LIKE '%tipo_usuario%';

-- Verificar algunos docentes existentes (si hay)
SELECT 
  id,
  nombre,
  apellidos,
  email,
  celular,
  tipo_usuario,
  activo
FROM usuarios
WHERE tipo_usuario = 'docente'
LIMIT 5;
