/**
 * WAV Export Module
 * Handles WAV file generation with metadata
 */

export class WavExporter {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
  }

  bufferToWavWithInfo(buf, comment) {
    const ch = buf.numberOfChannels;
    const sr = buf.sampleRate;
    const samples = buf.length;
    const dataLen = samples * ch * 2;

    const pcm = new Int16Array(samples * ch);
    let i = 0;
    for (let s = 0; s < samples; s++) {
      for (let c = 0; c < ch; c++) {
        let v = buf.getChannelData(c)[s] * 0x7FFF;
        v = Math.max(-32768, Math.min(32767, v));
        pcm[i++] = v;
      }
    }

    const pad2 = (n) => (n % 2) ? n + 1 : n;
    const txt = new TextEncoder().encode(comment + '\0');
    const icmtSize = 4 + 4 + pad2(txt.length);
    const listSize = 4 + 4 + icmtSize;
    const riffSize = 4 + (8 + 16) + (8 + dataLen) + (8 + listSize);

    const ab = new ArrayBuffer(8 + riffSize);
    const view = new DataView(ab);
    let o = 0;
    const ws = (s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
      o += s.length;
    };

    ws('RIFF');
    view.setUint32(o, riffSize, true);
    o += 4;
    ws('WAVE');
    ws('fmt ');
    view.setUint32(o, 16, true);
    o += 4;
    view.setUint16(o, 1, true);
    o += 2;
    view.setUint16(o, ch, true);
    o += 2;
    view.setUint32(o, sr, true);
    o += 4;
    view.setUint32(o, sr * ch * 2, true);
    o += 4;
    view.setUint16(o, ch * 2, true);
    o += 2;
    view.setUint16(o, 16, true);
    o += 2;

    ws('data');
    view.setUint32(o, dataLen, true);
    o += 4;
    for (let j = 0; j < pcm.length; j++) view.setInt16(o + j * 2, pcm[j], true);
    o += dataLen;
    if (dataLen % 2) {
      view.setUint8(o, 0);
      o += 1;
    }

    ws('LIST');
    view.setUint32(o, listSize, true);
    o += 4;
    ws('INFO');
    ws('ICMT');
    view.setUint32(o, txt.length, true);
    o += 4;
    new Uint8Array(ab, o, txt.length).set(txt);
    o += pad2(txt.length);

    return ab;
  }

  renderOfflineBuffer(originalBuffer, recordedBuffer, reversed, buildReversedBuffer, effect, freq, pitch, vol, loadedIRBuffer, reverbWet) {
    const sourceBuffer = recordedBuffer || originalBuffer;
    
    if (!sourceBuffer) return Promise.reject(new Error('No audio loaded'));
    this.audioEngine.ensureContext(freq);
    
    if (recordedBuffer) {
      return Promise.resolve(recordedBuffer);
    }
    
    const srcBuf = reversed ? buildReversedBuffer() : originalBuffer;
    const ch = srcBuf.numberOfChannels;
    const sr = srcBuf.sampleRate;
    const frames = Math.ceil(srcBuf.length / Math.max(0.0001, +pitch));
    const off = new OfflineAudioContext(ch, frames, sr);
    const bs = off.createBufferSource();
    bs.buffer = srcBuf;
    bs.playbackRate.value = +pitch;
    const ofilter = off.createBiquadFilter();
    ofilter.type = 'bandpass';
    ofilter.frequency.value = +freq;
    const ogain = off.createGain();
    ogain.gain.value = +vol;
    const odist = off.createWaveShaper();
    if (effect.distortion) {
      const n = 44100;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = i * 2 / n - 1;
        curve[i] = Math.tanh(76 * x) / Math.tanh(76);
      }
      odist.curve = curve;
    }
    const opost = off.createBiquadFilter();
    opost.type = 'bandpass';
    opost.Q.value = 1.5;
    opost.frequency.value = 1000;
    const odg = off.createGain();
    odg.gain.value = 0.4;
    const odelay = off.createDelay();
    odelay.delayTime.value = 0.25;
    const ofb = off.createGain();
    ofb.gain.value = 0.3;
    odelay.connect(ofb);
    ofb.connect(odelay);
    const obit = off.createBiquadFilter();
    obit.type = 'highshelf';
    obit.frequency.value = 8000;
    obit.gain.value = effect.crush ? -40 : 0;
    const oglitch = off.createGain();
    oglitch.gain.value = 1;
    if (effect.glitch) {
      let t = 0;
      const step = 0.03;
      while (t < (frames / sr)) {
        oglitch.gain.setValueAtTime(Math.random() > 0.5 ? 1 : 0, t);
        t += step;
      }
    }
    let last = bs;
    last.connect(ofilter);
    last = ofilter;
    if (effect.distortion) {
      last.connect(odist);
      odist.connect(opost);
      opost.connect(odg);
      last = odg;
    }
    if (effect.echo) {
      last.connect(odelay);
      last = odelay;
    }
    if (effect.crush) {
      last.connect(obit);
      last = obit;
    }
    if (effect.glitch) {
      last.connect(oglitch);
      last = oglitch;
    }
    if (effect.reverb && loadedIRBuffer) {
      const oconv = off.createConvolver();
      oconv.buffer = loadedIRBuffer;
      const oWet = off.createGain();
      oWet.gain.value = reverbWet;
      const oDry = off.createGain();
      oDry.gain.value = 1 - reverbWet;
      last.connect(oDry);
      oDry.connect(ogain);
      last.connect(oconv);
      oconv.connect(oWet);
      oWet.connect(ogain);
    } else {
      last.connect(ogain);
    }
    ogain.connect(off.destination);
    bs.start();
    return off.startRendering();
  }

  async exportWav(originalBuffer, recordedBuffer, reversed, buildReversedBuffer, effect, freq, pitch, vol, loadedIRBuffer, reverbWet) {
    try {
      const rendered = await this.renderOfflineBuffer(
        originalBuffer, recordedBuffer, reversed, buildReversedBuffer, 
        effect, freq, pitch, vol, loadedIRBuffer, reverbWet
      );
      const ab = this.bufferToWavWithInfo(rendered,
        'Generated with RADIOFRY // Iron Signal Works — https://ironsignalworks.com');
      const blob = new Blob([new DataView(ab)], { type: 'audio/wav' });
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = URL.createObjectURL(blob);
      a.download = `radiofry_export_isw_${stamp}.wav`;
      a.click();
    } catch (err) {
      console.error(err);
      alert('Render failed');
    }
  }
}
