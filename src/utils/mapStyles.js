/**
 * Track 24 — Map Styles & Cartographic Basemaps
 * 
 * Supports Dark Matter, Positron Light, and Satellite Aerial Imagery.
 */

export const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
export const LIGHT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const SATELLITE_MAP_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    },
    'carto-labels': {
      type: 'raster',
      tiles: [
        'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png'
      ],
      tileSize: 256,
      maxzoom: 19
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'carto-labels-layer',
      type: 'raster',
      source: 'carto-labels',
      minzoom: 2,
      maxzoom: 19,
      paint: {
        'raster-opacity': 0.88
      }
    }
  ]
};

/**
 * Return style URL or object for the requested theme
 */
export function getMapStyle(theme = 'dark') {
  switch (theme) {
    case 'light':
      return LIGHT_MAP_STYLE;
    case 'satellite':
      return SATELLITE_MAP_STYLE;
    case 'dark':
    default:
      return DARK_MAP_STYLE;
  }
}

/**
 * Return dynamic text color based on map theme for high legibility
 */
export function getMapTextColor(theme = 'dark') {
  return theme === 'light' ? '#0f172a' : '#ffffff';
}

/**
 * Return dynamic text halo based on map theme
 */
export function getMapTextHalo(theme = 'dark') {
  return theme === 'light' ? '#ffffff' : '#0a0e16';
}
