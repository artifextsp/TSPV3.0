-- ============================================
-- MÓDULO DE EJERCICIOS DIGITALES - THINKING SKILLS PROGRAM
-- Script de creación de tablas y configuración
-- ============================================

-- ============================================
-- TABLA: ciclos_ejercicios
-- Almacena los ciclos de ejercicios por grado
-- ============================================

CREATE TABLE IF NOT EXISTS ciclos_ejercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ciclo INTEGER NOT NULL,
  grado VARCHAR(20) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT ciclos_ejercicios_grado_check CHECK (
    grado IN ('tercero', 'cuarto', 'quinto', 'sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'undecimo')
  ),
  CONSTRAINT ciclos_ejercicios_unique_numero_grado UNIQUE (numero_ciclo, grado)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ciclos_ejercicios_grado ON ciclos_ejercicios(grado);
CREATE INDEX IF NOT EXISTS idx_ciclos_ejercicios_activo ON ciclos_ejercicios(activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ciclos_ejercicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ciclos_ejercicios_updated_at ON ciclos_ejercicios;
CREATE TRIGGER trigger_update_ciclos_ejercicios_updated_at
  BEFORE UPDATE ON ciclos_ejercicios
  FOR EACH ROW
  EXECUTE FUNCTION update_ciclos_ejercicios_updated_at();

-- ============================================
-- TABLA: juegos_ejercicios
-- Almacena los videojuegos de cada ciclo
-- ============================================

CREATE TABLE IF NOT EXISTS juegos_ejercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id UUID NOT NULL REFERENCES ciclos_ejercicios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  url_juego TEXT NOT NULL,
  imagen_preview TEXT,
  habilidad_estimulada VARCHAR(100) NOT NULL,
  tipo_meta VARCHAR(20) NOT NULL,
  meta_objetivo INTEGER NOT NULL,
  instrucciones TEXT,
  orden INTEGER DEFAULT 1,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT juegos_ejercicios_tipo_meta_check CHECK (
    tipo_meta IN ('puntos', 'niveles', 'tiempo', 'porcentaje')
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_juegos_ejercicios_ciclo ON juegos_ejercicios(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_juegos_ejercicios_habilidad ON juegos_ejercicios(habilidad_estimulada);

-- ============================================
-- TABLA: sesiones_ejercicios
-- Registra el progreso de cada estudiante
-- ============================================

CREATE TABLE IF NOT EXISTS sesiones_ejercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id UUID NOT NULL REFERENCES ciclos_ejercicios(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Estado general del ciclo
  estado VARCHAR(30) DEFAULT 'en_progreso',
  fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
  fecha_fin_sesion TIMESTAMPTZ,
  
  CONSTRAINT sesiones_ejercicios_estado_check CHECK (
    estado IN ('en_progreso', 'finalizada')
  ),
  CONSTRAINT sesiones_ejercicios_unique_ciclo_estudiante UNIQUE (ciclo_id, estudiante_id)
);

-- ============================================
-- TABLA: resultados_juegos
-- Almacena el resultado de cada juego por estudiante
-- ============================================

CREATE TABLE IF NOT EXISTS resultados_juegos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES sesiones_ejercicios(id) ON DELETE CASCADE,
  juego_id UUID NOT NULL REFERENCES juegos_ejercicios(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Resultado registrado por el estudiante
  resultado_obtenido INTEGER NOT NULL,
  meta_alcanzada BOOLEAN DEFAULT false,
  porcentaje_logro NUMERIC(5,2),
  
  -- Verificación del docente (opcional)
  verificado_por_docente BOOLEAN DEFAULT false,
  docente_verificador_id UUID REFERENCES usuarios(id),
  fecha_verificacion TIMESTAMPTZ,
  
  -- Timestamps
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT resultados_juegos_unique_sesion_juego UNIQUE (sesion_id, juego_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_resultados_juegos_sesion ON resultados_juegos(sesion_id);
CREATE INDEX IF NOT EXISTS idx_resultados_juegos_estudiante ON resultados_juegos(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_resultados_juegos_juego ON resultados_juegos(juego_id);

-- ============================================
-- POLÍTICAS RLS PARA ciclos_ejercicios
-- ============================================

ALTER TABLE ciclos_ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura ciclos_ejercicios para todos" ON ciclos_ejercicios;
CREATE POLICY "Lectura ciclos_ejercicios para todos"
  ON ciclos_ejercicios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar ciclos_ejercicios" ON ciclos_ejercicios;
CREATE POLICY "Insertar ciclos_ejercicios"
  ON ciclos_ejercicios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar ciclos_ejercicios" ON ciclos_ejercicios;
CREATE POLICY "Actualizar ciclos_ejercicios"
  ON ciclos_ejercicios FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Eliminar ciclos_ejercicios" ON ciclos_ejercicios;
CREATE POLICY "Eliminar ciclos_ejercicios"
  ON ciclos_ejercicios FOR DELETE USING (true);

-- ============================================
-- POLÍTICAS RLS PARA juegos_ejercicios
-- ============================================

ALTER TABLE juegos_ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura juegos_ejercicios para todos" ON juegos_ejercicios;
CREATE POLICY "Lectura juegos_ejercicios para todos"
  ON juegos_ejercicios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar juegos_ejercicios" ON juegos_ejercicios;
CREATE POLICY "Insertar juegos_ejercicios"
  ON juegos_ejercicios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar juegos_ejercicios" ON juegos_ejercicios;
CREATE POLICY "Actualizar juegos_ejercicios"
  ON juegos_ejercicios FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Eliminar juegos_ejercicios" ON juegos_ejercicios;
CREATE POLICY "Eliminar juegos_ejercicios"
  ON juegos_ejercicios FOR DELETE USING (true);

-- ============================================
-- POLÍTICAS RLS PARA sesiones_ejercicios
-- ============================================

ALTER TABLE sesiones_ejercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura sesiones_ejercicios para todos" ON sesiones_ejercicios;
CREATE POLICY "Lectura sesiones_ejercicios para todos"
  ON sesiones_ejercicios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar sesiones_ejercicios" ON sesiones_ejercicios;
CREATE POLICY "Insertar sesiones_ejercicios"
  ON sesiones_ejercicios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar sesiones_ejercicios" ON sesiones_ejercicios;
CREATE POLICY "Actualizar sesiones_ejercicios"
  ON sesiones_ejercicios FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Eliminar sesiones_ejercicios" ON sesiones_ejercicios;
CREATE POLICY "Eliminar sesiones_ejercicios"
  ON sesiones_ejercicios FOR DELETE USING (true);

-- ============================================
-- POLÍTICAS RLS PARA resultados_juegos
-- ============================================

ALTER TABLE resultados_juegos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura resultados_juegos para todos" ON resultados_juegos;
CREATE POLICY "Lectura resultados_juegos para todos"
  ON resultados_juegos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insertar resultados_juegos" ON resultados_juegos;
CREATE POLICY "Insertar resultados_juegos"
  ON resultados_juegos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizar resultados_juegos" ON resultados_juegos;
CREATE POLICY "Actualizar resultados_juegos"
  ON resultados_juegos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Eliminar resultados_juegos" ON resultados_juegos;
CREATE POLICY "Eliminar resultados_juegos"
  ON resultados_juegos FOR DELETE USING (true);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE ciclos_ejercicios IS 'Ciclos de ejercicios digitales por grado';
COMMENT ON TABLE juegos_ejercicios IS 'Videojuegos online asociados a cada ciclo';
COMMENT ON COLUMN juegos_ejercicios.habilidad_estimulada IS 'Tipo de habilidad que desarrolla: atención, memoria, lógica, etc.';
COMMENT ON COLUMN juegos_ejercicios.tipo_meta IS 'Tipo de meta: puntos, niveles, tiempo, porcentaje';
COMMENT ON COLUMN juegos_ejercicios.meta_objetivo IS 'Valor objetivo a alcanzar';
COMMENT ON TABLE resultados_juegos IS 'Resultados registrados por estudiantes en cada juego';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
