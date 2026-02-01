-- ============================================
-- ASIGNAR USERNAMES A ACUDIENTES (ACU001, ACU002, ...)
-- Thinking Skills Program v2
-- ============================================
--
-- Tus acudientes tienen username = NULL. Pueden entrar con EMAIL + temporal123.
-- Si quieres que también tengan un username corto (ACU037, etc.), ejecuta este script.
--
-- Después podrán entrar con:
--   Usuario: ACU037  (o el que se asigne)
--   Contraseña: temporal123
--
-- O seguir usando: email + temporal123
-- ============================================

-- Asignar ACU001, ACU002, ACU003, ... por orden de created_at (o id)
WITH numerados AS (
  SELECT
    id,
    'ACU' || LPAD(ROW_NUMBER() OVER (ORDER BY COALESCE(created_at, '1970-01-01')::timestamptz, id)::text, 3, '0') AS nuevo_username
  FROM acudientes
  WHERE activo = true
    AND (username IS NULL OR username = '')
)
UPDATE acudientes a
SET username = n.nuevo_username,
    updated_at = NOW()
FROM numerados n
WHERE n.id = a.id;

-- Ver resultado
SELECT
  username,
  email,
  nombre,
  apellidos,
  activo
FROM acudientes
WHERE activo = true
ORDER BY username
LIMIT 25;
