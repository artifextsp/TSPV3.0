-- ============================================
-- ASOCIAR MÚLTIPLES HIJOS A UN ACUDIENTE
-- Thinking Skills Program v2.0
-- ============================================
-- 
-- Este script te permite asociar varios estudiantes (hijos) a un mismo acudiente.
-- 
-- IMPORTANTE: Un acudiente puede tener múltiples hijos. El sistema funciona así:
-- - Un registro en `acudientes` por cada hijo
-- - Todos los registros tienen el mismo `email`, `nombre`, `apellidos`
-- - Cada registro tiene un `estudiante_id` diferente
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta las consultas de ejemplo abajo
-- 2. O usa la función `asociar_hijo_a_acudiente()` para asociar hijos uno por uno
-- ============================================

-- ============================================
-- FUNCIÓN: Asociar un hijo a un acudiente existente
-- ============================================

CREATE OR REPLACE FUNCTION asociar_hijo_a_acudiente(
  p_email_acudiente TEXT,
  p_estudiante_id UUID,
  p_password_hash TEXT DEFAULT 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'  -- temporal123
) RETURNS UUID AS $$
DECLARE
  v_acudiente_existente RECORD;
  v_nuevo_id UUID;
BEGIN
  -- Buscar si ya existe un registro del acudiente (para copiar sus datos)
  SELECT * INTO v_acudiente_existente
  FROM acudientes
  WHERE email = LOWER(TRIM(p_email_acudiente))
    AND activo = true
  LIMIT 1;
  
  -- Si no existe ningún registro del acudiente, error
  IF v_acudiente_existente IS NULL THEN
    RAISE EXCEPTION 'No existe un acudiente con el email: %', p_email_acudiente;
  END IF;
  
  -- Verificar que el estudiante existe
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_estudiante_id AND tipo_usuario = 'estudiante') THEN
    RAISE EXCEPTION 'El estudiante con ID % no existe', p_estudiante_id;
  END IF;
  
  -- Verificar que no existe ya la asociación
  IF EXISTS (
    SELECT 1 FROM acudientes 
    WHERE email = LOWER(TRIM(p_email_acudiente)) 
      AND estudiante_id = p_estudiante_id
  ) THEN
    RAISE EXCEPTION 'El estudiante ya está asociado a este acudiente';
  END IF;
  
  -- Crear nuevo registro con los mismos datos del acudiente pero diferente estudiante_id
  INSERT INTO acudientes (
    nombre,
    apellidos,
    email,
    celular,
    password_hash,
    username,
    estudiante_id,
    activo,
    primera_vez,
    created_at,
    updated_at
  ) VALUES (
    v_acudiente_existente.nombre,
    v_acudiente_existente.apellidos,
    LOWER(TRIM(p_email_acudiente)),
    v_acudiente_existente.celular,
    COALESCE(p_password_hash, v_acudiente_existente.password_hash),
    NULL,  -- El username se asignará después si es necesario
    p_estudiante_id,
    true,
    false,  -- No es primera vez si ya existe el acudiente
    NOW(),
    NOW()
  )
  RETURNING id INTO v_nuevo_id;
  
  RETURN v_nuevo_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EJEMPLOS DE USO
-- ============================================

-- Ejemplo 1: Asociar un hijo adicional a un acudiente existente
-- (Reemplaza el email y el UUID del estudiante)
/*
SELECT asociar_hijo_a_acudiente(
  'email@ejemplo.com',           -- Email del acudiente existente
  'uuid-del-estudiante-aqui'     -- ID del nuevo hijo a asociar
);
*/

-- Ejemplo 2: Ver todos los hijos de un acudiente
/*
SELECT 
  a.email,
  a.nombre || ' ' || a.apellidos as acudiente,
  u.codigo_estudiante,
  u.nombre || ' ' || u.apellidos as estudiante,
  u.grado
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.email = 'email@ejemplo.com'
  AND a.activo = true
ORDER BY u.grado, u.nombre;
*/

-- Ejemplo 3: Consolidar acudientes duplicados
-- (Si creaste acudientes duplicados con diferentes emails para el mismo padre)
/*
-- Paso 1: Identificar acudientes duplicados (mismo nombre pero diferente email)
SELECT 
  nombre || ' ' || apellidos as nombre_completo,
  COUNT(DISTINCT email) as emails_diferentes,
  COUNT(*) as total_registros,
  array_agg(DISTINCT email) as emails
FROM acudientes
WHERE activo = true
GROUP BY nombre, apellidos
HAVING COUNT(DISTINCT email) > 1;

-- Paso 2: Elegir un email principal y asociar todos los hijos a ese email
-- (Ejemplo: si tienes "maria@email1.com" y "maria@email2.com", elige uno)
-- Luego ejecuta para cada hijo del email secundario:
SELECT asociar_hijo_a_acudiente(
  'email-principal@ejemplo.com',  -- Email que quieres mantener
  estudiante_id                    -- ID del hijo del email secundario
)
FROM acudientes
WHERE email = 'email-secundario@ejemplo.com'
  AND activo = true;

-- Paso 3: Desactivar los registros del email secundario
UPDATE acudientes
SET activo = false
WHERE email = 'email-secundario@ejemplo.com';
*/

-- ============================================
-- SCRIPT: Asociar múltiples hijos de una vez
-- ============================================

-- Este script asocia varios estudiantes a un acudiente en una sola operación
-- Útil cuando tienes una lista de códigos de estudiantes

CREATE OR REPLACE FUNCTION asociar_multiples_hijos(
  p_email_acudiente TEXT,
  p_codigos_estudiantes TEXT[]  -- Array de códigos: ARRAY['EST0046', 'EST0047', 'EST0048']
) RETURNS TABLE(
  codigo_estudiante TEXT,
  estudiante_nombre TEXT,
  resultado TEXT
) AS $$
DECLARE
  v_codigo TEXT;
  v_estudiante_id UUID;
  v_estudiante_nombre TEXT;
BEGIN
  FOREACH v_codigo IN ARRAY p_codigos_estudiantes
  LOOP
    -- Buscar estudiante por código
    SELECT id, nombre || ' ' || COALESCE(apellidos, '') INTO v_estudiante_id, v_estudiante_nombre
    FROM usuarios
    WHERE codigo_estudiante = v_codigo
      AND tipo_usuario = 'estudiante'
      AND activo = true
    LIMIT 1;
    
    IF v_estudiante_id IS NULL THEN
      RETURN QUERY SELECT v_codigo, 'No encontrado'::TEXT, 'ERROR: Estudiante no existe'::TEXT;
      CONTINUE;
    END IF;
    
    -- Intentar asociar
    BEGIN
      PERFORM asociar_hijo_a_acudiente(p_email_acudiente, v_estudiante_id);
      RETURN QUERY SELECT v_codigo, v_estudiante_nombre, 'OK: Asociado correctamente'::TEXT;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_codigo, v_estudiante_nombre, 'ERROR: ' || SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso de asociar_multiples_hijos:
/*
SELECT * FROM asociar_multiples_hijos(
  'email@ejemplo.com',
  ARRAY['EST0046', 'EST0047', 'EST0048']
);
*/

-- ============================================
-- VERIFICACIÓN Y DIAGNÓSTICO
-- ============================================

-- Ver acudientes con múltiples hijos
CREATE OR REPLACE VIEW vista_acudientes_multiples_hijos AS
SELECT 
  a.email,
  a.nombre || ' ' || a.apellidos as acudiente,
  COUNT(*) as cantidad_hijos,
  array_agg(u.codigo_estudiante ORDER BY u.grado, u.nombre) as codigos_estudiantes,
  array_agg(u.nombre || ' ' || COALESCE(u.apellidos, '') ORDER BY u.grado, u.nombre) as nombres_estudiantes
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
GROUP BY a.email, a.nombre, a.apellidos
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Ver todos los acudientes y sus hijos
CREATE OR REPLACE VIEW vista_acudientes_completa AS
SELECT 
  a.email,
  a.nombre || ' ' || a.apellidos as acudiente,
  a.username,
  COUNT(*) as cantidad_hijos,
  string_agg(u.codigo_estudiante || ' - ' || u.nombre || ' ' || COALESCE(u.apellidos, ''), ' | ' ORDER BY u.grado, u.nombre) as hijos
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
GROUP BY a.email, a.nombre, a.apellidos, a.username
ORDER BY a.email;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON FUNCTION asociar_hijo_a_acudiente IS 'Asocia un estudiante adicional a un acudiente existente. El acudiente debe existir previamente.';
COMMENT ON FUNCTION asociar_multiples_hijos IS 'Asocia múltiples estudiantes a un acudiente en una sola operación usando códigos de estudiantes.';
COMMENT ON VIEW vista_acudientes_multiples_hijos IS 'Muestra solo los acudientes que tienen más de un hijo asociado.';
COMMENT ON VIEW vista_acudientes_completa IS 'Vista completa de todos los acudientes y sus hijos asociados.';
