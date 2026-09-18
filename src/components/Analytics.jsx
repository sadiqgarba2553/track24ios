import React from 'react';

export default function Analytics({ analytics, onBack }) {
  if (!analytics) {
    return (
      <div className="an-container">
        <div className="an-header">
          <button className="lb-back" onClick={onBack}><i className="fa-solid fa-arrow-left"></i></button>
          <h1 className="lb-title"><i className="fa-solid fa-chart-pie" style={{ color: 'var(--color-accent)', marginRight: '10px' }}></i>Flight Analytics</h1>
        </div>
        <div className="lb-empty"><div>No flight data available yet. Start flying to see your analytics!</div></div>
      </div>
    );
  }

  const { totalFlights, totalHours, totalDistance, maxAlt, maxSpd, topAircraft, topAirports, monthlyHours, altBuckets, serverCounts, continentCounts, countriesCount } = analytics;

  const maxMonthly = Math.max(...Object.values(monthlyHours), 1);
  const maxAircraftCount = topAircraft.length > 0 ? topAircraft[0][1] : 1;
  const maxAltBucket = Math.max(...Object.values(altBuckets), 1);
  const maxContinentCount = Math.max(...Object.values(continentCounts), 1);

  return (
    <div className="an-container">
      {/* Header */}
      <div className="an-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="lb-back" onClick={onBack}><i className="fa-solid fa-arrow-left"></i></button>
          <div>
            <h1 className="lb-title"><i className="fa-solid fa-chart-pie" style={{ color: 'var(--color-accent)', marginRight: '10px' }}></i>Flight Analytics</h1>
            <div className="lb-subtitle">Your complete flight intelligence dashboard</div>
          </div>
        </div>
      </div>

      {/* Hero Stats Row */}
      <div className="an-hero-row">
        <div className="an-hero-card">
          <div className="an-hero-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><i className="fa-solid fa-plane" style={{ color: 'var(--color-accent)' }}></i></div>
          <div className="an-hero-num">{totalFlights}</div>
          <div className="an-hero-lbl">Total Flights</div>
        </div>
        <div className="an-hero-card">
          <div className="an-hero-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><i className="fa-solid fa-clock" style={{ color: 'var(--color-accent)' }}></i></div>
          <div className="an-hero-num">{totalHours}</div>
          <div className="an-hero-lbl">Flight Hours</div>
        </div>
        <div className="an-hero-card">
          <div className="an-hero-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><i className="fa-solid fa-route" style={{ color: 'var(--color-accent)' }}></i></div>
          <div className="an-hero-num">{totalDistance.toLocaleString()}</div>
          <div className="an-hero-lbl">Nautical Miles</div>
        </div>
        <div className="an-hero-card">
          <div className="an-hero-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><i className="fa-solid fa-earth-americas" style={{ color: 'var(--color-accent)' }}></i></div>
          <div className="an-hero-num">{countriesCount}</div>
          <div className="an-hero-lbl">Countries Visited</div>
        </div>
        <div className="an-hero-card">
          <div className="an-hero-icon" style={{ background: 'rgba(56,189,248,0.1)' }}><i className="fa-solid fa-mountain-sun" style={{ color: 'var(--color-accent)' }}></i></div>
          <div className="an-hero-num">FL{Math.round(maxAlt / 100)}</div>
          <div className="an-hero-lbl">Highest Altitude</div>
        </div>
      </div>

      <div className="an-grid">
        {/* Monthly Hours Chart */}
        <div className="an-chart-card">
          <div className="an-chart-title"><i className="fa-solid fa-chart-bar" style={{ marginRight: '8px' }}></i>Flight Hours by Month</div>
          <div className="an-bar-chart">
            {Object.entries(monthlyHours).map(([month, hrs]) => (
              <div key={month} className="an-bar-col">
                <div className="an-bar-value">{Math.round(hrs * 10) / 10}h</div>
                <div className="an-bar-track">
                  <div className="an-bar-fill" style={{
                    height: `${Math.max((hrs / maxMonthly) * 100, 4)}%`,
                    background: '#0ea5e9'
                  }}></div>
                </div>
                <div className="an-bar-label">{month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Aircraft */}
        <div className="an-chart-card">
          <div className="an-chart-title"><i className="fa-solid fa-plane" style={{ marginRight: '8px' }}></i>Top Aircraft</div>
          <div className="an-h-bars">
            {topAircraft.map(([name, count]) => (
              <div key={name} className="an-h-bar-row">
                <div className="an-h-bar-name">{name}</div>
                <div className="an-h-bar-track">
                  <div className="an-h-bar-fill" style={{
                    width: `${(count / maxAircraftCount) * 100}%`,
                    background: '#0284c7'
                  }}></div>
                </div>
                <div className="an-h-bar-count">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Airports */}
        <div className="an-chart-card">
          <div className="an-chart-title"><i className="fa-solid fa-tower-broadcast" style={{ marginRight: '8px' }}></i>Top Airports</div>
          <div className="an-airport-list">
            {topAirports.map(([icao, count], i) => {
              return (
                <div key={icao} className="an-airport-row">
                  <div className="an-airport-rank">#{i + 1}</div>
                  <div className="an-airport-icao">{icao}</div>
                  <div className="an-airport-bar-track">
                    <div className="an-airport-bar-fill" style={{
                      width: `${(count / topAirports[0][1]) * 100}%`,
                      background: '#0ea5e9'
                    }}></div>
                  </div>
                  <div className="an-airport-count">{count} flights</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Altitude Distribution */}
        <div className="an-chart-card">
          <div className="an-chart-title"><i className="fa-solid fa-mountain" style={{ marginRight: '8px' }}></i>Altitude Distribution</div>
          <div className="an-bar-chart an-alt-chart">
            {Object.entries(altBuckets).map(([range, count]) => (
              <div key={range} className="an-bar-col">
                <div className="an-bar-value">{count}</div>
                <div className="an-bar-track">
                  <div className="an-bar-fill" style={{
                    height: `${Math.max((count / maxAltBucket) * 100, 4)}%`,
                    background: '#0284c7'
                  }}></div>
                </div>
                <div className="an-bar-label">{range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Continental Breakdown */}
        <div className="an-chart-card">
          <div className="an-chart-title"><i className="fa-solid fa-globe" style={{ marginRight: '8px' }}></i>Flights by Continent</div>
          <div className="an-h-bars">
            {Object.entries(continentCounts).sort((a, b) => b[1] - a[1]).map(([continent, count]) => {
              return (
                <div key={continent} className="an-h-bar-row">
                  <div className="an-h-bar-name">{continent}</div>
                  <div className="an-h-bar-track">
                    <div className="an-h-bar-fill" style={{
                      width: `${(count / maxContinentCount) * 100}%`,
                      background: '#0ea5e9'
                    }}></div>
                  </div>
                  <div className="an-h-bar-count">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Server Breakdown */}
        <div className="an-chart-card">
          <div className="an-chart-title"><i className="fa-solid fa-server" style={{ marginRight: '8px' }}></i>Server Breakdown</div>
          <div className="an-server-breakdown">
            {Object.entries(serverCounts).map(([server, count]) => {
              const pct = Math.round((count / totalFlights) * 100);
              const color = /expert/i.test(server) ? 'var(--color-expert)' : /training/i.test(server) ? 'var(--color-training)' : 'var(--color-casual)';
              return (
                <div key={server} className="an-server-row">
                  <div className="an-server-dot" style={{ background: color }}></div>
                  <div className="an-server-name">{server}</div>
                  <div className="an-server-bar-bg">
                    <div className="an-server-bar" style={{ width: `${pct}%`, background: color }}></div>
                  </div>
                  <div className="an-server-pct">{pct}% ({count})</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
