-- ============================================
-- CONSULTA SIMPLE: Verificar Acudiente ACU0031
-- Thinking Skills Program v2
-- ============================================
-- 
-- Esta consulta muestra TODA la información del acudiente incluyendo la contraseña
-- ============================================

-- CONSULTA PRINCIPAL (Copia y ejecuta esta):
SELECT 
  a.username as "Usuario",
  a.nombre || ' ' || COALESCE(a.apellidos, '') as "Nombre Acudiente",
  a.email as "Email",
  a.password_hash as "Hash Completo",
  CASE 
    WHEN a.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    WHEN a.password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '123456'
    ELSE 'Contraseña personalizada'
  END as "Contraseña",
  CASE 
    WHEN a.primera_vez = true THEN 'Sí'
    ELSE 'No'
  END as "Debe Cambiar",
  u.codigo_estudiante as "Estudiante",
  u.nombre || ' ' || COALESCE(u.apellidos, '') as "Nombre Estudiante",
  u.grado as "Grado",
  a.activo as "Activo"
FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id
WHERE UPPER(a.username) = UPPER('ACU0031')
ORDER BY a.created_at;

-- ============================================
-- SI NO ENCUENTRA RESULTADOS, PRUEBA ESTAS:
-- ============================================

-- Opción 1: Buscar sin filtro de activo
/*
SELECT 
  username,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_acudiente,
  email,
  password_hash,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '123456'
    ELSE 'Contraseña personalizada'
  END as contraseña,
  activo
FROM acudientes
WHERE UPPER(username) LIKE UPPER('%ACU003%')
ORDER BY username;
*/

-- Opción 2: Ver todos los acudientes que empiezan con ACU003
/*
SELECT 
  username,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_acudiente,
  email,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    ELSE 'Otra contraseña'
  END as contraseña,
  activo
FROM acudientes
WHERE username ILIKE 'ACU003%'
ORDER BY username;
*/

-- Opción 3: Ver los últimos 10 acudientes creados
/*
SELECT 
  username,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_acudiente,
  email,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    ELSE 'Otra contraseña'
  END as contraseña,
  activo
FROM acudientes
ORDER BY created_at DESC
LIMIT 10;
*/
