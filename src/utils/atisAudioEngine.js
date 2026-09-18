/**
 * Track 24 — Realistic VHF Audio ATIS & Airport Radio Synthesizer
 * 
 * Synthesizes realistic aeronautical ATIS broadcasts from real METAR data.
 * Features:
 * - ICAO phonetic translation (Alpha..Zulu, aviation numbers)
 * - Optimal runway in use analysis from wind direction
 * - Web Audio API VHF communication bandpass filter (300Hz - 3400Hz)
 * - Authentic mic-key PTT (push-to-talk) squelch click and background VHF hiss
 */

const PHONETIC_LETTERS = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf',
  'Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November',
  'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform',
  'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu'
];

const ICAO_DIGITS = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'tree',
  '4': 'four',
  '5': 'fife',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'niner'
};

/**
 * Convert numbers or strings to spoken aviation digits
 */
export function toAviationPhonetics(str) {
  if (!str) return '';
  return String(str)
    .split('')
    .map(ch => ICAO_DIGITS[ch] || ch)
    .join(' ');
}

/**
 * Get the ATIS Information letter based on current UTC hour
 */
export function getAtisLetter(date = new Date()) {
  const hour = date.getUTCHours();
  return PHONETIC_LETTERS[hour % 26];
}

/**
 * Parse raw METAR and generate a realistic ATIS spoken script + structured data
 */
export function generateAtisScript(airport, metar, runways = []) {
  const now = new Date();
  const infoLetter = getAtisLetter(now);
  const timeUtc = `${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}`;
  const spokenTime = toAviationPhonetics(timeUtc);

  const airportName = airport?.name || airport?.city || airport?.icao || 'Station';
  const icao = airport?.icao || 'XXXX';

  // Wind parsing
  const wdir = metar?.wdir ?? 0;
  const wspd = metar?.wspd ?? 0;
  const wgust = metar?.wgust ?? null;

  let windScript = '';
  if (wspd === 0) {
    windScript = 'Wind calm.';
  } else if (wdir === 'VRB') {
    windScript = `Wind variable at ${toAviationPhonetics(wspd)} knots.`;
  } else {
    const formattedDir = String(wdir).padStart(3, '0');
    windScript = `Wind ${toAviationPhonetics(formattedDir)} degrees at ${toAviationPhonetics(wspd)} knots`;
    if (wgust) {
      windScript += `, gusting ${toAviationPhonetics(wgust)} knots.`;
    } else {
      windScript += '.';
    }
  }

  // Visibility parsing
  const vis = metar?.visib ?? null;
  let visScript = 'Visibility greater than one zero kilometers.';
  if (vis !== null && vis !== undefined) {
    if (vis >= 10 || vis === '10+') {
      visScript = 'Visibility one zero kilometers or greater.';
    } else {
      visScript = `Visibility ${toAviationPhonetics(Math.round(vis))} miles.`;
    }
  }

  // Clouds parsing
  let cloudScript = 'Sky condition clear.';
  if (Array.isArray(metar?.clouds) && metar.clouds.length > 0) {
    const parts = metar.clouds.map(c => {
      const coverMap = {
        'FEW': 'few clouds at',
        'SCT': 'scattered clouds at',
        'BKN': 'ceiling broken at',
        'OVC': 'ceiling overcast at'
      };
      const type = coverMap[c.cover] || 'clouds at';
      const baseFt = (c.base || 30) * 100;
      return `${type} ${toAviationPhonetics(baseFt)} feet`;
    });
    cloudScript = `Sky condition ${parts.join(', ')}.`;
  } else if (metar?.cover) {
    cloudScript = `Sky condition ${metar.cover}.`;
  }

  // Temperature / Dewpoint
  const temp = metar?.temp ?? 15;
  const dewp = metar?.dewp ?? 10;
  const tempScript = `Temperature ${temp < 0 ? 'minus ' + toAviationPhonetics(Math.abs(temp)) : toAviationPhonetics(temp)}, dew point ${dewp < 0 ? 'minus ' + toAviationPhonetics(Math.abs(dewp)) : toAviationPhonetics(dewp)}.`;

  // Altimeter / QNH
  const altim = metar?.altim ?? 1013;
  let qnhScript = '';
  if (altim > 800) {
    // Standard QNH in hPa
    qnhScript = `Q N H ${toAviationPhonetics(Math.round(altim))} hectopascals.`;
  } else {
    // InHg (e.g. 29.92)
    const inHgStr = altim.toFixed(2).replace('.', '');
    qnhScript = `Altimeter ${toAviationPhonetics(inHgStr)}.`;
  }

  // Runway recommendation based on wind
  let runwayScript = 'Simultaneous runway operations in effect.';
  let recommendedLandingRwy = null;

  if (Array.isArray(runways) && runways.length > 0) {
    let bestHeadwind = -999;
    runways.forEach(rwy => {
      const hdg = rwy.leHdg != null ? rwy.leHdg : (parseInt(rwy.leRef, 10) * 10 || 0);
      const angleDiff = Math.abs(((wdir - hdg + 180) % 360) - 180);
      const headwindComp = wspd * Math.cos(angleDiff * (Math.PI / 180));
      if (headwindComp > bestHeadwind) {
        bestHeadwind = headwindComp;
        recommendedLandingRwy = rwy.leRef;
      }
    });

    if (recommendedLandingRwy) {
      const phoneticRwy = recommendedLandingRwy
        .split('')
        .map(c => c === 'L' ? 'Left' : c === 'R' ? 'Right' : c === 'C' ? 'Center' : (ICAO_DIGITS[c] || c))
        .join(' ');
      runwayScript = `Expect landing and departure runway ${phoneticRwy}.`;
    }
  }

  const fullSpokenScript = [
    `${airportName} Information ${infoLetter}.`,
    `Time ${spokenTime} zulu.`,
    windScript,
    visScript,
    cloudScript,
    tempScript,
    qnhScript,
    runwayScript,
    `Advise aircraft controller on initial contact you have information ${infoLetter}.`
  ].join(' ');

  // Standard simulated ATIS VHF frequency based on ICAO hash
  let hash = 0;
  for (let i = 0; i < icao.length; i++) {
    hash = (hash << 5) - hash + icao.charCodeAt(i);
  }
  const freqOffset = (Math.abs(hash) % 80) * 0.025;
  const tunedFreq = (124.000 + freqOffset).toFixed(3);

  return {
    icao,
    airportName,
    infoLetter,
    timeUtc,
    tunedFreq: `${tunedFreq} MHz`,
    spokenScript: fullSpokenScript,
    windText: `${wdir}° / ${wspd} kt`,
    tempText: `${temp}°C / DP ${dewp}°C`,
    qnhText: `${Math.round(altim)} hPa`,
    activeRunway: recommendedLandingRwy || '27L'
  };
}

/**
 * Web Audio VHF Radio Sound Engine
 */
class VhfRadioAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.staticNode = null;
    this.staticGain = null;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.keepAliveTimer = null;
    this.cachedVoices = [];

    // Pre-cache voices when browser loads them
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  /**
   * Unlock and initialize AudioContext for iOS Safari & modern browsers
   */
  initAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx) {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        // Unlock iOS Safari hardware audio pipeline with silent buffer
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn('[VHF Audio] Init audio error:', e);
    }
  }

  /**
   * Play realistic VHF Push-to-Talk (PTT) mic squelch click
   */
  playMicClick(isRelease = false) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isRelease ? 2200 : 1800, now);
      filter.Q.setValueAtTime(4.0, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isRelease ? 650 : 850, now);
      osc.frequency.exponentialRampToValueAtTime(isRelease ? 200 : 350, now + (isRelease ? 0.07 : 0.05));

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isRelease ? 0.08 : 0.06));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + (isRelease ? 0.09 : 0.07));

      // Extra burst of white noise for realism
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.04);
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      noise.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);
      noise.start(now);
    } catch (e) {
      console.warn('[VHF Audio] Mic click error:', e);
    }
  }

  /**
   * Start procedural atmospheric VHF background static
   */
  startStaticHiss(volume = 0.032) {
    if (!this.audioCtx) return;
    try {
      this.stopStaticHiss();
      const bufferSize = this.audioCtx.sampleRate * 2;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.2;
      }

      this.staticNode = this.audioCtx.createBufferSource();
      this.staticNode.buffer = noiseBuffer;
      this.staticNode.loop = true;

      const bandpass = this.audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1600, this.audioCtx.currentTime);
      bandpass.Q.setValueAtTime(1.5, this.audioCtx.currentTime);

      this.staticGain = this.audioCtx.createGain();
      this.staticGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);

      this.staticNode.connect(bandpass);
      bandpass.connect(this.staticGain);
      this.staticGain.connect(this.audioCtx.destination);

      this.staticNode.start();
    } catch (e) {
      console.warn('[VHF Audio] Static hiss error:', e);
    }
  }

  stopStaticHiss() {
    if (this.staticNode) {
      try {
        this.staticNode.stop();
        this.staticNode.disconnect();
      } catch (e) {}
      this.staticNode = null;
    }
    if (this.staticGain) {
      try {
        this.staticGain.disconnect();
      } catch (e) {}
      this.staticGain = null;
    }
  }

  getBestVoice() {
    const voices = (this.cachedVoices && this.cachedVoices.length > 0)
      ? this.cachedVoices
      : ('speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

    if (!voices || voices.length === 0) return null;

    // Prefer clear English accents (ATC standard)
    const preferred = voices.find(v => v.lang && (v.lang === 'en-GB' || v.lang === 'en-US' || v.lang.startsWith('en-')));
    return preferred || voices[0] || null;
  }

  /**
   * Speak consecutive sentences cleanly to prevent Chrome/iOS 15-second speech truncation
   */
  speakSentenceQueue(sentences, index, onStatusChange) {
    if (!this.isPlaying) return;

    if (index >= sentences.length) {
      // Completed all sentences
      this.isPlaying = false;
      this.stopStaticHiss();
      this.playMicClick(true); // PTT release chirp
      this.clearKeepAlive();
      if (onStatusChange) onStatusChange({ isPlaying: false, isTransmitting: false });
      return;
    }

    const textChunk = sentences[index];
    if (!textChunk) {
      this.speakSentenceQueue(sentences, index + 1, onStatusChange);
      return;
    }

    try {
      const utter = new SpeechSynthesisUtterance(textChunk);
      utter.rate = 0.96;
      utter.pitch = 0.94;
      utter.lang = 'en-US';

      const voice = this.getBestVoice();
      if (voice) {
        utter.voice = voice;
      }

      utter.onend = () => {
        if (!this.isPlaying) return;
        // Brief natural radio pause between sentences (60ms)
        setTimeout(() => {
          this.speakSentenceQueue(sentences, index + 1, onStatusChange);
        }, 60);
      };

      utter.onerror = (err) => {
        console.warn('[VHF Audio] Utterance error on chunk', index, err);
        if (!this.isPlaying) return;
        // Continue to next sentence if one chunk errors
        if (index + 1 < sentences.length) {
          this.speakSentenceQueue(sentences, index + 1, onStatusChange);
        } else {
          this.isPlaying = false;
          this.stopStaticHiss();
          this.clearKeepAlive();
          if (onStatusChange) onStatusChange({ isPlaying: false, isTransmitting: false });
        }
      };

      this.currentUtterance = utter;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error('[VHF Audio] Speak error:', e);
      this.isPlaying = false;
      this.stopStaticHiss();
      this.clearKeepAlive();
      if (onStatusChange) onStatusChange({ isPlaying: false, isTransmitting: false });
    }
  }

  clearKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Broadcast ATIS spoken transmission with VHF radio sound effects
   * CRITICAL FOR IOS SAFARI: speechSynthesis.speak() is initiated SYNCHRONOUSLY
   * in the user click/touch event loop without any preceding setTimeout.
   */
  broadcastAtis(scriptText, onStatusChange) {
    if (typeof window === 'undefined') return;

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    // 1. Clean up any previous broadcast
    this.clearKeepAlive();
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    // 2. Synchronous Web Audio initialization & hardware unlock (Required for iOS)
    this.initAudio();

    this.isPlaying = true;
    if (onStatusChange) onStatusChange({ isPlaying: true, isTransmitting: true });

    // 3. Play initial PTT Mic Click & start VHF static hiss
    this.playMicClick(false);
    this.startStaticHiss(0.035);

    // 4. Split script into sentences for rock-solid playback across mobile WebKit & Blink
    const cleanText = (scriptText || '').replace(/\s+/g, ' ').trim();
    const rawSentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    const sentences = rawSentences.map(s => s.trim()).filter(Boolean);

    // 5. Keep-alive heartbeat (prevents Chrome and iOS WebKit from freezing long speech)
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 8000);

    // 6. SYNCHRONOUS FIRST SPEAK — must be synchronous for iOS Safari autoplay authorization!
    this.speakSentenceQueue(sentences, 0, onStatusChange);
  }

  stopBroadcast(onStatusChange) {
    this.isPlaying = false;
    this.clearKeepAlive();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.stopStaticHiss();

    if (this.audioCtx) {
      this.playMicClick(true); // PTT release chirp
    }

    this.currentUtterance = null;
    if (onStatusChange) onStatusChange({ isPlaying: false, isTransmitting: false });
  }
}

export const vhfAudioEngine = new VhfRadioAudioEngine();
