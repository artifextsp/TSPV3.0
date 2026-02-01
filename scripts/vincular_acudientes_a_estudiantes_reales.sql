-- ============================================
-- VINCULAR ACUDIENTES A ESTUDIANTES REALES
-- Thinking Skills Program v2
-- ============================================
--
-- Los estudiantes reales (EST0001, EST0004, etc.) están en la base,
-- pero acudientes.estudiante_id está vacío, por eso el dashboard
-- del acudiente no los "detecta".
--
-- Este script:
-- 1. Lista los estudiantes que podrían ser los reales (por email o código).
-- 2. Lista los acudientes activos.
-- 3. Te da ejemplos de UPDATE para vincular acudiente → estudiante.
--
-- Después de vincular, cuando el acudiente entre con su usuario,
-- verá a su hijo en el dashboard.
-- ============================================

-- 1) Listar posibles ESTUDIANTES reales (por email seminariopalmira)
SELECT id AS estudiante_id,
       nombre,
       apellidos,
       email
FROM usuarios
WHERE activo = true
  AND (
    email ILIKE '%@p.seminariopalmira.edu.co'
    OR email ILIKE '%@seminariopalmira.edu.co'
  )
ORDER BY email
LIMIT 50;

-- 2) Listar ACUDIENTES activos (para saber username/id y vincularlos)
SELECT id AS acudiente_id,
       username,
       email,
       nombre || ' ' || COALESCE(apellidos, '') AS acudiente_nombre,
       estudiante_id AS estudiante_actual
FROM acudientes
WHERE activo = true
ORDER BY username;

-- 3) EJEMPLO: Vincular UN acudiente a UN estudiante
--    Sustituye los valores y ejecuta (repite por cada vínculo que quieras).
--
-- Opción A: Por ID del estudiante (cópialo de la consulta 1)
/*
UPDATE acudientes
SET estudiante_id = 'UUID-DEL-ESTUDIANTE-AQUI',
    updated_at = NOW()
WHERE username = 'ACU001';
*/

-- Opción B: Por email del estudiante (si conoces el email del hijo)
/*
UPDATE acudientes
SET estudiante_id = (SELECT id FROM usuarios WHERE email = 'estudiante@p.seminariopalmira.edu.co' AND activo = true LIMIT 1),
    updated_at = NOW()
WHERE username = 'ACU001';
*/

-- 4) Si un acudiente tiene VARIOS hijos: crear una fila por cada hijo
--    (Cada fila en acudientes = un vínculo acudiente–estudiante.)
--    Sustituye el email del estudiante o usa el id del estudiante.
/*
INSERT INTO acudientes (
  usuario_id, email, nombre, apellidos, username, password_hash,
  estudiante_id, activo, parentesco, telefono_1, created_at, updated_at
)
SELECT
  a.usuario_id, a.email, a.nombre, a.apellidos, a.username, a.password_hash,
  (SELECT id FROM usuarios WHERE email = 'segundo_hijo@p.seminariopalmira.edu.co' AND activo = true LIMIT 1),
  true, a.parentesco, a.telefono_1, NOW(), NOW()
FROM acudientes a
WHERE a.username = 'ACU001'
LIMIT 1;
*/

-- 5) Verificar vínculos después de actualizar
SELECT
  a.username,
  a.email AS acudiente_email,
  a.nombre || ' ' || COALESCE(a.apellidos, '') AS acudiente_nombre,
  u.nombre || ' ' || COALESCE(u.apellidos, '') AS estudiante_nombre,
  u.email AS estudiante_email
FROM acudientes a
LEFT JOIN usuarios u ON u.id = a.estudiante_id
WHERE a.activo = true
ORDER BY a.username;
