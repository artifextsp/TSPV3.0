-- ============================================
-- MÓDULO DE COBROS / MENSUALIDADES — FASE 1
-- Thinking Skills Program v2
-- ============================================
--
-- Crea las tablas necesarias para el módulo de cobros:
--   parametros_cobro, cobros_mensuales, saldos_estudiante, checkpoint_cobros
--
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor (proyecto TSP)
-- 2. Al final se ejecuta NOTIFY pgrst, 'reload schema' para que la API vea las tablas
-- 3. Requiere que existan: usuarios, acudientes
-- ============================================

-- ============================================
-- 1. PARÁMETROS DE COBRO (una fila de configuración)
-- ============================================

CREATE TABLE IF NOT EXISTS parametros_cobro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_whatsapp TEXT,
  link_plataforma TEXT,
  link_video_1 TEXT,
  link_video_2 TEXT,
  valor_base_mensualidad NUMERIC(12,2) NOT NULL DEFAULT 0,
  becas_activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Una sola fila: insertar registro por defecto si la tabla está vacía (enfoque en resultados; estado/valor como info adicional)
INSERT INTO parametros_cobro (valor_base_mensualidad, mensaje_whatsapp)
SELECT 0, E'*Thinking Skills Program*\nEstimado(a) {{nombre_acudiente}},\n\nLos resultados y el avance de *{{nombre_estudiante}}* ya están disponibles. Puede consultarlos aquí:\n{{link_plataforma}}\n\nSi desea apoyo con el uso de la plataforma, puede revisar nuestro videotutorial:\n{{link_video_1}}\n\n—\n*Información adicional:* Mensualidad {{mes_cobro}}: {{estado_mensualidad}}. Valor: ${{valor_a_cobrar}}\n\nSaludos cordiales,\nEquipo Thinking Skills Program'
WHERE NOT EXISTS (SELECT 1 FROM parametros_cobro LIMIT 1);

-- ============================================
-- 2. COBROS MENSUALES (un registro por estudiante por mes)
-- ============================================

CREATE TABLE IF NOT EXISTS cobros_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_final NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'al_dia', 'enviado')),
  enviado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT cobros_mensuales_estudiante_anio_mes_unique UNIQUE (estudiante_id, anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_estudiante ON cobros_mensuales(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_anio_mes ON cobros_mensuales(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_estado ON cobros_mensuales(estado);

-- ============================================
-- 3. SALDOS POR ESTUDIANTE (deuda acumulada + % beca)
-- ============================================

CREATE TABLE IF NOT EXISTS saldos_estudiante (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  porcentaje_beca NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (porcentaje_beca >= 0 AND porcentaje_beca <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT saldos_estudiante_estudiante_unique UNIQUE (estudiante_id)
);

CREATE INDEX IF NOT EXISTS idx_saldos_estudiante_estudiante ON saldos_estudiante(estudiante_id);

-- ============================================
-- 4. CHECKPOINT DE SEGURIDAD (puntos de recuperación)
-- ============================================

CREATE TABLE IF NOT EXISTS checkpoint_cobros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  descripcion TEXT,
  snapshot_cobros JSONB,
  snapshot_saldos JSONB,
  usuario_id UUID
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_cobros_created_at ON checkpoint_cobros(created_at DESC);

-- ============================================
-- 5. TRIGGERS updated_at
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_updated_at_cobros()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_parametros_cobro_updated_at ON parametros_cobro;
CREATE TRIGGER trigger_parametros_cobro_updated_at
  BEFORE UPDATE ON parametros_cobro FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_cobros();

DROP TRIGGER IF EXISTS trigger_cobros_mensuales_updated_at ON cobros_mensuales;
CREATE TRIGGER trigger_cobros_mensuales_updated_at
  BEFORE UPDATE ON cobros_mensuales FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_cobros();

DROP TRIGGER IF EXISTS trigger_saldos_estudiante_updated_at ON saldos_estudiante;
CREATE TRIGGER trigger_saldos_estudiante_updated_at
  BEFORE UPDATE ON saldos_estudiante FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at_cobros();

-- ============================================
-- 6. RECARGAR ESQUEMA (PostgREST/Supabase)
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'parametros_cobro' AS tabla, COUNT(*) AS filas FROM parametros_cobro
UNION ALL SELECT 'cobros_mensuales', COUNT(*) FROM cobros_mensuales
UNION ALL SELECT 'saldos_estudiante', COUNT(*) FROM saldos_estudiante
UNION ALL SELECT 'checkpoint_cobros', COUNT(*) FROM checkpoint_cobros;
