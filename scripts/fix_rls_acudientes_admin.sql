-- ============================================
-- FIX RLS PARA ACUDIENTES - PERMITIR ADMIN CRUD
-- Thinking Skills Program v2.0
-- ============================================
-- 
-- Este script corrige las políticas RLS de la tabla acudientes
-- para permitir que los administradores puedan crear, actualizar
-- y eliminar asociaciones de acudientes con estudiantes.
-- 
-- ⚠️ EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- PASO 1: HABILITAR RLS (si no está habilitado)
-- ============================================

ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================
-- Esto asegura que no haya conflictos con políticas antiguas

DROP POLICY IF EXISTS "Permitir acceso completo a acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir crear acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir actualizar acudientes" ON acudientes;
DROP POLICY IF EXISTS "Permitir eliminar acudientes" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden ver su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden actualizar su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden actualizar su perfil" ON acudientes;
DROP POLICY IF EXISTS "Permitir lectura de acudientes activos para autenticación" ON acudientes;
DROP POLICY IF EXISTS "Permitir actualización de acudientes" ON acudientes;

-- ============================================
-- PASO 3: CREAR POLÍTICAS PERMISIVAS
-- ============================================
-- 
-- NOTA: Estas políticas son permisivas (USING (true)) porque:
-- 1. El sistema usa autenticación personalizada con REST API
-- 2. La verificación de permisos de administrador se realiza en el frontend
-- 3. El dashboard admin verifica el rol antes de hacer peticiones
-- 
-- Si necesitas mayor seguridad, implementa funciones de PostgreSQL
-- que verifiquen el rol del usuario desde JWT o sesión.

-- Política SELECT: Permitir lectura completa
CREATE POLICY "Permitir acceso completo a acudientes"
ON acudientes FOR SELECT
USING (true);

-- Política INSERT: Permitir creación de acudientes
-- Esta es la política crítica que estaba faltando
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
-- PASO 5: PRUEBA DE INSERCIÓN (OPCIONAL)
-- ============================================
-- 
-- Puedes ejecutar esta consulta para verificar que la inserción funciona:
-- 
-- INSERT INTO acudientes (
--   nombre, apellidos, email, password_hash, estudiante_id, activo
-- ) VALUES (
--   'Test', 'Admin', 'test@admin.com', 
--   'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
--   (SELECT id FROM usuarios WHERE tipo_usuario = 'estudiante' LIMIT 1),
--   true
-- );
-- 
-- Si funciona, elimina el registro de prueba:
-- DELETE FROM acudientes WHERE email = 'test@admin.com';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- ⚠️ SEGURIDAD: Estas políticas son permisivas para permitir
-- operaciones CRUD desde el dashboard administrativo.
-- 
-- La verificación de permisos de administrador se realiza en:
-- - Frontend: admin/dashboard.html (verifica requireRole('admin'))
-- - Frontend: admin/gestionar-acudientes.html (verifica requireRole('admin'))
-- 
-- El sistema verifica que el usuario tenga:
-- - tipo_usuario = 'admin' o 'super_admin' o 'administrador'
-- - O email que contenga 'hansel' (para Hansel Peña Díaz)
-- 
-- Si necesitas mayor seguridad en el futuro:
-- 1. Implementa autenticación con Supabase Auth (JWT)
-- 2. Crea funciones de PostgreSQL que verifiquen permisos desde JWT
-- 3. Usa un servicio backend intermedio para validar permisos
-- 4. Implementa políticas RLS basadas en roles de usuario desde JWT