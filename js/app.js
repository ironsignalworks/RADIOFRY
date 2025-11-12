/**
 * RADIOFRY Main Application
 * ES Module entry point
 */

import { AudioEngine } from './audioEngine.js';
import { WavExporter } from './wavExporter.js';
import { BufferUtils } from './bufferUtils.js';
import { Visualizer } from './visualizer.js';
import { UIController } from './uiController.js';
import { REVERB_PRESETS, PRESETS } from './constants.js';

class RadioFry {
  constructor() {
    // Initialize modules
    this.audioEngine = new AudioEngine();
    this.wavExporter = new WavExporter(this.audioEngine);
    this.ui = new UIController();
    
    // Audio state
    this.originalBuffer = null;
    this.originalURL = null;
    this.reversedURL = null;
    this.reversed = false;
    this.recordedBuffer = null;
    
    // Recording state
    this.recorder = null;
    this.recordChunks = [];
    
    // Microphone state
    this.micStream = null;
    this.micSource = null;
    
    // Get DOM elements
    this.initElements();
    
    // Initialize visualizer
    this.visualizer = new Visualizer(this.canvas, this.audioEngine.analyser);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize UI
    this.init();
  }

  initElements() {
    this.appEl = document.getElementById('app');
    this.skinBtn = document.getElementById('skinBtn');
    this.helpBtn = document.getElementById('helpBtn');
    this.howto = document.getElementById('howto');
    this.howtoClose = document.getElementById('howtoClose');
    this.file = document.getElementById('file');
    this.fileName = document.getElementById('fileName');
    this.player = document.getElementById('player');
    this.recordBtn = document.getElementById('record');
    this.reverseBtn = document.getElementById('reverse');
    this.micBtn = document.getElementById('micBtn');
    this.presetsRow = document.getElementById('presets');
    this.reverbPresetSel = document.getElementById('reverbPreset');
    this.effWrap = document.getElementById('effects');
    this.freq = document.getElementById('freq');
    this.freqOut = document.getElementById('freqOut');
    this.vol = document.getElementById('vol');
    this.volOut = document.getElementById('volOut');
    this.pitch = document.getElementById('pitch');
    this.pitchOut = document.getElementById('pitchOut');
    this.canvas = document.getElementById('visualizer');
    this.durT = document.getElementById('durT');
    this.resetBtn = document.getElementById('reset');
    this.shareBtn = document.getElementById('shareBtn');
    this.exportBtn = document.getElementById('export');
    this.playBtn = document.getElementById('play');
    this.seek = document.getElementById('seek');
    this.curT = document.getElementById('curT');
  }

  setupEventListeners() {
    // Viewport scaling
    window.addEventListener('resize', () => this.fitToViewport(), { passive: true });
    window.addEventListener('resize', () => this.visualizer.setCanvasSize(), { passive: true });

    // Skin control
    this.skinBtn.addEventListener('click', () => this.ui.cycleSkin(this.appEl, this.skinBtn));

    // Help popup
    this.helpBtn.addEventListener('click', () => this.howto.classList.toggle('show'));
    this.howtoClose.addEventListener('click', () => this.howto.classList.remove('show'));

    // File upload
    this.file.addEventListener('change', () => this.handleFileUpload());

    // Playback controls
    this.playBtn.addEventListener('click', () => this.togglePlayback());
    this.player.addEventListener('play', () => this.ui.togglePlayButton(true, this.playBtn));
    this.player.addEventListener('pause', () => this.ui.togglePlayButton(false, this.playBtn));
    this.player.addEventListener('timeupdate', () => {
      this.ui.updateTimeDisplay(this.player.currentTime, this.player.duration, 
        this.curT, this.durT, this.seek);
    });
    this.player.addEventListener('loadedmetadata', () => {
      this.ui.updateDurationDisplay(this.player.duration, this.durT);
    });
    this.seek.addEventListener('input', () => {
      if (!isNaN(this.player.duration)) {
        this.player.currentTime = (this.seek.value / 1000) * this.player.duration;
      }
    });

    // Effects
    this.effWrap.addEventListener('click', (e) => this.handleEffectToggle(e));
    this.reverseBtn.addEventListener('click', () => this.handleReverse());
    this.presetsRow.addEventListener('click', (e) => this.handlePreset(e));
    this.reverbPresetSel.addEventListener('change', () => this.handleReverbChange());

    // Sliders
    this.freq.addEventListener('input', () => {
      this.ui.updateFreqOutput(this.freq.value, this.freqOut);
      if (this.audioEngine.filter) {
        this.audioEngine.filter.frequency.value = +this.freq.value;
      }
    });
    this.pitch.addEventListener('input', () => {
      this.ui.updatePitchOutput(this.pitch.value, this.pitchOut);
      this.player.playbackRate = +this.pitch.value;
    });
    this.vol.addEventListener('input', () => {
      this.ui.updateVolOutput(this.vol.value, this.volOut);
      if (this.audioEngine.gain) {
        this.audioEngine.gain.gain.value = +this.vol.value;
      }
    });

    // Recording
    this.recordBtn.addEventListener('click', () => this.handleRecording());
    this.micBtn.addEventListener('click', () => this.toggleMicrophone());

    // Export
    this.exportBtn.addEventListener('click', () => this.handleExport());

    // Reset
    this.resetBtn.addEventListener('click', () => this.resetAll());

    // Share
    this.shareBtn.addEventListener('click', () => this.shareURL());
  }

  init() {
    this.fitToViewport();
    this.visualizer.setCanvasSize();
    this.audioEngine.ensureContext(this.freq.value);
    this.visualizer.updateAnalyser(this.audioEngine.analyser);
    this.visualizer.start();
    this.ui.applySkin('classic', this.appEl, this.skinBtn);
    this.initFromParams();
  }

  fitToViewport() {
    const BASE_W = 1280;
    const BASE_H = 760;
    const MARGIN = 16;
    if (window.matchMedia('(max-width:900px)').matches) {
      this.appEl.style.transform = 'none';
      this.appEl.style.width = '100%';
      this.appEl.style.height = 'auto';
      document.body.style.overflow = 'auto';
      return;
    }
    this.appEl.style.width = BASE_W + 'px';
    this.appEl.style.height = BASE_H + 'px';
    const sw = (window.innerWidth - MARGIN) / BASE_W;
    const sh = (window.innerHeight - MARGIN) / BASE_H;
    const scale = Math.min(1, sw, sh) * 0.98;
    this.appEl.style.transform = `scale(${scale})`;
    document.body.style.overflow = 'hidden';
  }

  async handleFileUpload() {
    const f = this.file.files && this.file.files[0];
    if (!f) return;
    if (this.micStream) this.stopMic();
    this.recordedBuffer = null;
    this.fileName.textContent = f.name || 'No file chosen';
    this.originalURL = URL.createObjectURL(f);
    this.player.src = this.originalURL;
    this.player.load();
    this.audioEngine.ensureContext(this.freq.value);
    try {
      const buf = await f.arrayBuffer();
      const decoded = await this.audioEngine.audioCtx.decodeAudioData(buf);
      this.originalBuffer = decoded;
      if (!this.audioEngine.playerSource) {
        this.audioEngine.playerSource = this.audioEngine.audioCtx.createMediaElementSource(this.player);
      }
      this.audioEngine.source = this.audioEngine.playerSource;
      this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
      this.player.playbackRate = +this.pitch.value;
      this.player.muted = false;
    } catch (err) {
      console.error('Error loading audio file:', err);
    }
  }

  togglePlayback() {
    if (!this.player.src && !this.micStream) return;
    this.audioEngine.ensureContext(this.freq.value);
    if (this.player.paused) {
      this.player.play();
    } else {
      this.player.pause();
    }
  }

  handleEffectToggle(e) {
    const btn = e.target.closest('button[data-effect]');
    if (!btn) return;
    const name = btn.dataset.effect;
    const state = !(btn.dataset.active === 'true');
    this.ui.setActiveButton(btn, state);
    this.audioEngine.effect[name] = state;
    this.audioEngine.toggleGlitch(name === 'glitch' && this.audioEngine.effect[name]);
    this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
  }

  handleReverse() {
    if (!this.originalBuffer) return alert('Upload audio first');
    if (!this.reversedURL) {
      this.reversedURL = BufferUtils.buildReversedURL(this.originalBuffer);
    }
    this.reversed = !this.reversed;
    this.ui.setActiveButton(this.reverseBtn, this.reversed);
    const wasPlaying = !this.player.paused;
    this.player.pause();
    this.player.src = this.reversed ? this.reversedURL : this.originalURL;
    this.player.load();
    if (wasPlaying) this.player.play();
  }

  handlePreset(e) {
    const b = e.target.closest('button[data-preset]');
    if (!b) return;
    const presetName = b.dataset.preset;
    const preset = PRESETS[presetName];
    if (!preset) return;

    this.audioEngine.effect.distortion = preset.distortion;
    this.audioEngine.effect.echo = preset.echo;
    this.audioEngine.effect.crush = preset.crush;
    this.audioEngine.effect.glitch = preset.glitch;

    [...this.effWrap.querySelectorAll('button[data-effect]')].forEach(btn => {
      const n = btn.dataset.effect;
      this.ui.setActiveButton(btn, this.audioEngine.effect[n]);
    });

    this.freq.value = preset.freq;
    this.freq.dispatchEvent(new Event('input'));
    this.pitch.value = preset.pitch;
    this.pitch.dispatchEvent(new Event('input'));
    this.vol.value = preset.vol;
    this.vol.dispatchEvent(new Event('input'));
    this.audioEngine.toggleGlitch(this.audioEngine.effect.glitch);
    this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
  }

  async handleReverbChange() {
    const key = this.reverbPresetSel.value;
    this.audioEngine.effect.reverb = key !== 'off';
    if (this.audioEngine.effect.reverb) {
      await this.audioEngine.loadImpulseResponse(key, REVERB_PRESETS);
      if (this.audioEngine.loadedIRBuffer) {
        this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
      }
    } else {
      this.audioEngine.loadedIRBuffer = null;
      this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
    }
  }

  async handleRecording() {
    this.audioEngine.ensureContext(this.freq.value);
    if (!this.recorder || this.recorder.state === 'inactive') {
      if (!this.audioEngine.nodes.streamDest || !this.audioEngine.nodes.streamDest.stream) {
        alert('No audio source available. Load a file or enable mic first.');
        return;
      }
      this.recordChunks = [];
      try {
        this.recorder = new MediaRecorder(this.audioEngine.nodes.streamDest.stream, 
          { mimeType: 'audio/webm' });
        this.recorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordChunks.push(e.data);
        };
        this.recorder.onstop = async () => {
          const blob = new Blob(this.recordChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const buffer = await this.audioEngine.audioCtx.decodeAudioData(reader.result);
              this.recordedBuffer = buffer;
              const textSpan = this.recordBtn.querySelector('.btn-text');
              if (textSpan) textSpan.textContent = 'Rec';
              this.recordBtn.dataset.active = 'false';
              this.ui.showRecordingComplete(this.exportBtn);
            } catch (err) {
              console.error('Failed to decode recorded audio:', err);
              alert('Recording failed to process. Try recording again.');
              const textSpan = this.recordBtn.querySelector('.btn-text');
              if (textSpan) textSpan.textContent = 'Rec';
              this.recordBtn.dataset.active = 'false';
            }
          };
          reader.readAsArrayBuffer(blob);
        };
        this.recorder.start();
        const textSpan = this.recordBtn.querySelector('.btn-text');
        if (textSpan) textSpan.textContent = 'Stop';
        this.recordBtn.dataset.active = 'true';
      } catch (err) {
        console.error('Recording failed:', err);
        alert('Recording not supported in this browser');
      }
    } else {
      this.recorder.stop();
    }
  }

  async toggleMicrophone() {
    if (this.micStream) {
      this.stopMic();
    } else {
      this.startMic();
    }
  }

  async startMic() {
    this.audioEngine.ensureContext(this.freq.value);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone not supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      this.micSource = this.audioEngine.audioCtx.createMediaStreamSource(stream);
      this.audioEngine.source = this.micSource;
      this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
      this.micBtn.dataset.active = 'true';
      const textSpan = this.micBtn.querySelector('.btn-text');
      if (textSpan) textSpan.textContent = 'Mic On';
      this.micBtn.setAttribute('aria-pressed', 'true');
      try { this.player.pause(); } catch (e) {}
    } catch (err) {
      alert('Microphone permission denied');
    }
  }

  stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    this.micSource = null;
    if (this.audioEngine.playerSource) {
      this.audioEngine.source = this.audioEngine.playerSource;
      this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
    }
    this.micBtn.dataset.active = 'false';
    const textSpan = this.micBtn.querySelector('.btn-text');
    if (textSpan) textSpan.textContent = 'Use Mic';
    this.micBtn.setAttribute('aria-pressed', 'false');
  }

  handleExport() {
    if (!this.originalBuffer && !this.recordedBuffer) {
      return alert('Upload audio first or record something');
    }
    this.wavExporter.exportWav(
      this.originalBuffer,
      this.recordedBuffer,
      this.reversed,
      () => BufferUtils.buildReversedBuffer(this.originalBuffer, this.audioEngine.audioCtx),
      this.audioEngine.effect,
      this.freq.value,
      this.pitch.value,
      this.vol.value,
      this.audioEngine.loadedIRBuffer,
      this.audioEngine.reverbWet
    );
  }

  resetAll() {
    this.reversed = false;
    this.ui.setActiveButton(this.reverseBtn, false);
    if (this.originalURL) {
      this.player.src = this.originalURL;
      this.player.load();
    }
    this.audioEngine.effect.distortion = false;
    this.audioEngine.effect.echo = false;
    this.audioEngine.effect.crush = false;
    this.audioEngine.effect.glitch = false;
    this.audioEngine.effect.reverb = false;
    this.audioEngine.toggleGlitch(false);
    if (this.reverbPresetSel) this.reverbPresetSel.value = 'off';
    this.audioEngine.loadedIRBuffer = null;
    this.recordedBuffer = null;
    [...this.effWrap.querySelectorAll('button[data-effect]')].forEach(b => {
      this.ui.setActiveButton(b, false);
    });
    this.freq.value = 1200;
    this.freqOut.textContent = '1200Hz';
    if (this.audioEngine.filter) this.audioEngine.filter.frequency.value = 1200;
    this.pitch.value = 1;
    this.pitchOut.textContent = '1.00×';
    this.player.playbackRate = 1;
    this.vol.value = 1;
    this.volOut.textContent = '1.00';
    if (this.audioEngine.gain) this.audioEngine.gain.gain.value = 1;
    this.seek.value = 0;
    this.curT.textContent = '0:00';
    this.durT.textContent = '0:00';
    this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
  }

  shareURL() {
    const base = "https://ironsignalworks.com/radiofry";
    const p = new URLSearchParams();
    p.set('sk', this.ui.skins[this.ui.skinIndex]);
    p.set('fxd', String(this.audioEngine.effect.distortion));
    p.set('fxe', String(this.audioEngine.effect.echo));
    p.set('fxc', String(this.audioEngine.effect.crush));
    p.set('fxg', String(this.audioEngine.effect.glitch));
    p.set('rev', String(this.reverbPresetSel.value || 'off'));
    p.set('fq', String(this.freq.value));
    p.set('pt', String(this.pitch.value));
    p.set('vl', String(this.vol.value));
    p.set('rvd', String(this.reversed));
    p.set('utm_source', 'radiofry');
    p.set('utm_medium', 'share');
    p.set('utm_campaign', 'lab-to-site');
    const url = base + '?' + p.toString();
    navigator.clipboard.writeText(url).then(() => {
      this.ui.showShareConfirmation(this.shareBtn);
    });
  }

  initFromParams() {
    const p = new URLSearchParams(location.search);
    const sk = p.get('sk');
    if (sk) {
      this.ui.skinIndex = Math.max(0, ['classic', 'darkops', 'office'].indexOf(sk));
      this.ui.applySkin(this.ui.skins[this.ui.skinIndex] || 'classic', this.appEl, this.skinBtn);
    }
    const parseBool = v => v === 'true';
    this.audioEngine.effect.distortion = parseBool(p.get('fxd'));
    this.audioEngine.effect.echo = parseBool(p.get('fxe'));
    this.audioEngine.effect.crush = parseBool(p.get('fxc'));
    this.audioEngine.effect.glitch = parseBool(p.get('fxg'));
    const rev = p.get('rev');
    if (rev) {
      this.reverbPresetSel.value = rev;
      this.audioEngine.effect.reverb = rev !== 'off';
      if (this.audioEngine.effect.reverb) {
        this.audioEngine.loadImpulseResponse(rev, REVERB_PRESETS);
      }
    }
    const fq = p.get('fq');
    if (fq) {
      this.freq.value = +fq;
      this.freqOut.textContent = `${Math.round(fq)}Hz`;
    }
    const pt = p.get('pt');
    if (pt) {
      this.pitch.value = +pt;
      this.pitchOut.textContent = Number(pt).toFixed(2) + '×';
    }
    const vl = p.get('vl');
    if (vl) {
      this.vol.value = +vl;
      this.volOut.textContent = Number(vl).toFixed(2);
    }
    const rvd = p.get('rvd');
    if (rvd) {
      this.reversed = parseBool(rvd);
      this.ui.setActiveButton(this.reverseBtn, this.reversed);
    }

    [...this.effWrap.querySelectorAll('button[data-effect]')].forEach(b => {
      const n = b.dataset.effect;
      this.ui.setActiveButton(b, !!this.audioEngine.effect[n]);
    });

    this.audioEngine.rebuildGraph(this.freq.value, this.vol.value);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RadioFry();
});
