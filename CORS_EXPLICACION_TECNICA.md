# Situación técnica: CORS y acceso a la base de datos

## Por qué “no podemos consultar y ya”

No es que hayamos cambiado la forma de acceder a la BD. Sigue siendo la misma: el frontend hace `fetch` a la API REST de Supabase (`/rest/v1/usuarios`, etc.). Lo que pasa es que **el navegador** bloquea la respuesta cuando Supabase no dice explícitamente que tu origen está permitido. Eso es CORS.

---

## Qué es CORS en una frase

**CORS (Cross-Origin Resource Sharing)** es una regla del navegador:  
“Solo dejo que este JavaScript lea la respuesta si el servidor dice en cabeceras que el origen de esta página está permitido.”

- **Origen:** de dónde se sirve la página (ej. `https://artifextsp.github.io` o `http://127.0.0.1:5500`).
- Si la página está en **origen A** y hace `fetch` a **origen B** (ej. Supabase), el navegador pide a B: “¿A está permitido?”.
- Si B **no** envía una cabecera tipo `Access-Control-Allow-Origin: A` (o `*`), el navegador **no** entrega la respuesta a tu código: ves “blocked by CORS” y “Failed to fetch”.
- La petición puede llegar al servidor, pero **tu JavaScript nunca ve la respuesta**. Por eso “no podemos consultar y ya”: no es que no consultemos, es que el navegador nos oculta la respuesta.

---

## Por qué “los demás datos sí se cargan”

En Supabase hay **varias APIs** detrás de dominios/rutas distintas. No todas tienen la misma política CORS.

| Qué hace la app | API que usa | Qué suele pasar |
|-----------------|-------------|------------------|
| Login, “Usuario recuperado”, sesión | **Supabase Auth** (auth.*.supabase.co o similar) | Suele enviar cabeceras CORS que permiten muchos orígenes → **no bloquea**. |
| Listar estudiantes, colegios, cobros, saldos, etc. | **API REST / PostgREST** (`/rest/v1/usuarios`, `/rest/v1/parametros_cobro`, etc.) | En tu proyecto **no** está enviando `Access-Control-Allow-Origin` para tu dominio → **el navegador bloquea**. |

Por eso:

- **“Los demás datos sí se cargan”** puede ser porque:
  1. **Auth** (login, recuperar usuario) sí permite tu origen → eso funciona.
  2. O estás viendo **UI/caché** sin haber recargado desde GitHub Pages pestañas que también usan la REST API (Estudiantes, Colegios, Cobros, etc.). Si recargas y pulsas “Cargar” en esas pestañas, es muy posible que también fallen con CORS.
- **Saldos (y todo lo que use `/rest/v1/...`)** falla porque esa API REST, en tu proyecto, **no** está diciendo “permito a `https://artifextsp.github.io`” (ni a `http://127.0.0.1:5500`).

Es decir: no es que “solo Saldos” esté mal; es que **toda** petición a la **REST API** desde ese origen puede estar siendo bloqueada por CORS. La diferencia es que Auth es otra API y sí puede estar permitiendo el origen.

---

## Por qué no “simplemente permitir” en Supabase

En el **dashboard de Supabase** (Authentication → URL Configuration, Project Settings → API, etc.) no aparece en muchos proyectos una opción tipo “Allowed origins for REST API”. Esa configuración depende de Supabase (y a veces no se expone por UI). Por eso no puedes “simplemente marcar un checkbox” y que la REST API empiece a aceptar tu dominio.

Mientras Supabase no envíe `Access-Control-Allow-Origin` para tu origen en las respuestas de `/rest/v1/...`, el navegador seguirá bloqueando **cualquier** consulta a la BD desde ese origen, por mucho que tu código siga siendo “consultar y ya”.

---

## Qué hace el proxy (y por qué sí “podemos consultar” con él)

- **Sin proxy:**  
  Navegador (artifextsp.github.io) → `fetch` a Supabase → Supabase responde **sin** la cabecera CORS que el navegador exige → el navegador bloquea y tu código no ve la respuesta.

- **Con proxy:**  
  1. Navegador (artifextsp.github.io) → `fetch` a **tu proxy** (ej. en Vercel).  
  2. El proxy responde con cabeceras que **sí** permiten tu origen (o `*`).  
  3. El navegador acepta y entrega esa respuesta a tu JavaScript.  
  4. El proxy, en el servidor, hace otra petición a Supabase (servidor a servidor: ahí **no** hay CORS).  
  5. Supabase responde al proxy; el proxy te devuelve esos mismos datos a ti, ya con CORS “correcto”.

Así que **seguimos “consultando y ya”** a nivel lógico: tu código sigue haciendo una sola petición (ahora al proxy en lugar de a Supabase). La diferencia es que esa única petición va a un servidor (el proxy) que sí devuelve las cabeceras CORS que el navegador exige, y ese servidor es el que hace la consulta real a la BD por ti.

---

## Resumen en tres puntos

1. **No hemos complicado el acceso a la BD:** seguimos consultando la misma API (REST de Supabase). Lo que cambia es que, desde GitHub Pages (o localhost), el navegador bloquea la respuesta por CORS.
2. **“Los demás datos sí cargan”** encaja con que Auth tenga CORS permisivo y la **REST API** no; o con que no hayas forzado recargas de otras pestañas que también usan `/rest/v1/...`. En cuanto uses cualquier cosa que dependa de la REST API desde ese origen, puede fallar igual.
3. **El proxy no sustituye “consultar y ya”:** es un intermediario que hace la misma consulta por ti y devuelve la respuesta con las cabeceras que el navegador exige, para que tu código pueda seguir “consultando y ya” desde la página.

Si quieres, el siguiente paso puede ser revisar juntos qué rutas usan Auth y cuáles usan REST para que veas exactamente qué peticiones pueden estar bloqueadas por CORS en tu caso.
