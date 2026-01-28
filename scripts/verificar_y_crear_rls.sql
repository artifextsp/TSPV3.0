-- ============================================
-- SCRIPT SIMPLE: Solo verificar y crear políticas si no existen
-- ============================================

-- Ver políticas existentes
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('usuarios', 'acudientes');

-- Si la política NO existe, crearla
-- Si ya existe, este script no hará nada (no dará error)
DO $$
BEGIN
  -- Para usuarios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usuarios' 
    AND policyname = 'Permitir lectura de usuarios activos para autenticación'
  ) THEN
    CREATE POLICY "Permitir lectura de usuarios activos para autenticación"
    ON usuarios FOR SELECT
    USING (activo = true);
  END IF;
  
  -- Para acudientes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'acudientes' 
    AND policyname = 'Permitir lectura de acudientes activos para autenticación'
  ) THEN
    CREATE POLICY "Permitir lectura de acudientes activos para autenticación"
    ON acudientes FOR SELECT
    USING (activo = true);
  END IF;
END $$;

-- Verificar resultado
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('usuarios', 'acudientes')
ORDER BY tablename, policyname;
