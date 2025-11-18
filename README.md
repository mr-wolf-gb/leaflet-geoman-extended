# Leaflet-Geoman-Extended

<p align="center">  
  <strong>Extended Version of Leaflet-Geoman</strong><br>  
  Complete Geometry Editing Plugin for Leaflet Maps<br>  
  Draw, Edit, Drag, Cut, Rotate, Split, Scale, Measure, Snap and Pin Layers<br>  
  Supports All Geometry Types with Advanced Features
</p>

<p align="center">  
  <a href="https://badge.fury.io/js/leaflet-geoman-extended">  
    <img src="https://badge.fury.io/js/leaflet-geoman-extended.svg" alt="npm version" height="18">  
  </a>  
  <a href="https://www.npmjs.com/package/leaflet-geoman-extended">  
    <img src="https://img.shields.io/npm/dt/leaflet-geoman-extended.svg" alt="NPM Downloads" />  
  </a>  
</p>

## 📢 About This Project

This is an extended version of the original [Leaflet-Geoman](https://github.com/geoman-io/leaflet-geoman) project by [Geoman.io](https://geoman.io). This fork includes additional features, improvements, and bug fixes while maintaining full compatibility with the original API.

**Original Project:** https://github.com/geoman-io/leaflet-geoman  
**Original Authors:** Geoman.io team  
**License:** MIT

All credit for the core functionality goes to the original Leaflet-Geoman team. This extended version builds upon their excellent work.

## 🚀 Quick Start

### Installation

```bash
npm install leaflet-geoman-extended
```

### CDN

```html
<!-- CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.css"
/>

<!-- JavaScript -->
<script src="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.js"></script>
```

### Basic Usage

```javascript
// Initialize your Leaflet map
const map = L.map('map').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Add Leaflet-Geoman controls
map.pm.addControls({
  position: 'topleft',
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  drawRectangle: true,
  drawMarker: true,
  editMode: true,
  dragMode: true,
  cutPolygon: true,
  removalMode: true,
});
```

## ✨ Features

### Drawing Tools

- **Basic Shapes**: Polygon, Polyline, Circle, Rectangle, Marker, CircleMarker
- **Advanced Shapes**: Arrow, Text, Freehand, Distance Line, Dangerous Goods Zones
- **Circle Variations**: 2-Point Circle, 3-Point Circle

### Editing & Manipulation

- **Edit Mode**: Modify vertices and shape properties
- **Drag Mode**: Move entire shapes
- **Rotate Mode**: Rotate shapes around center point
- **Scale Mode**: Resize shapes proportionally
- **Cut Tool**: Split polygons and lines
- **Copy/Paste**: Duplicate shapes with styling

### Measurements

- Real-time area, perimeter, and distance calculations
- Multiple units: Metric (m, km) and Imperial (ft, mi)
- Live updates during editing
- Customizable display formats

### User Experience

- **Keyboard Shortcuts**: ESC, ENTER, BACKSPACE, CTRL+Z for efficient drawing
- **Context Menus**: Right-click actions for quick operations
- **Style Editor**: Visual interface for customizing appearance
- **Snapping**: Snap to vertices and edges for precision

### Internationalization

- RTL support for Arabic, Hebrew, and other right-to-left languages
- Multi-language UI with custom translations
- Locale-aware number formatting

## 📖 Documentation

- **[Complete Documentation](docs/)** - Full documentation with guides and API reference
- **[Quick Start Guide](docs/getting-started/quick-start.md)** - Get up and running in minutes
- **[Drawing Tools](docs/features/drawing-tools.md)** - All available drawing tools
- **[Keyboard Shortcuts](docs/features/keyboard-shortcuts.md)** - Productivity shortcuts
- **[Advanced Features](docs/features/advanced-features.md)** - Cut mode, distance lines, and more
- **[Integration Guides](docs/guides/)** - React, Vue, and framework integration

## 🎯 Supported Geometries

| Geometry     | Draw | Edit | Measurements        | Special Features        |
| ------------ | ---- | ---- | ------------------- | ----------------------- |
| Polygon      | ✅   | ✅   | Area, Perimeter     | Cut, Hole creation      |
| Polyline     | ✅   | ✅   | Distance            | Split at intersections  |
| Circle       | ✅   | ✅   | Area, Circumference | Multiple creation modes |
| Rectangle    | ✅   | ✅   | Area, Perimeter     | Corner and edge editing |
| Marker       | ✅   | ✅   | -                   | Custom icons, popups    |
| CircleMarker | ✅   | ✅   | -                   | Fixed pixel radius      |
| Arrow        | ✅   | ✅   | Length              | Customizable arrowheads |
| Text         | ✅   | ✅   | -                   | Rich text, HTML support |

## 🎨 Configuration

### Global Options

```javascript
map.pm.setGlobalOptions({
  // Default styling
  pathOptions: {
    color: '#3388ff',
    weight: 3,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.2,
  },

  // Measurements
  measurements: {
    measurement: true,
    showSegmentLength: true,
    displayFormat: 'metric',
    precision: 2,
  },

  // Snapping
  snappable: true,
  snapDistance: 20,

  // Keyboard shortcuts
  keyboardShortcuts: true,
});
```

### GeoJSON Import/Export

```javascript
// Export all layers as GeoJSON
const geojson = map.pm.exportGeoJSON();
console.log(geojson);

// Export only layers drawn by Geoman
const drawnGeojson = map.pm.exportGeoJSON({ onlyDrawn: true });

// Import GeoJSON
const layers = map.pm.importGeoJSON(geojson, {
  clearExisting: false,
  markAsDrawn: true,
  layerOptions: {
    color: 'red',
    fillColor: 'yellow',
  },
});

// Save to file
const dataStr = JSON.stringify(geojson, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'map-layers.geojson';
link.click();
```

### Event Handling

```javascript
// Shape creation
map.on('pm:create', (e) => {
  console.log('Shape created:', e.shape, e.layer);
});

// Shape editing
map.on('pm:edit', (e) => {
  console.log('Shape edited:', e.layer);
});

// Shape removal
map.on('pm:remove', (e) => {
  console.log('Shape removed:', e.layer);
});

// Cut operation
map.on('pm:cut', (e) => {
  console.log('Shape cut:', e.originalLayer, e.layer);
});

// Export/Import events
map.on('pm:export', (e) => {
  console.log('Exported GeoJSON:', e.geojson, e.layers);
});

map.on('pm:import', (e) => {
  console.log('Imported GeoJSON:', e.geojson, e.layers);
});
```

## 🔌 Framework Integration

### React

```jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-geoman-extended';
import 'leaflet-geoman-extended/dist/leaflet-geoman.css';

function MapComponent() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([51.505, -0.09], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
        map
      );
      map.pm.addControls();
      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div id="map" style={{ height: '400px' }} />;
}
```

### Vue

```vue
<template>
  <div id="map" style="height: 400px;"></div>
</template>

<script>
import L from 'leaflet';
import 'leaflet-geoman-extended';
import 'leaflet-geoman-extended/dist/leaflet-geoman.css';

export default {
  name: 'MapComponent',
  mounted() {
    this.map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map
    );
    this.map.pm.addControls();
  },
  beforeDestroy() {
    if (this.map) {
      this.map.remove();
    }
  },
};
</script>
```

## 🔧 API Reference

### Map Methods

```javascript
map.pm.addControls(options); // Add toolbar controls
map.pm.removeControls(); // Remove all controls
map.pm.setGlobalOptions(options); // Set global options
map.pm.enableDraw(shape, options); // Enable drawing mode
map.pm.disableDraw(); // Disable drawing mode
map.pm.getGeomanLayers(); // Get all Geoman layers
map.pm.enableKeyboardShortcuts(); // Enable keyboard shortcuts
map.pm.disableKeyboardShortcuts(); // Disable keyboard shortcuts
map.pm.exportGeoJSON(options); // Export layers as GeoJSON
map.pm.importGeoJSON(geojson, options); // Import GeoJSON layers
```

### Layer Methods

```javascript
layer.pm.enable(); // Enable editing
layer.pm.disable(); // Disable editing
layer.pm.toggleEdit(); // Toggle edit mode
layer.pm.hasSelfIntersection(); // Check for self-intersections
layer.pm.remove(); // Remove layer
layer.pm.copy(); // Copy layer
layer.pm.cut(cutLayer); // Cut layer
```

## 🎬 Demo

Check out the [interactive demo](demo/index.html) with examples of all features.

## 🐛 Troubleshooting

**Toolbar not showing?**

- Ensure CSS is loaded: `import 'leaflet-geoman-extended/dist/leaflet-geoman.css'`
- Check if controls are added: `map.pm.addControls()`

**Shapes not editable?**

- Enable edit mode: `map.pm.enableGlobalEditMode()` or `layer.pm.enable()`

**Events not firing?**

- Ensure event listeners are added after map initialization
- Use `map.whenReady()` if needed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

This project is based on [Leaflet-Geoman](https://github.com/geoman-io/leaflet-geoman) which is also licensed under MIT.

## 📞 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/mr-wolf-gb/leaflet-geoman-extended/issues)
- 🌐 [Original Project](https://github.com/geoman-io/leaflet-geoman)
- 🌐 [Original Website](https://geoman.io)

## 🙏 Acknowledgments

- **[Leaflet-Geoman](https://github.com/geoman-io/leaflet-geoman)** - The original project this is based on
- **[Geoman.io](https://geoman.io)** - Original authors and maintainers
- **[Leaflet](https://leafletjs.com/)** - The amazing mapping library
- All contributors and users who make this project possible

---

Extended by mr-wolf-gb | Based on Leaflet-Geoman by Geoman.io
