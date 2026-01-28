-- ============================================
-- MIGRACIÓN: Agregar columnas de revisión a sesiones_creatividad
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Agregar columna solicitar_revision si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sesiones_creatividad' AND column_name = 'solicitar_revision'
  ) THEN
    ALTER TABLE sesiones_creatividad ADD COLUMN solicitar_revision BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Agregar columna fecha_solicitud_revision si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sesiones_creatividad' AND column_name = 'fecha_solicitud_revision'
  ) THEN
    ALTER TABLE sesiones_creatividad ADD COLUMN fecha_solicitud_revision TIMESTAMPTZ;
  END IF;
END $$;

-- Agregar columna calificacion_docente si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sesiones_creatividad' AND column_name = 'calificacion_docente'
  ) THEN
    ALTER TABLE sesiones_creatividad ADD COLUMN calificacion_docente NUMERIC(5,2);
  END IF;
END $$;

-- Agregar columna docente_calificador_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sesiones_creatividad' AND column_name = 'docente_calificador_id'
  ) THEN
    ALTER TABLE sesiones_creatividad ADD COLUMN docente_calificador_id UUID REFERENCES usuarios(id);
  END IF;
END $$;

-- Agregar columna fecha_calificacion si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sesiones_creatividad' AND column_name = 'fecha_calificacion'
  ) THEN
    ALTER TABLE sesiones_creatividad ADD COLUMN fecha_calificacion TIMESTAMPTZ;
  END IF;
END $$;

-- Agregar columna comentario_docente si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sesiones_creatividad' AND column_name = 'comentario_docente'
  ) THEN
    ALTER TABLE sesiones_creatividad ADD COLUMN comentario_docente TEXT;
  END IF;
END $$;

-- Actualizar constraint de estado para incluir nuevos estados
-- Primero eliminamos el constraint existente si hay
ALTER TABLE sesiones_creatividad DROP CONSTRAINT IF EXISTS sesiones_creatividad_estado_check;

-- Agregamos el nuevo constraint con todos los estados
ALTER TABLE sesiones_creatividad ADD CONSTRAINT sesiones_creatividad_estado_check CHECK (
  estado IN ('en_progreso', 'visualizado', 'finalizada', 'pendiente_revision', 'calificada')
);

-- Agregar constraint de validación de calificación
ALTER TABLE sesiones_creatividad DROP CONSTRAINT IF EXISTS sesiones_creatividad_calificacion_check;
ALTER TABLE sesiones_creatividad ADD CONSTRAINT sesiones_creatividad_calificacion_check CHECK (
  calificacion_docente IS NULL OR (calificacion_docente >= 0 AND calificacion_docente <= 100)
);

-- Crear índice para búsqueda de pendientes
CREATE INDEX IF NOT EXISTS idx_sesiones_creatividad_pendiente_revision 
ON sesiones_creatividad(estado) WHERE estado = 'pendiente_revision';

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sesiones_creatividad'
ORDER BY ordinal_position;
