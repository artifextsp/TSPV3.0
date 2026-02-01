-- ============================================
-- ACUDIENTES vs ESTUDIANTES REALES (TSP)
-- Thinking Skills Program v2
-- ============================================
--
-- Objetivo: Ver qué acudientes están vinculados a estudiantes reales
-- y cuáles son solo datos de muestra (sample.edu.co, etc.).
--
-- Ejecuta cada bloque por separado si hace falta.
-- ============================================

-- 1) Dominios de email en USUARIOS (para ver qué dominios hay en tu base)
--    Así ves qué dominio usan estudiantes / usuarios "reales" del TSP
SELECT
  split_part(u.email, '@', 2) AS dominio,
  COUNT(*) AS cantidad,
  string_agg(COALESCE(u.nombre, u.email), ', ' ORDER BY COALESCE(u.nombre, u.email)) AS ejemplos
FROM usuarios u
WHERE u.email IS NOT NULL AND u.email != ''
GROUP BY 1
ORDER BY 2 DESC;

-- 2) Acudientes por dominio (los que tienes ahora)
SELECT
  split_part(a.email, '@', 2) AS dominio_acudientes,
  COUNT(*) AS cantidad,
  string_agg(a.username || ' ' || a.nombre || ' ' || a.apellidos, ', ' ORDER BY a.username) AS acudientes
FROM acudientes a
WHERE a.activo = true
GROUP BY 1
ORDER BY 2 DESC;

-- 3) Cómo se relacionan acudientes con estudiantes en tu esquema
--    (acudientes.usuario_id -> usuarios; a.estudiante_id -> usuario estudiante si existe)
SELECT
  a.id AS acudiente_id,
  a.username,
  a.email AS acudiente_email,
  a.nombre || ' ' || COALESCE(a.apellidos, '') AS acudiente_nombre,
  a.usuario_id,
  a.estudiante_id AS estudiante_id_en_acudientes,
  u_est.nombre AS estudiante_nombre,
  u_est.email AS estudiante_email
FROM acudientes a
LEFT JOIN usuarios u_est ON u_est.id = a.estudiante_id
WHERE a.activo = true
ORDER BY a.username
LIMIT 30;

-- 4) Desactivar SOLO acudientes de dominios de prueba (sample)
--    Descomenta y ejecuta si quieres que no aparezcan en login/listados
/*
UPDATE acudientes
SET activo = false,
    updated_at = NOW()
WHERE email LIKE '%@sample.edu.co%';
*/

-- 5) Opción: desactivar todos los que NO sean de tu dominio real
--    Sustituye 'seminariopalmira.edu.co' por el dominio que consideres real
/*
UPDATE acudientes
SET activo = false,
    updated_at = NOW()
WHERE activo = true
  AND email NOT LIKE '%@seminariopalmira.edu.co%'
  AND email NOT LIKE '%@p.seminariopalmira.edu.co%';
*/
