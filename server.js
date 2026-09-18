/**
 * Track 24 — Proxy Server
 * Forwards requests to the Infinite Flight API with CORS headers.
 * Compatible with Express 5 / path-to-regexp v8+
 */

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app     = express();
const PORT    = 3000;
const IF_BASE = 'https://api.infiniteflight.com/public/v2';
const API_KEY = '06m3se09gr6l4lwdwumbt512bshbuivc';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files (the frontend)
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data directories and JSON store setup (handles Vercel read-only filesystem)
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp/data' : path.join(__dirname, 'data');
const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {}

const imagesDbPath = path.join(dataDir, 'aircraft_images.json');
try {
  if (!fs.existsSync(imagesDbPath)) {
    fs.writeFileSync(imagesDbPath, JSON.stringify([]));
  }
} catch (e) {}

// ── Weather proxy routes (CORS bypass) ────────────────────────
const WX_UA = { 'User-Agent': 'Track24/1.0 (flight-tracker)' };

app.get('/weather/radar', async (req, res) => {
  try {
    const r = await fetch('https://api.rainviewer.com/public/weather-maps.json', { headers: WX_UA });
    res.json(await r.json());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/weather/metar', async (req, res) => {
  try {
    const ids = req.query.ids || '';
    const r = await fetch(`https://aviationweather.gov/api/data/metar?ids=${ids}&format=json`, { headers: WX_UA });
    res.json(await r.json());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/weather/taf', async (req, res) => {
  try {
    const ids = req.query.ids || '';
    const r = await fetch(`https://aviationweather.gov/api/data/taf?ids=${ids}&format=json`, { headers: WX_UA });
    res.json(await r.json());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/weather/wind', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,wind_speed_180m,wind_direction_180m&windspeed_unit=kn`;
    const r = await fetch(url, { headers: WX_UA });
    res.json(await r.json());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/weather/storms', async (req, res) => {
  try {
    const r = await fetch('https://www.nhc.noaa.gov/CurrentSurges.json', { headers: WX_UA });
    // NHC may return empty if no active storms; also try CurrentStorms
    if (!r.ok) {
      const r2 = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { headers: WX_UA });
      res.json(await r2.json());
    } else {
      res.json(await r.json());
    }
  } catch (e) {
    // Return empty storms array on failure — this is normal outside hurricane season
    res.json({ activeStorms: [] });
  }
});

// ── Wikipedia & Spotter Image Proxy ───────────────────────────
const wikiCache = {};

app.get('/wiki/aircraft-image', async (req, res) => {
  try {
    const q = req.query.q || '';
    const exact = req.query.exact || q;
    const livery = req.query.livery || '';
    if (!q && !exact) return res.json({ url: null, photos: [] });
    
    // Check local store first
    let localImages = [];
    try {
      localImages = JSON.parse(fs.readFileSync(imagesDbPath, 'utf8'));
    } catch (e) {}
    
    const exactNorm = (exact || '').trim().toLowerCase();
    const liveryNorm = (livery || '').trim().toLowerCase();
    
    // 1. Exact match on aircraft AND livery (approved or non-rejected)
    const matchingPhotos = localImages.filter(img => {
      if (img.status === 'rejected') return false;
      const aNorm = (img.aircraft || '').trim().toLowerCase();
      const lNorm = (img.livery || '').trim().toLowerCase();
      return aNorm === exactNorm && (!liveryNorm || lNorm === liveryNorm);
    });

    // 2. Fallback: match aircraft type if no exact livery photo found
    const aircraftFallbackPhotos = matchingPhotos.length > 0 ? [] : localImages.filter(img => {
      if (img.status === 'rejected') return false;
      const aNorm = (img.aircraft || '').trim().toLowerCase();
      return aNorm === exactNorm;
    });

    const localList = matchingPhotos.length > 0 ? matchingPhotos : aircraftFallbackPhotos;

    if (localList.length > 0) {
      const photos = localList.map(img => ({
        url: img.url,
        credit: img.credit || 'Spotter Community',
        livery: img.livery || livery,
        aircraft: img.aircraft || exact
      }));

      return res.json({
        url: photos[0].url,
        credit: photos[0].credit,
        photos: photos
      });
    }
    
    if (wikiCache[q] !== undefined) {
      const wUrl = wikiCache[q];
      return res.json({
        url: wUrl,
        credit: wUrl ? 'Wikipedia' : null,
        photos: wUrl ? [{ url: wUrl, credit: 'Wikipedia', source: 'Wikipedia' }] : []
      });
    }
    
    // Attempt to search Wikipedia for this string and get page image
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Track24/1.0' } });
    const data = await r.json();
    
    let imgUrl = null;
    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages);
      if (pages.length > 0 && pages[0].original) {
        imgUrl = pages[0].original.source;
      }
    }
    
    wikiCache[q] = imgUrl;
    res.json({
      url: imgUrl,
      credit: imgUrl ? 'Wikipedia' : null,
      photos: imgUrl ? [{ url: imgUrl, credit: 'Wikipedia', source: 'Wikipedia' }] : []
    });
  } catch (e) {
    res.json({ url: null, credit: null, photos: [] });
  }
});

// ── Image Upload & Admin ──────────────────────────────────────
app.post('/upload-aircraft-image', (req, res) => {
  try {
    const { aircraft, livery, credit, image } = req.body;
    if (!aircraft || !livery || !image) return res.status(400).json({ error: 'Missing aircraft, livery, or image' });

    // Ensure it's a base64 image
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeAircraft = aircraft.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeLivery = livery.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${Date.now()}_${safeAircraft}_${safeLivery}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    let images = [];
    try { images = JSON.parse(fs.readFileSync(imagesDbPath, 'utf8')); } catch (e) {}
    const newEntry = {
      id: Date.now().toString(),
      aircraft: aircraft,
      livery: livery,
      credit: credit || '',
      url: `/uploads/${filename}`,
      status: 'approved', // Immediately live for the user
      timestamp: Date.now()
    };
    images.push(newEntry);
    fs.writeFileSync(imagesDbPath, JSON.stringify(images, null, 2));

    res.json({
      success: true,
      message: 'Photo uploaded successfully! It is now live.',
      url: newEntry.url,
      credit: newEntry.credit
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/admin/images', (req, res) => {
  try {
    const images = JSON.parse(fs.readFileSync(imagesDbPath, 'utf8'));
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/admin/approve-image', (req, res) => {
  try {
    const { id } = req.body;
    let images = JSON.parse(fs.readFileSync(imagesDbPath, 'utf8'));
    
    const target = images.find(img => img.id === id);
    if (!target) return res.status(404).json({ error: 'Image not found' });
    
    // Un-approve any other images for the exact same aircraft AND livery
    images.forEach(img => {
      if (img.aircraft === target.aircraft && img.livery === target.livery && img.status === 'approved') {
        img.status = 'rejected';
      }
    });
    
    target.status = 'approved';
    fs.writeFileSync(imagesDbPath, JSON.stringify(images, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/admin/reject-image', (req, res) => {
  try {
    const { id } = req.body;
    let images = JSON.parse(fs.readFileSync(imagesDbPath, 'utf8'));
    
    const target = images.find(img => img.id === id);
    if (!target) return res.status(404).json({ error: 'Image not found' });
    
    target.status = 'rejected';
    fs.writeFileSync(imagesDbPath, JSON.stringify(images, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const apiCache = {};
// Clear old cache entries every 60s
setInterval(() => {
  for (const key in apiCache) {
    if (Date.now() - apiCache[key].time > 300000) delete apiCache[key];
  }
}, 60000);

// ── Airport Ground Layout Proxy (Runways, Taxiways, Gates) ────
const layoutCache = {};

app.get('/api/airport-layout/:icao', async (req, res) => {
  const icao = (req.params.icao || '').toUpperCase().trim();
  if (!icao || icao.length < 3) return res.status(400).json({ error: 'Invalid ICAO' });

  if (layoutCache[icao] && (Date.now() - layoutCache[icao].time < 86400000)) {
    return res.json(layoutCache[icao].data);
  }

  try {
    const url = `https://waypoint-live.app/api/layout/${icao}?v=28`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Track24/1.0 (flight-tracker)' } });
    if (r.ok) {
      const data = await r.json();
      layoutCache[icao] = { time: Date.now(), data };
      return res.json(data);
    }
    res.status(r.status).json({ error: 'Layout unavailable for airport' });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── Generic IF API proxy (handles GET + POST) ─────────────────
app.use('/api', async (req, res) => {
  const endpoint = req.path.replace(/^\//, ''); // strip leading slash
  const queryStr = JSON.stringify(req.query || {});
  const bodyStr = JSON.stringify(req.body || {});
  const cacheKey = `${req.method}:${endpoint}:${queryStr}:${bodyStr}`;

  // Granular cache duration
  let maxAge = 60000; // default 1 min
  if (endpoint.includes('/flights') || endpoint.includes('/atc')) {
    maxAge = 12000; // 12 seconds for live radar & ATC
  } else if (endpoint === 'sessions') {
    maxAge = 15000; // 15 seconds for active session user counts
  } else if (endpoint.startsWith('aircraft')) {
    maxAge = 3600000; // 1 hour for aircraft and liveries
  } else if (endpoint.startsWith('users')) {
    maxAge = 60000; // 1 minute for user profile & logbook
  }

  // Cache GET requests
  if (req.method === 'GET' && apiCache[cacheKey] && (Date.now() - apiCache[cacheKey].time < maxAge)) {
    return res.json(apiCache[cacheKey].data);
  }

  const queryParams = new URLSearchParams();
  for (const [key, val] of Object.entries(req.query || {})) {
    queryParams.set(key, val);
  }
  queryParams.set('apikey', API_KEY);
  const ifUrl = `${IF_BASE}/${endpoint}?${queryParams.toString()}`;

  try {
    const opts = { headers: { Accept: 'application/json' } };
    if (req.method === 'POST') {
      opts.method  = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.body    = JSON.stringify(req.body);
    }

    const r    = await fetch(ifUrl, opts);
    const data = await r.json();

    // Only cache successful GET requests
    if (req.method === 'GET' && data.errorCode === 0) {
      apiCache[cacheKey] = { time: Date.now(), data };
    }

    res.json(data);
  } catch (err) {
    console.error(`[PROXY ${req.method}]`, err.message);
    res.status(502).json({ error: err.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ✈  Track 24 running at http://localhost:${PORT}
  Press Ctrl+C to stop
`);
  });
}

export default app;
