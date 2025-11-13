# RADIOFRY - ES Modules Architecture

## ?? Project Structure

```
radiofry/
??? index.html              # Main HTML file (uses ES modules)
??? js/
?   ??? app.js             # Main application controller
?   ??? audioEngine.js     # Web Audio API management
?   ??? wavExporter.js     # WAV file export functionality
?   ??? bufferUtils.js     # Audio buffer utilities
?   ??? visualizer.js      # Canvas waveform visualization
?   ??? uiController.js    # UI state and interactions
?   ??? constants.js       # Reverb presets and effect presets
??? reverbs/               # Impulse response files
```

## ??? Module Overview

### **app.js** - Main Application Controller
The entry point that orchestrates all modules. Handles:
- Application initialization
- Event listener setup
- State management
- URL parameter handling

### **audioEngine.js** - Audio Processing Core
Manages the Web Audio API graph:
- Audio context creation
- Node connections (distortion, echo, crush, glitch, reverb)
- Effect processing pipeline
- Impulse response loading

### **wavExporter.js** - Export Functionality
Handles WAV file generation:
- Offline audio rendering
- WAV file encoding with metadata (RIFF INFO)
- Browser download trigger

### **bufferUtils.js** - Audio Buffer Utilities
Helper functions for audio manipulation:
- Buffer reversal for reverse effect
- Time/decimal formatting utilities

### **visualizer.js** - Waveform Display
Canvas-based audio visualization:
- Real-time waveform rendering
- Responsive canvas sizing
- Animation frame management

### **uiController.js** - UI Management
Handles all UI interactions and updates:
- Skin switching
- Button state management
- Output display updates
- User feedback (alerts, confirmations)

### **constants.js** - Configuration
Centralized configuration:
- Reverb preset mappings
- Effect preset definitions (CHARRED, BAKED, FRIED)

## ?? Benefits of ES Modules

### **Better Organization**
- Each module has a single responsibility
- Clear separation of concerns
- Easier to locate and modify specific functionality

### **Improved Maintainability**
- Isolated code changes
- Less risk of breaking unrelated features
- Easier debugging and testing

### **Code Reusability**
- Modules can be imported anywhere
- Shared utilities in one place
- Easy to extend with new modules

### **Performance**
- Browser can cache modules separately
- Only load what's needed (tree-shaking compatible)
- Better memory management

### **Developer Experience**
- IDE autocomplete and type inference
- Clear import/export statements
- Modern JavaScript best practices

## ?? Development

### Running Locally
Due to ES modules requiring CORS, you must use a web server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Then open: `http://localhost:8000`

### Module Dependencies

```
app.js
??? audioEngine.js
??? wavExporter.js
?   ??? audioEngine.js
??? bufferUtils.js
??? visualizer.js
??? uiController.js
?   ??? bufferUtils.js
??? constants.js
```

## ?? Key Changes from Original

### Before (Monolithic):
- All code in one large `<script>` block
- ~500+ lines in index.html
- Hard to test individual features
- Global scope pollution

### After (Modular):
- 7 separate, focused modules
- Clean HTML with single import
- Each module ~100-200 lines
- Encapsulated, testable code
- No global variables

## ?? Future Enhancements

The modular structure makes it easy to add:
- Unit tests for each module
- TypeScript definitions
- Additional audio effects as separate modules
- Plugin system for community effects
- State persistence module
- Web Workers for offline rendering

## ?? Module API Reference

### AudioEngine

```javascript
import { AudioEngine } from './audioEngine.js';

const engine = new AudioEngine();
engine.ensureContext(1200);
engine.rebuildGraph(1200, 1.0);
await engine.loadImpulseResponse('batcave', REVERB_PRESETS);
```

### WavExporter

```javascript
import { WavExporter } from './wavExporter.js';

const exporter = new WavExporter(audioEngine);
await exporter.exportWav(buffer, null, false, buildReversedFn, effects, freq, pitch, vol, irBuffer, wet);
```

### Visualizer

```javascript
import { Visualizer } from './visualizer.js';

const viz = new Visualizer(canvas, analyser);
viz.setCanvasSize();
viz.start();
```

### UIController

```javascript
import { UIController } from './uiController.js';

const ui = new UIController();
ui.applySkin('darkops', appEl, skinBtn);
ui.updateFreqOutput(1200, outputEl);
```

## ?? Browser Compatibility

ES modules are supported in all modern browsers:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

No transpilation needed for modern browsers!

## ?? License

Same as RADIOFRY main project.
