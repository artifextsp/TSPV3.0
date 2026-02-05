-- ============================================
-- FIX RLS: PERMITIR "ELIMINAR" ESTUDIANTE (SOFT DELETE)
-- Thinking Skills Program v2
-- ============================================
--
-- Problema: Al eliminar un estudiante desde el Dashboard Admin, el sistema hace
-- un soft delete (UPDATE usuarios SET activo = false). La política RLS actual
-- en usuarios tiene WITH CHECK (activo = true), por lo que la nueva fila
-- (con activo = false) viola la política y devuelve 401 / 42501.
--
-- Solución: Cambiar la política de UPDATE en usuarios para permitir que la
-- fila resultante tenga activo = false (soft delete desde admin).
--
-- Ejecuta este script en Supabase → SQL Editor.
-- ============================================

-- En PostgreSQL, si hay VARIAS políticas UPDATE, la fila resultante debe
-- cumplir WITH CHECK de TODAS. Por eso eliminamos también la otra política
-- UPDATE que pueda exigir activo = true en la fila resultante.

DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON usuarios;
DROP POLICY IF EXISTS "Permitir actualización de contraseña" ON usuarios;

-- Política 1: actualización normal (cambio de contraseña, etc.). Fila resultante puede ser cualquiera.
CREATE POLICY "Permitir actualización de contraseña"
ON usuarios FOR UPDATE
USING (activo = true)
WITH CHECK (true);

-- Política 2: permite explícitamente que la fila resultante tenga activo = false (soft delete).
CREATE POLICY "Permitir soft delete en usuarios"
ON usuarios FOR UPDATE
USING (activo = true)
WITH CHECK (activo = false);

-- Asegurar que el rol anon (usado por la API con anon key) puede hacer UPDATE en la tabla.
-- Sin este GRANT, RLS podría bloquear aunque las políticas permitan la fila.
GRANT UPDATE ON usuarios TO anon;
GRANT UPDATE ON usuarios TO authenticated;

-- Verificación: listar políticas actuales de usuarios
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;
