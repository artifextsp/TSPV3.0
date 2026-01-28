-- ============================================
-- ELIMINAR USUARIO DUPLICADO POR EMAIL
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script busca y elimina el usuario con el email duplicado
-- Email: jacobo.serna@a.seminariopalmira.edu.co
-- 
-- INSTRUCCIONES:
-- 1. Primero ejecuta la consulta SELECT para ver el usuario
-- 2. Verifica que es el correcto antes de eliminar
-- 3. Ejecuta el DELETE solo si estás seguro
-- ============================================

-- ============================================
-- PASO 1: BUSCAR EL USUARIO CON EL EMAIL
-- ============================================

SELECT 
  id,
  email,
  nombre,
  apellidos,
  codigo_estudiante,
  tipo_usuario,
  activo,
  created_at
FROM usuarios
WHERE email = 'jacobo.serna@a.seminariopalmira.edu.co';

-- ============================================
-- PASO 2: VERIFICAR DATOS RELACIONADOS
-- ============================================

-- Verificar si tiene acudientes asociados
SELECT 
  a.id as acudiente_id,
  a.nombre as acudiente_nombre,
  a.email as acudiente_email,
  u.codigo_estudiante
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE u.email = 'jacobo.serna@a.seminariopalmira.edu.co';

-- Verificar si está asignado a algún colegio
SELECT 
  ec.id as asignacion_id,
  c.nombre as colegio_nombre,
  c.codigo as colegio_codigo,
  u.codigo_estudiante
FROM estudiantes_colegios ec
JOIN usuarios u ON ec.estudiante_id = u.id
JOIN colegios c ON ec.colegio_id = c.id
WHERE u.email = 'jacobo.serna@a.seminariopalmira.edu.co';

-- ============================================
-- PASO 3: ELIMINAR EL USUARIO
-- ============================================
-- 
-- ⚠️ ADVERTENCIA: Esto eliminará permanentemente el usuario
-- y todos sus datos relacionados (acudientes, asignaciones, etc.)
-- debido a las restricciones CASCADE.
-- 
-- Ejecuta SOLO si estás seguro de que quieres eliminar este usuario.

-- OPCIÓN A: Eliminar por email (elimina solo este usuario)
DELETE FROM usuarios
WHERE email = 'jacobo.serna@a.seminariopalmira.edu.co';

-- OPCIÓN B: Eliminar por ID específico (más seguro)
-- Reemplaza 'ID_DEL_USUARIO' con el ID que obtuviste en el SELECT anterior
-- DELETE FROM usuarios
-- WHERE id = 'ID_DEL_USUARIO';

-- OPCIÓN C: Soft delete (marcar como inactivo en lugar de eliminar)
-- UPDATE usuarios
-- SET activo = false
-- WHERE email = 'jacobo.serna@a.seminariopalmira.edu.co';

-- ============================================
-- PASO 4: VERIFICAR QUE SE ELIMINÓ
-- ============================================

SELECT 
  COUNT(*) as total_usuarios_con_este_email
FROM usuarios
WHERE email = 'jacobo.serna@a.seminariopalmira.edu.co';

-- Debería mostrar 0 si se eliminó correctamente

-- ============================================
-- NOTAS
-- ============================================
-- 
-- - Si el usuario tiene acudientes asociados, también se eliminarán
--   automáticamente debido a ON DELETE CASCADE
-- 
-- - Si el usuario está asignado a un colegio, la asignación también
--   se eliminará automáticamente
-- 
-- - Si prefieres mantener el registro pero marcarlo como inactivo,
--   usa la OPCIÓN C (soft delete) en lugar de DELETE
