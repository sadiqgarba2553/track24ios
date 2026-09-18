// ── Mock Data Layer for Track 24 ─────────────────────────────
// Intercepts fetch() calls to /api/* and returns realistic IF data
// so the app works without hitting the live API.

const MOCK_SESSIONS = [
  { id: "7e5daa01-expert", name: "Expert Server", maxUsers: 2000, userCount: 1345 },
  { id: "7e5daa02-training", name: "Training Server", maxUsers: 1000, userCount: 650 },
  { id: "7e5daa03-casual", name: "Casual Server", maxUsers: 1000, userCount: 420 }
];

const MOCK_AIRCRAFT = [
  { id: "a320", name: "Airbus A320" },
  { id: "b738", name: "Boeing 737-800" },
  { id: "b77w", name: "Boeing 777-300ER" },
  { id: "a388", name: "Airbus A380-800" },
  { id: "b748", name: "Boeing 747-8" },
  { id: "a20n", name: "Airbus A320neo" },
  { id: "crj7", name: "Bombardier CRJ-700" },
  { id: "e190", name: "Embraer E190" }
];

const MOCK_LIVERIES = [
  { id: "liv-ba-a320", aircraftId: "a320", aircraftName: "Airbus A320", liveryName: "British Airways" },
  { id: "liv-dl-b738", aircraftId: "b738", aircraftName: "Boeing 737-800", liveryName: "Delta Air Lines" },
  { id: "liv-sw-b738", aircraftId: "b738", aircraftName: "Boeing 737-800", liveryName: "Southwest Airlines" },
  { id: "liv-ek-a388", aircraftId: "a388", aircraftName: "Airbus A380-800", liveryName: "Emirates" },
  { id: "liv-ua-b77w", aircraftId: "b77w", aircraftName: "Boeing 777-300ER", liveryName: "United Airlines" },
  { id: "liv-lh-a20n", aircraftId: "a20n", aircraftName: "Airbus A320neo", liveryName: "Lufthansa" },
  { id: "liv-aa-b738", aircraftId: "b738", aircraftName: "Boeing 737-800", liveryName: "American Airlines" },
  { id: "liv-sk-crj7", aircraftId: "crj7", aircraftName: "Bombardier CRJ-700", liveryName: "SkyWest (United Express)" },
  { id: "liv-qf-a388", aircraftId: "a388", aircraftName: "Airbus A380-800", liveryName: "Qantas" },
  { id: "liv-th-b748", aircraftId: "b748", aircraftName: "Boeing 747-8", liveryName: "Thai Airways" }
];

// Generate a pool of realistic flights with proper lat/long, alt, speed
function generateFlights() {
  const flights = [
    { flightId: "f-001", userId: "u-001", username: "CaptainSmith",   callsign: "BAW15X",  latitude: 51.47, longitude: -0.45,   altitude: 12500,  speed: 310,  verticalSpeed: 1500,  heading: 270, aircraftId: "a320", liveryId: "liv-ba-a320" },
    { flightId: "f-002", userId: "u-002", username: "DeltaVirtual",   callsign: "DAL192",  latitude: 33.64, longitude: -84.43,  altitude: 35000,  speed: 450,  verticalSpeed: 0,     heading: 90,  aircraftId: "b738", liveryId: "liv-dl-b738" },
    { flightId: "f-003", userId: "u-003", username: "IF-Aviation",    callsign: "SWA2917", latitude: 32.90, longitude: -97.04,  altitude: 0,      speed: 15,   verticalSpeed: 0,     heading: 180, aircraftId: "b738", liveryId: "liv-sw-b738" },
    { flightId: "f-004", userId: "u-004", username: "SkyCaptain77",   callsign: "UAE38",   latitude: 25.25, longitude: 55.36,   altitude: 38000,  speed: 480,  verticalSpeed: 0,     heading: 315, aircraftId: "a388", liveryId: "liv-ek-a388" },
    { flightId: "f-005", userId: "u-005", username: "AviatorMike",    callsign: "UAL852",  latitude: 37.62, longitude: -122.38, altitude: 28000,  speed: 420,  verticalSpeed: -1200, heading: 45,  aircraftId: "b77w", liveryId: "liv-ua-b77w" },
    { flightId: "f-006", userId: "u-006", username: "FlyDLH",         callsign: "DLH490",  latitude: 50.03, longitude: 8.57,    altitude: 5200,   speed: 220,  verticalSpeed: 2000,  heading: 250, aircraftId: "a20n", liveryId: "liv-lh-a20n" },
    { flightId: "f-007", userId: "u-007", username: "AAVirtualPilot", callsign: "AAL1104", latitude: 40.64, longitude: -73.78,  altitude: 0,      speed: 22,   verticalSpeed: 0,     heading: 310, aircraftId: "b738", liveryId: "liv-aa-b738" },
    { flightId: "f-008", userId: "u-008", username: "RegionalFlyer",  callsign: "SKW5421", latitude: 47.45, longitude: -122.31, altitude: 18000,  speed: 350,  verticalSpeed: -800,  heading: 170, aircraftId: "crj7", liveryId: "liv-sk-crj7" },
    { flightId: "f-009", userId: "u-009", username: "QantasVA",       callsign: "QFA12",   latitude: -33.95, longitude: 151.18, altitude: 41000,  speed: 490,  verticalSpeed: 0,     heading: 340, aircraftId: "a388", liveryId: "liv-qf-a388" },
    { flightId: "f-010", userId: "u-010", username: "ThaiFlyer",      callsign: "THA471",  latitude: 13.69, longitude: 100.75,  altitude: 2500,   speed: 170,  verticalSpeed: -1500, heading: 195, aircraftId: "b748", liveryId: "liv-th-b748" },
    { flightId: "f-011", userId: "u-011", username: "JetBlueVA",      callsign: "JBU524",  latitude: 42.37, longitude: -71.02,  altitude: 31000,  speed: 440,  verticalSpeed: 0,     heading: 220, aircraftId: "a320", liveryId: "liv-ba-a320" },
    { flightId: "f-012", userId: "u-012", username: "AirForceVA",     callsign: "RCH401",  latitude: 38.95, longitude: -77.46,  altitude: 22000,  speed: 380,  verticalSpeed: 1800,  heading: 60,  aircraftId: "b748", liveryId: "liv-th-b748" }
  ];

  // Add subtle position drift to simulate movement on each call
  return flights.map(f => ({
    ...f,
    latitude: f.latitude + (Math.random() - 0.5) * 0.02,
    longitude: f.longitude + (Math.random() - 0.5) * 0.02,
    lastReportUpdate: new Date().toISOString()
  }));
}

const MOCK_ATC = [
  { frequencyId: "atc-001", userId: "atc-u1", username: "IFATC-John",  type: 1, latitude: 51.4700, longitude: -0.4543, airportName: "EGLL", frequencyName: "London Heathrow Tower" },
  { frequencyId: "atc-002", userId: "atc-u2", username: "IFATC-Sarah", type: 4, latitude: 51.4700, longitude: -0.4543, airportName: "EGLL", frequencyName: "London Heathrow Approach" },
  { frequencyId: "atc-003", userId: "atc-u3", username: "IFATC-Mike",  type: 0, latitude: 33.9416, longitude: -118.41, airportName: "KLAX", frequencyName: "Los Angeles Ground" },
  { frequencyId: "atc-004", userId: "atc-u4", username: "IFATC-Alex",  type: 1, latitude: 33.9416, longitude: -118.41, airportName: "KLAX", frequencyName: "Los Angeles Tower" },
  { frequencyId: "atc-005", userId: "atc-u5", username: "IFATC-Tom",   type: 7, latitude: 40.6413, longitude: -73.78,  airportName: "KJFK", frequencyName: "New York JFK ATIS" }
];

const MOCK_FLIGHT_PLAN = {
  flightPlanId: "fp-001",
  flightId: "f-001",
  waypoints: [
    { name: "EGLL", latitude: 51.4700, longitude: -0.4543 },
    { name: "CPT",  latitude: 51.5123, longitude: -1.1812 },
    { name: "EXMOR", latitude: 51.2000, longitude: -3.5200 },
    { name: "KJFK", latitude: 40.6413, longitude: -73.7781 }
  ]
};

// ── Intercept fetch ──────────────────────────────────────────
const _originalFetch = window.fetch;

window.fetch = async function(url, options) {
  const urlStr = typeof url === 'string' ? url : url.toString();

  // /api/sessions
  if (urlStr.includes('/api/sessions') && !urlStr.includes('/flights') && !urlStr.includes('/atc')) {
    return mockResponse({ errorCode: 0, result: MOCK_SESSIONS });
  }

  // /api/sessions/{id}/flights
  if (urlStr.includes('/flights')) {
    return mockResponse({ errorCode: 0, result: generateFlights() });
  }

  // /api/sessions/{id}/atc
  if (urlStr.includes('/atc')) {
    return mockResponse({ errorCode: 0, result: MOCK_ATC });
  }

  // /api/aircraft
  if (urlStr.includes('/api/aircraft/liveries')) {
    return mockResponse({ errorCode: 0, result: MOCK_LIVERIES });
  }
  if (urlStr.includes('/api/aircraft')) {
    return mockResponse({ errorCode: 0, result: MOCK_AIRCRAFT });
  }

  // /api/flight/{id}/flightplan
  if (urlStr.includes('/flightplan')) {
    return mockResponse({ errorCode: 0, result: MOCK_FLIGHT_PLAN });
  }

  // /api/users — pilot stats
  if (urlStr.includes('/api/users')) {
    return mockResponse({ errorCode: 0, result: [{
      userId: "u-001",
      onlineFlights: 847,
      violations: 3,
      xp: 1250000,
      landingCount: 612,
      flightTime: 2850.5,
      atcOperations: 0,
      atcRank: null,
      grade: 4,
      hash: "abc123"
    }]});
  }

  // Pass through everything else (weather, wiki, etc.)
  return _originalFetch.apply(this, arguments);
};

function mockResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
