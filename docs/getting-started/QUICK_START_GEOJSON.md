# Quick Start: GeoJSON Import/Export

This guide will help you quickly get started with exporting and importing GeoJSON data in Leaflet-Geoman.

## Basic Export

Export all Geoman layers as GeoJSON:

```javascript
const geojson = map.pm.exportGeoJSON();
console.log(geojson);
```

## Export Only Drawn Layers

Export only layers that were drawn by users (excludes programmatically added layers):

```javascript
const geojson = map.pm.exportGeoJSON({ onlyDrawn: true });
```

## Basic Import

Import GeoJSON data and add it to the map:

```javascript
const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-0.08, 51.509],
            [-0.06, 51.503],
            [-0.047, 51.51],
            [-0.08, 51.509],
          ],
        ],
      },
    },
  ],
};

const layers = map.pm.importGeoJSON(geojson);
```

## Import with Options

### Clear Existing Layers

Replace all existing layers with imported ones:

```javascript
map.pm.importGeoJSON(geojson, {
  clearExisting: true,
});
```

### Custom Styling

Apply custom styles to imported layers:

```javascript
map.pm.importGeoJSON(geojson, {
  layerOptions: {
    color: 'red',
    fillColor: 'yellow',
    fillOpacity: 0.5,
    weight: 3,
  },
});
```

### Don't Mark as Drawn

Import layers without marking them as drawn by Geoman:

```javascript
map.pm.importGeoJSON(geojson, {
  markAsDrawn: false,
});
```

## Save to File

Export and download as a file:

```javascript
const geojson = map.pm.exportGeoJSON();
const dataStr = JSON.stringify(geojson, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'my-map.geojson';
link.click();
URL.revokeObjectURL(url);
```

## Load from File

Import from a file upload:

```html
<input type="file" id="geojson-file" accept=".geojson,.json" />
```

```javascript
document.getElementById('geojson-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const geojson = JSON.parse(event.target.result);
      map.pm.importGeoJSON(geojson, {
        clearExisting: true,
      });
      alert('GeoJSON loaded successfully!');
    } catch (error) {
      alert('Error loading GeoJSON: ' + error.message);
    }
  };

  reader.readAsText(file);
});
```

## Save to LocalStorage

Persist map state across sessions:

```javascript
// Save
const geojson = map.pm.exportGeoJSON({ onlyDrawn: true });
localStorage.setItem('savedMap', JSON.stringify(geojson));

// Load
const savedGeojson = localStorage.getItem('savedMap');
if (savedGeojson) {
  map.pm.importGeoJSON(JSON.parse(savedGeojson), {
    clearExisting: true,
  });
}
```

## Events

Listen to export/import events:

```javascript
// Export event
map.on('pm:export', (e) => {
  console.log('Exported:', e.geojson);
  console.log('Number of layers:', e.layers.length);
});

// Import event
map.on('pm:import', (e) => {
  console.log('Imported:', e.geojson);
  console.log('Number of layers:', e.layers.length);
  console.log('Cleared existing:', e.clearExisting);
});
```

## Complete Example

```javascript
// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Add Geoman controls
map.pm.addControls();

// Export button
document.getElementById('export-btn').addEventListener('click', () => {
  const geojson = map.pm.exportGeoJSON({ onlyDrawn: true });
  document.getElementById('geojson-textarea').value = JSON.stringify(
    geojson,
    null,
    2
  );
});

// Import button
document.getElementById('import-btn').addEventListener('click', () => {
  try {
    const geojsonText = document.getElementById('geojson-textarea').value;
    const geojson = JSON.parse(geojsonText);
    map.pm.importGeoJSON(geojson, {
      clearExisting: false,
      markAsDrawn: true,
    });
    alert('Import successful!');
  } catch (error) {
    alert('Import failed: ' + error.message);
  }
});
```

## Next Steps

- See [Full Documentation](../GEOJSON_IMPORT_EXPORT.md) for advanced usage
- Check out the [Demo](../../demo/geojson-import-export-demo.html) for a working example
- Learn about [API Reference](../api/) for all available options
