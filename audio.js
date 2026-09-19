/**
 * ECHOCORE: ANTI-GRAVITY - Sound Synthesizer (Web Audio API)
 * Generates futuristic sci-fi sound effects procedurally without any external audio files.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('echocore_sound_muted') === 'true';
    this.musicMuted = localStorage.getItem('echocore_music_muted') === 'true';
    this.initialized = false;
    this.bgmOscs = [];
    this.bgmGain = null;
    this.bgmInterval = null;
    this.bgmPlaying = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.initialized = true;
      }
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('echocore_sound_muted', this.muted.toString());
    return this.muted;
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    localStorage.setItem('echocore_music_muted', this.musicMuted.toString());
    if (this.musicMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.musicMuted;
  }

  // Procedural Cyberpunk Ambient Synth BGM
  startBGM() {
    if (this.musicMuted || this.bgmPlaying) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      this.bgmPlaying = true;
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);

      // Ambient bass drone chord: D minor / F / A / C (Sci-Fi Cyberpunk vibe)
      const chordFreaks = [73.42, 110.00, 146.83, 174.61]; // D2, A2, D3, F3
      chordFreaks.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260 + idx * 40, this.ctx.currentTime);
        filter.Q.setValueAtTime(3, this.ctx.currentTime);

        lfo.frequency.setValueAtTime(0.18 + idx * 0.05, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(60, this.ctx.currentTime);
        lfo.connect(filter.frequency);

        osc.connect(filter);
        filter.connect(this.bgmGain);

        osc.start();
        lfo.start();
        this.bgmOscs.push(osc, lfo);
      });

      // Subtle arpeggiated melodic blips
      const arpeggioNotes = [293.66, 349.23, 440.0, 523.25, 587.33]; // D4, F4, A4, C5, D5
      let noteStep = 0;
      this.bgmInterval = setInterval(() => {
        if (!this.bgmPlaying || this.musicMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        const arpFilter = this.ctx.createBiquadFilter();

        arpOsc.type = 'sine';
        const freq = arpeggioNotes[noteStep % arpeggioNotes.length];
        noteStep = (noteStep + 1) % arpeggioNotes.length;
        arpOsc.frequency.setValueAtTime(freq, now);

        arpFilter.type = 'bandpass';
        arpFilter.frequency.setValueAtTime(freq * 1.2, now);
        arpFilter.Q.setValueAtTime(2, now);

        arpGain.gain.setValueAtTime(0.001, now);
        arpGain.gain.linearRampToValueAtTime(0.025, now + 0.04);
        arpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        arpOsc.connect(arpFilter);
        arpFilter.connect(this.bgmGain);

        arpOsc.start(now);
        arpOsc.stop(now + 0.46);
      }, 700);

    } catch (e) {
      console.warn("Error starting BGM:", e);
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmOscs.forEach(o => {
      try { o.stop(); o.disconnect(); } catch (e) {}
    });
    this.bgmOscs = [];
    if (this.bgmGain) {
      try { this.bgmGain.disconnect(); } catch (e) {}
      this.bgmGain = null;
    }
  }

  // Tactile Button Click
  playButton() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Countdown Beep (3, 2, 1)
  playCountdown(count) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = 600 + (3 - count) * 120;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Countdown Start ("GO!")
  playCountdownGo() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [1046.5, 1318.51].forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // Gravity Wave Whoosh (when pulse propagates)
  playGravityWave() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.37);
  }

  // ZERO-G Stasis Brake Sound
  playStasis() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.22);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  // Socket Snap & Magnetic Lock Sound
  playSnapLock() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Heavy mechanical snap latch
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(420, t);
    osc1.frequency.exponentialRampToValueAtTime(110, t + 0.07);
    gain1.gain.setValueAtTime(0.16, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.085);

    // 2. High-tech electromagnetic ring engage chime
    const notes = [659.25, 1046.50]; // E5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.05 + idx * 0.06);
      gain.gain.setValueAtTime(0.001, t + 0.05 + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.07 + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35 + idx * 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + 0.05 + idx * 0.06);
      osc.stop(t + 0.36 + idx * 0.06);
    });
  }

  // Directional Gravity Shift Sound
  playGravityShift(dir) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4, t);

    // Direction-based pitch accent
    let startFreq = 80;
    let endFreq = 160;
    if (dir === 'UP') { startFreq = 120; endFreq = 260; }
    else if (dir === 'DOWN') { startFreq = 220; endFreq = 90; }
    else if (dir === 'LEFT') { startFreq = 140; endFreq = 180; }
    else if (dir === 'RIGHT') { startFreq = 160; endFreq = 220; }
    else if (dir === 'NEUTRAL') { startFreq = 200; endFreq = 60; }

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.18);

    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.22);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  // Emergency Siren Alarm
  playAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.setValueAtTime(950, t + 0.08);
    osc.frequency.setValueAtTime(750, t + 0.16);
    osc.frequency.setValueAtTime(950, t + 0.24);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.setValueAtTime(0.08, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Objective Solved / Success Chime
  playSuccess() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.001, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.31);
    });
  }

  // Collision / Crash Sound
  playCollision(intensity = 1.0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.25;

    // Noise buffer for metal impact crunch
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + duration);

    const gain = this.ctx.createGain();
    const volume = Math.min(0.28 * intensity, 0.35);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Warning Radar Ping
  playWarning() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.15);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Magnetic Docking Chime
  playDock() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  // Extinguisher / Cryo Spray Sound
  playCryoSpray() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.3;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(1.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Game Over Sound
  playGameOver() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [330, 293.66, 261.63, 196]; // E4, D4, C4, G3
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.2);

      gain.gain.setValueAtTime(0.001, t + idx * 0.2);
      gain.gain.linearRampToValueAtTime(0.15, t + idx * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.2 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.2);
      osc.stop(t + idx * 0.2 + 0.45);
    });
  }

  // Level Clear Fanfare
  playLevelClear() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.001, t + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, t + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.36);
    });
  }
}

// Global sound manager instance
window.soundManager = new SoundManager();
