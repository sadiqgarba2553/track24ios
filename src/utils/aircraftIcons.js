// ── Waypoint-Accurate Aircraft Icon Generator ──
// Uses the exact Waypoint commercial aircraft silhouette, colors, and styling

export const WAYPOINT_AIRPLANE_PATH = 'M21.5 15.5v-2l-8.5-5V3a1.5 1.5 0 0 0-3 0v5.5l-8.5 5v2l8.5-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8.5 2Z';

export function classifyAircraft(aircraftName = '', callsign = '') {
  const n = (aircraftName || '').toLowerCase();
  const c = (callsign || '').toLowerCase();

  // Heavy / Quad-engine (4 engines)
  if (n.includes('380') || n.includes('747') || n.includes('a388') || n.includes('b74') || n.includes('antonov') || n.includes('c-17') || n.includes('c17') || n.includes('kc-10')) {
    return 'heavy';
  }

  // Fighter / Military Jet
  if (n.includes('hornet') || n.includes('f-') || n.includes('f/a') || n.includes('fighter') ||
      n.includes('spitfire') || n.includes('a-10') || n.includes('raptor') || n.includes('tomcat') ||
      n.includes('falcon') || n.includes('typhoon') || c.includes('ghost') || c.includes('viper') || c.includes('razor')) {
    return 'fighter';
  }

  // Widebody Twin-engine
  if (n.includes('777') || n.includes('787') || n.includes('350') || n.includes('330') ||
      n.includes('340') || n.includes('767') || n.includes('dc-10') || n.includes('md-11') ||
      n.includes('a359') || n.includes('a35k') || n.includes('b77') || n.includes('b78')) {
    return 'widebody';
  }

  // Turboprop & Heavy Cargo (High-wing / Props)
  if (n.includes('c-130') || n.includes('c130') || n.includes('hercules') || n.includes('dash') ||
      n.includes('q400') || n.includes('king air') || n.includes('tbm') || n.includes('caravan') ||
      n.includes('a400m') || n.includes('at7') || n.includes('atr')) {
    return 'turboprop';
  }

  // Light Propeller / General Aviation
  if (n.includes('cessna') || n.includes('172') || n.includes('sr22') || n.includes('cirrus') ||
      n.includes('cub') || n.includes('xcub') || n.includes('piper') || n.includes('bonanza')) {
    return 'propeller';
  }

  // Default Commercial Narrowbody
  return 'narrowbody';
}

export function getAircraftCategoryLabel(category) {
  switch (category) {
    case 'heavy': return 'HEAVY';
    case 'widebody': return 'WIDEBODY';
    case 'fighter': return 'FAST JET';
    case 'turboprop': return 'TURBOPROP';
    case 'propeller': return 'PROP';
    case 'narrowbody':
    default:
      return 'JET';
  }
}

/**
 * Creates the exact Waypoint aircraft icon.
 * Rendered on 64x64 canvas.
 * - Cyan (#38bdf8) for normal airborne flights
 * - White (#ffffff) for selected flight
 * - Slate (#94a3b8) for parked flights
 * - Crisp dark outline (#0a0e16) matching Waypoint
 */
export function createWaypointAircraftIcon(isSelected = false, isParked = false) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Center at (32, 32), scale path from 24x24 space
  // Bounding box of path: X in [1.5, 21.5] (width 20, center 11.5), Y in [1.5, 22] (height 20.5, center 11.75)
  ctx.save();
  ctx.translate(32, 32);
  ctx.scale(2.35, 2.35);
  ctx.translate(-11.5, -11.75);

  const path = new Path2D(WAYPOINT_AIRPLANE_PATH);

  // Fill: Selected is crisp bright white (#ffffff), Parked is muted slate (#94a3b8), Normal is Track 24 cyan (#38bdf8)
  if (isSelected) {
    ctx.fillStyle = '#ffffff';
  } else if (isParked) {
    ctx.fillStyle = '#94a3b8';
  } else {
    ctx.fillStyle = '#38bdf8';
  }
  ctx.fill(path);

  // Stroke - crisp dark border matching Waypoint
  ctx.strokeStyle = '#0a0e16';
  ctx.lineWidth = 1.25;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke(path);

  ctx.restore();

  return ctx.getImageData(0, 0, size, size);
}

// Backward compatibility helper
export function createBespokeAircraftIcon(category, isSelected, isParked) {
  return createWaypointAircraftIcon(isSelected, isParked);
}

export const BESPOKE_ICON_NAMES = [
  'plane-generic',
  'plane-generic-selected',
  'plane-parked',
  'plane-parked-selected'
];
