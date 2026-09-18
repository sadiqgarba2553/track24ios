import React, { useState, useMemo, useEffect } from 'react';
import { ATC_TYPE_TAGS } from '../hooks/useInfiniteFlight';
import { calculateDistanceNm } from '../utils/airports';
import { classifyAircraft, getAircraftCategoryLabel } from '../utils/aircraftIcons';
import CountryFlag from './CountryFlag';

export default function FloatingPanels({
  flights,
  atcList,
  airports,
  selectedFlight,
  setSelectedFlight,
  onSelectAirport,
  getAircraftName,
  getLiveryName,
  favorites,
  toggleFavorite,
  isFavorite
}) {
  // Mobile active floating panel ('tracked' | 'atc' | 'fleet' | null)
  const [mobileActiveCard, setMobileActiveCard] = useState(null);

  // Close active mobile card when a flight is selected on radar
  useEffect(() => {
    if (selectedFlight) {
      setMobileActiveCard(null);
    }
  }, [selectedFlight]);

  // Collapsed states
  const [collapsed1, setCollapsed1] = useState(false);
  const [collapsed2, setCollapsed2] = useState(false);
  const [collapsed3, setCollapsed3] = useState(false);

  // Active tab per card
  const [tab1, setTab1] = useState('tracked'); // 'tracked' | 'friends'
  const [tab2, setTab2] = useState('atc');     // 'atc' | 'airports' | 'delay'
  const [tab3, setTab3] = useState('fleet');   // 'fleet' | 'stats' | 'events'

  // Fleet search and status filter
  const [fleetFilter, setFleetFilter] = useState('');
  const [fleetStatusTab, setFleetStatusTab] = useState('all'); // 'all' | 'airborne' | 'parked'

  // Count parked vs airborne flights
  const parkedCount = useMemo(() => flights.filter(f => f.isParked).length, [flights]);
  const airborneCount = flights.length - parkedCount;

  // Most tracked / highlight flights (e.g. highest speed or high altitude)
  const mostTrackedFlights = useMemo(() => {
    return [...flights]
      .sort((a, b) => (b.speed || 0) - (a.speed || 0))
      .slice(0, 15);
  }, [flights]);

  // Favorite flights
  const favoriteFlights = useMemo(() => {
    return flights.filter(f => isFavorite(f.callsign) || isFavorite(f.flightId));
  }, [flights, favorites, isFavorite]);

  // Filtered fleet flights by search and status
  const filteredFleet = useMemo(() => {
    let list = flights;
    if (fleetStatusTab === 'airborne') {
      list = list.filter(f => !f.isParked);
    } else if (fleetStatusTab === 'parked') {
      list = list.filter(f => f.isParked);
    }

    const q = fleetFilter.toLowerCase().trim();
    if (!q) return list.slice(0, 60);

    return list.filter(f =>
      (f.callsign || '').toLowerCase().includes(q) ||
      (f.username || '').toLowerCase().includes(q) ||
      getAircraftName(f).toLowerCase().includes(q)
    ).slice(0, 60);
  }, [flights, fleetFilter, fleetStatusTab, getAircraftName]);

  // Group ATC by airport
  const groupedAtc = useMemo(() => {
    return atcList.map(a => {
      const tag = ATC_TYPE_TAGS[a.type] || 'ATC';
      return {
        ...a,
        tag: tag.toLowerCase(),
        tagLabel: tag
      };
    });
  }, [atcList]);

  // Server Stats Calculation
  const serverStats = useMemo(() => {
    if (!flights || flights.length === 0) return { count: 0, airborne: 0, parked: 0, avgAlt: 0, maxSpd: 0, atcCount: atcList.length };
    const totalAlt = flights.reduce((sum, f) => sum + (f.altitude || 0), 0);
    const maxSpd = Math.round(Math.max(...flights.map(f => f.speed || 0), 0));
    return {
      count: flights.length,
      airborne: airborneCount,
      parked: parkedCount,
      avgAlt: Math.round(totalAlt / flights.length),
      maxSpd,
      atcCount: atcList.length
    };
  }, [flights, atcList, airborneCount, parkedCount]);

  // Real Airport Congestion based on current active flights within 40nm
  const activeHubs = useMemo(() => {
    if (!airports || airports.length === 0 || flights.length === 0) return [];

    const hubs = airports.map(ap => {
      const nearby = flights.filter(f => {
        if (f.latitude == null || f.longitude == null) return false;
        const d = calculateDistanceNm(ap.lat, ap.lon, f.latitude, f.longitude);
        return d != null && d <= 40;
      });
      const parkedHere = nearby.filter(f => f.isParked).length;
      const airborneHere = nearby.length - parkedHere;
      return {
        icao: ap.icao,
        name: ap.name,
        city: ap.city,
        total: nearby.length,
        airborne: airborneHere,
        parked: parkedHere
      };
    });

    return hubs.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [airports, flights]);

  return (
    <div className="wp-left-panels">
      {/* ── Mobile Floating Pill Dock (Unobtrusive & Collapsible: ATC & Fleet) ── */}
      <div className="wp-mob-panels-dock">
        <button
          className={`wp-mob-dock-pill wp-glass ${mobileActiveCard === 'atc' ? 'active' : ''}`}
          onClick={() => setMobileActiveCard(mobileActiveCard === 'atc' ? null : 'atc')}
          title="Active ATC Stations & Hubs"
          aria-label="Active ATC Stations"
        >
          <i className="fa-solid fa-tower-broadcast"></i>
          <span>ATC ({atcList.length})</span>
        </button>
        <button
          className={`wp-mob-dock-pill wp-glass ${mobileActiveCard === 'fleet' ? 'active' : ''}`}
          onClick={() => setMobileActiveCard(mobileActiveCard === 'fleet' ? null : 'fleet')}
          title="Live Fleet Board & Stats"
          aria-label="Live Fleet Board"
        >
          <i className="fa-solid fa-list-check"></i>
          <span>Fleet</span>
        </button>
      </div>

      {/* ── CARD 1: Most Tracked & Friends ── */}
      <div className={`wp-card wp-glass ${collapsed1 ? 'collapsed' : ''} ${mobileActiveCard === 'tracked' ? 'wp-mob-card-active' : ''}`}>
        <div className="wp-card-header">
          <div className="wp-tabs">
            <button
              className={`wp-tab ${tab1 === 'tracked' ? 'active' : ''}`}
              onClick={() => { setTab1('tracked'); setCollapsed1(false); }}
            >
              Most tracked
            </button>
            <button
              className={`wp-tab ${tab1 === 'friends' ? 'active' : ''}`}
              onClick={() => { setTab1('friends'); setCollapsed1(false); }}
            >
              Friends ({favorites.length})
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="wp-collapse-btn"
              onClick={() => setCollapsed1(!collapsed1)}
              title={collapsed1 ? "Expand" : "Collapse"}
            >
              {collapsed1 ? '+' : '–'}
            </button>
            <button
              className="wp-mob-card-dismiss"
              onClick={() => setMobileActiveCard(null)}
              title="Close panel"
              aria-label="Close panel"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="wp-card-body">
          {tab1 === 'tracked' && (
            mostTrackedFlights.length === 0 ? (
              <div className="wp-empty-msg">No active flights on this server.</div>
            ) : (
              mostTrackedFlights.map(f => (
                <div
                  key={f.flightId}
                  className={`wp-flight-row ${selectedFlight === f.flightId ? 'selected' : ''}`}
                  onClick={() => setSelectedFlight(f.flightId)}
                >
                  <div className="wp-flight-info-main">
                    <div className="wp-callsign-wrap">
                      <span className="wp-callsign">{f.callsign || 'Unknown'}</span>
                      <button
                        className={`wp-star-btn ${isFavorite(f.callsign) ? 'starred' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(f.callsign); }}
                        title="Add to Friends"
                      >
                        <i className={`fa-${isFavorite(f.callsign) ? 'solid' : 'regular'} fa-star`}></i>
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="wp-ac-type">{getAircraftName(f)}</span>
                      <span className={`wp-cat-pill ${classifyAircraft(getAircraftName(f), f.callsign)}`}>
                        {getAircraftCategoryLabel(classifyAircraft(getAircraftName(f), f.callsign))}
                      </span>
                    </div>
                  </div>
                  <div className="wp-flight-metrics">
                    {f.isParked ? (
                      <>
                        <span className="wp-metric-alt" style={{ color: '#94a3b8' }}>Parked</span>
                        <span className="wp-metric-spd" style={{ color: '#64748b' }}>0 kts</span>
                      </>
                    ) : (
                      <>
                        <span className="wp-metric-alt">{Math.round(f.altitude).toLocaleString()} ft</span>
                        <span className="wp-metric-spd">{Math.round(f.speed)} kts</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )
          )}

          {tab1 === 'friends' && (
            favoriteFlights.length === 0 ? (
              <div className="wp-empty-msg">
                No friends or saved flights online.<br />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Click the star icon next to any flight to track it here.
                </span>
              </div>
            ) : (
              favoriteFlights.map(f => (
                <div
                  key={f.flightId}
                  className={`wp-flight-row ${selectedFlight === f.flightId ? 'selected' : ''}`}
                  onClick={() => setSelectedFlight(f.flightId)}
                >
                  <div className="wp-flight-info-main">
                    <div className="wp-callsign-wrap">
                      <span className="wp-callsign">{f.callsign}</span>
                      <button
                        className="wp-star-btn starred"
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(f.callsign); }}
                      >
                        <i className="fa-solid fa-star"></i>
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="wp-ac-type">{getAircraftName(f)}</span>
                      <span className={`wp-cat-pill ${classifyAircraft(getAircraftName(f), f.callsign)}`}>
                        {getAircraftCategoryLabel(classifyAircraft(getAircraftName(f), f.callsign))}
                      </span>
                    </div>
                  </div>
                  <div className="wp-flight-metrics">
                    {f.isParked ? (
                      <>
                        <span className="wp-metric-alt" style={{ color: '#94a3b8' }}>Parked</span>
                        <span className="wp-metric-spd" style={{ color: '#64748b' }}>0 kts</span>
                      </>
                    ) : (
                      <>
                        <span className="wp-metric-alt">{Math.round(f.altitude).toLocaleString()} ft</span>
                        <span className="wp-metric-spd">{Math.round(f.speed)} kts</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* ── CARD 2: Active ATC & Traffic Hubs ── */}
      <div className={`wp-card wp-glass ${collapsed2 ? 'collapsed' : ''} ${mobileActiveCard === 'atc' ? 'wp-mob-card-active' : ''}`}>
        <div className="wp-card-header">
          <div className="wp-tabs">
            <button
              className={`wp-tab ${tab2 === 'atc' ? 'active' : ''}`}
              onClick={() => { setTab2('atc'); setCollapsed2(false); }}
            >
              Active ATC ({atcList.length})
            </button>
            <button
              className={`wp-tab ${tab2 === 'airports' ? 'active' : ''}`}
              onClick={() => { setTab2('airports'); setCollapsed2(false); }}
            >
              Airports
            </button>
            <button
              className={`wp-tab ${tab2 === 'delay' ? 'active' : ''}`}
              onClick={() => { setTab2('delay'); setCollapsed2(false); }}
            >
              Traffic
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="wp-collapse-btn"
              onClick={() => setCollapsed2(!collapsed2)}
              title={collapsed2 ? "Expand" : "Collapse"}
            >
              {collapsed2 ? '+' : '–'}
            </button>
            <button
              className="wp-mob-card-dismiss"
              onClick={() => setMobileActiveCard(null)}
              title="Close panel"
              aria-label="Close panel"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="wp-card-body">
          {tab2 === 'atc' && (
            groupedAtc.length === 0 ? (
              <div className="wp-empty-msg">No active controllers currently online.</div>
            ) : (
              groupedAtc.map((a, idx) => {
                const ap = airports?.find(p => p.icao === a.airportIcao);
                const airportSubName = ap?.name || ap?.city;
                const hasSubName = airportSubName && airportSubName.toLowerCase() !== (a.airportIcao || '').toLowerCase();

                return (
                  <div
                    key={`${a.airportIcao || a.airportName}-${idx}`}
                    className="wp-atc-row"
                    onClick={() => a.airportIcao && onSelectAirport(a.airportIcao)}
                  >
                    <div className="wp-atc-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {a.airportIcao && <CountryFlag icao={a.airportIcao} size="sm" />}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span className="wp-atc-icao" style={{ fontWeight: 700, fontSize: '13.5px', color: '#ffffff' }}>
                          {a.airportIcao || a.airportName || 'CTR'}
                        </span>
                        {hasSubName && (
                          <span className="wp-atc-name" style={{ fontSize: '11px', color: '#94a3b8', display: 'block', maxWidth: '190px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {airportSubName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="wp-atc-right">
                      <span className={`wp-tag ${a.tag}`}>{a.tagLabel}</span>
                    </div>
                  </div>
                );
              })
            )
          )}

          {tab2 === 'airports' && (
            airports.slice(0, 25).map(ap => {
              const activeControllers = atcList.filter(a => a.airportIcao === ap.icao).length;
              return (
                <div
                  key={ap.icao}
                  className="wp-airport-row"
                  onClick={() => onSelectAirport(ap.icao)}
                >
                  <div className="wp-airport-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CountryFlag country={ap.country} flag={ap.flag} icao={ap.icao} size="sm" />
                    <div>
                      <span className="wp-airport-icao">{ap.icao}</span>
                      <span className="wp-airport-name">{ap.name}</span>
                    </div>
                  </div>
                  <div className="wp-airport-right">
                    {activeControllers > 0 ? (
                      <span className="wp-tag twr" style={{ fontSize: '9px' }}>{activeControllers} ATC</span>
                    ) : (
                      <span className="wp-airport-stat">{ap.city}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {tab2 === 'delay' && (
            <div style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', paddingBottom: '2px' }}>
                Real Live Airport Traffic Density:
              </div>
              {activeHubs.length === 0 ? (
                <div className="wp-empty-msg">Calculating live traffic...</div>
              ) : (
                activeHubs.map(hub => (
                  <div
                    key={hub.icao}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}
                    onClick={() => onSelectAirport(hub.icao)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CountryFlag icao={hub.icao} size="sm" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>{hub.icao} · {hub.city}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          {hub.airborne} flying · {hub.parked} parked
                        </div>
                      </div>
                    </div>
                    <span style={{
                      color: hub.total > 3 ? '#38bdf8' : '#22c55e',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: hub.total > 3 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {hub.total} active
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 3: Fleet Board & Real Stats ── */}
      <div className={`wp-card wp-glass ${collapsed3 ? 'collapsed' : ''} ${mobileActiveCard === 'fleet' ? 'wp-mob-card-active' : ''}`}>
        <div className="wp-card-header">
          <div className="wp-tabs">
            <button
              className={`wp-tab ${tab3 === 'fleet' ? 'active' : ''}`}
              onClick={() => { setTab3('fleet'); setCollapsed3(false); }}
            >
              Fleet Board
            </button>
            <button
              className={`wp-tab ${tab3 === 'stats' ? 'active' : ''}`}
              onClick={() => { setTab3('stats'); setCollapsed3(false); }}
            >
              Stats
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="wp-collapse-btn"
              onClick={() => setCollapsed3(!collapsed3)}
              title={collapsed3 ? "Expand" : "Collapse"}
            >
              {collapsed3 ? '+' : '–'}
            </button>
            <button
              className="wp-mob-card-dismiss"
              onClick={() => setMobileActiveCard(null)}
              title="Close panel"
              aria-label="Close panel"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="wp-card-body">
          {tab3 === 'fleet' && (
            <>
              {/* Filter pills: All, Airborne, Parked */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <button
                  onClick={() => setFleetStatusTab('all')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    background: fleetStatusTab === 'all' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: fleetStatusTab === 'all' ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  All ({flights.length})
                </button>
                <button
                  onClick={() => setFleetStatusTab('airborne')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    background: fleetStatusTab === 'airborne' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: fleetStatusTab === 'airborne' ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Airborne ({airborneCount})
                </button>
                <button
                  onClick={() => setFleetStatusTab('parked')}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    background: fleetStatusTab === 'parked' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: fleetStatusTab === 'parked' ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  Parked ({parkedCount})
                </button>
              </div>

              <div style={{ marginBottom: '6px' }}>
                <input
                  type="text"
                  placeholder="Filter fleet…"
                  value={fleetFilter}
                  onChange={e => setFleetFilter(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                />
              </div>

              {filteredFleet.length === 0 ? (
                <div className="wp-empty-msg">No matching flights.</div>
              ) : (
                filteredFleet.map(f => (
                  <div
                    key={f.flightId}
                    className={`wp-flight-row ${selectedFlight === f.flightId ? 'selected' : ''}`}
                    onClick={() => setSelectedFlight(f.flightId)}
                  >
                    <div className="wp-flight-info-main">
                      <span className="wp-callsign">{f.callsign}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className="wp-ac-type">{getAircraftName(f)}</span>
                        <span className={`wp-cat-pill ${classifyAircraft(getAircraftName(f), f.callsign)}`}>
                          {getAircraftCategoryLabel(classifyAircraft(getAircraftName(f), f.callsign))}
                        </span>
                      </div>
                    </div>
                    <div className="wp-flight-metrics">
                      {f.isParked ? (
                        <>
                          <span className="wp-metric-alt" style={{ color: '#94a3b8', fontSize: '11px' }}>Parked</span>
                          <span className="wp-metric-spd" style={{ color: '#64748b' }}>0 kts</span>
                        </>
                      ) : (
                        <>
                          <span className="wp-metric-alt">{Math.round(f.altitude).toLocaleString()} ft</span>
                          <span className="wp-metric-spd">{Math.round(f.speed)} kts</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab3 === 'stats' && (
            <div className="wp-stats-grid">
              <div className="wp-stat-box">
                <span className="wp-stat-label">Airborne</span>
                <span className="wp-stat-value" style={{ color: '#38bdf8' }}>{serverStats.airborne}</span>
              </div>
              <div className="wp-stat-box">
                <span className="wp-stat-label">Parked</span>
                <span className="wp-stat-value" style={{ color: '#94a3b8' }}>{serverStats.parked}</span>
              </div>
              <div className="wp-stat-box">
                <span className="wp-stat-label">Active ATC</span>
                <span className="wp-stat-value">{serverStats.atcCount}</span>
              </div>
              <div className="wp-stat-box">
                <span className="wp-stat-label">Max Speed</span>
                <span className="wp-stat-value">{serverStats.maxSpd} kts</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
