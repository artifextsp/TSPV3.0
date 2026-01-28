-- ============================================
-- ACTUALIZAR CONSTRAINT DE TIPO_USUARIO
-- Thinking Skills Program v2 - Dashboard Administrativo
-- ============================================
-- 
-- Este script actualiza el CHECK constraint de tipo_usuario
-- para permitir los nuevos roles del sistema.
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Verifica que el constraint se actualizó correctamente
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR CONSTRAINT ANTIGUO
-- ============================================

-- Eliminar constraint antiguo si existe (puede tener diferentes nombres)
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_check;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_tipo_usuario_valido;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS tipo_usuario_check;

-- ============================================
-- PASO 2: CREAR NUEVO CONSTRAINT
-- ============================================

-- Crear nuevo constraint que permita todos los roles válidos
ALTER TABLE usuarios 
ADD CONSTRAINT usuarios_tipo_usuario_check 
CHECK (tipo_usuario IN (
  'usuario',      -- Valor legacy (se mapea a 'estudiante' en frontend)
  'estudiante',   -- Nuevo valor para estudiantes
  'docente',      -- Docentes
  'rector',       -- Rectores
  'admin',        -- Administradores
  'super_admin',  -- Super administradores
  'administrador' -- Variante de administrador
));

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que el constraint se creó correctamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'usuarios'::regclass
  AND conname LIKE '%tipo_usuario%';

-- Verificar valores actuales de tipo_usuario
SELECT 
  tipo_usuario,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
GROUP BY tipo_usuario
ORDER BY cantidad DESC;

-- ============================================
-- NOTAS
-- ============================================
-- 
-- El constraint ahora permite:
-- - 'usuario': Valor legacy (compatibilidad con datos antiguos)
-- - 'estudiante': Nuevo valor para estudiantes
-- - 'docente': Docentes
-- - 'rector': Rectores
-- - 'admin', 'super_admin', 'administrador': Administradores
-- 
-- El sistema mapea automáticamente 'usuario' → 'estudiante' en el frontend,
-- por lo que ambos valores funcionan correctamente.
