# 🔐 Situación Actual de Contraseñas - Thinking Skills Program v2

## 📊 Resumen de Contraseñas

### 👨‍🎓 ESTUDIANTES

**Situación actual:**
- Los estudiantes **mantienen sus contraseñas del sistema anterior**
- No se asignó una contraseña estándar para todos
- Cada estudiante tiene su propia contraseña original

**Contraseñas conocidas:**
- Algunos estudiantes pueden tener: `123456` (si se migró así)
- Otros tienen sus contraseñas originales del sistema anterior
- El sistema detecta automáticamente si es `123456` o otra

**En el listado de credenciales:**
- Si el hash coincide con `123456` → muestra `"123456"`
- Si el hash coincide con `temporal123` → muestra `"temporal123"`
- Si no coincide con ninguna conocida → muestra `"Cambiar en primer login"`

### 👨‍👩‍👧 ACUDIENTES

**Situación actual:**
- ✅ **TODOS los acudientes tienen la misma contraseña estándar**
- Contraseña: `temporal123`
- Hash SHA-256: `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3`
- Todos tienen `primera_vez = true` → **DEBEN cambiar la contraseña en el primer login**

## ⚠️ PROBLEMA IDENTIFICADO

### Para Estudiantes en Primera Vez

Si un estudiante tiene `primera_vez = true` pero **NO sabemos cuál es su contraseña actual**, el formulario de cambio de contraseña tiene un problema:

1. El estudiante necesita ingresar su **"Contraseña actual"**
2. Pero si no sabemos cuál es, ¿cómo puede cambiarla?

### Soluciones Posibles

#### Opción 1: Asignar Contraseña Temporal a Estudiantes Nuevos (Recomendado)

Si un estudiante es nuevo o necesita resetear su contraseña:

```sql
-- Asignar contraseña temporal "temporal123" a un estudiante específico
UPDATE usuarios
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    primera_vez = true
WHERE codigo_estudiante = 'EST0001';
```

**Ventajas:**
- Contraseña conocida: `temporal123`
- Puede cambiarla en el primer login
- Consistente con acudientes

#### Opción 2: Permitir Cambio Sin Contraseña Actual (Solo Primera Vez)

Modificar el formulario para que si `primera_vez = true`, **NO requiera** contraseña actual:

```javascript
// Si es primera vez, solo pedir nueva contraseña
if (user.primera_vez) {
  // No pedir contraseña actual
  // Solo pedir nueva contraseña y confirmación
}
```

**Ventajas:**
- Funciona incluso si no sabemos la contraseña actual
- Más simple para usuarios nuevos

#### Opción 3: Mantener Contraseñas Originales (Actual)

Si los estudiantes ya tienen contraseñas del sistema anterior:
- Mantener sus contraseñas originales
- Solo cambiar `primera_vez = true` si queremos forzar cambio
- El estudiante usa su contraseña original para hacer login
- Luego puede cambiarla si `primera_vez = true`

## 🎯 Recomendación

### Para Estudiantes Existentes (Migrados)
1. **Mantener sus contraseñas originales** del sistema anterior
2. Si quieres forzar cambio: establecer `primera_vez = true`
3. El estudiante usa su contraseña original para login
4. Luego puede cambiarla en el formulario

### Para Estudiantes Nuevos
1. **Asignar contraseña temporal estándar**: `temporal123`
2. Establecer `primera_vez = true`
3. Entregar credenciales: Usuario / `temporal123`
4. Deben cambiar en el primer login

### Para Acudientes
1. ✅ **Ya está implementado**: Todos tienen `temporal123`
2. ✅ Todos tienen `primera_vez = true`
3. ✅ Deben cambiar en el primer login

## 📝 Script SQL para Asignar Contraseñas Temporales

```sql
-- Asignar contraseña temporal "temporal123" a estudiantes nuevos o que necesiten reset
-- Hash SHA-256 de "temporal123"
UPDATE usuarios
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    primera_vez = true
WHERE codigo_estudiante IN ('EST0001', 'EST0002', 'EST0003')
  AND activo = true;

-- O para TODOS los estudiantes activos (⚠️ CUIDADO: Esto cambiará todas las contraseñas)
-- UPDATE usuarios
-- SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
--     primera_vez = true
-- WHERE activo = true
--   AND codigo_estudiante IS NOT NULL;
```

## 🔄 Flujo Recomendado

### Escenario 1: Estudiante con Contraseña Original
1. Estudiante hace login con su contraseña original
2. Si `primera_vez = false` → Va directo al dashboard
3. Si `primera_vez = true` → Redirige a cambiar contraseña
4. Ingresa contraseña actual (su contraseña original)
5. Ingresa nueva contraseña
6. Sistema actualiza y cambia `primera_vez = false`

### Escenario 2: Estudiante Nuevo con Contraseña Temporal
1. Estudiante recibe credenciales: `TSP001` / `temporal123`
2. Hace login con `temporal123`
3. Sistema detecta `primera_vez = true`
4. Redirige a cambiar contraseña
5. Ingresa contraseña actual: `temporal123`
6. Ingresa nueva contraseña personal
7. Sistema actualiza y cambia `primera_vez = false`

### Escenario 3: Acudiente (Ya Implementado)
1. Acudiente recibe credenciales: `ACU001` / `temporal123`
2. Hace login con `temporal123`
3. Sistema detecta `primera_vez = true`
4. Redirige a cambiar contraseña
5. Ingresa contraseña actual: `temporal123`
6. Ingresa nueva contraseña personal
7. Sistema actualiza y cambia `primera_vez = false`

## ❓ Pregunta para Decidir

**¿Qué prefieres hacer con los estudiantes?**

1. **Opción A**: Mantener sus contraseñas originales del sistema anterior
   - Pro: No necesitas cambiar nada
   - Contra: Si `primera_vez = true`, necesitan saber su contraseña actual

2. **Opción B**: Asignar contraseña temporal `temporal123` a todos los estudiantes nuevos
   - Pro: Consistente con acudientes, contraseña conocida
   - Contra: Necesitas ejecutar script SQL para asignarla

3. **Opción C**: Modificar el formulario para que en primera vez NO requiera contraseña actual
   - Pro: Funciona sin saber la contraseña actual
   - Contra: Menos seguro (cualquiera podría cambiar la contraseña si tiene acceso)

---

**Mi recomendación:** Opción B para estudiantes nuevos, Opción A para estudiantes existentes con contraseñas conocidas.
