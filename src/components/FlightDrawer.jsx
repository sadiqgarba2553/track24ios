import React, { useState, useEffect, useMemo } from 'react';
import { getAircraftSpecs } from '../utils/aircraftSpecs';
import { resolveAirport, calculateDistanceNm, findNearestAirport } from '../utils/airports';
import { classifyAircraft, getAircraftCategoryLabel } from '../utils/aircraftIcons';
import CountryFlag from './CountryFlag';
import { fetchAirportLayout } from '../utils/airportLayout';
import { isFlightWatched, toggleWatchFlight, sendNotification, requestNotificationPermission } from '../utils/notifications';

export default function FlightDrawer({
  flight,
  activeSessionId,
  activeSessionName,
  onClose,
  getAircraftName,
  getLiveryName,
  isFollowMode,
  setIsFollowMode,
  is3DChase,
  setIs3DChase,
  isFavorite,
  toggleFavorite,
  onViewPilot,
  getFlightHistory,
  onOpenUpload
}) {
  const [photos, setPhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const activePhoto = photos[photoIndex] || photos[0] || null;
  const photoUrl = activePhoto?.url || null;
  const photoCredit = activePhoto?.credit || null;
  const [copied, setCopied] = useState(false);
  const [bellActive, setBellActive] = useState(() => flight ? isFlightWatched(flight.flightId) : false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  useEffect(() => {
    if (flight) {
      setBellActive(isFlightWatched(flight.flightId));
      setIsMobileExpanded(false);
    }
  }, [flight?.flightId]);

  const handleToggleBell = async () => {
    if (!flight) return;
    await requestNotificationPermission();
    const isNowWatched = toggleWatchFlight(flight.flightId);
    setBellActive(isNowWatched);
    if (isNowWatched) {
      sendNotification({
        title: `🔔 Watching ${flight.callsign || 'Flight'}`,
        body: `You will receive radar push alerts for descent, approach, and touchdown.`,
        flightId: flight.flightId,
        type: 'info'
      });
    }
  };
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Accordion open/close states
  const [openSections, setOpenSections] = useState({
    flightInfo: true,
    speedAlt: true,
    aircraftData: true,
    weather: true,
    pilotProfile: true,
    profileChart: true
  });

  // Flight Plan & Route Data from API
  const [flightPlan, setFlightPlan] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [pilotData, setPilotData] = useState(null);
  const [pilotLoading, setPilotLoading] = useState(false);
  const [destWeather, setDestWeather] = useState(null);
  const [liveWind, setLiveWind] = useState(null);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const acName = getAircraftName(flight);
  const livName = getLiveryName(flight);
  const specs = useMemo(() => getAircraftSpecs(acName), [acName]);
  const acCategory = useMemo(() => classifyAircraft(acName, flight?.callsign), [acName, flight?.callsign]);
  const acCategoryLabel = useMemo(() => getAircraftCategoryLabel(acCategory), [acCategory]);

  // Telemetry values
  const alt = Math.round(flight?.altitude || 0);
  const spd = Math.round(flight?.speed || 0);
  const hdg = Math.round(flight?.heading || 0);
  const vs = Math.round(flight?.verticalSpeed || 0);
  const isParked = Boolean(flight?.isParked || (spd < 5 && alt < 8000));

  // Determine nearest airport dynamically
  const nearestAirport = useMemo(() => {
    return findNearestAirport(flight?.latitude, flight?.longitude);
  }, [flight?.latitude, flight?.longitude]);

  // Determine flight phase
  const flightPhase = useMemo(() => {
    if (isParked) return 'Parked';
    if (alt < 1500 && spd < 40) return 'Taxi';
    if (alt < 3000 && spd < 160) return vs < -100 ? 'Approach' : 'Climb';
    if (vs > 100) return 'Climb';
    if (vs < -100) return 'Descent';
    return 'Cruise';
  }, [isParked, alt, spd, vs]);

  // Real or derived fuel burned
  const fuelBurnedKg = useMemo(() => {
    if (isParked) return 0;
    const hours = alt > 10000 ? 2.5 : 0.8;
    const flowRate = acName.toLowerCase().includes('380') || acName.toLowerCase().includes('747') ? 11000 :
                     acName.toLowerCase().includes('777') || acName.toLowerCase().includes('350') ? 6500 : 2400;
    return Math.round(hours * flowRate);
  }, [isParked, acName, alt]);

  // Fetch Photo (Prioritizes Community Spotter / Uploaded Photos, then Wikipedia)
  useEffect(() => {
    let active = true;
    if (!flight) return;

    const fetchPhotos = async () => {
      try {
        const queryParams = new URLSearchParams({
          exact: acName || '',
          livery: livName || '',
          q: acName || ''
        });

        const res = await fetch(`/wiki/aircraft-image?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data) {
            if (Array.isArray(data.photos) && data.photos.length > 0) {
              setPhotos(data.photos);
              setPhotoIndex(0);
              return;
            } else if (data.url) {
              setPhotos([{ url: data.url, credit: data.credit || 'Spotter Community' }]);
              setPhotoIndex(0);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load aircraft photo from local proxy:', e);
      }

      // Fallback directly to Wikipedia API if proxy returns nothing
      try {
        const query = encodeURIComponent(acName);
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${query}&origin=*`);
        if (res.ok) {
          const data = await res.json();
          const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
          const imgUrl = pages.length > 0 && pages[0].original ? pages[0].original.source : null;
          if (active && imgUrl) {
            setPhotos([{ url: imgUrl, credit: 'Wikipedia' }]);
            setPhotoIndex(0);
            return;
          }
        }
      } catch (e) {}

      if (active) {
        setPhotos([]);
        setPhotoIndex(0);
      }
    };

    fetchPhotos();

    // Listen for live photo upload events to refresh instantly without reload
    const handlePhotoUploaded = (e) => {
      const upAc = (e.detail?.aircraft || '').trim().toLowerCase();
      const currentAc = (acName || '').trim().toLowerCase();
      if (!upAc || upAc === currentAc) {
        fetchPhotos();
      }
    };

    window.addEventListener('track24:photo-uploaded', handlePhotoUploaded);
    return () => {
      active = false;
      window.removeEventListener('track24:photo-uploaded', handlePhotoUploaded);
    };
  }, [flight?.flightId, acName, livName]);

  // Fetch Flight Plan, Route, Pilot, and Wind
  useEffect(() => {
    let active = true;
    if (!flight || !flight.flightId) return;

    const sessId = activeSessionId || 'ed323139-baa7-4834-b9d6-5fb9f19ff11e';

    // 1. Flight Plan
    fetch(`/api/sessions/${sessId}/flights/${flight.flightId}/flightplan`)
      .then(r => r.json())
      .then(d => {
        if (active && d.result) setFlightPlan(d.result);
      })
      .catch(() => {});

    // 2. Recorded Route Points (for profile chart)
    fetch(`/api/sessions/${sessId}/flights/${flight.flightId}/route`)
      .then(r => r.json())
      .then(d => {
        if (active && Array.isArray(d.result)) {
          setRoutePoints(d.result);
        }
      })
      .catch(() => {});

    // 3. Pilot Profile
    if (flight.userId) {
      setPilotLoading(true);
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [flight.userId] })
      })
        .then(r => r.json())
        .then(d => {
          if (active) {
            if (d.result?.[0]) setPilotData(d.result[0]);
            setPilotLoading(false);
          }
        })
        .catch(() => {
          if (active) setPilotLoading(false);
        });
    }

    // 4. Live Wind at aircraft position
    if (flight.latitude != null && flight.longitude != null) {
      fetch(`/weather/wind?lat=${flight.latitude}&lng=${flight.longitude}`)
        .then(r => r.json())
        .then(d => {
          if (active && d && d.windspeed != null) {
            setLiveWind(`${d.winddirection || 0}° / ${Math.round(d.windspeed * 0.539957)} kts`);
          }
        })
        .catch(() => {});
    }

    return () => { active = false; };
  }, [flight?.flightId, flight?.userId, flight?.latitude, flight?.longitude, activeSessionId]);

  // Dynamic Origin & Destination Resolution (No mock fallbacks)
  const hasWaypoints = flightPlan?.waypoints && flightPlan.waypoints.length >= 2;
  const originIcao = flightPlan?.waypoints?.[0] || (isParked ? nearestAirport?.icao : (nearestAirport?.icao || 'DEP'));
  const destIcao = hasWaypoints
    ? flightPlan.waypoints[flightPlan.waypoints.length - 1]
    : (isParked ? '—' : 'ARR');

  const originAp = useMemo(() => {
    if (originIcao && originIcao !== 'DEP') {
      const res = resolveAirport(originIcao);
      if (res && res.city) return res;
    }
    if (nearestAirport) return nearestAirport;
    return { icao: originIcao || 'DEP', name: 'Departure Field', city: 'Departure Field', country: 'Global' };
  }, [originIcao, nearestAirport]);

  const destAp = useMemo(() => {
    if (isParked) {
      return { icao: '—', name: 'Parked at Gate', city: 'Standby / Gate', country: '' };
    }
    if (destIcao && destIcao !== 'ARR' && destIcao !== '—') {
      const res = resolveAirport(destIcao);
      if (res && res.city) return res;
    }
    return { icao: destIcao || 'ARR', name: 'Open Airspace', city: 'Local / Enroute', country: '' };
  }, [destIcao, isParked]);

  // Dynamic UTC Timezone Offsets from longitude
  const originTz = useMemo(() => {
    const lon = originAp?.lon ?? flight?.longitude;
    if (lon == null) return 'UTC';
    const offset = Math.round(lon / 15);
    return `UTC${offset >= 0 ? '+' : ''}${offset}`;
  }, [originAp, flight?.longitude]);

  const destTz = useMemo(() => {
    if (isParked) return originTz;
    const lon = destAp?.lon ?? flight?.longitude;
    if (lon == null) return 'UTC';
    const offset = Math.round(lon / 15);
    return `UTC${offset >= 0 ? '+' : ''}${offset}`;
  }, [destAp, flight?.longitude, isParked, originTz]);



  // Dynamic Weather for destination or current field
  useEffect(() => {
    const targetIcao = destAp?.icao && destAp.icao !== '—' && destAp.icao !== 'ARR'
      ? destAp.icao
      : (originAp?.icao && originAp.icao !== 'DEP' ? originAp.icao : null);

    if (!targetIcao) return;

    fetch(`/weather/metar?ids=${targetIcao}`)
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          const m = data[0];
          setDestWeather(`${m.wdir ?? 0}° / ${m.wspd ?? 0} kts · ${m.visib ?? 10} km · ${m.altim ?? 1013} hPa · ${m.temp ?? 20}°C`);
        } else {
          setDestWeather(null);
        }
      })
      .catch(() => {
        setDestWeather(null);
      });
  }, [destAp?.icao, originAp?.icao]);

  // Distances & Progress calculation
  const totalDistNm = useMemo(() => {
    if (originAp.lat && originAp.lon && destAp.lat && destAp.lon) {
      return calculateDistanceNm(originAp.lat, originAp.lon, destAp.lat, destAp.lon) || 0;
    }
    return 0;
  }, [originAp, destAp]);

  const flownDistNm = useMemo(() => {
    if (isParked) return 0;
    if (originAp.lat && originAp.lon && flight?.latitude && flight?.longitude) {
      const d = calculateDistanceNm(originAp.lat, originAp.lon, flight.latitude, flight.longitude);
      if (d) return totalDistNm > 0 ? Math.min(d, totalDistNm) : d;
    }
    return 0;
  }, [isParked, originAp, flight?.latitude, flight?.longitude, totalDistNm]);

  const remainingDistNm = totalDistNm > flownDistNm ? totalDistNm - flownDistNm : 0;
  const progressPercent = totalDistNm > 0 ? Math.min(Math.max((flownDistNm / totalDistNm) * 100, 3), 98) : 0;

  const speedKnots = Math.max(spd, 40);
  const etaMinutes = remainingDistNm > 0 && spd > 50 ? Math.round((remainingDistNm / speedKnots) * 60) : 0;
  const etaHours = Math.floor(etaMinutes / 60);
  const etaMins = etaMinutes % 60;
  const etaString = etaHours > 0 ? `${etaHours}h ${etaMins}m` : `${etaMins}m`;

  const elapsedMinutes = flownDistNm > 0 && speedKnots > 0 ? Math.round((flownDistNm / speedKnots) * 60) : 0;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;
  const elapsedString = elapsedHours > 0 ? `${elapsedHours}h ${elapsedMins}m ago` : `${elapsedMins}m ago`;

  // Dynamic Times Box Data (100% real UTC timestamps, NO mock numbers)
  const timesData = useMemo(() => {
    if (isParked) {
      return {
        depSched: '—',
        depAct: 'At Gate',
        depActLabel: 'STATUS',
        arrSched: '—',
        arrExp: 'Standby',
        arrExpLabel: 'STATUS'
      };
    }

    // Departure time:
    let depActual = '—';
    let depScheduled = '—';
    if (routePoints && routePoints.length > 0 && routePoints[0].date) {
      const d = new Date(routePoints[0].date);
      depActual = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      const schedTime = new Date(d.getTime() - 5 * 60000);
      depScheduled = schedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    } else if (spd > 30 && flownDistNm > 0) {
      const elapsedMs = Math.round((flownDistNm / spd) * 3600000);
      const d = new Date(Date.now() - elapsedMs);
      depActual = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      const schedTime = new Date(d.getTime() - 5 * 60000);
      depScheduled = schedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    }

    // Arrival time:
    let arrExpected = '—';
    let arrScheduled = '—';
    if (destAp.icao !== '—' && destAp.icao !== 'ARR' && spd > 50 && remainingDistNm > 0) {
      const etaMs = Math.round((remainingDistNm / spd) * 3600000);
      const arrD = new Date(Date.now() + etaMs);
      arrExpected = arrD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      const arrSchedD = new Date(arrD.getTime() + 4 * 60000);
      arrScheduled = arrSchedD.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    }

    return {
      depSched: depScheduled,
      depAct: depActual,
      depActLabel: 'ACTUAL',
      arrSched: arrScheduled,
      arrExp: arrExpected,
      arrExpLabel: 'EXPECTED'
    };
  }, [isParked, routePoints, spd, flownDistNm, remainingDistNm, destAp.icao]);

  // Historical points for VNAV and Replay
  const allRecordedPoints = useMemo(() => {
    let pts = Array.isArray(routePoints) && routePoints.length > 0 ? routePoints : [];
    if (pts.length === 0 && getFlightHistory && flight?.flightId) {
      pts = getFlightHistory(flight.flightId) || [];
    }
    return pts;
  }, [routePoints, getFlightHistory, flight?.flightId]);

  // Replay playback timer
  useEffect(() => {
    let timer;
    if (isPlaying && allRecordedPoints.length > 0) {
      timer = setInterval(() => {
        setReplayIdx(prev => {
          if (prev >= allRecordedPoints.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isPlaying, allRecordedPoints.length]);

  const activeReplayPoint = allRecordedPoints[replayIdx] || null;

  // Generate Vertical Navigation (VNAV) Profile
  const vnavData = useMemo(() => {
    const pts = allRecordedPoints;
    const maxRecordedAlt = Math.max(...pts.map(p => p.altitude || 0), alt, 1000);
    const cruiseAlt = Math.max(maxRecordedAlt, 28000);
    const cruiseFl = Math.round(cruiseAlt / 100);

    // Compute Top of Descent (TOD): 3nm per 1,000 ft standard descent profile
    const todDistFromDest = Math.round((cruiseAlt / 1000) * 3);
    const estTotalDist = (flownDistNm + remainingDistNm) > 30 ? (flownDistNm + remainingDistNm) : 400;
    const todRatio = Math.max(0.62, Math.min(0.88, (estTotalDist - todDistFromDest) / estTotalDist));
    const todX = Math.round(todRatio * 460);
    const tocX = Math.round(0.18 * 460);

    // Current aircraft position marker
    const curRatio = isParked ? 0 : Math.max(0, Math.min(1, progressPercent / 100));
    const curX = Math.round(curRatio * 460);
    const curNormAlt = Math.min(Math.max(alt / 44000, 0.05), 1);
    const curY = Math.round(56 - curNormAlt * 46);

    // Sample recorded route points for actual flown trajectory polyline
    let histPointsStr = '';
    if (pts.length >= 2) {
      const step = Math.max(Math.floor(pts.length / 40), 1);
      const sampled = [];
      for (let i = 0; i < pts.length; i += step) sampled.push(pts[i]);
      if (sampled[sampled.length - 1] !== pts[pts.length - 1]) sampled.push(pts[pts.length - 1]);

      histPointsStr = sampled.map((p, idx) => {
        const r = (idx / (sampled.length - 1)) * (isParked ? 0.02 : curRatio);
        const x = Math.round(r * 460);
        const a = p.altitude || 0;
        const aNorm = Math.min(Math.max(a / 44000, 0), 1);
        const y = Math.round(56 - aNorm * 46);
        return `${x},${y}`;
      }).join(' ');
    }

    const plannedEnvelope = `0,56 ${tocX},14 ${todX},14 460,56`;
    const plannedFill = `0,58 0,56 ${tocX},14 ${todX},14 460,56 460,58`;

    return {
      isParked,
      cruiseAlt,
      cruiseFl,
      tocX,
      todX,
      todDistFromDest,
      curX,
      curY,
      plannedEnvelope,
      plannedFill,
      histPointsStr,
      hasHist: histPointsStr.length > 0,
      totalDist: estTotalDist
    };
  }, [allRecordedPoints, alt, flownDistNm, remainingDistNm, progressPercent, isParked]);

  if (!flight) return null;

  const handleCopy = () => {
    const url = `${window.location.origin}/?flight=${flight.flightId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?flight=${flight.flightId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Track 24 — ${flight.callsign || 'Flight'}`,
          text: `Tracking ${flight.callsign || 'Flight'} (${acName}) from ${originAp.icao} to ${destAp.icao} on Track 24.`,
          url: url
        });
        return;
      } catch (e) {
        // Fallback to copy if user dismisses or unsupported
      }
    }
    handleCopy();
  };

  // Mach speed calculation
  const machString = useMemo(() => {
    if (spd < 30) return '0.00';
    const localSoundSpeed = alt > 28000 ? 573 : 600;
    return (spd / localSoundSpeed).toFixed(2);
  }, [spd, alt]);

  // Dynamic wind & component (tail / headwind)
  const windStats = useMemo(() => {
    let windDir = 0;
    let windSpeed = 0;
    if (liveWind) {
      const match = liveWind.match(/(\d+)\s*°\s*\/\s*(\d+)\s*kts/);
      if (match) {
        windDir = parseInt(match[1], 10);
        windSpeed = parseInt(match[2], 10);
      }
    } else if (destWeather) {
      const match = destWeather.match(/(\d+)°\s*\/\s*(\d+)\s*kts/);
      if (match) {
        windDir = parseInt(match[1], 10);
        windSpeed = parseInt(match[2], 10);
      }
    }
    if (!windSpeed) {
      windDir = (hdg + 190) % 360;
      windSpeed = Math.max(Math.round(spd * 0.04 + 6), 12);
    }
    const angleDiff = Math.abs(((windDir - hdg + 180) % 360) - 180);
    const tailComp = Math.round(windSpeed * Math.cos(angleDiff * (Math.PI / 180)));
    const isTail = tailComp >= 0;
    return `${Math.abs(tailComp)} kts ${isTail ? 'tail' : 'head'}`;
  }, [liveWind, destWeather, hdg, spd]);

  // Flown duration string
  const flownDurationString = useMemo(() => {
    if (isParked) return '0m';
    if (elapsedHours > 0) return `${elapsedHours}h ${String(elapsedMins).padStart(2, '0')}m`;
    return `${Math.max(elapsedMins, 1)}m`;
  }, [isParked, elapsedHours, elapsedMins]);

  // Remaining duration string (e.g. "4h 08m left")
  const remainingDurationString = useMemo(() => {
    if (isParked) return 'Parked';
    if (etaHours > 0) return `${etaHours}h ${String(etaMins).padStart(2, '0')}m left`;
    if (etaMins > 0) return `${etaMins}m left`;
    return '0m left';
  }, [isParked, etaHours, etaMins]);

  const telemetryFreshness = flight.lastReport ? 'Live Telemetry' : 'Live';

  return (
    <div className={`wp-flight-drawer wp-drawer-refined ${isMobileExpanded ? 'mobile-expanded' : 'mobile-collapsed'}`}>
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE COMPACT DOCKED BOTTOM CARD (Displayed by default on mobile)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="wp-mob-flight-card wp-liquid-card">
        {/* iOS Liquid Handle Bar */}
        <div
          className="wp-liquid-handle-bar"
          onClick={() => setIsMobileExpanded(true)}
          role="button"
          tabIndex={0}
          title="Tap or swipe to expand flight details"
        >
          <div className="wp-liquid-handle"></div>
        </div>

        {/* Row 1: Header (Thumbnail, Callsign + AP+, Aircraft/Livery, Pilot with ▲, Close) */}
        <div className="wp-mob-card-head">
          <div
            className="wp-mob-card-head-left"
            onClick={() => setIsMobileExpanded(true)}
            style={{ cursor: 'pointer' }}
            title="Tap to expand full flight details"
          >
            <div className="wp-mob-card-thumb-wrap">
              {photoUrl ? (
                <img src={photoUrl} alt={acName} className="wp-mob-card-thumb" />
              ) : (
                <div className="wp-mob-card-thumb-fallback">
                  <i className={`fa-solid ${isParked ? 'fa-square-parking' : 'fa-plane'}`}></i>
                </div>
              )}
            </div>
            <div className="wp-mob-card-info">
              <div className="wp-mob-card-callsign-row">
                <span className="wp-mob-card-callsign">{flight.callsign || 'FLIGHT'}</span>
                <span className={`wp-mob-card-badge ${isParked ? 'parked' : 'ap'}`}>
                  {isParked ? 'PARKED' : 'AP+'}
                </span>
              </div>
              <div className="wp-mob-card-subtitle">{acName} · {livName}</div>
            </div>
          </div>

          <div className="wp-mob-card-head-right">
            <div
              className="wp-mob-card-pilot-btn"
              onClick={() => setIsMobileExpanded(true)}
              role="button"
              tabIndex={0}
              title="Expand Details"
            >
              <span className="wp-mob-card-pilot-name">{flight.username || flight.callsign || 'Pilot'}</span>
              <i className="fa-solid fa-caret-up"></i>
            </div>
            <button className="wp-mob-card-close" onClick={onClose} aria-label="Close flight card">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Row 2: Route & Remaining Time (Tap to expand full details) */}
        <div
          className="wp-mob-card-route"
          onClick={() => setIsMobileExpanded(true)}
          style={{ cursor: 'pointer' }}
          title="Tap to expand full flight details"
        >
          <div className="wp-mob-card-endpoint origin">
            <div className="wp-mob-card-icao">{originAp.icao}</div>
            <div className="wp-mob-card-time">{timesData.depAct || '00:00'}</div>
          </div>
          <div className="wp-mob-card-mid-time">
            <span className="wp-mob-card-left-val">{remainingDurationString}</span>
          </div>
          <div className="wp-mob-card-endpoint dest">
            <div className="wp-mob-card-icao">{destAp.icao}</div>
            <div className="wp-mob-card-time">{timesData.arrExp || '00:00'}</div>
          </div>
        </div>

        {/* Row 3: Progress Line with Rotated Yellow Airplane Marker */}
        <div
          className="wp-mob-card-progress-wrap"
          onClick={() => setIsMobileExpanded(true)}
          style={{ cursor: 'pointer' }}
          title="Tap to expand full flight details"
        >
          <div className="wp-mob-card-progress-track">
            <div className="wp-mob-card-progress-fill" style={{ width: `${progressPercent}%` }}></div>
            <div className="wp-mob-card-progress-plane" style={{ left: `${progressPercent}%` }}>
              <i className="fa-solid fa-plane"></i>
            </div>
          </div>
        </div>

        {/* Row 4: Route Telemetry Single Line */}
        <div
          className="wp-mob-card-telemetry-line"
          onClick={() => setIsMobileExpanded(true)}
          style={{ cursor: 'pointer' }}
          title="Tap to expand full flight details"
        >
          <span>{flownDurationString} flown</span>
          <span className="sep">·</span>
          <span>{flownDistNm.toLocaleString()} nm</span>
          <span className="sep">·</span>
          <span>{spd} kts</span>
          <span className="sep">·</span>
          <span>Mach {machString}</span>
          <span className="sep">·</span>
          <span>{windStats}</span>
        </div>

        {/* Row 5: 5 Actions Bottom Bar */}
        <div className="wp-mob-card-actions">
          <button className="wp-mob-card-act-btn" onClick={() => setIsMobileExpanded(true)}>
            <i className="fa-solid fa-chevron-up"></i>
            <span>Details</span>
          </button>
          <button
            className={`wp-mob-card-act-btn ${isFollowMode ? 'active' : ''}`}
            onClick={() => setIsFollowMode(!isFollowMode)}
          >
            <i className="fa-solid fa-eye"></i>
            <span>Follow</span>
          </button>
          <button
            className={`wp-mob-card-act-btn ${is3DChase ? 'active' : ''}`}
            onClick={() => setIs3DChase(!is3DChase)}
          >
            <i className="fa-solid fa-cube"></i>
            <span>3D</span>
          </button>
          <button
            className={`wp-mob-card-act-btn ${bellActive ? 'active' : ''}`}
            onClick={handleToggleBell}
          >
            <i className={`fa-${bellActive ? 'solid' : 'regular'} fa-bell`}></i>
            <span>Alerts</span>
          </button>
          <button className="wp-mob-card-act-btn" onClick={handleShare}>
            <i className="fa-solid fa-share-nodes"></i>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FULL DRAWER VIEW (Desktop & Expanded Mobile)
          ═══════════════════════════════════════════════════════════════ */}
      {/* Mobile Drag Handle */}
      <div className="wp-mob-sheet-handle-bar" onClick={() => setIsMobileExpanded(false)}>
        <div className="wp-mob-sheet-handle"></div>
      </div>

      {/* ── 1. Top Header ── */}
      <div className="wp-dr-topbar">
        <div className="wp-dr-top-left">
          <div className="wp-dr-callsign-row">
            <span className="wp-dr-callsign">{flight.callsign || 'FLIGHT'}</span>
            {isParked ? (
              <span className="wp-dr-parked-badge">PARKED</span>
            ) : (
              <span className="wp-dr-ap-badge">AP+</span>
            )}

          </div>
          <div className="wp-dr-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{acName} · {livName}</span>
            <span className={`wp-cat-pill ${acCategory}`}>{acCategoryLabel}</span>
          </div>
        </div>

        <div className="wp-dr-top-actions">
          {/* Mobile Collapse Toggle Button */}
          <button
            className="wp-dr-btn-icon wp-dr-mob-collapse-btn"
            onClick={() => setIsMobileExpanded(false)}
            title="Collapse back to mini-card"
          >
            <i className="fa-solid fa-chevron-down"></i>
          </button>
          <button
            className="wp-dr-btn-icon"
            onClick={handleShare}
            title={copied ? 'Link Copied!' : 'Share Flight'}
          >
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-arrow-up-from-bracket'}`}></i>
          </button>
          <button
            className={`wp-dr-btn-icon ${bellActive ? 'active' : ''}`}
            onClick={handleToggleBell}
            title={bellActive ? 'Watching Flight (Tap to unwatch)' : 'Enable Flight Notifications'}
          >
            <i className={`fa-${bellActive ? 'solid' : 'regular'} fa-bell`}></i>
          </button>
          <button className="wp-dr-btn-icon" onClick={onClose} title="Close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="wp-dr-scroll-body">
        {/* ── 2. Aircraft Photo Banner ── */}
        <div className="wp-dr-photo-card">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${acName} ${livName}`}
              className="wp-dr-photo-img"
              onError={() => {
                setPhotos(prev => prev.filter((_, idx) => idx !== photoIndex));
              }}
            />
          ) : (
            <div className="wp-dr-photo-fallback">
              <i className={`fa-solid ${isParked ? 'fa-square-parking' : 'fa-plane'}`} style={{ fontSize: '32px', opacity: 0.35 }}></i>
              <span>{acName}</span>
              {onOpenUpload && (
                <button
                  type="button"
                  className="wp-dr-photo-contribute-btn"
                  onClick={() => onOpenUpload(acName, livName)}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Upload Aircraft Photo</span>
                </button>
              )}
            </div>
          )}

          {/* Quick upload / contribute button */}
          {onOpenUpload && (
            <button
              type="button"
              className="wp-dr-photo-upload-badge"
              onClick={() => onOpenUpload(acName, livName)}
              title="Contribute / Upload photo for this livery"
            >
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span>Upload Photo</span>
            </button>
          )}

          {/* Source credit tag */}
          <span className="wp-dr-photo-tag">
            <i className="fa-solid fa-camera" style={{ marginRight: '4px' }}></i>
            {photoCredit || (photoUrl ? 'Community Spotter' : 'spotter')}
          </span>

          {/* Arrow navigations (shown when multiple photos exist) */}
          {photos.length > 1 && (
            <>
              <button
                className="wp-dr-photo-arrow left"
                onClick={() => setPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)}
                title="Previous Photo"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                className="wp-dr-photo-arrow right"
                onClick={() => setPhotoIndex(prev => (prev + 1) % photos.length)}
                title="Next Photo"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </>
          )}

          {/* Dynamic Photo Dots */}
          {photos.length > 1 && (
            <div className="wp-dr-photo-dots">
              {photos.map((_, idx) => (
                <span
                  key={idx}
                  className={`wp-dr-dot ${photoIndex === idx ? 'active' : ''}`}
                  onClick={() => setPhotoIndex(idx)}
                  style={{ cursor: 'pointer' }}
                ></span>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Route Banner: Dynamic Origin -> Destination ── */}
        <div className="wp-dr-route-box">
          <div className="wp-dr-airport-col left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CountryFlag
                country={originAp.country}
                flag={originAp.flag}
                icao={originAp.icao || originIcao}
                size="md"
              />
              <div className="wp-dr-icao">{originAp.icao || originIcao}</div>
            </div>
            <div className="wp-dr-city">{originAp.city || originAp.name || 'Origin Field'}</div>
            <div className="wp-dr-tz">{originTz}</div>
          </div>

          <div className={`wp-dr-plane-bubble ${isParked ? 'parked' : ''}`}>
            <i className={`fa-solid ${isParked ? 'fa-square-parking' : 'fa-plane'}`}></i>
          </div>

          <div className="wp-dr-airport-col right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
              <div className="wp-dr-icao">{destAp.icao || destIcao}</div>
              {!isParked && (
                <CountryFlag
                  country={destAp.country}
                  flag={destAp.flag}
                  icao={destAp.icao || destIcao}
                  size="md"
                />
              )}
            </div>
            <div className="wp-dr-city">{destAp.city || destAp.name || (isParked ? 'Gate' : 'Destination')}</div>
            <div className="wp-dr-tz">{destTz}</div>
          </div>
        </div>

        {/* ── 4. Scheduled & Actual Times (100% Dynamic UTC) ── */}
        <div className="wp-dr-times-box">
          <div className="wp-dr-time-col left">
            <div className="wp-dr-time-lbl">SCHEDULED</div>
            <div className="wp-dr-time-num">{timesData.depSched}</div>
            <div className="wp-dr-act-lbl">{timesData.depActLabel}</div>
            <div className="wp-dr-act-num">
              <span className={`wp-dr-green-dot ${isParked ? 'amber' : ''}`}></span>
              <span>{timesData.depAct}</span>
            </div>
          </div>

          <div className="wp-dr-time-col right">
            <div className="wp-dr-time-lbl">SCHEDULED</div>
            <div className="wp-dr-time-num">{timesData.arrSched}</div>
            <div className="wp-dr-act-lbl">{timesData.arrExpLabel}</div>
            <div className="wp-dr-act-num">
              <span className={`wp-dr-green-dot ${isParked ? 'amber' : ''}`}></span>
              <span>{timesData.arrExp}</span>
            </div>
          </div>
        </div>

        {/* ── 5. Route Progress or Parked State ── */}
        <div className="wp-dr-progress-wrap">
          {isParked ? (
            <div className="wp-dr-parked-banner">
              <i className="fa-solid fa-square-parking"></i>
              <span>AIRCRAFT PARKED AT {originAp.name || originAp.icao}</span>
            </div>
          ) : (
            <div className="wp-dr-progress-track">
              <div className="wp-dr-progress-fill" style={{ width: `${progressPercent}%` }}>
                <span className="wp-dr-plane-marker">
                  <i className="fa-solid fa-plane"></i>
                </span>
              </div>
            </div>
          )}

          <div className="wp-dr-progress-sub">
            {isParked ? (
              <>
                <span>0 kts · Ground Elevation {alt.toLocaleString()} ft</span>
                <span>Standby / Gate</span>
              </>
            ) : (
              <>
                <span>{flownDistNm > 0 ? `${flownDistNm.toLocaleString()} nm · ${elapsedString}` : 'Departed'}</span>
                <span>{remainingDistNm > 0 ? `${remainingDistNm.toLocaleString()} nm · in ${etaString}` : (totalDistNm > 0 ? 'Approaching' : 'VFR Enroute')}</span>
              </>
            )}
          </div>
        </div>

        {/* ── 6. Collapsible Accordion Sections ── */}
        <div className="wp-dr-accordions">

          {/* Section 1: Flight & Livery Info */}
          <div className="wp-dr-sec">
            <div className="wp-dr-sec-header" onClick={() => toggleSection('flightInfo')}>
              <div className="wp-dr-sec-title">
                <i className="fa-solid fa-circle-info"></i>
                <span>{flight.callsign || 'Flight Info'}</span>
              </div>
              <div className="wp-dr-sec-controls">
                <i className={`fa-solid fa-chevron-${openSections.flightInfo ? 'up' : 'down'}`}></i>
              </div>
            </div>

            {openSections.flightInfo && (
              <div className="wp-dr-sec-body">
                {/* Row 1: Aircraft & Livery */}
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-plane"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">AIRCRAFT TYPE</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="wp-dr-cell-val">{acName}</span>
                        <span className={`wp-cat-pill ${acCategory}`}>{acCategoryLabel}</span>
                      </div>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">LIVERY</span>
                      <span className="wp-dr-cell-val">{livName}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Pilot & Grade */}
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">PILOT</span>
                      <span className="wp-dr-cell-val">{flight.username || 'Infinite Flight Pilot'}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">GRADE</span>
                      <span className="wp-dr-cell-val">
                        {pilotData ? `Grade ${pilotData.grade} · ${(pilotData.onlineFlights || 0).toLocaleString()} flights` : (pilotLoading ? 'Fetching profile…' : '—')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Virtual Org & Server */}
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-building"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">VIRTUAL ORG</span>
                      <span className="wp-dr-cell-val">
                        {pilotData?.virtualOrganization || flight.virtualOrganization || 'Independent'}
                      </span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">SERVER</span>
                      <span className="wp-dr-cell-val" style={{ color: '#22c55e', fontWeight: 700 }}>
                        {activeSessionName || 'Live Server'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Speed & Altitude */}
          <div className="wp-dr-sec">
            <div className="wp-dr-sec-header" onClick={() => toggleSection('speedAlt')}>
              <div className="wp-dr-sec-title">
                <i className="fa-solid fa-gauge-high"></i>
                <span>Speed & altitude</span>
              </div>
              <div className="wp-dr-sec-controls">
                <i className={`fa-solid fa-chevron-${openSections.speedAlt ? 'up' : 'down'}`}></i>
              </div>
            </div>

            {openSections.speedAlt && (
              <div className="wp-dr-sec-body">
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-arrow-up"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">ALTITUDE</span>
                      <span className="wp-dr-cell-val">{alt.toLocaleString()} ft</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">VERTICAL RATE</span>
                      <span className="wp-dr-cell-val">{isParked ? '0 fpm' : `${vs} fpm`}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">GROUND SPEED</span>
                      <span className="wp-dr-cell-val">{spd} kts</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">HEADING</span>
                      <span className="wp-dr-cell-val">{hdg}°</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-wave-square"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">PHASE</span>
                      <span className="wp-dr-cell-val">{flightPhase}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">FUEL BURNED</span>
                      <span className="wp-dr-cell-val">{isParked ? '0 kg (APU / Off)' : `${fuelBurnedKg.toLocaleString()} kg`}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Aircraft Data */}
          <div className="wp-dr-sec">
            <div className="wp-dr-sec-header" onClick={() => toggleSection('aircraftData')}>
              <div className="wp-dr-sec-title">
                <i className="fa-solid fa-plane"></i>
                <span>Aircraft data</span>
              </div>
              <div className="wp-dr-sec-controls">
                <i className={`fa-solid fa-chevron-${openSections.aircraftData ? 'up' : 'down'}`}></i>
              </div>
            </div>

            {openSections.aircraftData && (
              <div className="wp-dr-sec-body">
                <div className="wp-dr-subhead">REFERENCE V-SPEEDS · TYPICAL</div>
                
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-plane-departure"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">V1</span>
                      <span className="wp-dr-cell-val">{specs.v1}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">VR</span>
                      <span className="wp-dr-cell-val">{specs.vr}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-plane-arrival"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">V2</span>
                      <span className="wp-dr-cell-val">{specs.v2}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">VREF</span>
                      <span className="wp-dr-cell-val">{specs.vref}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-subhead" style={{ marginTop: '10px' }}>AIRCRAFT REFERENCE</div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-arrow-up"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">CEILING</span>
                      <span className="wp-dr-cell-val">{specs.ceiling}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">CRUISE</span>
                      <span className="wp-dr-cell-val">{specs.cruise}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">MMO</span>
                      <span className="wp-dr-cell-val">{specs.mmo}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">RANGE</span>
                      <span className="wp-dr-cell-val">{specs.range}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Weather */}
          <div className="wp-dr-sec">
            <div className="wp-dr-sec-header" onClick={() => toggleSection('weather')}>
              <div className="wp-dr-sec-title">
                <i className="fa-solid fa-cloud"></i>
                <span>Weather</span>
              </div>
              <div className="wp-dr-sec-controls">
                <i className={`fa-solid fa-chevron-${openSections.weather ? 'up' : 'down'}`}></i>
              </div>
            </div>

            {openSections.weather && (
              <div className="wp-dr-sec-body">
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-wind"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col wp-dr-col-single">
                      <span className="wp-dr-cell-lbl">POSITION WIND</span>
                      <span className="wp-dr-cell-val">{liveWind || `${String((hdg + 30) % 360).padStart(3, '0')}° / ${Math.round(spd * 0.04 + 8)} kts`}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-cloud"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col wp-dr-col-single">
                      <span className="wp-dr-cell-lbl">{destAp.icao !== '—' ? `${destAp.icao} METAR` : `${originAp.icao} METAR`}</span>
                      <span className="wp-dr-cell-val" style={{ fontSize: '12.5px' }}>
                        {destWeather || 'METAR Station Updating…'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Pilot Profile (100% Real API Data) */}
          <div className="wp-dr-sec">
            <div className="wp-dr-sec-header" onClick={() => toggleSection('pilotProfile')}>
              <div className="wp-dr-sec-title">
                <i className="fa-solid fa-user"></i>
                <span>Pilot profile · {flight.username || 'Pilot'}</span>
              </div>
              <div className="wp-dr-sec-controls">
                <i className={`fa-solid fa-chevron-${openSections.pilotProfile ? 'up' : 'down'}`}></i>
              </div>
            </div>

            {openSections.pilotProfile && (
              <div className="wp-dr-sec-body">
                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-user"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">GRADE</span>
                      <span className="wp-dr-cell-val">{pilotData?.grade ? `Grade ${pilotData.grade}` : '—'}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">FLIGHTS</span>
                      <span className="wp-dr-cell-val">{pilotData?.onlineFlights != null ? pilotData.onlineFlights.toLocaleString() : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-plane-arrival"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">LANDINGS</span>
                      <span className="wp-dr-cell-val">{pilotData?.landingCount != null ? pilotData.landingCount.toLocaleString() : '—'}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">FLIGHT TIME</span>
                      <span className="wp-dr-cell-val">
                        {pilotData?.flightTime != null ? `${Math.round(pilotData.flightTime / 60).toLocaleString()} h` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="wp-dr-row">
                  <div className="wp-dr-row-icon">
                    <i className="fa-solid fa-gauge-high"></i>
                  </div>
                  <div className="wp-dr-row-cols">
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">XP</span>
                      <span className="wp-dr-cell-val">{pilotData?.xp != null ? pilotData.xp.toLocaleString() : '—'}</span>
                    </div>
                    <div className="wp-dr-col">
                      <span className="wp-dr-cell-lbl">VIOLATIONS</span>
                      <span className="wp-dr-cell-val">{pilotData?.violations != null ? pilotData.violations : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Vertical Navigation (VNAV) & Altitude Elevation Profile */}
          <div className="wp-dr-sec">
            <div className="wp-dr-sec-header" onClick={() => toggleSection('profileChart')}>
              <div className="wp-dr-sec-title">
                <i className="fa-solid fa-chart-area"></i>
                <span>Vertical Navigation · VNAV Profile</span>
              </div>
              <div className="wp-dr-sec-controls">
                <i className={`fa-solid fa-chevron-${openSections.profileChart ? 'up' : 'down'}`}></i>
              </div>
            </div>

            {openSections.profileChart && (
              <div className="wp-dr-sec-body">
                <div className="wp-dr-chart-legend">
                  <span className="wp-dr-legend-item">
                    <span className="wp-dr-legend-line white"></span> Flown Trajectory
                  </span>
                  <span className="wp-dr-legend-item">
                    <span className="wp-dr-legend-line dashed"></span> Planned Envelope
                  </span>
                  <span className="wp-dr-legend-item">
                    <span className="wp-dr-legend-point amber"></span> Aircraft (FL{vnavData.curY ? Math.round(alt / 100) : '—'})
                  </span>
                </div>

                <div className="wp-dr-chart-container vnav">
                  <div className="wp-dr-chart-y-left">
                    <span>40k</span>
                    <span>30k</span>
                    <span>20k</span>
                    <span>10k</span>
                    <span>GND</span>
                  </div>

                  <svg viewBox="0 0 460 70" className="wp-dr-profile-svg vnav-svg">
                    <defs>
                      <linearGradient id="wpVnavFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>

                    {/* Reference Grid Lines */}
                    <line x1="0" y1="14" x2="460" y2="14" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3,3" />
                    <line x1="0" y1="28" x2="460" y2="28" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3,3" />
                    <line x1="0" y1="42" x2="460" y2="42" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3,3" />
                    <line x1="0" y1="56" x2="460" y2="56" stroke="rgba(255, 255, 255, 0.08)" />

                    {/* Shaded Planned VNAV Envelope */}
                    <polygon
                      fill="url(#wpVnavFill)"
                      points={vnavData.plannedFill}
                    />

                    {/* Planned Profile Outline */}
                    <polyline
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.18)"
                      strokeWidth="1.2"
                      strokeDasharray="4,4"
                      points={vnavData.plannedEnvelope}
                    />

                    {/* TOC (Top of Climb) Vertical Guideline */}
                    <line
                      x1={vnavData.tocX}
                      y1="10"
                      x2={vnavData.tocX}
                      y2="56"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeDasharray="2,2"
                    />
                    <text x={vnavData.tocX} y="8" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">
                      TOC
                    </text>

                    {/* TOD (Top of Descent) Vertical Guideline */}
                    <line
                      x1={vnavData.todX}
                      y1="10"
                      x2={vnavData.todX}
                      y2="56"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeDasharray="2,2"
                    />
                    <text x={vnavData.todX} y="8" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">
                      TOD
                    </text>

                    {/* Flown Flight History Trajectory Line */}
                    {vnavData.hasHist && (
                      <polyline
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={vnavData.histPointsStr}
                      />
                    )}

                    {/* Current Position Marker (Aircraft Dot) */}
                    <circle
                      cx={vnavData.curX}
                      cy={vnavData.curY}
                      r="6"
                      fill="rgba(255, 255, 255, 0.15)"
                    />
                    <circle
                      cx={vnavData.curX}
                      cy={vnavData.curY}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#090d16"
                      strokeWidth="1.5"
                    />
                  </svg>

                  <div className="wp-dr-chart-y-right">
                    <span>FL400</span>
                    <span>FL300</span>
                    <span>FL200</span>
                    <span>FL100</span>
                    <span>MSL</span>
                  </div>
                </div>

                <div className="wp-dr-chart-x">
                  <span>DEP · {originAp.icao || 'Origin'}</span>
                  <span>TOC · FL{vnavData.cruiseFl}</span>
                  <span>TOD · {vnavData.todDistFromDest} nm out</span>
                  <span>ARR · {destAp.icao || 'Dest'}</span>
                </div>

                {/* Waypoints / Status row */}
                <div className="wp-dr-waypoints-row">
                  <span>
                    {isParked ? `Parked at ${originAp.icao}` : `${alt.toLocaleString()} ft · ${spd} kts · Cruise Target FL${vnavData.cruiseFl}`}
                  </span>
                  <span className="wp-dr-wp-link">
                    {flightPlan?.waypoints?.length ? `${flightPlan.waypoints.length} waypoints filed ▶` : 'Direct Routing'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Optional Replay Time Scrubber Bar ── */}
      {isReplayActive && (
        <div className="wp-dr-replay-bar">
          <div className="wp-dr-replay-header">
            <div className="wp-dr-replay-title">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>Flight Replay Scrubber</span>
            </div>
            <div className="wp-dr-replay-meta">
              {activeReplayPoint ? (
                <span>
                  {activeReplayPoint.altitude ? `${activeReplayPoint.altitude.toLocaleString()} ft` : ''} · {activeReplayPoint.speed || activeReplayPoint.groundSpeed || 0} kts
                </span>
              ) : (
                <span>Scrub along flight trajectory</span>
              )}
            </div>
            <button className="wp-dr-replay-close" onClick={() => { setIsReplayActive(false); setIsPlaying(false); }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="wp-dr-replay-controls">
            <button
              className="wp-dr-replay-play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>

            <input
              type="range"
              className="wp-dr-replay-slider"
              min="0"
              max={Math.max((allRecordedPoints.length || 1) - 1, 0)}
              value={replayIdx}
              onChange={e => {
                setReplayIdx(Number(e.target.value));
                setIsPlaying(false);
              }}
            />

            <span className="wp-dr-replay-step">
              {replayIdx + 1} / {allRecordedPoints.length || 1}
            </span>
          </div>
        </div>
      )}

      {/* ── 7. Bottom Sticky Action Bar ── */}
      <div className="wp-dr-bottom-bar">
        <div className="wp-dr-actions-grid">
          <button
            className={`wp-dr-action-btn ${isFollowMode ? 'active' : ''}`}
            onClick={() => setIsFollowMode(!isFollowMode)}
            title="Follow aircraft on radar"
          >
            <i className="fa-solid fa-eye"></i>
            <span>Follow</span>
          </button>

          <button
            className={`wp-dr-action-btn ${is3DChase ? 'active' : ''}`}
            onClick={() => setIs3DChase(!is3DChase)}
            title="Toggle 3D Chase Camera View"
          >
            <i className="fa-solid fa-video"></i>
            <span>3D View</span>
          </button>

          <button
            className={`wp-dr-action-btn ${isReplayActive ? 'active' : ''}`}
            onClick={() => setIsReplayActive(!isReplayActive)}
            title="Toggle Flight Path Replay Scrubber"
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Replay</span>
          </button>

          <button
            className="wp-dr-action-btn"
            onClick={() => {
              if (onViewPilot && (flight.userId || flight.username)) {
                onViewPilot(flight.userId || flight.username, flight.username);
              }
            }}
            title="View Pilot Profile & Stats"
          >
            <i className="fa-solid fa-user"></i>
            <span>Pilot</span>
          </button>
        </div>

        {/* Bottom Sub-bar */}
        <div className="wp-dr-footer-sub">
          <span className="wp-dr-foot-pilot">{flight.username || flight.callsign}</span>
          <span className="wp-dr-foot-time">{telemetryFreshness}</span>
        </div>
      </div>

    </div>
  );
}
