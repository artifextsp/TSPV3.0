-- ============================================
-- RLS — MÓDULO DE COBROS (Fase 1)
-- Thinking Skills Program v2
-- ============================================
-- Ejecutar DESPUÉS de crear_modulo_cobros_fase1.sql
-- Ajusta las políticas según tu modelo de roles (ej. solo admin).
-- Por defecto: permitir SELECT/INSERT/UPDATE/DELETE para anon y authenticated
-- para que el dashboard admin funcione; en producción restringe por rol.
-- ============================================

ALTER TABLE parametros_cobro ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldos_estudiante ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_cobros ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir todo (anon + authenticated). Ajustar si usas rol admin.
DROP POLICY IF EXISTS "parametros_cobro_all" ON parametros_cobro;
CREATE POLICY "parametros_cobro_all" ON parametros_cobro FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cobros_mensuales_all" ON cobros_mensuales;
CREATE POLICY "cobros_mensuales_all" ON cobros_mensuales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "saldos_estudiante_all" ON saldos_estudiante;
CREATE POLICY "saldos_estudiante_all" ON saldos_estudiante FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "checkpoint_cobros_all" ON checkpoint_cobros;
CREATE POLICY "checkpoint_cobros_all" ON checkpoint_cobros FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
