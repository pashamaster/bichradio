/**
 * bichradio counter — Cloudflare Worker + KV
 *
 * Stores visit counter in Cloudflare KV (no GitHub, no tokens).
 * KV namespace is bound in wrangler.toml as COUNTER_KV.
 *
 * Endpoints:
 *   GET  /count     → { count: 42 }
 *   POST /increment → { count: 43 }
 *   OPTIONS /*      → CORS preflight
 */

const KV_KEY = 'total_visits';

// ── Allowed origins ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://bichradio.com',
  'https://www.bichradio.com',
  'https://pashamaster.github.io',
];

function corsHeaders(request) {
  const origin      = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400',
    'Content-Type':                 'application/json',
  };
}

// ── KV helpers ───────────────────────────────────────────────
async function getCount(env) {
  const val = await env.COUNTER_KV.get(KV_KEY);
  return val ? parseInt(val, 10) : 0;
}

async function setCount(env, count) {
  await env.COUNTER_KV.put(KV_KEY, String(count));
}

// ── Worker ───────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'GET' && url.pathname === '/count') {
      const count = await getCount(env);
      return Response.json({ count }, { headers: cors });
    }

    if (request.method === 'POST' && url.pathname === '/increment') {
      const current  = await getCount(env);
      const newCount = current + 1;
      await setCount(env, newCount);
      return Response.json({ count: newCount }, { headers: cors });
    }

    return new Response('Not found', { status: 404, headers: cors });
  }
};
