-- ============================================
-- ASOCIAR DOCENTES EXISTENTES A INSTITUCIÓN
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script asocia todos los docentes existentes a la institución COL001.
-- 
-- INSTRUCCIONES:
-- 1. Asegúrate de que la tabla docentes_colegios existe (ejecuta crear_tabla_docentes_colegios.sql primero)
-- 2. Verifica que existe un colegio con código 'COL001'
-- 3. Ejecuta este script en Supabase SQL Editor
-- ============================================

DO $$
DECLARE
  v_codigo_institucion TEXT := 'COL001';
  v_colegio_id UUID;
  v_docentes_count INTEGER;
  v_asociados_count INTEGER;
BEGIN
  -- Verificar que existe el colegio
  SELECT id INTO v_colegio_id
  FROM colegios
  WHERE codigo = v_codigo_institucion AND activo = true;
  
  IF v_colegio_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró un colegio activo con código %', v_codigo_institucion;
  END IF;
  
  RAISE NOTICE 'Colegio encontrado: % (ID: %)', v_codigo_institucion, v_colegio_id;
  
  -- Contar docentes activos
  SELECT COUNT(*) INTO v_docentes_count
  FROM usuarios
  WHERE tipo_usuario = 'docente' AND activo = true;
  
  RAISE NOTICE 'Total de docentes activos: %', v_docentes_count;
  
  -- Asociar docentes que no tienen asociación
  INSERT INTO docentes_colegios (docente_id, colegio_id)
  SELECT u.id, v_colegio_id
  FROM usuarios u
  WHERE u.tipo_usuario = 'docente'
    AND u.activo = true
    AND NOT EXISTS (
      SELECT 1 FROM docentes_colegios dc
      WHERE dc.docente_id = u.id
    )
  ON CONFLICT (docente_id) DO NOTHING;
  
  GET DIAGNOSTICS v_asociados_count = ROW_COUNT;
  
  RAISE NOTICE 'Docentes asociados: %', v_asociados_count;
  
  -- Mostrar resumen
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMEN DE ASOCIACIÓN';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colegio: % (%)', v_codigo_institucion, v_colegio_id;
  RAISE NOTICE 'Total docentes activos: %', v_docentes_count;
  RAISE NOTICE 'Docentes asociados en esta ejecución: %', v_asociados_count;
  
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar docentes asociados al colegio
SELECT 
  u.id,
  u.nombre,
  u.apellidos,
  u.email,
  c.codigo AS codigo_colegio,
  c.nombre AS nombre_colegio
FROM usuarios u
INNER JOIN docentes_colegios dc ON u.id = dc.docente_id
INNER JOIN colegios c ON dc.colegio_id = c.id
WHERE u.tipo_usuario = 'docente'
  AND u.activo = true
  AND c.codigo = 'COL001'
ORDER BY u.nombre;

-- Contar docentes sin asociar
SELECT 
  COUNT(*) AS docentes_sin_asociar
FROM usuarios u
WHERE u.tipo_usuario = 'docente'
  AND u.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM docentes_colegios dc
    WHERE dc.docente_id = u.id
  );

-- Estadísticas generales
SELECT 
  c.codigo,
  c.nombre,
  COUNT(dc.docente_id) AS total_docentes
FROM colegios c
LEFT JOIN docentes_colegios dc ON c.id = dc.colegio_id
GROUP BY c.id, c.codigo, c.nombre
ORDER BY c.codigo;
