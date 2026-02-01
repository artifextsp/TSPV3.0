-- ============================================
-- CORREGIR HASHES DE TODOS LOS ACUDIENTES
-- Thinking Skills Program v2
-- ============================================
--
-- OBJETIVO: Poner en todos los acudientes el hash correcto de la
-- contraseña temporal "temporal123" para que puedan acceder al dashboard.
--
-- Este script solo actualiza columnas que EXISTEN en tu tabla acudientes.
-- Si no estás seguro de la estructura, ejecuta antes:
--   scripts/radiografia_estructura_acudientes.sql
--
-- Hash correcto de "temporal123": 70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d
--
-- Después de ejecutar: Usuario = username (ej. ACU037), Contraseña = temporal123
-- ============================================

DO $$
DECLARE
  v_set_clauses TEXT := '';
  v_sql TEXT;
  v_has_password_hash BOOLEAN;
  v_has_primera_vez BOOLEAN;
  v_has_updated_at BOOLEAN;
BEGIN
  -- Si no existe password_hash, crearla (el login la necesita)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE acudientes ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'Columna password_hash añadida a acudientes';
  END IF;

  -- Detectar qué columnas existen (ahora password_hash existe seguro)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'password_hash'
  ) INTO v_has_password_hash;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'primera_vez'
  ) INTO v_has_primera_vez;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'updated_at'
  ) INTO v_has_updated_at;

  -- Construir solo los SET de columnas que existen
  IF v_has_password_hash THEN
    v_set_clauses := v_set_clauses || ' password_hash = ''70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d''';
  END IF;
  IF v_has_primera_vez THEN
    IF v_set_clauses != '' THEN v_set_clauses := v_set_clauses || ','; END IF;
    v_set_clauses := v_set_clauses || ' primera_vez = true';
  END IF;
  IF v_has_updated_at THEN
    IF v_set_clauses != '' THEN v_set_clauses := v_set_clauses || ','; END IF;
    v_set_clauses := v_set_clauses || ' updated_at = NOW()';
  END IF;

  IF v_set_clauses = '' THEN
    RAISE EXCEPTION 'En la tabla acudientes no existe ninguna de: password_hash, primera_vez, updated_at. Ejecuta radiografia_estructura_acudientes.sql para ver las columnas.';
  END IF;

  v_sql := 'UPDATE acudientes SET ' || v_set_clauses || ' WHERE activo = true';
  RAISE NOTICE 'Ejecutando: %', v_sql;
  EXECUTE v_sql;

  RAISE NOTICE 'Actualizados % filas en acudientes (activo = true)', (SELECT COUNT(*) FROM acudientes WHERE activo = true);
END $$;

-- ============================================
-- VERIFICACIÓN (opcional: ejecuta solo si tu tabla tiene password_hash)
-- ============================================
/*
SELECT
  username,
  email,
  LEFT(password_hash, 20) || '...' AS hash_preview,
  LENGTH(password_hash) AS longitud_hash,
  CASE
    WHEN password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d'
    THEN 'OK – contraseña: temporal123'
    ELSE 'Revisar'
  END AS estado
FROM acudientes
WHERE activo = true
ORDER BY username;
*/

-- ============================================
-- RESUMEN
-- ============================================
-- Usuario: ACU037 (o el username de cada acudiente)
-- Contraseña: temporal123 (todo en minúsculas, sin espacios)
-- ============================================
