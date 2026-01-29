-- ============================================
-- VERIFICAR Y RESETEAR CONTRASEÑA DE ACUDIENTE
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script te permite:
-- 1. Verificar el hash de contraseña de un acudiente
-- 2. Resetear la contraseña a "temporal123"
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta la primera consulta para ver el estado actual
-- 2. Si necesitas resetear, ejecuta la segunda consulta
-- ============================================

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL DEL ACUDIENTE
-- ============================================

SELECT 
  a.username,
  a.nombre || ' ' || COALESCE(a.apellidos, '') as nombre_acudiente,
  a.email,
  a.password_hash,
  CASE 
    WHEN a.password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d' THEN '✅ temporal123 (CORRECTO)'
    WHEN a.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN '❌ 123 (INCORRECTO - debe ser temporal123)'
    WHEN a.password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '✅ 123456'
    ELSE '❓ Contraseña personalizada o desconocida'
  END as contraseña_detectada,
  a.primera_vez,
  a.activo,
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_asociado
FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.username = 'ACU031'
ORDER BY a.created_at;

-- ============================================
-- PASO 2: RESETEAR CONTRASEÑA A "temporal123"
-- ============================================

-- ⚠️ IMPORTANTE: Hash CORRECTO de "temporal123": 70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d
-- El hash anterior 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' es de "123", NO de "temporal123"

UPDATE acudientes
SET 
  password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d',  -- Hash CORRECTO de "temporal123"
  primera_vez = true  -- Forzar cambio de contraseña en primer login
WHERE username = 'ACU031'
  AND activo = true;

-- Verificar que se actualizó correctamente
SELECT 
  username,
  email,
  CASE 
    WHEN password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d' THEN '✅ temporal123 (CORRECTO)'
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN '❌ 123 (INCORRECTO)'
    ELSE '❌ Error: No se actualizó correctamente'
  END as contraseña_verificada,
  primera_vez
FROM acudientes
WHERE username = 'ACU031';

-- ============================================
-- PASO 3: RESETEAR TODOS LOS REGISTROS DEL ACUDIENTE (si tiene múltiples hijos)
-- ============================================

-- Si el acudiente tiene múltiples registros (múltiples hijos), resetear todos:
/*
UPDATE acudientes
SET 
  password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d',  -- Hash CORRECTO de "temporal123"
  primera_vez = true
WHERE email = (
  SELECT email FROM acudientes WHERE username = 'ACU031' LIMIT 1
)
AND activo = true;
*/

-- ============================================
-- VERIFICAR HASHES CONOCIDOS
-- ============================================

-- Hash de "temporal123": a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
-- Hash de "123456": 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

-- Para generar un nuevo hash SHA-256, puedes usar:
-- SELECT encode(digest('tu_contraseña', 'sha256'), 'hex');

-- ============================================
-- DIAGNÓSTICO: Ver todos los acudientes con problemas de contraseña
-- ============================================

-- Ver acudientes cuyo hash no coincide con los conocidos:
/*
SELECT 
  username,
  email,
  password_hash,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'OK: temporal123'
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN 'OK: 123456'
    ELSE 'PROBLEMA: Hash desconocido'
  END as estado
FROM acudientes
WHERE activo = true
ORDER BY 
  CASE 
    WHEN password_hash NOT IN (
      'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
      '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'
    ) THEN 0
    ELSE 1
  END,
  username;
*/
