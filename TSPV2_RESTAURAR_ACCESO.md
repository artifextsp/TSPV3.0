# TSPV2: Restauración de acceso y diagnóstico

## Problema

Tras desplegar cambios de frontend que incluyen el campo `colegio_id` en las peticiones a `usuarios`, el **login falla en TSPV2** con:

- **HTTP 400** y mensaje: `column "usuarios.colegio_id" does not exist` (código PostgreSQL **42703**).

**Causa:** En la base de datos **TSPV2** la tabla `usuarios` **no tiene** la columna `colegio_id`. El frontend la pide en el `select` y Supabase devuelve 400. (TSPV2 y Ludens son plataformas distintas; cada una tiene su propio esquema.)

---

## 1. Análisis de políticas RLS en TSPV2

En TSPV2 hay que comprobar:

- Que exista una política **SELECT** para el rol **anon** en la tabla `usuarios` (necesaria para el login con clave anon).
- Que no haya políticas con `USING (true)` o `WITH CHECK (true)` que hayan sido eliminadas sin reemplazo, dejando la tabla sin acceso de lectura.

**Consultas de diagnóstico** (incluidas en `scripts/tspv2_restaurar_acceso.sql`):

```sql
-- Políticas actuales en usuarios
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios';

-- ¿RLS activo?
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'usuarios';
```

---

## 2. Validación de tablas de autenticación

- **Estructura:** La tabla `usuarios` debe tener al menos: `id`, `email`, `password_hash`, `nombre`, `tipo_usuario`, `activo`, etc. Si falta `colegio_id`, el login falla con 400 al pedirla en el `select`.
- **RLS:** El rol `anon` debe poder hacer **SELECT** en `usuarios` (y en `acudientes` para login de acudientes).

---

## 3. Verificación de la filtración (solo si aplica en TSPV2)

- Si en TSPV2 no usas multi-tenant ni `colegio_id`, no hace falta alinear nada con otras plataformas.
- El frontend detecta si la BD tiene `colegio_id`; si no, deja de pedirla y el login funciona con `colegio_id: null` en sesión.

---

## 5. Plan de restauración

### Opción A: Reparar la base TSPV2 (recomendado)

Ejecutar en **Supabase → SQL Editor → proyecto TSPV2** el script:

**`scripts/tspv2_restaurar_acceso.sql`**

Ese script:

1. **Diagnostica:** columnas de `usuarios`, existencia de `colegio_id`, políticas RLS, tabla `colegios`.
2. **Añade** la columna `usuarios.colegio_id` (UUID, FK a `colegios`, nullable) si no existe.
3. **Crea índice** `idx_usuarios_colegio_id`.
4. **Opcional:** rellena `colegio_id` desde `estudiantes_colegios` o asigna un colegio por defecto (bloque comentado).
5. **Ajusta RLS:** asegura políticas anon SELECT/INSERT/UPDATE/DELETE en `usuarios` y SELECT en `acudientes` para que el login funcione.

Después de ejecutarlo, el login en TSPV2 funcionará y, si en el futuro quieres usar multi-tenant en TSPV2, la columna ya existirá.

### Opción B: Solo frontend (sin tocar la BD)

El frontend ya es **compatible con BD sin `colegio_id`**:

- Si la primera petición a `usuarios` devuelve **400** con código **42703** y mensaje que menciona `colegio_id`, se guarda en `sessionStorage` que esta BD no tiene esa columna.
- Las siguientes peticiones a `usuarios` (login, recuperar contraseña, perfil, estudiante hijo) **no incluyen** `colegio_id` en el `select`.
- El usuario inicia sesión con `colegio_id: null` en sesión y el resto de la app funciona.

**Pasos:** Desplegar los cambios de `auth/auth.core.js` (y el resto del front ya desplegado). No hace falta ejecutar SQL en TSPV2 para recuperar el login.

---

## Resumen de archivos

| Archivo | Uso |
|--------|-----|
| `scripts/tspv2_restaurar_acceso.sql` | Diagnóstico + añadir `colegio_id` + RLS para TSPV2. |
| `auth/auth.core.js` | Login y peticiones a `usuarios` compatibles con BD con o sin `colegio_id`. |
| Este documento | Guía de diagnóstico y restauración para TSPV2. |

---

## Orden recomendado

1. **Inmediato (restaurar acceso):** Desplegar los cambios actuales del frontend. Con eso el login en TSPV2 vuelve a funcionar aunque no exista `colegio_id`.
2. **Opcional:** Si en TSPV2 quieres usar en el futuro columna `colegio_id` o multi-tenant, ejecutar `scripts/tspv2_restaurar_acceso.sql` en la BD de TSPV2. Si no lo necesitas, no hace falta.
