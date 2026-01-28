-- ============================================
-- SOLUCIÓN INMEDIATA: CONFIGURAR RLS PARA AUTENTICACIÓN
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script configura RLS de forma que permita la autenticación
-- sin bloquear el acceso a password_hash necesario para login
-- 
-- ⚠️ EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- PASO 1: HABILITAR RLS EN TABLA USUARIOS
-- ============================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ============================================

-- Eliminar TODAS las políticas existentes de usuarios
DROP POLICY IF EXISTS "Permitir lectura de usuarios activos para autenticación" ON usuarios;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Permitir autenticación" ON usuarios;
DROP POLICY IF EXISTS "Permitir lectura pública de usuarios activos" ON usuarios;
DROP POLICY IF EXISTS "Permitir actualización de contraseña" ON usuarios;

-- ============================================
-- PASO 3: CREAR POLÍTICAS NUEVAS PARA AUTENTICACIÓN
-- ============================================

-- Política que permite leer usuarios activos (necesario para login)
CREATE POLICY "Permitir lectura de usuarios activos para autenticación"
ON usuarios FOR SELECT
USING (activo = true);

-- Política que permite actualizar password_hash y primera_vez (necesario para cambio de contraseña)
CREATE POLICY "Permitir actualización de contraseña"
ON usuarios FOR UPDATE
USING (activo = true)
WITH CHECK (activo = true);

-- ============================================
-- PASO 4: HABILITAR RLS EN TABLA ACUDIENTES
-- ============================================

ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de acudientes
DROP POLICY IF EXISTS "Acudientes pueden ver su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden actualizar su perfil" ON acudientes;
DROP POLICY IF EXISTS "Permitir lectura de acudientes activos" ON acudientes;
DROP POLICY IF EXISTS "Permitir lectura de acudientes activos para autenticación" ON acudientes;
DROP POLICY IF EXISTS "Permitir actualización de acudientes" ON acudientes;

-- ============================================
-- PASO 5: CREAR POLÍTICAS PARA ACUDIENTES
-- ============================================

-- Política para lectura de acudientes activos (necesario para login)
CREATE POLICY "Permitir lectura de acudientes activos para autenticación"
ON acudientes FOR SELECT
USING (activo = true);

-- Política para actualización de acudientes (cambio de contraseña)
CREATE POLICY "Permitir actualización de acudientes"
ON acudientes FOR UPDATE
USING (activo = true)
WITH CHECK (activo = true);

-- ============================================
-- PASO 6: VERIFICACIÓN
-- ============================================

-- Verificar que las políticas están creadas
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('usuarios', 'acudientes')
ORDER BY tablename, policyname;

-- Probar que puedes leer usuarios activos (SIN LÍMITE)
SELECT 
  codigo_estudiante,
  email,
  activo,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✅ Tiene password_hash'
    ELSE '❌ Sin password_hash'
  END as estado_password
FROM usuarios
WHERE activo = true
ORDER BY codigo_estudiante;

-- Contar total de usuarios activos
SELECT 
  COUNT(*) as total_usuarios_activos,
  COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as con_password_hash,
  COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as sin_password_hash
FROM usuarios
WHERE activo = true;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- ⚠️ ESTAS POLÍTICAS SON PERMISIVAS PARA DESARROLLO
-- 
-- En producción, considera:
-- 1. Restringir más las políticas según necesidades específicas
-- 2. Usar funciones de Supabase para autenticación más segura
-- 3. Implementar rate limiting adicional
-- 
-- Por ahora, estas políticas permiten:
-- - ✅ Login de usuarios activos
-- - ✅ Cambio de contraseña
-- - ✅ Lectura de datos necesarios para autenticación
-- 
-- ============================================
