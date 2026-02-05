# Resumen: por qué no podemos “consultar y ya” y por qué otros datos sí cargan

## 1. ¿Por qué no podemos “consultar y ya”?

**No es que hayamos cambiado cómo accedemos a la BD.** El código sigue siendo “hacer un `fetch` a Supabase y leer la respuesta”. Lo que pasa es:

- La petición **sí sale** del navegador y **sí llega** a Supabase.
- Supabase **sí responde** con los datos.
- Pero el **navegador** no te deja leer esa respuesta si el servidor no incluye una cabecera que diga: “este origen está permitido”.

Esa regla se llama **CORS**. Si Supabase no envía `Access-Control-Allow-Origin` para tu origen (por ejemplo `https://artifextsp.github.io` o `http://127.0.0.1:5500`), el navegador **bloquea** la respuesta y tu JavaScript nunca la ve. Por eso da la sensación de que “no podemos consultar”: en realidad sí consultamos, pero el navegador nos oculta la respuesta.

---

## 2. ¿Por qué “los demás datos sí se cargan”?

En Supabase hay **varias APIs**, y no todas aplican la misma política CORS:

| Lo que hace la app              | API que usa              | Qué pasa con CORS                    |
|--------------------------------|--------------------------|--------------------------------------|
| Login, sesión, “usuario actual”| **Auth** (auth.*.supabase.co) | Suele permitir muchos orígenes → **funciona** |
| Estudiantes, colegios, cobros, saldos, parámetros, etc. | **API REST** (`/rest/v1/...`) | En tu proyecto **no** envía la cabecera CORS para tu dominio → **el navegador bloquea** |

Por eso:

- **Login y sesión** suelen funcionar: usan Auth, que sí puede estar enviando las cabeceras CORS que el navegador pide.
- **Cargar saldos, cobros, parámetros, listados de la BD**, etc. usan la **API REST**. Esa API, en tu proyecto, no está diciendo “permito a `artifextsp.github.io`” ni a `127.0.0.1:5500`, así que el navegador bloquea esas respuestas.

No es que “solo Saldos” esté mal: **cualquier** petición a `/rest/v1/...` desde ese origen puede ser bloqueada. La diferencia es que Auth es otra API y sí puede estar permitiendo el origen.

---

## 3. ¿Por qué no "cambiamos la política CORS y ya"?

Porque **no está en tu mano**:

1. **En el dashboard de Supabase no existe la opción.** En versiones recientes (2024-2025), Supabase **ya no expone** la configuración CORS de la API REST en la interfaz. No hay pantalla de "Allowed origins" ni "Orígenes permitidos para la API REST" en Project Settings → API. Esa parte la controla Supabase y no la muestran en la UI.

2. **Incluso si existiera en PostgREST**, la API REST de Supabase pasa por un proxy (p. ej. Cloudflare). Hay reportes de que ese proxy **sobrescribe** las cabeceras CORS y puede forzar un comportamiento concreto, de modo que cambiar la configuración de PostgREST no siempre tiene efecto en lo que ve el navegador.

3. **Management API:** Existe una API de gestión de Supabase para configurar el proyecto. No está claro si permite tocar CORS de la REST API ni si está disponible para todos los planes; en cualquier caso no es "un checkbox en el dashboard".

Por eso la opción práctica es: **proxy** (tu servidor que sí envía las cabeceras CORS), **mismo dominio** (servir la app donde Supabase ya permita el origen) o **túnel** (ngrok, etc.) para pruebas.

---

## 4. ¿Por qué hace falta el proxy (y no “simplemente permitir” en Supabase)?

En el dashboard de Supabase **no suele haber** una opción clara tipo “Orígenes permitidos para la API REST”. Esa configuración la controla Supabase y en muchos proyectos no se puede cambiar desde la UI. Por eso no puedes “marcar un checkbox” y que la REST API acepte tu dominio.

**El proxy** es un servidor (por ejemplo en Vercel) que:

1. Recibe **tu** petición desde el navegador (desde tu página).
2. Responde con cabeceras que **sí** permiten tu origen → el navegador **no** bloquea.
3. En el servidor, el proxy hace **otra** petición a Supabase (servidor a servidor: ahí **no** hay CORS).
4. Supabase responde al proxy y el proxy te devuelve esos mismos datos a ti, ya con las cabeceras CORS correctas.

Así que **seguimos “consultando y ya”** a nivel lógico: tu código hace una sola petición (ahora al proxy en lugar de directo a Supabase). El proxy no cambia la lógica de negocio; solo actúa de intermediario para que el navegador no bloquee la respuesta.

---

## Resumen en tres frases

1. **No hemos complicado el acceso:** seguimos consultando la misma API; el navegador es el que bloquea la respuesta por CORS cuando Supabase no dice “origen permitido”.
2. **“Los demás datos sí cargan”** porque Auth (login/sesión) suele tener CORS permisivo; la **REST API** (tablas, cobros, saldos) en tu proyecto no, por eso esas peticiones son las que fallan.
3. **El proxy** no sustituye “consultar y ya”: hace la misma consulta por ti y devuelve la respuesta con las cabeceras que el navegador exige, para que tu código pueda seguir funcionando igual.
