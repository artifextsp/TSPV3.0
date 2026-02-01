# Módulo de cobros — Reglas de negocio (paso 2)

Reglas implementadas en la API de cobros y cómo usarlas desde el admin.

---

## 1. Valor mensual por estudiante

- **Origen**: tabla `tarifas_mensuales`.
- **Regla**: se busca primero tarifa por **grado** del estudiante; si no hay fila para ese grado, se usa la tarifa con `grado = NULL` (valor por defecto).
- **API**: `CobrosAPI.getValorMensual(estudiante)` — recibe `{ id, grado }` y devuelve el valor (número).
- **Beca / exento**: al generar cobros se usa siempre la tarifa. Para becados hay que crear el cobro con `valor_final = 0` y `estado = 'exento'` (o no generarlo y tratarlo en la vista). Opcional: ampliar `generarCobrosDelMes` para excluir estudiantes marcados como becados en otra tabla/campo.

---

## 2. Generar cobros del mes

- **Regla**: para un mes/año dados, se crea **un registro en `cobros_mensuales` por cada estudiante activo** (usuarios con `codigo_estudiante` tipo EST y `activo = true`) que **aún no tenga** cobro para ese mes.
- **Valor**: el de la tarifa (por grado o por defecto). Estado inicial: `pendiente`.
- **API**: `CobrosAPI.generarCobrosDelMes(anio, mes)` — devuelve `{ generados, mensaje }`.
- **Uso**: al inicio del mes (o cuando quieras) el admin ejecuta “Generar cobros del mes” para el mes actual (o un mes concreto). No duplica: si ya existe cobro para ese estudiante-mes, no inserta otro.

---

## 3. Marcar “Al día”

- **Regla**: al marcar un cobro como pagado, se actualiza `estado` a `al_dia` y se guarda `fecha_al_dia`. Ese mes deja de sumar a la deuda del acudiente.
- **API**: `CobrosAPI.marcarAlDia(cobroId)` — recibe el UUID del registro en `cobros_mensuales`.

---

## 4. Deuda total acudiente

- **Fórmula**: **deuda total = saldo_arrastrado + suma(valor_final de cobros con estado = 'pendiente' de sus estudiantes)**.
- **Saldo arrastrado**: por email del acudiente en `saldos_acudiente`. Un solo valor por “persona” (email).
- **API**: no hay un solo método “deuda total”; se usa `CobrosAPI.listarPendientesDePago()` que ya devuelve por acudiente: `deudaMeses`, `saldoArrastrado`, `deudaTotal`.

---

## 5. Listar pendientes de pago (recordatorio WhatsApp)

- **Regla**: acudientes activos que tengan **deuda total > 0** (saldo arrastrado + cobros pendientes de sus hijos). Se agrupa por **email** (un acudiente puede tener varias filas en `acudientes` por varios hijos).
- **API**: `CobrosAPI.listarPendientesDePago()` — devuelve array de:
  - `email`, `username`, `nombreCompleto`, `celular`
  - `estudiantes`: `[{ id, codigo_estudiante, nombre }]`
  - `deudaMeses`, `saldoArrastrado`, `deudaTotal`
- **Uso**: vista “Pendientes de pago” en el admin y botón “Abrir WhatsApp” por fila (paso siguiente: formato del mensaje y link).

---

## 6. Cobros de un periodo (grilla admin)

- **API**: `CobrosAPI.getCobrosDelPeriodo(anio, mes)` — devuelve los registros de `cobros_mensuales` de ese mes con datos del estudiante (id, codigo_estudiante, nombre, apellidos, grado). Sirve para mostrar la grilla mes × estudiantes y el botón “Al día” por cobro.

---

## 7. Ajustar saldo arrastrado

- **Regla**: el saldo es manual (deudas antiguas, acuerdos). Se identifica al acudiente por **email**.
- **API**: `CobrosAPI.actualizarSaldoArrastrado(email, saldoArrastrado)` — hace upsert en `saldos_acudiente`. Si no existe fila para ese email, la crea; si existe, actualiza.

---

## Resumen de llamadas para el admin

| Acción | API |
|--------|-----|
| Generar cobros del mes | `CobrosAPI.generarCobrosDelMes(anio, mes)` |
| Ver cobros del mes (grilla) | `CobrosAPI.getCobrosDelPeriodo(anio, mes)` |
| Marcar cobro como pagado | `CobrosAPI.marcarAlDia(cobroId)` |
| Ver pendientes de pago (WhatsApp) | `CobrosAPI.listarPendientesDePago()` |
| Ajustar saldo de un acudiente | `CobrosAPI.actualizarSaldoArrastrado(email, valor)` |
| Tarifa por defecto | `CobrosAPI.getTarifaDefault()` |

---

## Siguiente paso

Paso 3: **Vista admin** (pestaña o página Cobros / Mensualidades) con:
- Selector mes/año.
- Botón “Generar cobros del mes”.
- Grilla de cobros del periodo con “Al día”.
- Vista “Pendientes de pago” con botón “Abrir WhatsApp” (mensaje + número listos).
