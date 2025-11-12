/**
 * Audio Buffer Utilities
 * Helper functions for audio buffer manipulation
 */

export class BufferUtils {
  static buildReversedURL(originalBuffer) {
    if (!originalBuffer) return null;
    const ch = originalBuffer.numberOfChannels;
    const len = originalBuffer.length;
    const sr = originalBuffer.sampleRate;
    const outBuf = new AudioBuffer({ length: len, numberOfChannels: ch, sampleRate: sr });
    for (let c = 0; c < ch; c++) {
      const src = originalBuffer.getChannelData(c);
      const dst = outBuf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        dst[i] = src[len - 1 - i];
      }
    }
    const total = len * ch * 2;
    const ab = new ArrayBuffer(44 + total);
    const view = new DataView(ab);
    let o = 0;
    const ws = (s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
      o += s.length;
    };
    ws('RIFF');
    view.setUint32(o, 36 + total, true);
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
    view.setUint32(o, total, true);
    o += 4;
    const inter = new Int16Array(total / 2);
    let idx = 0;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < ch; c++) {
        let v = outBuf.getChannelData(c)[i] * 0x7FFF;
        v = Math.max(-32768, Math.min(32767, v));
        inter[idx++] = v;
      }
    }
    for (let j = 0; j < inter.length; j++) view.setInt16(44 + j * 2, inter[j], true);
    return URL.createObjectURL(new Blob([new DataView(ab)], { type: 'audio/wav' }));
  }

  static buildReversedBuffer(originalBuffer, audioCtx) {
    if (!originalBuffer) return null;
    const ch = originalBuffer.numberOfChannels;
    const len = originalBuffer.length;
    const sr = originalBuffer.sampleRate;
    const out = audioCtx.createBuffer(ch, len, sr);
    for (let c = 0; c < ch; c++) {
      const s = originalBuffer.getChannelData(c);
      const d = out.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = s[len - 1 - i];
      }
    }
    return out;
  }
}

export const formatTime = (n) => {
  const t = Math.floor(n || 0);
  const m = Math.floor(t / 60);
  const s = String(t % 60).padStart(2, '0');
  return `${m}:${s}`;
};

export const formatDecimal = (n) => Number(n).toFixed(2);
