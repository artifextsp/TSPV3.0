-- ============================================
-- LISTADO COMPLETO: ESTUDIANTES Y ACUDIENTES
-- Para entregar en la primera clase
-- ============================================

-- ============================================
-- LISTADO 1: ESTUDIANTES CON SUS CREDENCIALES
-- ============================================

SELECT 
  u.codigo_estudiante,
  u.username as usuario_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_completo,
  u.grado,
  u.email,
  u.activo,
  CASE 
    WHEN u.password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '123456'
    WHEN u.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    ELSE 'Cambiar en primer login'
  END as contraseña_inicial
FROM usuarios u
WHERE u.activo = true
  AND u.tipo_usuario = 'estudiante'
ORDER BY u.codigo_estudiante;

-- ============================================
-- LISTADO 2: ACUDIENTES CON SUS CREDENCIALES Y ESTUDIANTE ASOCIADO
-- ============================================

SELECT 
  a.username as usuario_acudiente,
  a.nombre || ' ' || a.apellidos as nombre_acudiente,
  a.email as email_acudiente,
  u.codigo_estudiante as estudiante_asociado,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_estudiante,
  u.grado as grado_estudiante,
  'temporal123' as contraseña_inicial,
  a.activo
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
ORDER BY a.username;

-- ============================================
-- RESUMEN GENERAL
-- ============================================

SELECT 
  'Total Estudiantes Activos' as tipo,
  COUNT(*)::TEXT as cantidad
FROM usuarios
WHERE activo = true
  AND tipo_usuario = 'estudiante'

UNION ALL

SELECT 
  'Total Acudientes Activos' as tipo,
  COUNT(*)::TEXT as cantidad
FROM acudientes
WHERE activo = true

UNION ALL

SELECT 
  'Estudiantes con Acudiente' as tipo,
  COUNT(DISTINCT a.estudiante_id)::TEXT as cantidad
FROM acudientes a
WHERE a.activo = true;
