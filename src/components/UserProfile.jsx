import React, { useState } from 'react';
import { getGradeInfo, GRADE_INFO } from '../hooks/useInfiniteFlight';

export default function UserProfile({
  userProfile,
  updateProfile,
  fetchPilot,
  pilotLoading,
  pilotError,
  analytics,
  onClose
}) {
  const [searchPilotInput, setSearchPilotInput] = useState('');

  const grade = getGradeInfo(userProfile.grade);
  const nextGrade = GRADE_INFO.find(g => g.grade === userProfile.grade + 1);
  const xpProgress = nextGrade
    ? Math.min(((userProfile.xp - grade.minXP) / (nextGrade.minXP - grade.minXP)) * 100, 100)
    : 100;

  const displayName = userProfile.username || userProfile.discourseUsername || 'Pilot';
  const initials = displayName
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  const gradeNumber = Math.min(5, Math.max(1, userProfile.grade || 1));

  const handleSearchPilot = (e) => {
    e.preventDefault();
    if (searchPilotInput.trim()) {
      fetchPilot(searchPilotInput.trim());
      setSearchPilotInput('');
    }
  };

  const handleSyncCurrent = () => {
    if (userProfile?.discourseUsername || userProfile?.username) {
      fetchPilot(userProfile.discourseUsername || userProfile.username);
    }
  };

  // Extract rules if available from gradeDetails
  const currentGradeRules = userProfile?.gradeDetails?.gradeDetails?.grades?.[(userProfile.grade || 1) - 1]?.rules || [];

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="up-panel" onClick={e => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className="up-header-bar">
          <div className="up-header-title">Pilot Credentials</div>
          <div className="up-header-actions">
            <div className="up-sync-badge">
              <span className="up-sync-dot"></span>
              <span>IFC LIVE</span>
            </div>
            <button
              className="up-icon-btn"
              onClick={handleSyncCurrent}
              disabled={pilotLoading}
              title="Re-sync latest stats from Infinite Flight"
            >
              <i className={`fa-solid fa-rotate ${pilotLoading ? 'fa-spin' : ''}`}></i>
            </button>
            <button className="up-icon-btn" onClick={onClose} title="Close Profile">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Minimalist Search Bar */}
        <form onSubmit={handleSearchPilot} className="up-search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search pilot by IFC username (e.g. Laura, Cameron)…"
            value={searchPilotInput}
            onChange={e => setSearchPilotInput(e.target.value)}
          />
          {searchPilotInput.trim() && (
            <button type="submit" className="up-search-submit" disabled={pilotLoading}>
              {pilotLoading ? 'Searching…' : 'Search'}
            </button>
          )}
        </form>

        {pilotError && (
          <div style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '6px 10px', borderRadius: '6px' }}>
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '5px' }}></i>
            {pilotError}
          </div>
        )}

        {/* Pilot Crest & Header */}
        <div className="up-pilot-card">
          <div className="up-crest">{initials}</div>
          <div className="up-epaulet-stripes" title={`Grade ${gradeNumber} Epaulet Bars`}>
            {Array.from({ length: gradeNumber }).map((_, i) => (
              <span key={i} className="up-epaulet-stripe"></span>
            ))}
          </div>
          <div className="up-grade-pill">
            Grade {gradeNumber} · {grade.name}
          </div>
          <div className="up-pilot-name">{displayName}</div>
          <div className="up-pilot-meta">
            {userProfile.virtualOrganization || userProfile.virtualAirline ? (
              <span>{userProfile.virtualOrganization || userProfile.virtualAirline}</span>
            ) : null}
            {(userProfile.virtualOrganization || userProfile.virtualAirline) && <span>·</span>}
            <span>@{userProfile.discourseUsername || userProfile.username}</span>
          </div>
        </div>

        {/* XP Progression */}
        <div className="up-xp-section">
          <div className="up-xp-header">
            <span className="up-xp-label">Experience Points</span>
            <span className="up-xp-value">{(userProfile.xp || 0).toLocaleString()} XP</span>
          </div>
          <div className="up-xp-bar-bg">
            <div className="up-xp-bar-fill" style={{ width: `${xpProgress}%` }}></div>
          </div>
          <div className="up-xp-sub">
            <span>Career Standing</span>
            {nextGrade ? (
              <span>{Math.round(xpProgress)}% to Grade {nextGrade.grade}</span>
            ) : (
              <span>Maximum Rank Reached</span>
            )}
          </div>
        </div>

        {/* Key Stats 4-Grid */}
        <div className="up-stats-grid">
          <div className="up-stat">
            <div className="up-stat-num">{userProfile.onlineFlights || analytics?.totalFlights || 0}</div>
            <div className="up-stat-lbl">Flights</div>
          </div>
          <div className="up-stat">
            <div className="up-stat-num">{userProfile.totalHours || analytics?.totalHours || 0}h</div>
            <div className="up-stat-lbl">Flight Time</div>
          </div>
          <div className="up-stat">
            <div className="up-stat-num">{userProfile.landingCount || 0}</div>
            <div className="up-stat-lbl">Landings</div>
          </div>
          <div className="up-stat">
            <div className="up-stat-num">{userProfile.atcOps || 0}</div>
            <div className="up-stat-lbl">ATC Ops</div>
          </div>
        </div>

        {/* Official Grade Requirements */}
        {currentGradeRules.length > 0 && (
          <div>
            <div className="up-section-title">
              Grade {gradeNumber} Requirements
            </div>
            <div className="up-table-wrap">
              {currentGradeRules.map((r, i) => (
                <div key={i} className="up-table-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i
                      className={`fa-solid ${r.state === 1 ? 'fa-check' : 'fa-circle-notch'}`}
                      style={{ color: r.state === 1 ? '#94a3b8' : '#64748b', fontSize: '11px' }}
                    ></i>
                    <span style={{ color: '#cbd5e1' }}>{r.definition?.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ffffff' }}>
                    {r.userValueString} <span style={{ color: '#64748b', fontWeight: 400 }}>/ {r.referenceValueString}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety & Violations */}
        <div>
          <div className="up-section-title">Safety & Violations</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div className="up-stat">
              <div className="up-stat-num">{userProfile.violationCountByLevel?.level1 || 0}</div>
              <div className="up-stat-lbl">Level 1</div>
            </div>
            <div className="up-stat">
              <div className="up-stat-num">{userProfile.violationCountByLevel?.level2 || 0}</div>
              <div className="up-stat-lbl">Level 2</div>
            </div>
            <div className="up-stat">
              <div className="up-stat-num">{userProfile.violationCountByLevel?.level3 || 0}</div>
              <div className="up-stat-lbl">Level 3</div>
            </div>
          </div>
        </div>

        {/* Flight Highlights */}
        <div>
          <div className="up-section-title">Flight Highlights</div>
          <div className="up-table-wrap">
            <div className="up-table-row">
              <span style={{ color: '#64748b' }}>Longest Flight</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                {analytics?.longestFlight ? `${analytics.longestFlight.callsign} · ${analytics.longestFlight.departure} → ${analytics.longestFlight.arrival} (${analytics.longestFlight.duration}h)` : '—'}
              </span>
            </div>
            <div className="up-table-row">
              <span style={{ color: '#64748b' }}>Countries Visited</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                {analytics?.countriesCount || 0} countries
              </span>
            </div>
            <div className="up-table-row">
              <span style={{ color: '#64748b' }}>Top Aircraft</span>
              <span style={{ color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                {analytics?.topAircraft?.[0] ? `${analytics.topAircraft[0][0]} (${analytics.topAircraft[0][1]} flights)` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
