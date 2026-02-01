-- ============================================
-- MÓDULO DE COBROS MENSUALIDADES
-- Thinking Skills Program v2
-- ============================================
--
-- IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase del MISMO
-- proyecto que usa la app (el de config/supabase.config.js).
-- Si las tablas no existen, el dashboard mostrará error 404.
--
-- Modelo: cobro por estudiante-mes.
-- Deuda acudiente = saldo arrastrado (por email) + suma(cobros pendientes de sus estudiantes).
-- Desde día 1 del mes ya hay deuda; pacto con padres: cancelar primeros 5 días.
--
-- Tablas:
-- 1. tarifas_mensuales   - valor por defecto (y opcional por grado)
-- 2. cobros_mensuales    - un registro por estudiante por mes (estado: pendiente | al_dia | exento)
-- 3. saldos_acudiente    - saldo arrastrado por acudiente (key: email)
--
-- Requisito: tabla usuarios (estudiantes), tabla acudientes con email y estudiante_id.
-- Opcional: acudientes.celular para WhatsApp (si no existe, añadir después).
-- ============================================

-- ============================================
-- 1. TARIFAS MENSUALIDAD
-- ============================================
-- Valor por defecto mensual por estudiante. Opcional: valor por grado (grado NULL = default global).

CREATE TABLE IF NOT EXISTS tarifas_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL DEFAULT 'Mensualidad',
  valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
  grado TEXT,  -- NULL = aplica a todos; si tienes columna grado en usuarios, aquí p. ej. '3', '6', '10'
  activo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tarifas_mensuales_activo ON tarifas_mensuales(activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_tarifas_mensuales_grado ON tarifas_mensuales(grado);

-- Insertar valor por defecto global (ajusta el valor según tu realidad)
INSERT INTO tarifas_mensuales (descripcion, valor, grado, activo)
SELECT 'Mensualidad por defecto', 0, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM tarifas_mensuales WHERE grado IS NULL AND activo = true);

-- ============================================
-- 2. COBROS MENSUALIDAD (estudiante-mes)
-- ============================================
-- Un registro por estudiante por mes. Estado: pendiente (debe), al_dia (pagado), exento (beca).

CREATE TABLE IF NOT EXISTS cobros_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL CHECK (anio >= 2020 AND anio <= 2100),
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor_base NUMERIC(12, 2) NOT NULL CHECK (valor_base >= 0),
  valor_final NUMERIC(12, 2) NOT NULL CHECK (valor_final >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'al_dia', 'exento')),
  fecha_al_dia TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (estudiante_id, anio, mes)
);

CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_estudiante ON cobros_mensuales(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_periodo ON cobros_mensuales(anio, mes);
CREATE INDEX IF NOT EXISTS idx_cobros_mensuales_estado ON cobros_mensuales(estado);

-- ============================================
-- 3. SALDO ARRASTRADO POR ACUDIENTE
-- ============================================
-- Un registro por acudiente (identificado por email). Saldo manual para deudas antiguas o ajustes.

CREATE TABLE IF NOT EXISTS saldos_acudiente (
  email TEXT PRIMARY KEY,
  saldo_arrastrado NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================
-- 4. CELULAR EN ACUDIENTES (para WhatsApp)
-- ============================================
-- Si tu tabla acudientes ya tiene celular o telefono_1, no hace falta. Si no, descomenta y ejecuta:

-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'acudientes' AND column_name = 'celular') THEN
--     ALTER TABLE acudientes ADD COLUMN celular TEXT;
--     RAISE NOTICE 'Columna celular añadida a acudientes';
--   END IF;
-- END $$;

-- ============================================
-- CONSULTAS DE REFERENCIA
-- ============================================
-- (No ejecutar como parte del script; son ejemplos para el admin.)

-- Deuda total por acudiente (email) = saldo_arrastrado + suma(cobros pendientes de sus estudiantes)
--
-- SELECT
--   a.email,
--   a.username,
--   a.nombre || ' ' || COALESCE(a.apellidos, '') AS acudiente_nombre,
--   COALESCE(s.saldo_arrastrado, 0) AS saldo_arrastrado,
--   COALESCE(SUM(CASE WHEN c.estado = 'pendiente' THEN c.valor_final ELSE 0 END), 0) AS pendiente_meses,
--   COALESCE(s.saldo_arrastrado, 0) + COALESCE(SUM(CASE WHEN c.estado = 'pendiente' THEN c.valor_final ELSE 0 END), 0) AS deuda_total
-- FROM acudientes a
-- LEFT JOIN saldos_acudiente s ON s.email = LOWER(TRIM(a.email))
-- LEFT JOIN cobros_mensuales c ON c.estudiante_id = a.estudiante_id AND c.estado = 'pendiente'
-- WHERE a.activo = true
-- GROUP BY a.email, a.username, a.nombre, a.apellidos, s.saldo_arrastrado;

-- Pendientes de pago (acudientes con deuda este mes) para recordatorio semanal WhatsApp
--
-- SELECT DISTINCT ON (a.email)
--   a.id AS acudiente_id,
--   a.email,
--   a.username,
--   a.celular,
--   a.nombre || ' ' || COALESCE(a.apellidos, '') AS acudiente_nombre,
--   ...
-- FROM acudientes a
-- JOIN cobros_mensuales c ON c.estudiante_id = a.estudiante_id AND c.estado = 'pendiente'
-- WHERE a.activo = true
--   AND a.celular IS NOT NULL AND a.celular != '';

-- ============================================
-- RLS (opcional)
-- ============================================
-- Las tablas de cobros deben ser solo para admin. Si usas RLS en Supabase, crea políticas
-- que permitan SELECT/INSERT/UPDATE/DELETE solo a rol admin; para anon/key de servicio
-- según cómo tengas configurado el resto del proyecto.
