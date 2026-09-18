import React, { useState, useMemo } from 'react';
import { classifyAircraft, getAircraftCategoryLabel } from '../utils/aircraftIcons';
import CountryFlag from './CountryFlag';

export default function Logbook({
  logbook,
  userProfile,
  fetchPilot,
  pilotLoading,
  onBack
}) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = logbook || [];
    if (q) {
      list = list.filter(e =>
        (e.callsign || '').toLowerCase().includes(q) ||
        (e.aircraft || '').toLowerCase().includes(q) ||
        (e.livery || '').toLowerCase().includes(q) ||
        (e.departure || '').toLowerCase().includes(q) ||
        (e.arrival || '').toLowerCase().includes(q) ||
        (e.depCity || '').toLowerCase().includes(q) ||
        (e.arrCity || '').toLowerCase().includes(q) ||
        (e.depCountry || '').toLowerCase().includes(q) ||
        (e.arrCountry || '').toLowerCase().includes(q) ||
        (e.server || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case 'date': va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); break;
        case 'duration': va = a.duration || 0; vb = b.duration || 0; break;
        case 'distance': va = a.distance || 0; vb = b.distance || 0; break;
        case 'altitude': va = a.maxAlt || 0; vb = b.maxAlt || 0; break;
        default: va = 0; vb = 0;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return list;
  }, [logbook, search, sortBy, sortDir]);

  const totalHrs = filtered.reduce((s, e) => s + (e.duration || 0), 0);
  const totalDist = filtered.reduce((s, e) => s + (e.distance || 0), 0);

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const sortArrow = (field) => sortBy === field ? (sortDir === 'desc' ? ' ▼' : ' ▲') : '';

  const handleRefresh = () => {
    if (fetchPilot && (userProfile?.discourseUsername || userProfile?.username)) {
      fetchPilot(userProfile.discourseUsername || userProfile.username);
    }
  };

  return (
    <div className="lb-container">
      {/* Header */}
      <div className="lb-header">
        <div className="lb-header-left">
          <button className="lb-back" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="lb-title" style={{ margin: 0 }}>
                <i className="fa-solid fa-book" style={{ color: 'var(--color-accent)', marginRight: '10px' }}></i>
                Pilot Logbook
              </h1>
              <span style={{
                background: 'rgba(34,197,94,0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.3)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
                API: {userProfile?.discourseUsername || userProfile?.username || 'Pilot'}
              </span>
            </div>
            <div className="lb-subtitle">
              {filtered.length} flights · {Math.round(totalHrs * 10) / 10} hours · {totalDist.toLocaleString()} nm
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRefresh}
            disabled={pilotLoading}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '6px 14px',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh flights from Infinite Flight API"
          >
            <i className={`fa-solid fa-rotate ${pilotLoading ? 'fa-spin' : ''}`} style={{ color: 'var(--color-accent)' }}></i>
            <span>{pilotLoading ? 'Syncing…' : 'Sync API'}</span>
          </button>

          <div className="lb-search-wrap">
            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--text-muted)', fontSize: '13px' }}></i>
            <input
              type="text"
              placeholder="Search callsign, aircraft, airport, country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="lb-search"
            />
          </div>
        </div>
      </div>

      {/* Sort Bar */}
      <div className="lb-sort-bar">
        <button className={`lb-sort-btn ${sortBy === 'date' ? 'active' : ''}`} onClick={() => toggleSort('date')}>
          Date{sortArrow('date')}
        </button>
        <button className={`lb-sort-btn ${sortBy === 'duration' ? 'active' : ''}`} onClick={() => toggleSort('duration')}>
          Duration{sortArrow('duration')}
        </button>
        <button className={`lb-sort-btn ${sortBy === 'distance' ? 'active' : ''}`} onClick={() => toggleSort('distance')}>
          Distance{sortArrow('distance')}
        </button>
        <button className={`lb-sort-btn ${sortBy === 'altitude' ? 'active' : ''}`} onClick={() => toggleSort('altitude')}>
          Max Alt{sortArrow('altitude')}
        </button>
      </div>

      {/* Flight List */}
      <div className="lb-list">
        {filtered.map(entry => {
          const expanded = expandedId === entry.id;
          const d = new Date(entry.date);
          const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={entry.id}
              className={`lb-entry ${expanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(expanded ? null : entry.id)}
            >
              {/* Main Row */}
              <div className="lb-entry-main">
                <div className="lb-entry-date-col">
                  <div className="lb-date">{dateStr}</div>
                  <div className="lb-time">{timeStr}</div>
                </div>

                <div className="lb-entry-route-col">
                  <div className="lb-callsign">{entry.callsign}</div>
                  <div className="lb-route">
                    <span className="lb-icao" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CountryFlag country={entry.depCountry} flag={entry.depFlag} icao={entry.departure} size="sm" />
                      <span>{entry.departure}</span>
                    </span>
                    <span className="lb-route-arrow">
                      <span className="lb-route-line"></span>
                      <i className="fa-solid fa-plane" style={{ fontSize: '10px', color: 'var(--color-accent)' }}></i>
                      <span className="lb-route-line"></span>
                    </span>
                    <span className="lb-icao" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <CountryFlag country={entry.arrCountry} flag={entry.arrFlag} icao={entry.arrival} size="sm" />
                      <span>{entry.arrival}</span>
                    </span>
                  </div>
                  <div className="lb-cities">{entry.depCity || entry.departure} → {entry.arrCity || entry.arrival}</div>
                </div>

                <div className="lb-entry-ac-col">
                  <div className="lb-ac-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{entry.aircraft}</span>
                    <span className={`wp-cat-pill ${classifyAircraft(entry.aircraft, entry.callsign)}`}>
                      {getAircraftCategoryLabel(classifyAircraft(entry.aircraft, entry.callsign))}
                    </span>
                  </div>
                  <div className="lb-livery">{entry.livery}</div>
                </div>

                <div className="lb-entry-stats-col">
                  <div className="lb-dur">{entry.duration}h</div>
                  <div className="lb-dist">{(entry.distance || 0).toLocaleString()} nm</div>
                </div>

                <div className="lb-entry-status-col">
                  <span className={`lb-status ${entry.status}`}>
                    {entry.status === 'completed' ? '✓' : entry.status === 'diverted' ? '⚠' : '✈'}
                  </span>
                  <span className="lb-server-tag">{entry.server}</span>
                </div>

                <div className="lb-expand-icon">
                  <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`}></i>
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded && (
                <div className="lb-detail">
                  <div className="lb-detail-grid">
                    <div className="lb-detail-item">
                      <span className="lb-detail-label">Departure Country</span>
                      <span className="lb-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CountryFlag country={entry.depCountry} flag={entry.depFlag} icao={entry.departure} size="sm" />
                        <span>{entry.depCountry}</span>
                      </span>
                    </div>
                    <div className="lb-detail-item">
                      <span className="lb-detail-label">Arrival Country</span>
                      <span className="lb-detail-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CountryFlag country={entry.arrCountry} flag={entry.arrFlag} icao={entry.arrival} size="sm" />
                        <span>{entry.arrCountry}</span>
                      </span>
                    </div>
                    <div className="lb-detail-item">
                      <span className="lb-detail-label">Server</span>
                      <span className="lb-detail-value">{entry.server}</span>
                    </div>
                    <div className="lb-detail-item">
                      <span className="lb-detail-label">Flight Time</span>
                      <span className="lb-detail-value">{entry.duration} hours ({entry.durationMins || Math.round(entry.duration * 60)} mins)</span>
                    </div>
                    {entry.xp > 0 && (
                      <div className="lb-detail-item">
                        <span className="lb-detail-label">XP Earned</span>
                        <span className="lb-detail-value" style={{ color: '#38bdf8', fontWeight: 600 }}>+{(entry.xp || 0).toLocaleString()} XP</span>
                      </div>
                    )}
                    {entry.fuelUsedKg != null && (
                      <div className="lb-detail-item">
                        <span className="lb-detail-label">Fuel Used</span>
                        <span className="lb-detail-value">{(entry.fuelUsedKg).toLocaleString()} kg</span>
                      </div>
                    )}
                  </div>

                  {/* Mini altitude bar */}
                  <div className="lb-alt-mini">
                    <div className="lb-alt-mini-label">Est. Cruise Level</div>
                    <div className="lb-alt-mini-bar-bg">
                      <div className="lb-alt-mini-bar" style={{ width: `${Math.min((entry.maxAlt || 0) / 450, 100)}%` }}></div>
                    </div>
                    <div className="lb-alt-mini-val">FL{Math.round((entry.maxAlt || 0) / 100)}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="lb-empty">
            <i className="fa-solid fa-book-open" style={{ fontSize: '36px', color: 'var(--text-muted)', marginBottom: '12px' }}></i>
            <div>No flights match your search.</div>
          </div>
        )}
      </div>
    </div>
  );
}
