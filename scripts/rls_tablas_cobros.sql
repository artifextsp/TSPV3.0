-- ============================================
-- RLS: Permitir a la app leer y escribir en tablas de cobros
-- Proyecto: gjtlgxvjecbqyatleptm
-- ============================================
-- Sin estas políticas, la app (anon key) no puede insertar ni leer.
-- Ejecuta en Supabase → SQL Editor (todo el archivo).
-- ============================================

-- tarifas_mensuales
ALTER TABLE tarifas_mensuales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all tarifas_mensuales" ON tarifas_mensuales;
CREATE POLICY "Allow anon all tarifas_mensuales" ON tarifas_mensuales FOR ALL TO anon USING (true) WITH CHECK (true);

-- cobros_mensuales
ALTER TABLE cobros_mensuales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all cobros_mensuales" ON cobros_mensuales;
CREATE POLICY "Allow anon all cobros_mensuales" ON cobros_mensuales FOR ALL TO anon USING (true) WITH CHECK (true);

-- saldos_acudiente
ALTER TABLE saldos_acudiente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all saldos_acudiente" ON saldos_acudiente;
CREATE POLICY "Allow anon all saldos_acudiente" ON saldos_acudiente FOR ALL TO anon USING (true) WITH CHECK (true);
