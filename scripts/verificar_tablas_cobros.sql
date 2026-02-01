-- ============================================
-- VERIFICAR TABLAS DEL MÓDULO DE COBROS
-- Ejecuta en Supabase SQL Editor
-- ============================================
-- Si alguna tabla no aparece, ejecuta antes:
--   scripts/crear_modulo_cobros_mensualidades.sql

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('tarifas_mensuales', 'cobros_mensuales', 'saldos_acudiente')
ORDER BY table_name;
