import React from 'react';
import CountryFlag from './CountryFlag';

export default function CountriesMap({ analytics, onBack }) {
  if (!analytics || !analytics.countriesList || analytics.countriesList.length === 0) {
    return (
      <div className="an-container">
        <div className="an-header">
          <button className="lb-back" onClick={onBack}><i className="fa-solid fa-arrow-left"></i></button>
          <h1 className="lb-title"><i className="fa-solid fa-earth-americas" style={{ color: 'var(--color-accent)', marginRight: '10px' }}></i>Countries Visited</h1>
        </div>
        <div className="lb-empty"><div>No countries visited yet. Fly to new destinations!</div></div>
      </div>
    );
  }

  const { countriesList, countriesCount, continentCounts } = analytics;
  const coveragePct = ((countriesCount / 195) * 100).toFixed(1);
  const totalVisits = countriesList.reduce((s, c) => s + c.count, 0);

  // Group by continent
  const byCont = {};
  countriesList.forEach(c => {
    if (!byCont[c.continent]) byCont[c.continent] = [];
    byCont[c.continent].push(c);
  });

  const continentColors = {
    'Europe': '#38bdf8', 'Asia': '#38bdf8', 'North America': '#38bdf8',
    'Africa': '#38bdf8', 'South America': '#38bdf8', 'Oceania': '#38bdf8', 'Unknown': '#64748b'
  };

  return (
    <div className="cm-container">
      {/* Header */}
      <div className="an-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="lb-back" onClick={onBack}><i className="fa-solid fa-arrow-left"></i></button>
          <div>
            <h1 className="lb-title"><i className="fa-solid fa-earth-americas" style={{ color: 'var(--color-accent)', marginRight: '10px' }}></i>Countries Visited</h1>
            <div className="lb-subtitle">Your global flight coverage</div>
          </div>
        </div>
      </div>

      {/* Coverage Hero */}
      <div className="cm-hero">
        <div className="cm-hero-ring-wrap">
          <svg viewBox="0 0 120 120" className="cm-ring-svg">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-accent)" strokeWidth="8"
              strokeDasharray={`${(countriesCount / 195) * 327} 327`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="cm-ring-inner">
            <div className="cm-ring-num">{countriesCount}</div>
            <div className="cm-ring-lbl">of 195</div>
          </div>
        </div>
        <div className="cm-hero-stats">
          <div className="cm-hero-stat">
            <div className="cm-hero-val">{coveragePct}%</div>
            <div className="cm-hero-slbl">World Coverage</div>
          </div>
          <div className="cm-hero-stat">
            <div className="cm-hero-val">{totalVisits}</div>
            <div className="cm-hero-slbl">Total Visits</div>
          </div>
          <div className="cm-hero-stat">
            <div className="cm-hero-val">{Object.keys(byCont).length}</div>
            <div className="cm-hero-slbl">Continents</div>
          </div>
        </div>
      </div>

      {/* Continental Sections */}
      <div className="cm-continents">
        {Object.entries(byCont).sort((a, b) => b[1].length - a[1].length).map(([continent, countries]) => (
          <div key={continent} className="cm-continent-section">
            <div className="cm-continent-header">
              <span className="cm-continent-dot" style={{ background: 'var(--color-accent)' }}></span>
              <span className="cm-continent-name">{continent}</span>
              <span className="cm-continent-count">{countries.length} {countries.length === 1 ? 'country' : 'countries'}</span>
            </div>
            <div className="cm-country-grid">
              {countries.map(c => (
                <div key={c.name} className="cm-country-card">
                  <div className="cm-country-flag" style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CountryFlag country={c.name} flag={c.flag} size="md" />
                  </div>
                  <div className="cm-country-info">
                    <div className="cm-country-name">{c.name}</div>
                    <div className="cm-country-visits">{c.count} {c.count === 1 ? 'flight' : 'flights'}</div>
                  </div>
                  <div className="cm-country-bar-bg">
                    <div className="cm-country-bar" style={{
                      width: `${(c.count / countriesList[0].count) * 100}%`,
                      background: 'var(--color-accent)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
