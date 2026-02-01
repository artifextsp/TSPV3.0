-- ============================================
-- COPIAR TODO ESTE BLOQUE Y EJECUTAR EN SUPABASE
-- Proyecto: rxqiimwqlisnurgmtmtw (el de tu app)
-- SQL Editor → New query → Pegar → Run
-- ============================================

-- 1. Tabla tarifas
CREATE TABLE IF NOT EXISTS tarifas_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL DEFAULT 'Mensualidad',
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  grado TEXT,
  activo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tarifas_mensuales_activo ON tarifas_mensuales(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_tarifas_mensuales_grado ON tarifas_mensuales(grado);

-- 2. Tabla cobros (estudiante-mes)
CREATE TABLE IF NOT EXISTS cobros_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor_base NUMERIC(12, 2) NOT NULL CHECK (valor_base >= 0),
  valor_final NUMERIC(12, 2) NOT NULL CHECK (valor_final >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'al_dia', 'exento')),
  fecha_al_dia TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (estudiante_id, anio, mes)
);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_estudiante ON cobros_mensuales(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_periodo ON cobros_mensuales(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_estado ON cobros_mensuales(estado);

-- 3. Tabla saldos acudiente
CREATE TABLE IF NOT EXISTS saldos_acudiente (
  email TEXT PRIMARY KEY,
  saldo_arrastrado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Tarifa por defecto (si no existe)
INSERT INTO tarifas_mensuales (descripcion, valor, grado, activo)
SELECT 'Mensualidad por defecto', 40000, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM tarifas_mensuales WHERE grado IS NULL AND activo = true);

-- 5. Forzar recarga del esquema (API debe ver las tablas)
NOTIFY pgrst, 'reload schema';

-- 6. Verificación: debe devolver 3 filas
SELECT 'tarifas_mensuales' AS tabla, COUNT(*) AS filas FROM tarifas_mensuales
UNION ALL SELECT 'cobros_mensuales', COUNT(*) FROM cobros_mensuales
UNION ALL SELECT 'saldos_acudiente', COUNT(*) FROM saldos_acudiente;
