# 📝 Guía: Sistema de Nombres de Usuario para Niños

## ✅ Cambios Realizados

He modificado el sistema para que los niños puedan usar nombres de usuario simples (TSP001, TSP002, etc.) en lugar de emails completos.

## 🚀 Pasos para Implementar

### Paso 1: Ejecutar Script SQL en Supabase

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido del archivo `scripts/asignar_usuarios.sql`
3. Ejecuta el script
4. Verifica que se hayan asignado los nombres de usuario correctamente

El script hará lo siguiente:
- ✅ Añade la columna `username` si no existe
- ✅ Asigna nombres secuenciales: TSP001, TSP002, TSP003, etc.
- ✅ Crea un índice para búsquedas rápidas
- ✅ Verifica que no haya duplicados

### Paso 2: Verificar que Funciona

Después de ejecutar el SQL, verifica con esta consulta:

```sql
SELECT username, email, nombre, codigo_estudiante
FROM usuarios
WHERE activo = true
ORDER BY username
LIMIT 10;
```

Deberías ver algo como:
```
username | email                              | nombre        | codigo_estudiante
---------|------------------------------------|---------------|------------------
TSP001   | estudiante1@ejemplo.com           | Juan Pérez    | EST0001
TSP002   | estudiante2@ejemplo.com           | María López   | EST0002
...
```

## 🎯 Cómo Funciona Ahora

### Para los Niños (Recomendado)
- **Usuario:** `TSP001` (o su número asignado)
- **Contraseña:** `123456` (o su contraseña actual)

### Para Profesores/Admins (También funciona)
- **Usuario:** `profesor@ejemplo.com` (email completo)
- **Contraseña:** Su contraseña

El sistema detecta automáticamente si es un username (TSP001) o un email.

## 🔧 Configuración Actualizada

### Archivos Modificados:

1. **`config/supabase.config.js`**
   - ✅ Añadido `username` a `USER_FIELDS`

2. **`auth/auth.core.js`**
   - ✅ Función `login()` ahora acepta username o email
   - ✅ Detecta automáticamente el tipo de entrada
   - ✅ Busca por `username` o `email` según corresponda

3. **`index.html`**
   - ✅ Placeholder cambiado a "TSP001"
   - ✅ Label cambiado a "Nombre de Usuario"
   - ✅ Mensaje de ayuda añadido

## 📋 Ejemplo de Uso

### En la Página de Login:

**Opción 1 (Para niños):**
```
Nombre de Usuario: TSP001
Contraseña: 123456
```

**Opción 2 (Para profesores):**
```
Nombre de Usuario: profesor@ejemplo.com
Contraseña: su_contraseña
```

Ambas opciones funcionan perfectamente.

## 🔒 Seguridad

- ✅ Los nombres de usuario son únicos (constraint UNIQUE)
- ✅ Rate limiting sigue funcionando (5 intentos cada 15 minutos)
- ✅ Validación de contraseña SHA-256 se mantiene
- ✅ Búsqueda por username es case-insensitive (TSP001 = tsp001)

## 🆘 Solución de Problemas

### Error: "Usuario no encontrado"

1. Verifica que ejecutaste el script SQL
2. Verifica que el usuario tiene `username` asignado:
   ```sql
   SELECT username, email FROM usuarios WHERE email = 'constanza.robles@seminariopalmira.edu.co';
   ```

### Error: "Username duplicado"

El script SQL verifica duplicados. Si hay un error, revisa:
```sql
SELECT username, COUNT(*) 
FROM usuarios 
WHERE username IS NOT NULL 
GROUP BY username 
HAVING COUNT(*) > 1;
```

### Los niños aún pueden usar email

Sí, el sistema acepta ambos. Si un niño escribe su email, también funcionará.

## 📊 Estadísticas

Después de ejecutar el script, puedes ver cuántos usuarios tienen username:

```sql
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(username) as usuarios_con_username,
  COUNT(*) - COUNT(username) as usuarios_sin_username
FROM usuarios
WHERE activo = true;
```

---

**¡Listo!** Ahora los niños pueden usar nombres de usuario simples como `TSP001` en lugar de emails completos. 🎉
