-- ============================================================
-- MIGRACIÓN: Sistema de Validación Docente para Ejercicios Digitales
-- Thinking Skills Program v2
-- ============================================================
--
-- Añade estado_validacion a resultados_juegos para que el docente
-- apruebe o rechace el puntaje registrado por el estudiante.
--
-- Estados: pendiente → aprobado | rechazado
-- ============================================================

-- ╔════════════════════════════════════════════════════════════╗
-- ║  1. AÑADIR COLUMNA estado_validacion                       ║
-- ╚════════════════════════════════════════════════════════════╝

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'resultados_juegos'
      AND column_name = 'estado_validacion'
  ) THEN
    ALTER TABLE resultados_juegos
      ADD COLUMN estado_validacion VARCHAR(20) DEFAULT 'aprobado';
    RAISE NOTICE 'Columna estado_validacion creada.';
  ELSE
    RAISE NOTICE 'La columna estado_validacion ya existe.';
  END IF;
END $$;

-- Constraint para valores válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'resultados_juegos'
      AND constraint_name = 'resultados_juegos_estado_validacion_check'
  ) THEN
    ALTER TABLE resultados_juegos
      ADD CONSTRAINT resultados_juegos_estado_validacion_check
      CHECK (estado_validacion IN ('pendiente', 'aprobado', 'rechazado'));
    RAISE NOTICE 'Constraint estado_validacion creada.';
  END IF;
END $$;

-- ╔════════════════════════════════════════════════════════════╗
-- ║  2. AÑADIR COLUMNA comentario_docente (motivo rechazo)     ║
-- ╚════════════════════════════════════════════════════════════╝

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'resultados_juegos'
      AND column_name = 'comentario_docente'
  ) THEN
    ALTER TABLE resultados_juegos ADD COLUMN comentario_docente TEXT;
    RAISE NOTICE 'Columna comentario_docente creada.';
  ELSE
    RAISE NOTICE 'La columna comentario_docente ya existe.';
  END IF;
END $$;

-- ╔════════════════════════════════════════════════════════════╗
-- ║  3. ÍNDICE PARA CONSULTAS DE PENDIENTES                    ║
-- ╚════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_resultados_juegos_estado_validacion
  ON resultados_juegos(estado_validacion)
  WHERE estado_validacion = 'pendiente';

-- ╔════════════════════════════════════════════════════════════╗
-- ║  4. REGISTROS EXISTENTES: MARCAR COMO APROBADOS            ║
-- ╚════════════════════════════════════════════════════════════╝

-- Los registros anteriores a esta migración se marcan como aprobados
UPDATE resultados_juegos
SET estado_validacion = 'aprobado'
WHERE estado_validacion IS NULL;

-- ╔════════════════════════════════════════════════════════════╗
-- ║  5. VERIFICACIÓN                                           ║
-- ╚════════════════════════════════════════════════════════════╝

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'resultados_juegos'
  AND column_name IN ('estado_validacion', 'comentario_docente', 'verificado_por_docente', 'docente_verificador_id');

SELECT estado_validacion, COUNT(*) AS total
FROM resultados_juegos
GROUP BY estado_validacion;
