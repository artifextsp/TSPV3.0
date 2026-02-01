# Módulo de cobros — Modelo de datos

Referencia técnica del paso 1: tablas y reglas de cálculo.

---

## Tablas creadas

| Tabla | Uso |
|-------|-----|
| **tarifas_mensuales** | Valor por defecto de la mensualidad (global o por grado). Una fila con `grado = NULL` = valor para todos. |
| **cobros_mensuales** | Un registro por **estudiante por mes**. Campos: estudiante_id, anio, mes, valor_base, valor_final, estado (pendiente \| al_dia \| exento), fecha_al_dia. |
| **saldos_acudiente** | Saldo arrastrado por acudiente. Key = **email** (único por persona). Campo: saldo_arrastrado (numeric). |

---

## Reglas de cálculo

- **Valor por estudiante-mes**: se toma de `tarifas_mensuales` (por grado si existe, si no el global). Beca = valor_final 0 y estado `exento`. Valor personalizado = override al crear el cobro.
- **Deuda total acudiente** = `saldo_arrastrado` (de `saldos_acudiente` por email) + suma de `valor_final` de todos los `cobros_mensuales` con `estado = 'pendiente'` de los estudiantes vinculados a ese acudiente (vía `acudientes.estudiante_id`).
- **“Al día”**: al marcar un cobro como `al_dia`, se actualiza `estado` y opcionalmente `fecha_al_dia`. Ese mes deja de sumar a la deuda.

---

## Relación con tablas existentes

- **cobros_mensuales.estudiante_id** → `usuarios.id` (estudiante).
- **acudientes** tiene una o más filas por “persona” (mismo email, distinto estudiante_id). El saldo es **por email** en `saldos_acudiente`.
- Para WhatsApp: usar **acudientes.celular** (o telefono_1 si es lo que usas). Si no existe la columna, añadirla (ver comentario en el script).

---

## Script

Ejecutar en Supabase SQL Editor:

- **scripts/crear_modulo_cobros_mensualidades.sql**

Después de ejecutar:

1. Ajustar en `tarifas_mensuales` el valor por defecto (el script inserta 0 para que no falle; poner el valor real).
2. Opcional: crear cobros del mes en curso para los estudiantes activos (eso puede ser un “Generar cobros del mes” en el admin o un job).

---

## Siguiente paso

Paso 2: **Reglas de negocio** en la app (cómo se obtiene el valor por estudiante-mes desde tarifas, cómo se genera el listado “Pendientes de pago”, y acción “Al día”).
