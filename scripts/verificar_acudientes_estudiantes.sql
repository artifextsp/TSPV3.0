-- ============================================
-- VERIFICAR ASOCIACIÓN ACUDIENTE - ESTUDIANTE
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script permite verificar que los acudientes están
-- correctamente asociados a sus estudiantes hijos/as.
-- ============================================

-- ============================================
-- CONSULTA 1: VER TODOS LOS ACUDIENTES CON SUS ESTUDIANTES
-- ============================================
-- Muestra todos los acudientes activos con la información
-- del estudiante asociado

SELECT 
  -- Datos del Acudiente
  a.id as acudiente_id,
  a.username as usuario_acudiente,
  a.nombre as nombre_acudiente,
  a.apellidos as apellidos_acudiente,
  a.email as email_acudiente,
  a.celular as celular_acudiente,
  a.activo as acudiente_activo,
  a.created_at as fecha_creacion_acudiente,
  
  -- Datos del Estudiante Asociado
  u.id as estudiante_id,
  u.codigo_estudiante,
  u.nombre as nombre_estudiante,
  u.apellidos as apellidos_estudiante,
  u.grado as grado_estudiante,
  u.email as email_estudiante,
  u.activo as estudiante_activo,
  
  -- Información de la Relación
  CASE 
    WHEN a.estudiante_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ Asociado correctamente'
    WHEN a.estudiante_id IS NOT NULL AND u.id IS NULL THEN '❌ Estudiante no encontrado'
    WHEN a.estudiante_id IS NULL THEN '⚠️ Sin estudiante asignado'
  END as estado_asociacion

FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
ORDER BY a.created_at DESC, u.codigo_estudiante;

-- ============================================
-- CONSULTA 2: BUSCAR ACUDIENTE ESPECÍFICO POR EMAIL
-- ============================================
-- Reemplaza 'emilse.perdomo@seminariopalmira.edu.co' con el email del acudiente que quieres verificar

SELECT 
  a.username as usuario_acudiente,
  a.nombre || ' ' || a.apellidos as nombre_completo_acudiente,
  a.email as email_acudiente,
  a.celular,
  a.activo as acudiente_activo,
  
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_completo_estudiante,
  u.grado,
  u.email as email_estudiante,
  u.activo as estudiante_activo,
  
  CASE 
    WHEN a.estudiante_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ Correctamente asociado'
    ELSE '❌ Error en la asociación'
  END as estado

FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.email = 'emilse.perdomo@seminariopalmira.edu.co'  -- ⚠️ CAMBIAR POR EL EMAIL QUE QUIERES VERIFICAR
ORDER BY a.created_at DESC;

-- ============================================
-- CONSULTA 3: BUSCAR POR CÓDIGO DE ESTUDIANTE
-- ============================================
-- Reemplaza 'EST0053' con el código del estudiante que quieres verificar

SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_completo_estudiante,
  u.grado,
  
  a.username as usuario_acudiente,
  a.nombre || ' ' || a.apellidos as nombre_completo_acudiente,
  a.email as email_acudiente,
  a.celular,
  a.activo as acudiente_activo,
  a.created_at as fecha_asociacion,
  
  CASE 
    WHEN COUNT(a.id) OVER (PARTITION BY u.id) > 0 THEN '✅ Tiene acudiente(s)'
    ELSE '⚠️ Sin acudiente asignado'
  END as estado

FROM usuarios u
LEFT JOIN acudientes a ON u.id = a.estudiante_id AND a.activo = true
WHERE u.codigo_estudiante = 'EST0053'  -- ⚠️ CAMBIAR POR EL CÓDIGO QUE QUIERES VERIFICAR
  AND u.activo = true
ORDER BY a.created_at DESC;

-- ============================================
-- CONSULTA 4: RESUMEN GENERAL
-- ============================================
-- Muestra estadísticas generales sobre acudientes y estudiantes

SELECT 
  'Total Acudientes Activos' as concepto,
  COUNT(*)::TEXT as cantidad
FROM acudientes
WHERE activo = true

UNION ALL

SELECT 
  'Estudiantes con Acudiente' as concepto,
  COUNT(DISTINCT estudiante_id)::TEXT as cantidad
FROM acudientes
WHERE activo = true
  AND estudiante_id IS NOT NULL

UNION ALL

SELECT 
  'Estudiantes sin Acudiente' as concepto,
  COUNT(*)::TEXT as cantidad
FROM usuarios u
WHERE u.activo = true
  AND u.codigo_estudiante LIKE 'EST%'
  AND NOT EXISTS (
    SELECT 1 FROM acudientes a 
    WHERE a.estudiante_id = u.id 
      AND a.activo = true
  )

UNION ALL

SELECT 
  'Acudientes sin Estudiante Asociado' as concepto,
  COUNT(*)::TEXT as cantidad
FROM acudientes a
WHERE a.activo = true
  AND (a.estudiante_id IS NULL 
       OR NOT EXISTS (
         SELECT 1 FROM usuarios u 
         WHERE u.id = a.estudiante_id 
           AND u.activo = true
       ));

-- ============================================
-- CONSULTA 5: VERIFICAR ACUDIENTE RECIÉN CREADO
-- ============================================
-- Muestra los acudientes creados en las últimas 24 horas

SELECT 
  a.username as usuario_acudiente,
  a.nombre || ' ' || a.apellidos as nombre_completo_acudiente,
  a.email as email_acudiente,
  a.celular,
  a.created_at as fecha_creacion,
  
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_completo_estudiante,
  u.grado,
  
  CASE 
    WHEN a.estudiante_id IS NOT NULL AND u.id IS NOT NULL THEN '✅ Correctamente asociado'
    ELSE '❌ Error en la asociación'
  END as estado_asociacion,
  
  EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 3600 as horas_desde_creacion

FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY a.created_at DESC;

-- ============================================
-- CONSULTA 6: VERIFICAR INTEGRIDAD DE RELACIONES
-- ============================================
-- Detecta posibles problemas en las relaciones

SELECT 
  'Acudientes con estudiante_id inválido' as problema,
  COUNT(*) as cantidad
FROM acudientes a
WHERE a.activo = true
  AND a.estudiante_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM usuarios u 
    WHERE u.id = a.estudiante_id
  )

UNION ALL

SELECT 
  'Estudiantes con múltiples acudientes activos' as problema,
  COUNT(DISTINCT estudiante_id) as cantidad
FROM acudientes
WHERE activo = true
  AND estudiante_id IS NOT NULL
GROUP BY estudiante_id
HAVING COUNT(*) > 1;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
-- 
-- 1. Para ver todos los acudientes: Ejecuta CONSULTA 1
-- 2. Para buscar un acudiente específico: Ejecuta CONSULTA 2 y cambia el email
-- 3. Para buscar por código de estudiante: Ejecuta CONSULTA 3 y cambia el código
-- 4. Para ver estadísticas generales: Ejecuta CONSULTA 4
-- 5. Para ver acudientes recién creados: Ejecuta CONSULTA 5
-- 6. Para detectar problemas: Ejecuta CONSULTA 6
-- 
-- ⚠️ RECUERDA: Cambia los valores en las consultas 2 y 3 según lo que necesites verificar
