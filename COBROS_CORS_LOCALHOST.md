# Pestaña Saldos y CORS en localhost

## ¿Qué pasa?

Cuando abres el **Dashboard Administrativo** desde **localhost** (por ejemplo `http://127.0.0.1:5500`) y usas la pestaña **Cobros → Saldos** y pulsas **«Cargar saldos»**, el navegador puede bloquear la petición a Supabase y mostrar:

- En consola: `Access to fetch at '...supabase.co/...' has been blocked by CORS policy`
- En la tabla: mensaje indicando que no se pudo conectar con el servidor

**No es un error de SQL.** La consulta nunca llega al servidor; el navegador corta la petición por la política CORS (origen `127.0.0.1` no permitido por defecto en algunos proyectos de Supabase).

## Opciones para poder usar Saldos en desarrollo

1. **Servir la app desde el mismo dominio**  
   Despliega o sirve la app desde el mismo dominio que uses en producción (o el que tengas configurado en Supabase). Así no hay peticiones cross-origin desde localhost.

2. **Túnel (ngrok, etc.)**  
   Usa un túnel para exponer tu `127.0.0.1:5500` con una URL pública (por ejemplo `https://xxx.ngrok.io`). Abre la app por esa URL; a veces Supabase acepta mejor orígenes HTTPS públicos que `http://127.0.0.1:5500`.

3. **Configuración en Supabase (si existe)**  
   En el **Dashboard de Supabase** → tu proyecto → **Project Settings** → **API** (o **Authentication** → **URL Configuration**), revisa si hay opción para **allowed origins**, **CORS** o **Redirect URLs** y añade, si aplica:
   - `http://127.0.0.1:5500`
   - `http://localhost:5500`  
   (Según la versión del dashboard, esta opción puede no estar disponible.)

## Resumen

- El fallo es **CORS en el navegador**, no un error en las consultas SQL.
- Las pestañas **Parámetros** y **Estudiantes (Cobros)** pueden seguir fallando por CORS si también llaman a la API desde localhost; si en tu caso solo falla Saldos, es porque solo esa pestaña hace esa petición al hacer clic en «Cargar saldos».
- En un entorno desplegado (mismo dominio o origen permitido en Supabase), **«Cargar saldos»** debería funcionar sin cambios de código.
