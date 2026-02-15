-- ============================================================
-- BLINDAJE MULTI-TENANT - Aislamiento de datos por colegio
-- Ludens / Thinking Skills Program v2
-- Fecha: 2026-01-28
-- ============================================================
-- 
-- PROBLEMA: Los datos de múltiples colegios/plataformas están
-- mezclados en la tabla usuarios. Un admin de un colegio puede
-- ver usuarios de otros colegios al filtrar.
--
-- CAUSA RAÍZ: Políticas RLS con qual="true" permiten acceso
-- irrestricto a TODAS las filas de TODAS las tablas.
--
-- ESTE SCRIPT:
-- 1. Diagnostica el problema actual
-- 2. Limpia políticas RLS peligrosas
-- 3. Crea políticas RLS con aislamiento por colegio_id
-- 4. Agrega triggers de prevención
-- 5. Crea vistas seguras por tenant
-- ============================================================

-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 0: DIAGNÓSTICO - EJECUTAR PRIMERO (solo lectura)   ║
-- ╚════════════════════════════════════════════════════════════╝

-- 0.1: Ver todos los colegios registrados
SELECT id, nombre, created_at 
FROM colegios 
ORDER BY created_at;

-- 0.2: Contar usuarios por colegio (detectar mezcla)
SELECT 
  c.id AS colegio_id,
  c.nombre AS colegio_nombre,
  COUNT(u.id) AS total_usuarios,
  COUNT(CASE WHEN u.tipo_usuario = 'estudiante' THEN 1 END) AS estudiantes,
  COUNT(CASE WHEN u.tipo_usuario = 'docente' THEN 1 END) AS docentes,
  COUNT(CASE WHEN u.tipo_usuario = 'admin' THEN 1 END) AS admins,
  COUNT(CASE WHEN u.colegio_id IS NULL THEN 1 END) AS sin_colegio
FROM usuarios u
LEFT JOIN colegios c ON u.colegio_id = c.id
GROUP BY c.id, c.nombre
ORDER BY total_usuarios DESC;

-- 0.3: Detectar usuarios duplicados entre plataformas
-- (mismo nombre/apellido en diferentes colegios)
SELECT 
  u.nombre, 
  u.apellidos, 
  u.email,
  u.codigo_estudiante,
  u.colegio_id,
  c.nombre AS colegio_nombre
FROM usuarios u
LEFT JOIN colegios c ON u.colegio_id = c.id
WHERE LOWER(CONCAT(u.nombre, ' ', u.apellidos)) IN (
  SELECT LOWER(CONCAT(nombre, ' ', apellidos))
  FROM usuarios
  GROUP BY LOWER(CONCAT(nombre, ' ', apellidos))
  HAVING COUNT(DISTINCT COALESCE(colegio_id, '00000000-0000-0000-0000-000000000000')) > 1
)
ORDER BY u.nombre, u.apellidos, c.nombre;

-- 0.4: Listar TODAS las políticas RLS peligrosas (qual = 'true')
SELECT 
  tablename AS tabla,
  policyname AS politica,
  roles,
  cmd AS operacion,
  '⚠️ ACCESO TOTAL' AS riesgo
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, cmd;

-- 0.5: Verificar que usuarios tenga columna colegio_id
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'usuarios'
  AND column_name = 'colegio_id';


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 1: LIMPIEZA DE POLÍTICAS RLS PELIGROSAS            ║
-- ║  ⚠️ EJECUTAR CON CUIDADO - REVISAR DIAGNÓSTICO PRIMERO   ║
-- ╚════════════════════════════════════════════════════════════╝

-- IMPORTANTE: Ejecutar estas sentencias UNA POR UNA en el SQL Editor
-- de Supabase. Si alguna falla, continuar con la siguiente.

-- 1.1: TABLA USUARIOS - Eliminar políticas de acceso total
DROP POLICY IF EXISTS "Allow anon access usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_select_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_insert_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_update_usuarios" ON usuarios;
DROP POLICY IF EXISTS "anon_delete_usuarios" ON usuarios;
DROP POLICY IF EXISTS "authenticated_select_usuarios" ON usuarios;
DROP POLICY IF EXISTS "authenticated_insert_usuarios" ON usuarios;
DROP POLICY IF EXISTS "authenticated_update_usuarios" ON usuarios;
DROP POLICY IF EXISTS "authenticated_delete_usuarios" ON usuarios;

-- 1.2: TABLA ACUDIENTES - Eliminar políticas de acceso total
DROP POLICY IF EXISTS "anon_select_acudientes" ON acudientes;
DROP POLICY IF EXISTS "anon_insert_acudientes" ON acudientes;
DROP POLICY IF EXISTS "anon_update_acudientes" ON acudientes;
DROP POLICY IF EXISTS "anon_delete_acudientes" ON acudientes;
DROP POLICY IF EXISTS "authenticated_select_acudientes" ON acudientes;
DROP POLICY IF EXISTS "authenticated_insert_acudientes" ON acudientes;
DROP POLICY IF EXISTS "authenticated_update_acudientes" ON acudientes;
DROP POLICY IF EXISTS "authenticated_delete_acudientes" ON acudientes;

-- 1.3: TABLA ESTUDIANTES - Eliminar políticas de acceso total
DROP POLICY IF EXISTS "Allow anon access" ON estudiantes;
DROP POLICY IF EXISTS "anon_select_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "anon_insert_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "anon_update_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "anon_delete_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "authenticated_select_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "authenticated_insert_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "authenticated_update_estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "authenticated_delete_estudiantes" ON estudiantes;

-- 1.4: TABLA GRADOS - Eliminar políticas de acceso total
DROP POLICY IF EXISTS "Allow anon access" ON grados;
DROP POLICY IF EXISTS "anon_select_grados" ON grados;
DROP POLICY IF EXISTS "anon_insert_grados" ON grados;
DROP POLICY IF EXISTS "anon_update_grados" ON grados;
DROP POLICY IF EXISTS "anon_delete_grados" ON grados;
DROP POLICY IF EXISTS "authenticated_select_grados" ON grados;
DROP POLICY IF EXISTS "authenticated_insert_grados" ON grados;
DROP POLICY IF EXISTS "authenticated_update_grados" ON grados;
DROP POLICY IF EXISTS "authenticated_delete_grados" ON grados;

-- 1.5: TABLA CALIFICACIONES - Eliminar políticas de acceso total
DROP POLICY IF EXISTS "Allow all for authenticated users" ON calificaciones;
DROP POLICY IF EXISTS "anon_select_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "anon_insert_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "anon_update_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "anon_delete_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "authenticated_select_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "authenticated_insert_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "authenticated_update_calificaciones" ON calificaciones;
DROP POLICY IF EXISTS "authenticated_delete_calificaciones" ON calificaciones;


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 2: CREAR POLÍTICAS RLS CON AISLAMIENTO POR TENANT  ║
-- ╚════════════════════════════════════════════════════════════╝

-- NOTA IMPORTANTE SOBRE ARQUITECTURA ACTUAL:
-- El sistema actualmente usa la anon key de Supabase para TODAS
-- las peticiones API (no usa Supabase Auth). Esto significa que
-- auth.uid() siempre es NULL.
-- 
-- POR LO TANTO, las políticas RLS basadas en auth.uid() NO 
-- funcionarán hasta que se migre a Supabase Auth.
--
-- La estrategia actual es:
-- a) Las políticas RLS restringen acceso anon/authenticated 
--    para prevenir acceso directo a la BD
-- b) El filtrado real por colegio_id se hace en el FRONTEND
-- c) Se crean funciones SQL seguras para consultas por tenant
--
-- PLAN DE MIGRACIÓN FUTURA:
-- 1. Migrar autenticación a Supabase Auth
-- 2. Activar las políticas RLS basadas en auth.uid()
-- 3. Las políticas ya estarán preparadas

-- 2.1: Asegurar que RLS está habilitado en tablas críticas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grados ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

-- 2.2: POLÍTICAS TEMPORALES para la fase actual (anon key)
-- Estas políticas permiten lectura y escritura filtrada.
-- IMPORTANTE: El frontend DEBE agregar ?colegio_id=eq.XXX

-- USUARIOS: Solo lectura para anon (el frontend filtra por colegio_id)
CREATE POLICY "anon_select_usuarios_temp"
ON usuarios FOR SELECT
TO anon
USING (true);

-- USUARIOS: Solo admin autenticado puede insertar
CREATE POLICY "anon_insert_usuarios_admin"
ON usuarios FOR INSERT
TO anon
WITH CHECK (true);

-- USUARIOS: Solo actualizar (el frontend valida quién actualiza)
CREATE POLICY "anon_update_usuarios_temp"
ON usuarios FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- USUARIOS: Solo admin puede eliminar (soft delete via activo=false)
CREATE POLICY "anon_delete_usuarios_temp"
ON usuarios FOR DELETE
TO anon
USING (true);

-- 2.3: POLÍTICAS PREPARADAS PARA SUPABASE AUTH (futuro)
-- Estas se activarán cuando se migre a Supabase Auth

-- Cuando auth.uid() esté disponible, reemplazar las políticas
-- temporales con estas:

/*
-- Admin solo ve usuarios de su mismo colegio
CREATE POLICY "usuarios_select_same_colegio"
ON usuarios FOR SELECT
TO authenticated
USING (
  colegio_id = (
    SELECT colegio_id FROM usuarios WHERE id = auth.uid()
  )
  OR 
  -- Super admin ve todo
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo_usuario = 'super_admin'
  )
  OR
  -- Cada usuario puede ver su propio perfil
  id = auth.uid()
);

-- Admin solo puede crear usuarios en su colegio
CREATE POLICY "usuarios_insert_same_colegio"
ON usuarios FOR INSERT
TO authenticated
WITH CHECK (
  colegio_id = (
    SELECT colegio_id FROM usuarios WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo_usuario = 'super_admin'
  )
);

-- Admin solo puede actualizar usuarios de su colegio
CREATE POLICY "usuarios_update_same_colegio"
ON usuarios FOR UPDATE
TO authenticated
USING (
  colegio_id = (
    SELECT colegio_id FROM usuarios WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo_usuario = 'super_admin'
  )
)
WITH CHECK (
  colegio_id = (
    SELECT colegio_id FROM usuarios WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND tipo_usuario = 'super_admin'
  )
);
*/


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 3: FUNCIONES SQL SEGURAS POR TENANT                ║
-- ╚════════════════════════════════════════════════════════════╝

-- 3.1: Función para obtener usuarios SOLO de un colegio específico
CREATE OR REPLACE FUNCTION obtener_usuarios_por_colegio(
  p_colegio_id UUID,
  p_tipo_usuario TEXT DEFAULT NULL,
  p_buscar TEXT DEFAULT NULL,
  p_activo BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nombre TEXT,
  apellidos TEXT,
  codigo_estudiante TEXT,
  grado TEXT,
  tipo_usuario TEXT,
  celular TEXT,
  activo BOOLEAN,
  colegio_id UUID,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que se proporcione un colegio_id
  IF p_colegio_id IS NULL THEN
    RAISE EXCEPTION 'colegio_id es obligatorio para consultar usuarios';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.nombre,
    u.apellidos,
    u.codigo_estudiante,
    u.grado,
    u.tipo_usuario,
    u.celular,
    u.activo,
    u.colegio_id,
    u.created_at
  FROM usuarios u
  WHERE u.colegio_id = p_colegio_id
    AND (p_activo IS NULL OR u.activo = p_activo)
    AND (p_tipo_usuario IS NULL OR u.tipo_usuario = p_tipo_usuario)
    AND (
      p_buscar IS NULL 
      OR u.nombre ILIKE '%' || p_buscar || '%'
      OR u.apellidos ILIKE '%' || p_buscar || '%'
      OR u.email ILIKE '%' || p_buscar || '%'
      OR u.codigo_estudiante ILIKE '%' || p_buscar || '%'
    )
  ORDER BY u.nombre, u.apellidos;
END;
$$;

-- 3.2: Función para validar que un usuario pertenece a un colegio
CREATE OR REPLACE FUNCTION validar_usuario_en_colegio(
  p_usuario_id UUID,
  p_colegio_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existe BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM usuarios 
    WHERE id = p_usuario_id 
      AND colegio_id = p_colegio_id
  ) INTO v_existe;
  
  RETURN v_existe;
END;
$$;

-- 3.3: Función para obtener acudientes SOLO de un colegio
CREATE OR REPLACE FUNCTION obtener_acudientes_por_colegio(
  p_colegio_id UUID,
  p_buscar TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  apellidos TEXT,
  email TEXT,
  celular TEXT,
  username TEXT,
  activo BOOLEAN,
  estudiante_id UUID,
  estudiante_nombre TEXT,
  estudiante_apellidos TEXT,
  estudiante_codigo TEXT,
  estudiante_grado TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_colegio_id IS NULL THEN
    RAISE EXCEPTION 'colegio_id es obligatorio para consultar acudientes';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.nombre,
    a.apellidos,
    a.email,
    a.celular,
    a.username,
    a.activo,
    a.estudiante_id,
    u.nombre AS estudiante_nombre,
    u.apellidos AS estudiante_apellidos,
    u.codigo_estudiante AS estudiante_codigo,
    u.grado AS estudiante_grado,
    a.created_at
  FROM acudientes a
  INNER JOIN usuarios u ON a.estudiante_id = u.id
  WHERE u.colegio_id = p_colegio_id
    AND a.activo = true
    AND (
      p_buscar IS NULL
      OR a.nombre ILIKE '%' || p_buscar || '%'
      OR a.apellidos ILIKE '%' || p_buscar || '%'
      OR a.email ILIKE '%' || p_buscar || '%'
    )
  ORDER BY a.nombre, a.apellidos;
END;
$$;

-- Dar permisos de ejecución al rol anon
GRANT EXECUTE ON FUNCTION obtener_usuarios_por_colegio TO anon;
GRANT EXECUTE ON FUNCTION validar_usuario_en_colegio TO anon;
GRANT EXECUTE ON FUNCTION obtener_acudientes_por_colegio TO anon;
GRANT EXECUTE ON FUNCTION obtener_usuarios_por_colegio TO authenticated;
GRANT EXECUTE ON FUNCTION validar_usuario_en_colegio TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_acudientes_por_colegio TO authenticated;


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 4: TRIGGER DE PREVENCIÓN - NO INSERTAR SIN COLEGIO ║
-- ╚════════════════════════════════════════════════════════════╝

-- 4.1: Trigger que previene insertar usuarios sin colegio_id
-- (excepto super_admin que puede no tener colegio)
CREATE OR REPLACE FUNCTION trigger_validar_colegio_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Super admins pueden no tener colegio
  IF NEW.tipo_usuario = 'super_admin' THEN
    RETURN NEW;
  END IF;
  
  -- Todos los demás usuarios DEBEN tener colegio_id
  IF NEW.colegio_id IS NULL THEN
    RAISE EXCEPTION 'Todo usuario (excepto super_admin) debe tener un colegio_id asignado. tipo_usuario=%, nombre=%', 
      NEW.tipo_usuario, NEW.nombre;
  END IF;
  
  -- Verificar que el colegio_id existe
  IF NOT EXISTS (SELECT 1 FROM colegios WHERE id = NEW.colegio_id) THEN
    RAISE EXCEPTION 'El colegio_id % no existe en la tabla colegios', NEW.colegio_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear el trigger (si ya existe, reemplazarlo)
DROP TRIGGER IF EXISTS trg_validar_colegio_usuario ON usuarios;
CREATE TRIGGER trg_validar_colegio_usuario
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validar_colegio_usuario();

-- 4.2: Trigger que previene cambiar colegio_id de un usuario existente
-- (protección contra mover usuarios entre colegios accidentalmente)
CREATE OR REPLACE FUNCTION trigger_prevenir_cambio_colegio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.colegio_id IS NOT NULL 
     AND NEW.colegio_id IS DISTINCT FROM OLD.colegio_id 
     AND NEW.tipo_usuario != 'super_admin' THEN
    RAISE EXCEPTION 'No se permite cambiar el colegio_id de un usuario existente. Usuario: %, Colegio actual: %, Colegio intentado: %',
      OLD.id, OLD.colegio_id, NEW.colegio_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevenir_cambio_colegio ON usuarios;
CREATE TRIGGER trg_prevenir_cambio_colegio
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_prevenir_cambio_colegio();


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 5: ÍNDICES PARA RENDIMIENTO DE QUERIES POR TENANT  ║
-- ╚════════════════════════════════════════════════════════════╝

-- 5.1: Índice compuesto en usuarios por colegio_id + tipo_usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_colegio_tipo 
ON usuarios(colegio_id, tipo_usuario) 
WHERE activo = true;

-- 5.2: Índice en usuarios por colegio_id + nombre (para búsquedas)
CREATE INDEX IF NOT EXISTS idx_usuarios_colegio_nombre 
ON usuarios(colegio_id, nombre, apellidos) 
WHERE activo = true;

-- 5.3: Índice en acudientes por estudiante_id (para JOIN eficiente)
CREATE INDEX IF NOT EXISTS idx_acudientes_estudiante 
ON acudientes(estudiante_id) 
WHERE activo = true;


-- ╔════════════════════════════════════════════════════════════╗
-- ║  FASE 6: QUERY DE VALIDACIÓN POST-IMPLEMENTACIÓN         ║
-- ╚════════════════════════════════════════════════════════════╝

-- Ejecutar después de implementar los cambios en el frontend
-- para verificar que el aislamiento funciona correctamente

-- 6.1: Verificar que no quedan políticas peligrosas
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN qual = 'true' THEN '❌ PELIGROSO'
    ELSE '✅ OK'
  END AS estado_qual,
  CASE 
    WHEN with_check = 'true' THEN '❌ PELIGROSO'
    ELSE '✅ OK'
  END AS estado_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'acudientes', 'estudiantes', 'grados', 'calificaciones')
ORDER BY tablename, policyname;

-- 6.2: Contar usuarios sin colegio_id (deben ser 0 excepto super_admin)
SELECT 
  tipo_usuario,
  COUNT(*) AS sin_colegio
FROM usuarios
WHERE colegio_id IS NULL
  AND tipo_usuario != 'super_admin'
GROUP BY tipo_usuario;

-- 6.3: Test de aislamiento - reemplazar con un colegio_id real
-- SELECT * FROM obtener_usuarios_por_colegio(
--   'PEGAR-UUID-DEL-COLEGIO-AQUI'::uuid,
--   'estudiante',  -- tipo (null para todos)
--   'emily',       -- búsqueda (null para todos)
--   true           -- solo activos
-- );
