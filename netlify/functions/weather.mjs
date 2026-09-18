/**
 * Netlify Function — Weather Proxy
 * Handles /weather/radar, /weather/metar, /weather/taf, /weather/wind, /weather/storms
 */

const WX_UA = { 'User-Agent': 'Track24/1.0 (flight-tracker)' };

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(\.netlify\/functions\/weather\/|weather\/)/, '');
  const route = path.split('/')[0] || path;

  try {
    let data;

    if (route === 'radar') {
      const r = await fetch('https://api.rainviewer.com/public/weather-maps.json', { headers: WX_UA });
      data = await r.json();

    } else if (route === 'metar') {
      const ids = url.searchParams.get('ids') || '';
      const r = await fetch(`https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`, { headers: WX_UA });
      data = await r.json();

    } else if (route === 'taf') {
      const ids = url.searchParams.get('ids') || '';
      const r = await fetch(`https://aviationweather.gov/api/data/taf?ids=${ids}&format=json`, { headers: WX_UA });
      data = await r.json();

    } else if (route === 'wind') {
      const lat = url.searchParams.get('lat');
      const lng = url.searchParams.get('lng');
      const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,wind_speed_180m,wind_direction_180m&windspeed_unit=kn`;
      const r = await fetch(windUrl, { headers: WX_UA });
      data = await r.json();

    } else if (route === 'storms') {
      try {
        const r = await fetch('https://www.nhc.noaa.gov/CurrentSurges.json', { headers: WX_UA });
        if (!r.ok) {
          const r2 = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { headers: WX_UA });
          data = await r2.json();
        } else {
          data = await r.json();
        }
      } catch {
        data = { activeStorms: [] };
      }

    } else {
      return new Response(JSON.stringify({ error: 'Unknown weather route' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30'
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
  path: ["/weather/*"]
};
