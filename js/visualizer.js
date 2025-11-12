/**
 * Visualizer Module
 * Handles canvas waveform visualization
 */

export class Visualizer {
  constructor(canvas, analyser) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.animationId = null;
  }

  setCanvasSize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = this.canvas.getBoundingClientRect();
    let w = Math.floor(rect.width);
    let h = Math.floor(rect.height);
    if (w <= 0 || h <= 0) {
      const p = this.canvas.parentElement;
      w = (p && p.clientWidth) || 640;
      h = (p && p.clientHeight) || 240;
    }
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
  }

  start() {
    const animate = () => {
      if (!this.analyser) {
        this.animationId = requestAnimationFrame(animate);
        return;
      }
      const data = new Uint8Array(this.analyser.fftSize);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.analyser.getByteTimeDomainData(data);
      const w = this.canvas.width;
      const h = this.canvas.height;
      const step = w / (data.length - 1);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#00ff66';
      this.ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = i * step;
        const y = (data[i] / 255) * h;
        i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  updateAnalyser(analyser) {
    this.analyser = analyser;
  }
}
