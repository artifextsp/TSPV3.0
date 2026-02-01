# Módulo de Cobros / Mensualidades — Diseño técnico y funcional

**Versión:** 1.0  
**Stack:** HTML + CSS + JavaScript (frontend), Supabase / PostgreSQL (backend)  
**Perfil:** Administrador — checkpoint de seguridad, parámetros, estudiantes, saldos, WhatsApp semi-automático.

> **Nota:** El diseño se basa en el esquema inferido del proyecto (acudientes, usuarios, ciclos_lectura/sesiones). Si existe `table_schema.txt`, alinear nombres de tablas/campos con ese archivo.

---

## Resumen ejecutivo

El módulo permite:
1. **Checkpoint de seguridad** antes de cualquier actualización masiva (crear punto de recuperación y poder revertir).
2. **Parámetros:** mensaje WhatsApp con placeholders, enlaces, valor base de mensualidad.
3. **Estudiantes:** selector de mes, asignación automática de cobro, lista con estado y envío WhatsApp.
4. **Saldos:** saldo manual por estudiante, becas (%), fórmula cobro final, desglose.
5. **WhatsApp:** botón que abre WhatsApp con mensaje pre-rellenado y avance al siguiente registro.

---

## 1. Checkpoint de seguridad (punto de entrada)

### 1.1 Ubicación y UX

- **No es una pestaña:** es una pantalla/paso inicial al entrar al módulo de mensualidades.
- Flujo: Admin hace clic en "Cobros / Mensualidades" → **primero** ve la pantalla de checkpoint → desde ahí puede "Entrar al módulo" (y entonces ver Parámetros / Estudiantes / Saldos).
- En la pantalla de checkpoint se muestra:
  - Último punto de recuperación (fecha/hora y resumen: ej. "Antes de asignar febrero 2026").
  - Botón **"Crear punto de recuperación ahora"** (guardar estado actual antes de operaciones).
  - Botón **"Revertir al último checkpoint"** (solo si existe checkpoint).
  - Botón **"Entrar al módulo"** (ir a las pestañas).

### 1.2 Implementación técnica del checkpoint

**Qué se guarda (en Supabase):**

- Tabla sugerida: `checkpoint_cobros`
  - `id` UUID PK
  - `created_at` timestamptz
  - `descripcion` TEXT (ej. "Antes de asignar febrero 2026")
  - `snapshot_cobros` JSONB — copia de los registros de `cobros_mensuales` afectados al momento del checkpoint (array de objetos { estudiante_id, anio, mes, valor, estado, ... })
  - `snapshot_saldos` JSONB — copia de `saldos_estudiante` (o equivalente) al momento del checkpoint
  - `usuario_id` UUID (admin que creó el checkpoint, opcional)

**Cuándo se guarda:**

- Solo cuando el admin hace clic en **"Crear punto de recuperación ahora"**.
- Opcional: se puede ofrecer un checkpoint automático justo antes de "Asignar cobros del mes" (confirmación: "¿Crear checkpoint antes de asignar?").

**Cómo se restaura:**

- Al hacer clic en **"Revertir al último checkpoint"**:
  1. Se lee el último registro de `checkpoint_cobros` (ORDER BY created_at DESC LIMIT 1).
  2. Se eliminan o actualizan los registros actuales de `cobros_mensuales` que estén en `snapshot_cobros` (según diseño: restaurar valores del snapshot).
  3. Se restaura `saldos_estudiante` desde `snapshot_saldos`.
  4. Se muestra mensaje de éxito y se recargan las pestañas.

**Validaciones:**

- Revertir solo si existe al menos un checkpoint.
- Confirmación explícita: "¿Revertir al checkpoint del [fecha]? Se perderán los cambios posteriores."

---

## 2. Pestaña "Parámetros" — Configuración central

### 2.1 Editor de mensajes WhatsApp

- **Campo:** textarea (o editor de texto) donde el admin escribe el mensaje.
- **Placeholders** (campos dinámicos de BD) con sintaxis `{{nombre_placeholder}}`:

| Placeholder              | Origen en BD / lógica                                      | Ejemplo de valor        |
|--------------------------|------------------------------------------------------------|-------------------------|
| `{{nombre_acudiente}}`   | `acudientes.nombre` (+ `acudientes.apellidos` si se desea)  | María García            |
| `{{username_acudiente}}` | `acudientes.username`                                      | ACU001                  |
| `{{nombre_estudiante}}`  | `usuarios.nombre` + `usuarios.apellidos` (vinculado por acudientes.estudiante_id) | Juan Pérez              |
| `{{ciclo_entrenamiento}}`| Ciclo actual del estudiante (p. ej. último `numero_ciclo` de sesiones lectura/creatividad) o "N/A" | 3                       |
| `{{mes_cobro}}`          | Mes seleccionado en pestaña Estudiantes                    | Febrero 2026            |
| `{{estado_cobro}}`       | Estado del cobro del registro actual                       | Pendiente / Al día      |
| `{{valor_a_cobrar}}`     | Cobro final calculado (saldo + mensualidad, con beca)       | 450.000                 |
| `{{link_plataforma}}`    | URL base configurada en Parámetros (ver 2.3)                | https://...             |
| `{{link_video_1}}`       | Primer enlace de videotutorial (ver 2.3)                   | https://...             |
| `{{link_video_2}}`       | Segundo enlace (opcional)                                  | https://...             |

- **Identificación visual:** en el editor, los placeholders pueden mostrarse con estilo distinto (ej. badge o color) y al enviar el mensaje se reemplazan por valores reales; el texto base no se modifica en BD, solo en el momento del envío.

### 2.2 Configuración de enlaces

- **URL de la plataforma:** input texto. Se usa para `{{link_plataforma}}` (resultados del estudiante; si en el futuro se añade `?user=username_acudiente`, se puede concatenar aquí o en lógica).
- **URLs de videotutoriales:** lista de inputs (mínimo 1, opcionalmente 2 o más). Se reemplazan como `{{link_video_1}}`, `{{link_video_2}}`, etc.

### 2.3 Valor base de mensualidad

- **Campo numérico** (solo número, sin símbolos en BD). Se guarda en tabla de parámetros (ej. `parametros_cobro` o `tarifas_mensuales`).
- Se usa en pestaña Estudiantes para asignar valor a registros con estado "pendiente" al elegir un mes.

### 2.4 Persistencia

- Una sola fila de configuración (o una por “tipo” si se extiende): mensaje WhatsApp, link plataforma, links videos, valor base.
- Tabla sugerida: `parametros_cobro` (id, mensaje_whatsapp, link_plataforma, link_video_1, link_video_2, valor_base_mensualidad, updated_at, etc.).

---

## 3. Pestaña "Estudiantes" — Asignación de cobros

### 3.1 Selector de mes de cobro

- **Dropdown:** meses (enero–diciembre) + año (selector numérico o dropdown). Ejemplo: "Febrero" + "2026".
- Al cambiar mes (y año), se recargan los cobros de ese periodo.

### 3.2 Lógica de asignación automática

- **Disparador:** botón tipo "Asignar cobros del mes" (o al confirmar mes).
- **Lógica:**
  1. Mes seleccionado = M (1–12), Año = A.
  2. Se obtienen estudiantes con cobro en estado "pendiente" para (A, M), o estudiantes activos que aún no tengan registro para (A, M).
  3. A cada uno se le asigna el **valor base** de Parámetros como valor del cobro para ese mes.
  4. Se crean/actualizan filas en `cobros_mensuales` (estudiante_id, anio, mes, valor_base, valor_final, estado 'pendiente').

**Validación:** Solo se puede asignar si hay valor base configurado en Parámetros y, opcionalmente, si existe checkpoint reciente (o se ofrece crearlo antes).

### 3.3 Lista de estudiantes

- **Columnas sugeridas:**
  - Nombre del estudiante (`usuarios.nombre`, `apellidos`)
  - Nombre del acudiente (`acudientes.nombre`, `apellidos`) — vía acudientes.estudiante_id (un estudiante puede tener más de un acudiente; mostrar el principal o concatenar).
  - Ciclo actual (desde sesiones lectura/creatividad: último numero_ciclo; o "N/A")
  - Estado de cobro actual (pendiente / al_dia / enviado, etc.)
  - Valor asignado para el mes seleccionado
  - Opción "Marcar como enviado" (checkbox o botón) cuando se use el botón WhatsApp para ese registro.

- **Origen de datos:** vista o query que una `cobros_mensuales` + `usuarios` (estudiante) + `acudientes` (por estudiante_id) + opcionalmente ciclo desde sesiones.

---

## 4. Pestaña "Saldos" — Gestión de deudas y becas

### 4.1 Saldo manual por estudiante

- **Tabla:** columnas [Nombre estudiante | Saldo]. Saldo = número editable (inicialmente 0). Se persiste en tabla `saldos_estudiante` (estudiante_id, saldo, updated_at) o equivalente por acudiente si el negocio es por familia.

### 4.2 Sistema de becas

- **Por estudiante:** campo "Porcentaje beca" (0–100), por defecto 0.
- **Botón global "Becados":** activa/desactiva el sistema de becas. Cuando está activo, se aplica el descuento; cuando está inactivo, se ignora (cobro = saldo + mensualidad sin descuento).

### 4.3 Fórmula de cálculo

- **Cobro final = (Saldo + Mensualidad base) × (1 − porcentaje_beca / 100)**
  - Beca 100% → cobro final = 0.
  - Beca 50% → se cobra 50% de (Saldo + Mensualidad).
  - Beca 0% → se cobra 100% de (Saldo + Mensualidad).

### 4.4 Visualización del desglose

- Por fila (o en detalle) mostrar: Saldo actual | Mensualidad base | % beca | Descuento por beca | Cobro final.

---

## 5. Integración WhatsApp semi-automática

### 5.1 Comportamiento del botón

- Ubicación: en cada fila de la lista de Estudiantes (o en Saldos) para el acudiente correspondiente.
- Al hacer clic:
  1. Se toma el mensaje guardado en Parámetros.
  2. Se reemplazan todos los `{{...}}` con los datos del registro actual (acudiente, estudiante, ciclo, mes, estado, valor a cobrar, enlaces).
  3. Se construye el número de WhatsApp desde `acudientes.celular` (formato internacional si hace falta).
  4. Se abre `https://wa.me/<numero>?text=<mensaje_encoded>` (nueva pestaña).
  5. El admin envía manualmente en WhatsApp.
  6. Opcional: botón "Siguiente" en la misma vista que marca el actual como "enviado" y avanza al siguiente registro pendiente (misma dinámica).

### 5.2 Validaciones antes de abrir WhatsApp

- Celular del acudiente no vacío.
- Mensaje con placeholders reemplazables (si falta un valor, usar "N/A" o texto por defecto para no dejar `{{...}}` literal).
- Opcional: no permitir abrir WhatsApp si no hay valor base o parámetros guardados.

---

## 6. Flujo de datos completo

```
Parámetros (valor base, mensaje, enlaces)
       ↓
Estudiantes: selector mes → asignación automática usa valor base → lista muestra estado y valor
       ↓
Saldos: saldo manual + % beca → fórmula → cobro final usado en lista y en mensaje WhatsApp
       ↓
WhatsApp: mensaje = f(Parámetros, registro actual de Estudiante + Saldo) → wa.me
```

- **Parámetros → Estudiantes:** valor base para asignar; mensaje y enlaces para WhatsApp.
- **Estudiantes → Saldos:** mismo estudiante; el cobro mostrado en Estudiantes puede usar ya el cobro final calculado con saldo y beca.
- **Saldos → WhatsApp:** valor a cobrar y, si se desea, recordatorio de saldo en el mensaje.
- **Checkpoint:** guarda estado de cobros y saldos antes de operaciones masivas; la restauración vuelve a dejar el sistema en ese estado.

---

## 7. Estructura de tablas y campos (Supabase/PostgreSQL)

### 7.1 Tablas existentes (referencia)

- **acudientes:** id, nombre, apellidos, email, celular, username, estudiante_id, activo, ...
- **usuarios:** id, nombre, apellidos, codigo_estudiante, grado, tipo_usuario, activo, ...
- **ciclos** (o ciclos_lectura / ciclos_creatividad): numero_ciclo, fecha_inicio, fecha_fin (según módulo). Para "ciclo actual" del estudiante se puede usar la última sesión del estudiante.

### 7.2 Tablas nuevas recomendadas

**parametros_cobro** (una fila o por tipo)

| Campo                    | Tipo     | Obligatorio | Descripción                          |
|-------------------------|----------|-------------|--------------------------------------|
| id                      | UUID PK  | Sí          |                                      |
| mensaje_whatsapp        | TEXT     | No          | Plantilla con placeholders            |
| link_plataforma         | TEXT     | No          | URL base resultados estudiante        |
| link_video_1            | TEXT     | No          | Primer videotutorial                  |
| link_video_2            | TEXT     | No          | Segundo videotutorial                 |
| valor_base_mensualidad   | NUMERIC  | Sí          | Valor por defecto para asignación     |
| becas_activo            | BOOLEAN  | Sí (default true) | Si se aplican becas            |
| updated_at              | TIMESTAMPTZ | Sí        |                                      |

**cobros_mensuales**

| Campo         | Tipo        | Obligatorio | Descripción                    |
|---------------|-------------|-------------|--------------------------------|
| id            | UUID PK     | Sí          |                                |
| estudiante_id | UUID FK     | Sí          | usuarios.id                    |
| anio          | INTEGER     | Sí          | Año del cobro                  |
| mes           | INTEGER     | Sí          | 1–12                           |
| valor_base    | NUMERIC     | Sí          | Valor asignado (mensualidad)   |
| valor_final   | NUMERIC     | Sí          | Tras beca (o = valor_base)     |
| estado        | TEXT        | Sí          | pendiente | al_dia | enviado      |
| enviado_at    | TIMESTAMPTZ | No          | Cuándo se marcó enviado        |
| created_at    | TIMESTAMPTZ | Sí          |                                |
| updated_at    | TIMESTAMPTZ | Sí          |                                |

- UNIQUE(estudiante_id, anio, mes).

**saldos_estudiante** (o saldos_acudiente si el negocio es por acudiente)

| Campo         | Tipo        | Obligatorio | Descripción           |
|---------------|-------------|-------------|-----------------------|
| id            | UUID PK     | Sí          |                       |
| estudiante_id | UUID FK     | Sí          | usuarios.id           |
| saldo         | NUMERIC     | Sí (default 0) | Deuda acumulada    |
| porcentaje_beca | NUMERIC   | Sí (default 0) | 0–100             |
| updated_at    | TIMESTAMPTZ | Sí          |                       |

- UNIQUE(estudiante_id) si es un saldo por estudiante.

**checkpoint_cobros**

| Campo             | Tipo        | Obligatorio | Descripción                    |
|-------------------|-------------|-------------|--------------------------------|
| id                | UUID PK     | Sí          |                                |
| created_at        | TIMESTAMPTZ | Sí          |                                |
| descripcion       | TEXT        | No          | "Antes de asignar feb 2026"    |
| snapshot_cobros   | JSONB       | No          | Array de filas cobros_mensuales |
| snapshot_saldos   | JSONB       | No          | Array de filas saldos_estudiante |
| usuario_id        | UUID        | No          | Admin que creó                 |

---

## 8. Validaciones por paso

- **Asignar mes de cobro:** valor base en Parámetros definido; opcional: checkpoint creado o confirmación de no revertir.
- **Enviar mensaje WhatsApp:** celular del acudiente presente; placeholders reemplazables (valores faltantes → "N/A").
- **Guardar Parámetros:** valor base numérico ≥ 0; URLs válidas si se validan en front.
- **Revertir checkpoint:** existe al menos un checkpoint; confirmación del usuario.
- **Aplicar beca:** porcentaje entre 0 y 100; becas_activo = true para que tenga efecto.

---

## 9. Interconexión de pestañas (resumen)

- **Parámetros → Estudiantes:** valor base para asignación; plantilla y enlaces para WhatsApp.
- **Parámetros → Saldos:** becas_activo (global); valor base usado en fórmula de cobro final.
- **Estudiantes → Saldos:** mismo estudiante; valor_final en Estudiantes puede calcularse con saldo + beca desde Saldos.
- **Todas → WhatsApp:** mensaje final = Parámetros (plantilla + enlaces) + datos del registro en Estudiantes + cobro final (Saldos).

---

## 10. Casos de error y notificación al administrador

| Caso                          | Acción recomendada                                              |
|-------------------------------|------------------------------------------------------------------|
| Falla al asignar cobros del mes | Rollback transaccional si es posible; mostrar mensaje de error; ofrecer "Revertir al último checkpoint" si existe. |
| Falla al guardar Parámetros   | No cerrar modal; mostrar error debajo del formulario; no limpiar campos. |
| Falla al crear checkpoint     | Mostrar "No se pudo crear el punto de recuperación. ¿Continuar igual?" (Sí/No). |
| Falla al revertir             | Mostrar error; no cambiar datos; registrar en consola o log.     |
| Celular vacío al abrir WhatsApp | Deshabilitar botón o mostrar aviso: "Complete el celular del acudiente." |
| API Supabase no disponible    | Mensaje genérico: "Error de conexión. Revise su red e intente de nuevo." |

---

## 11. Recomendaciones de implementación (JavaScript / Supabase)

1. **Checkpoint:**  
   - Crear checkpoint: `POST /rest/v1/checkpoint_cobros` con body `{ descripcion, snapshot_cobros, snapshot_saldos }`.  
   - Obtener último: `GET .../checkpoint_cobros?order=created_at.desc&limit=1`.  
   - Revertir: en front, leer snapshot y hacer PATCH/DELETE+INSERT sobre `cobros_mensuales` y `saldos_estudiante` según snapshot (o RPC en Supabase que lo haga en una transacción).

2. **Parámetros:**  
   - Una sola fila: `GET .../parametros_cobro?limit=1`; actualizar con `PATCH .../parametros_cobro?id=eq.<id>`.

3. **Placeholders:**  
   - En front: `mensaje.replace(/\{\{(\w+)\}\}/g, (_, key) => datos[key] ?? 'N/A')` donde `datos` es un objeto con nombre_acudiente, nombre_estudiante, etc., construido desde la fila actual y Parámetros.

4. **Estudiantes:**  
   - Listar cobros del mes: `GET .../cobros_mensuales?anio=eq.2026&mes=eq.2&select=*,usuarios:estudiante_id(nombre,apellidos,codigo_estudiante),acudientes(...)` (o join vía vista).  
   - Asignar: para cada estudiante sin cobro en (anio, mes), `POST` a `cobros_mensuales` con valor_base desde Parámetros.

5. **Saldos:**  
   - Listar: `GET .../saldos_estudiante?select=*,usuarios:estudiante_id(nombre,apellidos)`.  
   - Actualizar: `PATCH .../saldos_estudiante?estudiante_id=eq.<id>` con `{ saldo, porcentaje_beca }`.

6. **WhatsApp:**  
   - Construir número desde `acudientes.celular` (quitar espacios, agregar código país si falta); `window.open('https://wa.me/' + numero + '?text=' + encodeURIComponent(mensaje))`.

7. **RLS (Supabase):**  
   - Políticas para que solo rol `admin` (o el que corresponda) pueda leer/escribir `parametros_cobro`, `cobros_mensuales`, `saldos_estudiante`, `checkpoint_cobros`.

---

Este documento sirve como especificación única para implementar el módulo de cobros en el perfil de administrador, con checkpoint de seguridad, tres pestañas (Parámetros, Estudiantes, Saldos) e integración WhatsApp semi-automática, alineado con el esquema actual (acudientes, usuarios, ciclos/sesiones) y extensible a tu `table_schema.txt` cuando exista.
