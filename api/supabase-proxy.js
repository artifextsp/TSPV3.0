/**
 * Proxy CORS para la API REST de Supabase.
 * Uso: despliega esta carpeta en Vercel (o compatible) y configura
 * SUPABASE_URL y SUPABASE_ANON_KEY en las variables de entorno.
 * Luego en config/supabase.config.js define API_PROXY_URL con la URL del proxy.
 */

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowOrigin = origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'apikey, Authorization, Content-Type, Prefer');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.query.path;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing query parameter: path' });
  }

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) {
    return res.status(500).json({
      error: 'Proxy misconfigured: set SUPABASE_URL and SUPABASE_ANON_KEY in environment'
    });
  }

  const url = `${base.replace(/\/$/, '')}/rest/v1/${path}`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`
  };
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  if (req.headers['prefer']) headers['Prefer'] = req.headers['prefer'];

  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body
    });
    const text = await response.text();
    const contentType = response.headers.get('Content-Type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.status(response.status).send(text);
  } catch (e) {
    res.status(502).json({ error: 'Proxy fetch failed', message: String(e.message) });
  }
}
