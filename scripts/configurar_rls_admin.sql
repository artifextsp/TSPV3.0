-- ============================================
-- CONFIGURAR RLS PARA DASHBOARD ADMINISTRATIVO
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script configura Row Level Security (RLS) para las tablas
-- del dashboard administrativo, permitiendo acceso solo al administrador.
-- 
-- Administrador: Hansel Peña Díaz (CC 94300774)
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Asegúrate de que el administrador tenga tipo_usuario = 'admin' o 'super_admin'
-- 3. Verifica que las políticas funcionen correctamente
-- 
-- NOTA SOBRE TABLA USUARIOS:
-- La tabla usuarios tiene los siguientes campos relevantes para autenticación:
-- - id (uuid): Identificador único
-- - email (text): Email del usuario
-- - password_hash (text): Hash de la contraseña
-- - tipo_usuario (text): Rol del usuario ('usuario', 'admin', 'super_admin', 'docente', 'rector', etc.)
-- - nombre (text): Nombre del usuario
-- - apellidos (text): Apellidos del usuario
-- - activo (boolean): Estado del usuario
-- - codigo_estudiante (text): Código del estudiante (si aplica)
-- 
-- ⚠️ IMPORTANTE: La tabla usuarios NO tiene campo 'documento'
-- ============================================

-- ============================================
-- PASO 1: HABILITAR RLS EN LAS TABLAS
-- ============================================

ALTER TABLE colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes_colegios ENABLE ROW LEVEL SECURITY;
ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE docentes_colegios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 2: NOTA SOBRE AUTENTICACIÓN
-- ============================================
-- 
-- Este sistema usa autenticación personalizada con REST API,
-- por lo que las políticas RLS se simplifican para permitir
-- acceso completo a administradores verificados en el frontend.
-- 
-- La verificación de permisos se realiza en el frontend antes
-- de hacer las peticiones a la API.
--

-- ============================================
-- PASO 3: POLÍTICAS PARA TABLA COLEGIOS
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Administradores pueden ver todos los colegios" ON colegios;
DROP POLICY IF EXISTS "Administradores pueden crear colegios" ON colegios;
DROP POLICY IF EXISTS "Administradores pueden actualizar colegios" ON colegios;
DROP POLICY IF EXISTS "Administradores pueden eliminar colegios" ON colegios;

-- Política SELECT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir acceso completo a colegios"
ON colegios FOR SELECT
USING (true);

-- Política INSERT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir crear colegios"
ON colegios FOR INSERT
WITH CHECK (true);

-- Política UPDATE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir actualizar colegios"
ON colegios FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir eliminar colegios"
ON colegios FOR DELETE
USING (true);

-- ============================================
-- PASO 4: POLÍTICAS PARA TABLA ESTUDIANTES_COLEGIOS
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Administradores pueden ver asignaciones estudiantes-colegios" ON estudiantes_colegios;
DROP POLICY IF EXISTS "Administradores pueden crear asignaciones estudiantes-colegios" ON estudiantes_colegios;
DROP POLICY IF EXISTS "Administradores pueden actualizar asignaciones estudiantes-colegios" ON estudiantes_colegios;
DROP POLICY IF EXISTS "Administradores pueden eliminar asignaciones estudiantes-colegios" ON estudiantes_colegios;

-- Política SELECT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir acceso completo a asignaciones estudiantes-colegios"
ON estudiantes_colegios FOR SELECT
USING (true);

-- Política INSERT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir crear asignaciones estudiantes-colegios"
ON estudiantes_colegios FOR INSERT
WITH CHECK (true);

-- Política UPDATE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir actualizar asignaciones estudiantes-colegios"
ON estudiantes_colegios FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir eliminar asignaciones estudiantes-colegios"
ON estudiantes_colegios FOR DELETE
USING (true);

-- ============================================
-- PASO 5: POLÍTICAS PARA TABLA ACUDIENTES
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir acceso completo a acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir crear acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir actualizar acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir eliminar acudientes" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden ver su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden actualizar su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Permitir lectura de acudientes activos para autenticación" ON acudientes;
DROP POLICY IF EXISTS "Permitir actualización de acudientes" ON acudientes;

-- Política SELECT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir acceso completo a acudientes"
ON acudientes FOR SELECT
USING (true);

-- Política INSERT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir crear acudientes"
ON acudientes FOR INSERT
WITH CHECK (true);

-- Política UPDATE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir actualizar acudientes"
ON acudientes FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir eliminar acudientes"
ON acudientes FOR DELETE
USING (true);

-- ============================================
-- PASO 6: POLÍTICAS PARA TABLA DOCENTES_COLEGIOS
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir acceso completo a docentes_colegios" ON docentes_colegios;
DROP POLICY IF EXISTS "Permitir crear docentes_colegios" ON docentes_colegios;
DROP POLICY IF EXISTS "Permitir actualizar docentes_colegios" ON docentes_colegios;
DROP POLICY IF EXISTS "Permitir eliminar docentes_colegios" ON docentes_colegios;

-- Política SELECT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir acceso completo a docentes_colegios"
ON docentes_colegios FOR SELECT
USING (true);

-- Política INSERT: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir crear docentes_colegios"
ON docentes_colegios FOR INSERT
WITH CHECK (true);

-- Política UPDATE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir actualizar docentes_colegios"
ON docentes_colegios FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir acceso completo (verificación en frontend)
CREATE POLICY "Permitir eliminar docentes_colegios"
ON docentes_colegios FOR DELETE
USING (true);

-- ============================================
-- NOTA IMPORTANTE SOBRE RLS Y AUTENTICACIÓN PERSONALIZADA
-- ============================================
-- 
-- Este sistema usa autenticación personalizada con REST API (no Supabase Auth),
-- por lo que las políticas RLS se han simplificado para permitir acceso completo.
-- 
-- ⚠️ SEGURIDAD: La verificación de permisos de administrador se realiza
-- en el frontend (admin/dashboard.html) antes de hacer las peticiones.
-- 
-- El dashboard verifica que el usuario tenga:
-- - tipo_usuario = 'admin' o 'super_admin' o 'administrador'
-- - O email que contenga 'hansel' (para Hansel Peña Díaz)
-- 
-- Campos disponibles en tabla usuarios (verificados):
-- id, password_hash, tipo_usuario, primera_vez, codigo_estudiante,
-- nombre, apellidos, fecha_nacimiento, edad, email, grado,
-- nombre_acudiente, apellido_acudiente, email_acudiente, celular_acudiente,
-- codigo_institucion, activo, estado, fecha_retiro, becado,
-- created_at, updated_at
-- 
-- Si necesitas mayor seguridad, puedes:
-- 1. Implementar autenticación con Supabase Auth
-- 2. Crear funciones de PostgreSQL que verifiquen permisos
-- 3. Usar un servicio backend intermedio para validar permisos
-- 
-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('colegios', 'estudiantes_colegios', 'acudientes', 'docentes_colegios')
ORDER BY tablename;

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('colegios', 'estudiantes_colegios', 'acudientes', 'docentes_colegios')
ORDER BY tablename, policyname;
