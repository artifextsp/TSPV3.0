-- ============================================
-- VERIFICAR CREDENCIALES DE EMILY PEÑA ROBLES
-- EST0046
-- ============================================

-- Verificar datos del usuario Emily
SELECT 
  codigo_estudiante,
  nombre,
  apellidos,
  email,
  activo,
  primera_vez,
  tipo_usuario,
  password_hash,
  -- Verificar qué contraseña tiene
  CASE 
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '123456'
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    ELSE 'Contraseña personalizada'
  END as contraseña_actual
FROM usuarios
WHERE codigo_estudiante = 'EST0046'
   OR email = 'constanza.robles@seminariopalmira.edu.co'
   OR nombre ILIKE '%EMILY%';

-- ============================================
-- SOLUCIÓN: ASIGNAR CONTRASEÑA TEMPORAL
-- ============================================

-- Si Emily necesita una contraseña temporal para acceder:
-- Opción 1: Asignar "temporal123" (recomendado para primera vez)
UPDATE usuarios
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    primera_vez = true
WHERE codigo_estudiante = 'EST0046'
  AND activo = true;

-- Opción 2: Asignar "123456" (si prefieres esta)
-- UPDATE usuarios
-- SET password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
--     primera_vez = false
-- WHERE codigo_estudiante = 'EST0046'
--   AND activo = true;

-- ============================================
-- VERIFICAR DESPUÉS DE ACTUALIZAR
-- ============================================

SELECT 
  codigo_estudiante,
  nombre || ' ' || COALESCE(apellidos, '') as nombre_completo,
  email,
  CASE 
    WHEN password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' THEN '123456'
    WHEN password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' THEN 'temporal123'
    ELSE 'Personalizada'
  END as contraseña,
  primera_vez,
  activo
FROM usuarios
WHERE codigo_estudiante = 'EST0046';
