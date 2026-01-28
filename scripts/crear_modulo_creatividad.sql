-- ============================================
-- MÓDULO DE CREATIVIDAD - THINKING SKILLS PROGRAM
-- Script de creación de tablas y configuración
-- ============================================

-- ============================================
-- TABLA: ciclos_creatividad
-- Almacena los ciclos de creatividad por grado
-- ============================================

CREATE TABLE IF NOT EXISTS ciclos_creatividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ciclo INTEGER NOT NULL,
  grado VARCHAR(20) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  instrucciones TEXT,
  mostrar_instrucciones BOOLEAN DEFAULT true,
  archivo_url TEXT,
  archivo_tipo VARCHAR(20), -- 'pdf' o 'imagen'
  archivo_nombre VARCHAR(255),
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT ciclos_creatividad_grado_check CHECK (
    grado IN ('tercero', 'cuarto', 'quinto', 'sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'undecimo')
  ),
  CONSTRAINT ciclos_creatividad_archivo_tipo_check CHECK (
    archivo_tipo IN ('pdf', 'imagen')
  ),
  CONSTRAINT ciclos_creatividad_unique_numero_grado UNIQUE (numero_ciclo, grado)
);

-- Índices para ciclos_creatividad
CREATE INDEX IF NOT EXISTS idx_ciclos_creatividad_grado ON ciclos_creatividad(grado);
CREATE INDEX IF NOT EXISTS idx_ciclos_creatividad_activo ON ciclos_creatividad(activo);
CREATE INDEX IF NOT EXISTS idx_ciclos_creatividad_grado_activo ON ciclos_creatividad(grado, activo);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_ciclos_creatividad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ciclos_creatividad_updated_at ON ciclos_creatividad;
CREATE TRIGGER trigger_update_ciclos_creatividad_updated_at
  BEFORE UPDATE ON ciclos_creatividad
  FOR EACH ROW
  EXECUTE FUNCTION update_ciclos_creatividad_updated_at();

-- ============================================
-- TABLA: sesiones_creatividad
-- Registra el progreso de cada estudiante
-- ============================================

CREATE TABLE IF NOT EXISTS sesiones_creatividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id UUID NOT NULL REFERENCES ciclos_creatividad(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Timestamps
  fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
  fecha_visualizacion TIMESTAMPTZ,
  fecha_fin_sesion TIMESTAMPTZ,
  
  -- Tiempo de visualización en segundos
  tiempo_visualizacion_segundos INTEGER DEFAULT 0,
  
  -- Estado de la sesión
  estado VARCHAR(30) DEFAULT 'en_progreso',
  
  -- Solicitud de revisión al docente
  solicitar_revision BOOLEAN DEFAULT false,
  fecha_solicitud_revision TIMESTAMPTZ,
  
  -- Calificación del docente
  calificacion_docente NUMERIC(5,2),
  docente_calificador_id UUID REFERENCES usuarios(id),
  fecha_calificacion TIMESTAMPTZ,
  comentario_docente TEXT,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT sesiones_creatividad_estado_check CHECK (
    estado IN ('en_progreso', 'visualizado', 'finalizada', 'pendiente_revision', 'calificada')
  ),
  CONSTRAINT sesiones_creatividad_unique_ciclo_estudiante UNIQUE (ciclo_id, estudiante_id),
  CONSTRAINT sesiones_creatividad_calificacion_check CHECK (
    calificacion_docente IS NULL OR (calificacion_docente >= 0 AND calificacion_docente <= 100)
  )
);

-- Índices para sesiones_creatividad
CREATE INDEX IF NOT EXISTS idx_sesiones_creatividad_ciclo ON sesiones_creatividad(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_creatividad_estudiante ON sesiones_creatividad(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_creatividad_estado ON sesiones_creatividad(estado);

-- ============================================
-- POLÍTICAS RLS PARA ciclos_creatividad
-- ============================================

ALTER TABLE ciclos_creatividad ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a todos los usuarios autenticados
DROP POLICY IF EXISTS "Lectura ciclos_creatividad para todos" ON ciclos_creatividad;
CREATE POLICY "Lectura ciclos_creatividad para todos"
  ON ciclos_creatividad FOR SELECT
  USING (true);

-- Política: Permitir inserción desde la API
DROP POLICY IF EXISTS "Insertar ciclos_creatividad" ON ciclos_creatividad;
CREATE POLICY "Insertar ciclos_creatividad"
  ON ciclos_creatividad FOR INSERT
  WITH CHECK (true);

-- Política: Permitir actualización desde la API
DROP POLICY IF EXISTS "Actualizar ciclos_creatividad" ON ciclos_creatividad;
CREATE POLICY "Actualizar ciclos_creatividad"
  ON ciclos_creatividad FOR UPDATE
  USING (true);

-- Política: Permitir eliminación desde la API
DROP POLICY IF EXISTS "Eliminar ciclos_creatividad" ON ciclos_creatividad;
CREATE POLICY "Eliminar ciclos_creatividad"
  ON ciclos_creatividad FOR DELETE
  USING (true);

-- ============================================
-- POLÍTICAS RLS PARA sesiones_creatividad
-- ============================================

ALTER TABLE sesiones_creatividad ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a todos
DROP POLICY IF EXISTS "Lectura sesiones_creatividad para todos" ON sesiones_creatividad;
CREATE POLICY "Lectura sesiones_creatividad para todos"
  ON sesiones_creatividad FOR SELECT
  USING (true);

-- Política: Permitir inserción
DROP POLICY IF EXISTS "Insertar sesiones_creatividad" ON sesiones_creatividad;
CREATE POLICY "Insertar sesiones_creatividad"
  ON sesiones_creatividad FOR INSERT
  WITH CHECK (true);

-- Política: Permitir actualización
DROP POLICY IF EXISTS "Actualizar sesiones_creatividad" ON sesiones_creatividad;
CREATE POLICY "Actualizar sesiones_creatividad"
  ON sesiones_creatividad FOR UPDATE
  USING (true);

-- Política: Permitir eliminación
DROP POLICY IF EXISTS "Eliminar sesiones_creatividad" ON sesiones_creatividad;
CREATE POLICY "Eliminar sesiones_creatividad"
  ON sesiones_creatividad FOR DELETE
  USING (true);

-- ============================================
-- COMENTARIOS EN TABLAS Y COLUMNAS
-- ============================================

COMMENT ON TABLE ciclos_creatividad IS 'Ciclos de creatividad organizados por grado con contenido visual';
COMMENT ON COLUMN ciclos_creatividad.titulo IS 'Título del ejercicio de creatividad';
COMMENT ON COLUMN ciclos_creatividad.instrucciones IS 'Instrucciones opcionales para el estudiante';
COMMENT ON COLUMN ciclos_creatividad.mostrar_instrucciones IS 'Si se deben mostrar las instrucciones al estudiante';
COMMENT ON COLUMN ciclos_creatividad.archivo_url IS 'URL del archivo PDF o imagen almacenado';
COMMENT ON COLUMN ciclos_creatividad.archivo_tipo IS 'Tipo de archivo: pdf o imagen';

COMMENT ON TABLE sesiones_creatividad IS 'Registro de sesiones de creatividad por estudiante';
COMMENT ON COLUMN sesiones_creatividad.tiempo_visualizacion_segundos IS 'Tiempo total que el estudiante visualizó el contenido';
COMMENT ON COLUMN sesiones_creatividad.estado IS 'Estado: en_progreso, visualizado, finalizada';

-- ============================================
-- CONFIGURACIÓN DE STORAGE
-- ============================================

-- Crear bucket de storage para creatividad
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creatividad',
  'creatividad', 
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir subir archivos
DROP POLICY IF EXISTS "Permitir subida a creatividad" ON storage.objects;
CREATE POLICY "Permitir subida a creatividad" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'creatividad');

-- Política para permitir leer archivos
DROP POLICY IF EXISTS "Permitir lectura de creatividad" ON storage.objects;
CREATE POLICY "Permitir lectura de creatividad" ON storage.objects
FOR SELECT USING (bucket_id = 'creatividad');

-- Política para permitir actualizar archivos
DROP POLICY IF EXISTS "Permitir actualizar creatividad" ON storage.objects;
CREATE POLICY "Permitir actualizar creatividad" ON storage.objects
FOR UPDATE USING (bucket_id = 'creatividad');

-- Política para permitir eliminar archivos
DROP POLICY IF EXISTS "Permitir eliminar de creatividad" ON storage.objects;
CREATE POLICY "Permitir eliminar de creatividad" ON storage.objects
FOR DELETE USING (bucket_id = 'creatividad');

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
