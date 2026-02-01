# ¿De dónde saca la aplicación la información de acudientes e hijos?

## Respuesta corta

**Toda la app (admin y dashboard del acudiente) usa la misma tabla y la misma columna:** `acudientes` y `acudientes.estudiante_id`. No hay otra fuente en el código.

Si como administrador ves acudientes “reales” con sus hijos asociados, es porque en tu base de datos **esas filas** de `acudientes` tienen `estudiante_id` rellenado.

---

## Dónde se usa en el código

### 1. Admin (dashboard y gestionar-acudientes)

- **Tabla:** `acudientes`
- **Relación con el hijo:** columna `estudiante_id` → join con `usuarios`

Ejemplos:

- **admin.api.js** – listar acudientes:
  ```js
  params.append('select', '*,usuarios:estudiante_id(id,codigo_estudiante,nombre,apellidos,grado)');
  return await apiRequest(`${TABLES.ACUDIENTES}?${params.toString()}`);
  ```
- **gestionar-acudientes.html** – buscar y mostrar acudiente con hijos:
  ```js
  params.append('select', '*,estudiante:estudiante_id(id,codigo_estudiante,nombre,apellidos,grado)');
  ```
  Luego: `hijos: acudientes.map(a => a.estudiante).filter(Boolean)`.

Es decir: el admin lee filas de `acudientes` y, para cada fila, el “hijo” sale del join por `estudiante_id`. Si `estudiante_id` es null, ese hijo no aparece.

### 2. Dashboard del acudiente (guardian)

- **Tabla:** `acudientes`
- **Relación con el hijo:** misma columna `estudiante_id`

Al iniciar sesión:

- Se busca al acudiente en `acudientes` (por username o email) y se guarda en sesión **el `id` de esa fila** (`acudientes.id`).
- En el dashboard se llama a `AccesoGuardianAPI.obtenerEstudiantes(user.id)`.
- Esa API hace:
  - `acudientes?id=eq.${user.id}&activo=eq.true&select=*,estudiante:estudiante_id(...)`  
  o si no hay resultado:
  - `acudientes?email=eq.${user.email}&...`  
  - `acudientes?username=eq.${user.username}&...`
- Los “hijos” que ve el acudiente son: `acudientes?.map(a => a.estudiante).filter(Boolean)`.

De nuevo: los hijos vienen solo de las filas de `acudientes` que tienen `estudiante_id` no nulo.

---

## Por qué el admin “ve” vínculos y el SQL/script dice que “no están”

Son compatibles estas dos cosas:

1. **En el admin ves acudientes con hijos**  
   → Eso implica que **hay filas en `acudientes` con `estudiante_id` rellenado** (las que el admin está listando/mostrando).

2. **En SQL o con el script parece que “no están” o que “hay que asociarlos”**  
   → Eso puede referirse a **otras filas** de `acudientes` (mismo u otro email) que sí tienen `estudiante_id` en null.

Es decir: en la base puedes tener **varias filas por el mismo acudiente** (mismo email, o mismo username en otro momento):

- Algunas filas con `estudiante_id` rellenado (p. ej. creadas en una migración desde `usuarios` donde ya tenías `email_acudiente` + id del estudiante). Esas son las que el **admin** muestra con hijo asociado.
- Otras filas (p. ej. las que se usan para **login** por username/email) con `estudiante_id` en null. Esas son las que, cuando el acudiente entra a su dashboard, no muestran ningún hijo.

El admin lista **todas** las filas de `acudientes` (o las agrupa por email); el dashboard del acudiente usa **solo la fila con la que hizo login** (por `user.id` o `user.email`/`user.username`). Si esa fila tiene `estudiante_id` null, el acudiente ve “Sin estudiantes asociados” aunque en el admin sí aparezcan otras filas del mismo email con hijos.

---

## Cómo comprobarlo en tu base

En `scripts/` está el script **diagnostico_acudientes_vs_login.sql**. Ejecutando ese script puedes ver:

- Cuántas filas hay por email en `acudientes`.
- Cuáles tienen `estudiante_id` rellenado y cuáles no.
- Si el mismo email tiene unas filas “con hijo” (para el admin) y otras “sin hijo” (las que podrían usarse en el login y por eso el acudiente no ve hijos).

Así puedes ver exactamente de dónde sale lo que ves como administrador (filas con `estudiante_id` no nulo) y por qué el dashboard del acudiente a veces no muestra hijos (filas con `estudiante_id` null usadas en la sesión).
