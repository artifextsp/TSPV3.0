-- ============================================
-- VERIFICAR TODOS LOS USUARIOS ACTIVOS
-- ============================================

-- Ver TODOS los usuarios activos (sin límite)
SELECT 
  codigo_estudiante,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_completo,
  email,
  activo,
  primera_vez,
  tipo_usuario,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✅ Tiene password_hash'
    ELSE '❌ Sin password_hash'
  END as estado_password
FROM usuarios
WHERE activo = true
ORDER BY codigo_estudiante;

-- Contar total de usuarios activos
SELECT 
  COUNT(*) as total_usuarios_activos,
  COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as con_password_hash,
  COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as sin_password_hash
FROM usuarios
WHERE activo = true;

-- Ver usuarios que NO tienen password_hash (problema)
SELECT 
  codigo_estudiante,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_completo,
  email,
  '❌ NO tiene password_hash - NO puede hacer login' as problema
FROM usuarios
WHERE activo = true
  AND password_hash IS NULL
ORDER BY codigo_estudiante;
