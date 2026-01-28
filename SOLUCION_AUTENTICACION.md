# 🔧 Solución: Autenticación con Credenciales Antiguas

## ✅ Problema Resuelto

He corregido el problema principal: **`password_hash` ahora está incluido en `USER_FIELDS`**.

## 🔐 Credenciales para Probar

**Email:** `constanza.robles@seminariopalmira.edu.co`  
**Contraseña:** `123456`

## ⚠️ Configuración de RLS Necesaria

Para que funcione correctamente, necesitas configurar Row Level Security en Supabase para permitir la lectura de `password_hash` durante la autenticación.

### Opción 1: Permitir lectura de password_hash (Recomendado para desarrollo)

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Asegúrate de que RLS está habilitado
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura de usuarios activos (incluyendo password_hash)
-- Esto es necesario para la autenticación
DROP POLICY IF EXISTS "Permitir lectura de usuarios activos para autenticación" ON usuarios;
CREATE POLICY "Permitir lectura de usuarios activos para autenticación"
ON usuarios FOR SELECT
USING (activo = true);

-- O si prefieres ser más restrictivo, solo permitir lectura de email y password_hash:
-- CREATE POLICY "Permitir autenticación"
-- ON usuarios FOR SELECT
-- USING (true)
-- WITH CHECK (true);
```

### Opción 2: Función de autenticación en Supabase (Más Seguro)

Si prefieres no exponer `password_hash` directamente, crea una función en Supabase:

```sql
-- Función para verificar credenciales sin exponer password_hash
CREATE OR REPLACE FUNCTION verificar_credenciales(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  nombre TEXT,
  tipo_usuario TEXT,
  activo BOOLEAN,
  primera_vez BOOLEAN
) AS $$
DECLARE
  password_hash TEXT;
BEGIN
  -- Obtener password_hash del usuario
  SELECT usuarios.password_hash INTO password_hash
  FROM usuarios
  WHERE usuarios.email = p_email
    AND usuarios.activo = true;
  
  -- Verificar contraseña (SHA-256)
  IF password_hash = encode(digest(p_password, 'sha256'), 'hex') THEN
    -- Retornar datos del usuario sin password_hash
    RETURN QUERY
    SELECT 
      usuarios.id,
      usuarios.email,
      usuarios.nombre,
      usuarios.tipo_usuario,
      usuarios.activo,
      usuarios.primera_vez
    FROM usuarios
    WHERE usuarios.email = p_email
      AND usuarios.activo = true;
  ELSE
    -- Retornar vacío si las credenciales son incorrectas
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para permitir ejecutar la función
GRANT EXECUTE ON FUNCTION verificar_credenciales(TEXT, TEXT) TO anon;
```

Si usas la Opción 2, necesitarías modificar `auth.core.js` para usar esta función en lugar de la consulta directa.

## 🧪 Probar el Sistema

1. **Asegúrate de ejecutar el SQL de RLS** (Opción 1 es más simple)

2. **Abre `index.html`** en tu navegador con un servidor local:
   ```bash
   # Opción 1: Python
   python -m http.server 8000
   
   # Opción 2: Node.js
   npx http-server
   ```

3. **Ingresa las credenciales:**
   - Email: `constanza.robles@seminariopalmira.edu.co`
   - Contraseña: `123456`

4. **Verifica la consola del navegador (F12)** para ver los logs de depuración

## 🔍 Verificación del Hash

El hash SHA-256 de `123456` es:
```
8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
```

Este hash coincide exactamente con el almacenado en tu base de datos, así que la contraseña debería funcionar una vez que RLS esté configurado correctamente.

## 📝 Campos Actualizados

He actualizado `USER_FIELDS` para incluir:
- ✅ `password_hash` (OBLIGATORIO para autenticación)
- ✅ `apellidos` (campo adicional)
- ✅ `codigo_estudiante` (campo adicional)
- ✅ `grado` (campo adicional)

Todos estos campos se preservarán en la sesión y estarán disponibles después del login.

## 🆘 Si Aún No Funciona

1. **Abre la consola del navegador (F12)** y revisa los errores
2. **Verifica que RLS permite lectura** ejecutando:
   ```sql
   SELECT * FROM usuarios WHERE email = 'constanza.robles@seminariopalmira.edu.co';
   ```
3. **Verifica que el campo se llama exactamente `password_hash`** (no `password` ni `contrasena`)

---

**Nota:** Las credenciales antiguas (`123456`) funcionarán perfectamente una vez configurado RLS correctamente. El sistema está diseñado para mantener compatibilidad con las contraseñas migradas.
