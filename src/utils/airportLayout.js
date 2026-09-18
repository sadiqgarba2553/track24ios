// ── Airport Ground Layout & Live Gate Occupancy Processor ──

import { calculateDistanceNm } from './airports.js';

const layoutCache = new Map();

/**
 * Fetch and parse airport layout GeoJSON
 */
export async function fetchAirportLayout(icao) {
  if (!icao || typeof icao !== 'string') return null;
  const clean = icao.toUpperCase().trim();

  if (layoutCache.has(clean)) {
    return layoutCache.get(clean);
  }

  try {
    const res = await fetch(`/api/airport-layout/${clean}`);
    if (!res.ok) return null;
    const geo = await res.json();
    if (!geo || !Array.isArray(geo.features)) return null;

    const runways = [];
    const runwayFeatures = [];
    const taxiwayFeatures = [];
    const apronFeatures = [];
    const gates = [];

    geo.features.forEach(f => {
      const p = f.properties || {};
      const k = p.k || '';

      if (k === 'rwy') {
        runways.push({
          ref: p.ref || 'Runway',
          widthM: p.w || 45,
          lengthFt: p.rlen || 0,
          widthFt: p.rwid || 150,
          surface: p.rsurf || 'Asphalt',
          lighted: Boolean(p.rlit),
          leRef: p.rle || '',
          leHdg: p.rleh ?? null,
          heRef: p.rhe || '',
          heHdg: p.rheh ?? null
        });
        runwayFeatures.push(f);
      } else if (k === 'taxi') {
        taxiwayFeatures.push(f);
      } else if (k === 'apron') {
        apronFeatures.push(f);
      } else if (k === 'gate') {
        gates.push({
          ref: p.ref || 'Gate',
          class: p.cls || 'D', // F=A380, E=Widebody, D=Narrowbody, C=GA
          airline: p.al || '',
          airport: p.ap || clean,
          lon: f.geometry?.coordinates?.[0],
          lat: f.geometry?.coordinates?.[1]
        });
      }
    });

    const parsed = {
      icao: clean,
      runways,
      runwayGeoJson: { type: 'FeatureCollection', features: runwayFeatures },
      taxiwayGeoJson: { type: 'FeatureCollection', features: taxiwayFeatures },
      apronGeoJson: { type: 'FeatureCollection', features: apronFeatures },
      gates
    };

    layoutCache.set(clean, parsed);
    return parsed;
  } catch (err) {
    console.warn(`[AirportLayout] Failed to load layout for ${clean}:`, err);
    return null;
  }
}

/**
 * Classify Gate Class Description
 */
export function getGateClassLabel(cls) {
  switch ((cls || '').toUpperCase()) {
    case 'F': return 'Class F · Heavy (A380/B747)';
    case 'E': return 'Class E · Widebody (B777/A350)';
    case 'D': return 'Class D · Narrowbody (B737/A320)';
    case 'C': return 'Class C · Regional/GA';
    default: return `Class ${cls || 'Stand'}`;
  }
}

/**
 * Calculate live gate occupancy based on current parked aircraft
 * A gate is considered occupied if a parked aircraft is within ~0.04 nm (~75 meters)
 */
export function calculateGateOccupancy(gates = [], parkedFlights = []) {
  if (!Array.isArray(gates) || gates.length === 0) {
    return {
      gatesWithStatus: [],
      totalGates: 0,
      occupiedCount: 0,
      availableCount: 0,
      occupancyRate: 0
    };
  }

  // Map of gateIndex -> occupyingFlight
  const occupiedGateMap = new Map();

  // For each parked flight, find the closest gate within tolerance (~0.055 nm / ~100m)
  parkedFlights.forEach(flight => {
    const fLat = flight.interpLat ?? flight.latitude;
    const fLon = flight.interpLon ?? flight.longitude;
    if (fLat == null || fLon == null) return;

    let closestGateIdx = -1;
    let minDistance = 0.055; // max threshold ~100 meters

    gates.forEach((gate, idx) => {
      if (gate.lat == null || gate.lon == null) return;
      // Rough fast bounding box check first
      if (Math.abs(gate.lat - fLat) > 0.002 || Math.abs(gate.lon - fLon) > 0.002) return;

      const dist = calculateDistanceNm(gate.lat, gate.lon, fLat, fLon);
      if (dist < minDistance) {
        minDistance = dist;
        closestGateIdx = idx;
      }
    });

    if (closestGateIdx !== -1) {
      // Assign this gate to this flight (or update if closer)
      occupiedGateMap.set(closestGateIdx, {
        flightId: flight.flightId,
        callsign: flight.callsign || 'Parked Aircraft',
        aircraftName: flight.aircraftName || 'Airliner',
        username: flight.username || '',
        distanceNm: minDistance
      });
    }
  });

  const gatesWithStatus = gates.map((gate, idx) => {
    const occupying = occupiedGateMap.get(idx) || null;
    return {
      ...gate,
      isOccupied: Boolean(occupying),
      occupyingFlight: occupying
    };
  });

  const occupiedCount = occupiedGateMap.size;
  const totalGates = gates.length;
  const availableCount = Math.max(0, totalGates - occupiedCount);
  const occupancyRate = totalGates > 0 ? Math.round((occupiedCount / totalGates) * 100) : 0;

  return {
    gatesWithStatus,
    totalGates,
    occupiedCount,
    availableCount,
    occupancyRate
  };
}
