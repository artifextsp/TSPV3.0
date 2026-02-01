-- ============================================
-- DESACTIVAR ACUDIENTES DE OTRA BASE (ludens.app)
-- Thinking Skills Program v2
-- ============================================
--
-- Desactiva solo los acudientes con email @acudiente.ludens.app
-- para que no aparezcan en el login ni en listados.
-- No borra datos; solo pone activo = false.
--
-- ============================================

-- Ver qué se va a desactivar
SELECT id, username, email, nombre, apellidos, activo
FROM acudientes
WHERE email LIKE '%@acudiente.ludens.app%';

-- Desactivar
UPDATE acudientes
SET activo = false,
    updated_at = NOW()
WHERE email LIKE '%@acudiente.ludens.app%';

-- Verificación: acudientes activos por dominio
SELECT
  CASE
    WHEN email LIKE '%@seminario.edu.co' THEN 'seminario.edu.co'
    WHEN email LIKE '%@sample.edu.co' THEN 'sample.edu.co'
    ELSE split_part(email, '@', 2)
  END AS dominio,
  COUNT(*) AS cantidad,
  string_agg(username || ' – ' || nombre || ' ' || apellidos, ', ' ORDER BY username) AS acudientes
FROM acudientes
WHERE activo = true
GROUP BY 1
ORDER BY 1;
