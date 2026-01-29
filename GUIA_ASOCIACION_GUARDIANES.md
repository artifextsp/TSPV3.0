# 👨‍👩‍👧 Guía: Asociación de Guardianes con Estudiantes

## ✅ Respuesta Rápida

**Ya está hecho automáticamente.** No necesitas hacer nada manualmente.

El sistema usa la tabla `acudientes` que ya existe y funciona así:

---

## 🔄 Cómo Funciona (Automático)

### 1. **Cuando creas un estudiante**

Cuando creas un estudiante en el sistema y llenas los campos:
- `email_acudiente`
- `nombre_acudiente`
- `apellido_acudiente`
- `celular_acudiente`

El sistema **automáticamente** crea un registro en la tabla `acudientes` que relaciona ese acudiente con el estudiante.

### 2. **Migración automática**

Si ya tienes estudiantes creados con datos de acudiente, ejecuta este script SQL **una sola vez**:

```sql
-- En Supabase SQL Editor, ejecuta:
-- scripts/crear_tabla_acudientes.sql
```

Este script:
- ✅ Crea la tabla `acudientes` (si no existe)
- ✅ Migra automáticamente todos los estudiantes que tienen `email_acudiente`
- ✅ Crea un registro de acudiente por cada estudiante
- ✅ Asigna nombres de usuario (ACU001, ACU002, etc.)

---

## 📊 Estructura de la Tabla `acudientes`

```sql
acudientes
├── id                    (UUID único)
├── nombre                (Nombre del acudiente)
├── apellidos             (Apellidos)
├── email                 (Email - puede repetirse si tiene varios hijos)
├── celular               (Teléfono)
├── password_hash         (Contraseña encriptada)
├── username              (ACU001, ACU002, etc.)
├── estudiante_id         (🔗 Relación con el estudiante hijo/a)
├── activo                (true/false)
└── primera_vez           (Si debe cambiar contraseña)
```

**Importante:** Un acudiente puede tener múltiples hijos. En ese caso, habrá múltiples registros con el mismo `email` pero diferente `estudiante_id`.

---

## 🔍 Verificar Asociaciones Existentes

Para ver qué estudiantes tienen acudientes asociados:

```sql
-- Ver todos los acudientes y sus estudiantes
SELECT 
  a.email,
  a.nombre || ' ' || a.apellidos as acudiente,
  u.codigo_estudiante,
  u.nombre || ' ' || u.apellidos as estudiante,
  u.grado
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.activo = true
ORDER BY a.email, u.grado;
```

---

## ➕ Asociar Manualmente (Si es necesario)

Si necesitas asociar un acudiente manualmente a un estudiante:

```sql
-- 1. Obtener el ID del estudiante
SELECT id, codigo_estudiante, nombre 
FROM usuarios 
WHERE codigo_estudiante = 'EST0046';  -- Cambia por el código del estudiante

-- 2. Insertar el acudiente (reemplaza los valores)
INSERT INTO acudientes (
  nombre,
  apellidos,
  email,
  celular,
  estudiante_id,
  password_hash,
  activo,
  primera_vez
) VALUES (
  'Nombre del Acudiente',
  'Apellido del Acudiente',
  'email@ejemplo.com',
  '3001234567',
  'uuid-del-estudiante-aqui',  -- El ID que obtuviste en el paso 1
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',  -- Hash de "temporal123"
  true,
  true  -- Debe cambiar contraseña en primer login
);

-- 3. Asignar username automáticamente
UPDATE acudientes
SET username = 'ACU' || LPAD(
  (SELECT COUNT(*) FROM acudientes WHERE email = 'email@ejemplo.com' AND activo = true)::TEXT,
  3,
  '0'
)
WHERE email = 'email@ejemplo.com' AND username IS NULL;
```

---

## 🚀 Para Activar el Módulo de Informes

### Paso 1: Ejecutar Script SQL (Una vez)

En Supabase SQL Editor, ejecuta:

```sql
-- scripts/crear_modulo_informes_guardianes.sql
```

Este script crea:
- ✅ Tabla `benchmarks_grado` (metas por grado)
- ✅ Tabla `habilidades_cognitivas` (10 habilidades)
- ✅ Tabla `resumen_ciclo_estudiante` (cache de métricas)
- ✅ Funciones y vistas para reportes

### Paso 2: Verificar que los acudientes existen

```sql
-- Ver cuántos acudientes activos hay
SELECT COUNT(*) as total_acudientes
FROM acudientes
WHERE activo = true;
```

### Paso 3: Los guardianes pueden acceder

Los acudientes pueden hacer login con:
- **Email:** `email@ejemplo.com`
- **Username:** `ACU001` (si tienen uno asignado)
- **Contraseña:** La que tengan configurada

Y automáticamente verán todos sus hijos asociados.

---

## ❓ Preguntas Frecuentes

### ¿Un acudiente puede tener varios hijos?

**Sí.** Si un acudiente tiene 2 hijos, habrá 2 registros en `acudientes` con el mismo `email` pero diferentes `estudiante_id`. El dashboard mostrará ambos hijos.

### ¿Cómo cambio la contraseña de un acudiente?

Los acudientes pueden cambiar su contraseña desde su dashboard después del primer login. O puedes resetearla manualmente:

```sql
-- Resetear contraseña a "123456"
UPDATE acudientes
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    primera_vez = true
WHERE email = 'email@ejemplo.com';
```

### ¿Qué pasa si un estudiante no tiene acudiente?

El estudiante simplemente no aparecerá en ningún dashboard de acudiente. Los estudiantes pueden seguir usando el sistema normalmente.

---

## 📝 Resumen

✅ **Ya está hecho** - El sistema usa `acudientes` automáticamente  
✅ **Migración automática** - Ejecuta `crear_tabla_acudientes.sql` una vez  
✅ **Sin trabajo manual** - Las asociaciones se crean automáticamente al crear estudiantes  
✅ **Múltiples hijos** - Un acudiente puede ver todos sus hijos en un solo dashboard
