# 🔧 Corrección: Migración Completa de Acudientes

## ❌ Problema Identificado

El script original usaba `DISTINCT ON (u.email_acudiente)` y tenía un constraint `email UNIQUE`, lo que causaba que:
- Solo se creara **1 registro por email de acudiente**
- Si varios estudiantes tenían el mismo email_acudiente, solo se creaba 1 registro
- **Resultado: Solo 10 acudientes en lugar de 1 por cada estudiante**

## ✅ Solución Implementada

He creado un script corregido que:
1. ✅ **Elimina el constraint `email UNIQUE`**
2. ✅ **Crea constraint `(email, estudiante_id) UNIQUE`** - Permite mismo email con diferentes hijos
3. ✅ **Elimina `DISTINCT ON`** - Crea un registro POR CADA estudiante
4. ✅ **Crea tantos acudientes como estudiantes con datos de acudiente**

## 🚀 Pasos para Corregir

### Opción 1: Eliminar y Recrear (Recomendado)

1. **Eliminar datos existentes:**
   ```sql
   DELETE FROM acudientes;
   ALTER TABLE acudientes DROP CONSTRAINT IF EXISTS acudientes_email_key;
   ```

2. **Ejecutar script corregido:**
   - Ejecuta: `scripts/corregir_migracion_acudientes.sql`
   - O ejecuta las correcciones manualmente

### Opción 2: Solo Ejecutar Correcciones

Ejecuta directamente el script `scripts/corregir_migracion_acudientes.sql` que:
- Corrige el constraint
- Migra todos los estudiantes faltantes
- Asigna nombres de usuario secuenciales

## 📊 Verificación

Después de ejecutar el script corregido, verifica:

```sql
-- Debe mostrar el mismo número de acudientes que estudiantes con email_acudiente
SELECT 
  (SELECT COUNT(*) FROM acudientes WHERE activo = true) as total_acudientes,
  (SELECT COUNT(*) FROM usuarios 
   WHERE activo = true 
   AND email_acudiente IS NOT NULL 
   AND email_acudiente != '') as estudiantes_con_acudiente;
```

Ambos números deben ser **iguales**.

## 🔍 Verificar Estudiantes Sin Acudiente

```sql
-- Ver estudiantes que deberían tener acudiente pero no lo tienen
SELECT 
  u.codigo_estudiante,
  u.nombre,
  u.email_acudiente
FROM usuarios u
LEFT JOIN acudientes a ON a.estudiante_id = u.id
WHERE u.activo = true
  AND u.email_acudiente IS NOT NULL
  AND u.email_acudiente != ''
  AND a.id IS NULL;
```

Si esta query devuelve filas, significa que hay estudiantes que aún no tienen su acudiente migrado.

## 📝 Cambios en la Estructura

### Antes (Incorrecto):
- `email UNIQUE` → Solo 1 registro por email
- `DISTINCT ON (email)` → Agrupa por email

### Ahora (Correcto):
- `(email, estudiante_id) UNIQUE` → Permite mismo email con diferentes hijos
- Sin `DISTINCT ON` → Crea registro por cada estudiante

## ⚠️ Importante

Si un acudiente tiene **múltiples hijos**, habrá:
- **Múltiples registros** en la tabla `acudientes` (uno por hijo)
- **Mismo email** en todos los registros
- **Diferentes `estudiante_id`** en cada registro
- **Diferentes `username`** (ACU001, ACU002, etc.)

Cuando el acudiente hace login, verá solo el hijo asociado a ese registro específico.

---

**Ejecuta el script corregido y verifica que ahora aparecen todos los acudientes.** ✅
