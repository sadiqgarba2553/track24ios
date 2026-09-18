// ── Comprehensive Global Airport Database & ICAO Country Resolver ──

export const AIRPORT_DATABASE = {
  // United Kingdom
  "EGLL": { icao: "EGLL", iata: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.4700, lon: -0.4543 },
  "EGKK": { icao: "EGKK", iata: "LGW", name: "London Gatwick", city: "London", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.1481, lon: -0.1903 },
  "EGSS": { icao: "EGSS", iata: "STN", name: "London Stansted", city: "London", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.8850, lon: 0.2350 },
  "EGCC": { icao: "EGCC", iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 53.3537, lon: -2.2750 },
  "EGKN": { icao: "EGKN", iata: "—", name: "Oaksey Park", city: "Oaksey", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.6267, lon: -2.0233 },
  "EGLM": { icao: "EGLM", iata: "—", name: "White Waltham Airfield", city: "Maidenhead", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.4853, lon: -0.7744 },
  "EGTO": { icao: "EGTO", iata: "RCS", name: "Rochester Airport", city: "Rochester", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.3522, lon: 0.5039 },
  "EGFD": { icao: "EGFD", iata: "—", name: "Kemble Airfield", city: "Kemble", country: "United Kingdom", continent: "Europe", flag: "🇬🇧", lat: 51.6681, lon: -2.0569 },

  // United Arab Emirates & Middle East
  "OMDB": { icao: "OMDB", iata: "DXB", name: "Dubai International", city: "Dubai", country: "United Arab Emirates", continent: "Asia", flag: "🇦🇪", lat: 25.2532, lon: 55.3657 },
  "OMAA": { icao: "OMAA", iata: "AUH", name: "Zayed International", city: "Abu Dhabi", country: "United Arab Emirates", continent: "Asia", flag: "🇦🇪", lat: 24.4330, lon: 54.6511 },
  "OMSJ": { icao: "OMSJ", iata: "SHJ", name: "Sharjah International", city: "Sharjah", country: "United Arab Emirates", continent: "Asia", flag: "🇦🇪", lat: 25.3286, lon: 55.5172 },
  "OMDW": { icao: "OMDW", iata: "DWC", name: "Al Maktoum International", city: "Dubai", country: "United Arab Emirates", continent: "Asia", flag: "🇦🇪", lat: 24.8960, lon: 55.1614 },
  "OKKK": { icao: "OKKK", iata: "KWI", name: "Kuwait International", city: "Kuwait City", country: "Kuwait", continent: "Asia", flag: "🇰🇼", lat: 29.2269, lon: 47.9789 },
  "OBBI": { icao: "OBBI", iata: "BAH", name: "Bahrain International", city: "Manama", country: "Bahrain", continent: "Asia", flag: "🇧🇭", lat: 26.2708, lon: 50.6336 },
  "OTHH": { icao: "OTHH", iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", continent: "Asia", flag: "🇶🇦", lat: 25.2731, lon: 51.6081 },
  "OEJN": { icao: "OEJN", iata: "JED", name: "King Abdulaziz Intl", city: "Jeddah", country: "Saudi Arabia", continent: "Asia", flag: "🇸🇦", lat: 21.6796, lon: 39.1564 },
  "OERK": { icao: "OERK", iata: "RUH", name: "King Khalid Intl", city: "Riyadh", country: "Saudi Arabia", continent: "Asia", flag: "🇸🇦", lat: 24.9576, lon: 46.6988 },
  "OEDF": { icao: "OEDF", iata: "DMM", name: "King Fahd International", city: "Dammam", country: "Saudi Arabia", continent: "Asia", flag: "🇸🇦", lat: 26.4712, lon: 49.7979 },
  "ORBD": { icao: "ORBD", iata: "BGW", name: "Baghdad International", city: "Baghdad", country: "Iraq", continent: "Asia", flag: "🇮🇶", lat: 33.2625, lon: 44.2344 },
  "OIBK": { icao: "OIBK", iata: "KIH", name: "Kish International", city: "Kish Island", country: "Iran", continent: "Asia", flag: "🇮🇷", lat: 26.5262, lon: 53.9803 },
  "OIIE": { icao: "OIIE", iata: "IKA", name: "Tehran Imam Khomeini", city: "Tehran", country: "Iran", continent: "Asia", flag: "🇮🇷", lat: 35.4161, lon: 51.1522 },
  "OOMS": { icao: "OOMS", iata: "MCT", name: "Muscat International", city: "Muscat", country: "Oman", continent: "Asia", flag: "🇴🇲", lat: 23.5933, lon: 58.2844 },

  // India & South Asia
  "VOMM": { icao: "VOMM", iata: "MAA", name: "Chennai International", city: "Chennai", country: "India", continent: "Asia", flag: "🇮🇳", lat: 12.9941, lon: 80.1709 },
  "VIDP": { icao: "VIDP", iata: "DEL", name: "Indira Gandhi Intl", city: "Delhi", country: "India", continent: "Asia", flag: "🇮🇳", lat: 28.5562, lon: 77.1000 },
  "VABB": { icao: "VABB", iata: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "India", continent: "Asia", flag: "🇮🇳", lat: 19.0896, lon: 72.8656 },
  "VOBL": { icao: "VOBL", iata: "BLR", name: "Kempegowda International", city: "Bengaluru", country: "India", continent: "Asia", flag: "🇮🇳", lat: 13.1979, lon: 77.7063 },
  "VOTR": { icao: "VOTR", iata: "TRZ", name: "Tiruchirappalli Intl", city: "Tiruchirappalli", country: "India", continent: "Asia", flag: "🇮🇳", lat: 10.7654, lon: 78.7097 },
  "VOCL": { icao: "VOCL", iata: "CCJ", name: "Calicut International", city: "Kozhikode", country: "India", continent: "Asia", flag: "🇮🇳", lat: 11.1368, lon: 75.9553 },
  "VCBI": { icao: "VCBI", iata: "CMB", name: "Bandaranaike Intl", city: "Colombo", country: "Sri Lanka", continent: "Asia", flag: "🇱🇰", lat: 7.1808, lon: 79.8841 },
  "VNKT": { icao: "VNKT", iata: "KTM", name: "Tribhuvan International", city: "Kathmandu", country: "Nepal", continent: "Asia", flag: "🇳🇵", lat: 27.6966, lon: 85.3591 },
  "OPKC": { icao: "OPKC", iata: "KHI", name: "Jinnah International", city: "Karachi", country: "Pakistan", continent: "Asia", flag: "🇵🇰", lat: 24.9065, lon: 67.1608 },

  // Europe
  "LFPG": { icao: "LFPG", iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", continent: "Europe", flag: "🇫🇷", lat: 49.0097, lon: 2.5479 },
  "LFPO": { icao: "LFPO", iata: "ORY", name: "Orly Airport", city: "Paris", country: "France", continent: "Europe", flag: "🇫🇷", lat: 48.7233, lon: 2.3794 },
  "LFFE": { icao: "LFFE", iata: "—", name: "Enghien Moisselles", city: "Moisselles", country: "France", continent: "Europe", flag: "🇫🇷", lat: 49.0308, lon: 2.3481 },
  "EDDF": { icao: "EDDF", iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", continent: "Europe", flag: "🇩🇪", lat: 50.0379, lon: 8.5622 },
  "EDDM": { icao: "EDDM", iata: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", continent: "Europe", flag: "🇩🇪", lat: 48.3538, lon: 11.7861 },
  "EDDK": { icao: "EDDK", iata: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "Germany", continent: "Europe", flag: "🇩🇪", lat: 50.8659, lon: 7.1427 },
  "EHAM": { icao: "EHAM", iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", continent: "Europe", flag: "🇳🇱", lat: 52.3105, lon: 4.7683 },
  "EBBR": { icao: "EBBR", iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", continent: "Europe", flag: "🇧🇪", lat: 50.9014, lon: 4.4844 },
  "LEMD": { icao: "LEMD", iata: "MAD", name: "Madrid-Barajas", city: "Madrid", country: "Spain", continent: "Europe", flag: "🇪🇸", lat: 40.4839, lon: -3.5680 },
  "LEBL": { icao: "LEBL", iata: "BCN", name: "Barcelona-El Prat", city: "Barcelona", country: "Spain", continent: "Europe", flag: "🇪🇸", lat: 41.2974, lon: 2.0833 },
  "LIRF": { icao: "LIRF", iata: "FCO", name: "Rome Fiumicino", city: "Rome", country: "Italy", continent: "Europe", flag: "🇮🇹", lat: 41.8003, lon: 12.2389 },
  "LIMC": { icao: "LIMC", iata: "MXP", name: "Milan Malpensa", city: "Milan", country: "Italy", continent: "Europe", flag: "🇮🇹", lat: 45.6306, lon: 8.7281 },
  "LSZH": { icao: "LSZH", iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", continent: "Europe", flag: "🇨🇭", lat: 47.4582, lon: 8.5555 },
  "LOWW": { icao: "LOWW", iata: "VIE", name: "Vienna International", city: "Vienna", country: "Austria", continent: "Europe", flag: "🇦🇹", lat: 48.1103, lon: 16.5697 },
  "LTFM": { icao: "LTFM", iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", continent: "Europe", flag: "🇹🇷", lat: 41.2753, lon: 28.7519 },
  "EPWA": { icao: "EPWA", iata: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", continent: "Europe", flag: "🇵🇱", lat: 52.1672, lon: 20.9679 },
  "EKCH": { icao: "EKCH", iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", continent: "Europe", flag: "🇩🇰", lat: 55.6180, lon: 12.6560 },
  "ENGM": { icao: "ENGM", iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norway", continent: "Europe", flag: "🇳🇴", lat: 60.1975, lon: 11.1004 },
  "ESSA": { icao: "ESSA", iata: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", continent: "Europe", flag: "🇸🇪", lat: 59.6498, lon: 17.9238 },
  "EFHK": { icao: "EFHK", iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland", continent: "Europe", flag: "🇫🇮", lat: 60.3172, lon: 24.9633 },
  "EIDW": { icao: "EIDW", iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", continent: "Europe", flag: "🇮🇪", lat: 53.4264, lon: -6.2499 },
  "LPPT": { icao: "LPPT", iata: "LIS", name: "Lisbon Airport", city: "Lisbon", country: "Portugal", continent: "Europe", flag: "🇵🇹", lat: 38.7742, lon: -9.1342 },
  "LGAV": { icao: "LGAV", iata: "ATH", name: "Athens International", city: "Athens", country: "Greece", continent: "Europe", flag: "🇬🇷", lat: 37.9364, lon: 23.9445 },

  // North America
  "KJFK": { icao: "KJFK", iata: "JFK", name: "John F. Kennedy Intl", city: "New York", country: "United States", continent: "North America", flag: "🇺🇸", lat: 40.6413, lon: -73.7781 },
  "KLAX": { icao: "KLAX", iata: "LAX", name: "Los Angeles Intl", city: "Los Angeles", country: "United States", continent: "North America", flag: "🇺🇸", lat: 33.9416, lon: -118.4085 },
  "KORD": { icao: "KORD", iata: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "United States", continent: "North America", flag: "🇺🇸", lat: 41.9742, lon: -87.9073 },
  "KATL": { icao: "KATL", iata: "ATL", name: "Hartsfield-Jackson", city: "Atlanta", country: "United States", continent: "North America", flag: "🇺🇸", lat: 33.6407, lon: -84.4277 },
  "KSFO": { icao: "KSFO", iata: "SFO", name: "San Francisco Intl", city: "San Francisco", country: "United States", continent: "North America", flag: "🇺🇸", lat: 37.6213, lon: -122.3790 },
  "KMIA": { icao: "KMIA", iata: "MIA", name: "Miami International", city: "Miami", country: "United States", continent: "North America", flag: "🇺🇸", lat: 25.7959, lon: -80.2870 },
  "KDFW": { icao: "KDFW", iata: "DFW", name: "Dallas/Fort Worth", city: "Dallas", country: "United States", continent: "North America", flag: "🇺🇸", lat: 32.8998, lon: -97.0403 },
  "KDEN": { icao: "KDEN", iata: "DEN", name: "Denver International", city: "Denver", country: "United States", continent: "North America", flag: "🇺🇸", lat: 39.8561, lon: -104.6737 },
  "KBOS": { icao: "KBOS", iata: "BOS", name: "Boston Logan", city: "Boston", country: "United States", continent: "North America", flag: "🇺🇸", lat: 42.3656, lon: -71.0096 },
  "KSEA": { icao: "KSEA", iata: "SEA", name: "Seattle-Tacoma", city: "Seattle", country: "United States", continent: "North America", flag: "🇺🇸", lat: 47.4502, lon: -122.3088 },
  "KLAS": { icao: "KLAS", iata: "LAS", name: "Harry Reid International", city: "Las Vegas", country: "United States", continent: "North America", flag: "🇺🇸", lat: 36.0840, lon: -115.1537 },
  "KIAD": { icao: "KIAD", iata: "IAD", name: "Washington Dulles", city: "Washington D.C.", country: "United States", continent: "North America", flag: "🇺🇸", lat: 38.9531, lon: -77.4565 },
  "KTTS": { icao: "KTTS", iata: "QSC", name: "NASA Shuttle Landing Facility", city: "Cape Canaveral", country: "United States", continent: "North America", flag: "🇺🇸", lat: 28.6150, lon: -80.6945 },
  "CYYZ": { icao: "CYYZ", iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "Canada", continent: "North America", flag: "🇨🇦", lat: 43.6777, lon: -79.6248 },
  "CYVR": { icao: "CYVR", iata: "YVR", name: "Vancouver International", city: "Vancouver", country: "Canada", continent: "North America", flag: "🇨🇦", lat: 49.1967, lon: -123.1815 },
  "MMMX": { icao: "MMMX", iata: "MEX", name: "Mexico City Benito Juárez", city: "Mexico City", country: "Mexico", continent: "North America", flag: "🇲🇽", lat: 19.4363, lon: -99.0721 },

  // East & Southeast Asia
  "RJTT": { icao: "RJTT", iata: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", continent: "Asia", flag: "🇯🇵", lat: 35.5494, lon: 139.7798 },
  "RJAA": { icao: "RJAA", iata: "NRT", name: "Tokyo Narita", city: "Tokyo", country: "Japan", continent: "Asia", flag: "🇯🇵", lat: 35.7720, lon: 140.3929 },
  "WSSS": { icao: "WSSS", iata: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore", continent: "Asia", flag: "🇸🇬", lat: 1.3644, lon: 103.9915 },
  "VHHH": { icao: "VHHH", iata: "HKG", name: "Hong Kong Intl", city: "Hong Kong", country: "Hong Kong", continent: "Asia", flag: "🇭🇰", lat: 22.3080, lon: 113.9185 },
  "VTBS": { icao: "VTBS", iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", continent: "Asia", flag: "🇹🇭", lat: 13.6900, lon: 100.7501 },
  "RPLL": { icao: "RPLL", iata: "MNL", name: "Ninoy Aquino Intl", city: "Manila", country: "Philippines", continent: "Asia", flag: "🇵🇭", lat: 14.5086, lon: 121.0197 },
  "WIII": { icao: "WIII", iata: "CGK", name: "Soekarno-Hatta", city: "Jakarta", country: "Indonesia", continent: "Asia", flag: "🇮🇩", lat: -6.1256, lon: 106.6558 },
  "WMKK": { icao: "WMKK", iata: "KUL", name: "Kuala Lumpur Intl", city: "Kuala Lumpur", country: "Malaysia", continent: "Asia", flag: "🇲🇾", lat: 2.7456, lon: 101.7099 },
  "RKSI": { icao: "RKSI", iata: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea", continent: "Asia", flag: "🇰🇷", lat: 37.4602, lon: 126.4407 },
  "ZBAA": { icao: "ZBAA", iata: "PEK", name: "Beijing Capital", city: "Beijing", country: "China", continent: "Asia", flag: "🇨🇳", lat: 40.0799, lon: 116.6031 },
  "ZSPD": { icao: "ZSPD", iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China", continent: "Asia", flag: "🇨🇳", lat: 31.1443, lon: 121.8083 },
  "RCTP": { icao: "RCTP", iata: "TPE", name: "Taiwan Taoyuan", city: "Taipei", country: "Taiwan", continent: "Asia", flag: "🇹🇼", lat: 25.0797, lon: 121.2342 },

  // Africa
  "FAOR": { icao: "FAOR", iata: "JNB", name: "O.R. Tambo Intl", city: "Johannesburg", country: "South Africa", continent: "Africa", flag: "🇿🇦", lat: -26.1367, lon: 28.2411 },
  "FACT": { icao: "FACT", iata: "CPT", name: "Cape Town International", city: "Cape Town", country: "South Africa", continent: "Africa", flag: "🇿🇦", lat: -33.9715, lon: 18.6021 },
  "DNMM": { icao: "DNMM", iata: "LOS", name: "Murtala Muhammed", city: "Lagos", country: "Nigeria", continent: "Africa", flag: "🇳🇬", lat: 6.5774, lon: 3.3212 },
  "DNAA": { icao: "DNAA", iata: "ABV", name: "Nnamdi Azikiwe Intl", city: "Abuja", country: "Nigeria", continent: "Africa", flag: "🇳🇬", lat: 9.0065, lon: 7.2632 },
  "HAAB": { icao: "HAAB", iata: "ADD", name: "Bole International", city: "Addis Ababa", country: "Ethiopia", continent: "Africa", flag: "🇪🇹", lat: 8.9779, lon: 38.7993 },
  "HECA": { icao: "HECA", iata: "CAI", name: "Cairo International", city: "Cairo", country: "Egypt", continent: "Africa", flag: "🇪🇬", lat: 30.1219, lon: 31.4056 },
  "HKJK": { icao: "HKJK", iata: "NBO", name: "Jomo Kenyatta Intl", city: "Nairobi", country: "Kenya", continent: "Africa", flag: "🇰🇪", lat: -1.3192, lon: 36.9278 },
  "GMMN": { icao: "GMMN", iata: "CMN", name: "Mohammed V Intl", city: "Casablanca", country: "Morocco", continent: "Africa", flag: "🇲🇦", lat: 33.3675, lon: -7.5899 },
  "DGAA": { icao: "DGAA", iata: "ACC", name: "Kotoka International", city: "Accra", country: "Ghana", continent: "Africa", flag: "🇬🇭", lat: 5.6052, lon: -0.1668 },

  // South America & Oceania
  "SBGR": { icao: "SBGR", iata: "GRU", name: "São Paulo-Guarulhos", city: "São Paulo", country: "Brazil", continent: "South America", flag: "🇧🇷", lat: -23.4356, lon: -46.4731 },
  "SBGL": { icao: "SBGL", iata: "GIG", name: "Rio de Janeiro-Galeão", city: "Rio de Janeiro", country: "Brazil", continent: "South America", flag: "🇧🇷", lat: -22.8089, lon: -43.2436 },
  "SAEZ": { icao: "SAEZ", iata: "EZE", name: "Ministro Pistarini", city: "Buenos Aires", country: "Argentina", continent: "South America", flag: "🇦🇷", lat: -34.8222, lon: -58.5358 },
  "SCEL": { icao: "SCEL", iata: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "Chile", continent: "South America", flag: "🇨🇱", lat: -33.3930, lon: -70.7858 },
  "SKBO": { icao: "SKBO", iata: "BOG", name: "El Dorado International", city: "Bogotá", country: "Colombia", continent: "South America", flag: "🇨🇴", lat: 4.7016, lon: -74.1469 },
  "YSSY": { icao: "YSSY", iata: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", continent: "Oceania", flag: "🇦🇺", lat: -33.9399, lon: 151.1753 },
  "YMML": { icao: "YMML", iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", continent: "Oceania", flag: "🇦🇺", lat: -37.6690, lon: 144.8410 },
  "NZAA": { icao: "NZAA", iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", continent: "Oceania", flag: "🇳🇿", lat: -37.0082, lon: 174.7850 },
};

// ── Global ICAO Prefix Fallback Table ──
const ICAO_PREFIX_RULES = [
  { prefix: "EG", country: "United Kingdom", continent: "Europe", flag: "🇬🇧" },
  { prefix: "LF", country: "France", continent: "Europe", flag: "🇫🇷" },
  { prefix: "ED", country: "Germany", continent: "Europe", flag: "🇩🇪" },
  { prefix: "ET", country: "Germany", continent: "Europe", flag: "🇩🇪" },
  { prefix: "EH", country: "Netherlands", continent: "Europe", flag: "🇳🇱" },
  { prefix: "EB", country: "Belgium", continent: "Europe", flag: "🇧🇪" },
  { prefix: "ELLX", country: "Luxembourg", continent: "Europe", flag: "🇱🇺" },
  { prefix: "LI", country: "Italy", continent: "Europe", flag: "🇮🇹" },
  { prefix: "LE", country: "Spain", continent: "Europe", flag: "🇪🇸" },
  { prefix: "LP", country: "Portugal", continent: "Europe", flag: "🇵🇹" },
  { prefix: "LS", country: "Switzerland", continent: "Europe", flag: "🇨🇭" },
  { prefix: "LO", country: "Austria", continent: "Europe", flag: "🇦🇹" },
  { prefix: "LT", country: "Turkey", continent: "Europe", flag: "🇹🇷" },
  { prefix: "LG", country: "Greece", continent: "Europe", flag: "🇬🇷" },
  { prefix: "EP", country: "Poland", continent: "Europe", flag: "🇵🇱" },
  { prefix: "LK", country: "Czech Republic", continent: "Europe", flag: "🇨🇿" },
  { prefix: "LH", country: "Hungary", continent: "Europe", flag: "🇭🇺" },
  { prefix: "EK", country: "Denmark", continent: "Europe", flag: "🇩🇰" },
  { prefix: "EN", country: "Norway", continent: "Europe", flag: "🇳🇴" },
  { prefix: "ES", country: "Sweden", continent: "Europe", flag: "🇸🇪" },
  { prefix: "EF", country: "Finland", continent: "Europe", flag: "🇫🇮" },
  { prefix: "EI", country: "Ireland", continent: "Europe", flag: "🇮🇪" },
  { prefix: "BI", country: "Iceland", continent: "Europe", flag: "🇮🇸" },
  { prefix: "OM", country: "United Arab Emirates", continent: "Asia", flag: "🇦🇪" },
  { prefix: "OK", country: "Kuwait", continent: "Asia", flag: "🇰🇼" },
  { prefix: "OE", country: "Saudi Arabia", continent: "Asia", flag: "🇸🇦" },
  { prefix: "OT", country: "Qatar", continent: "Asia", flag: "🇶🇦" },
  { prefix: "OB", country: "Bahrain", continent: "Asia", flag: "🇧🇭" },
  { prefix: "OO", country: "Oman", continent: "Asia", flag: "🇴🇲" },
  { prefix: "OR", country: "Iraq", continent: "Asia", flag: "🇮🇶" },
  { prefix: "OI", country: "Iran", continent: "Asia", flag: "🇮🇷" },
  { prefix: "VO", country: "India", continent: "Asia", flag: "🇮🇳" },
  { prefix: "VI", country: "India", continent: "Asia", flag: "🇮🇳" },
  { prefix: "VA", country: "India", continent: "Asia", flag: "🇮🇳" },
  { prefix: "VE", country: "India", continent: "Asia", flag: "🇮🇳" },
  { prefix: "VC", country: "Sri Lanka", continent: "Asia", flag: "🇱🇰" },
  { prefix: "VN", country: "Nepal", continent: "Asia", flag: "🇳🇵" },
  { prefix: "OP", country: "Pakistan", continent: "Asia", flag: "🇵🇰" },
  { prefix: "VG", country: "Bangladesh", continent: "Asia", flag: "🇧🇩" },
  { prefix: "RJ", country: "Japan", continent: "Asia", flag: "🇯🇵" },
  { prefix: "RO", country: "Japan", continent: "Asia", flag: "🇯🇵" },
  { prefix: "RK", country: "South Korea", continent: "Asia", flag: "🇰🇷" },
  { prefix: "RP", country: "Philippines", continent: "Asia", flag: "🇵🇭" },
  { prefix: "VT", country: "Thailand", continent: "Asia", flag: "🇹🇭" },
  { prefix: "VV", country: "Vietnam", continent: "Asia", flag: "🇻🇳" },
  { prefix: "WM", country: "Malaysia", continent: "Asia", flag: "🇲🇾" },
  { prefix: "WB", country: "Malaysia", continent: "Asia", flag: "🇲🇾" },
  { prefix: "WS", country: "Singapore", continent: "Asia", flag: "🇸🇬" },
  { prefix: "WI", country: "Indonesia", continent: "Asia", flag: "🇮🇩" },
  { prefix: "WA", country: "Indonesia", continent: "Asia", flag: "🇮🇩" },
  { prefix: "ZB", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZS", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZG", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZL", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZP", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZU", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZH", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZW", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "ZY", country: "China", continent: "Asia", flag: "🇨🇳" },
  { prefix: "VH", country: "Hong Kong", continent: "Asia", flag: "🇭🇰" },
  { prefix: "RC", country: "Taiwan", continent: "Asia", flag: "🇹🇼" },
  { prefix: "K", country: "United States", continent: "North America", flag: "🇺🇸" },
  { prefix: "C", country: "Canada", continent: "North America", flag: "🇨🇦" },
  { prefix: "MM", country: "Mexico", continent: "North America", flag: "🇲🇽" },
  { prefix: "SB", country: "Brazil", continent: "South America", flag: "🇧🇷" },
  { prefix: "SD", country: "Brazil", continent: "South America", flag: "🇧🇷" },
  { prefix: "SS", country: "Brazil", continent: "South America", flag: "🇧🇷" },
  { prefix: "SA", country: "Argentina", continent: "South America", flag: "🇦🇷" },
  { prefix: "SC", country: "Chile", continent: "South America", flag: "🇨🇱" },
  { prefix: "SK", country: "Colombia", continent: "South America", flag: "🇨🇴" },
  { prefix: "SP", country: "Peru", continent: "South America", flag: "🇵🇪" },
  { prefix: "FA", country: "South Africa", continent: "Africa", flag: "🇿🇦" },
  { prefix: "DN", country: "Nigeria", continent: "Africa", flag: "🇳🇬" },
  { prefix: "HA", country: "Ethiopia", continent: "Africa", flag: "🇪🇹" },
  { prefix: "HE", country: "Egypt", continent: "Africa", flag: "🇪🇬" },
  { prefix: "HK", country: "Kenya", continent: "Africa", flag: "🇰🇪" },
  { prefix: "GM", country: "Morocco", continent: "Africa", flag: "🇲🇦" },
  { prefix: "DG", country: "Ghana", continent: "Africa", flag: "🇬🇭" },
  { prefix: "DA", country: "Algeria", continent: "Africa", flag: "🇩🇿" },
  { prefix: "DT", country: "Tunisia", continent: "Africa", flag: "🇹🇳" },
  { prefix: "Y", country: "Australia", continent: "Oceania", flag: "🇦🇺" },
  { prefix: "NZ", country: "New Zealand", continent: "Oceania", flag: "🇳🇿" },
  { prefix: "AY", country: "Papua New Guinea", continent: "Oceania", flag: "🇵🇬" },
  { prefix: "NF", country: "Fiji", continent: "Oceania", flag: "🇫🇯" }
];

export function resolveAirport(icao) {
  if (!icao || typeof icao !== 'string') {
    return {
      icao: 'Local',
      name: 'Local Airspace',
      city: 'Local',
      country: 'Local',
      continent: 'Local',
      flag: '✈',
      lat: null,
      lon: null
    };
  }

  const clean = icao.toUpperCase().trim();

  // 1. Direct dictionary match
  if (AIRPORT_DATABASE[clean]) {
    return AIRPORT_DATABASE[clean];
  }

  // 2. Prefix matching for country, flag, continent
  for (const rule of ICAO_PREFIX_RULES) {
    if (clean.startsWith(rule.prefix)) {
      return {
        icao: clean,
        iata: '',
        name: `${clean} Airport`,
        city: clean,
        country: rule.country,
        continent: rule.continent,
        flag: rule.flag,
        lat: null,
        lon: null
      };
    }
  }

  // 3. Fallback
  return {
    icao: clean,
    iata: '',
    name: `${clean} Airport`,
    city: clean,
    country: 'International',
    continent: 'Global',
    flag: '🌍',
    lat: null,
    lon: null
  };
}

// Great Circle Distance calculation in Nautical Miles
export function calculateDistanceNm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 3440.065; // Earth radius in nautical miles
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Find closest known airport to coordinates
export function findNearestAirport(lat, lon, maxDistanceNm = 500) {
  if (lat == null || lon == null) return null;
  let closest = null;
  let minD = Infinity;

  for (const icao in AIRPORT_DATABASE) {
    const ap = AIRPORT_DATABASE[icao];
    if (ap.lat != null && ap.lon != null) {
      const dist = calculateDistanceNm(lat, lon, ap.lat, ap.lon);
      if (dist != null && dist < minD) {
        minD = dist;
        closest = { ...ap, distanceNm: dist };
      }
    }
  }

  return closest;
}

// Differentiate if a plane is parked, taxiing, or flying
export function getAircraftFlightStatus(speed, altitude, verticalSpeed) {
  const spd = speed || 0;
  const alt = altitude || 0;
  const vs = verticalSpeed || 0;

  // Parked: on ground and almost no speed (< 5 kts)
  if (spd < 5 && alt < 8000) {
    return {
      status: 'parked',
      isParked: true,
      label: 'Parked',
      icon: 'fa-square-parking',
      badgeClass: 'status-parked',
      description: 'Parked at Gate / Stand'
    };
  }

  // Taxiing: moving slowly on ground (5 to 35 kts)
  if (spd < 35 && alt < 3000) {
    return {
      status: 'taxi',
      isParked: false,
      label: 'Taxiing',
      icon: 'fa-taxi',
      badgeClass: 'status-taxi',
      description: 'Taxiing on ground'
    };
  }

  // Airborne - Climb: positive vertical rate
  if (vs > 150 && alt < 18000) {
    return {
      status: 'climb',
      isParked: false,
      label: 'Climbing',
      icon: 'fa-plane-departure',
      badgeClass: 'status-climb',
      description: `Climbing to FL${Math.round(alt / 100)}`
    };
  }

  // Airborne - Approach: low altitude and descending
  if (vs < -150 && alt <= 4000) {
    return {
      status: 'approach',
      isParked: false,
      label: 'Approach',
      icon: 'fa-plane-arrival',
      badgeClass: 'status-approach',
      description: 'Approach / Final'
    };
  }

  // Airborne - Descent: high altitude descending
  if (vs < -150) {
    return {
      status: 'descent',
      isParked: false,
      label: 'Descent',
      icon: 'fa-arrow-down-long',
      badgeClass: 'status-descent',
      description: 'Descending'
    };
  }

  // Airborne - Cruise: level flight
  return {
    status: 'cruise',
    isParked: false,
    label: 'Cruise',
    icon: 'fa-plane',
    badgeClass: 'status-cruise',
    description: alt >= 18000 ? `Cruise at FL${Math.round(alt / 100)}` : `Cruise at ${alt.toLocaleString()} ft`
  };
}
