-- ============================================
-- RECARGAR SCHEMA CACHE EN SUPABASE
-- ============================================
-- Las tablas ya existen pero la API devuelve 404 (PGRST205).
-- PostgREST guarda en caché el esquema; al crear tablas nuevas
-- hay que decirle que recargue.
--
-- 1. Ejecuta el NOTIFY abajo en Supabase → SQL Editor → Run
--    Resultado esperado: "Success. No rows returned"
-- 2. Recarga la pestaña Cobros en tu dashboard (F5)
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- OPCIONAL: Recarga automática en el futuro
-- ============================================
-- Si quieres que cada vez que crees/modifiques tablas la API
-- recargue el esquema solo, ejecuta también este bloque una vez:

/*
CREATE OR REPLACE FUNCTION pgrst_watch() RETURNS event_trigger LANGUAGE plpgsql AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_watch;
CREATE EVENT TRIGGER pgrst_watch ON ddl_command_end EXECUTE PROCEDURE pgrst_watch();
*/
