# Módulo de Cobro de Mensualidades — Mapa de decisiones

Documento de arquitectura y decisiones para un sistema de cobro mensual a acudientes en una plataforma educativa. Enfocado en: control administrativo, comunicación eficiente y bajo costo.

---

## Decisiones confirmadas (resumen operativo)

| Tema | Decisión |
|------|----------|
| **Modelo de cobro** | Cobro por **estudiante-mes** (una fila por estudiante por mes). Valor acudiente = suma de sus hijos + saldo. |
| **Cálculo por fecha** | Desde el **día 1** del mes ya existe deuda a efectos del sistema. Pacto interno con padres: deben cancelar en los **primeros 5 días** de cada mes. El sistema no “espera” al día 5 para considerar deuda; los recordatorios semanales respetan ese pacto. |
| **Deuda total** | **Meses pendientes + saldo histórico** (híbrido: saldo arrastrado manual + suma de cobros no marcados “Al día”). |
| **Cuándo se envía el recordatorio** | **Cada semana**: al día siguiente de la sesión de entrenamiento se envían resultados por WhatsApp y, en ese mismo flujo, el recordatorio de cobro. En el mes se hace **4 veces** (una por semana). Hoy se hace manualmente con lista en papel; el módulo debe reemplazar esa lista y facilitar el envío. |
| **WhatsApp** | **Opción A**: botón “Abrir WhatsApp” con mensaje prediseñado y número ya cargado; solo falta **pulsar enviar**. Sin envío automático. |

---

## 1. Estructura del módulo de cobros

### Pregunta clave
**¿Un “cobro” es un registro por mes por acudiente, por estudiante, o una combinación (un acudiente puede tener varios hijos con valores distintos)?**

Tu realidad: un acudiente puede tener varios estudiantes (hijos). Cada hijo puede tener valor mensual distinto, beca, o valor personalizado. El formato digital que envías es “por acudiente” pero el valor puede depender de la suma de sus hijos.

### Opciones viables

| Enfoque | Descripción | Trade-offs |
|--------|-------------|------------|
| **A) Cobro por acudiente-mes** | Una fila por acudiente por mes. El “valor” es la suma que tú calculas (o un valor fijo por acudiente). | Simple. No modela bien “este hijo becado, este no”. Para becas/custom hay que guardar el desglose aparte o en un campo JSON. |
| **B) Cobro por estudiante-mes** | Una fila por estudiante por mes. Cada hijo tiene su valor/beca. La “cuenta” del acudiente es la suma de sus hijos. | Más fiel a la realidad (beca por hijo, valor por hijo). Más tablas y consultas; al mostrar “resumen acudiente” hay que agregar. |
| **C) Híbrido** | Tarifa/base por acudiente (o por estudiante) + tabla de “líneas” o “conceptos” por mes (mensualidad, saldo anterior, descuento). | Máxima flexibilidad y auditoría. Mayor complejidad; ideal si más adelante quieres facturación detallada o reportes fiscales. |

### Recomendación
**B) Cobro por estudiante-mes**, con una tarifa o valor por defecto por estudiante (o por grado/ciclo) y excepciones explícitas:
- Becado = valor 0 para ese estudiante ese mes.
- Valor personalizado = override por estudiante (o por acudiente-estudiante).

Así el “valor a cancelar” del acudiente = suma de los cobros de sus estudiantes ese mes + saldo arrastrado (punto 3). Mantienes control y claridad sin llegar a la complejidad de un híbrido con líneas de concepto.

### Decisiones críticas a cerrar
- ¿El valor por defecto es por **grado**, por **ciclo** (lectura/creatividad/etc.) o un **valor único** mensual por estudiante?
- ¿Beca se define por estudiante (siempre 0) o por periodo (este mes sí, el siguiente no)?

### Próximos pasos
1. ~~Definir entidad mínima~~ Hecho: ver **scripts/crear_modulo_cobros_mensualidades.sql** y **MODULO_COBROS_MODELO_DATOS.md**.
2. Tras ejecutar el script: ajustar en `tarifas_mensuales` el valor por defecto (el script inserta 0; poner el valor real).
3. Regla documentada: “valor acudiente en mes X = suma(cobros de sus estudiantes en mes X) + saldo_anterior” (saldo en `saldos_acudiente` por email).

---

## 2. Flujo del estado de pago

### Pregunta clave
**¿“Al día” es solo un estado (pagado) o además implica que ese mes deja de generar mora/interés o de sumarse al saldo?**

Asumamos que “Al día” = ese mes está pagado; el valor de ese mes pasa a 0 en lo que respecta a deuda. Si no se marca, ese mes se considera adeudado y se arrastra.

### Opciones viables

| Enfoque | Descripción | Trade-offs |
|--------|-------------|------------|
| **A) Estado binario por mes** | Cada mes tiene: pendiente | al_día (pagado). No pagado = se suma al saldo. | Muy simple. No distingues “parcialmente pagado” ni “en proceso”. |
| **A+) Con fecha de pago** | Igual que A pero guardas fecha en que marcaste “Al día”. | Útil para histórico y reportes; casi mismo esfuerzo. |
| **B) Monto pagado vs monto debido** | Guardas monto debido y monto pagado por mes. Saldo = debido - pagado. | Permite pagos parciales y descuentos a posteriori. Más lógica y posibles inconsistencias si no se valida bien. |
| **C) Eventos de pago** | No guardas “estado” sino “pagos” (fecha, monto, mes que cubre). El estado se deriva: mes al día si suma de pagos ≥ cobro. | Máximo detalle y trazabilidad. Más tablas y lógica; recomendable si más adelante quieres conciliación con pasarelas. |

### Recomendación
**A+**: Estado por mes (pendiente / al_día) + fecha en que se marcó “Al día”. La acumulación se calcula así:
- **Saldo acudiente** = saldo arrastrado anterior (campo “saldo”) + suma de meses pendientes (cobros no marcados “Al día”).
- Cuando marcas “Al día” para un mes: ese mes deja de contar para la deuda; opcionalmente registras la fecha.

Evitas pagos parciales en esta fase; si más adelante los necesitas, puedes migrar a B o C.

### Decisiones críticas
- ¿Un mes “pendiente” siempre suma su valor completo a la deuda, o puede haber “descuentos” por beca aplicada a posteriori? (Si es sí, necesitas algo tipo B.)
- ¿La “consolidación” es automática (cada vez que abres el dashboard recalculas) o quieres un “cierre” mensual que fija el saldo? Lo más simple: recálculo al vuelo desde cobros + saldo anterior.

### Regla de fecha (primeros 5 días)
- **Internamente**: desde el día 1 del mes el cobro del mes ya existe y, si no está “Al día”, cuenta para la deuda.
- **Pacto con padres**: se les pide cancelar en los primeros 5 días del mes. No es un “vencimiento” técnico en el sistema; es el mensaje que se comunica. Los recordatorios semanales (4 veces al mes) refuerzan ese pacto.

### Próximos pasos
1. Definir estados posibles por registro estudiante-mes: p. ej. `pendiente`, `al_dia`, y opcional `exento` (beca).
2. Definir regla de acumulación por acudiente: “deuda actual = saldo_anterior + suma(valor de meses en pendiente de sus estudiantes)”.
3. En el admin: botón “Al día” que actualiza estado (y opcionalmente fecha de pago) de ese mes para ese estudiante (o para todos los estudiantes del acudiente ese mes, según tu regla de negocio).

---

## 3. Gestión de saldos y deudas antiguas

### Pregunta clave
**¿El “saldo” es un número que solo se actualiza cuando tú lo corriges manualmente, o debe ser siempre resultado de una fórmula (meses pendientes + saldo histórico)?**

Si es resultado de una fórmula, evitas que “saldo” y “meses pendientes” se desincronicen.

### Opciones viables

| Enfoque | Descripción | Trade-offs |
|--------|-------------|------------|
| **A) Saldo como campo editable** | Campo “saldo anterior” o “saldo a favor/deuda” por acudiente. Tú lo actualizas. La deuda total = saldo + meses pendientes. | Máximo control manual (arrastres de otro sistema, acuerdos). Riesgo de error humano y desfase si no se disciplina. |
| **B) Saldo solo calculado** | Saldo = suma de todos los meses no “al día” históricos. No guardas “saldo” como número, solo cobros y estados. | Una sola fuente de verdad. No sirve si tienes deudas que vienen de “fuera” (ej. sistema anterior) que no son mes a mes. |
| **C) Híbrido** | Campo “saldo arrastrado” (manual, para deudas antiguas o ajustes) + deuda por meses = suma de pendientes. Deuda total = saldo arrastrado + meses pendientes. | Combina control manual con consistencia: los meses los controla el sistema; lo “viejo” o excepcional, tú. |

### Recomendación
**C) Híbrido**:
- **Saldo arrastrado**: un solo campo por acudiente (o por “cuenta” si en el futuro separas cuenta de acudiente). Lo usas para: deuda que traían de antes, acuerdos de pago, o ajustes.
- **Meses pendientes**: los genera el módulo de cobros (estudiante-mes no “al día”).
- **Deuda total** = saldo arrastrado + suma de valores de meses pendientes.

Así no mezclas “cobros recurrentes” con “ajustes manuales” en la misma columna, y reduces conflictos en el registro.

### Decisiones críticas
- ¿El saldo arrastrado es por acudiente o por estudiante? Si un acudiente tiene 3 hijos y uno arrastra deuda de otro colegio, puede que quieras saldo por acudiente. Si la deuda es “del hijo X en 2024”, podría ser por estudiante. Lo más simple: **por acudiente**.
- ¿Permites saldo negativo (a favor del acudiente)? Si sí, define si se descuenta del próximo mes automáticamente o solo se muestra.

### Próximos pasos
1. Añadir en el modelo “cuenta” o acudiente: campo `saldo_arrastrado` (numérico, puede ser negativo si es a favor).
2. Documentar en el mismo documento: “Deuda total = saldo_arrastrado + suma(cobros pendientes de sus estudiantes)”.
3. En el admin: pantalla o sección para “Ajustar saldo” con motivo breve (opcional) para auditoría.

---

## 4. Dashboard administrativo

### Pregunta clave
**¿Qué decisión tomas cada semana o cada mes con esta información, y qué no puedes hacer hoy sin el sistema?**

Eso define las funcionalidades críticas.

### Funcionalidades recomendadas (prioridad)

| Prioridad | Funcionalidad | Para qué |
|-----------|---------------|----------|
| **1** | Vista “Estado por mes” (tabla acudientes × meses, o estudiantes × meses) con estado (pendiente / al día) y valor. | Ver de un vistazo quién debe qué y en qué mes. |
| **2** | Filtros: por mes/año, por “tiene deuda”, por estudiante/acudiente, por grado. | Enfocarte en morosos o en un mes concreto. |
| **3** | Acción “Marcar al día” (por estudiante-mes o por acudiente-mes según tu modelo). | Registrar el pago sin tener que editar montos. |
| **4** | Columna o bloque “Deuda total” por acudiente (saldo arrastrado + pendientes). | Saber cuánto debe cada quien antes de enviar recordatorios. |
| **5** | Histórico: ver meses anteriores (solo lectura). | Consultar si “ya pagó marzo” o no. |
| **6** | Alertas de vencimiento: lista de “cobros que ya pasaron de fecha” (ej. estamos en febrero y enero sigue pendiente). | Opcional: puede ser una vista filtrada “pendientes del mes anterior” sin necesidad de “fecha de vencimiento” al inicio. |

No hace falta en la primera versión: intereses automáticos, pasarela de pago, facturación electrónica. Eso son decisiones posteriores.

### Recomendación
Empezar con:
- Una sola vista principal: **acudientes (o estudiantes) × periodo (mes/año)** con estado y valor.
- Filtros mínimos: periodo, “con deuda sí/no”.
- Botón “Al día” por fila (o por acudiente para ese mes).
- Campo “Saldo arrastrado” editable por acudiente en detalle o en lista.
- Una pestaña o sección “Histórico” = mismos datos en solo lectura para meses pasados.

Las “alertas” pueden ser al inicio un filtro: “Pendientes del mes anterior”, sin notificaciones automáticas.

### Próximos pasos
1. Listar en un mock o en papel: columnas y filas de la vista principal.
2. Decidir si la unidad de la tabla es acudiente o estudiante (coherente con punto 1).
3. Implementar primero la lectura (cobros + estados + saldo) y después las acciones (marcar al día, ajustar saldo).

---

## 5. Automatización de WhatsApp

### Pregunta clave
**¿Necesitas que el mensaje se envíe solo (sin que tú hagas clic) a una lista de números, o te basta con reducir el trabajo manual (un clic por acudiente que abre WhatsApp con mensaje y link listos)?**

Eso marca la frontera entre “costo cero” y “uso de API de pago”.

### Opciones viables

| Enfoque | Descripción | Costo | Trade-offs |
|--------|-------------|--------|------------|
| **A) Link/btn “Abrir WhatsApp”** | En el admin, por acudiente: botón que abre `wa.me/57XXXXXXXX?text=...` con mensaje y link al dashboard pre-llenados. Tú das clic y envías desde tu WhatsApp. | Cero. | Semi-automatizado: no envía solo; tú abres y envías. Escalable hasta donde aguantes dar clic. |
| **B) Lista “Para enviar” + un clic por lote** | Seleccionas acudientes (ej. “todos los que deben este mes”), generas una lista de links `wa.me/...` o un documento con mensajes. Abres uno por uno o copias/pegas. | Cero. | Un poco más ordenado que A; sigue siendo manual el envío. |
| **C) API oficial WhatsApp Business** | Tu sistema llama a la API y envía el mensaje al número. | De pago (conversaciones, límites). | Automatización real. Requiere negocio verificado, políticas, y posible aprobación de plantillas. |
| **D) Servicios no oficiales (ej. Twilio + WhatsApp, o integradores)** | Similar a C pero con otros proveedores. | Varía; muchos pasan a modelo de pago. | Mismo trade-off que C; además riesgo de bloqueo si violas términos. |

### Recomendación y decisión confirmada
**Opción A: botón “Abrir WhatsApp”** con mensaje y número ya cargados:
- Al pulsar el botón se abre WhatsApp (Web o app) con el **número del acudiente** y el **mensaje completo** pre-llenados.
- El único paso que queda es **pulsar enviar**; no hay que copiar/pegar ni escribir el número.
- Mensaje: nombre acudiente, nombre(s) estudiante(s), ciclo/mes, valor a cancelar, link al dashboard, usuario y “contraseña temporal: temporal123”.
- La contraseña no va en la URL; solo en el texto del mensaje.

Esto reemplaza la lista en papel: en lugar de buscar número y mensaje a mano, la pantalla te da “Abrir WhatsApp” por acudiente y tú solo envías. Se usa 4 veces al mes (cada semana, tras la sesión de entrenamiento).

### Decisiones críticas
- ¿Tienes el número de WhatsApp del acudiente en tu base (celular)? Si no, hay que añadirlo y usarlo para construir `wa.me/57<celular>`.
- ¿Un mismo acudiente puede tener varios estudiantes? Si sí, el mensaje debe listar todos y el “valor” debe ser la suma (alineado con punto 1).

### Flujo semanal (uso real)
- Cada semana hay sesión de entrenamiento; al día siguiente se envían resultados y recordatorio de cobro por WhatsApp.
- En el admin necesitas una vista tipo **“Acudientes con deuda (este mes)”** o **“Pendientes de pago”** donde, por cada acudiente que no está al día, tengas un botón **“Abrir WhatsApp”**.
- Al pulsarlo: se abre WhatsApp con el número y el mensaje listos; tú solo pulsas enviar. Así haces los 4 envíos del mes sin lista en papel.

### Próximos pasos
1. Añadir/confirmar campo `celular` (o similar) en acudientes y usarlo para el link.
2. Definir plantilla de mensaje (texto fijo + variables: nombre, estudiante(s), valor, link, usuario, contraseña temporal).
3. En el admin: botón “Abrir WhatsApp” que construye `wa.me/57{celular}?text={mensaje codificado}` y abre en nueva pestaña (o app). Sin pasos extra: número y mensaje listos, solo enviar.

---

## 6. Link del acudiente y acceso seguro

### Pregunta clave
**¿El link debe llevar al acudiente directamente “logueado” (sin escribir contraseña) o solo a la página de login con su usuario ya indicado?**

Llevar “directamente logueado” implica un token en la URL; si alguien copia el link, tiene acceso hasta que expire. Llevar a “login con usuario pre-llenado” es más seguro: la contraseña no va en la URL y el acceso sigue requiriendo que escriban la contraseña (temporal o ya cambiada).

### Opciones viables

| Enfoque | Descripción | Trade-offs |
|--------|-------------|------------|
| **A) Link a login + usuario en query** | Ej. `https://tudominio.com/?user=ACU036`. La página de login carga con el campo usuario ya rellenado; el acudiente solo escribe la contraseña. | Seguro: la contraseña no está en la URL. Un paso más para el acudiente. |
| **B) Link a login genérico** | Solo `https://tudominio.com/guardian/` o `index.html`. El acudiente escribe usuario y contraseña. | Más seguro aún; cero información en la URL. Más fricción. |
| **C) Link con token de un solo uso** | La URL tiene un token que, al abrirla, inicia sesión automáticamente (o establece sesión por X horas). | Muy cómodo para el acudiente. Riesgo si el link se filtra; necesitas expiración y rotación de tokens. |
| **D) Link con token de sesión limitado** | Similar a C pero el token solo sirve para “ver resumen de cobro” o una página de solo lectura, no el dashboard completo. | Menor riesgo que C; más desarrollo (dos tipos de sesión o vista). |

### Recomendación
**A) Link a login con usuario pre-llenado**:  
URL tipo `https://tudominio.com/?user=ACU036` (o `username=ACU036`). En tu página de login:
- Si existe `user` o `username` en la query, rellenar el campo de usuario y enfocar el campo de contraseña.
- El acudiente escribe la contraseña (temporal o la que ya cambió).
- No pongas nunca la contraseña en la URL; solo en el mensaje de WhatsApp o en el formato digital (documento/PDF).

Así el “acceso directo” es solo a la pantalla correcta con su usuario; el factor de seguridad sigue siendo la contraseña. Si en el futuro quieres “magic link” (token de un solo uso), sería una decisión aparte con expiración corta (ej. 24 h).

### Decisiones críticas
- ¿Tu login actual acepta ya un parámetro de query para pre-rellenar usuario? Si no, es un cambio pequeño en la página de login.
- ¿El formato digital (PDF o vista web) muestra “usuario: ACU036” y “contraseña temporal: temporal123” y además un botón “Acceder” que lleva a esa URL? Eso unifica experiencia y seguridad.

### Próximos pasos
1. Implementar en la página de login: lectura de `user` o `username` en la URL y rellenado del campo.
2. En la plantilla de WhatsApp y en el formato digital: usar siempre el mismo formato de link (`?user=ACU036` o el que elijas).
3. Documentar que la contraseña temporal se comunica por canal seguro (WhatsApp/mail) y no en la URL.

---

## Resumen de decisiones críticas (confirmadas)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Modelo de cobro | **Cobro por estudiante-mes** con valor por defecto y excepciones (beca/valor custom). |
| 2 | Fecha / deuda | Desde **día 1** del mes ya hay deuda en el sistema. Pacto con padres: cancelar en **primeros 5 días**. |
| 3 | Estado y acumulación | Estado “pendiente / al día” por mes; **deuda total = meses pendientes + saldo histórico** (híbrido). |
| 4 | Cuándo se envía | **Cada semana** (4 veces al mes), al día siguiente de la sesión de entrenamiento; reemplaza lista en papel. |
| 5 | Admin | Vista acudientes/estudiantes × mes con estado, valor, “Al día”, filtros, saldo y **“Pendientes de pago”** para recordatorios. |
| 6 | WhatsApp | **Botón “Abrir WhatsApp”**: número y mensaje listos; solo pulsar enviar (costo cero). |
| 7 | Link seguro | Link a login con usuario en query; contraseña solo en mensaje/documento, nunca en URL. |

---

## Orden sugerido para implementación

1. **Modelo de datos** ✅ — Ver `scripts/crear_modulo_cobros_mensualidades.sql` y `MODULO_COBROS_MODELO_DATOS.md`.
2. **Reglas de negocio** ✅ — Ver `admin/admin.api.js` (CobrosAPI) y `MODULO_COBROS_REGLAS_NEGOCIO.md`.
3. **Admin** ✅ — Vista cobros + estados + saldo; acciones “Al día” y “Ajustar saldo”; vista **“Pendientes de pago”** (acudientes con deuda este mes) para los recordatorios semanales.
4. **Formato digital**: plantilla (nombre acudiente, estudiante(s), ciclo/mes, valor, link con `?user=...`, usuario y contraseña temporal).
5. **WhatsApp**: campo celular en acudientes + botón **“Abrir WhatsApp”** que abre `wa.me/57{celular}?text={mensaje}` con número y mensaje listos; solo pulsar enviar. Usado 4 veces al mes tras cada sesión.
6. **Login**: soporte de `?user=...` para pre-rellenar usuario.

Con esto tienes el mapa mental alineado con tu flujo real: cobro estudiante-mes, primeros 5 días de pacto, deuda = meses pendientes + saldo histórico, recordatorio semanal con botón WhatsApp (solo enviar).
