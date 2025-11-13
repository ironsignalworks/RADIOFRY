# Recording Export Fix - Implementation Guide

## Problem
Currently, the "? Rec" button only exports to WEBM format automatically. Users cannot choose their export format for recorded audio.

## Solution
Make recordings save to a buffer first, then allow users to choose export format (WAV/MP3/OGG) just like with uploaded files.

## Changes Required

### 1. Add Recording Buffer Variable
**Location:** Line ~408 (Audio graph state section)

```javascript
let recordedBuffer=null; // ADD THIS LINE after recordChunks
```

### 2. Update Recording Handler
**Location:** Line ~655 (recordBtn.addEventListener)

Replace the `recorder.onstop` handler with:

```javascript
recorder.onstop = ()=>{
  const blob = new Blob(recordChunks, {type:'audio/webm'});
  const reader = new FileReader();
  reader.onload = ()=>{
    audioCtx.decodeAudioData(reader.result)
      .then(buffer=>{
        recordedBuffer = buffer;
        recordBtn.textContent = '? Rec';
        recordBtn.dataset.active = 'false';
        fileName.textContent = `??? Recording (${Math.round(buffer.duration)}s) - Click Export`;
        fileName.style.color = '#22c55e';
        fileName.style.fontWeight = 'bold';
      })
      .catch(err=>{
        console.error('Failed to decode:', err);
        alert('Recording failed. Try again.');
        recordBtn.textContent = '? Rec';
        recordBtn.dataset.active = 'false';
      });
  };
  reader.readAsArrayBuffer(blob);
};
```

### 3. Update renderOfflineBuffer()
**Location:** Line ~688

Add check at beginning:

```javascript
function renderOfflineBuffer(){
  // Use recorded buffer if available
  const sourceBuffer = recordedBuffer || originalBuffer;
  if(!sourceBuffer) return Promise.reject(new Error('No audio loaded'));
  
  // If using recorded buffer, return it directly (effects already baked in)
  if(recordedBuffer){
    return Promise.resolve(recordedBuffer);
  }
  
  // Otherwise apply effects to original buffer
  ensureContext();
  const srcBuf=reversed?buildReversedBuffer():originalBuffer;
  // ... rest of function
}
```

### 4. Update Export Button Handler
**Location:** Line ~724

Change to:

```javascript
exportBtn.addEventListener('click', ()=>{
  if(!originalBuffer && !recordedBuffer) return alert('Upload or record audio first');
  exportPicker.classList.add('show');
  exportOverlay.classList.add('show');
});
```

### 5. Clear Recorded Buffer on File Load
**Location:** Line ~580 (file.addEventListener)

Add after `if(micStream) stopMic();`:

```javascript
recordedBuffer=null; // Clear any previous recording
fileName.style.color = ''; // Reset filename color
fileName.style.fontWeight = '';
```

### 6. Clear Recorded Buffer on Reset
**Location:** Line ~634 (resetAll function)

Add after `loadedIRBuffer=null;`:

```javascript
recordedBuffer=null;
fileName.style.color = '';
fileName.style.fontWeight = '';
```

### 7. Add Pulse Animation (Optional)
**Location:** Line ~164 (CSS, after @media reduced-motion)

```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4); }
}
```

## Testing Checklist

1. **Record from mic:**
   - ? Click "??? Use Mic"
   - ? Click "? Rec" to start
   - ? Click "? Stop" to stop
   - ? Filename should show "??? Recording (Xs) - Click Export"
   - ? Click "Export Audio"
   - ? Choose WAV/MP3/OGG
   - ? File downloads with effects baked in

2. **Record from file:**
   - ? Load a file
   - ? Apply effects (distortion, reverb, etc.)
   - ? Click "? Rec" while playing
   - ? Stop recording
   - ? Export as WAV/MP3/OGG
   - ? Exported file has effects applied

3. **Clear recording:**
   - ? Record something
   - ? Click "Reset" - recording clears
   - ? Load new file - recording clears

4. **Both buffers:**
   - ? Load file
   - ? Record it with effects
   - ? Export - should use recorded buffer (with effects)
   - ? Clear recording
   - ? Export - should use original buffer

## Benefits

? **Consistent UX** - Same export flow for files and recordings
? **Format choice** - Users pick WAV/MP3/OGG for recordings
? **Visual feedback** - Filename shows recording is ready
? **No auto-download** - User decides when to export
? **Effects baked in** - Recordings have all effects applied

## File Size Impact

- **Before:** ~115 KB
- **After:** ~116 KB (+1 KB)
- **Minimal increase:** Only added buffer variable and UI updates

---

**Status:** Ready to implement
**Priority:** High - Fixes major UX issue
**Risk:** Low - Only affects recording workflow
