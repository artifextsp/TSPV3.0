-- ============================================
-- FORZAR MIGRACIÓN COMPLETA DE TODOS LOS ACUDIENTES
-- ============================================
-- 
-- Este script fuerza la migración de TODOS los estudiantes
-- que tienen datos de acudiente, sin importar si ya existen algunos registros.
-- 
-- ⚠️ IMPORTANTE: Este script:
-- 1. Elimina TODOS los acudientes existentes
-- 2. Recrea TODOS desde cero
-- 3. Asigna nombres de usuario secuenciales
-- 
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR TODOS LOS ACUDIENTES EXISTENTES
-- ============================================

-- ⚠️ CUIDADO: Esto eliminará todos los acudientes
DELETE FROM acudientes;

-- ============================================
-- PASO 2: VERIFICAR QUE LA TABLA ESTÁ VACÍA
-- ============================================

SELECT COUNT(*) as acudientes_restantes FROM acudientes;
-- Debe mostrar 0

-- ============================================
-- PASO 3: MIGRAR TODOS LOS ESTUDIANTES CON ACUDIENTE
-- ============================================

-- Insertar TODOS los estudiantes que tengan datos de acudiente válidos
-- ⚠️ IMPORTANTE: Normaliza emails a minúsculas y elimina espacios
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
  -- Si no hay nombre_acudiente, usar parte del email antes del @
  COALESCE(
    NULLIF(TRIM(u.nombre_acudiente), ''),
    SPLIT_PART(LOWER(TRIM(u.email_acudiente)), '@', 1),
    'SIN NOMBRE'
  ) as nombre,
  COALESCE(NULLIF(TRIM(u.apellido_acudiente), ''), '') as apellidos,
  LOWER(TRIM(u.email_acudiente)) as email,  -- ⚠️ Normaliza a minúsculas
  NULLIF(TRIM(u.celular_acudiente), '') as celular,
  -- Hash SHA-256 de "temporal123"
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  u.id,
  u.activo,
  true,  -- Primera vez = debe cambiar contraseña
  COALESCE(u.created_at, NOW()),
  COALESCE(u.updated_at, NOW())
FROM usuarios u
WHERE u.activo = true
  AND u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND TRIM(u.email_acudiente) != ''
  AND LOWER(TRIM(u.email_acudiente)) LIKE '%@%'  -- Verifica formato de email básico
  -- ⚠️ HACER MÁS PERMISIVO: Si falta nombre_acudiente, usar email como nombre
  AND (
    (u.nombre_acudiente IS NOT NULL AND TRIM(u.nombre_acudiente) != '')
    OR (u.email_acudiente IS NOT NULL)  -- Permitir incluso sin nombre_acudiente
  )
ON CONFLICT (email, estudiante_id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  apellidos = EXCLUDED.apellidos,
  celular = EXCLUDED.celular,
  updated_at = NOW();

-- ============================================
-- PASO 4: ASIGNAR NOMBRES DE USUARIO
-- ============================================

-- Asignar nombres de usuario secuenciales (ACU001, ACU002, etc.)
WITH acudientes_ordenados AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY estudiante_id, created_at, email) as numero_secuencia
  FROM acudientes
  WHERE activo = true
)
UPDATE acudientes a
SET username = 'ACU' || LPAD(ao.numero_secuencia::TEXT, 3, '0')
FROM acudientes_ordenados ao
WHERE a.id = ao.id
  AND (a.username IS NULL OR a.username = '');

-- ============================================
-- PASO 5: VERIFICACIÓN FINAL
-- ============================================

-- Comparar totales
SELECT 
  (SELECT COUNT(*) FROM usuarios 
   WHERE activo = true 
   AND email_acudiente IS NOT NULL 
   AND email_acudiente != ''
   AND TRIM(email_acudiente) != '') as estudiantes_con_acudiente,
  (SELECT COUNT(*) FROM acudientes WHERE activo = true) as acudientes_creados,
  CASE 
    WHEN (SELECT COUNT(*) FROM usuarios 
          WHERE activo = true 
          AND email_acudiente IS NOT NULL 
          AND email_acudiente != ''
          AND TRIM(email_acudiente) != '') = 
         (SELECT COUNT(*) FROM acudientes WHERE activo = true)
    THEN '✅ CORRECTO: Todos los acudientes migrados'
    ELSE '❌ ERROR: Faltan acudientes'
  END as resultado;

-- Ver estudiantes que aún no tienen acudiente
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.email_acudiente,
  u.nombre_acudiente,
  u.apellido_acudiente,
  CASE 
    WHEN u.email_acudiente IS NULL THEN 'Falta email_acudiente'
    WHEN u.email_acudiente = '' THEN 'email_acudiente vacío'
    WHEN TRIM(u.email_acudiente) = '' THEN 'email_acudiente solo espacios'
    WHEN u.nombre_acudiente IS NULL OR u.nombre_acudiente = '' THEN 'Falta nombre_acudiente'
    WHEN a.id IS NULL THEN 'No se migró (revisar)'
    ELSE 'Migrado correctamente'
  END as razon
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND TRIM(u.email_acudiente) != ''
  AND a.id IS NULL
ORDER BY u.codigo_estudiante;

-- Ver TODOS los acudientes creados (sin límite)
SELECT 
  a.username,
  a.nombre || ' ' || a.apellidos as acudiente_nombre,
  a.email,
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
ORDER BY a.username;
