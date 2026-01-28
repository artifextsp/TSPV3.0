-- ============================================
-- CREAR TABLA COLEGIOS
-- Thinking Skills Program v2 - Dashboard Administrativo
-- ============================================
-- 
-- Este script crea la tabla colegios con todos los campos necesarios
-- para la gestión administrativa del sistema.
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. El código del colegio se genera automáticamente al crear un nuevo colegio
-- 3. Verifica que los datos se crearon correctamente
-- ============================================

-- ============================================
-- PASO 1: CREAR TABLA COLEGIOS
-- ============================================

CREATE TABLE IF NOT EXISTS colegios (
  -- IDENTIFICADOR ÚNICO
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- DATOS DEL COLEGIO
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE NOT NULL,  -- Código generado automáticamente (COL001, COL002, etc.)
  
  -- DATOS DEL RECTOR
  nombre_rector TEXT NOT NULL,
  celular_rector TEXT,
  email TEXT NOT NULL,
  
  -- DATOS DE UBICACIÓN
  direccion TEXT,
  
  -- ESTADO Y CONTROL
  activo BOOLEAN DEFAULT true NOT NULL,
  
  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- CONSTRAINTS
  CONSTRAINT colegios_email_key UNIQUE (email)
);

-- ============================================
-- PASO 2: CREAR FUNCIÓN PARA GENERAR CÓDIGO AUTOMÁTICO
-- ============================================

-- Función para generar código automático de colegio (COL001, COL002, etc.)
CREATE OR REPLACE FUNCTION generar_codigo_colegio()
RETURNS TRIGGER AS $$
DECLARE
  ultimo_numero INTEGER;
  nuevo_codigo TEXT;
BEGIN
  -- Si ya tiene código, no hacer nada
  IF NEW.codigo IS NOT NULL AND NEW.codigo != '' THEN
    RETURN NEW;
  END IF;
  
  -- Obtener el último número de código usado
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 0)
  INTO ultimo_numero
  FROM colegios
  WHERE codigo ~ '^COL\d+$';
  
  -- Generar nuevo código
  ultimo_numero := ultimo_numero + 1;
  nuevo_codigo := 'COL' || LPAD(ultimo_numero::TEXT, 3, '0');
  
  -- Asignar el código
  NEW.codigo := nuevo_codigo;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 3: CREAR TRIGGER PARA GENERAR CÓDIGO
-- ============================================

DROP TRIGGER IF EXISTS trigger_generar_codigo_colegio ON colegios;
CREATE TRIGGER trigger_generar_codigo_colegio
  BEFORE INSERT ON colegios
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
  EXECUTE FUNCTION generar_codigo_colegio();

-- ============================================
-- PASO 4: CREAR TABLA DE RELACIÓN ESTUDIANTES-COLEGIOS
-- ============================================

CREATE TABLE IF NOT EXISTS estudiantes_colegios (
  -- IDENTIFICADOR ÚNICO
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- RELACIONES
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
  
  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- CONSTRAINTS
  -- Un estudiante solo puede estar en un colegio a la vez
  CONSTRAINT estudiantes_colegios_estudiante_unique UNIQUE (estudiante_id)
);

-- ============================================
-- PASO 5: CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_colegios_codigo ON colegios(codigo);
CREATE INDEX IF NOT EXISTS idx_colegios_email ON colegios(email);
CREATE INDEX IF NOT EXISTS idx_colegios_activo ON colegios(activo);
CREATE INDEX IF NOT EXISTS idx_estudiantes_colegios_estudiante_id ON estudiantes_colegios(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_colegios_colegio_id ON estudiantes_colegios(colegio_id);

-- ============================================
-- PASO 6: CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_colegios_updated_at ON colegios;
CREATE TRIGGER trigger_actualizar_colegios_updated_at
  BEFORE UPDATE ON colegios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

DROP TRIGGER IF EXISTS trigger_actualizar_estudiantes_colegios_updated_at ON estudiantes_colegios;
CREATE TRIGGER trigger_actualizar_estudiantes_colegios_updated_at
  BEFORE UPDATE ON estudiantes_colegios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT 
  'colegios' AS tabla,
  COUNT(*) AS total_registros
FROM colegios
UNION ALL
SELECT 
  'estudiantes_colegios' AS tabla,
  COUNT(*) AS total_registros
FROM estudiantes_colegios;

-- Mostrar estructura de las tablas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('colegios', 'estudiantes_colegios')
ORDER BY table_name, ordinal_position;
