-- ============================================
-- AÑADIR codigo_estudiante (y grado) A usuarios
-- Proyecto: gjtlgxvjecbqyatleptm
-- ============================================
-- Ejecuta en Supabase → SQL Editor (todo el archivo).
-- El dashboard admin espera usuarios.codigo_estudiante y usuarios.grado.
-- ============================================

-- 1. Añadir columna codigo_estudiante si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'codigo_estudiante') THEN
    ALTER TABLE usuarios ADD COLUMN codigo_estudiante TEXT;
    CREATE INDEX IF NOT EXISTS idx_usuarios_codigo_estudiante ON usuarios(codigo_estudiante);
    RAISE NOTICE 'Columna codigo_estudiante añadida a usuarios';
  END IF;
END $$;

-- 2. Añadir columna grado si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'grado') THEN
    ALTER TABLE usuarios ADD COLUMN grado TEXT;
    RAISE NOTICE 'Columna grado añadida a usuarios';
  END IF;
END $$;

-- 3. Asignar codigo_estudiante (EST0001, EST0002...) a usuarios que sean estudiantes
--    Si tienes columna tipo_usuario, se usan tipo_usuario IN ('estudiante','usuario'); si no, se actualizan todos los activos.
DO $$
DECLARE
  v_has_tipo BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'tipo_usuario') INTO v_has_tipo;

  IF v_has_tipo THEN
    WITH ord AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY email, id) AS rn
      FROM usuarios
      WHERE activo = true AND (tipo_usuario IN ('estudiante','usuario') OR tipo_usuario IS NULL)
        AND (codigo_estudiante IS NULL OR codigo_estudiante = '')
    )
    UPDATE usuarios u SET codigo_estudiante = 'EST' || LPAD(ord.rn::TEXT, 4, '0')
    FROM ord WHERE u.id = ord.id;
  ELSE
    WITH ord AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY email, id) AS rn
      FROM usuarios
      WHERE activo = true AND (codigo_estudiante IS NULL OR codigo_estudiante = '')
    )
    UPDATE usuarios u SET codigo_estudiante = 'EST' || LPAD(ord.rn::TEXT, 4, '0')
    FROM ord WHERE u.id = ord.id;
  END IF;
END $$;

-- 4. Verificación
SELECT codigo_estudiante, email, nombre, grado FROM usuarios WHERE activo = true ORDER BY codigo_estudiante LIMIT 10;
