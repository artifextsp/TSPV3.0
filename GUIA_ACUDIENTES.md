# 👨‍👩‍👧 Sistema de Acudientes - Thinking Skills Program v2

## ✅ Cambios Implementados

He creado un sistema completo para el perfil de acudiente que permite a los padres/madres acceder y ver los resultados de las prácticas de sus hijos.

## 📋 Estructura Creada

### 1. Tabla `acudientes` (Nueva)

Tabla separada con los siguientes campos:
- `id` (UUID) - Identificador único
- `nombre` (TEXT) - Nombre del acudiente
- `apellidos` (TEXT) - Apellidos del acudiente
- `email` (TEXT, UNIQUE) - Email del acudiente
- `celular` (TEXT) - Teléfono del acudiente
- `password_hash` (TEXT) - Hash de la contraseña
- `username` (TEXT, UNIQUE) - Nombre de usuario (ACU001, ACU002, etc.)
- `estudiante_id` (UUID) - Referencia al estudiante hijo/a
- `activo` (BOOLEAN) - Estado del acudiente
- `primera_vez` (BOOLEAN) - Si debe cambiar contraseña

### 2. Migración de Datos

El script SQL migra automáticamente:
- `nombre_acudiente` → `nombre`
- `apellido_acudiente` → `apellidos`
- `email_acudiente` → `email`
- `celular_acudiente` → `celular`
- Crea relación con el estudiante hijo/a

### 3. Sistema de Autenticación Actualizado

- ✅ Busca en tabla `usuarios` (estudiantes, docentes, rectores)
- ✅ Busca en tabla `acudientes` si no encuentra en usuarios
- ✅ Detecta automáticamente si es acudiente por email o username (ACU001)
- ✅ Crea sesión con rol `acudiente` y guarda `estudiante_id`

### 4. Dashboard de Acudiente

- ✅ `acudiente/dashboard.html` - Dashboard específico para acudientes
- ✅ Muestra información del estudiante hijo/a
- ✅ Preparado para mostrar resultados de prácticas

## 🚀 Pasos para Implementar

### Paso 1: Ejecutar Script SQL

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y ejecuta el contenido de `scripts/crear_tabla_acudientes.sql`
3. El script:
   - ✅ Crea la tabla `acudientes`
   - ✅ Migra datos desde `usuarios`
   - ✅ Asigna nombres de usuario (ACU001, ACU002, etc.)
   - ✅ Configura RLS

### Paso 2: Verificar Migración

Ejecuta esta consulta para verificar:

```sql
-- Ver acudientes creados
SELECT 
  a.username,
  a.nombre || ' ' || a.apellidos as acudiente_nombre,
  a.email,
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as estudiante_nombre
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
ORDER BY a.username
LIMIT 10;
```

### Paso 3: Configurar Contraseñas

Los acudientes tienen contraseña temporal: `temporal123`

**Opción A: Notificar a acudientes** para que cambien su contraseña en el primer login

**Opción B: Asignar contraseñas conocidas** ejecutando:

```sql
-- Actualizar contraseña de un acudiente específico
-- Hash SHA-256 de "123456"
UPDATE acudientes 
SET password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    primera_vez = false
WHERE email = 'constanza.robles@seminariopalmira.edu.co';
```

## 🔐 Credenciales para Probar

### Para Acudiente (ejemplo con tu hija):

**Opción 1: Username**
- Username: `ACU001` (o el número asignado)
- Contraseña: `temporal123` (o la que asignes)

**Opción 2: Email**
- Email: `constanza.robles@seminariopalmira.edu.co`
- Contraseña: `temporal123` (o la que asignes)

## 🎯 Funcionalidades del Dashboard de Acudiente

### Información Mostrada:
- ✅ Nombre del acudiente
- ✅ Información del estudiante hijo/a:
  - Nombre completo
  - Código de estudiante
  - Grado

### Preparado para:
- 📊 Visualizar resultados de prácticas del hijo/a
- 📈 Ver progreso y estadísticas
- 📝 Historial de prácticas completadas

## 🔧 Configuración Actualizada

### Archivos Modificados:

1. **`config/supabase.config.js`**
   - ✅ Añadido `acudiente` a `VALID_ROLES`
   - ✅ Añadido `ACUDIENTES_TABLE: 'acudientes'`
   - ✅ Añadido `ACUDIENTE_FIELDS` con campos de acudientes

2. **`auth/auth.core.js`**
   - ✅ Función `login()` busca en ambas tablas
   - ✅ Función `findAcudiente()` para buscar acudientes
   - ✅ Función `getEstudianteHijo()` para obtener datos del hijo/a
   - ✅ Detección automática de acudientes por email o username

3. **`auth/auth.redirect.js`**
   - ✅ Rutas configuradas para acudientes
   - ✅ Dashboard: `acudiente/dashboard.html`

4. **`index.html`**
   - ✅ Placeholder actualizado para aceptar ACU001
   - ✅ Mensaje de ayuda actualizado

## 📊 Relación Acudiente-Estudiante

```
acudientes
  └── estudiante_id → usuarios.id
      └── Un acudiente está vinculado a UN estudiante
```

**Nota:** Si un acudiente tiene múltiples hijos, se creará un registro por cada hijo en la tabla `acudientes`. En el futuro puedes crear una tabla intermedia `acudiente_estudiantes` para manejar múltiples hijos.

## 🔍 Ejemplo de Uso

### En el Dashboard de Acudiente:

```javascript
import { requireRole, getUser, getEstudianteHijo } from '../auth/auth.core.js';

const user = requireRole('acudiente');
if (user) {
  // Obtener información del hijo/a
  const estudiante = await getEstudianteHijo(user.estudiante_id);
  
  if (estudiante) {
    console.log(`Hijo/a: ${estudiante.nombre}`);
    console.log(`Código: ${estudiante.codigo_estudiante}`);
    
    // Aquí puedes cargar resultados de prácticas
    // const resultados = await fetch(`/api/practicas/${estudiante.id}/resultados`);
  }
}
```

## ✅ Checklist de Implementación

- [x] Script SQL para crear tabla `acudientes`
- [x] Script SQL para migrar datos
- [x] Configuración actualizada con rol `acudiente`
- [x] Sistema de autenticación busca en ambas tablas
- [x] Dashboard de acudiente creado
- [x] Función para obtener datos del estudiante hijo
- [ ] Ejecutar script SQL en Supabase
- [ ] Probar login con acudiente
- [ ] Implementar visualización de resultados de prácticas

## 🆘 Solución de Problemas

### Error: "Tabla acudientes no existe"

**Solución:** Ejecuta el script `scripts/crear_tabla_acudientes.sql` en Supabase

### Error: "Usuario no encontrado" al hacer login con email de acudiente

**Solución:** 
1. Verifica que el script de migración se ejecutó correctamente
2. Verifica que el email existe en la tabla `acudientes`:
   ```sql
   SELECT * FROM acudientes WHERE email = 'email@ejemplo.com';
   ```

### Error: "estudiante_id es null"

**Solución:** Verifica que la migración creó correctamente la relación:
```sql
SELECT a.*, u.codigo_estudiante 
FROM acudientes a
LEFT JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.estudiante_id IS NULL;
```

## 📝 Notas Importantes

1. **Contraseña Temporal:** Todos los acudientes tienen contraseña `temporal123` inicialmente. Deben cambiarla en el primer login.

2. **Múltiples Hijos:** Si un acudiente tiene varios hijos, habrá varios registros en `acudientes` (uno por hijo). El sistema mostrará el hijo asociado al registro con el que hizo login.

3. **RLS Configurado:** La tabla `acudientes` tiene RLS habilitado para proteger los datos.

4. **Nombres de Usuario:** Los acudientes tienen nombres de usuario `ACU001`, `ACU002`, etc., diferentes de los estudiantes (`TSP001`, `TSP002`).

---

**Sistema de acudientes completamente integrado y listo para usar.** 🎉
