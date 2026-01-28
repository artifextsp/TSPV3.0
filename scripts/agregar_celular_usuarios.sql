-- ============================================
-- AGREGAR CAMPO CELULAR A TABLA USUARIOS
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script agrega el campo celular a la tabla usuarios
-- si no existe ya.
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. El campo será opcional (nullable)
-- ============================================

-- Verificar si el campo ya existe antes de agregarlo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'usuarios' 
    AND column_name = 'celular'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN celular TEXT;
    RAISE NOTICE 'Campo celular agregado a la tabla usuarios';
  ELSE
    RAISE NOTICE 'El campo celular ya existe en la tabla usuarios';
  END IF;
END $$;

-- Verificar que el campo se agregó correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'usuarios' 
  AND column_name = 'celular';

-- ============================================
-- VERIFICAR CONSTRAINT DE TIPO_USUARIO
-- ============================================
-- 
-- Asegurémonos de que el constraint incluya 'docente'
-- ============================================

-- Verificar el constraint actual
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'usuarios'::regclass
  AND conname LIKE '%tipo_usuario%';

-- Si el constraint no incluye 'docente', actualizarlo
DO $$
BEGIN
  -- Verificar si existe el constraint y si incluye 'docente'
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'usuarios'::regclass 
    AND conname LIKE '%tipo_usuario%'
    AND pg_get_constraintdef(oid) NOT LIKE '%docente%'
  ) THEN
    -- Eliminar constraint antiguo
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_check;
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS check_tipo_usuario_valido;
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS tipo_usuario_check;
    
    -- Crear nuevo constraint con 'docente' incluido
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_usuario_check
    CHECK (tipo_usuario IN (
      'usuario', 
      'estudiante', 
      'docente', 
      'rector', 
      'admin', 
      'super_admin', 
      'administrador',
      'acudiente'
    ));
    
    RAISE NOTICE 'Constraint actualizado para incluir todos los tipos de usuario';
  ELSE
    RAISE NOTICE 'El constraint ya incluye los tipos de usuario necesarios';
  END IF;
END $$;

-- Verificar el constraint final
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'usuarios'::regclass
  AND conname LIKE '%tipo_usuario%';
