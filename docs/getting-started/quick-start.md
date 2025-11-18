# Quick Start Guide

Get up and running with Leaflet-Geoman in just a few minutes.

## Installation

### NPM

```bash
npm install leaflet-geoman-extended leaflet
```

### CDN

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

## Basic Setup

### HTML

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Leaflet-Geoman Quick Start</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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

    <style>
      #map {
        height: 500px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>

    <!-- Leaflet JavaScript -->
    <script src="https://unpkg.com/leaflet@latest/dist/leaflet.js"></script>

    <!-- Leaflet-Geoman JavaScript -->
    <script src="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.js"></script>

    <script>
      // Your code here
    </script>
  </body>
</html>
```

### JavaScript

```javascript
// Initialize the map
const map = L.map('map').setView([51.505, -0.09], 13);

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Add Leaflet-Geoman controls
map.pm.addControls({
  position: 'topleft',
  drawCircle: true,
  drawMarker: true,
  drawPolygon: true,
  drawPolyline: true,
  drawRectangle: true,
  editMode: true,
  dragMode: true,
  cutPolygon: true,
  removalMode: true,
});
```

## Your First Shape

After adding the controls, you can immediately start drawing:

1. **Click the polygon tool** (square icon) in the toolbar
2. **Click on the map** to add vertices
3. **Double-click** to finish the polygon

## Adding Event Listeners

```javascript
// Listen for shape creation
map.on('pm:create', (e) => {
  console.log('Shape created:', e.shape);
  console.log('Layer:', e.layer);

  // You can access the created layer
  const layer = e.layer;

  // Add a popup to the shape
  layer.bindPopup(`You created a ${e.shape}!`).openPopup();
});

// Listen for shape editing
map.on('pm:edit', (e) => {
  console.log('Shape edited:', e.layer);
});

// Listen for shape removal
map.on('pm:remove', (e) => {
  console.log('Shape removed:', e.layer);
});
```

## Basic Configuration

```javascript
// Set default styles for new shapes
map.pm.setGlobalOptions({
  pathOptions: {
    color: '#ff0000', // Red stroke
    weight: 3, // 3px stroke width
    opacity: 0.8, // 80% stroke opacity
    fillColor: '#ff0000', // Red fill
    fillOpacity: 0.2, // 20% fill opacity
  },
});

// Enable measurements
map.pm.setGlobalOptions({
  measurements: {
    measurement: true, // Show measurements
    displayFormat: 'metric', // Use metric units
  },
});
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Leaflet-Geoman Example</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@latest/dist/leaflet.css"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.css"
    />
    <style>
      body {
        margin: 0;
        padding: 20px;
        font-family: Arial, sans-serif;
      }
      #map {
        height: 500px;
        border: 1px solid #ccc;
      }
      .info {
        margin-top: 10px;
        padding: 10px;
        background: #f0f0f0;
      }
    </style>
  </head>
  <body>
    <h1>My Leaflet-Geoman Map</h1>
    <div id="map"></div>
    <div class="info">
      <p>
        Use the toolbar on the left to draw shapes. Try drawing a polygon, then
        use edit mode to modify it!
      </p>
      <div id="output"></div>
    </div>

    <script src="https://unpkg.com/leaflet@latest/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.js"></script>

    <script>
      // Initialize map
      const map = L.map('map').setView([51.505, -0.09], 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

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

      // Configure options
      map.pm.setGlobalOptions({
        pathOptions: {
          color: '#3388ff',
          weight: 3,
          opacity: 0.8,
          fillColor: '#3388ff',
          fillOpacity: 0.2,
        },
        measurements: {
          measurement: true,
          displayFormat: 'metric',
        },
      });

      // Output element for logging
      const output = document.getElementById('output');

      function log(message) {
        output.innerHTML = message + '<br>' + output.innerHTML;
      }

      // Event handlers
      map.on('pm:create', (e) => {
        log(`✅ Created ${e.shape}`);

        // Add popup to new shape
        e.layer.bindPopup(`${e.shape} created!`);
      });

      map.on('pm:edit', (e) => {
        log(`✏️ Edited ${e.layer.pm._shape || 'shape'}`);
      });

      map.on('pm:remove', (e) => {
        log(`🗑️ Removed ${e.layer.pm._shape || 'shape'}`);
      });

      map.on('pm:drawstart', (e) => {
        log(`🎨 Started drawing ${e.shape}`);
      });

      map.on('pm:drawend', (e) => {
        log(`🏁 Finished drawing ${e.shape}`);
      });

      // Add a sample polygon to get started
      setTimeout(() => {
        const samplePolygon = L.polygon([
          [51.509, -0.08],
          [51.503, -0.06],
          [51.51, -0.047],
        ]).addTo(map);

        samplePolygon.bindPopup('Sample polygon - try editing me!');
        log('📍 Added sample polygon');
      }, 1000);
    </script>
  </body>
</html>
```

## Next Steps

Now that you have a basic setup working:

1. **Explore Drawing Tools** - Try all the different shape tools
2. **Learn Editing** - Use edit mode to modify shapes
3. **Add Measurements** - Enable the measurement system
4. **Customize Styles** - Change colors and appearance
5. **Handle Events** - Build interactive features

## Common Next Actions

- [Learn about all drawing tools](drawing-tools.md)
- [Explore editing features](editing-features.md)
- [Set up measurements](measurements.md)
- [Customize the appearance](styling.md)
- [Handle events for interactivity](events.md)

## Troubleshooting

**Controls not showing?**

- Make sure both CSS files are loaded
- Check browser console for errors
- Verify Leaflet is loaded before Leaflet-Geoman

**Can't draw shapes?**

- Click a drawing tool first
- Make sure the map is properly initialized
- Check that you're clicking on the map area

**Shapes look wrong?**

- Verify CSS is loaded correctly
- Check for CSS conflicts
- Try setting explicit styles

Need more help? Check the [troubleshooting guide](troubleshooting.md) or [browse all documentation](README.md).
