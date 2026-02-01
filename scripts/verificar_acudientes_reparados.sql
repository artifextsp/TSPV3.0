-- ============================================
-- VERIFICAR QUE TODOS LOS ACUDIENTES QUEDARON REPARADOS
-- Thinking Skills Program v2
-- ============================================
-- Ejecuta esto para ver cuántos acudientes hay y cuántos tienen
-- password_hash y username listos para login.
-- ============================================

-- 1) Totales
SELECT
  COUNT(*) AS total_acudientes,
  COUNT(*) FILTER (WHERE activo = true) AS activos,
  COUNT(*) FILTER (WHERE activo = true AND password_hash IS NOT NULL AND password_hash != '') AS con_password_hash,
  COUNT(*) FILTER (WHERE activo = true AND username IS NOT NULL AND username != '') AS con_username,
  COUNT(*) FILTER (WHERE activo = true AND (password_hash IS NULL OR password_hash = '')) AS sin_password_hash,
  COUNT(*) FILTER (WHERE activo = true AND (username IS NULL OR username = '')) AS sin_username
FROM acudientes;

-- 2) Hash correcto de "temporal123" (todos los activos deberían tenerlo)
SELECT
  COUNT(*) FILTER (WHERE activo = true AND password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d') AS con_hash_temporal123,
  COUNT(*) FILTER (WHERE activo = true AND (password_hash IS NULL OR password_hash != '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d')) AS con_otro_hash_o_null
FROM acudientes;

-- 3) Listado de activos que AÚN no tienen username (por si faltaron)
SELECT id, email, nombre, apellidos, activo, username, 
       CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'Sí' ELSE 'No' END AS tiene_password
FROM acudientes
WHERE activo = true
  AND (username IS NULL OR username = '')
ORDER BY email;

-- 4) Listado de activos que AÚN no tienen password_hash
SELECT id, username, email, nombre, apellidos, activo
FROM acudientes
WHERE activo = true
  AND (password_hash IS NULL OR password_hash = '')
ORDER BY email;
