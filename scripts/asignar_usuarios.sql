-- ============================================
-- SCRIPT SQL PARA ASIGNAR NOMBRES DE USUARIO
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script asigna nombres de usuario secuenciales (TSP001, TSP002, etc.)
-- a todos los estudiantes en la tabla usuarios.
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. Verifica que se hayan asignado correctamente
-- 3. Los niños podrán usar estos nombres de usuario en lugar del email
-- ============================================

-- Paso 1: Añadir columna 'username' si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'username'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN username TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
  END IF;
END $$;

-- Paso 2: Asignar nombres de usuario secuenciales a todos los usuarios activos
-- Ordenados por código_estudiante o email para mantener consistencia
WITH usuarios_ordenados AS (
  SELECT 
    id,
    email,
    codigo_estudiante,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN codigo_estudiante IS NOT NULL THEN codigo_estudiante 
          ELSE email 
        END
    ) as numero_secuencia
  FROM usuarios
  WHERE activo = true
)
UPDATE usuarios u
SET username = 'TSP' || LPAD(uo.numero_secuencia::TEXT, 3, '0')
FROM usuarios_ordenados uo
WHERE u.id = uo.id
  AND (u.username IS NULL OR u.username = '');

-- Paso 3: Verificar que se asignaron correctamente
SELECT 
  username,
  email,
  nombre,
  codigo_estudiante,
  tipo_usuario
FROM usuarios
WHERE activo = true
ORDER BY username
LIMIT 20;

-- Paso 4: Verificar que no hay duplicados
SELECT username, COUNT(*) as cantidad
FROM usuarios
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;

-- ============================================
-- NOTAS:
-- ============================================
-- - Los nombres de usuario serán: TSP001, TSP002, TSP003, etc.
-- - Se asignan automáticamente a todos los usuarios activos
-- - Si ya existe un username, no se sobrescribe
-- - El orden se basa en codigo_estudiante o email
-- - El campo username es UNIQUE para evitar duplicados
-- ============================================
