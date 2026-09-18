import React, { useState, useMemo } from 'react';
import { resolveCountryCode, getFlagUrl } from '../utils/flags';

export default function CountryFlag({
  code,
  country,
  flag,
  icao,
  size = 'md',
  className = '',
  style = {},
  title
}) {
  const [hasError, setHasError] = useState(false);

  const countryCode = useMemo(() => {
    return resolveCountryCode({ code, country, flag, icao });
  }, [code, country, flag, icao]);

  const flagUrl = useMemo(() => {
    if (!countryCode) return null;
    const cdnSize = size === 'lg' || size === 'xl' ? 'w80' : 'w40';
    return getFlagUrl(countryCode, cdnSize);
  }, [countryCode, size]);

  const resolvedTitle = title || country || (countryCode ? countryCode.toUpperCase() : 'Country');

  if (!countryCode || hasError || !flagUrl) {
    if (flag && flag !== '🌍' && flag !== '✈') {
      return (
        <span
          className={`wp-flag-fallback ${className}`}
          style={{ fontSize: size === 'lg' ? '18px' : '14px', lineHeight: 1, ...style }}
          title={resolvedTitle}
        >
          {flag}
        </span>
      );
    }
    if (countryCode) {
      return (
        <span
          className={`wp-flag-badge-fallback ${className}`}
          style={{ ...style }}
          title={resolvedTitle}
        >
          {countryCode.toUpperCase()}
        </span>
      );
    }
    return (
      <span className={`wp-flag-fallback ${className}`} style={{ ...style }} title="Global">
        🌍
      </span>
    );
  }

  const sizeClass = size === 'sm' ? 'wp-real-flag-sm' :
                    size === 'lg' ? 'wp-real-flag-lg' :
                    size === 'xl' ? 'wp-real-flag-xl' : 'wp-real-flag-md';

  return (
    <img
      src={flagUrl}
      srcSet={countryCode ? `https://flagcdn.com/w80/${countryCode}.png 2x` : undefined}
      alt={resolvedTitle}
      title={resolvedTitle}
      className={`wp-real-flag ${sizeClass} ${className}`}
      style={style}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
