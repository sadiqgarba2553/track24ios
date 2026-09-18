import React, { useState, useMemo } from 'react';
import { ATC_TYPE_TAGS } from '../hooks/useInfiniteFlight';
import { classifyAircraft, getAircraftCategoryLabel } from '../utils/aircraftIcons';
import CountryFlag from './CountryFlag';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  getRecentAlerts,
  getWatchedFlightIds,
  toggleWatchFlight
} from '../utils/notifications';

export default function MobileBottomSheet({
  isOpen,
  activeTab,
  onClose,
  flights,
  atcList,
  airports,
  selectedFlight,
  onSelectFlight,
  onSelectAirport,
  getAircraftName,
  getLiveryName,
  favorites,
  isFavorite,
  toggleFavorite,
  onOpenSettings,
  onOpenProfile,
  onSwitchView,
  userProfile,
  sessions,
  activeSessionId,
  switchSession
}) {
  const [fleetFilter, setFleetFilter] = useState('');
  const [fleetStatusTab, setFleetStatusTab] = useState('all'); // 'all' | 'airborne' | 'parked'
  const [fleetCatFilter, setFleetCatFilter] = useState('all');
  const [recentAlerts, setRecentAlerts] = useState(() => getRecentAlerts());
  const [notificationPerm, setNotificationPerm] = useState(() => getNotificationPermission());
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Refresh recent alerts when tab is opened
  const watchedIds = useMemo(() => getWatchedFlightIds(), [isOpen, activeTab]);

  const watchedFlights = useMemo(() => {
    return flights.filter(f => watchedIds.includes(f.flightId));
  }, [flights, watchedIds]);

  const filteredFleet = useMemo(() => {
    let list = flights;
    if (fleetStatusTab === 'airborne') {
      list = list.filter(f => !f.isParked);
    } else if (fleetStatusTab === 'parked') {
      list = list.filter(f => f.isParked);
    }

    if (fleetCatFilter !== 'all') {
      list = list.filter(f => {
        const cat = classifyAircraft(getAircraftName(f), f.callsign);
        if (fleetCatFilter === 'widebody') return cat === 'heavy' || cat === 'widebody';
        if (fleetCatFilter === 'narrowbody') return cat === 'narrowbody';
        if (fleetCatFilter === 'cargo') {
          const text = `${f.callsign || ''} ${f.liveryName || ''}`.toLowerCase();
          return text.includes('cargo') || text.includes('fedex') || text.includes('ups') || text.includes('dhl');
        }
        if (fleetCatFilter === 'military') return cat === 'fighter';
        if (fleetCatFilter === 'ga') return cat === 'propeller' || cat === 'turboprop';
        return true;
      });
    }

    const q = fleetFilter.toLowerCase().trim();
    if (!q) return list.slice(0, 50);

    return list.filter(f =>
      (f.callsign || '').toLowerCase().includes(q) ||
      (f.username || '').toLowerCase().includes(q) ||
      getAircraftName(f).toLowerCase().includes(q)
    ).slice(0, 50);
  }, [flights, fleetFilter, fleetStatusTab, fleetCatFilter, getAircraftName]);

  const handleTestPush = async () => {
    setIsTestingPush(true);
    await sendTestNotification();
    setRecentAlerts(getRecentAlerts());
    setNotificationPerm(getNotificationPermission());
    setTimeout(() => setIsTestingPush(false), 800);
  };

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPerm(granted ? 'granted' : 'denied');
    if (granted) {
      await sendTestNotification();
      setRecentAlerts(getRecentAlerts());
    }
  };

  if (!isOpen || !activeTab) return null;

  return (
    <div className="wp-mob-sheet-backdrop" onClick={onClose}>
      <div className="wp-mob-sheet wp-glass" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="wp-mob-sheet-handle-bar">
          <div className="wp-mob-sheet-handle"></div>
        </div>

        {/* Sheet Top Header */}
        <div className="wp-mob-sheet-header">
          <div className="wp-mob-sheet-title">
            {activeTab === 'fleet' && <><i className="fa-solid fa-plane"></i> Live Fleet ({flights.length})</>}
            {activeTab === 'atc' && <><i className="fa-solid fa-tower-broadcast"></i> Active ATC ({atcList.length})</>}
            {activeTab === 'airports' && <><i className="fa-solid fa-plane-arrival"></i> Top Airports</>}
            {activeTab === 'alerts' && <><i className="fa-solid fa-bell"></i> Notifications & Radar Alerts</>}
            {activeTab === 'more' && <><i className="fa-solid fa-ellipsis"></i> Menu & Settings</>}
          </div>
          <button className="wp-close-btn" onClick={onClose} title="Close sheet">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Sheet Body Content */}
        <div className="wp-mob-sheet-body">
          {/* ══════════ TAB 1: FLEET ══════════ */}
          {activeTab === 'fleet' && (
            <div className="wp-mob-fleet-container">
              {/* Search */}
              <div className="wp-mob-search-wrap">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Search callsign, pilot, aircraft…"
                  value={fleetFilter}
                  onChange={(e) => setFleetFilter(e.target.value)}
                />
                {fleetFilter && (
                  <button className="wp-mob-clear-btn" onClick={() => setFleetFilter('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Status pills */}
              <div className="wp-mob-pill-row">
                <button
                  className={`wp-mob-filter-pill ${fleetStatusTab === 'all' ? 'active' : ''}`}
                  onClick={() => setFleetStatusTab('all')}
                >
                  All ({flights.length})
                </button>
                <button
                  className={`wp-mob-filter-pill ${fleetStatusTab === 'airborne' ? 'active' : ''}`}
                  onClick={() => setFleetStatusTab('airborne')}
                >
                  Airborne ({flights.filter(f => !f.isParked).length})
                </button>
                <button
                  className={`wp-mob-filter-pill ${fleetStatusTab === 'parked' ? 'active' : ''}`}
                  onClick={() => setFleetStatusTab('parked')}
                >
                  Parked ({flights.filter(f => f.isParked).length})
                </button>
              </div>

              {/* Category pills */}
              <div className="wp-mob-cat-row">
                {['all', 'widebody', 'narrowbody', 'cargo', 'military', 'ga'].map(cat => (
                  <button
                    key={cat}
                    className={`wp-mob-cat-pill ${fleetCatFilter === cat ? 'active' : ''}`}
                    onClick={() => setFleetCatFilter(cat)}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Flight List */}
              <div className="wp-mob-flight-list">
                {filteredFleet.length === 0 ? (
                  <div className="wp-empty-msg">No aircraft matching search.</div>
                ) : (
                  filteredFleet.map(f => {
                    const acType = getAircraftName(f);
                    const cat = classifyAircraft(acType, f.callsign);
                    return (
                      <div
                        key={f.flightId}
                        className={`wp-mob-flight-item ${selectedFlight === f.flightId ? 'selected' : ''}`}
                        onClick={() => {
                          onSelectFlight(f.flightId);
                          onClose();
                        }}
                      >
                        <div className="wp-mob-fitem-left">
                          <div className="wp-mob-fitem-callsign-row">
                            <span className="wp-callsign">{f.callsign || 'FLIGHT'}</span>
                            <span className={`wp-cat-pill ${cat}`}>
                              {getAircraftCategoryLabel(cat)}
                            </span>
                            {f.isParked ? (
                              <span className="wp-badge-parked">PARKED</span>
                            ) : (
                              <span className="wp-badge-airborne">AIR</span>
                            )}
                          </div>
                          <div className="wp-mob-fitem-sub">
                            <span>{acType}</span>
                            {f.username && <span className="wp-dot-sep">·</span>}
                            {f.username && <span>{f.username}</span>}
                          </div>
                        </div>

                        <div className="wp-mob-fitem-right">
                          {f.isParked ? (
                            <span className="wp-metric-val">Gate</span>
                          ) : (
                            <>
                              <span className="wp-metric-val">{Math.round(f.altitude || 0).toLocaleString()} ft</span>
                              <span className="wp-metric-sub">{Math.round(f.speed || 0)} kts</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ══════════ TAB 2: ATC ══════════ */}
          {activeTab === 'atc' && (
            <div className="wp-mob-atc-container">
              {atcList.length === 0 ? (
                <div className="wp-empty-msg">No active ATC frequencies on this server.</div>
              ) : (
                <div className="wp-mob-atc-list">
                  {atcList.map(a => {
                    const tag = (ATC_TYPE_TAGS[a.type] || 'ATC').toLowerCase();
                    return (
                      <div
                        key={a.frequencyId}
                        className="wp-mob-atc-item"
                        onClick={() => {
                          if (a.airportName && onSelectAirport) {
                            onSelectAirport(a.airportName);
                            onClose();
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`wp-tag ${tag}`}>{ATC_TYPE_TAGS[a.type] || 'ATC'}</span>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                              {a.airportName || 'FIR Sector'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Controller: {a.username}
                            </div>
                          </div>
                        </div>
                        <button className="wp-mob-action-btn">
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════ TAB 3: AIRPORTS ══════════ */}
          {activeTab === 'airports' && (
            <div className="wp-mob-airports-container">
              <div className="wp-mob-airports-list">
                {airports.map(ap => {
                  const nearbyCount = flights.filter(f => {
                    if (f.latitude == null || f.longitude == null) return false;
                    const d = Math.hypot(ap.lat - f.latitude, ap.lon - f.longitude) * 60;
                    return d <= 45;
                  }).length;

                  return (
                    <div
                      key={ap.icao}
                      className="wp-mob-airport-item"
                      onClick={() => {
                        onSelectAirport(ap.icao);
                        onClose();
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CountryFlag country={ap.country} flag={ap.flag} icao={ap.icao} size="sm" />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                            {ap.icao}
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                            {ap.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {ap.city}, {ap.country}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span className="wp-tab-badge" style={{ fontSize: '11px', padding: '3px 7px' }}>
                          {nearbyCount} aircraft
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════ TAB 4: ALERTS & PUSH NOTIFICATIONS ══════════ */}
          {activeTab === 'alerts' && (
            <div className="wp-mob-alerts-container">
              {/* Push permission status card */}
              <div className="wp-mob-perm-card wp-glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`wp-perm-dot ${notificationPerm === 'granted' ? 'active' : 'inactive'}`}></div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Web Push Notifications
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Status: {notificationPerm === 'granted' ? 'Active & Ready' : notificationPerm === 'denied' ? 'Blocked in Browser' : 'Not Yet Enabled'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  {notificationPerm !== 'granted' && (
                    <button className="wp-btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} onClick={handleEnablePush}>
                      <i className="fa-solid fa-bell" style={{ marginRight: '6px' }}></i>
                      Enable Push
                    </button>
                  )}
                  <button
                    className="wp-btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                    onClick={handleTestPush}
                    disabled={isTestingPush}
                  >
                    <i className={`fa-solid ${isTestingPush ? 'fa-spinner fa-spin' : 'fa-bullhorn'}`} style={{ marginRight: '6px' }}></i>
                    {isTestingPush ? 'Testing…' : 'Send Test Alert'}
                  </button>
                </div>
              </div>

              {/* Watched Flights section */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Watched Flights ({watchedFlights.length})
                </div>
                {watchedFlights.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    No flights currently watched. Tap the bell <i className="fa-regular fa-bell" style={{ color: 'var(--color-accent)' }}></i> inside any flight drawer to receive descent, approach, and touchdown notifications.
                  </div>
                ) : (
                  <div className="wp-mob-watched-list">
                    {watchedFlights.map(f => (
                      <div
                        key={f.flightId}
                        className="wp-mob-watched-item"
                        onClick={() => {
                          onSelectFlight(f.flightId);
                          onClose();
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fa-solid fa-bell" style={{ color: 'var(--color-accent)' }}></i>
                          <div>
                            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>{f.callsign}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{getAircraftName(f)}</span>
                          </div>
                        </div>
                        <button
                          className="wp-mob-unwatch-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchFlight(f.flightId);
                          }}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Alerts Log */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Recent Radar Alerts ({recentAlerts.length})
                </div>
                {recentAlerts.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    No radar alerts yet. Squawk 7700 emergencies and watched flights will log here.
                  </div>
                ) : (
                  <div className="wp-mob-alerts-log">
                    {recentAlerts.map(a => (
                      <div key={a.id} className={`wp-mob-alert-log-item ${a.type || 'info'}`}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px', color: a.type === 'emergency' ? '#f87171' : '#38bdf8' }}>
                            {a.title}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                          {a.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ TAB 5: MORE / MENU ══════════ */}
          {activeTab === 'more' && (
            <div className="wp-mob-more-container">
              {/* Server Switcher on Mobile */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Infinite Flight Server
                </div>
                <div className="wp-mob-server-grid">
                  {sessions.map(s => {
                    const isExpert = /expert/i.test(s.name) || s.id.includes('expert');
                    const isTraining = /training/i.test(s.name) || s.id.includes('training');
                    const label = isExpert ? 'Expert Server' : isTraining ? 'Training Server' : 'Casual Server';
                    const isCurrent = s.id === activeSessionId;
                    return (
                      <button
                        key={s.id}
                        className={`wp-mob-server-btn ${isCurrent ? 'active' : ''}`}
                        onClick={() => {
                          switchSession(s.id);
                        }}
                      >
                        <span className="server-dot" style={{ background: isCurrent ? 'var(--color-accent)' : 'rgba(255, 255, 255, 0.28)', boxShadow: 'none' }}></span>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700 }}>{label}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.userCount ?? 0} pilots online</div>
                        </div>
                        {isCurrent && <i className="fa-solid fa-check" style={{ color: 'var(--color-accent)' }}></i>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Switchers */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Navigation Views
                </div>
                <div className="wp-mob-views-list">
                  <button
                    className="wp-mob-view-row"
                    onClick={() => { onSwitchView('map'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-map-location-dot" style={{ color: 'var(--color-accent)' }}></i>
                      <span>Live Radar Map</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  </button>

                  <button
                    className="wp-mob-view-row"
                    onClick={() => { onSwitchView('logbook'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-book" style={{ color: 'var(--color-accent)' }}></i>
                      <span>Pilot Logbook & History</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  </button>

                  <button
                    className="wp-mob-view-row"
                    onClick={() => { onSwitchView('analytics'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: 'var(--color-accent)' }}></i>
                      <span>Radar Fleet Analytics</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  </button>

                  <button
                    className="wp-mob-view-row"
                    onClick={() => { onSwitchView('countries'); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-earth-americas" style={{ color: 'var(--color-accent)' }}></i>
                      <span>Global Country Traffic</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  </button>
                </div>
              </div>

              {/* Tools & Settings */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Preferences & Tools
                </div>
                <div className="wp-mob-views-list">
                  <button
                    className="wp-mob-view-row"
                    onClick={() => { onClose(); onOpenSettings(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-sliders" style={{ color: 'var(--color-accent)' }}></i>
                      <span>Map Display & Basemap Settings</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  </button>

                  <button
                    className="wp-mob-view-row"
                    onClick={() => { onClose(); onOpenProfile(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-user-pilot" style={{ color: 'var(--color-accent)' }}></i>
                      <span>Pilot Profile: {userProfile?.discourseUsername || userProfile?.username || 'Pilot'}</span>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', color: 'var(--text-muted)' }}></i>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
