# Checklist de Blindaje Multi-Tenant - Ludens / TSP

## Problema Original
Al filtrar usuarios desde el dashboard del administrador, aparecen datos de múltiples plataformas mezclados. Un mismo nombre (ej: "Emily Peña") muestra resultados con códigos de diferentes colegios (EST0061 de TSP, SEMINARIO101/149 de Ludens).

## Causa Raíz Identificada

### 1. Políticas RLS completamente abiertas
- **TODAS** las políticas RLS en `usuarios`, `acudientes`, `estudiantes`, `grados`, `calificaciones` y más tablas tienen `qual: "true"` → Cualquier petición ve TODOS los datos
- Políticas `anon_*` con `true` → incluso usuarios no autenticados acceden a todo

### 2. Queries sin filtro por colegio_id
- `EstudiantesAPI.listar()` → no filtra por `colegio_id`
- `DocentesAPI.listar()` → no filtra por `colegio_id`
- `AcudientesAPI.listar()` → no filtra por `colegio_id`
- `CobrosAPI.generarCobrosDelMes()` → genera cobros para TODOS los colegios

### 3. colegio_id no guardado en sesión
- El campo `colegio_id` no estaba en `USER_FIELDS`
- La sesión no almacenaba el colegio del admin

### 4. Sin validación frontend
- Los datos devueltos por la API se renderizaban directamente sin verificar tenant

---

## Capas de Seguridad Implementadas

### Capa 1: Sesión del Usuario (auth)
- [x] `colegio_id` agregado a `USER_FIELDS` en `supabase.config.js`
- [x] `colegio_id` guardado explícitamente en `sessionData` durante login (`auth.core.js`)
- [x] `colegio_id` reconocido como campo de primer nivel en la sesión (`auth.session.js`)

**Archivos**: `config/supabase.config.js`, `auth/auth.core.js`, `auth/auth.session.js`

### Capa 2: Filtrado en API Queries (admin.api.js)
- [x] `getAdminColegioId()` - función utilitaria que obtiene colegio_id del admin
- [x] `filtrarPorTenant()` - segunda capa de defensa que filtra resultados
- [x] `EstudiantesAPI.listar()` → filtrado por `colegio_id`
- [x] `DocentesAPI.listar()` → filtrado por `colegio_id`
- [x] `AcudientesAPI.listar()` → filtrado por estudiantes del colegio
- [x] `EstudiantesAPI.crear()` → asigna `colegio_id` automáticamente
- [x] `DocentesAPI.crear()` → asigna `colegio_id` automáticamente
- [x] `CobrosAPI.generarCobrosDelMes()` → solo estudiantes del colegio
- [x] `CobrosAPI.listarEstudiantesConSaldos()` → filtrado por colegio

**Archivo**: `admin/admin.api.js`

### Capa 3: Validación Frontend (tenant-guard.js)
- [x] `TenantGuard.init()` - inicialización al cargar página
- [x] `TenantGuard.validarDatos()` - filtra registros de otros tenants
- [x] `TenantGuard.validarAcudientes()` - valida a través de estudiante vinculado
- [x] `TenantGuard.asegurarColegioId()` - previene escrituras cross-tenant
- [x] Registro de violaciones para auditoría
- [x] `TenantGuard.report()` - reporte de seguridad en consola

**Archivo**: `auth/tenant-guard.js`

### Capa 4: Base de Datos SQL (blindaje_multitenant.sql)
- [x] Queries de diagnóstico (detectar mezcla, duplicados, políticas peligrosas)
- [x] Script para eliminar políticas RLS con `qual: "true"`
- [x] Funciones SQL seguras: `obtener_usuarios_por_colegio()`, `obtener_acudientes_por_colegio()`
- [x] Función de validación: `validar_usuario_en_colegio()`
- [x] Trigger: `trg_validar_colegio_usuario` - previene insertar sin `colegio_id`
- [x] Trigger: `trg_prevenir_cambio_colegio` - previene mover usuarios entre colegios
- [x] Índices optimizados para queries por tenant
- [x] Queries de validación post-implementación

**Archivo**: `scripts/blindaje_multitenant.sql`

### Capa 5: Políticas RLS Preparadas (futuro con Supabase Auth)
- [x] `usuarios_select_same_colegio` - Admin solo ve su colegio
- [x] `usuarios_insert_same_colegio` - Solo inserta en su colegio
- [x] `usuarios_update_same_colegio` - Solo modifica su colegio
- [x] Super admin con acceso total
- [x] Usuarios pueden ver su propio perfil

**Estado**: Comentadas en el script SQL, listas para activar al migrar a Supabase Auth

---

## Orden de Implementación

### Paso 1: Diagnóstico (EJECUTAR PRIMERO)
```sql
-- En Supabase SQL Editor, ejecutar FASE 0 del script
-- scripts/blindaje_multitenant.sql
```
Verificar:
- ¿Cuántos colegios hay?
- ¿Hay usuarios sin `colegio_id`?
- ¿Cuántas políticas peligrosas hay?

### Paso 2: Asignar colegio_id a usuarios huérfanos
Si hay usuarios sin `colegio_id`:
```sql
-- Ejemplo: asignar todos los EST% sin colegio al colegio SDCS
UPDATE usuarios 
SET colegio_id = 'UUID-DEL-COLEGIO-SDCS'
WHERE colegio_id IS NULL 
  AND codigo_estudiante LIKE 'EST%';
```

### Paso 3: Desplegar cambios de frontend
Subir los archivos modificados:
- `config/supabase.config.js`
- `auth/auth.core.js`
- `auth/auth.session.js`
- `auth/tenant-guard.js` (NUEVO)
- `admin/admin.api.js`

### Paso 4: Limpiar políticas RLS peligrosas
```sql
-- En Supabase SQL Editor, ejecutar FASE 1 del script
-- ⚠️ PROBAR PRIMERO EN DESARROLLO
```

### Paso 5: Crear funciones y triggers SQL
```sql
-- Ejecutar FASES 2-5 del script
```

### Paso 6: Verificar aislamiento
1. Login como admin del colegio A → buscar "emily" → solo aparecen usuarios del colegio A
2. Login como admin del colegio B → buscar "emily" → solo aparecen usuarios del colegio B
3. Abrir consola del navegador → `TenantGuard.report()` → 0 violaciones

---

## Verificación de Seguridad

### Test Manual
| Test | Resultado Esperado |
|------|-------------------|
| Admin SDCS busca "emily" | Solo ve EST0061 (SDCS) |
| Admin SDCS no ve SEMINARIO101/149 | Registros de otro colegio NO aparecen |
| Crear estudiante desde admin | Se asigna colegio_id automáticamente |
| Crear docente desde admin | Se asigna colegio_id automáticamente |
| `TenantGuard.report()` | 0 violaciones |
| Insertar usuario sin colegio_id (SQL) | Trigger rechaza la operación |

### Test SQL
```sql
-- Debe retornar 0 filas (excepto super_admin)
SELECT COUNT(*) FROM usuarios 
WHERE colegio_id IS NULL AND tipo_usuario != 'super_admin';

-- Debe retornar SOLO usuarios del colegio especificado
SELECT * FROM obtener_usuarios_por_colegio(
  'UUID-COLEGIO'::uuid, 'estudiante', 'emily', true
);
```

---

## Arquitectura Multi-Tenant Actual vs Futura

### ACTUAL (con anon key)
```
Frontend → colegio_id en query params → Supabase REST API (anon) → RLS permisivo
          + TenantGuard valida respuesta
```

### FUTURA (con Supabase Auth)
```
Frontend → Supabase Auth (JWT con user_id) → RLS por auth.uid() → Solo datos del tenant
          + TenantGuard como capa extra
```

### Migración Pendiente
1. Implementar Supabase Auth (con email/password)
2. Activar políticas RLS basadas en `auth.uid()`
3. El TenantGuard sigue activo como segunda capa
4. Eliminar uso de anon key para operaciones sensibles
