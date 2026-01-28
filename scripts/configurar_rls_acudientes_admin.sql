-- ============================================
-- CONFIGURAR RLS PARA ACUDIENTES - DASHBOARD ADMINISTRATIVO
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script configura Row Level Security (RLS) para la tabla acudientes,
-- permitiendo operaciones CRUD completas desde el dashboard administrativo.
-- 
-- ⚠️ EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- PASO 1: HABILITAR RLS EN TABLA ACUDIENTES (si no está habilitado)
-- ============================================

ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 2: ELIMINAR POLÍTICAS EXISTENTES QUE PUEDAN BLOQUEAR
-- ============================================

DROP POLICY IF EXISTS "Permitir acceso completo a acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir crear acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir actualizar acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir eliminar acudientes" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden ver su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden actualizar su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Permitir lectura de acudientes activos para autenticación" ON acudientes;

-- ============================================
-- PASO 3: CREAR POLÍTICAS PERMISIVAS PARA ADMINISTRADOR
-- ============================================
-- 
-- NOTA: Estas políticas son permisivas porque el sistema usa
-- autenticación personalizada con REST API. La verificación de
-- permisos de administrador se realiza en el frontend antes de
-- hacer las peticiones a la API.

-- Política SELECT: Permitir lectura completa
CREATE POLICY "Permitir acceso completo a acudientes"
ON acudientes FOR SELECT
USING (true);

-- Política INSERT: Permitir creación de acudientes
CREATE POLICY "Permitir crear acudientes"
ON acudientes FOR INSERT
WITH CHECK (true);

-- Política UPDATE: Permitir actualización de acudientes
CREATE POLICY "Permitir actualizar acudientes"
ON acudientes FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política DELETE: Permitir eliminación de acudientes
CREATE POLICY "Permitir eliminar acudientes"
ON acudientes FOR DELETE
USING (true);

-- ============================================
-- PASO 4: VERIFICACIÓN
-- ============================================

-- Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'acudientes';

-- Verificar políticas creadas
SELECT 
  tablename,
  policyname,
  cmd as operacion,
  permissive,
  qual as condicion_using,
  with_check as condicion_check
FROM pg_policies
WHERE tablename = 'acudientes'
ORDER BY policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- ⚠️ SEGURIDAD: Estas políticas son permisivas para permitir
-- operaciones CRUD desde el dashboard administrativo.
-- 
-- La verificación de permisos de administrador se realiza en el
-- frontend (admin/dashboard.html) antes de hacer las peticiones.
-- 
-- El dashboard verifica que el usuario tenga:
-- - tipo_usuario = 'admin' o 'super_admin' o 'administrador'
-- - O email que contenga 'hansel' (para Hansel Peña Díaz)
-- 
-- Si necesitas mayor seguridad, puedes:
-- 1. Implementar autenticación con Supabase Auth
-- 2. Crear funciones de PostgreSQL que verifiquen permisos
-- 3. Usar un servicio backend intermedio para validar permisos
