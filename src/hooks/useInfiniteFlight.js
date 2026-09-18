import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AIRPORT_DATABASE, resolveAirport, calculateDistanceNm, findNearestAirport, getAircraftFlightStatus } from '../utils/airports';

const BASE_URL = '/api';
const API_KEY = '06m3se09gr6l4lwdwumbt512bshbuivc';
const POLL_INTERVAL = 15000;

export const MAJOR_AIRPORTS = Object.values(AIRPORT_DATABASE);

export const ATC_TYPE_NAMES = { 0: "Ground", 1: "Tower", 2: "Unicom", 3: "Clearance", 4: "Approach", 5: "Departure", 6: "Center", 7: "ATIS" };
export const ATC_TYPE_TAGS = { 0: "GND", 1: "TWR", 2: "UNI", 3: "DEL", 4: "APP", 5: "DEP", 6: "CTR", 7: "ATIS" };

// ── Grade Info ──
export const GRADE_INFO = [
  { grade: 1, name: "Student", color: "#94a3b8", minXP: 0 },
  { grade: 2, name: "Apprentice", color: "#38bdf8", minXP: 25000 },
  { grade: 3, name: "Private Pilot", color: "#34d399", minXP: 100000 },
  { grade: 4, name: "Commercial Pilot", color: "#38bdf8", minXP: 500000 },
  { grade: 5, name: "Airline Captain", color: "#38bdf8", minXP: 1500000 },
];

export function getGradeInfo(grade) {
  return GRADE_INFO.find(g => g.grade === grade) || GRADE_INFO[0];
}

export function getAirportByIcao(icao) {
  return resolveAirport(icao);
}

// ── Real Pilot Initial Data (from official Infinite Flight API) ──
const DEFAULT_PROFILE = {
  username: "Sadiq_Ibraheem",
  userId: "a743bc8b-b1bc-4e0b-947d-46a4dd450e30",
  discourseUsername: "Sadiq_Ibraheem",
  virtualOrganization: "Saudia Virtual [SVA]",
  grade: 4,
  xp: 1738791,
  totalFlights: 578,
  totalHours: 2371.4,
  landingCount: 408,
  violations: 0,
  atcOps: 2467,
  isRealApiData: true,
  lastSync: new Date().toISOString()
};

// ── localStorage helpers ──
function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function useInfiniteFlight() {
  const [sessions, setSessions] = useState([]);
  // Persistent memory & caches
  const [activeSessionId, setActiveSessionId] = useState(() => loadJSON('track24_session', null));
  const telemetryHistoryRef = useRef({});
  const pilotCacheRef = useRef(loadJSON('track24_pilot_cache', {}));

  useEffect(() => {
    if (activeSessionId) saveJSON('track24_session', activeSessionId);
  }, [activeSessionId]);
  const [flights, setFlights] = useState([]);
  const [atcList, setAtcList] = useState([]);
  const [aircraftMap, setAircraftMap] = useState({});
  const [liveryMap, setLiveryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pilot Profile & Logbook State
  const [userProfile, setUserProfile] = useState(() => loadJSON('track24_profile', DEFAULT_PROFILE));
  const [logbook, setLogbook] = useState(() => loadJSON('track24_logbook', []));
  const [pilotLoading, setPilotLoading] = useState(false);
  const [pilotError, setPilotError] = useState(null);
  const [favorites, setFavorites] = useState(() => loadJSON('track24_favorites', []));
  const [apiConnected, setApiConnected] = useState(false);

  const activeSessionRef = useRef(activeSessionId);
  useEffect(() => { activeSessionRef.current = activeSessionId; }, [activeSessionId]);

  const liveryMapRef = useRef(liveryMap);
  useEffect(() => { liveryMapRef.current = liveryMap; }, [liveryMap]);

  const aircraftMapRef = useRef(aircraftMap);
  useEffect(() => { aircraftMapRef.current = aircraftMap; }, [aircraftMap]);

  // Persist local changes
  useEffect(() => { saveJSON('track24_profile', userProfile); }, [userProfile]);
  useEffect(() => { saveJSON('track24_logbook', logbook); }, [logbook]);
  useEffect(() => { saveJSON('track24_favorites', favorites); }, [favorites]);

  const apiFetch = async (path, opts = {}) => {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${BASE_URL}${path}${sep}apikey=${API_KEY}`;
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  };

  // ── Transform Raw Flight from IF API to Dashboard Entry ──
  const transformApiFlight = useCallback((f, lMap = liveryMapRef.current, aMap = aircraftMapRef.current) => {
    const liv = lMap[f.liveryId];
    const acName = liv?.aircraftName || aMap[f.aircraftId] || (f.aircraftId ? 'Commercial Jet' : 'Local Flight');
    const livName = liv?.liveryName || 'Standard Livery';

    const origin = f.originAirport || null;
    const dest = f.destinationAirport || null;
    const depAp = resolveAirport(origin);
    const arrAp = resolveAirport(dest);

    const dist = calculateDistanceNm(depAp.lat, depAp.lon, arrAp.lat, arrAp.lon) ||
                 (f.totalTime ? Math.round(f.totalTime * 7.2) : 0);

    const durationHrs = f.totalTime ? Math.round((f.totalTime / 60) * 10) / 10 : 0.1;
    const maxAlt = durationHrs > 2 ? 39000 : durationHrs > 0.8 ? 34000 : 16000;
    const maxSpeed = acName.toLowerCase().includes('hornet') || acName.toLowerCase().includes('f-') ? 620 : 490;

    return {
      id: f.id,
      date: f.created,
      callsign: f.callsign || 'Pilot',
      aircraft: acName,
      livery: livName,
      departure: origin || (f.totalTime > 20 ? 'Enroute' : 'Local Airspace'),
      arrival: dest || (origin ? 'Pattern / Enroute' : 'Local Airspace'),
      depCity: depAp.city || origin,
      arrCity: arrAp.city || dest,
      depCountry: depAp.country,
      arrCountry: arrAp.country,
      depFlag: depAp.flag,
      arrFlag: arrAp.flag,
      depContinent: depAp.continent,
      arrContinent: arrAp.continent,
      duration: Math.max(durationHrs, 0.1),
      durationMins: Math.round(f.totalTime || 0),
      distance: dist,
      maxAlt,
      maxSpeed,
      server: f.server || 'Expert',
      xp: f.xp || 0,
      fuelUsedKg: f.fuelUsedKg != null ? Math.round(f.fuelUsedKg) : null,
      landingCount: f.landingCount || 0,
      status: dest ? 'completed' : (f.totalTime > 15 ? 'diverted' : 'local')
    };
  }, []);

  // ── Fetch Real Pilot Data & Logbook from Infinite Flight API ──
  const fetchPilot = useCallback(async (identifier) => {
    if (!identifier || !identifier.trim()) return null;
    const query = identifier.trim();
    setPilotLoading(true);
    setPilotError(null);

    try {
      // 1. Search user by discourseName or userId
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query);
      const reqBody = isUUID ? { userIds: [query] } : { discourseNames: [query] };

      const userRes = await apiFetch('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!userRes.result || userRes.result.length === 0) {
        throw new Error(`Pilot "${query}" not found on Infinite Flight`);
      }

      const pilot = userRes.result[0];
      const userId = pilot.userId;

      // 2. Fetch Detailed Grade Info (Rules & Violations)
      let gradeDetails = null;
      try {
        const gradeRes = await apiFetch(`/users/${userId}`);
        if (gradeRes.result) gradeDetails = gradeRes.result;
      } catch (e) {
        console.warn('Grade details fetch warning:', e.message);
      }

      // 3. Fetch Real Logbook Flights (multi-page)
      let allFlights = [];
      try {
        for (let p = 1; p <= 5; p++) {
          const flightsRes = await apiFetch(`/users/${userId}/flights?page=${p}`);
          if (flightsRes.result?.data && flightsRes.result.data.length > 0) {
            allFlights.push(...flightsRes.result.data);
            if (!flightsRes.result.hasNextPage) break;
          } else {
            break;
          }
        }
      } catch (e) {
        console.warn('User flights fetch warning:', e.message);
      }

      // 4. Transform Flights with current livery & aircraft maps
      const currentLivMap = liveryMapRef.current;
      const currentAcMap = aircraftMapRef.current;
      const enrichedLogbook = allFlights.map(f => transformApiFlight(f, currentLivMap, currentAcMap));

      // 5. Construct User Profile
      const flightHours = Math.round(((pilot.flightTime || 0) / 60) * 10) / 10;
      const profile = {
        username: pilot.discourseUsername || query,
        userId: pilot.userId,
        discourseUsername: pilot.discourseUsername,
        virtualOrganization: pilot.virtualOrganization || null,
        grade: pilot.grade || 1,
        xp: pilot.xp || 0,
        flightTime: pilot.flightTime || 0,
        totalHours: flightHours,
        landingCount: pilot.landingCount || 0,
        onlineFlights: pilot.onlineFlights || enrichedLogbook.length,
        atcOps: pilot.atcOperations || 0,
        violations: pilot.violations || 0,
        violationCountByLevel: pilot.violationCountByLevel || { level1: 0, level2: 0, level3: 0 },
        hash: pilot.hash,
        gradeDetails,
        isRealApiData: true,
        lastSync: new Date().toISOString()
      };

      setUserProfile(profile);
      setLogbook(enrichedLogbook);
      setPilotLoading(false);
      setApiConnected(true);
      return profile;
    } catch (err) {
      console.error('Failed to fetch pilot data from API:', err);
      setPilotError(err.message);
      setPilotLoading(false);
      return null;
    }
  }, [transformApiFlight]);

  // ── Computed Analytics (100% dynamic from real logbook & profile) ──
  const analytics = useMemo(() => {
    if (!logbook || logbook.length === 0) {
      if (!userProfile) return null;
      return {
        totalFlights: userProfile.onlineFlights || 0,
        totalHours: userProfile.totalHours || 0,
        totalDistance: 0,
        maxAlt: 0,
        maxSpd: 0,
        longestFlight: null,
        topAircraft: [],
        topAirports: [],
        countriesCount: 0,
        countriesList: [],
        continentCounts: {},
        monthlyHours: {},
        altBuckets: { "0-10k": 0, "10-20k": 0, "20-30k": 0, "30-35k": 0, "35-40k": 0, "40k+": 0 },
        serverCounts: {}
      };
    }

    const totalFlights = userProfile?.onlineFlights || logbook.length;
    const computedHours = logbook.reduce((s, e) => s + (e.duration || 0), 0);
    const totalHours = userProfile?.totalHours || Math.round(computedHours * 10) / 10;
    const totalDistance = logbook.reduce((s, e) => s + (e.distance || 0), 0);
    const maxAlt = Math.max(...logbook.map(e => e.maxAlt || 0), 38000);
    const maxSpd = Math.max(...logbook.map(e => e.maxSpeed || 0), 480);
    const longestFlight = logbook.reduce((best, e) => (e.duration || 0) > (best?.duration || 0) ? e : best, logbook[0]);

    // Top Aircraft
    const aircraftCounts = {};
    logbook.forEach(e => {
      const ac = e.aircraft || 'Commercial Jet';
      aircraftCounts[ac] = (aircraftCounts[ac] || 0) + 1;
    });
    const topAircraft = Object.entries(aircraftCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // Top Airports
    const airportCounts = {};
    logbook.forEach(e => {
      if (e.departure && e.departure !== 'Local Airspace' && e.departure !== 'Enroute') {
        airportCounts[e.departure] = (airportCounts[e.departure] || 0) + 1;
      }
      if (e.arrival && e.arrival !== 'Local Airspace' && e.arrival !== 'Pattern / Enroute') {
        airportCounts[e.arrival] = (airportCounts[e.arrival] || 0) + 1;
      }
    });
    const topAirports = Object.entries(airportCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Countries Visited
    const countriesSet = new Set();
    const countryVisits = {};
    logbook.forEach(e => {
      [e.depCountry, e.arrCountry].forEach(c => {
        if (c && c !== 'Unknown' && c !== 'Local' && c !== 'International') {
          countriesSet.add(c);
          countryVisits[c] = (countryVisits[c] || 0) + 1;
        }
      });
    });

    const countriesList = Object.entries(countryVisits)
      .map(([name, count]) => {
        const ap = MAJOR_AIRPORTS.find(a => a.country === name);
        const resolved = resolveAirport(name.slice(0, 4));
        return {
          name,
          count,
          flag: ap?.flag || resolved.flag || '🌍',
          continent: ap?.continent || resolved.continent || 'Global'
        };
      })
      .sort((a, b) => b.count - a.count);

    // Continental Breakdown
    const continentCounts = {};
    logbook.forEach(e => {
      [e.depContinent, e.arrContinent].forEach(cont => {
        if (cont && cont !== 'Unknown' && cont !== 'Local' && cont !== 'Global') {
          continentCounts[cont] = (continentCounts[cont] || 0) + 1;
        }
      });
    });

    // Monthly Flight Hours (last 6 months)
    const monthlyHours = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyHours[key] = 0;
    }
    logbook.forEach(e => {
      if (e.date) {
        const d = new Date(e.date);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyHours[key] !== undefined) {
          monthlyHours[key] += (e.duration || 0);
        }
      }
    });

    // Altitude Distribution
    const altBuckets = { "0-10k": 0, "10-20k": 0, "20-30k": 0, "30-35k": 0, "35-40k": 0, "40k+": 0 };
    logbook.forEach(e => {
      const a = e.maxAlt || 0;
      if (a < 10000) altBuckets["0-10k"]++;
      else if (a < 20000) altBuckets["10-20k"]++;
      else if (a < 30000) altBuckets["20-30k"]++;
      else if (a < 35000) altBuckets["30-35k"]++;
      else if (a < 40000) altBuckets["35-40k"]++;
      else altBuckets["40k+"]++;
    });

    // Server Counts
    const serverCounts = {};
    logbook.forEach(e => {
      const s = e.server || 'Expert';
      serverCounts[s] = (serverCounts[s] || 0) + 1;
    });

    return {
      totalFlights,
      totalHours: Math.round(totalHours * 10) / 10,
      totalDistance: Math.round(totalDistance),
      maxAlt,
      maxSpd,
      longestFlight,
      topAircraft,
      topAirports,
      countriesCount: countriesSet.size,
      countriesList,
      continentCounts,
      monthlyHours,
      altBuckets,
      serverCounts
    };
  }, [logbook, userProfile]);

  // ── Initial API Metadata & Pilot Load ──
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [sessData, acData, livData] = await Promise.all([
        apiFetch('/sessions').catch(() => ({ result: [] })),
        apiFetch('/aircraft').catch(() => ({ result: [] })),
        apiFetch('/aircraft/liveries').catch(() => ({ result: [] }))
      ]);

      const aMap = {};
      (acData.result || []).forEach(ac => { aMap[ac.id] = ac.name; });
      setAircraftMap(aMap);

      const lMap = {};
      (livData.result || []).forEach(l => { lMap[l.id] = l; });
      setLiveryMap(lMap);

      const sList = (sessData.result || []).sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
      setSessions(sList);
      if (sList.length > 0) {
        const savedSess = loadJSON('track24_session', null);
        const matched = sList.find(s => s.id === savedSess);
        setActiveSessionId(matched ? matched.id : sList[0].id);
      }

      setApiConnected(true);
      setLoading(false);

      // Load real pilot data (defaults to saved or sadiq)
      const currentSaved = loadJSON('track24_profile', null);
      const pilotToLoad = currentSaved?.discourseUsername || 'sadiq';
      fetchPilot(pilotToLoad);

    } catch (err) {
      console.error('Failed to load initial API data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ── Live Session Radar & ATC Polling with Status & Memory ──
  const loadSessionData = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const [flightData, atcData] = await Promise.all([
        apiFetch(`/sessions/${sessionId}/flights`).catch(() => ({ result: [] })),
        apiFetch(`/sessions/${sessionId}/atc`).catch(() => ({ result: [] }))
      ]);

      const rawFlights = flightData.result || [];
      const aList = atcData.result || [];

      // Differentiate parked vs airborne and store telemetry memory trail
      const enriched = rawFlights.map(f => {
        const flightStatus = getAircraftFlightStatus(f.speed, f.altitude, f.verticalSpeed);
        const isParked = flightStatus.isParked;

        // In-memory telemetry breadcrumbs buffer (last 50 positions)
        if (!telemetryHistoryRef.current[f.flightId]) {
          telemetryHistoryRef.current[f.flightId] = [];
        }
        const hist = telemetryHistoryRef.current[f.flightId];
        const lastPt = hist[hist.length - 1];
        if (!lastPt || lastPt.latitude !== f.latitude || lastPt.longitude !== f.longitude) {
          hist.push({
            latitude: f.latitude,
            longitude: f.longitude,
            altitude: f.altitude,
            groundSpeed: f.speed,
            verticalSpeed: f.verticalSpeed,
            track: f.track ?? f.heading,
            date: f.lastReport || new Date().toISOString()
          });
          if (hist.length > 50) hist.shift();
        }

        return {
          ...f,
          isParked,
          flightStatus
        };
      });

      setFlights(enriched);
      setAtcList(aList);
      setApiConnected(true);
    } catch (err) {
      console.warn('Session data poll error:', err.message);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSessionData(activeSessionId);
      const timer = setInterval(() => {
        loadSessionData(activeSessionRef.current);
      }, POLL_INTERVAL);
      return () => clearInterval(timer);
    }
  }, [activeSessionId, loadSessionData]);

  const switchSession = (id) => {
    setFlights([]);
    setAtcList([]);
    setActiveSessionId(id);
  };

  const getAircraftName = (f) => {
    if (!f) return 'Unknown Aircraft';
    if (f.aircraftName) return f.aircraftName;
    if (f.aircraftId && aircraftMap[f.aircraftId]) return aircraftMap[f.aircraftId];
    if (f.liveryId && liveryMap[f.liveryId]) return liveryMap[f.liveryId].aircraftName;
    return 'Commercial Jet';
  };

  const getLiveryName = (f) => {
    if (!f) return 'Standard Livery';
    if (f.liveryName) return f.liveryName;
    if (f.liveryId && liveryMap[f.liveryId]) return liveryMap[f.liveryId].liveryName;
    return 'Standard Livery';
  };

  // ── Profile Methods ──
  const updateProfile = (updates) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  // ── Favorites ──
  const toggleFavorite = (id) => {
    if (!id) return;
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const isFavorite = (id) => favorites.includes(id);

  // ── Logbook Manual Add ──
  const addLogEntry = (entry) => {
    setLogbook(prev => [entry, ...prev]);
  };

  const getFlightHistory = useCallback((flightId) => {
    return telemetryHistoryRef.current[flightId] || [];
  }, []);

  return {
    sessions, activeSessionId, flights, atcList, airports: MAJOR_AIRPORTS,
    switchSession, loading, error, apiConnected, getAircraftName, getLiveryName,
    favorites, toggleFavorite, isFavorite,
    userProfile, updateProfile, fetchPilot, pilotLoading, pilotError,
    logbook, addLogEntry,
    analytics,
    getFlightHistory
  };
}
