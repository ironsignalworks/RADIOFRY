# Migration Guide: From Inline Script to ES Modules

## Quick Start

### Before Running
The app now uses ES6 modules which require a web server. You **cannot** open `index.html` directly with `file://` protocol.

### Setup

**Option 1: Python**
```bash
cd radiofry
python -m http.server 8000
```
Open: `http://localhost:8000`

**Option 2: Node.js**
```bash
cd radiofry
npx serve
```
Open: `http://localhost:5000`

**Option 3: PHP**
```bash
cd radiofry
php -S localhost:8000
```
Open: `http://localhost:8000`

## What Changed

### File Changes

**index.html**
- ? Removed: ~500 lines of inline `<script>` code
- ? Added: `<script type="module" src="js/app.js"></script>`

**New Files**
```
js/
??? app.js              ? Main application
??? audioEngine.js      ? Audio processing
??? wavExporter.js      ? WAV export
??? bufferUtils.js      ? Utilities
??? visualizer.js       ? Canvas visualization
??? uiController.js     ? UI management
??? constants.js        ? Configuration
??? README.md           ? Documentation
```

## Developer Guide

### Importing Modules

```javascript
// In another module or script
import { AudioEngine } from './audioEngine.js';
import { REVERB_PRESETS } from './constants.js';

const engine = new AudioEngine();
```

### Adding New Effects

Create a new module:

```javascript
// js/myEffect.js
export class MyEffect {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    this.node = audioCtx.createGain();
  }
  
  apply(input, output) {
    input.connect(this.node);
    this.node.connect(output);
  }
}
```

Import in `app.js`:

```javascript
import { MyEffect } from './myEffect.js';
```

### Modifying Existing Features

**Example: Changing Distortion Amount**

Edit `js/audioEngine.js`:
```javascript
// Find the makeCurve function (line ~50)
makeCurve(amount = 75) {  // Change 75 to your value
  const n = 44100;
  // ...
}
```

**Example: Adding a New Preset**

Edit `js/constants.js`:
```javascript
export const PRESETS = {
  CHARRED: { ... },
  BAKED: { ... },
  FRIED: { ... },
  NUCLEAR: {  // New preset
    distortion: true,
    echo: true,
    crush: true,
    glitch: true,
    freq: 500,
    pitch: 0.8,
    vol: 1.2
  }
};
```

Then add button in `index.html`:
```html
<button class="btn bevel-out" data-preset="NUCLEAR">NUCLEAR</button>
```

## Deployment

### Production Build (Optional)

For production, you can bundle modules:

**Install Vite:**
```bash
npm init -y
npm install --save-dev vite
```

**Create vite.config.js:**
```javascript
export default {
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
}
```

**Build:**
```bash
npx vite build
```

### Static Hosting

Deploy the `dist` folder to:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

**Example: Netlify**
```bash
netlify deploy --prod --dir=dist
```

## Troubleshooting

### Module Not Found Error

? **Error:**
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/plain"
```

? **Solution:**
- Make sure you're using a web server, not `file://`
- Check that `.js` files are served with `Content-Type: text/javascript`

### CORS Error

? **Error:**
```
Access to script at 'file:///.../app.js' from origin 'null' has been blocked by CORS policy
```

? **Solution:**
- Use a web server (see Quick Start above)

### Module Import Error

? **Error:**
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

? **Solution:**
- Make sure `<script>` tag has `type="module"`
```html
<script type="module" src="js/app.js"></script>
```

### Visualizer Not Working

? **Problem:** Black canvas, no waveform

? **Solution:**
- Check browser console for errors
- Ensure audio is playing
- Try refreshing the page

## Testing

### Manual Testing Checklist

- [ ] Load a file - plays correctly
- [ ] Toggle each effect - audio changes
- [ ] Change reverb preset - reverb applies
- [ ] Record audio - recording works
- [ ] Export WAV - file downloads
- [ ] Share URL - copies to clipboard
- [ ] Load shared URL - restores state
- [ ] Reverse audio - plays backwards
- [ ] Use microphone - mic input works
- [ ] Switch skins - UI changes
- [ ] Mobile view - responsive layout

### Browser Testing

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Rollback Plan

If you need to revert to the old version:

1. **Backup the new files:**
```bash
mv js js_modules_backup
mv index.html index_modular.html
```

2. **Restore from git:**
```bash
git checkout HEAD~1 index.html
```

Or keep both versions:
- `index.html` - ES modules version
- `index_legacy.html` - Inline script version

## Performance Comparison

**Inline Script:**
- ? Works with `file://`
- ? Single file download
- ? No code splitting
- ? No browser caching of parts

**ES Modules:**
- ? Requires web server
- ? Modules cached separately
- ? Tree-shaking ready
- ? Better organization
- ? Easier debugging

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify you're using a web server
3. Check browser compatibility (needs ES6 modules)
4. Review js/README.md for module documentation
5. Check REFACTORING_COMPLETE.md for details

## Next Steps

1. **Run the app** on a local server
2. **Test all features** (see checklist above)
3. **Deploy** to your hosting platform
4. **Optional:** Set up a build system for production

Enjoy your modular RADIOFRY! ????
