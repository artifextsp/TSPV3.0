-- ============================================
-- ADAPTAR acudientes A LOGIN (tu estructura real)
-- Thinking Skills Program v2
-- ============================================
--
-- Tu tabla acudientes tiene: id, usuario_id, parentesco, telefono_1, etc.
-- NO tiene: username, password_hash, email, nombre, apellidos (están en usuarios).
--
-- Este script:
-- 1. Añade a acudientes las columnas que el login necesita.
-- 2. Las rellena desde usuarios (acudientes.usuario_id = usuarios.id).
-- 3. Pone el hash correcto de "temporal123" para que puedan entrar.
--
-- Después: Usuario = username (ej. ACU037), Contraseña = temporal123
-- ============================================

-- ============================================
-- PASO 1: Añadir columnas que faltan en acudientes
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'username') THEN
    ALTER TABLE acudientes ADD COLUMN username TEXT;
    RAISE NOTICE 'Columna username añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'password_hash') THEN
    ALTER TABLE acudientes ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'Columna password_hash añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'email') THEN
    ALTER TABLE acudientes ADD COLUMN email TEXT;
    RAISE NOTICE 'Columna email añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'nombre') THEN
    ALTER TABLE acudientes ADD COLUMN nombre TEXT;
    RAISE NOTICE 'Columna nombre añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'apellidos') THEN
    ALTER TABLE acudientes ADD COLUMN apellidos TEXT;
    RAISE NOTICE 'Columna apellidos añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'celular') THEN
    ALTER TABLE acudientes ADD COLUMN celular TEXT;
    RAISE NOTICE 'Columna celular añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'estudiante_id') THEN
    ALTER TABLE acudientes ADD COLUMN estudiante_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
    RAISE NOTICE 'Columna estudiante_id añadida a acudientes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'primera_vez') THEN
    ALTER TABLE acudientes ADD COLUMN primera_vez BOOLEAN DEFAULT true;
    RAISE NOTICE 'Columna primera_vez añadida a acudientes';
  END IF;
END $$;

-- ============================================
-- PASO 2: Copiar de usuarios a acudientes (por usuario_id)
-- ============================================
-- Solo actualiza columnas que existan en usuarios; si alguna no existe, ignórala.

DO $$
DECLARE
  v_has_username BOOLEAN;
  v_has_password_hash BOOLEAN;
  v_has_email BOOLEAN;
  v_has_nombre BOOLEAN;
  v_has_apellidos BOOLEAN;
  v_has_celular BOOLEAN;
  v_has_primera_vez BOOLEAN;
  v_sql TEXT;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'username') INTO v_has_username;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'password_hash') INTO v_has_password_hash;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'email') INTO v_has_email;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'nombre') INTO v_has_nombre;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'apellidos') INTO v_has_apellidos;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'celular') INTO v_has_celular;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'primera_vez') INTO v_has_primera_vez;

  v_sql := 'UPDATE acudientes a SET ';
  IF v_has_username THEN v_sql := v_sql || ' username = u.username,'; END IF;
  IF v_has_password_hash THEN v_sql := v_sql || ' password_hash = u.password_hash,'; END IF;
  IF v_has_email THEN v_sql := v_sql || ' email = u.email,'; END IF;
  IF v_has_nombre THEN v_sql := v_sql || ' nombre = u.nombre,'; END IF;
  IF v_has_apellidos THEN v_sql := v_sql || ' apellidos = u.apellidos,'; END IF;
  IF v_has_celular THEN v_sql := v_sql || ' celular = u.celular,'; END IF;
  IF v_has_primera_vez THEN v_sql := v_sql || ' primera_vez = COALESCE(u.primera_vez, true),'; END IF;
  v_sql := rtrim(v_sql, ',');
  v_sql := v_sql || ' FROM usuarios u WHERE u.id = a.usuario_id';
  EXECUTE v_sql;
  RAISE NOTICE 'Datos copiados de usuarios a acudientes';
END $$;

-- ============================================
-- PASO 3: Poner hash correcto de "temporal123" en acudientes
-- ============================================
-- Hash SHA-256 de "temporal123" (hex, 64 caracteres)

UPDATE acudientes
SET password_hash = '70377138643d0202a812e157660761a559dc721db5eff1144d23a5b2aa4a0a3d',
    primera_vez = true,
    updated_at = NOW()
WHERE activo = true;

-- ============================================
-- PASO 4: Índice para buscar por username (login)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_acudientes_username ON acudientes(username) WHERE username IS NOT NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT
  a.id,
  a.username,
  a.email,
  LEFT(a.password_hash, 20) || '...' AS hash_preview,
  a.nombre,
  a.apellidos,
  a.activo
FROM acudientes a
WHERE a.activo = true
ORDER BY a.username
LIMIT 20;

-- ============================================
-- RESUMEN
-- ============================================
-- Después de ejecutar:
--   Usuario: el username que esté en usuarios (ej. ACU037)
--   Contraseña: temporal123
--
-- Si el username en usuarios no es ACU037, el acudiente debe entrar con
-- el username que tenga el usuario vinculado (usuario_id).
-- ============================================
