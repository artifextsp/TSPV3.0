-- ============================================
-- DIAGNÓSTICO MEJORADO: Identificar problemas específicos
-- ============================================

-- 1. Ver el email con mayúsculas
SELECT 
  codigo_estudiante,
  nombre || ' ' || COALESCE(apellidos, '') as estudiante_nombre,
  email_acudiente,
  LOWER(TRIM(email_acudiente)) as email_normalizado,
  nombre_acudiente,
  apellido_acudiente
FROM usuarios
WHERE activo = true
  AND email_acudiente IS NOT NULL
  AND email_acudiente != ''
  AND email_acudiente != LOWER(email_acudiente)
ORDER BY codigo_estudiante;

-- 2. Verificar Emily Peña Robles específicamente
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.email_acudiente,
  u.nombre_acudiente,
  u.apellido_acudiente,
  u.celular_acudiente,
  u.activo,
  a.id as acudiente_id,
  a.email as acudiente_email_migrado,
  a.username as acudiente_username
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.codigo_estudiante = 'EST0046'
   OR (u.nombre ILIKE '%EMILY%' AND u.apellidos ILIKE '%PEÑA%');

-- 3. Contar estudiantes que deberían tener acudiente
SELECT 
  COUNT(*) as total_estudiantes_con_email_acudiente,
  COUNT(CASE WHEN a.id IS NOT NULL THEN 1 END) as con_acudiente_migrado,
  COUNT(CASE WHEN a.id IS NULL THEN 1 END) as sin_acudiente_migrado
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND TRIM(u.email_acudiente) != '';

-- 4. Listar TODOS los estudiantes que NO tienen acudiente migrado
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre,
  u.email_acudiente,
  u.nombre_acudiente,
  u.apellido_acudiente,
  u.celular_acudiente,
  CASE 
    WHEN u.nombre_acudiente IS NULL OR u.nombre_acudiente = '' THEN '❌ Falta nombre_acudiente'
    WHEN u.apellido_acudiente IS NULL OR u.apellido_acudiente = '' THEN '⚠️ Falta apellido_acudiente'
    ELSE '✅ Datos completos'
  END as estado_datos
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND TRIM(u.email_acudiente) != ''
  AND a.id IS NULL
ORDER BY u.codigo_estudiante;
