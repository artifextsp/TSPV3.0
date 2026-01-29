-- ============================================
-- MÓDULO DE INFORMES PARA GUARDIANES
-- Thinking Skills Program v2.0
-- ============================================

-- ============================================
-- 1. TABLA DE BENCHMARKS POR GRADO
-- Metas de referencia para cada métrica por grado
-- ============================================

CREATE TABLE IF NOT EXISTS benchmarks_grado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grado TEXT NOT NULL,
  
  -- Lectura Crítica
  velocidad_simple_min INTEGER DEFAULT 0,        -- PPM mínimo esperado
  velocidad_simple_meta INTEGER NOT NULL,        -- PPM meta
  velocidad_simple_excelente INTEGER NOT NULL,   -- PPM excelente
  comprension_min INTEGER DEFAULT 50,            -- % mínimo esperado
  comprension_meta INTEGER DEFAULT 70,           -- % meta
  comprension_excelente INTEGER DEFAULT 90,      -- % excelente
  velocidad_efectiva_min INTEGER DEFAULT 0,
  velocidad_efectiva_meta INTEGER NOT NULL,
  velocidad_efectiva_excelente INTEGER NOT NULL,
  
  -- Creatividad
  creatividad_min INTEGER DEFAULT 50,
  creatividad_meta INTEGER DEFAULT 70,
  creatividad_excelente INTEGER DEFAULT 90,
  
  -- Ejercicios Digitales (por habilidad)
  ejercicios_min INTEGER DEFAULT 50,
  ejercicios_meta INTEGER DEFAULT 70,
  ejercicios_excelente INTEGER DEFAULT 90,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(grado)
);

-- Insertar benchmarks por grado
INSERT INTO benchmarks_grado (grado, velocidad_simple_meta, velocidad_simple_excelente, velocidad_efectiva_meta, velocidad_efectiva_excelente) VALUES
  ('tercero', 80, 100, 30, 45),
  ('cuarto', 100, 120, 45, 55),
  ('quinto', 120, 140, 55, 75),
  ('sexto', 140, 160, 75, 85),
  ('septimo', 160, 180, 85, 110),
  ('octavo', 180, 200, 110, 125),
  ('noveno', 200, 220, 125, 140),
  ('decimo', 220, 240, 140, 160),
  ('undecimo', 240, 260, 160, 180)
ON CONFLICT (grado) DO NOTHING;

-- ============================================
-- 2. TABLA DE HABILIDADES COGNITIVAS
-- Catálogo de las 10 habilidades digitales
-- ============================================

CREATE TABLE IF NOT EXISTS habilidades_cognitivas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  descripcion_padres TEXT,  -- Explicación amigable para guardianes
  icono TEXT,
  color TEXT,
  orden INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar las 10 habilidades cognitivas
INSERT INTO habilidades_cognitivas (codigo, nombre, descripcion, descripcion_padres, icono, color, orden) VALUES
  ('atencion', 'Atención', 'Capacidad de enfocarse y mantener la concentración', 'Qué tan bien su hijo puede concentrarse en una tarea sin distraerse', '🎯', '#667eea', 1),
  ('memoria', 'Memoria', 'Capacidad de retener y recuperar información', 'Qué tan bien su hijo recuerda información y patrones', '🧠', '#9f7aea', 2),
  ('logica', 'Lógica', 'Capacidad de razonamiento y resolución de problemas', 'Qué tan bien su hijo puede encontrar patrones y resolver puzzles', '🔢', '#38b2ac', 3),
  ('velocidad', 'Velocidad de Procesamiento', 'Rapidez para procesar información visual', 'Qué tan rápido su hijo puede identificar y responder a información', '⚡', '#ed8936', 4),
  ('percepcion', 'Percepción Visual', 'Capacidad de interpretar información visual', 'Qué tan bien su hijo puede identificar formas, colores y patrones', '👁️', '#e53e3e', 5),
  ('coordinacion', 'Coordinación', 'Coordinación ojo-mano y control motor fino', 'Qué tan bien su hijo controla movimientos precisos', '🤹', '#48bb78', 6),
  ('resolucion', 'Resolución de Problemas', 'Capacidad de encontrar soluciones creativas', 'Qué tan bien su hijo enfrenta y resuelve desafíos nuevos', '💡', '#f6ad55', 7),
  ('planificacion', 'Planificación', 'Capacidad de organizar y secuenciar acciones', 'Qué tan bien su hijo puede organizar pasos para lograr un objetivo', '📋', '#4299e1', 8),
  ('creatividad_digital', 'Creatividad Digital', 'Pensamiento divergente y original', 'Qué tan original y creativo es su hijo al resolver tareas', '🎨', '#ed64a6', 9),
  ('calculo', 'Cálculo Mental', 'Capacidad de realizar operaciones matemáticas mentalmente', 'Qué tan bien su hijo puede hacer operaciones de números en su mente', '🔢', '#805ad5', 10)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- 3. TABLA DE RESUMEN DE CICLO POR ESTUDIANTE
-- Cache de métricas agregadas por ciclo
-- ============================================

CREATE TABLE IF NOT EXISTS resumen_ciclo_estudiante (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estudiante_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  ciclo_numero INTEGER NOT NULL,
  grado TEXT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  
  -- Lectura Crítica (agregado)
  lectura_completada BOOLEAN DEFAULT false,
  lectura_velocidad_simple NUMERIC(10,2),
  lectura_comprension NUMERIC(5,2),
  lectura_velocidad_efectiva NUMERIC(10,2),
  lectura_sesion_id UUID,
  
  -- Creatividad (agregado)
  creatividad_completada BOOLEAN DEFAULT false,
  creatividad_calificacion NUMERIC(5,2),
  creatividad_sesion_id UUID,
  
  -- Ejercicios Digitales (agregado)
  ejercicios_completados INTEGER DEFAULT 0,
  ejercicios_total INTEGER DEFAULT 0,
  ejercicios_promedio NUMERIC(5,2),
  ejercicios_metas_alcanzadas INTEGER DEFAULT 0,
  
  -- Indicadores de tendencia (vs ciclo anterior)
  tendencia_lectura TEXT CHECK (tendencia_lectura IN ('mejora', 'igual', 'baja', 'nuevo')),
  tendencia_creatividad TEXT CHECK (tendencia_creatividad IN ('mejora', 'igual', 'baja', 'nuevo')),
  tendencia_ejercicios TEXT CHECK (tendencia_ejercicios IN ('mejora', 'igual', 'baja', 'nuevo')),
  
  -- Alertas automáticas
  alertas JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(estudiante_id, ciclo_numero)
);

-- ============================================
-- 4. NOTA SOBRE ACCESO DE GUARDIANES
-- ============================================
-- 
-- El sistema YA TIENE la tabla `acudientes` que relaciona guardianes con estudiantes.
-- No necesitamos crear una nueva tabla `acceso_guardianes`.
-- 
-- La tabla `acudientes` funciona así:
-- - Un acudiente puede tener múltiples hijos (múltiples registros con mismo email)
-- - Cada registro tiene: id, email, estudiante_id
-- - El sistema de autenticación ya maneja esto correctamente
-- 
-- Para asociar un guardián a un estudiante, simplemente:
-- 1. Asegúrate de que el estudiante tenga `email_acudiente` en la tabla `usuarios`
-- 2. Ejecuta el script `crear_tabla_acudientes.sql` que migra automáticamente
-- 3. O inserta manualmente en `acudientes`:
--    INSERT INTO acudientes (nombre, apellidos, email, estudiante_id, password_hash, activo)
--    VALUES ('Nombre', 'Apellido', 'email@ejemplo.com', 'uuid-del-estudiante', 'hash-de-password', true);
--

-- ============================================
-- 5. VISTA: RANKING POR GRADO (para comparativos)
-- ============================================

CREATE OR REPLACE VIEW vista_ranking_lectura_grado AS
SELECT 
  sl.estudiante_id,
  u.nombre,
  u.apellidos,
  u.grado,
  cl.numero_ciclo,
  sl.velocidad_simple,
  sl.porcentaje_comprension,
  sl.velocidad_efectiva,
  PERCENT_RANK() OVER (PARTITION BY u.grado, cl.numero_ciclo ORDER BY sl.velocidad_efectiva) * 100 as percentil_ve,
  PERCENT_RANK() OVER (PARTITION BY u.grado, cl.numero_ciclo ORDER BY sl.porcentaje_comprension) * 100 as percentil_comprension,
  AVG(sl.velocidad_efectiva) OVER (PARTITION BY u.grado, cl.numero_ciclo) as promedio_grado_ve,
  AVG(sl.porcentaje_comprension) OVER (PARTITION BY u.grado, cl.numero_ciclo) as promedio_grado_comprension
FROM sesiones_lectura sl
JOIN usuarios u ON sl.estudiante_id = u.id
JOIN ciclos_lectura cl ON sl.ciclo_id = cl.id
WHERE sl.estado = 'finalizada';

-- ============================================
-- 6. VISTA: HISTORIAL COMPLETO DEL ESTUDIANTE
-- ============================================

CREATE OR REPLACE VIEW vista_historial_estudiante AS
SELECT 
  u.id as estudiante_id,
  u.nombre,
  u.apellidos,
  u.grado,
  cl.numero_ciclo,
  cl.titulo as lectura_titulo,
  sl.velocidad_simple,
  sl.porcentaje_comprension,
  sl.velocidad_efectiva,
  sl.tiempo_lectura_segundos,
  sl.aciertos_vocabulario,
  sl.total_vocabulario,
  sl.aciertos_evaluacion,
  sl.total_evaluacion,
  sl.fecha_fin_sesion as fecha_lectura,
  sc.calificacion_docente as creatividad_calificacion,
  sc.comentario_docente as creatividad_comentario,
  sc.estado as creatividad_estado,
  sc.fecha_calificacion as fecha_creatividad
FROM usuarios u
LEFT JOIN sesiones_lectura sl ON u.id = sl.estudiante_id AND sl.estado = 'finalizada'
LEFT JOIN ciclos_lectura cl ON sl.ciclo_id = cl.id
LEFT JOIN sesiones_creatividad sc ON u.id = sc.estudiante_id
LEFT JOIN ciclos_creatividad cc ON sc.ciclo_id = cc.id AND cc.grado = u.grado
WHERE u.tipo_usuario = 'estudiante';

-- ============================================
-- 7. FUNCIÓN: Calcular resumen de ciclo
-- ============================================

CREATE OR REPLACE FUNCTION calcular_resumen_ciclo(
  p_estudiante_id UUID,
  p_ciclo_numero INTEGER
) RETURNS VOID AS $$
DECLARE
  v_grado TEXT;
  v_lectura RECORD;
  v_creatividad RECORD;
  v_ejercicios RECORD;
  v_anterior RECORD;
  v_tendencia_lectura TEXT;
  v_tendencia_creatividad TEXT;
  v_tendencia_ejercicios TEXT;
  v_alertas JSONB := '[]'::jsonb;
  v_benchmark RECORD;
BEGIN
  -- Obtener grado del estudiante
  SELECT grado INTO v_grado FROM usuarios WHERE id = p_estudiante_id;
  
  -- Obtener benchmarks
  SELECT * INTO v_benchmark FROM benchmarks_grado WHERE grado = v_grado;
  
  -- Obtener datos de lectura del ciclo
  SELECT 
    sl.id,
    sl.velocidad_simple,
    sl.porcentaje_comprension,
    sl.velocidad_efectiva
  INTO v_lectura
  FROM sesiones_lectura sl
  JOIN ciclos_lectura cl ON sl.ciclo_id = cl.id
  WHERE sl.estudiante_id = p_estudiante_id 
    AND cl.numero_ciclo = p_ciclo_numero
    AND sl.estado = 'finalizada'
  LIMIT 1;
  
  -- Obtener datos de creatividad del ciclo
  SELECT 
    sc.id,
    sc.calificacion_docente
  INTO v_creatividad
  FROM sesiones_creatividad sc
  JOIN ciclos_creatividad cc ON sc.ciclo_id = cc.id
  WHERE sc.estudiante_id = p_estudiante_id 
    AND cc.numero_ciclo = p_ciclo_numero
    AND sc.estado = 'calificada'
  LIMIT 1;
  
  -- Obtener datos de ejercicios del ciclo
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE meta_alcanzada) as metas,
    AVG(CASE WHEN rj.resultado_obtenido IS NOT NULL AND je.meta_objetivo > 0 
        THEN LEAST((rj.resultado_obtenido::numeric / je.meta_objetivo) * 100, 100) 
        ELSE 0 END) as promedio
  INTO v_ejercicios
  FROM resultados_juegos rj
  JOIN juegos_ejercicios je ON rj.juego_id = je.id
  JOIN ciclos_ejercicios ce ON je.ciclo_id = ce.id
  WHERE rj.estudiante_id = p_estudiante_id 
    AND ce.numero_ciclo = p_ciclo_numero;
  
  -- Obtener ciclo anterior para tendencias
  SELECT * INTO v_anterior 
  FROM resumen_ciclo_estudiante 
  WHERE estudiante_id = p_estudiante_id 
    AND ciclo_numero = p_ciclo_numero - 1;
  
  -- Calcular tendencias
  IF v_anterior IS NULL THEN
    v_tendencia_lectura := 'nuevo';
    v_tendencia_creatividad := 'nuevo';
    v_tendencia_ejercicios := 'nuevo';
  ELSE
    -- Tendencia lectura
    IF v_lectura.velocidad_efectiva IS NOT NULL AND v_anterior.lectura_velocidad_efectiva IS NOT NULL THEN
      IF v_lectura.velocidad_efectiva > v_anterior.lectura_velocidad_efectiva * 1.05 THEN
        v_tendencia_lectura := 'mejora';
      ELSIF v_lectura.velocidad_efectiva < v_anterior.lectura_velocidad_efectiva * 0.95 THEN
        v_tendencia_lectura := 'baja';
      ELSE
        v_tendencia_lectura := 'igual';
      END IF;
    END IF;
    
    -- Tendencia creatividad
    IF v_creatividad.calificacion_docente IS NOT NULL AND v_anterior.creatividad_calificacion IS NOT NULL THEN
      IF v_creatividad.calificacion_docente > v_anterior.creatividad_calificacion + 5 THEN
        v_tendencia_creatividad := 'mejora';
      ELSIF v_creatividad.calificacion_docente < v_anterior.creatividad_calificacion - 5 THEN
        v_tendencia_creatividad := 'baja';
      ELSE
        v_tendencia_creatividad := 'igual';
      END IF;
    END IF;
    
    -- Tendencia ejercicios
    IF v_ejercicios.promedio IS NOT NULL AND v_anterior.ejercicios_promedio IS NOT NULL THEN
      IF v_ejercicios.promedio > v_anterior.ejercicios_promedio + 5 THEN
        v_tendencia_ejercicios := 'mejora';
      ELSIF v_ejercicios.promedio < v_anterior.ejercicios_promedio - 5 THEN
        v_tendencia_ejercicios := 'baja';
      ELSE
        v_tendencia_ejercicios := 'igual';
      END IF;
    END IF;
  END IF;
  
  -- Generar alertas
  IF v_benchmark IS NOT NULL THEN
    IF v_lectura.velocidad_efectiva IS NOT NULL AND v_lectura.velocidad_efectiva < v_benchmark.velocidad_efectiva_min THEN
      v_alertas := v_alertas || '{"tipo": "lectura_baja", "mensaje": "Velocidad efectiva por debajo del mínimo esperado"}'::jsonb;
    END IF;
    IF v_lectura.porcentaje_comprension IS NOT NULL AND v_lectura.porcentaje_comprension < v_benchmark.comprension_min THEN
      v_alertas := v_alertas || '{"tipo": "comprension_baja", "mensaje": "Comprensión lectora por debajo del mínimo esperado"}'::jsonb;
    END IF;
  END IF;
  
  -- Insertar o actualizar resumen
  INSERT INTO resumen_ciclo_estudiante (
    estudiante_id, ciclo_numero, grado,
    lectura_completada, lectura_velocidad_simple, lectura_comprension, lectura_velocidad_efectiva, lectura_sesion_id,
    creatividad_completada, creatividad_calificacion, creatividad_sesion_id,
    ejercicios_completados, ejercicios_total, ejercicios_promedio, ejercicios_metas_alcanzadas,
    tendencia_lectura, tendencia_creatividad, tendencia_ejercicios,
    alertas
  ) VALUES (
    p_estudiante_id, p_ciclo_numero, v_grado,
    v_lectura.id IS NOT NULL, v_lectura.velocidad_simple, v_lectura.porcentaje_comprension, v_lectura.velocidad_efectiva, v_lectura.id,
    v_creatividad.id IS NOT NULL, v_creatividad.calificacion_docente, v_creatividad.id,
    COALESCE(v_ejercicios.total, 0), COALESCE(v_ejercicios.total, 0), v_ejercicios.promedio, COALESCE(v_ejercicios.metas, 0),
    v_tendencia_lectura, v_tendencia_creatividad, v_tendencia_ejercicios,
    v_alertas
  )
  ON CONFLICT (estudiante_id, ciclo_numero) DO UPDATE SET
    lectura_completada = EXCLUDED.lectura_completada,
    lectura_velocidad_simple = EXCLUDED.lectura_velocidad_simple,
    lectura_comprension = EXCLUDED.lectura_comprension,
    lectura_velocidad_efectiva = EXCLUDED.lectura_velocidad_efectiva,
    lectura_sesion_id = EXCLUDED.lectura_sesion_id,
    creatividad_completada = EXCLUDED.creatividad_completada,
    creatividad_calificacion = EXCLUDED.creatividad_calificacion,
    creatividad_sesion_id = EXCLUDED.creatividad_sesion_id,
    ejercicios_completados = EXCLUDED.ejercicios_completados,
    ejercicios_promedio = EXCLUDED.ejercicios_promedio,
    ejercicios_metas_alcanzadas = EXCLUDED.ejercicios_metas_alcanzadas,
    tendencia_lectura = EXCLUDED.tendencia_lectura,
    tendencia_creatividad = EXCLUDED.tendencia_creatividad,
    tendencia_ejercicios = EXCLUDED.tendencia_ejercicios,
    alertas = EXCLUDED.alertas,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. ÍNDICES PARA RENDIMIENTO
-- ============================================

CREATE INDEX IF NOT EXISTS idx_resumen_ciclo_estudiante ON resumen_ciclo_estudiante(estudiante_id, ciclo_numero);

-- NOTA: Los índices de la tabla `acudientes` ya están creados en `crear_tabla_acudientes.sql`

-- ============================================
-- 9. RLS POLICIES
-- ============================================

ALTER TABLE benchmarks_grado ENABLE ROW LEVEL SECURITY;
ALTER TABLE habilidades_cognitivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumen_ciclo_estudiante ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
CREATE POLICY "Benchmarks visibles para todos" ON benchmarks_grado FOR SELECT USING (true);
CREATE POLICY "Habilidades visibles para todos" ON habilidades_cognitivas FOR SELECT USING (true);
CREATE POLICY "Resumen visible para todos" ON resumen_ciclo_estudiante FOR ALL USING (true);

-- NOTA: La tabla `acudientes` ya tiene sus propias políticas RLS configuradas

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE benchmarks_grado IS 'Metas de referencia por grado para cada métrica del programa';
COMMENT ON TABLE habilidades_cognitivas IS 'Catálogo de las 10 habilidades cognitivas entrenadas en ejercicios digitales';
COMMENT ON TABLE resumen_ciclo_estudiante IS 'Cache de métricas agregadas por ciclo para reportes rápidos';
