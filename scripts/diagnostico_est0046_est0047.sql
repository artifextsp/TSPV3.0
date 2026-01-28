-- ============================================
-- DIAGNÓSTICO ESPECÍFICO: EST0046 y EST0047
-- ============================================

-- Verificar específicamente Emily Peña Robles (EST0046) y Ana Sofía (EST0047)
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.activo,
  u.email_acudiente,
  u.nombre_acudiente,
  u.apellido_acudiente,
  u.celular_acudiente,
  -- Verificar condiciones del INSERT
  CASE WHEN u.activo = true THEN '✅' ELSE '❌' END as cond_activo,
  CASE WHEN u.email_acudiente IS NOT NULL THEN '✅' ELSE '❌' END as cond_email_not_null,
  CASE WHEN u.email_acudiente != '' THEN '✅' ELSE '❌' END as cond_email_not_empty,
  CASE WHEN TRIM(u.email_acudiente) != '' THEN '✅' ELSE '❌' END as cond_email_trimmed,
  CASE WHEN LOWER(TRIM(u.email_acudiente)) LIKE '%@%' THEN '✅' ELSE '❌' END as cond_email_format,
  CASE WHEN u.nombre_acudiente IS NOT NULL THEN '✅' ELSE '❌' END as cond_nombre_not_null,
  CASE WHEN TRIM(u.nombre_acudiente) != '' THEN '✅' ELSE '❌' END as cond_nombre_not_empty,
  -- Verificar si ya tiene acudiente migrado
  CASE WHEN a.id IS NOT NULL THEN '✅ MIGRADO' ELSE '❌ NO MIGRADO' END as estado_migracion,
  a.id as acudiente_id,
  a.email as acudiente_email
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.codigo_estudiante IN ('EST0046', 'EST0047')
   OR u.codigo_estudiante LIKE 'EST00%'
ORDER BY u.codigo_estudiante;

-- Ver TODOS los estudiantes activos con email_acudiente y por qué no se migraron
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.activo,
  u.email_acudiente,
  u.nombre_acudiente,
  u.apellido_acudiente,
  CASE 
    WHEN u.activo != true THEN '❌ Estudiante inactivo'
    WHEN u.email_acudiente IS NULL THEN '❌ email_acudiente es NULL'
    WHEN u.email_acudiente = '' THEN '❌ email_acudiente vacío'
    WHEN TRIM(u.email_acudiente) = '' THEN '❌ email_acudiente solo espacios'
    WHEN LOWER(TRIM(u.email_acudiente)) NOT LIKE '%@%' THEN '❌ email_acudiente sin formato @'
    WHEN u.nombre_acudiente IS NULL THEN '❌ nombre_acudiente es NULL'
    WHEN TRIM(u.nombre_acudiente) = '' THEN '❌ nombre_acudiente vacío'
    WHEN a.id IS NOT NULL THEN '✅ YA MIGRADO'
    ELSE '⚠️ CUMPLE TODAS LAS CONDICIONES PERO NO MIGRADO'
  END as razon_no_migracion,
  a.id as acudiente_id
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
ORDER BY 
  CASE WHEN a.id IS NULL THEN 0 ELSE 1 END,
  u.codigo_estudiante;

-- Contar cuántos estudiantes cumplen cada condición
SELECT 
  'Total estudiantes activos' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true

UNION ALL

SELECT 
  'Con email_acudiente NOT NULL' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL

UNION ALL

SELECT 
  'Con email_acudiente != ''''' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''

UNION ALL

SELECT 
  'Con email_acudiente TRIM != ''''' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''
  AND TRIM(email_acudiente) != ''

UNION ALL

SELECT 
  'Con email_acudiente LIKE ''%@%''' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''
  AND TRIM(email_acudiente) != ''
  AND LOWER(TRIM(email_acudiente)) LIKE '%@%'

UNION ALL

SELECT 
  'Con nombre_acudiente NOT NULL' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''
  AND TRIM(email_acudiente) != ''
  AND LOWER(TRIM(email_acudiente)) LIKE '%@%'
  AND nombre_acudiente IS NOT NULL

UNION ALL

SELECT 
  'Con nombre_acudiente TRIM != ''''' as condicion,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''
  AND TRIM(email_acudiente) != ''
  AND LOWER(TRIM(email_acudiente)) LIKE '%@%'
  AND nombre_acudiente IS NOT NULL
  AND TRIM(nombre_acudiente) != ''

UNION ALL

SELECT 
  'Acudientes migrados' as condicion,
  COUNT(*) as cantidad
FROM acudientes
WHERE activo = true;
