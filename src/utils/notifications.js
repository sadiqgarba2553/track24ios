/**
 * Track 24 — Web Push Notification & Radar Alert Engine
 * Features: Service worker push notifications, Web Audio radar synthesizer,
 * haptic vibration, tracked flight triggers, and squawk 7700 emergency alerts.
 */

// ── Web Audio Radar Synthesizer (No external mp3 needed) ───────
class RadarSoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playRadarChime() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Primary oscillator: 880Hz -> 1320Hz ping
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);

      // Harmonizer ping
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1760, now + 0.08);

      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch {
      // Audio playback fails gracefully if muted
    }
  }

  playEmergencyAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.14;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, t);
        osc.frequency.setValueAtTime(750, t + 0.07);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.12);
      }
    } catch {}
  }
}

export const radarSound = new RadarSoundEngine();

// ── In-App Listeners Store ────────────────────────────────────
const inAppSubscribers = new Set();

export function subscribeToInAppNotifications(cb) {
  inAppSubscribers.add(cb);
  return () => inAppSubscribers.delete(cb);
}

function broadcastInAppNotification(alert) {
  inAppSubscribers.forEach((cb) => {
    try { cb(alert); } catch {}
  });
}

// ── Local Storage History Helper ──────────────────────────────
const STORAGE_KEY_ALERTS = 'track24_recent_alerts';
const STORAGE_KEY_WATCHED_FLIGHTS = 'track24_watched_flights';

export function getRecentAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlert(alert) {
  try {
    const list = getRecentAlerts();
    const updated = [alert, ...list].slice(0, 30);
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
  } catch {}
}

export function getWatchedFlightIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WATCHED_FLIGHTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFlightWatched(flightId) {
  return getWatchedFlightIds().includes(flightId);
}

export function toggleWatchFlight(flightId) {
  const list = getWatchedFlightIds();
  const exists = list.includes(flightId);
  const updated = exists ? list.filter(id => id !== flightId) : [...list, flightId];
  try {
    localStorage.setItem(STORAGE_KEY_WATCHED_FLIGHTS, JSON.stringify(updated));
  } catch {}
  return !exists;
}

// ── Browser Permission & Push Dispatcher ──────────────────────
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch {
    return false;
  }
}

// Register service worker
let swRegistration = null;

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch {
    return null;
  }
}

/**
 * Dispatch notification via Service Worker, Web Audio chime, haptics, and In-App Toast
 */
export async function sendNotification({
  title,
  body,
  flightId = null,
  airportIcao = null,
  type = 'info', // 'info' | 'descent' | 'approach' | 'touchdown' | 'emergency' | 'test'
  tag = null
}) {
  const alert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    body,
    flightId,
    airportIcao,
    type,
    timestamp: Date.now()
  };

  // 1. Play sound
  if (type === 'emergency') {
    radarSound.playEmergencyAlert();
  } else {
    radarSound.playRadarChime();
  }

  // 2. Trigger haptic vibration on mobile
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'emergency') {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } else {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {}
  }

  // 3. Save to local alerts history
  saveAlert(alert);

  // 4. Send to In-App active toasts
  broadcastInAppNotification(alert);

  // 5. Send to System Notification / Push if permission granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if (!swRegistration && 'serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.ready;
      }

      if (swRegistration && 'showNotification' in swRegistration) {
        await swRegistration.showNotification(title, {
          body,
          icon: '/logo.svg',
          badge: '/favicon.svg',
          tag: tag || `track24-${alert.id}`,
          renotify: true,
          vibrate: [100, 50, 100],
          data: {
            url: flightId ? `/?flight=${flightId}` : '/',
            flightId
          }
        });
      } else {
        new Notification(title, {
          body,
          icon: '/logo.svg',
          tag: tag || `track24-${alert.id}`
        });
      }
    } catch {
      // Browser notification dispatch failure handled gracefully
    }
  }

  return alert;
}

// ── Test Push Notification Trigger ────────────────────────────
export async function sendTestNotification() {
  const hasPerm = Notification.permission === 'granted';
  if (!hasPerm) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      // Still show in-app notification even if OS permission denied
      return sendNotification({
        title: '✈ Track 24 In-App Alert',
        body: 'Audio chime and radar alerts active! (Browser push permission is currently disabled).',
        type: 'test'
      });
    }
  }

  return sendNotification({
    title: '✈ Track 24 Radar Push Alert',
    body: 'Notification system verified! Real-time flight tracking & emergency alerts are ready.',
    type: 'test'
  });
}

// ── Background Telemetry State Tracker ────────────────────────
const previousFlightStates = new Map();

/**
 * Scan updated live flights array to trigger automated alerts
 */
export function processFlightTelemetryAlerts(flights, isFavorite) {
  if (!flights || flights.length === 0) return;

  const watchedIds = new Set(getWatchedFlightIds());

  flights.forEach((f) => {
    const id = f.flightId;
    const isWatched = watchedIds.has(id);
    const isFav = isFavorite ? (isFavorite(f.callsign) || isFavorite(id)) : false;
    const prev = previousFlightStates.get(id);

    // Track emergency squawks (Squawk 7700 or emergency flags)
    const isEmergency = f.squawk === 7700 || f.squawk === '7700' || f.isEmergency;
    if (isEmergency && (!prev || !prev.isEmergency)) {
      sendNotification({
        title: `🚨 SQUAWK 7700 EMERGENCY`,
        body: `Flight ${f.callsign || 'AIRCRAFT'} declared general emergency at ${Math.round(f.altitude || 0).toLocaleString()} ft!`,
        flightId: id,
        type: 'emergency',
        tag: `squawk-${id}`
      });
    }

    // Only proceed with flight phase alerts if the user is watching or favorited this flight
    if (isWatched || isFav) {
      const prevAlt = prev ? prev.altitude : null;
      const curAlt = f.altitude || 0;
      const prevParked = prev ? prev.isParked : false;
      const curParked = f.isParked;

      // 1. Transition into Descent / Approach below 10,000 ft
      if (prevAlt !== null && prevAlt >= 10000 && curAlt < 10000 && !curParked) {
        sendNotification({
          title: `🛬 ${f.callsign} Approaching Terminal Airspace`,
          body: `Flight ${f.callsign} descended through 10,000 ft at ${Math.round(f.speed || 0)} kts.`,
          flightId: id,
          type: 'descent',
          tag: `descent-${id}`
        });
      }

      // 2. Final Touchdown / Parked alert
      if (prevAlt !== null && !prevParked && curParked) {
        sendNotification({
          title: `🛬 ${f.callsign} Safely Touchdown`,
          body: `Flight ${f.callsign} has safely landed and parked.`,
          flightId: id,
          type: 'touchdown',
          tag: `touchdown-${id}`
        });
      }
    }

    // Cache current state
    previousFlightStates.set(id, {
      altitude: f.altitude || 0,
      isParked: f.isParked,
      isEmergency
    });
  });

  // Limit memory map size to avoid memory leak
  if (previousFlightStates.size > 2500) {
    previousFlightStates.clear();
  }
}
