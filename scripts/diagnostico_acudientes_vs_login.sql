-- ============================================
-- DIAGNÓSTICO: ¿De dónde sale lo que ve el admin?
-- Acudientes: filas con estudiante_id vs filas usadas en login
-- ============================================
--
-- La app (admin y acudiente) usa SIEMPRE la tabla acudientes y la columna estudiante_id.
-- Si en el admin ves acudientes con hijos, es porque esas filas tienen estudiante_id.
--
-- Este script muestra:
-- 1. Filas que SÍ tienen hijo (estudiante_id) → son las que el admin muestra con hijo.
-- 2. Filas que NO tienen hijo (estudiante_id null).
-- 3. Por email: si el mismo acudiente tiene varias filas (unas con hijo, otras sin).
--    Eso explicaría: admin ve "acudiente X con hijo" pero al entrar como acudiente no ve hijo
--    (porque el login puede estar usando otra fila del mismo email con estudiante_id null).
-- ============================================

-- 1) Resumen: cuántas filas tienen estudiante_id y cuántas no
SELECT
  'Con estudiante_id' AS tipo,
  COUNT(*) AS cantidad
FROM acudientes
WHERE activo = true
  AND estudiante_id IS NOT NULL

UNION ALL

SELECT
  'Sin estudiante_id (estudiante_id null)' AS tipo,
  COUNT(*)
FROM acudientes
WHERE activo = true
  AND estudiante_id IS NULL;

-- 2) Por email: acudientes con varias filas (mismo email, distintas filas)
--    y si alguna tiene estudiante_id y otra no
SELECT
  a.email,
  COUNT(*) AS total_filas,
  COUNT(a.estudiante_id) AS filas_con_estudiante_id,
  COUNT(*) - COUNT(a.estudiante_id) AS filas_sin_estudiante_id,
  STRING_AGG(DISTINCT a.username, ', ') AS usernames
FROM acudientes a
WHERE a.activo = true
GROUP BY a.email
HAVING COUNT(*) > 1
   OR (COUNT(*) = 1 AND COUNT(a.estudiante_id) = 0)
ORDER BY total_filas DESC, a.email;

-- 3) Listado que coincide con lo que ve el admin (filas con hijo)
SELECT
  a.username,
  a.email,
  a.nombre || ' ' || COALESCE(a.apellidos, '') AS acudiente_nombre,
  u.codigo_estudiante AS hijo_codigo,
  u.nombre || ' ' || COALESCE(u.apellidos, '') AS hijo_nombre
FROM acudientes a
JOIN usuarios u ON u.id = a.estudiante_id
WHERE a.activo = true
ORDER BY a.username;

-- 4) Listado de filas SIN hijo (estas son las que hacen que el acudiente vea "Sin estudiantes asociados" si hace login con esa fila)
SELECT
  a.id,
  a.username,
  a.email,
  a.nombre || ' ' || COALESCE(a.apellidos, '') AS acudiente_nombre,
  a.estudiante_id AS estudiante_id_actual
FROM acudientes a
WHERE a.activo = true
  AND a.estudiante_id IS NULL
ORDER BY a.username;
