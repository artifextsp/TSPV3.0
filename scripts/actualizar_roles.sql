-- ============================================
-- SCRIPT SQL PARA ACTUALIZAR ROLES
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script ayuda a actualizar los roles de usuarios existentes
-- a los nuevos roles del sistema: estudiante, docente, rector
-- 
-- INSTRUCCIONES:
-- 1. Revisa los ejemplos y ajusta según tus necesidades
-- 2. Ejecuta solo las queries que necesites
-- 3. Verifica los cambios antes de confirmar
-- ============================================

-- ============================================
-- VERIFICAR ROLES ACTUALES
-- ============================================

-- Ver qué roles existen actualmente en la tabla
SELECT 
  tipo_usuario,
  COUNT(*) as cantidad
FROM usuarios
WHERE activo = true
GROUP BY tipo_usuario
ORDER BY cantidad DESC;

-- Ver algunos ejemplos de usuarios por rol actual
SELECT 
  email,
  nombre,
  tipo_usuario,
  codigo_estudiante
FROM usuarios
WHERE activo = true
ORDER BY tipo_usuario, nombre
LIMIT 20;

-- ============================================
-- ACTUALIZAR ROLES SEGÚN NECESIDADES
-- ============================================

-- OPCIÓN 1: Migrar todos los usuarios con tipo 'usuario' a 'estudiante'
-- (Descomenta si aplica)
-- UPDATE usuarios 
-- SET tipo_usuario = 'estudiante'
-- WHERE tipo_usuario = 'usuario'
--   AND activo = true;

-- OPCIÓN 2: Actualizar usuarios específicos a 'docente'
-- (Ajusta los emails según tus docentes)
-- UPDATE usuarios 
-- SET tipo_usuario = 'docente'
-- WHERE email IN (
--   'docente1@ejemplo.com',
--   'docente2@ejemplo.com',
--   'docente3@ejemplo.com'
-- )
--   AND activo = true;

-- OPCIÓN 3: Actualizar usuarios específicos a 'rector'
-- (Ajusta los emails según tus rectores)
-- UPDATE usuarios 
-- SET tipo_usuario = 'rector'
-- WHERE email IN (
--   'rector@ejemplo.com',
--   'director@ejemplo.com'
-- )
--   AND activo = true;

-- OPCIÓN 4: Actualizar según código de estudiante
-- (Si los estudiantes tienen código EST#### y docentes tienen otro formato)
-- UPDATE usuarios 
-- SET tipo_usuario = 'estudiante'
-- WHERE codigo_estudiante LIKE 'EST%'
--   AND activo = true;

-- ============================================
-- VALIDAR QUE LOS ROLES SEAN VÁLIDOS
-- ============================================

-- Verificar que todos los usuarios tengan roles válidos
SELECT 
  email,
  nombre,
  tipo_usuario,
  CASE 
    WHEN tipo_usuario IN ('estudiante', 'docente', 'rector') THEN '✅ Válido'
    ELSE '❌ Inválido - Actualizar'
  END as estado
FROM usuarios
WHERE activo = true
ORDER BY estado, tipo_usuario;

-- Contar usuarios por rol válido
SELECT 
  tipo_usuario,
  COUNT(*) as cantidad,
  CASE 
    WHEN tipo_usuario IN ('estudiante', 'docente', 'rector') THEN '✅'
    ELSE '❌'
  END as valido
FROM usuarios
WHERE activo = true
GROUP BY tipo_usuario
ORDER BY valido, tipo_usuario;

-- ============================================
-- CREAR CONSTRAINT PARA VALIDAR ROLES
-- ============================================

-- Opcional: Crear constraint para asegurar que solo se usen roles válidos
-- (Descomenta si quieres forzar validación a nivel de base de datos)

-- ALTER TABLE usuarios 
-- DROP CONSTRAINT IF EXISTS check_tipo_usuario_valido;

-- ALTER TABLE usuarios 
-- ADD CONSTRAINT check_tipo_usuario_valido 
-- CHECK (tipo_usuario IN ('estudiante', 'docente', 'rector'));

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver resumen final de roles
SELECT 
  tipo_usuario,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN primera_vez = true THEN 1 END) as primera_vez,
  COUNT(CASE WHEN activo = false THEN 1 END) as inactivos
FROM usuarios
GROUP BY tipo_usuario
ORDER BY 
  CASE tipo_usuario
    WHEN 'rector' THEN 1
    WHEN 'docente' THEN 2
    WHEN 'estudiante' THEN 3
    ELSE 4
  END;

-- ============================================
-- NOTAS
-- ============================================
-- 
-- 1. Los roles válidos son: estudiante, docente, rector
-- 2. Asegúrate de actualizar todos los usuarios antes de activar el constraint
-- 3. Los usuarios inactivos no afectan el sistema de autenticación
-- 4. Revisa los resultados antes de hacer cambios masivos
-- 
-- ============================================
