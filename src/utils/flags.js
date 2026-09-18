// ── Comprehensive Country Code & Flag Resolution Utility ──

// Comprehensive mapping from country names to ISO 3166-1 alpha-2 codes
export const COUNTRY_NAME_TO_CODE = {
  "united kingdom": "gb",
  "great britain": "gb",
  "england": "gb",
  "scotland": "gb",
  "wales": "gb",
  "united states": "us",
  "united states of america": "us",
  "usa": "us",
  "united arab emirates": "ae",
  "uae": "ae",
  "saudi arabia": "sa",
  "qatar": "qa",
  "bahrain": "bh",
  "kuwait": "kw",
  "oman": "om",
  "iraq": "iq",
  "iran": "ir",
  "france": "fr",
  "germany": "de",
  "netherlands": "nl",
  "belgium": "be",
  "spain": "es",
  "italy": "it",
  "switzerland": "ch",
  "austria": "at",
  "turkey": "tr",
  "poland": "pl",
  "denmark": "dk",
  "norway": "no",
  "sweden": "se",
  "finland": "fi",
  "ireland": "ie",
  "portugal": "pt",
  "greece": "gr",
  "canada": "ca",
  "mexico": "mx",
  "brazil": "br",
  "argentina": "ar",
  "chile": "cl",
  "colombia": "co",
  "peru": "pe",
  "south africa": "za",
  "nigeria": "ng",
  "ethiopia": "et",
  "egypt": "eg",
  "kenya": "ke",
  "morocco": "ma",
  "ghana": "gh",
  "algeria": "dz",
  "tunisia": "tn",
  "japan": "jp",
  "south korea": "kr",
  "korea": "kr",
  "china": "cn",
  "hong kong": "hk",
  "taiwan": "tw",
  "singapore": "sg",
  "thailand": "th",
  "malaysia": "my",
  "indonesia": "id",
  "philippines": "ph",
  "vietnam": "vn",
  "india": "in",
  "pakistan": "pk",
  "bangladesh": "bd",
  "sri lanka": "lk",
  "nepal": "np",
  "australia": "au",
  "new zealand": "nz",
  "papua new guinea": "pg",
  "fiji": "fj",
  "malta": "mt",
  "maldives": "mv",
  "iceland": "is",
  "russia": "ru",
  "ukraine": "ua",
  "czech republic": "cz",
  "hungary": "hu",
  "romania": "ro",
  "croatia": "hr",
  "serbia": "rs",
  "bulgaria": "bg",
  "cyprus": "cy",
  "israel": "il",
  "jordan": "jo",
  "lebanon": "lb",
  "kazakhstan": "kz",
  "uzbekistan": "uz",
  "georgia": "ge",
  "azerbaijan": "az",
  "armenia": "am"
};

// ICAO prefix to ISO-2 country code
export const ICAO_PREFIX_TO_CODE = {
  "EG": "gb",
  "OM": "ae",
  "OK": "kw",
  "OB": "bh",
  "OT": "qa",
  "OE": "sa",
  "OR": "iq",
  "OI": "ir",
  "OO": "om",
  "LF": "fr",
  "ED": "de",
  "EH": "nl",
  "EB": "be",
  "LE": "es",
  "LI": "it",
  "LS": "ch",
  "LO": "at",
  "LT": "tr",
  "EP": "pl",
  "EK": "dk",
  "EN": "no",
  "ES": "se",
  "EF": "fi",
  "EI": "ie",
  "LP": "pt",
  "LG": "gr",
  "K": "us",
  "C": "ca",
  "MM": "mx",
  "SB": "br",
  "SD": "br",
  "SS": "br",
  "SA": "ar",
  "SC": "cl",
  "SK": "co",
  "SP": "pe",
  "FA": "za",
  "DN": "ng",
  "HA": "et",
  "HE": "eg",
  "HK": "ke",
  "GM": "ma",
  "DG": "gh",
  "DA": "dz",
  "DT": "tn",
  "RJ": "jp",
  "RO": "jp",
  "RK": "kr",
  "RP": "ph",
  "VT": "th",
  "VV": "vn",
  "WM": "my",
  "WB": "my",
  "WS": "sg",
  "WI": "id",
  "WA": "id",
  "ZB": "cn",
  "ZS": "cn",
  "ZG": "cn",
  "ZL": "cn",
  "ZP": "cn",
  "ZU": "cn",
  "ZH": "cn",
  "ZW": "cn",
  "ZY": "cn",
  "VH": "hk",
  "RC": "tw",
  "VO": "in",
  "VI": "in",
  "VA": "in",
  "VE": "in",
  "VC": "lk",
  "VN": "np",
  "OP": "pk",
  "VG": "bd",
  "Y": "au",
  "NZ": "nz",
  "AY": "pg",
  "NF": "fj",
  "LM": "mt",
  "VR": "mv"
};

/**
 * Extracts 2-letter ISO code from Unicode regional indicator emoji flag.
 * Regional Indicator Symbol letter A is U+1F1E6.
 */
export function emojiToCountryCode(emoji) {
  if (!emoji || typeof emoji !== 'string') return null;
  const trimmed = emoji.trim();
  if (/^[a-zA-Z]{2}$/.test(trimmed)) return trimmed.toLowerCase();

  const chars = [...trimmed];
  if (chars.length >= 2) {
    const code1 = chars[0].codePointAt(0);
    const code2 = chars[1].codePointAt(0);
    if (code1 >= 0x1F1E6 && code1 <= 0x1F1FF && code2 >= 0x1F1E6 && code2 <= 0x1F1FF) {
      const c1 = String.fromCharCode(code1 - 0x1F1E6 + 97);
      const c2 = String.fromCharCode(code2 - 0x1F1E6 + 97);
      return `${c1}${c2}`;
    }
  }
  return null;
}

/**
 * Robust country code resolver from any input:
 * { code, country, flag, icao }
 */
export function resolveCountryCode({ code, country, flag, icao } = {}) {
  // 1. Direct 2-letter code
  if (code && /^[a-zA-Z]{2}$/.test(code.trim())) {
    return code.trim().toLowerCase();
  }

  // 2. From Unicode Flag
  if (flag) {
    const fromEmoji = emojiToCountryCode(flag);
    if (fromEmoji) return fromEmoji;
  }

  // 3. From Country Name
  if (country && typeof country === 'string') {
    const norm = country.toLowerCase().trim();
    if (COUNTRY_NAME_TO_CODE[norm]) return COUNTRY_NAME_TO_CODE[norm];
    for (const key in COUNTRY_NAME_TO_CODE) {
      if (norm.includes(key) || key.includes(norm)) {
        return COUNTRY_NAME_TO_CODE[key];
      }
    }
  }

  // 4. From ICAO Airport Code
  if (icao && typeof icao === 'string') {
    const clean = icao.toUpperCase().trim();
    if (clean.length >= 2) {
      const p2 = clean.slice(0, 2);
      if (ICAO_PREFIX_TO_CODE[p2]) return ICAO_PREFIX_TO_CODE[p2];
      const p1 = clean.slice(0, 1);
      if (ICAO_PREFIX_TO_CODE[p1]) return ICAO_PREFIX_TO_CODE[p1];
    }
  }

  return null;
}

/**
 * Returns a high-res flag URL from FlagCDN
 */
export function getFlagUrl(countryCode, size = 'w40') {
  if (!countryCode) return null;
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`;
}
