# Proxy CORS para Supabase (solución cuando CORS bloquea en GitHub Pages / producción)

Si la app en **https://artifextsp.github.io** (o en otro dominio) recibe errores de CORS al llamar a la API de Supabase, puedes usar un **proxy** que recibe las peticiones desde tu dominio y las reenvía a Supabase, devolviendo la respuesta con cabeceras CORS correctas.

## 1. Desplegar el proxy en Vercel (recomendado)

Tienes dos formas de tener el proxy en Vercel:

### Opción A: Conectar el repo de GitHub a Vercel (recomendado)

1. Crea una cuenta en **https://vercel.com** (gratis).
2. En Vercel: **Add New** → **Project** → **Import** el repositorio de GitHub (artifextsp/TSPV3.0 o el que uses).
3. Deja el directorio raíz y **Deploy**. Vercel detectará la carpeta `api/` y desplegará la función.
4. Tras el despliegue, la URL del proxy será: **`https://[nombre-del-proyecto].vercel.app/api/supabase-proxy`** (sustituye por la URL que te asigne Vercel).

### Opción B: Desplegar con la CLI desde tu máquina

1. Instala la CLI: `npm i -g vercel` (o usa `npx vercel`).
2. Desde la raíz del proyecto TSP: `vercel`.
3. Cuando pregunte por el directorio, indica la raíz (`.`). Vercel usará la carpeta `api/` automáticamente.

**O** despliega solo la API desde la raíz (Vercel usa la carpeta `api` automáticamente en proyectos con esa estructura).

### Paso 3: Variables de entorno en Vercel

1. En el dashboard de Vercel → tu proyecto → **Settings** → **Environment Variables**.
2. Añade:
   - **SUPABASE_URL:** `https://rxqiimwqlisnurgmtmtw.supabase.co`
   - **SUPABASE_ANON_KEY:** tu anon key (la misma que en `config/supabase.config.js`)
3. Guarda y **redeploy** el proyecto para que las variables se apliquen.

### Paso 4: URL del proxy

Tras el despliegue, Vercel te dará una URL como:

- `https://tu-proyecto.vercel.app/api/supabase-proxy`

Esa es la URL que usarás como proxy.

---

## 2. Configurar la app para usar el proxy

En **config/supabase.config.js**, define `API_PROXY_URL` con la URL del proxy (sin barra final):

```javascript
const CONFIG = {
  // ... resto igual ...
  API_PROXY_URL: 'https://tu-proyecto.vercel.app/api/supabase-proxy'
};
```

Guarda, sube los cambios a GitHub y espera a que GitHub Pages se actualice (o recarga la app en producción). A partir de ahí, las peticiones a la API REST de Supabase pasarán por el proxy y no deberían ser bloqueadas por CORS.

---

## 3. Comprobar que funciona

1. Abre la app en **https://artifextsp.github.io** (o tu URL de producción).
2. Entra al **Dashboard Administrativo** → **Cobros / Mensualidades** → **Saldos**.
3. Pulsa **«Cargar saldos»**.
4. Si la tabla se llena y en la consola (F12) no aparece el error de CORS, el proxy está funcionando.

---

## 4. Seguridad

- El proxy solo reenvía peticiones a Supabase usando tu **anon key** (la misma que ya usa el frontend).
- La anon key está pensada para usarse en el navegador; RLS en Supabase sigue protegiendo los datos.
- No pongas la **service_role** key en el proxy si no es necesario; con la anon key basta para lo que hace el dashboard.

---

## 5. Si no usas Vercel

Puedes usar la misma lógica en:

- **Netlify Functions:** crea una función que reciba `path` por query, reenvíe a `SUPABASE_URL/rest/v1/{path}` con la anon key y devuelva la respuesta con cabeceras CORS.
- **Cloudflare Workers:** mismo esquema (recibir path, reenviar a Supabase, devolver con CORS).

El código en `api/supabase-proxy.js` es el que hace de proxy; solo hay que adaptarlo al formato de handler de cada plataforma si cambias de Vercel.
