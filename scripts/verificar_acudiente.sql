-- ============================================
-- VERIFICAR CREDENCIALES DE UN ACUDIENTE
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script te permite verificar las credenciales de un acudiente específico
-- y ver cómo puede acceder al sistema.
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza 'ACU0031' con el username del acudiente que quieres verificar
-- 2. O usa el email del acudiente en la segunda consulta
-- ============================================

-- ============================================
-- OPCIÓN 1: Buscar por Username (MEJORADA)
-- ============================================

SELECT 
  a.username as usuario_acudiente,
  a.nombre || ' ' || COALESCE(a.apellidos, '') as nombre_acudiente,
  a.email as email_acudiente,
  a.celular,
  a.password_hash as hash_completo,  -- ⬅️ Muestra el hash completo para verificar
  CASE 
    WHEN a.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN '✅ temporal123'
    WHEN a.password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '✅ 123456'
    ELSE '❓ Contraseña personalizada (verificar con admin)'
  END as contraseña_inicial,
  CASE 
    WHEN a.primera_vez = true THEN 'Sí - Debe cambiar contraseña'
    ELSE 'No - Ya cambió la contraseña'
  END as debe_cambiar_contraseña,
  u.codigo_estudiante as estudiante_asociado,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_estudiante,
  u.grado as grado_estudiante,
  a.activo,
  a.created_at as fecha_creacion
FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id  -- LEFT JOIN para que funcione aunque no haya estudiante
WHERE UPPER(a.username) = UPPER('ACU0031')  -- ⬅️ CAMBIAR AQUÍ el username (sin importar mayúsculas)
  AND a.activo = true;

-- ============================================
-- OPCIÓN 2: Buscar por Email
-- ============================================

-- Descomenta y reemplaza el email:
/*
SELECT 
  a.username as usuario_acudiente,
  a.nombre || ' ' || a.apellidos as nombre_acudiente,
  a.email as email_acudiente,
  a.celular,
  u.codigo_estudiante as estudiante_asociado,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_estudiante,
  u.grado as grado_estudiante,
  CASE 
    WHEN a.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    ELSE 'Contraseña personalizada (verificar con admin)'
  END as contraseña_inicial,
  CASE 
    WHEN a.primera_vez = true THEN 'Sí - Debe cambiar contraseña'
    ELSE 'No - Ya cambió la contraseña'
  END as debe_cambiar_contraseña,
  a.activo,
  a.created_at as fecha_creacion
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE LOWER(a.email) = LOWER('email@ejemplo.com')  -- ⬅️ CAMBIAR AQUÍ el email
  AND a.activo = true
ORDER BY a.created_at;
*/

-- ============================================
-- OPCIÓN 3: Ver TODOS los hijos de un acudiente (si tiene múltiples)
-- ============================================

-- Si un acudiente tiene múltiples hijos, muestra todos:
/*
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
WHERE a.email = 'email@ejemplo.com'  -- ⬅️ CAMBIAR AQUÍ el email
  AND a.activo = true
ORDER BY u.grado, u.nombre;
*/

-- ============================================
-- INFORMACIÓN DE ACCESO
-- ============================================
-- 
-- Los acudientes pueden acceder de DOS formas:
-- 
-- 1. CON USERNAME:
--    - Username: ACU0031 (o el que corresponda)
--    - Contraseña: temporal123 (si es primera vez)
-- 
-- 2. CON EMAIL:
--    - Email: el email del acudiente
--    - Contraseña: temporal123 (si es primera vez)
-- 
-- IMPORTANTE:
-- - Si tiene múltiples hijos, habrá múltiples registros con el mismo email
-- - Cada registro permite ver UN hijo específico
-- - El sistema mostrará el hijo asociado al registro con el que hizo login
-- 
-- ============================================
-- RESETEAR CONTRASEÑA (si es necesario)
-- ============================================

-- Si necesitas resetear la contraseña a "temporal123":
/*
UPDATE acudientes
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',  -- Hash de "temporal123"
    primera_vez = true
WHERE username = 'ACU0031';  -- ⬅️ CAMBIAR AQUÍ el username
*/

-- ============================================
-- VERIFICAR HASH DE CONTRASEÑA (SIN JOIN)
-- ============================================

-- Esta consulta funciona incluso si no hay estudiante asociado:
SELECT 
  username as usuario_acudiente,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_acudiente,
  email as email_acudiente,
  password_hash as hash_completo,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN '✅ temporal123'
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '✅ 123456'
    ELSE '❓ Contraseña personalizada'
  END as contraseña_detectada,
  primera_vez,
  activo
FROM acudientes
WHERE UPPER(username) = UPPER('ACU0031')  -- ⬅️ CAMBIAR AQUÍ el username
  AND activo = true;

-- ============================================
-- BUSCAR ACUDIENTES SIMILARES (si no encuentras el exacto)
-- ============================================

-- Si no encuentras el acudiente, busca similares:
/*
SELECT 
  username,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_acudiente,
  email,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '123456'
    ELSE 'Contraseña personalizada'
  END as contraseña,
  activo
FROM acudientes
WHERE username ILIKE '%ACU003%'  -- Busca usernames similares
ORDER BY username;
*/
