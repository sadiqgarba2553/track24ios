import React, { useState } from 'react';

function FlightPanel({ flight, onClose, getAircraftName, getLiveryName }) {
  if (!flight) return null;

  return (
    <div id="flightPanel" className="flight-panel" style={{ display: 'block', position: 'relative', height: '100%' }}>
      <div className="fp-header-top" style={{ padding: '20px' }}>
        <div className="fp-header-titles">
          <h2 style={{ margin: 0, color: 'white' }}>{flight.callsign || '–'}</h2>
          <div style={{ color: '#cbd5e1' }}>{getAircraftName(flight)}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{getLiveryName(flight)}</div>
        </div>
        <div className="fp-header-actions">
          <button className="icon-btn" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      
      <div className="fp-content" style={{ padding: '0 20px' }}>
        <div className="fp-stat-grid">
          <div className="fp-stat-row">
            <span className="fp-label">ALTITUDE</span><span className="fp-val bold">{Math.round(flight.altitude).toLocaleString()} ft</span>
          </div>
          <div className="fp-stat-row">
            <span className="fp-label">GROUND SPEED</span><span className="fp-val bold">{Math.round(flight.speed)} kts</span>
          </div>
          <div className="fp-stat-row">
            <span className="fp-label">HEADING</span><span className="fp-val bold">{Math.round(flight.heading)}°</span>
          </div>
          <div className="fp-stat-row">
            <span className="fp-label">V/S</span><span className="fp-val bold">{Math.round(flight.verticalSpeed)} fpm</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ flights, selectedFlight, setSelectedFlight, getAircraftName, getLiveryName }) {
  const [search, setSearch] = useState('');

  const selectedFlightObj = flights.find(f => f.flightId === selectedFlight);

  if (selectedFlightObj) {
    return (
      <div className="sidebar right-sidebar" style={{ display: 'block' }}>
        <FlightPanel 
          flight={selectedFlightObj} 
          onClose={() => setSelectedFlight(null)} 
          getAircraftName={getAircraftName}
          getLiveryName={getLiveryName}
        />
      </div>
    );
  }

  const filtered = flights.filter(f => 
    (f.callsign || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar right-sidebar" style={{ display: 'block' }}>
      <div className="sidebar-header">
        <span><i className="fa-solid fa-list-ul"></i> Fleet Board</span>
      </div>
      <div className="sidebar-search">
        <input 
          type="text" 
          placeholder="Filter flights…" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="fleet-list" style={{ overflowY: 'auto', flex: 1 }}>
        {filtered.slice(0, 100).map(f => (
          <div 
            key={f.flightId} 
            className="fleet-item"
            onClick={() => setSelectedFlight(f.flightId)}
            style={{ cursor: 'pointer' }}
          >
            <div className="fleet-item-main">
              <span className="fleet-callsign">{f.callsign || 'Unknown'}</span>
              <span className="fleet-ac">{getAircraftName(f)}</span>
            </div>
            <div className="fleet-item-sub">
              <span>{Math.round(f.altitude)} ft</span>
              <span>{Math.round(f.speed)} kts</span>
            </div>
          </div>
        ))}
        {filtered.length > 100 && (
          <div style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
            Showing 100 of {filtered.length}
          </div>
        )}
      </div>
    </div>
  );
}
