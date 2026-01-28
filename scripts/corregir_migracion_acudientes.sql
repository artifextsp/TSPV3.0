-- ============================================
-- SCRIPT CORREGIDO: MIGRACIÓN COMPLETA DE ACUDIENTES
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script corrige la migración para crear UN registro de acudiente
-- POR CADA estudiante que tenga datos de acudiente.
-- 
-- Si un acudiente tiene múltiples hijos, habrá múltiples registros
-- con el mismo email (uno por cada hijo).
-- 
-- INSTRUCCIONES:
-- 1. Si ya ejecutaste el script anterior, primero elimina los datos:
--    DELETE FROM acudientes;
--    ALTER TABLE acudientes DROP CONSTRAINT IF EXISTS acudientes_email_key;
-- 
-- 2. Ejecuta este script completo
-- 3. Verifica que se crearon todos los registros
-- ============================================

-- ============================================
-- PASO 1: CORREGIR CONSTRAINT DE EMAIL
-- ============================================

-- Eliminar constraint antiguo de email único (si existe)
ALTER TABLE acudientes DROP CONSTRAINT IF EXISTS acudientes_email_key;

-- Crear nuevo constraint: email+estudiante_id único (permite mismo email con diferentes hijos)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'acudientes_email_estudiante_unique'
  ) THEN
    ALTER TABLE acudientes 
    ADD CONSTRAINT acudientes_email_estudiante_unique 
    UNIQUE (email, estudiante_id);
  END IF;
END $$;

-- ============================================
-- PASO 2: ELIMINAR DATOS ANTERIORES (SI EXISTEN)
-- ============================================

-- ⚠️ DESCOMENTA ESTA LÍNEA SI QUIERES ELIMINAR LOS 10 REGISTROS EXISTENTES
-- DELETE FROM acudientes;

-- ============================================
-- PASO 3: MIGRAR TODOS LOS ACUDIENTES
-- ============================================

-- Insertar UN registro POR CADA estudiante que tenga datos de acudiente
INSERT INTO acudientes (
  nombre,
  apellidos,
  email,
  celular,
  password_hash,
  estudiante_id,
  activo,
  primera_vez,
  created_at,
  updated_at
)
SELECT 
  u.nombre_acudiente,
  u.apellido_acudiente,
  LOWER(TRIM(u.email_acudiente)),
  u.celular_acudiente,
  -- Hash SHA-256 de "temporal123"
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  u.id,  -- ID del estudiante (hijo/a)
  u.activo,
  true,  -- Primera vez = debe cambiar contraseña
  u.created_at,
  u.updated_at
FROM usuarios u
WHERE u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND u.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM acudientes a 
    WHERE a.email = LOWER(TRIM(u.email_acudiente))
      AND a.estudiante_id = u.id
  )
ON CONFLICT (email, estudiante_id) DO NOTHING;

-- ============================================
-- PASO 4: ASIGNAR NOMBRES DE USUARIO
-- ============================================

-- Asignar nombres de usuario secuenciales (ACU001, ACU002, etc.)
-- Ordenados por estudiante_id para mantener consistencia
WITH acudientes_ordenados AS (
  SELECT 
    id,
    email,
    estudiante_id,
    ROW_NUMBER() OVER (ORDER BY estudiante_id, created_at, email) as numero_secuencia
  FROM acudientes
  WHERE activo = true
    AND (username IS NULL OR username = '')
)
UPDATE acudientes a
SET username = 'ACU' || LPAD(ao.numero_secuencia::TEXT, 3, '0')
FROM acudientes_ordenados ao
WHERE a.id = ao.id;

-- ============================================
-- PASO 5: VERIFICACIÓN COMPLETA
-- ============================================

-- Ver total de acudientes creados
SELECT 
  COUNT(*) as total_acudientes,
  COUNT(DISTINCT a.email) as acudientes_unicos,
  COUNT(CASE WHEN a.username IS NOT NULL THEN 1 END) as con_username,
  COUNT(CASE WHEN a.activo = true THEN 1 END) as activos
FROM acudientes a;

-- Ver cuántos estudiantes tienen acudiente vs cuántos no
SELECT 
  COUNT(*) as total_estudiantes,
  COUNT(CASE WHEN email_acudiente IS NOT NULL AND email_acudiente != '' THEN 1 END) as con_acudiente,
  COUNT(CASE WHEN email_acudiente IS NULL OR email_acudiente = '' THEN 1 END) as sin_acudiente
FROM usuarios
WHERE activo = true;

-- Verificar que cada estudiante con acudiente tiene su registro
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.email_acudiente,
  CASE 
    WHEN a.id IS NOT NULL THEN '✅ Tiene acudiente'
    ELSE '❌ FALTA acudiente'
  END as estado
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND (u.email_acudiente IS NOT NULL AND u.email_acudiente != '')
ORDER BY 
  CASE WHEN a.id IS NULL THEN 0 ELSE 1 END,
  u.codigo_estudiante
LIMIT 20;

-- Ver acudientes con múltiples hijos (mismo email, diferentes estudiantes)
SELECT 
  a.email,
  COUNT(*) as cantidad_hijos,
  STRING_AGG(u.codigo_estudiante, ', ' ORDER BY u.codigo_estudiante) as codigos_estudiantes
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
GROUP BY a.email
HAVING COUNT(*) > 1
ORDER BY cantidad_hijos DESC;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. Ahora se crea UN registro POR CADA estudiante con datos de acudiente
-- 
-- 2. Si un acudiente tiene múltiples hijos, habrá múltiples registros
--    con el mismo email (uno por cada hijo)
-- 
-- 3. El constraint UNIQUE es sobre (email, estudiante_id), no solo email
-- 
-- 4. Los nombres de usuario son secuenciales: ACU001, ACU002, ACU003, etc.
--    (uno por cada registro, no por cada email único)
-- 
-- 5. Cuando un acudiente hace login, verá solo el hijo asociado a ese registro
--    Si tiene múltiples hijos, necesitará hacer login con diferentes registros
--    (o implementar selección de hijo en el futuro)
-- 
-- ============================================
