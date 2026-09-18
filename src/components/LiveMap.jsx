import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createWaypointAircraftIcon, classifyAircraft } from '../utils/aircraftIcons';
import { fetchAirportLayout, calculateGateOccupancy } from '../utils/airportLayout';
import { findNearestAirport } from '../utils/airports';
import { getMapStyle, getMapTextColor, getMapTextHalo } from '../utils/mapStyles';

const FIR_GEOJSON_URL = 'https://raw.githubusercontent.com/vatsimnetwork/vatspy-data-project/master/FIRs.geojson';

export default function LiveMap({
  flights,
  selectedFlight,
  setSelectedFlight,
  airports,
  onAirportClick,
  selectedAirportIcao,
  mapTheme = 'dark',
  map3D,
  showFir,
  showRadar,
  isFollowMode,
  is3DChase,
  activeSessionId,
  getFlightHistory,
  getAircraftName
}) {
  const mapRef = useRef();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiRoutePoints, setApiRoutePoints] = useState([]);

  // Position interpolation state
  const [interpolatedFlights, setInterpolatedFlights] = useState([]);
  const lastUpdateRef = useRef(Date.now());
  const flightsRef = useRef(flights);
  const [activeAirportLayout, setActiveAirportLayout] = useState(null);

  useEffect(() => {
    flightsRef.current = flights;
    lastUpdateRef.current = Date.now();
  }, [flights]);

  // Load layout and fly to selected airport
  useEffect(() => {
    let active = true;
    if (!selectedAirportIcao) return;

    fetchAirportLayout(selectedAirportIcao).then(res => {
      if (active && res) {
        setActiveAirportLayout(res);
      }
    });

    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        const ap = airports.find(a => a.icao === selectedAirportIcao);
        if (ap && ap.lon != null && ap.lat != null) {
          map.flyTo({
            center: [ap.lon, ap.lat],
            zoom: 14.5,
            pitch: map3D ? 45 : 0,
            duration: 1200
          });
        }
      }
    }

    return () => { active = false; };
  }, [selectedAirportIcao, airports, map3D]);

  // Auto-fetch airport ground layout when zooming in closely (zoom >= 13.2)
  const onMapMoveEnd = useCallback((e) => {
    const map = e.target;
    if (!map) return;
    const zoom = map.getZoom();
    if (zoom >= 13.2) {
      const center = map.getCenter();
      const nearAp = airports.find(a => {
        if (a.lat == null || a.lon == null) return false;
        return Math.abs(a.lat - center.lat) < 0.08 && Math.abs(a.lon - center.lng) < 0.08;
      });
      if (nearAp && activeAirportLayout?.icao !== nearAp.icao) {
        fetchAirportLayout(nearAp.icao).then(res => {
          if (res) setActiveAirportLayout(res);
        });
      }
    }
  }, [airports, activeAirportLayout]);

  // Request Animation Frame loop for smooth dead-reckoning position updates
  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      const now = Date.now();
      const elapsedMs = now - lastUpdateRef.current;
      const elapsedHours = elapsedMs / 3600000;

      const updated = flightsRef.current.map(f => {
        if (!f.speed || f.speed < 15 || !f.heading || f.isParked) {
          return { ...f, interpLat: f.latitude, interpLon: f.longitude };
        }

        const distanceNm = f.speed * elapsedHours;
        const headingRad = (f.heading * Math.PI) / 180;
        const dLat = (distanceNm * Math.cos(headingRad)) / 60;
        const cosLat = Math.cos((f.latitude * Math.PI) / 180) || 1;
        const dLon = (distanceNm * Math.sin(headingRad)) / (60 * cosLat);

        return {
          ...f,
          interpLat: f.latitude + dLat,
          interpLon: f.longitude + dLon
        };
      });

      setInterpolatedFlights(updated);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Helper to load icons into map instance
  const registerMapIcons = useCallback((map) => {
    if (!map) return;
    const icons = [
      { id: 'plane-generic', isSel: false, isP: false },
      { id: 'plane-generic-selected', isSel: true, isP: false },
      { id: 'plane-parked', isSel: false, isP: true },
      { id: 'plane-parked-selected', isSel: true, isP: true }
    ];
    icons.forEach(({ id, isSel, isP }) => {
      if (!map.hasImage(id)) {
        try {
          map.addImage(id, createWaypointAircraftIcon(isSel, isP));
        } catch (e) {}
      }
    });
  }, []);

  // Handle map loading and Waypoint icon registration
  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    registerMapIcons(map);

    // Provide missing images immediately on-demand
    map.on('styleimagemissing', (e) => {
      const id = e.id;
      try {
        if (id === 'plane-generic') {
          map.addImage(id, createWaypointAircraftIcon(false, false));
        } else if (id === 'plane-generic-selected') {
          map.addImage(id, createWaypointAircraftIcon(true, false));
        } else if (id === 'plane-parked') {
          map.addImage(id, createWaypointAircraftIcon(false, true));
        } else if (id === 'plane-parked-selected') {
          map.addImage(id, createWaypointAircraftIcon(true, true));
        }
      } catch (err) {}
    });

    // Re-register when style reloads (e.g. style changes or HMR)
    map.on('styledata', () => {
      registerMapIcons(map);
    });

    setMapLoaded(true);
  }, [registerMapIcons]);

  // Fetch real recorded route points for selected flight
  useEffect(() => {
    let active = true;
    if (!selectedFlight) {
      setApiRoutePoints([]);
      return;
    }

    const sessId = activeSessionId || 'ed323139-baa7-4834-b9d6-5fb9f19ff11e';
    fetch(`/api/sessions/${sessId}/flights/${selectedFlight}/route`)
      .then(r => r.json())
      .then(d => {
        if (active && Array.isArray(d.result)) {
          setApiRoutePoints(d.result);
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [selectedFlight, activeSessionId]);

  // Track / Camera Follow / 3D Chase Loop
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const target = interpolatedFlights.find(f => f.flightId === selectedFlight);
    if (!target) return;

    const lat = target.interpLat ?? target.latitude;
    const lon = target.interpLon ?? target.longitude;
    if (lat === undefined || lon === undefined) return;

    if (is3DChase) {
      map.easeTo({
        center: [lon, lat],
        zoom: 12.5,
        pitch: 62,
        bearing: target.heading || 0,
        duration: 900
      });
    } else if (isFollowMode) {
      map.easeTo({
        center: [lon, lat],
        zoom: Math.max(map.getZoom(), 8),
        pitch: map3D ? 60 : 0,
        duration: 900
      });
    }
  }, [interpolatedFlights, selectedFlight, is3DChase, isFollowMode, map3D]);

  // Center on selected flight when clicked
  useEffect(() => {
    if (!selectedFlight || !mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const target = flights.find(f => f.flightId === selectedFlight);
    if (target && target.latitude !== undefined && target.longitude !== undefined) {
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(map.getZoom(), 7.5),
        duration: 1200
      });
    }
  }, [selectedFlight, flights]);

  // Handle recenter event from top navigation bar
  useEffect(() => {
    const handleRecenter = () => {
      if (!mapRef.current) return;
      const map = mapRef.current.getMap();
      if (!map) return;
      if (selectedFlight) {
        const target = flights.find(f => f.flightId === selectedFlight);
        if (target && target.latitude !== undefined && target.longitude !== undefined) {
          map.flyTo({
            center: [target.longitude, target.latitude],
            zoom: Math.max(map.getZoom(), 8),
            pitch: map3D ? 45 : 0,
            duration: 800
          });
          return;
        }
      }
      map.resetNorthPitch({ duration: 500 });
    };

    window.addEventListener('track24:recenter', handleRecenter);
    return () => window.removeEventListener('track24:recenter', handleRecenter);
  }, [selectedFlight, flights, map3D]);

  // Convert flights to GeoJSON with Waypoint aircraft icons
  const flightGeoJson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: interpolatedFlights.map(f => {
        const isSelected = f.flightId === selectedFlight;
        const iconName = f.isParked
          ? (isSelected ? 'plane-parked-selected' : 'plane-parked')
          : (isSelected ? 'plane-generic-selected' : 'plane-generic');

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [f.interpLon ?? f.longitude, f.interpLat ?? f.latitude]
          },
          properties: {
            id: f.flightId,
            heading: f.heading || 0,
            callsign: f.callsign || 'UNK',
            icon: iconName,
            isParked: f.isParked ? 1 : 0,
            isSelected: isSelected ? 1 : 0
          }
        };
      })
    };
  }, [interpolatedFlights, selectedFlight]);

  // Selected Flight Real Route Line GeoJSON
  const selectedRouteGeoJson = useMemo(() => {
    const target = interpolatedFlights.find(f => f.flightId === selectedFlight);
    if (!target) return { type: 'FeatureCollection', features: [] };

    const curLat = target.interpLat ?? target.latitude;
    const curLon = target.interpLon ?? target.longitude;

    if (target.isParked) {
      return { type: 'FeatureCollection', features: [] };
    }

    const recordedPoints = [];
    if (Array.isArray(apiRoutePoints) && apiRoutePoints.length > 0) {
      apiRoutePoints.forEach(p => {
        if (p.longitude != null && p.latitude != null) {
          recordedPoints.push([p.longitude, p.latitude]);
        }
      });
    }

    if (recordedPoints.length === 0 && getFlightHistory && selectedFlight) {
      const hist = getFlightHistory(selectedFlight) || [];
      hist.forEach(p => {
        if (p.longitude != null && p.latitude != null) {
          recordedPoints.push([p.longitude, p.latitude]);
        }
      });
    }

    if (curLon != null && curLat != null) {
      recordedPoints.push([curLon, curLat]);
    }

    if (recordedPoints.length >= 2) {
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: recordedPoints
            }
          }
        ]
      };
    }

    if (target.heading != null && target.speed && target.speed > 25) {
      const hdgRad = (target.heading * Math.PI) / 180;
      const vectorNm = Math.min((target.speed * (5 / 60)), 35);
      const dLat = (vectorNm * Math.cos(hdgRad)) / 60;
      const cosLat = Math.cos((curLat * Math.PI) / 180) || 1;
      const dLon = (vectorNm * Math.sin(hdgRad)) / (60 * cosLat);

      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [curLon, curLat],
                [curLon + dLon, curLat + dLat]
              ]
            }
          }
        ]
      };
    }

    return { type: 'FeatureCollection', features: [] };
  }, [interpolatedFlights, selectedFlight, apiRoutePoints, getFlightHistory]);

  // Airports GeoJSON
  const airportsGeoJson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: airports.map(a => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [a.lon, a.lat]
        },
        properties: {
          icao: a.icao,
          name: a.name,
          city: a.city
        }
      }))
    };
  }, [airports]);

  // Gate Stands GeoJSON with Live Occupancy calculation
  const gatesGeoJson = useMemo(() => {
    if (!activeAirportLayout?.gates || activeAirportLayout.gates.length === 0) {
      return { type: 'FeatureCollection', features: [] };
    }
    const parked = interpolatedFlights.filter(f => f.isParked || (f.speed < 10 && f.altitude < 6000));
    const occupancy = calculateGateOccupancy(activeAirportLayout.gates, parked);

    return {
      type: 'FeatureCollection',
      features: occupancy.gatesWithStatus.map((g, idx) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [g.lon, g.lat]
        },
        properties: {
          id: `gate-${idx}`,
          ref: g.ref || 'Gate',
          class: g.class || 'D',
          isOccupied: g.isOccupied ? 1 : 0,
          occupyingFlightId: g.occupyingFlight?.flightId || '',
          occupyingCallsign: g.occupyingFlight?.callsign || '',
          occupyingAircraft: g.occupyingFlight?.aircraftName || ''
        }
      }))
    };
  }, [activeAirportLayout, interpolatedFlights]);



  // Map Click Handler
  const onMapClick = (e) => {
    if (e.features && e.features.length > 0) {
      const feat = e.features[0];
      if (feat.layer.id === 'flights-layer') {
        setSelectedFlight(feat.properties.id);
        return;
      }
      if (feat.layer.id === 'airport-gates-layer') {
        if (feat.properties.isOccupied === 1 && feat.properties.occupyingFlightId) {
          setSelectedFlight(feat.properties.occupyingFlightId);
          return;
        }
        return;
      }
      if (feat.layer.id === 'airports-layer') {
        if (onAirportClick) onAirportClick(feat.properties.icao);
        return;
      }
    }
    setSelectedFlight(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Map
      ref={mapRef}
      initialViewState={{ longitude: 0, latitude: 25, zoom: 2.8, pitch: map3D ? 60 : 0 }}
      pitch={map3D ? 60 : 0}
      mapStyle={getMapStyle(mapTheme)}
      interactiveLayerIds={['flights-layer', 'airports-layer', 'airport-gates-layer']}
      onClick={onMapClick}
      onMoveEnd={onMapMoveEnd}
      onLoad={onMapLoad}
      cursor={selectedFlight ? 'default' : 'grab'}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      <NavigationControl position="bottom-left" />

      {/* Weather Radar Raster Layer */}
      {showRadar && (
        <Source
          id="rainviewer-source"
          type="raster"
          tiles={['https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png']}
          tileSize={256}
        >
          <Layer
            id="radar-layer"
            type="raster"
            paint={{
              'raster-opacity': 0.65,
              'raster-fade-duration': 150
            }}
          />
        </Source>
      )}

      {/* FIR Airspace Boundaries */}
      {showFir && (
        <Source id="fir-source" type="geojson" data={FIR_GEOJSON_URL}>
          <Layer
            id="fir-layer"
            type="line"
            paint={{
              'line-color': '#0ea5e9',
              'line-width': 1.2,
              'line-opacity': 0.45,
              'line-dasharray': [2, 2]
            }}
          />
        </Source>
      )}

      {/* Selected Flight Real Route Line */}
      {selectedFlight && (
        <Source id="selected-route-source" type="geojson" data={selectedRouteGeoJson}>
          <Layer
            id="selected-route-layer"
            type="line"
            paint={{
              'line-color': '#38bdf8',
              'line-width': 2.5,
              'line-opacity': 0.85,
              'line-blur': 0.5
            }}
          />
        </Source>
      )}

      {/* Airports Layer */}
      <Source id="airports-source" type="geojson" data={airportsGeoJson}>
        <Layer
          id="airports-layer"
          type="circle"
          paint={{
            'circle-radius': 4,
            'circle-color': '#38bdf8',
            'circle-opacity': 0.7,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#0a0e16'
          }}
        />
        <Layer
          id="airports-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'icao'],
            'text-font': ['Open Sans Regular'],
            'text-size': 10,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-allow-overlap': false
          }}
          paint={{
            'text-color': getMapTextColor(mapTheme),
            'text-halo-color': getMapTextHalo(mapTheme),
            'text-halo-width': 1.2
          }}
        />
      </Source>

      {/* ── Airport Ground Layout & Live Gate Occupancy Layers ── */}
      {activeAirportLayout && (
        <>
          {/* 1. Apron Tarmac Polygons */}
          {activeAirportLayout.apronGeoJson?.features?.length > 0 && (
            <Source id="airport-aprons-source" type="geojson" data={activeAirportLayout.apronGeoJson}>
              <Layer
                id="airport-aprons-layer"
                type="fill"
                minzoom={12.0}
                paint={{
                  'fill-color': '#0d131f',
                  'fill-opacity': 0.85,
                  'fill-outline-color': 'rgba(255, 255, 255, 0.05)'
                }}
              />
            </Source>
          )}

          {/* 2. Taxiway Centerlines */}
          {activeAirportLayout.taxiwayGeoJson?.features?.length > 0 && (
            <Source id="airport-taxiways-source" type="geojson" data={activeAirportLayout.taxiwayGeoJson}>
              <Layer
                id="airport-taxiways-layer"
                type="line"
                minzoom={12.5}
                paint={{
                  'line-color': 'rgba(217, 119, 6, 0.45)',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    12.5, 1.0,
                    15.0, 1.8,
                    17.0, 2.5
                  ]
                }}
              />
            </Source>
          )}

          {/* 3. Runways (Pavement, Centerline, Labels) */}
          {activeAirportLayout.runwayGeoJson?.features?.length > 0 && (
            <Source id="airport-runways-source" type="geojson" data={activeAirportLayout.runwayGeoJson}>
              <Layer
                id="airport-runways-pavement"
                type="line"
                minzoom={11.0}
                paint={{
                  'line-color': '#090d15',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    11.0, 3,
                    13.0, 8,
                    15.0, 20,
                    17.0, 42
                  ]
                }}
              />
              <Layer
                id="airport-runways-centerline"
                type="line"
                minzoom={12.8}
                paint={{
                  'line-color': '#ffffff',
                  'line-width': 1.5,
                  'line-dasharray': [4, 4],
                  'line-opacity': 0.75
                }}
              />
              <Layer
                id="airport-runways-labels"
                type="symbol"
                minzoom={13.2}
                layout={{
                  'symbol-placement': 'line',
                  'text-field': ['get', 'ref'],
                  'text-font': ['Open Sans Bold'],
                  'text-size': 11,
                  'text-allow-overlap': false
                }}
                paint={{
                  'text-color': '#94a3b8'
                }}
              />
            </Source>
          )}

          {/* 4. Parking Gates & Stands with Live Occupancy */}
          {gatesGeoJson.features.length > 0 && (
            <Source id="airport-gates-source" type="geojson" data={gatesGeoJson}>
              <Layer
                id="airport-gates-layer"
                type="circle"
                minzoom={13.5}
                paint={{
                  'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    13.5, 3.5,
                    15.5, 6,
                    17.5, 9
                  ],
                  'circle-color': [
                    'case',
                    ['==', ['get', 'isOccupied'], 1],
                    '#0284c7',
                    'rgba(255, 255, 255, 0.12)'
                  ],
                  'circle-stroke-width': 1.2,
                  'circle-stroke-color': [
                    'case',
                    ['==', ['get', 'isOccupied'], 1],
                    '#38bdf8',
                    'rgba(255, 255, 255, 0.25)'
                  ]
                }}
              />
              <Layer
                id="airport-gates-labels"
                type="symbol"
                minzoom={14.8}
                layout={{
                  'text-field': ['get', 'ref'],
                  'text-font': ['Open Sans Regular'],
                  'text-size': 9.5,
                  'text-offset': [0, 1.3],
                  'text-anchor': 'top',
                  'text-allow-overlap': false
                }}
                paint={{
                  'text-color': [
                    'case',
                    ['==', ['get', 'isOccupied'], 1],
                    '#38bdf8',
                    '#94a3b8'
                  ],
                  'text-halo-color': '#0a0e16',
                  'text-halo-width': 1
                }}
              />
            </Source>
          )}
        </>
      )}

      {/* Aircraft Markers Layer with Exact Waypoint Silhouette & Scaling */}
      {mapLoaded && (
        <Source id="flights-source" type="geojson" data={flightGeoJson}>
          <Layer
            id="flights-layer"
            type="symbol"
            layout={{
              'icon-image': ['get', 'icon'],
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                2, ['case', ['==', ['get', 'isSelected'], 1], 0.44, 0.38],
                6, ['case', ['==', ['get', 'isSelected'], 1], 0.54, 0.46],
                10, ['case', ['==', ['get', 'isSelected'], 1], 0.70, 0.60],
                14, ['case', ['==', ['get', 'isSelected'], 1], 0.88, 0.76]
              ],
              'icon-rotate': ['get', 'heading'],
              'icon-rotation-alignment': 'map',
              'icon-pitch-alignment': 'viewport',
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'text-field': ['get', 'callsign'],
              'text-font': ['Open Sans Bold', 'Open Sans Regular'],
              'text-anchor': 'bottom',
              'text-offset': [0, -1.2],
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                3, 10,
                7, 11,
                11, 12.5
              ],
              'text-allow-overlap': false
            }}
            paint={{
              'icon-opacity': 1.0,
              'text-color': getMapTextColor(mapTheme),
              'text-halo-color': getMapTextHalo(mapTheme),
              'text-halo-width': 1.6
            }}
          />
        </Source>
      )}
      </Map>

      {/* Floating Map Controls (Ergonomic thumb reach on mobile) */}
      <div className="wp-map-floating-controls">
        <button
          type="button"
          className="wp-map-ctrl-btn"
          onClick={() => {
            const map = mapRef.current?.getMap();
            if (map) map.zoomIn();
          }}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
        <button
          type="button"
          className="wp-map-ctrl-btn"
          onClick={() => {
            const map = mapRef.current?.getMap();
            if (map) map.zoomOut();
          }}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <i className="fa-solid fa-minus"></i>
        </button>
        <button
          type="button"
          className="wp-map-ctrl-btn"
          onClick={() => {
            const map = mapRef.current?.getMap();
            if (map) map.resetNorthPitch({ duration: 500 });
          }}
          title="Reset Heading & Tilt"
          aria-label="Reset North"
        >
          <i className="fa-solid fa-compass"></i>
        </button>
      </div>
    </div>
  );
}
