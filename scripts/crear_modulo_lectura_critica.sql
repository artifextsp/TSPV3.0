-- ============================================
-- MÓDULO DE LECTURA CRÍTICA
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script crea las tablas necesarias para el módulo
-- de lectura crítica con ciclos, sesiones y resultados.
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Verifica que las tablas se crearon correctamente
-- ============================================

-- ============================================
-- TABLA: CICLOS DE LECTURA
-- ============================================
-- Almacena los ciclos de entrenamiento (contenido JSON)

CREATE TABLE IF NOT EXISTS ciclos_lectura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Número de ciclo (secuencial descendente)
  numero_ciclo INTEGER NOT NULL,
  
  -- Grado asignado (tercero, cuarto, quinto, etc.)
  grado TEXT NOT NULL,
  
  -- Título del ciclo (extraído del JSON)
  titulo TEXT NOT NULL,
  
  -- Contenido JSON completo
  contenido JSONB NOT NULL,
  
  -- Metadata extraída del JSON
  autor TEXT,
  anio INTEGER,
  resumen TEXT,
  conteo_palabras INTEGER,
  lexile TEXT,
  
  -- Estado del ciclo
  activo BOOLEAN DEFAULT false NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT ciclos_lectura_numero_grado_unique UNIQUE (numero_ciclo, grado)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_ciclos_lectura_grado ON ciclos_lectura(grado);
CREATE INDEX IF NOT EXISTS idx_ciclos_lectura_activo ON ciclos_lectura(activo);
CREATE INDEX IF NOT EXISTS idx_ciclos_lectura_numero ON ciclos_lectura(numero_ciclo DESC);

-- ============================================
-- TABLA: SESIONES DE LECTURA
-- ============================================
-- Almacena las sesiones de entrenamiento de cada estudiante

CREATE TABLE IF NOT EXISTS sesiones_lectura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  ciclo_id UUID NOT NULL REFERENCES ciclos_lectura(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Tiempos
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  fecha_fin_lectura TIMESTAMP WITH TIME ZONE,
  fecha_fin_sesion TIMESTAMP WITH TIME ZONE,
  
  -- Tiempo de lectura en segundos
  tiempo_lectura_segundos INTEGER,
  
  -- Resultados vocabulario (solo referencia)
  respuestas_vocabulario JSONB,
  aciertos_vocabulario INTEGER DEFAULT 0,
  total_vocabulario INTEGER DEFAULT 0,
  
  -- Resultados evaluación (para cálculos)
  respuestas_evaluacion JSONB,
  aciertos_evaluacion INTEGER DEFAULT 0,
  total_evaluacion INTEGER DEFAULT 0,
  
  -- Métricas calculadas
  velocidad_simple DECIMAL(10,2),        -- Palabras por minuto
  porcentaje_comprension DECIMAL(5,2),   -- % de comprensión
  velocidad_efectiva DECIMAL(10,2),      -- Velocidad × Comprensión
  
  -- Estado de la sesión
  estado TEXT DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'lectura_completada', 'vocabulario_completado', 'finalizada', 'abandonada')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Un estudiante solo puede tener una sesión activa por ciclo
  CONSTRAINT sesiones_lectura_estudiante_ciclo_unique UNIQUE (estudiante_id, ciclo_id)
);

-- Índices para rankings y búsquedas
CREATE INDEX IF NOT EXISTS idx_sesiones_estudiante ON sesiones_lectura(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_ciclo ON sesiones_lectura(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON sesiones_lectura(estado);
CREATE INDEX IF NOT EXISTS idx_sesiones_velocidad_efectiva ON sesiones_lectura(velocidad_efectiva DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_comprension ON sesiones_lectura(porcentaje_comprension DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_velocidad_simple ON sesiones_lectura(velocidad_simple DESC);

-- ============================================
-- FUNCIÓN: Calcular métricas de lectura
-- ============================================

CREATE OR REPLACE FUNCTION calcular_metricas_lectura()
RETURNS TRIGGER AS $$
DECLARE
  conteo_palabras INTEGER;
BEGIN
  -- Solo calcular si la sesión está finalizada y tiene tiempo de lectura
  IF NEW.estado = 'finalizada' AND NEW.tiempo_lectura_segundos > 0 THEN
    -- Obtener conteo de palabras del ciclo
    SELECT COALESCE((contenido->'reading'->>'word_count_text')::INTEGER, 0)
    INTO conteo_palabras
    FROM ciclos_lectura
    WHERE id = NEW.ciclo_id;
    
    -- Calcular velocidad simple (palabras por minuto)
    IF NEW.tiempo_lectura_segundos > 0 THEN
      NEW.velocidad_simple := (conteo_palabras::DECIMAL / NEW.tiempo_lectura_segundos) * 60;
    END IF;
    
    -- Calcular porcentaje de comprensión
    IF NEW.total_evaluacion > 0 THEN
      NEW.porcentaje_comprension := (NEW.aciertos_evaluacion::DECIMAL / NEW.total_evaluacion) * 100;
    END IF;
    
    -- Calcular velocidad efectiva
    IF NEW.velocidad_simple IS NOT NULL AND NEW.porcentaje_comprension IS NOT NULL THEN
      NEW.velocidad_efectiva := NEW.velocidad_simple * (NEW.porcentaje_comprension / 100);
    END IF;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular métricas automáticamente
DROP TRIGGER IF EXISTS trigger_calcular_metricas ON sesiones_lectura;
CREATE TRIGGER trigger_calcular_metricas
  BEFORE INSERT OR UPDATE ON sesiones_lectura
  FOR EACH ROW
  EXECUTE FUNCTION calcular_metricas_lectura();

-- ============================================
-- FUNCIÓN: Actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_ciclos_lectura_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ciclos_lectura_updated_at ON ciclos_lectura;
CREATE TRIGGER update_ciclos_lectura_updated_at
  BEFORE UPDATE ON ciclos_lectura
  FOR EACH ROW
  EXECUTE FUNCTION update_ciclos_lectura_updated_at();

-- ============================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE ciclos_lectura ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_lectura ENABLE ROW LEVEL SECURITY;

-- Políticas para ciclos_lectura
DROP POLICY IF EXISTS "Permitir lectura de ciclos activos" ON ciclos_lectura;
DROP POLICY IF EXISTS "Permitir gestión de ciclos" ON ciclos_lectura;

CREATE POLICY "Permitir lectura de ciclos"
ON ciclos_lectura FOR SELECT
USING (true);

CREATE POLICY "Permitir crear ciclos"
ON ciclos_lectura FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualizar ciclos"
ON ciclos_lectura FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir eliminar ciclos"
ON ciclos_lectura FOR DELETE
USING (true);

-- Políticas para sesiones_lectura
DROP POLICY IF EXISTS "Permitir lectura de sesiones" ON sesiones_lectura;
DROP POLICY IF EXISTS "Permitir gestión de sesiones" ON sesiones_lectura;

CREATE POLICY "Permitir lectura de sesiones"
ON sesiones_lectura FOR SELECT
USING (true);

CREATE POLICY "Permitir crear sesiones"
ON sesiones_lectura FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir actualizar sesiones"
ON sesiones_lectura FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir eliminar sesiones"
ON sesiones_lectura FOR DELETE
USING (true);

-- ============================================
-- VISTA: Rankings por grado
-- ============================================

CREATE OR REPLACE VIEW rankings_lectura AS
SELECT 
  sl.id,
  sl.ciclo_id,
  cl.numero_ciclo,
  cl.titulo,
  cl.grado,
  sl.estudiante_id,
  u.nombre || ' ' || COALESCE(u.apellidos, '') AS nombre_estudiante,
  u.codigo_estudiante,
  sl.velocidad_simple,
  sl.porcentaje_comprension,
  sl.velocidad_efectiva,
  sl.tiempo_lectura_segundos,
  sl.aciertos_evaluacion,
  sl.total_evaluacion,
  sl.fecha_fin_sesion,
  ROW_NUMBER() OVER (
    PARTITION BY cl.grado, cl.id 
    ORDER BY sl.velocidad_efectiva DESC NULLS LAST
  ) AS ranking_velocidad_efectiva,
  ROW_NUMBER() OVER (
    PARTITION BY cl.grado, cl.id 
    ORDER BY sl.porcentaje_comprension DESC NULLS LAST
  ) AS ranking_comprension,
  ROW_NUMBER() OVER (
    PARTITION BY cl.grado, cl.id 
    ORDER BY sl.velocidad_simple DESC NULLS LAST
  ) AS ranking_velocidad_simple
FROM sesiones_lectura sl
INNER JOIN ciclos_lectura cl ON sl.ciclo_id = cl.id
INNER JOIN usuarios u ON sl.estudiante_id = u.id
WHERE sl.estado = 'finalizada'
  AND sl.velocidad_efectiva IS NOT NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar tablas creadas
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('ciclos_lectura', 'sesiones_lectura')
ORDER BY tablename;

-- Verificar índices
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('ciclos_lectura', 'sesiones_lectura')
ORDER BY tablename, indexname;

-- Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('ciclos_lectura', 'sesiones_lectura')
ORDER BY tablename, policyname;
