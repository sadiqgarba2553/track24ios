/**
 * Netlify Function — Image Upload (stub)
 * On serverless, we can't persist uploads to disk.
 * Returns a success response but notes the limitation.
 */

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return new Response('', {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }
    });
  }

  try {
    const body = await req.json();
    const { aircraft, livery, credit, image } = body;

    if (!aircraft || !livery || !image) {
      return new Response(JSON.stringify({ error: 'Missing aircraft, livery, or image' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // In serverless, we can't write to disk. Return a success with a note.
    return new Response(JSON.stringify({
      success: true,
      message: 'Photo received! Serverless deployment does not persist uploads — use a cloud storage backend for production.',
      url: null,
      credit: credit || ''
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = {
  path: ["/upload-aircraft-image"]
};
