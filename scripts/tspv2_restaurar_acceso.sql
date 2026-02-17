-- ============================================================
-- TSPV2: DIAGNÓSTICO Y RESTAURACIÓN DE ACCESO
-- Base de datos: TSPV2 (Supabase)
-- Fecha: 2026-02
-- ============================================================
--
-- PROBLEMA: El frontend actual pide el campo colegio_id al hacer
-- login; si la tabla usuarios en TSPV2 no tiene esa columna,
-- Supabase devuelve 400: column "usuarios.colegio_id" does not exist (42703).
--
-- ESTE SCRIPT:
-- 1. Diagnostica estructura y RLS en TSPV2
-- 2. Añade colegio_id a usuarios si no existe
-- 3. Asegura políticas RLS que permitan login (anon SELECT)
-- 4. Opcional: asigna un colegio por defecto a usuarios existentes
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → proyecto TSPV2
-- ============================================================

-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 1: DIAGNÓSTICO (solo lectura)                       ║
-- ╚════════════════════════════════════════════════════════════╝

-- 1.1 Columnas actuales de la tabla usuarios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- 1.2 ¿Existe la columna colegio_id?
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'colegio_id'
) AS tiene_colegio_id;

-- 1.3 Políticas RLS activas en usuarios
SELECT policyname, cmd AS operacion, roles, qual AS using_expr
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios'
ORDER BY cmd, policyname;

-- 1.4 ¿RLS está habilitado?
SELECT relname AS tabla, relrowsecurity AS rls_activo
FROM pg_class
WHERE relname = 'usuarios';

-- 1.5 Tabla colegios (debe existir para la FK)
SELECT id, nombre, activo FROM colegios LIMIT 5;

-- 1.6 Si existe estudiantes_colegios, ver relación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudiantes_colegios') THEN
    RAISE NOTICE 'Tabla estudiantes_colegios existe. Puedes rellenar colegio_id desde aquí.';
  ELSE
    RAISE NOTICE 'Tabla estudiantes_colegios no existe. colegio_id se dejará NULL o se asignará al primer colegio.';
  END IF;
END $$;


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 2: AÑADIR COLUMNA colegio_id SI NO EXISTE            ║
-- ╚════════════════════════════════════════════════════════════╝

-- 2.1 Añadir colegio_id (nullable, FK a colegios)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'colegio_id'
  ) THEN
    ALTER TABLE usuarios
      ADD COLUMN colegio_id UUID REFERENCES colegios(id) ON DELETE SET NULL;
    RAISE NOTICE 'Columna usuarios.colegio_id creada correctamente.';
  ELSE
    RAISE NOTICE 'La columna usuarios.colegio_id ya existe.';
  END IF;
END $$;

-- 2.2 Índice para filtros por colegio (rendimiento)
CREATE INDEX IF NOT EXISTS idx_usuarios_colegio_id ON usuarios(colegio_id);


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 3: ASIGNAR colegio_id A USUARIOS EXISTENTES (opcional)║
-- ╚════════════════════════════════════════════════════════════╝

-- Opción A: Si tienes tabla estudiantes_colegios, rellenar desde ahí
DO $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'estudiantes_colegios') THEN
    UPDATE usuarios u
    SET colegio_id = ec.colegio_id
    FROM estudiantes_colegios ec
    WHERE u.id = ec.estudiante_id AND u.colegio_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'Estudiantes actualizados con colegio_id desde estudiantes_colegios: %', v_updated;
  END IF;
END $$;

-- Opción B: Asignar el primer colegio activo a todos los que no tengan colegio_id
-- (Descomenta y ejecuta si tienes un solo colegio y quieres que todos queden asignados)
/*
DO $$
DECLARE
  v_colegio_id UUID;
  v_updated INTEGER := 0;
BEGIN
  SELECT id INTO v_colegio_id FROM colegios WHERE activo = true LIMIT 1;
  IF v_colegio_id IS NOT NULL THEN
    UPDATE usuarios SET colegio_id = v_colegio_id WHERE colegio_id IS NULL;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE 'Usuarios asignados al colegio por defecto: %', v_updated;
  END IF;
END $$;
*/


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 4: POLÍTICAS RLS PARA PERMITIR LOGIN                 ║
-- ╚════════════════════════════════════════════════════════════╝

-- La app usa la clave anon y hace GET a usuarios?email=eq.X&select=...
-- Sin una política SELECT para anon, el login falla (403 o 0 filas).

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas que puedan bloquear (nombres comunes)
DROP POLICY IF EXISTS "Allow anon access usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_select_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_select_usuarios_temp" ON usuarios;

-- Política que permite a anon leer usuarios (necesaria para login)
CREATE POLICY "anon_select_usuarios_temp"
ON usuarios FOR SELECT
TO anon
USING (true);

-- Si faltan INSERT/UPDATE/DELETE para el flujo admin, crearlas
DROP POLICY IF EXISTS "anon_insert_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_insert_usuarios_admin" ON usuarios;
CREATE POLICY "anon_insert_usuarios_admin"
ON usuarios FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_update_usuarios_temp" ON usuarios;
CREATE POLICY "anon_update_usuarios_temp"
ON usuarios FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_delete_usuarios_temp" ON usuarios;
CREATE POLICY "anon_delete_usuarios_temp"
ON usuarios FOR DELETE TO anon USING (true);


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 5: TABLA ACUDIENTES (login acudientes)              ║
-- ╚════════════════════════════════════════════════════════════╝

-- Asegurar que anon puede SELECT en acudientes para login
ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_acudientes" ON acudientes;
DROP POLICY IF EXISTS "anon_select_acudientes_temp" ON acudientes;
CREATE POLICY "anon_select_acudientes_temp"
ON acudientes FOR SELECT TO anon USING (true);


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 6: VERIFICACIÓN FINAL                                ║
-- ╚════════════════════════════════════════════════════════════╝

-- 6.1 Confirmar que colegio_id existe
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'colegio_id';

-- 6.2 Políticas actuales en usuarios
SELECT policyname, cmd, roles FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios';

-- 6.3 Conteo de usuarios con y sin colegio_id
SELECT
  COUNT(*) FILTER (WHERE colegio_id IS NOT NULL) AS con_colegio,
  COUNT(*) FILTER (WHERE colegio_id IS NULL) AS sin_colegio,
  COUNT(*) AS total
FROM usuarios;
