-- ============================================
-- DIAGNÓSTICO: ¿Por qué faltan acudientes?
-- ============================================

-- 1. Verificar totales
SELECT 
  'Total estudiantes activos' as tipo,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true

UNION ALL

SELECT 
  'Estudiantes con email_acudiente' as tipo,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''
  AND TRIM(email_acudiente) != ''

UNION ALL

SELECT 
  'Acudientes creados' as tipo,
  COUNT(*) as cantidad
FROM acudientes
WHERE activo = true;

-- 2. Estudiantes que DEBERÍAN tener acudiente pero NO lo tienen
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.email_acudiente,
  u.activo as estudiante_activo,
  CASE 
    WHEN u.email_acudiente IS NULL THEN '❌ email_acudiente es NULL'
    WHEN u.email_acudiente = '' THEN '❌ email_acudiente está vacío'
    WHEN TRIM(u.email_acudiente) = '' THEN '❌ email_acudiente solo tiene espacios'
    WHEN a.id IS NULL THEN '❌ NO tiene registro en acudientes'
    ELSE '✅ Tiene acudiente'
  END as problema,
  a.id as acudiente_id
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND (
    (u.email_acudiente IS NOT NULL AND u.email_acudiente != '' AND TRIM(u.email_acudiente) != '')
    OR a.id IS NULL
  )
ORDER BY 
  CASE WHEN a.id IS NULL THEN 0 ELSE 1 END,
  u.codigo_estudiante;

-- 3. Verificar específicamente Emily Peña Robles (EST0046)
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.email_acudiente,
  u.nombre_acudiente,
  u.apellido_acudiente,
  u.celular_acudiente,
  u.activo,
  a.id as acudiente_id,
  a.email as acudiente_email_migrado
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.codigo_estudiante = 'EST0046'
   OR u.nombre ILIKE '%EMILY%'
   OR u.apellidos ILIKE '%PEÑA%';

-- 4. Verificar si hay problemas con el formato de email
SELECT 
  'Emails con espacios al inicio/final' as tipo,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != TRIM(email_acudiente)

UNION ALL

SELECT 
  'Emails con mayúsculas' as tipo,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != LOWER(email_acudiente);

-- 5. Intentar insertar manualmente los faltantes (solo para diagnóstico)
-- Esto mostrará qué registros se pueden insertar
SELECT 
  u.id as estudiante_id,
  u.codigo_estudiante,
  u.nombre_acudiente,
  u.apellido_acudiente,
  LOWER(TRIM(u.email_acudiente)) as email_normalizado,
  u.celular_acudiente,
  u.activo,
  CASE 
    WHEN a.id IS NOT NULL THEN 'YA EXISTE'
    WHEN u.nombre_acudiente IS NULL OR u.nombre_acudiente = '' THEN 'FALTA nombre_acudiente'
    WHEN u.apellido_acudiente IS NULL OR u.apellido_acudiente = '' THEN 'FALTA apellido_acudiente'
    WHEN u.email_acudiente IS NULL OR TRIM(u.email_acudiente) = '' THEN 'FALTA email_acudiente'
    ELSE 'LISTO PARA INSERTAR'
  END as estado
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND TRIM(u.email_acudiente) != ''
  AND a.id IS NULL
ORDER BY u.codigo_estudiante;
