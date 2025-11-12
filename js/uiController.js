/**
 * UI Controller Module
 * Manages UI interactions and state
 */

import { formatTime, formatDecimal } from './bufferUtils.js';

export class UIController {
  constructor() {
    this.skinIndex = 0;
    this.skins = ['classic', 'darkops', 'office'];
  }

  applySkin(skin, appEl, skinBtn) {
    appEl.classList.remove('skin-darkops', 'skin-office');
    if (skin === 'darkops') appEl.classList.add('skin-darkops');
    if (skin === 'office') appEl.classList.add('skin-office');
    skinBtn.textContent = 'Skin: ' + (
      skin === 'classic' ? 'Retro 95' :
      skin === 'darkops' ? 'Dark-Ops' :
      'Office Glow'
    );
  }

  cycleSkin(appEl, skinBtn) {
    this.skinIndex = (this.skinIndex + 1) % this.skins.length;
    this.applySkin(this.skins[this.skinIndex], appEl, skinBtn);
  }

  updateFreqOutput(value, output) {
    output.textContent = `${Math.round(value)}Hz`;
  }

  updatePitchOutput(value, output) {
    output.textContent = `${formatDecimal(value)}×`;
  }

  updateVolOutput(value, output) {
    output.textContent = formatDecimal(value);
  }

  updateTimeDisplay(currentTime, duration, curT, durT, seek) {
    if (!isNaN(duration)) {
      seek.value = Math.floor((currentTime / duration) * 1000) || 0;
      curT.textContent = formatTime(currentTime);
    }
  }

  updateDurationDisplay(duration, durT) {
    durT.textContent = formatTime(duration);
  }

  togglePlayButton(playing, playBtn) {
    const iconSpan = playBtn.querySelector('.play-icon');
    if (iconSpan) {
      // Use HTML entities for better cross-browser compatibility
      iconSpan.innerHTML = playing ? '&#9208;' : '&#9654;';
    } else {
      // Fallback if span doesn't exist
      playBtn.innerHTML = playing ? '&#9208;' : '&#9654;';
    }
  }

  showRecordingComplete(exportBtn) {
    alert('Recording complete! Click "Export Audio" to save your recording.');
    exportBtn.style.animation = 'pulse 1s ease-in-out 3';
    setTimeout(() => { exportBtn.style.animation = ''; }, 3000);
  }

  showShareConfirmation(shareBtn) {
    shareBtn.textContent = 'Copied!';
    setTimeout(() => shareBtn.textContent = 'Share', 1200);
  }

  setActiveButton(btn, active) {
    btn.dataset.active = String(active);
    btn.setAttribute('aria-pressed', String(active));
  }
}
