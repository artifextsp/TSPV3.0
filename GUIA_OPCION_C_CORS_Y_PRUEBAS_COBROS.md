# Guía: Opción C (CORS en Supabase) y pruebas del módulo Cobros

## Parte 1 — Implementar la opción C (orígenes permitidos en Supabase)

### Paso 1: Entrar al Dashboard de Supabase

1. Abre **https://supabase.com/dashboard** e inicia sesión.
2. Selecciona tu **proyecto** (el que usa la URL `https://rxqiimwqlisnurgmtmtw.supabase.co`).

---

### Paso 2: Revisar Project Settings → API

1. En el menú izquierdo, haz clic en el **icono de engranaje** (⚙️) para abrir **Project Settings**.
2. En el submenú, entra a **API** (o **API Keys** / **Settings → API**).
3. Revisa si aparece alguna de estas opciones:
   - **Allowed origins**
   - **CORS**
   - **Additional allowed origins**
   - **API CORS / Origins**
4. **Si existe** un campo para orígenes permitidos:
   - Añade (uno por línea o separados por coma, según el formato):
     - `http://127.0.0.1:5500`
     - `http://localhost:5500`
   - Guarda los cambios.
5. **Si no existe** ninguna opción de CORS u orígenes en API:
   - En muchos proyectos de Supabase la API REST ya acepta cualquier origen; en ese caso el problema puede ser otro (red, extensión, etc.). Sigue con el Paso 3 por si ayuda en tu caso.

---

### Paso 3: Revisar Authentication → URL Configuration

Aunque esta sección es sobre **redirección de login**, en algunos entornos puede influir; conviene tener localhost permitido.

1. En el menú izquierdo: **Authentication**.
2. Entra a **URL Configuration** (o **Configuration**).
3. Revisa:
   - **Site URL:** puede quedar en `http://localhost:3000` o cambiarla temporalmente a `http://127.0.0.1:5500` para pruebas.
   - **Redirect URLs:** si hay una lista de “Additional Redirect URLs” o “Redirect URLs”, añade:
     - `http://127.0.0.1:5500`
     - `http://127.0.0.1:5500/**`
     - `http://localhost:5500`
4. Guarda los cambios.

---

### Paso 4: Probar de nuevo

1. Cierra por completo la pestaña del **Dashboard Administrativo** (o cierra el navegador).
2. Vuelve a abrir la app en **http://127.0.0.1:5500** (o la URL que uses).
3. Ve a **Cobros / Mensualidades → Saldos** y pulsa **«Cargar saldos»**.
4. Revisa la consola (F12 → Console):
   - Si ya **no** aparece el error de CORS y la tabla se llena, la opción C funcionó.
   - Si **sigue** el error de CORS, es posible que tu versión del dashboard no exponga CORS para la API REST; en ese caso usa **Opción A** (mismo dominio) o **Opción B** (túnel, p. ej. ngrok).

---

### Importante: URL Configuration ≠ CORS de la API REST

**Authentication → URL Configuration** (Site URL y Redirect URLs) sirve solo para **redirecciones después del login**. No controla las peticiones a la **API REST** (`/rest/v1/...`). Por eso, aunque tengas `http://127.0.0.1:5500` ahí, el CORS puede seguir: el bloqueo lo decide la capa que atiende la API REST, no esta pantalla.

### Si CORS sigue después de configurar URLs (Opción B: ngrok)

Si ya configuraste Site URL y Redirect URLs y el error de CORS **sigue** al usar «Cargar saldos», usa un túnel para acceder a la app por una URL pública:

- **Opción A:** Sirve la app desde el mismo dominio donde esté publicada (donde Supabase sí permita el origen).
- **Opción B — ngrok (recomendado para probar en local):**
  1. Instala ngrok: https://ngrok.com/download (o `brew install ngrok` en Mac).
  2. Con tu app corriendo en el puerto 5500, en una terminal ejecuta: `ngrok http 5500`
  3. ngrok mostrará una URL pública, por ejemplo: `https://abc123.ngrok-free.app`
  4. Abre **esa URL** en el navegador (no `http://127.0.0.1:5500`).
  5. Inicia sesión en el Dashboard y ve a **Cobros → Saldos → Cargar saldos**. Las peticiones salen desde el origen de ngrok, que suele ser aceptado por Supabase.

---

## Parte 2 — Probar el módulo Cobros completo

Cuando **Cargar saldos** funcione (o si ya usas un dominio/túnel donde no haya CORS), sigue esta checklist para probar todo el módulo.

### 1. Parámetros

- [ ] Abre **Cobros / Mensualidades → Parámetros**.
- [ ] **Valor base mensualidad:** pon por ejemplo `40000` y guarda.
- [ ] **URL plataforma** y **links de video:** rellena si los usas.
- [ ] **Mensaje WhatsApp:** comprueba que se vea la plantilla (resultados primero, info adicional al final).
- [ ] Pulsa **«Guardar parámetros»** y verifica que no haya error en consola.

### 2. Saldos

- [ ] Ve a **Cobros / Mensualidades → Saldos**.
- [ ] Pulsa **«Cargar saldos»**.
- [ ] Debe cargar la tabla de estudiantes con **Saldo** y **% Beca** (por defecto 0).
- [ ] Cambia saldo o % beca de un estudiante y pulsa **«Guardar»** en esa fila.
- [ ] Vuelve a **Cargar saldos** y comprueba que los valores se hayan guardado.

### 3. Estudiantes (cobros del mes)

- [ ] Ve a **Cobros / Mensualidades → Estudiantes**.
- [ ] Elige **Mes:** Febrero y **Año:** 2026 (o el mes actual).
- [ ] Pulsa **«Generar cobros del mes»** (con valor base 40000 en Parámetros).
- [ ] Debe mostrar mensaje de cobros creados o actualizados (incluidos los que estaban en 0).
- [ ] Pulsa **«Cargar cobros»**.
- [ ] La tabla debe mostrar estudiantes con **Valor** distinto de 0 (p. ej. 40000 o valor con beca/saldo).
- [ ] Prueba **«Recalcular y guardar valores»**: vuelve a cargar y comprueba que los valores sigan correctos.
- [ ] En una fila, pulsa **WhatsApp**: debe abrir WhatsApp con el mensaje rellenado (nombre acudiente, estudiante, valor, etc.).
- [ ] Prueba **«Al día»** en una fila y comprueba que el estado pase a “Al día”.

### 4. Consola

- [ ] Con el módulo en uso, abre F12 → **Console**.
- [ ] No debe aparecer el error de CORS al usar **Cargar saldos** ni al cargar cobros.
- [ ] Errores de **favicon** o de extensiones (“listener indicated…”) se pueden ignorar si el resto funciona.

---

## Resumen

- **Opción C:** Revisar **Project Settings → API** y **Authentication → URL Configuration** en Supabase; si hay “orígenes permitidos” o “CORS”, añadir `http://127.0.0.1:5500` y `http://localhost:5500`, guardar y probar de nuevo **Cargar saldos**.
- Si no hay opción CORS para la API, usar mismo dominio o túnel (ngrok) y seguir la checklist de **Parte 2** para probar Parámetros, Saldos y Estudiantes (cobros, WhatsApp, Recalcular, Al día).
