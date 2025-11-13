# RADIOFRY Export Formats

## Overview
RADIOFRY supports three export formats, each with different use cases:

## 1. WAV (Lossless) ? **Recommended**
- **Quality**: Lossless, uncompressed
- **File Size**: Large (~10MB per minute stereo)
- **Metadata**: Includes Iron Signal Works signature in RIFF INFO chunk
- **Compatibility**: Universal (works everywhere)
- **Use Case**: Archival, professional work, further processing

### Technical Details
- Format: PCM 16-bit
- Encoding: Direct buffer-to-WAV conversion
- Speed: Fast (synchronous rendering)
- Custom RIFF LIST/INFO chunk with `ICMT` (comment) field

## 2. MP3 (Compressed)
- **Quality**: Lossy, good quality
- **File Size**: Small (~1-2MB per minute)
- **Metadata**: Basic ID3 tags (browser-dependent)
- **Compatibility**: Universal
- **Use Case**: Web sharing, podcasts, general distribution

### Technical Details
- Format: MPEG Audio Layer III (browser-dependent)
- Encoding: MediaRecorder API with real-time audio context
- Speed: Moderate (requires real-time playback duration + 1s buffer)
- Fallback: May encode as M4A or WebM if MP3 not supported
- **Browser Support**:
  - ? Chrome/Edge: WebM (Opus)
  - ? Firefox: WebM (Opus)  
  - ? Safari: MP4/M4A (AAC)
  - ? Native MP3 encoding rare in browsers

## 3. OGG (Compressed)
- **Quality**: Lossy, excellent quality (Opus codec)
- **File Size**: Small (~1-2MB per minute)
- **Metadata**: Vorbis comments (browser-dependent)
- **Compatibility**: Good (some mobile/legacy limitations)
- **Use Case**: Open-source projects, web streaming

### Technical Details
- Format: Ogg container with Opus codec
- Encoding: MediaRecorder API with real-time audio context
- Speed: Moderate (requires real-time playback duration + 1s buffer)
- Fallback: May encode as WebM if OGG not supported
- **Browser Support**:
  - ? Chrome/Edge: OGG Opus or WebM
  - ? Firefox: OGG Opus or WebM
  - ?? Safari: Limited (may fallback to WebM)

## Export Process Flow

### WAV Export (Instant)
```
User clicks WAV ? Offline rendering ? Buffer to WAV ? Download
                   (< 1 second)
```

### MP3/OGG Export (Real-time)
```
User clicks MP3/OGG ? Offline rendering ? Create real-time context ?
                       (< 1 second)
                       
Start MediaRecorder ? Play buffer through stream ? Stop after duration ?
                      (file length + 1s)
                      
Encode chunks ? Download
```

## Comparison Table

| Feature | WAV | MP3 | OGG |
|---------|-----|-----|-----|
| **Quality** | Lossless | Good | Excellent |
| **File Size** | ~10MB/min | ~1-2MB/min | ~1-2MB/min |
| **Speed** | Instant | Real-time | Real-time |
| **Metadata** | Custom ISW | Basic | Basic |
| **Browser Support** | 100% | ~95% | ~90% |
| **Mobile Friendly** | ? | ? | ?? |
| **Professional** | ? | ? | ? |
| **Open Source** | ? | ? | ? |

## Recommendations by Use Case

### ?? Archive / Master Copy
**Use: WAV**
- Preserves all quality
- Includes ISW metadata signature
- Can be converted to any format later

### ?? Share on Social Media / Streaming
**Use: MP3**
- Universal compatibility
- Small file size
- Works on all platforms

### ?? Open Source / Web Distribution
**Use: OGG**
- Best quality-to-size ratio
- Open codec (no patents)
- Excellent for web audio

### ?? Further Audio Editing
**Use: WAV**
- No generation loss
- Maximum headroom
- Professional standard

## Browser Compatibility Notes

### Chrome/Edge/Brave
- ? WAV: Full support
- ? MP3: Via WebM (Opus) - exports as `.webm`
- ? OGG: Full OGG Opus support

### Firefox
- ? WAV: Full support
- ? MP3: Via WebM (Opus) - exports as `.webm`
- ? OGG: Full OGG Opus support

### Safari (Desktop/iOS)
- ? WAV: Full support
- ? MP3: Via MP4 (AAC) - exports as `.m4a`
- ?? OGG: Limited (may export as WebM)

## Technical Implementation

### WAV Export
Uses custom `bufferToWavWithInfo()` function that:
1. Renders audio offline (applies all effects)
2. Converts AudioBuffer to PCM Int16 samples
3. Builds proper RIFF/WAV structure
4. Adds LIST/INFO chunk with ISW signature
5. Creates blob and triggers download

### MP3/OGG Export  
Uses MediaRecorder API:
1. Renders audio offline (applies all effects)
2. Creates real-time AudioContext
3. Plays buffer through MediaStreamDestination
4. MediaRecorder captures stream
5. Waits for playback + 1s buffer
6. Creates blob from recorded chunks
7. Triggers download with appropriate extension

## Known Limitations

### MP3/OGG
- **Export time**: Takes audio duration + 1 second (not instant)
- **True MP3 rare**: Most browsers encode to WebM/Opus or M4A/AAC
- **File extension**: Auto-detected based on actual codec used
- **No progress indicator**: User must wait for encoding

### All Formats
- **Browser-dependent**: Codec availability varies by browser
- **No bitrate control**: MediaRecorder uses default settings
- **No metadata control**: Limited metadata customization for compressed formats

## Future Enhancements

- [ ] Progress indicators for compressed formats
- [ ] Bitrate selection for MP3/OGG
- [ ] True MP3 encoding via WebAssembly (lamejs)
- [ ] FLAC support for lossless compression
- [ ] Batch export (multiple formats at once)
- [ ] Custom metadata editor

---

**Built by Iron Signal Works** • [ironsignalworks.com](https://ironsignalworks.com)
