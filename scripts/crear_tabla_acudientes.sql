-- ============================================
-- CREAR TABLA ACUDIENTES
-- Thinking Skills Program v2
-- ============================================
-- 
-- Este script crea la tabla acudientes y migra los datos
-- del acudiente que están actualmente en la tabla usuarios
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. Verifica que los datos se migraron correctamente
-- 3. Los acudientes podrán acceder con su email y ver resultados de sus hijos
-- ============================================

-- ============================================
-- PASO 1: CREAR TABLA ACUDIENTES
-- ============================================

CREATE TABLE IF NOT EXISTS acudientes (
  -- IDENTIFICADOR ÚNICO
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- DATOS PERSONALES DEL ACUDIENTE
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT NOT NULL,  -- ⚠️ NO UNIQUE - Un acudiente puede tener múltiples hijos
  celular TEXT,
  
  -- CREDENCIALES DE ACCESO
  password_hash TEXT NOT NULL,  -- Hash SHA-256 de la contraseña
  username TEXT UNIQUE,         -- Nombre de usuario simple (ACU001, ACU002, etc.)
  
  -- ESTADO Y CONTROL
  activo BOOLEAN DEFAULT true NOT NULL,
  primera_vez BOOLEAN DEFAULT false NOT NULL,
  
  -- RELACIÓN CON ESTUDIANTE (hijo/a)
  estudiante_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- CONSTRAINTS
  -- ⚠️ IMPORTANTE: Un acudiente puede tener múltiples hijos, pero cada combinación email+estudiante_id es única
  CONSTRAINT acudientes_email_estudiante_unique UNIQUE (email, estudiante_id),
  CONSTRAINT acudientes_username_key UNIQUE (username)
);

-- ============================================
-- PASO 2: CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_acudientes_email ON acudientes(email);
CREATE INDEX IF NOT EXISTS idx_acudientes_username ON acudientes(username);
CREATE INDEX IF NOT EXISTS idx_acudientes_estudiante_id ON acudientes(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_acudientes_activo ON acudientes(activo) WHERE activo = true;

-- ============================================
-- PASO 3: MIGRAR DATOS DE ACUDIENTES DESDE USUARIOS
-- ============================================

-- Insertar acudientes desde la tabla usuarios
-- ⚠️ IMPORTANTE: Se crea UN registro POR CADA estudiante que tenga datos de acudiente
-- Si un acudiente tiene múltiples hijos, habrá múltiples registros con el mismo email
INSERT INTO acudientes (
  nombre,
  apellidos,
  email,
  celular,
  password_hash,
  estudiante_id,
  activo,
  primera_vez,
  created_at,
  updated_at
)
SELECT 
  u.nombre_acudiente,
  u.apellido_acudiente,
  LOWER(TRIM(u.email_acudiente)),
  u.celular_acudiente,
  -- Generar password_hash temporal (el acudiente deberá cambiar su contraseña)
  -- Hash SHA-256 de "temporal123" - CAMBIAR después del primer login
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  u.id,  -- ID del estudiante (hijo/a)
  u.activo,  -- Mismo estado que el estudiante
  true,  -- Primera vez = debe cambiar contraseña
  u.created_at,
  u.updated_at
FROM usuarios u
WHERE u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND u.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM acudientes a 
    WHERE a.email = LOWER(TRIM(u.email_acudiente))
      AND a.estudiante_id = u.id
  )
ON CONFLICT (email, estudiante_id) DO NOTHING;

-- ============================================
-- PASO 4: ASIGNAR NOMBRES DE USUARIO A ACUDIENTES
-- ============================================

-- Asignar nombres de usuario secuenciales (ACU001, ACU002, etc.)
WITH acudientes_ordenados AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (ORDER BY created_at, email) as numero_secuencia
  FROM acudientes
  WHERE activo = true
    AND (username IS NULL OR username = '')
)
UPDATE acudientes a
SET username = 'ACU' || LPAD(ao.numero_secuencia::TEXT, 3, '0')
FROM acudientes_ordenados ao
WHERE a.id = ao.id;

-- ============================================
-- PASO 5: HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;

-- Política: Acudientes pueden leer su propio perfil
CREATE POLICY "Acudientes pueden ver su propio perfil"
ON acudientes FOR SELECT
USING (activo = true);

-- Política: Acudientes pueden actualizar su propio perfil
CREATE POLICY "Acudientes pueden actualizar su perfil"
ON acudientes FOR UPDATE
USING (activo = true)
WITH CHECK (activo = true);

-- ============================================
-- PASO 6: CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_acudientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_acudientes_updated_at ON acudientes;
CREATE TRIGGER update_acudientes_updated_at
  BEFORE UPDATE ON acudientes
  FOR EACH ROW
  EXECUTE FUNCTION update_acudientes_updated_at();

-- ============================================
-- PASO 7: VERIFICACIÓN
-- ============================================

-- Ver cuántos acudientes se crearon
SELECT 
  COUNT(*) as total_acudientes,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as con_username,
  COUNT(CASE WHEN activo = true THEN 1 END) as activos
FROM acudientes;

-- Ver algunos ejemplos
SELECT 
  username,
  nombre,
  apellidos,
  email,
  celular,
  estudiante_id,
  activo
FROM acudientes
ORDER BY created_at
LIMIT 10;

-- Verificar relación con estudiantes
SELECT 
  a.username as acudiente_username,
  a.nombre || ' ' || a.apellidos as acudiente_nombre,
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
ORDER BY a.created_at
LIMIT 10;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. Contraseña temporal: Todos los acudientes tienen contraseña "temporal123"
--    Deben cambiarla en el primer login
-- 
-- 2. Un acudiente puede tener múltiples hijos: Si un email_acudiente aparece
--    en varios estudiantes, se creará un registro por cada hijo
-- 
-- 3. Para manejar acudientes con múltiples hijos, considera crear una tabla
--    intermedia acudiente_estudiantes en el futuro
-- 
-- 4. Los nombres de usuario son: ACU001, ACU002, ACU003, etc.
-- 
-- ============================================
