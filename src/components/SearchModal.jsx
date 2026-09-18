import React, { useState, useEffect, useRef } from 'react';
import { classifyAircraft, getAircraftCategoryLabel } from '../utils/aircraftIcons';
import CountryFlag from './CountryFlag';

export default function SearchModal({
  isOpen,
  onClose,
  flights,
  airports,
  atcList,
  onSelectFlight,
  onSelectAirport,
  getAircraftName
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingAirports = q ? airports.filter(a =>
    a.icao.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q)
  ).slice(0, 5) : airports.slice(0, 4);

  const matchingFlights = q ? flights.filter(f =>
    (f.callsign || '').toLowerCase().includes(q) ||
    (f.username || '').toLowerCase().includes(q) ||
    getAircraftName(f).toLowerCase().includes(q)
  ).slice(0, 10) : flights.slice(0, 6);

  return (
    <div className="wp-modal-backdrop" onClick={onClose}>
      <div className="wp-search-modal wp-glass" onClick={e => e.stopPropagation()}>
        <div className="wp-search-input-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search flights by callsign/pilot, or airports by ICAO…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '4px 8px' }}
          >
            ESC
          </button>
        </div>

        <div className="wp-search-results">
          {/* Airports Section */}
          {matchingAirports.length > 0 && (
            <>
              <div className="wp-search-section-title">
                <i className="fa-solid fa-plane-arrival" style={{ marginRight: '6px' }}></i>
                Airports
              </div>
              {matchingAirports.map(a => {
                const atcCount = atcList.filter(atc => atc.airportName === a.icao).length;
                return (
                  <div
                    key={a.icao}
                    className="wp-search-item"
                    onClick={() => { onSelectAirport(a.icao); onClose(); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CountryFlag country={a.country} flag={a.flag} icao={a.icao} size="sm" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {a.icao}
                      </span>
                      <span style={{ fontSize: '13px', color: '#ffffff' }}>{a.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>({a.city})</span>
                    </div>
                    {atcCount > 0 && (
                      <span className="wp-tag twr" style={{ fontSize: '9px' }}>{atcCount} ATC</span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Flights Section */}
          {matchingFlights.length > 0 && (
            <>
              <div className="wp-search-section-title" style={{ marginTop: '6px' }}>
                <i className="fa-solid fa-plane" style={{ marginRight: '6px' }}></i>
                Flights
              </div>
              {matchingFlights.map(f => {
                const acName = getAircraftName(f);
                const cat = classifyAircraft(acName, f.callsign);
                return (
                  <div
                    key={f.flightId}
                    className="wp-search-item"
                    onClick={() => { onSelectFlight(f.flightId); onClose(); }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>{f.callsign}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {f.username}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{acName}</span>
                        <span className={`wp-cat-pill ${cat}`}>{getAircraftCategoryLabel(cat)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {f.isParked ? (
                        <div style={{ color: '#94a3b8', fontWeight: 600 }}>Parked</div>
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
            </>
          )}

          {matchingAirports.length === 0 && matchingFlights.length === 0 && (
            <div className="wp-empty-msg">No results matching "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
