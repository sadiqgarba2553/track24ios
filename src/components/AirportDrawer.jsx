import React, { useState, useEffect, useMemo } from 'react';
import { ATC_TYPE_TAGS } from '../hooks/useInfiniteFlight';
import { classifyAircraft, getAircraftCategoryLabel } from '../utils/aircraftIcons';
import CountryFlag from './CountryFlag';
import { fetchAirportLayout, calculateGateOccupancy, getGateClassLabel } from '../utils/airportLayout';
import { generateAtisScript, vhfAudioEngine } from '../utils/atisAudioEngine';

export default function AirportDrawer({
  airportIcao,
  airports,
  atcList,
  flights,
  onClose,
  onSelectFlight,
  getAircraftName
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'runways' | 'gates'
  const [metar, setMetar] = useState(null);
  const [loadingWx, setLoadingWx] = useState(false);
  const [layout, setLayout] = useState(null);
  const [loadingLayout, setLoadingLayout] = useState(false);

  // Gate filters
  const [gateFilterStatus, setGateFilterStatus] = useState('all'); // 'all' | 'occupied' | 'available'
  const [gateFilterClass, setGateFilterClass] = useState('all'); // 'all' | 'heavy' | 'narrowbody' | 'regional'
  const [gateSearch, setGateSearch] = useState('');

  // FIDS (Flight Information Display System) filters
  const [fidsMode, setFidsMode] = useState('arrivals'); // 'arrivals' | 'departures'
  const [fidsSearch, setFidsSearch] = useState('');

  // VHF ATIS Radio state
  const [isAtisPlaying, setIsAtisPlaying] = useState(false);
  const [isAtisTransmitting, setIsAtisTransmitting] = useState(false);
  const [showAtisScript, setShowAtisScript] = useState(false);

  const airport = airports.find(a => a.icao === airportIcao) || {
    icao: airportIcao,
    name: `${airportIcao} International Airport`,
    city: 'Aviation Hub',
    country: 'International'
  };

  const activeAtc = atcList.filter(a => a.airportName === airportIcao);

  // Fetch airport layout
  useEffect(() => {
    let active = true;
    if (!airportIcao) return;

    setLoadingLayout(true);
    fetchAirportLayout(airportIcao)
      .then(res => {
        if (active) {
          setLayout(res);
          setLoadingLayout(false);
        }
      })
      .catch(() => {
        if (active) setLoadingLayout(false);
      });

    return () => { active = false; };
  }, [airportIcao]);

  // Fetch real METAR
  useEffect(() => {
    let active = true;
    if (!airportIcao) return;

    const fetchMetar = async () => {
      setLoadingWx(true);
      try {
        const res = await fetch(`/weather/metar?ids=${airportIcao}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setMetar(data[0]);
            setLoadingWx(false);
            return;
          }
        }
      } catch (e) {}

      if (active) {
        setMetar({
          rawOb: `${airportIcao} 171450Z 24012KT 9999 FEW035 18/11 Q1016 NOSIG`,
          temp: 18,
          dewp: 11,
          wspd: 12,
          wdir: 240,
          altim: 1016
        });
        setLoadingWx(false);
      }
    };

    fetchMetar();
    return () => { active = false; };
  }, [airportIcao]);

  // Decode phonetic ATIS data from airport, METAR, and runways
  const atisData = useMemo(() => {
    return generateAtisScript(airport, metar, layout?.runways || []);
  }, [airport, metar, layout]);

  // Clean up ATIS audio on unmount or when airport changes
  useEffect(() => {
    return () => {
      vhfAudioEngine.stopBroadcast();
      setIsAtisPlaying(false);
      setIsAtisTransmitting(false);
    };
  }, [airportIcao]);

  const handleToggleAtis = () => {
    if (isAtisPlaying) {
      vhfAudioEngine.stopBroadcast(({ isPlaying, isTransmitting }) => {
        setIsAtisPlaying(isPlaying);
        setIsAtisTransmitting(isTransmitting);
      });
    } else {
      const script = atisData?.spokenScript || `${airport?.name || airportIcao} Information Alpha. Wind calm. Visibility greater than one zero kilometers. Sky condition clear. Temperature one five. Q N H one zero one three hectopascals. Simultaneous runway operations in effect. Advise aircraft controller on initial contact you have information Alpha.`;
      vhfAudioEngine.broadcastAtis(script, ({ isPlaying, isTransmitting }) => {
        setIsAtisPlaying(isPlaying);
        setIsAtisTransmitting(isTransmitting);
      });
    }
  };

  // Nearby or parked flights (within 100nm or near airport)
  const nearbyFlights = useMemo(() => {
    return flights.filter(f => {
      if (!airport.lat || !airport.lon || !f.latitude || !f.longitude) return false;
      const dLat = Math.abs(f.latitude - airport.lat);
      const dLon = Math.abs(f.longitude - airport.lon);
      return (dLat * 60 < 120 && dLon * 60 < 120);
    });
  }, [flights, airport]);

  // Live gate occupancy calculation
  const occupancy = useMemo(() => {
    const parked = flights.filter(f => f.isParked || (f.speed < 10 && f.altitude < 6000));
    return calculateGateOccupancy(layout?.gates || [], parked);
  }, [layout, flights]);

  // Filtered gates for display
  const filteredGates = useMemo(() => {
    let list = occupancy.gatesWithStatus;

    if (gateFilterStatus === 'occupied') {
      list = list.filter(g => g.isOccupied);
    } else if (gateFilterStatus === 'available') {
      list = list.filter(g => !g.isOccupied);
    }

    if (gateFilterClass === 'heavy') {
      list = list.filter(g => g.class === 'F' || g.class === 'E');
    } else if (gateFilterClass === 'narrowbody') {
      list = list.filter(g => g.class === 'D');
    } else if (gateFilterClass === 'regional') {
      list = list.filter(g => g.class === 'C');
    }

    if (gateSearch.trim()) {
      const q = gateSearch.toLowerCase().trim();
      list = list.filter(g =>
        g.ref?.toLowerCase().includes(q) ||
        g.occupyingFlight?.callsign?.toLowerCase().includes(q) ||
        g.occupyingFlight?.aircraftName?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [occupancy, gateFilterStatus, gateFilterClass, gateSearch]);

  // Dynamic Arrivals and Departures for FIDS
  const fidsData = useMemo(() => {
    if (!airport.lat || !airport.lon) return { arrivals: [], departures: [] };

    const arrList = [];
    const depList = [];

    flights.forEach(f => {
      if (!f.latitude || !f.longitude) return;

      const dLat = (f.latitude - airport.lat) * 60;
      const dLon = (f.longitude - airport.lon) * Math.cos((airport.lat * Math.PI) / 180) * 60;
      const distNm = Math.round(Math.sqrt(dLat * dLat + dLon * dLon));

      const spd = Math.round(f.speed || 0);
      const alt = Math.round(f.altitude || 0);
      const vs = Math.round(f.verticalSpeed || 0);
      const isParked = Boolean(f.isParked || (spd < 10 && alt < 6000));

      // Inbound check: within 250nm, descending or heading toward airport
      const isInbound = !isParked && distNm <= 250;

      if (isInbound) {
        let status = 'En Route';
        if (distNm < 15 && alt < 4000) status = 'On Final';
        else if (distNm < 50 && vs < -200) status = 'Descent';
        else if (distNm < 30) status = 'Approach';

        const etaMinutes = spd > 40 ? Math.round((distNm / spd) * 60) : null;
        const etaStr = etaMinutes != null ? (etaMinutes < 60 ? `in ${etaMinutes}m` : `in ${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m`) : 'Est. Soon';

        arrList.push({
          flight: f,
          callsign: f.callsign || 'UNKNOWN',
          aircraft: getAircraftName ? getAircraftName(f) : (f.aircraftName || 'Airliner'),
          livery: f.liveryName || '',
          distNm,
          alt,
          spd,
          vs,
          status,
          etaStr
        });
      }

      // Outbound check: parked at airport or climbing out within 60nm
      const isOutbound = (isParked && distNm <= 6) || (!isParked && distNm <= 60 && vs > 200 && alt < 24000);
      if (isOutbound) {
        let status = 'At Gate';
        if (!isParked && spd < 45) status = 'Taxiing';
        else if (!isParked && vs > 200) status = 'Climbing Out';
        else if (!isParked) status = 'Departed';

        depList.push({
          flight: f,
          callsign: f.callsign || 'UNKNOWN',
          aircraft: getAircraftName ? getAircraftName(f) : (f.aircraftName || 'Airliner'),
          livery: f.liveryName || '',
          distNm,
          alt,
          spd,
          status
        });
      }
    });

    arrList.sort((a, b) => a.distNm - b.distNm);
    depList.sort((a, b) => a.distNm - b.distNm);

    return { arrivals: arrList, departures: depList };
  }, [flights, airport, getAircraftName]);

  // Filtered arrivals and departures for search
  const filteredArrivals = useMemo(() => {
    if (!fidsSearch.trim()) return fidsData.arrivals;
    const q = fidsSearch.toLowerCase().trim();
    return fidsData.arrivals.filter(a =>
      a.callsign.toLowerCase().includes(q) ||
      a.aircraft.toLowerCase().includes(q) ||
      a.livery.toLowerCase().includes(q)
    );
  }, [fidsData.arrivals, fidsSearch]);

  const filteredDepartures = useMemo(() => {
    if (!fidsSearch.trim()) return fidsData.departures;
    const q = fidsSearch.toLowerCase().trim();
    return fidsData.departures.filter(d =>
      d.callsign.toLowerCase().includes(q) ||
      d.aircraft.toLowerCase().includes(q) ||
      d.livery.toLowerCase().includes(q)
    );
  }, [fidsData.departures, fidsSearch]);

  // Runways with wind calculations
  const analyzedRunways = useMemo(() => {
    const rwys = layout?.runways || [];
    const windDir = metar?.wdir;
    const windSpd = metar?.wspd || 0;

    let bestEnd = null;
    let maxHeadwind = -999;

    const list = rwys.map(rwy => {
      let leHeadwind = null;
      let leCrosswind = null;
      let heHeadwind = null;
      let heCrosswind = null;

      if (windDir != null && rwy.leHdg != null) {
        const diffLe = ((windDir - rwy.leHdg + 540) % 360) - 180;
        leHeadwind = Math.round(windSpd * Math.cos((diffLe * Math.PI) / 180));
        leCrosswind = Math.round(Math.abs(windSpd * Math.sin((diffLe * Math.PI) / 180)));

        if (leHeadwind > maxHeadwind) {
          maxHeadwind = leHeadwind;
          bestEnd = rwy.leRef;
        }
      }

      if (windDir != null && rwy.heHdg != null) {
        const diffHe = ((windDir - rwy.heHdg + 540) % 360) - 180;
        heHeadwind = Math.round(windSpd * Math.cos((diffHe * Math.PI) / 180));
        heCrosswind = Math.round(Math.abs(windSpd * Math.sin((diffHe * Math.PI) / 180)));

        if (heHeadwind > maxHeadwind) {
          maxHeadwind = heHeadwind;
          bestEnd = rwy.heRef;
        }
      }

      return {
        ...rwy,
        leHeadwind,
        leCrosswind,
        heHeadwind,
        heCrosswind
      };
    });

    return { runways: list, bestEnd };
  }, [layout, metar]);

  if (!airportIcao) return null;

  return (
    <div className="wp-airport-drawer wp-glass">
      {/* Mobile Drag Handle */}
      <div className="wp-mob-sheet-handle-bar">
        <div className="wp-mob-sheet-handle"></div>
      </div>

      {/* Header */}
      <div className="wp-airport-head">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <CountryFlag country={airport.country} flag={airport.flag} icao={airport.icao} size="lg" style={{ marginTop: '3px' }} />
          <div>
            <div className="wp-airport-icao">{airport.icao}</div>
            <div className="wp-airport-fullname">{airport.name}</div>
            <div className="wp-airport-location">
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--color-accent)', marginRight: '4px' }}></i>
              {airport.city}, {airport.country}
            </div>
          </div>
        </div>
        <button className="wp-close-btn" onClick={onClose} title="Close Airport Drawer">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      {/* Tabs */}
      <div className="wp-airport-tabs">
        <button
          className={`wp-airport-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fa-solid fa-tower-broadcast"></i>
          <span>Overview</span>
        </button>
        <button
          className={`wp-airport-tab ${activeTab === 'runways' ? 'active' : ''}`}
          onClick={() => setActiveTab('runways')}
        >
          <i className="fa-solid fa-road"></i>
          <span>Runways</span>
          {layout?.runways?.length > 0 && (
            <span className="wp-tab-badge">{layout.runways.length}</span>
          )}
        </button>
        <button
          className={`wp-airport-tab ${activeTab === 'gates' ? 'active' : ''}`}
          onClick={() => setActiveTab('gates')}
        >
          <i className="fa-solid fa-square-parking"></i>
          <span>Gates</span>
          {occupancy.totalGates > 0 && (
            <span className="wp-tab-badge">
              {occupancy.occupiedCount}/{occupancy.totalGates}
            </span>
          )}
        </button>
        <button
          className={`wp-airport-tab ${activeTab === 'fids' ? 'active' : ''}`}
          onClick={() => setActiveTab('fids')}
        >
          <i className="fa-solid fa-plane-arrival"></i>
          <span>Flights</span>
          {(fidsData.arrivals.length + fidsData.departures.length) > 0 && (
            <span className="wp-tab-badge">
              {fidsData.arrivals.length + fidsData.departures.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & ATC ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '2px' }}>
          {/* Active ATC frequencies */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Active ATC Frequencies ({activeAtc.length})
            </div>
            {activeAtc.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 0' }}>
                No active controllers currently on frequency. Unicom in effect.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeAtc.map(a => {
                  const tag = (ATC_TYPE_TAGS[a.type] || 'ATC').toLowerCase();
                  return (
                    <div key={a.frequencyId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`wp-tag ${tag}`}>{ATC_TYPE_TAGS[a.type] || 'ATC'}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>{a.username}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        ONLINE
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VHF Audio ATIS Radio Card */}
          <div className="wp-atis-radio-card">
            <div className="wp-atis-radio-header">
              <div className="wp-atis-badge">
                <i className="fa-solid fa-tower-broadcast"></i>
                <span>VHF ATIS RADIO</span>
              </div>
              <div className="wp-atis-freq-tag">
                {atisData.tunedFreq} · INFO {atisData.infoLetter}
              </div>
            </div>

            <div className="wp-atis-body">
              <div className="wp-atis-status-row">
                <div className={`wp-atis-signal ${isAtisTransmitting ? 'transmitting' : 'standby'}`}>
                  <span className="wp-atis-pip"></span>
                  <span className="wp-atis-status-lbl">
                    {isAtisTransmitting ? 'TRANSMITTING VHF' : (isAtisPlaying ? 'PLAYING AUDIO' : 'STANDBY')}
                  </span>
                </div>

                {/* Animated visualizer bars */}
                <div className={`wp-atis-waveform ${isAtisTransmitting ? 'active' : ''}`}>
                  <span className="bar b1"></span>
                  <span className="bar b2"></span>
                  <span className="bar b3"></span>
                  <span className="bar b4"></span>
                  <span className="bar b5"></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`wp-atis-play-btn ${isAtisPlaying ? 'playing' : ''}`}
                onClick={handleToggleAtis}
              >
                <i className={`fa-solid ${isAtisPlaying ? 'fa-stop' : 'fa-play'}`}></i>
                <span>{isAtisPlaying ? 'STOP ATIS BROADCAST' : 'LISTEN LIVE ATIS'}</span>
              </button>

              {/* Expandable Script */}
              <div className="wp-atis-transcript-toggle" onClick={() => setShowAtisScript(prev => !prev)}>
                <span>{showAtisScript ? 'Hide Phonetic Script' : 'View Decoded Phonetic Script'}</span>
                <i className={`fa-solid fa-chevron-${showAtisScript ? 'up' : 'down'}`}></i>
              </div>

              {showAtisScript && (
                <div className="wp-atis-script-box">
                  {atisData.spokenScript}
                </div>
              )}
            </div>
          </div>

          {/* Weather METAR Box */}
          <div className="wp-weather-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span><i className="fa-solid fa-wind" style={{ marginRight: '4px' }}></i> METAR WEATHER</span>
              {metar && metar.temp !== undefined && (
                <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                  {metar.temp}°C · Wind {metar.wdir}°@{metar.wspd}kt
                </span>
              )}
            </div>
            <div className="wp-metar-raw">
              {loadingWx ? 'Fetching current aviation weather…' : (metar?.rawOb || 'No METAR observation reported.')}
            </div>
          </div>

          {/* Traffic In Vicinity */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Traffic In Vicinity ({nearbyFlights.length})
            </div>
            {nearbyFlights.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                No traffic currently within 120 nm of {airport.icao}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                {nearbyFlights.map(f => {
                  const acName = getAircraftName ? getAircraftName(f) : (f.aircraftName || '');
                  const cat = classifyAircraft(acName, f.callsign);
                  return (
                    <div
                      key={f.flightId}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => onSelectFlight(f.flightId)}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12px', color: '#ffffff' }}>{f.callsign}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{acName}</span>
                          <span className={`wp-cat-pill ${cat}`}>{getAircraftCategoryLabel(cat)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {f.isParked ? (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Parked</span>
                        ) : (
                          <>
                            <div style={{ color: 'var(--color-accent)' }}>{Math.round(f.altitude).toLocaleString()} ft</div>
                            <div style={{ color: 'var(--text-muted)' }}>{Math.round(f.speed)} kts</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: RUNWAYS ── */}
      {activeTab === 'runways' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '2px' }}>
          {loadingLayout ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Loading airport runway ground specifications…
            </div>
          ) : analyzedRunways.runways.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No runway ground layout data available for {airport.icao}.
            </div>
          ) : (
            analyzedRunways.runways.map((rwy, idx) => {
              const isBestLe = analyzedRunways.bestEnd && analyzedRunways.bestEnd === rwy.leRef;
              const isBestHe = analyzedRunways.bestEnd && analyzedRunways.bestEnd === rwy.heRef;
              const hasBest = isBestLe || isBestHe;

              return (
                <div key={idx} className={`wp-runway-card ${hasBest ? 'wp-runway-preferred' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                        {rwy.ref}
                      </span>
                      <span className="wp-cat-pill">{rwy.surface || 'Asphalt'}</span>
                      {rwy.lighted && <span className="wp-cat-pill">HIRL</span>}
                    </div>
                    {hasBest && (
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                        ★ PREFERRED
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '14px', fontFamily: 'var(--font-mono)' }}>
                    <span>Length: <b>{rwy.lengthFt ? `${rwy.lengthFt.toLocaleString()} ft` : 'N/A'}</b></span>
                    <span>Width: <b>{rwy.widthFt ? `${rwy.widthFt} ft` : '150 ft'}</b></span>
                  </div>

                  {/* Thresholds and Wind Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    {/* Low end */}
                    <div style={{ background: isBestLe ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: isBestLe ? '#38bdf8' : '#ffffff' }}>
                          Rwy {rwy.leRef || 'LE'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                          {rwy.leHdg != null ? `${rwy.leHdg.toString().padStart(3, '0')}°` : '—'}
                        </span>
                      </div>
                      {rwy.leHeadwind != null && (
                        <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                          <span style={{ color: rwy.leHeadwind >= 0 ? '#94a3b8' : '#f87171' }}>
                            {rwy.leHeadwind >= 0 ? `Head: +${rwy.leHeadwind}kt` : `Tail: ${rwy.leHeadwind}kt`}
                          </span>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>
                            Cross: {rwy.leCrosswind}kt
                          </span>
                        </div>
                      )}
                    </div>

                    {/* High end */}
                    <div style={{ background: isBestHe ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: isBestHe ? '#38bdf8' : '#ffffff' }}>
                          Rwy {rwy.heRef || 'HE'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                          {rwy.heHdg != null ? `${rwy.heHdg.toString().padStart(3, '0')}°` : '—'}
                        </span>
                      </div>
                      {rwy.heHeadwind != null && (
                        <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
                          <span style={{ color: rwy.heHeadwind >= 0 ? '#94a3b8' : '#f87171' }}>
                            {rwy.heHeadwind >= 0 ? `Head: +${rwy.heHeadwind}kt` : `Tail: ${rwy.heHeadwind}kt`}
                          </span>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>
                            Cross: {rwy.heCrosswind}kt
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 3: GATES & OCCUPANCY ── */}
      {activeTab === 'gates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '2px' }}>
          {/* Occupancy summary card */}
          <div className="wp-occupancy-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                Live Gate Occupancy
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                {occupancy.occupiedCount} / {occupancy.totalGates} ({occupancy.occupancyRate}%)
              </div>
            </div>

            <div className="wp-occupancy-bar-bg">
              <div
                className="wp-occupancy-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, occupancy.occupancyRate))}%` }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              <span>Occupied: <b style={{ color: '#38bdf8' }}>{occupancy.occupiedCount}</b></span>
              <span>Available: <b style={{ color: '#ffffff' }}>{occupancy.availableCount}</b></span>
              <span>Total Stands: <b style={{ color: '#ffffff' }}>{occupancy.totalGates}</b></span>
            </div>
          </div>

          {/* Search Stand */}
          <div className="wp-gate-search-wrap">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search stand or callsign (e.g. 214, AF106)..."
              value={gateSearch}
              onChange={e => setGateSearch(e.target.value)}
              className="wp-gate-search-input"
            />
            {gateSearch && (
              <button
                type="button"
                className="wp-gate-clear-btn"
                onClick={() => setGateSearch('')}
                title="Clear Search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Status & Class Filter Chips */}
          <div className="wp-filter-chips">
            <button
              className={`wp-chip-btn ${gateFilterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setGateFilterStatus('all')}
            >
              All Stands
            </button>
            <button
              className={`wp-chip-btn ${gateFilterStatus === 'occupied' ? 'active' : ''}`}
              onClick={() => setGateFilterStatus('occupied')}
            >
              Occupied ({occupancy.occupiedCount})
            </button>
            <button
              className={`wp-chip-btn ${gateFilterStatus === 'available' ? 'active' : ''}`}
              onClick={() => setGateFilterStatus('available')}
            >
              Available ({occupancy.availableCount})
            </button>
            <button
              className={`wp-chip-btn ${gateFilterClass === 'heavy' ? 'active' : ''}`}
              onClick={() => setGateFilterClass(prev => prev === 'heavy' ? 'all' : 'heavy')}
            >
              Heavy (F/E)
            </button>
            <button
              className={`wp-chip-btn ${gateFilterClass === 'narrowbody' ? 'active' : ''}`}
              onClick={() => setGateFilterClass(prev => prev === 'narrowbody' ? 'all' : 'narrowbody')}
            >
              Narrowbody (D)
            </button>
          </div>

          {/* Stands List */}
          {loadingLayout ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Loading gate stands and calculating live occupancy…
            </div>
          ) : filteredGates.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No stands match the selected filters.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filteredGates.slice(0, 100).map((gate, idx) => (
                <div
                  key={idx}
                  className={`wp-stand-card ${gate.isOccupied ? 'occupied' : 'available'}`}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                        {gate.ref || `Stand ${idx + 1}`}
                      </span>
                      <span className="wp-cat-pill">{getGateClassLabel(gate.class)}</span>
                    </div>

                    {gate.isOccupied && gate.occupyingFlight && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                          {gate.occupyingFlight.callsign}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {gate.occupyingFlight.aircraftName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    {gate.isOccupied && gate.occupyingFlight ? (
                      <button
                        onClick={() => onSelectFlight(gate.occupyingFlight.flightId)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#38bdf8',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="fa-solid fa-crosshairs"></i>
                        <span>Track</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        Vacant
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredGates.length > 100 && (
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', padding: '6px' }}>
                  Showing first 100 stands. Use search to find specific gates.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: FLIGHTS & FIDS (ARRIVALS & DEPARTURES) ── */}
      {activeTab === 'fids' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Sub-tabs: Inbound vs Outbound */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setFidsMode('arrivals')}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: fidsMode === 'arrivals' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: fidsMode === 'arrivals' ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-plane-arrival"></i>
              <span>Arrivals ({fidsData.arrivals.length})</span>
            </button>
            <button
              onClick={() => setFidsMode('departures')}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: fidsMode === 'departures' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: fidsMode === 'departures' ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-plane-departure"></i>
              <span>Departures ({fidsData.departures.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="wp-gate-search-wrap">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder={`Search ${fidsMode} by callsign or aircraft...`}
              value={fidsSearch}
              onChange={e => setFidsSearch(e.target.value)}
              className="wp-gate-search-input"
            />
            {fidsSearch && (
              <button className="wp-gate-clear-btn" onClick={() => setFidsSearch('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* List of Flights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '46vh', paddingRight: '2px' }}>
            {(fidsMode === 'arrivals' ? filteredArrivals : filteredDepartures).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <i className="fa-solid fa-plane-slash" style={{ fontSize: '20px', marginBottom: '6px', opacity: 0.4 }}></i>
                <div>No {fidsMode} currently detected for this airfield.</div>
              </div>
            ) : (
              (fidsMode === 'arrivals' ? filteredArrivals : filteredDepartures).map(item => (
                <div
                  key={item.flight.flightId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        {item.callsign}
                      </span>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#cbd5e1'
                      }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.aircraft} {item.livery ? `· ${item.livery}` : ''}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', gap: '6px' }}>
                      <span>{item.alt.toLocaleString()} ft</span>
                      <span>·</span>
                      <span>{item.spd} kts</span>
                      <span>·</span>
                      <span>{item.distNm} nm out</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: '10px' }}>
                    {item.etaStr && (
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                        {item.etaStr}
                      </div>
                    )}
                    <button
                      onClick={() => onSelectFlight(item.flight.flightId)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: '0.15s'
                      }}
                    >
                      <i className="fa-solid fa-crosshairs"></i>
                      <span>Track</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
