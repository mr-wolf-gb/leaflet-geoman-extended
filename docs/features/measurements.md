# Measurement System

Leaflet-Geoman includes a comprehensive measurement system that provides real-time area, perimeter, and distance calculations for all geometric shapes.

## Overview

The measurement system automatically calculates and displays:

- **Area** for polygons and circles
- **Perimeter** for polygons
- **Distance** for polylines
- **Radius** for circles
- **Segment lengths** for all multi-point shapes

## Enabling Measurements

### Global Configuration

```javascript
map.pm.setGlobalOptions({
  measurements: {
    measurement: true, // Enable measurements
    showSegmentLength: true, // Show individual segment lengths
    displayFormat: 'metric', // 'metric' or 'imperial'
    precision: 2, // Decimal places
    showBearing: true, // Show bearing for lines
    showArea: true, // Show area for polygons
    showPerimeter: true, // Show perimeter
    showRadius: true, // Show radius for circles
  },
});
```

### Per-Layer Configuration

```javascript
// Enable measurements for specific layer
layer.pm.enableMeasurements();

// Disable measurements for specific layer
layer.pm.disableMeasurements();

// Check if measurements are enabled
if (layer.pm.measurementsEnabled()) {
  console.log('Measurements are active');
}
```

## Measurement Units

### Metric System

- **Length**: meters (m), kilometers (km)
- **Area**: square meters (m²), square kilometers (km²)

### Imperial System

- **Length**: feet (ft), miles (mi)
- **Area**: square feet (ft²), square miles (mi²)

### Custom Unit Configuration

```javascript
map.pm.setGlobalOptions({
  measurements: {
    displayFormat: 'metric',
    unitFormat: {
      metric: {
        area: ['m²', 'km²', 'ha'], // hectares
        length: ['m', 'km'],
      },
      imperial: {
        area: ['ft²', 'ac', 'mi²'], // acres
        length: ['ft', 'yd', 'mi'], // yards
      },
    },
  },
});
```

## Accessing Measurements

### Getting Measurements Programmatically

```javascript
// Create a polygon
const polygon = L.polygon([
  [51.509, -0.08],
  [51.503, -0.06],
  [51.51, -0.047],
]).addTo(map);

// Get measurements
const measurements = polygon.pm.measurements;
console.log('Area:', measurements.area);
console.log('Perimeter:', measurements.perimeter);

// For circles
const circle = L.circle([51.508, -0.11], { radius: 200 }).addTo(map);
console.log('Circle area:', circle.pm.measurements.area);
console.log('Circle radius:', circle.pm.measurements.radius);

// For polylines
const line = L.polyline([
  [51.5, -0.1],
  [51.495, -0.083],
]).addTo(map);
console.log('Line distance:', line.pm.measurements.distance);
```

### Measurement Object Structure

```javascript
const measurements = {
  area: 12345.67, // Area in square meters
  perimeter: 456.78, // Perimeter in meters
  distance: 123.45, // Distance in meters (for lines)
  radius: 200, // Radius in meters (for circles)
  segmentLengths: [
    // Individual segment lengths
    100.5, 150.3, 206.0,
  ],
};
```

## Measurement Display

### Label Styling

```javascript
map.pm.setGlobalOptions({
  measurements: {
    labelStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#3388ff',
      borderWidth: 2,
      borderRadius: 4,
      color: '#333333',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      padding: '4px 8px',
    },
  },
});
```

### Custom Label Formatting

```javascript
map.pm.setGlobalOptions({
  measurements: {
    formatArea: function (area) {
      if (area < 10000) {
        return area.toFixed(0) + ' m²';
      } else {
        return (area / 1000000).toFixed(2) + ' km²';
      }
    },
    formatLength: function (length) {
      if (length < 1000) {
        return length.toFixed(0) + ' m';
      } else {
        return (length / 1000).toFixed(2) + ' km';
      }
    },
  },
});
```

### Label Position

```javascript
map.pm.setGlobalOptions({
  measurements: {
    labelPosition: 'center', // 'center', 'centroid', 'auto'
    segmentLabelPosition: 'middle', // 'middle', 'start', 'end'
  },
});
```

## Real-time Updates

Measurements automatically update when shapes are edited:

```javascript
// Listen for measurement updates
map.on('pm:edit', (e) => {
  const layer = e.layer;
  const measurements = layer.pm.measurements;

  console.log('Updated measurements:', measurements);

  // Update UI with new measurements
  updateMeasurementDisplay(measurements);
});

function updateMeasurementDisplay(measurements) {
  document.getElementById('area').textContent = measurements.area + ' m²';
  document.getElementById('perimeter').textContent =
    measurements.perimeter + ' m';
}
```

## Advanced Features

### Bearing Calculations

```javascript
map.pm.setGlobalOptions({
  measurements: {
    showBearing: true,
    bearingFormat: 'degrees', // 'degrees', 'radians', 'compass'
  },
});

// Access bearing for line segments
const line = L.polyline([
  [51.5, -0.1],
  [51.495, -0.083],
]).addTo(map);
const bearing = line.pm.getBearing(); // Returns bearing in degrees
```

### Geodesic Calculations

```javascript
// Enable geodesic calculations for accurate measurements
map.pm.setGlobalOptions({
  measurements: {
    geodesic: true, // Use geodesic calculations (more accurate for large areas)
    ellipsoid: 'WGS84', // Earth ellipsoid model
  },
});
```

### Custom Measurement Functions

```javascript
// Add custom measurement calculations
L.PM.Utils.customMeasurement = function (layer) {
  // Custom calculation logic
  const bounds = layer.getBounds();
  const diagonal = bounds.getNorthEast().distanceTo(bounds.getSouthWest());
  return diagonal;
};

// Use in measurement display
map.on('pm:create', (e) => {
  if (e.shape === 'Rectangle') {
    const diagonal = L.PM.Utils.customMeasurement(e.layer);
    console.log('Rectangle diagonal:', diagonal + ' m');
  }
});
```

## Measurement Events

### Listening for Measurement Changes

```javascript
// Measurement calculated
map.on('pm:measurementcalculated', (e) => {
  console.log('Measurements calculated:', e.measurements);
  console.log('Layer:', e.layer);
});

// Measurement display updated
map.on('pm:measurementdisplayed', (e) => {
  console.log('Measurement labels updated');
});
```

## Integration Examples

### Display Panel

```javascript
// Create measurement display panel
function createMeasurementPanel() {
  const panel = L.control({ position: 'topright' });

  panel.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'measurement-panel');
    div.innerHTML = `
      <h4>Measurements</h4>
      <div id="current-measurements">
        Select a shape to see measurements
      </div>
    `;
    return div;
  };

  return panel;
}

// Add panel to map
const measurementPanel = createMeasurementPanel().addTo(map);

// Update panel when shapes are selected
map.on('pm:edit', (e) => {
  const measurements = e.layer.pm.measurements;
  const display = document.getElementById('current-measurements');

  let html = '';
  if (measurements.area) {
    html += `<div>Area: ${measurements.area.toFixed(2)} m²</div>`;
  }
  if (measurements.perimeter) {
    html += `<div>Perimeter: ${measurements.perimeter.toFixed(2)} m</div>`;
  }
  if (measurements.distance) {
    html += `<div>Distance: ${measurements.distance.toFixed(2)} m</div>`;
  }

  display.innerHTML = html;
});
```

### Export Measurements

```javascript
// Export all measurements to JSON
function exportMeasurements() {
  const layers = map.pm.getGeomanLayers();
  const measurements = {};

  layers.forEach((layer, index) => {
    measurements[`layer_${index}`] = {
      type: layer.pm._shape,
      measurements: layer.pm.measurements,
      coordinates: layer.getLatLngs ? layer.getLatLngs() : layer.getLatLng(),
    };
  });

  return JSON.stringify(measurements, null, 2);
}

// Export to CSV
function exportMeasurementsCSV() {
  const layers = map.pm.getGeomanLayers();
  let csv = 'Type,Area,Perimeter,Distance,Radius\n';

  layers.forEach((layer) => {
    const m = layer.pm.measurements;
    csv += `${layer.pm._shape},${m.area || ''},${m.perimeter || ''},${m.distance || ''},${m.radius || ''}\n`;
  });

  return csv;
}
```

## Styling Examples

### Custom CSS

```css
/* Measurement labels */
.geoman-measurement-label {
  background: rgba(255, 255, 255, 0.95) !important;
  border: 2px solid #3388ff !important;
  border-radius: 6px !important;
  color: #333 !important;
  font-size: 12px !important;
  font-weight: bold !important;
  padding: 4px 8px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

/* Segment length labels */
.geoman-segment-label {
  background: rgba(255, 255, 0, 0.9) !important;
  border: 1px solid #ff8800 !important;
  font-size: 10px !important;
}

/* Area labels */
.geoman-area-label {
  background: rgba(0, 255, 0, 0.1) !important;
  border: 2px dashed #00aa00 !important;
  font-size: 14px !important;
  font-weight: bold !important;
}
```

### Dynamic Styling

```javascript
// Style labels based on measurement values
map.on('pm:measurementcalculated', (e) => {
  const measurements = e.measurements;
  const layer = e.layer;

  // Color code based on area size
  if (measurements.area) {
    let color = '#3388ff';
    if (measurements.area > 100000) {
      color = '#ff0000'; // Large areas in red
    } else if (measurements.area > 10000) {
      color = '#ff8800'; // Medium areas in orange
    }

    layer.setStyle({ color: color });
  }
});
```

## Performance Considerations

### Optimization Tips

```javascript
// Disable measurements for performance-critical applications
map.pm.setGlobalOptions({
  measurements: {
    measurement: false, // Disable if not needed
  },
});

// Throttle measurement updates
let measurementTimeout;
map.on('pm:edit', (e) => {
  clearTimeout(measurementTimeout);
  measurementTimeout = setTimeout(() => {
    updateMeasurements(e.layer);
  }, 100); // Update every 100ms instead of real-time
});

// Simplify complex polygons for measurement
map.pm.setGlobalOptions({
  measurements: {
    simplifyTolerance: 0.001, // Simplify for performance
  },
});
```

## Troubleshooting

### Common Issues

**Measurements not showing:**

```javascript
// Ensure measurements are enabled
map.pm.setGlobalOptions({
  measurements: { measurement: true },
});
```

**Incorrect calculations:**

```javascript
// Check coordinate system and projection
// Ensure geodesic calculations for large areas
map.pm.setGlobalOptions({
  measurements: { geodesic: true },
});
```

**Labels overlapping:**

```javascript
// Adjust label positioning
map.pm.setGlobalOptions({
  measurements: {
    labelPosition: 'auto', // Automatic positioning
    avoidOverlap: true,
  },
});
```

**Performance issues:**

```javascript
// Reduce measurement frequency
map.pm.setGlobalOptions({
  measurements: {
    updateInterval: 500, // Update every 500ms
    showSegmentLength: false, // Disable segment labels
  },
});
```

For more help, see the [troubleshooting guide](troubleshooting.md).
