-- ============================================
-- CORREGIR HASH DE CONTRASEÑA "temporal123"
-- Thinking Skills Program v2
-- ============================================
-- 
-- PROBLEMA DETECTADO:
-- El hash almacenado 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
-- es el hash de "123", NO de "temporal123"
-- 
-- Hash correcto de "temporal123": 
-- 70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script para corregir el hash de todos los acudientes
-- 2. Después de ejecutar, los acudientes podrán acceder con "temporal123"
-- ============================================

-- ============================================
-- PASO 1: VERIFICAR ESTADO ACTUAL
-- ============================================

SELECT 
  username,
  email,
  password_hash,
  CASE 
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN '❌ Hash de "123" (INCORRECTO)'
    WHEN password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d' THEN '✅ Hash de "temporal123" (CORRECTO)'
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '✅ Hash de "123456"'
    ELSE '❓ Hash desconocido'
  END as estado_actual,
  COUNT(*) OVER() as total_registros
FROM acudientes
WHERE activo = true
ORDER BY username
LIMIT 20;

-- ============================================
-- PASO 2: CORREGIR HASH DE "temporal123"
-- ============================================

-- Hash CORRECTO de "temporal123": 70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d
-- Hash INCORRECTO que estaba (es de "123"): a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3

UPDATE acudientes
SET 
  password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d',  -- Hash CORRECTO de "temporal123"
  primera_vez = true
WHERE password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'  -- Hash de "123" (incorrecto)
  AND activo = true;

-- ============================================
-- PASO 3: VERIFICAR CORRECCIÓN
-- ============================================

SELECT 
  username,
  email,
  CASE 
    WHEN password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d' THEN '✅ CORRECTO - temporal123'
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN '❌ AÚN INCORRECTO - 123'
    ELSE '❓ Otro hash'
  END as estado,
  COUNT(*) as cantidad
FROM acudientes
WHERE activo = true
GROUP BY username, email, password_hash
ORDER BY estado, username;

-- ============================================
-- PASO 4: CORREGIR ACUDIENTES ESPECÍFICOS (si es necesario)
-- ============================================

-- Para corregir ACU031 específicamente:
/*
UPDATE acudientes
SET 
  password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d',
  primera_vez = true
WHERE username = 'ACU031'
  AND activo = true;
*/

-- Para corregir ACU048 específicamente:
/*
UPDATE acudientes
SET 
  password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d',
  primera_vez = true
WHERE username = 'ACU048'
  AND activo = true;
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- Hash correcto de "temporal123": 70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d
-- Hash incorrecto (era de "123"): a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
-- 
-- Después de ejecutar este script, los acudientes podrán acceder con:
-- Username: ACU031, ACU048, etc.
-- Contraseña: temporal123
-- 
-- ============================================
