/**
 * Netlify Function — Wikipedia Aircraft Image Proxy
 * Handles /wiki/aircraft-image
 */

export default async (req, context) => {
  const url = new URL(req.url);

  try {
    const q = url.searchParams.get('q') || '';
    if (!q) {
      return new Response(JSON.stringify({ url: null, photos: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Search Wikipedia for the aircraft image
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(q)}`;
    const r = await fetch(wikiUrl, { headers: { 'User-Agent': 'Track24/1.0' } });
    const data = await r.json();

    let imgUrl = null;
    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages);
      if (pages.length > 0 && pages[0].original) {
        imgUrl = pages[0].original.source;
      }
    }

    return new Response(JSON.stringify({
      url: imgUrl,
      credit: imgUrl ? 'Wikipedia' : null,
      photos: imgUrl ? [{ url: imgUrl, credit: 'Wikipedia', source: 'Wikipedia' }] : []
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ url: null, credit: null, photos: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = {
  path: ["/wiki/*"]
};
