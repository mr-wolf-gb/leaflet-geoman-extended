# Installation

Learn how to install Leaflet-Geoman in your project.

## NPM Installation

### Install via NPM

```bash
npm install leaflet-geoman-extended leaflet
```

### Import in Your Project

```javascript
import L from 'leaflet';
import 'leaflet-geoman-extended';
import 'leaflet-geoman-extended/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';
```

## CDN Installation

### Using unpkg

```html
<!-- Leaflet CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@latest/dist/leaflet.css"
/>

<!-- Leaflet-Geoman CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.css"
/>

<!-- Leaflet JavaScript -->
<script src="https://unpkg.com/leaflet@latest/dist/leaflet.js"></script>

<!-- Leaflet-Geoman JavaScript -->
<script src="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.js"></script>
```

### Using jsDelivr

```html
<!-- Leaflet CSS -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/leaflet@latest/dist/leaflet.css"
/>

<!-- Leaflet-Geoman CSS -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/leaflet-geoman-extended@latest/dist/leaflet-geoman.css"
/>

<!-- Leaflet JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/leaflet@latest/dist/leaflet.js"></script>

<!-- Leaflet-Geoman JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/leaflet-geoman-extended@latest/dist/leaflet-geoman.js"></script>
```

## Version Pinning

For production, it's recommended to pin to a specific version:

```html
<!-- Pin to version 2.18.0 -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet-geoman-extended@2.18.3/dist/leaflet-geoman.css"
/>
<script src="https://unpkg.com/leaflet-geoman-extended@2.18.3/dist/leaflet-geoman.js"></script>
```

## Requirements

- **Leaflet**: ^1.2.0 or higher
- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **Node.js**: 14+ (for NPM installation)

## Verification

After installation, verify it's working:

```javascript
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// This should work without errors
map.pm.addControls();

console.log('Leaflet-Geoman version:', L.PM.version);
```

## Next Steps

- [Quick Start Guide](quick-start.md) - Get started with basic usage
- [Basic Concepts](basic-concepts.md) - Learn core concepts
- [Drawing Tools](../features/drawing-tools.md) - Explore drawing tools
