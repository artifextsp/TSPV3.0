-- ============================================
-- ASOCIAR ESTUDIANTES Y ACUDIENTES A INSTITUCIÓN
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script asocia todos los estudiantes activos y sus acudientes
-- a una institución (colegio) específica.
-- 
-- ⚠️ IMPORTANTE: 
-- 1. Primero crea la institución en el dashboard administrativo
-- 2. Obtén el código de la institución (ej: COL001)
-- 3. Reemplaza 'COL001' en este script con el código real
-- 4. Ejecuta este script completo en Supabase SQL Editor
-- ============================================

-- ============================================
-- PASO 1: CONFIGURAR CÓDIGO DE LA INSTITUCIÓN
-- ============================================
-- ⚠️ CAMBIAR ESTE VALOR POR EL CÓDIGO DE TU INSTITUCIÓN
-- Ejemplo: 'COL001', 'COL002', etc.

DO $$
DECLARE
  v_codigo_institucion TEXT := 'COL001';  -- ⚠️ CAMBIAR AQUÍ
  v_colegio_id UUID;  -- Variable con prefijo para evitar ambigüedad
  estudiantes_asociados INTEGER := 0;
  estudiantes_actualizados INTEGER := 0;
BEGIN
  -- ============================================
  -- PASO 2: VERIFICAR QUE LA INSTITUCIÓN EXISTE
  -- ============================================
  
  SELECT id INTO v_colegio_id
  FROM colegios
  WHERE codigo = v_codigo_institucion
    AND activo = true;
  
  IF v_colegio_id IS NULL THEN
    RAISE EXCEPTION 'La institución con código % no existe o está inactiva. Verifica el código.', v_codigo_institucion;
  END IF;
  
  RAISE NOTICE '✅ Institución encontrada: % (ID: %)', v_codigo_institucion, v_colegio_id;
  
  -- ============================================
  -- PASO 3: ASOCIAR ESTUDIANTES A LA INSTITUCIÓN
  -- ============================================
  -- Usa la tabla estudiantes_colegios para la relación
  
  -- Primero, eliminar asignaciones existentes si las hay (opcional)
  -- Descomenta la siguiente línea si quieres reasignar estudiantes que ya tienen colegio
  -- DELETE FROM estudiantes_colegios WHERE estudiante_id IN (SELECT id FROM usuarios WHERE codigo_estudiante LIKE 'EST%' AND activo = true);
  
  -- Insertar asociaciones para estudiantes que NO tienen colegio asignado
  INSERT INTO estudiantes_colegios (colegio_id, estudiante_id)
  SELECT 
    v_colegio_id,
    u.id
  FROM usuarios u
  WHERE u.activo = true
    AND u.codigo_estudiante LIKE 'EST%'
    AND NOT EXISTS (
      SELECT 1 FROM estudiantes_colegios ec 
      WHERE ec.estudiante_id = u.id
    )
  ON CONFLICT (estudiante_id) DO NOTHING;
  
  GET DIAGNOSTICS estudiantes_asociados = ROW_COUNT;
  
  RAISE NOTICE '✅ Estudiantes asociados a la institución: %', estudiantes_asociados;
  
  -- ============================================
  -- PASO 4: ACTUALIZAR CAMPO codigo_institucion EN USUARIOS
  -- ============================================
  -- Actualiza el campo codigo_institucion para todos los estudiantes asociados
  
  UPDATE usuarios u
  SET codigo_institucion = v_codigo_institucion
  WHERE u.activo = true
    AND u.codigo_estudiante LIKE 'EST%'
    AND EXISTS (
      SELECT 1 FROM estudiantes_colegios ec 
      WHERE ec.estudiante_id = u.id 
        AND ec.colegio_id = v_colegio_id
    );
  
  GET DIAGNOSTICS estudiantes_actualizados = ROW_COUNT;
  
  RAISE NOTICE '✅ Campo codigo_institucion actualizado para % estudiantes', estudiantes_actualizados;
  
  -- ============================================
  -- PASO 5: RESUMEN FINAL
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '✅ PROCESO COMPLETADO';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'Institución: %', v_codigo_institucion;
  RAISE NOTICE 'Estudiantes asociados: %', estudiantes_asociados;
  RAISE NOTICE 'Estudiantes actualizados: %', estudiantes_actualizados;
  RAISE NOTICE '';
  RAISE NOTICE 'Los acudientes se asocian automáticamente porque';
  RAISE NOTICE 'están relacionados con los estudiantes.';
  RAISE NOTICE '═══════════════════════════════════════════';
  
END $$;

-- ============================================
-- PASO 6: VERIFICACIÓN DE RESULTADOS
-- ============================================

-- Verificar estudiantes asociados a la institución
SELECT 
  c.codigo as codigo_institucion,
  c.nombre as nombre_institucion,
  COUNT(DISTINCT ec.estudiante_id) as total_estudiantes,
  COUNT(DISTINCT a.id) as total_acudientes
FROM colegios c
LEFT JOIN estudiantes_colegios ec ON c.id = ec.colegio_id
LEFT JOIN usuarios u ON ec.estudiante_id = u.id
LEFT JOIN acudientes a ON u.id = a.estudiante_id AND a.activo = true
WHERE c.codigo = 'COL001'  -- ⚠️ CAMBIAR AQUÍ AL CÓDIGO DE TU INSTITUCIÓN
GROUP BY c.id, c.codigo, c.nombre;

-- Ver algunos ejemplos de estudiantes asociados
SELECT 
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_completo,
  u.grado,
  u.codigo_institucion,
  c.codigo as codigo_colegio,
  c.nombre as nombre_colegio,
  COUNT(a.id) as cantidad_acudientes
FROM usuarios u
INNER JOIN estudiantes_colegios ec ON u.id = ec.estudiante_id
INNER JOIN colegios c ON ec.colegio_id = c.id
LEFT JOIN acudientes a ON u.id = a.estudiante_id AND a.activo = true
WHERE u.activo = true
  AND u.codigo_estudiante LIKE 'EST%'
  AND c.codigo = 'COL001'  -- ⚠️ CAMBIAR AQUÍ AL CÓDIGO DE TU INSTITUCIÓN
GROUP BY u.id, u.codigo_estudiante, u.nombre, u.apellidos, u.grado, u.codigo_institucion, c.codigo, c.nombre
ORDER BY u.codigo_estudiante
LIMIT 20;

-- Verificar estudiantes sin institución asignada
SELECT 
  COUNT(*) as estudiantes_sin_institucion
FROM usuarios u
WHERE u.activo = true
  AND u.codigo_estudiante LIKE 'EST%'
  AND NOT EXISTS (
    SELECT 1 FROM estudiantes_colegios ec 
    WHERE ec.estudiante_id = u.id
  );

-- Verificar estudiantes con codigo_institucion NULL
SELECT 
  COUNT(*) as estudiantes_con_codigo_null
FROM usuarios u
WHERE u.activo = true
  AND u.codigo_estudiante LIKE 'EST%'
  AND u.codigo_institucion IS NULL;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
-- 
-- 1. Ve al dashboard administrativo → Pestaña "Colegios"
-- 2. Crea una nueva institución (ej: "Colegio Seminario de Palmira")
-- 3. Anota el código que se generó automáticamente (ej: COL001)
-- 4. Abre este script en Supabase SQL Editor
-- 5. Reemplaza 'COL001' en las líneas marcadas con ⚠️ por tu código real
-- 6. Ejecuta el script completo
-- 7. Revisa los resultados de las consultas de verificación
-- 
-- ⚠️ NOTA: Los acudientes NO necesitan asociación directa porque
-- están relacionados con los estudiantes a través de estudiante_id.
-- Cuando un estudiante se asocia a una institución, sus acudientes
-- quedan indirectamente asociados también.
