/**
 * Audio Engine Module
 * Manages Web Audio API context, nodes, and audio graph
 */

export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.gain = null;
    this.filter = null;
    this.playerSource = null;
    this.nodes = {};
    this.loadedIRBuffer = null;
    this.reverbWet = 0.35;
    this.effect = {
      distortion: false,
      echo: false,
      crush: false,
      glitch: false,
      reverb: false
    };
    this.glitchTimer = null;
  }

  ensureContext(freqValue) {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.gain = this.audioCtx.createGain();
      this.filter = this.audioCtx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.frequency.value = +freqValue;

      this.nodes.distortion = this.audioCtx.createWaveShaper();
      this.nodes.post = this.audioCtx.createBiquadFilter();
      this.nodes.post.type = 'bandpass';
      this.nodes.post.frequency.value = 1000;
      this.nodes.post.Q.value = 1.5;
      this.nodes.distGain = this.audioCtx.createGain();
      this.nodes.distGain.gain.value = 0.4;

      this.nodes.delay = this.audioCtx.createDelay();
      this.nodes.delay.delayTime.value = 0.25;
      this.nodes.feedback = this.audioCtx.createGain();
      this.nodes.feedback.gain.value = 0.3;
      this.nodes.delay.connect(this.nodes.feedback);
      this.nodes.feedback.connect(this.nodes.delay);

      this.nodes.bit = this.audioCtx.createBiquadFilter();
      this.nodes.bit.type = 'highshelf';
      this.nodes.bit.frequency.value = 8000;
      this.nodes.bit.gain.value = 0;
      this.nodes.glitch = this.audioCtx.createGain();
      this.nodes.glitch.gain.value = 1;

      this.nodes.convolver = this.audioCtx.createConvolver();
      this.nodes.gainWet = this.audioCtx.createGain();
      this.nodes.gainWet.gain.value = this.reverbWet;
      this.nodes.gainDry = this.audioCtx.createGain();
      this.nodes.gainDry.gain.value = 1 - this.reverbWet;

      this.nodes.streamDest = this.audioCtx.createMediaStreamDestination();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  makeCurve(amount = 75) {
    const n = 44100;
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = i * 2 / n - 1;
      c[i] = Math.tanh((amount + 1) * x) / Math.tanh(amount + 1);
    }
    return c;
  }

  toggleGlitch(on) {
    if (!this.nodes.glitch) return;
    this.nodes.glitch.gain.value = 1;
    if (this.glitchTimer) {
      clearInterval(this.glitchTimer);
      this.glitchTimer = null;
    }
    if (on) {
      this.glitchTimer = setInterval(() => {
        this.nodes.glitch.gain.value = Math.random() > 0.5 ? 1 : 0;
      }, 30);
    }
  }

  rebuildGraph(freqValue, volValue) {
    if (!this.audioCtx || !this.source) return;
    
    try { this.source.disconnect(); } catch (e) {}
    [this.gain, this.analyser, this.filter, this.nodes.distortion, this.nodes.post, 
     this.nodes.distGain, this.nodes.delay, this.nodes.feedback, this.nodes.bit, 
     this.nodes.glitch, this.nodes.convolver, this.nodes.gainDry, this.nodes.gainWet]
      .forEach(n => { if (n) { try { n.disconnect(); } catch (e) {} } });

    let last = this.source;
    this.filter.type = 'bandpass';
    this.filter.frequency.value = +freqValue;
    last.connect(this.filter);
    last = this.filter;

    if (this.effect.distortion) {
      this.nodes.distortion.curve = this.makeCurve(75);
      last.connect(this.nodes.distortion);
      this.nodes.distortion.connect(this.nodes.post);
      this.nodes.post.connect(this.nodes.distGain);
      last = this.nodes.distGain;
    }
    if (this.effect.echo) {
      last.connect(this.nodes.delay);
      last = this.nodes.delay;
    }
    if (this.effect.crush) {
      this.nodes.bit.gain.value = -40;
      last.connect(this.nodes.bit);
      last = this.nodes.bit;
    } else {
      this.nodes.bit.gain.value = 0;
    }
    if (this.effect.glitch) {
      last.connect(this.nodes.glitch);
      last = this.nodes.glitch;
    }

    this.gain.gain.value = +volValue;

    if (this.effect.reverb && this.loadedIRBuffer) {
      this.nodes.convolver.buffer = this.loadedIRBuffer;
      this.nodes.gainDry.gain.value = 1 - this.reverbWet;
      this.nodes.gainWet.gain.value = this.reverbWet;
      last.connect(this.nodes.gainDry);
      this.nodes.gainDry.connect(this.gain);
      last.connect(this.nodes.convolver);
      this.nodes.convolver.connect(this.nodes.gainWet);
      this.nodes.gainWet.connect(this.gain);
    } else {
      last.connect(this.gain);
    }

    this.gain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.analyser.connect(this.nodes.streamDest);
  }

  async loadImpulseResponse(key, irMap) {
    if (!key || key === 'off') {
      this.loadedIRBuffer = null;
      this.effect.reverb = false;
      return Promise.resolve();
    }
    const url = irMap[key];
    if (!url) {
      this.loadedIRBuffer = null;
      this.effect.reverb = false;
      return Promise.resolve();
    }
    this.ensureContext(1200);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      this.loadedIRBuffer = audioBuffer;
      this.nodes.convolver.buffer = audioBuffer;
      console.log(`Loaded reverb: ${key}`);
    } catch (err) {
      console.error(`Failed to load reverb ${key}:`, err);
      this.loadedIRBuffer = null;
      this.effect.reverb = false;
      
      if (window.location.protocol === 'file:') {
        alert(`?? Reverb requires a web server!\n\nYou're opening this file directly (file://). To use reverb:\n\n1. Run: python -m http.server 8000\n2. Or: npx serve\n3. Then open: http://localhost:8000\n\nReverb preset "${key}" cannot load.`);
      } else {
        alert(`Could not load reverb preset "${key}".\nFile: ${url}\nError: ${err.message}`);
      }
    }
  }
}
