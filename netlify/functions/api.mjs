/**
 * Netlify Function — Generic IF API Proxy
 * Handles all /api/* routes
 */

const IF_BASE = 'https://api.infiniteflight.com/public/v2';
const API_KEY = '06m3se09gr6l4lwdwumbt512bshbuivc';

export default async (req, context) => {
  const url = new URL(req.url);
  // Extract the path after /api/
  const endpoint = url.pathname.replace(/^\/(\.netlify\/functions\/api\/|api\/)/, '');

  const queryParams = new URLSearchParams(url.searchParams);
  queryParams.set('apikey', API_KEY);
  const ifUrl = `${IF_BASE}/${endpoint}?${queryParams.toString()}`;

  try {
    const opts = { headers: { Accept: 'application/json' } };
    if (req.method === 'POST') {
      opts.method = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.body = await req.text();
    }

    const r = await fetch(ifUrl, opts);
    const data = await r.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = {
  path: ["/api/*"]
};
