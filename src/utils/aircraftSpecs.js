// ── Typical Aircraft Reference & Performance V-Speeds ──

export const AIRCRAFT_SPECS = {
  // Boeing 737 Family
  "b737": {
    v1: "143 kts", vr: "148 kts", v2: "153 kts", vref: "138 kts",
    ceiling: "FL410", cruise: "M 0.79", mmo: "M 0.82", range: "3,550 nm"
  },
  // Boeing 777 Family
  "b777": {
    v1: "156 kts", vr: "162 kts", v2: "168 kts", vref: "144 kts",
    ceiling: "FL431", cruise: "M 0.84", mmo: "M 0.89", range: "7,370 nm"
  },
  // Boeing 787 Family
  "b787": {
    v1: "150 kts", vr: "156 kts", v2: "162 kts", vref: "141 kts",
    ceiling: "FL430", cruise: "M 0.85", mmo: "M 0.90", range: "7,530 nm"
  },
  // Airbus A320 Family
  "a320": {
    v1: "141 kts", vr: "145 kts", v2: "150 kts", vref: "134 kts",
    ceiling: "FL398", cruise: "M 0.78", mmo: "M 0.82", range: "3,300 nm"
  },
  // Airbus A330 Family
  "a330": {
    v1: "149 kts", vr: "154 kts", v2: "159 kts", vref: "139 kts",
    ceiling: "FL414", cruise: "M 0.82", mmo: "M 0.86", range: "7,200 nm"
  },
  // Airbus A350 Family
  "a350": {
    v1: "153 kts", vr: "159 kts", v2: "165 kts", vref: "142 kts",
    ceiling: "FL431", cruise: "M 0.85", mmo: "M 0.89", range: "8,100 nm"
  },
  // Airbus A380
  "a380": {
    v1: "160 kts", vr: "167 kts", v2: "173 kts", vref: "147 kts",
    ceiling: "FL430", cruise: "M 0.85", mmo: "M 0.89", range: "8,000 nm"
  },
  // Airbus A220
  "a220": {
    v1: "135 kts", vr: "140 kts", v2: "146 kts", vref: "130 kts",
    ceiling: "FL410", cruise: "M 0.78", mmo: "M 0.82", range: "3,400 nm"
  },
  // Regional & Turboprop
  "q400": {
    v1: "115 kts", vr: "118 kts", v2: "123 kts", vref: "116 kts",
    ceiling: "FL250", cruise: "360 kts", mmo: "M 0.58", range: "1,100 nm"
  },
  "crj": {
    v1: "138 kts", vr: "142 kts", v2: "148 kts", vref: "135 kts",
    ceiling: "FL410", cruise: "M 0.80", mmo: "M 0.85", range: "1,800 nm"
  },
  // Business Jet
  "cl35": {
    v1: "128 kts", vr: "132 kts", v2: "138 kts", vref: "122 kts",
    ceiling: "FL450", cruise: "M 0.80", mmo: "M 0.83", range: "3,200 nm"
  },
  // Default Jet
  "default": {
    v1: "145 kts", vr: "150 kts", v2: "155 kts", vref: "138 kts",
    ceiling: "FL410", cruise: "M 0.80", mmo: "M 0.84", range: "4,000 nm"
  }
};

export function getAircraftSpecs(aircraftName = '') {
  const name = aircraftName.toLowerCase();
  if (name.includes('737') || name.includes('738') || name.includes('max')) return AIRCRAFT_SPECS.b737;
  if (name.includes('777') || name.includes('77w')) return AIRCRAFT_SPECS.b777;
  if (name.includes('787') || name.includes('dreamliner')) return AIRCRAFT_SPECS.b787;
  if (name.includes('350') || name.includes('a359') || name.includes('a35k')) return AIRCRAFT_SPECS.a350;
  if (name.includes('380') || name.includes('a388')) return AIRCRAFT_SPECS.a380;
  if (name.includes('330') || name.includes('a339') || name.includes('a333')) return AIRCRAFT_SPECS.a330;
  if (name.includes('320') || name.includes('321') || name.includes('319') || name.includes('318')) return AIRCRAFT_SPECS.a320;
  if (name.includes('220')) return AIRCRAFT_SPECS.a220;
  if (name.includes('dash') || name.includes('q400')) return AIRCRAFT_SPECS.q400;
  if (name.includes('crj') || name.includes('erj') || name.includes('e190')) return AIRCRAFT_SPECS.crj;
  if (name.includes('challenger') || name.includes('citation') || name.includes('tbm')) return AIRCRAFT_SPECS.cl35;
  return AIRCRAFT_SPECS.default;
}
