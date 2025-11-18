# Basic Concepts

Understanding the core concepts of Leaflet-Geoman will help you use it effectively.

## The PM Property

Leaflet-Geoman extends Leaflet by adding a `pm` property to maps and layers:

```javascript
// Map-level PM
map.pm.addControls();
map.pm.setGlobalOptions({});
map.pm.enableDraw('Polygon');

// Layer-level PM
layer.pm.enable();
layer.pm.disable();
layer.pm.toggleEdit();
```

## Drawing vs Editing

### Drawing Mode

Drawing mode creates new shapes:

```javascript
// Enable drawing mode for a specific shape
map.pm.enableDraw('Polygon');

// Disable drawing mode
map.pm.disableDraw();

// Check if drawing is active
if (map.pm.globalDrawModeEnabled()) {
  console.log('Drawing is active');
}
```

### Edit Mode

Edit mode modifies existing shapes:

```javascript
// Enable edit mode globally (all layers)
map.pm.enableGlobalEditMode();

// Enable edit mode for specific layer
layer.pm.enable();

// Disable edit mode
map.pm.disableGlobalEditMode();
layer.pm.disable();
```

## Shapes and Layers

Leaflet-Geoman works with standard Leaflet layers:

```javascript
// Create a polygon
const polygon = L.polygon([
  [51.509, -0.08],
  [51.503, -0.06],
  [51.51, -0.047],
]).addTo(map);

// The layer automatically has PM functionality
polygon.pm.enable(); // Can edit
polygon.pm.enableRotate(); // Can rotate
```

### Supported Layer Types

- `L.Polygon` - Polygons
- `L.Polyline` - Lines
- `L.Circle` - Circles
- `L.Rectangle` - Rectangles
- `L.Marker` - Point markers
- `L.CircleMarker` - Circle markers
- `L.LayerGroup` - Groups of layers
- `L.ImageOverlay` - Images

## Events

Leaflet-Geoman uses Leaflet's event system:

```javascript
// Listen for shape creation
map.on('pm:create', (e) => {
  console.log('Created:', e.shape, e.layer);
});

// Listen for editing
map.on('pm:edit', (e) => {
  console.log('Edited:', e.layer);
});

// Listen for removal
map.on('pm:remove', (e) => {
  console.log('Removed:', e.layer);
});
```

### Event Bubbling

Events bubble from layers to the map:

```javascript
// Layer-level event
layer.on('pm:edit', (e) => {
  console.log('This layer was edited');
});

// Map-level event (catches all layers)
map.on('pm:edit', (e) => {
  console.log('Any layer was edited');
});
```

## Options

### Global Options

Apply to all shapes:

```javascript
map.pm.setGlobalOptions({
  pathOptions: {
    color: '#ff0000',
    weight: 3,
  },
  snappable: true,
  snapDistance: 20,
});
```

### Per-Shape Options

Apply to specific shapes:

```javascript
map.pm.enableDraw('Polygon', {
  snappable: false,
  pathOptions: {
    color: '#00ff00',
  },
});
```

### Layer Options

Apply to individual layers:

```javascript
layer.setStyle({
  color: '#0000ff',
  weight: 5,
});
```

## Toolbar

The toolbar provides UI controls:

```javascript
// Add toolbar
map.pm.addControls({
  position: 'topleft',
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  editMode: true,
  dragMode: true,
  cutPolygon: true,
  removalMode: true,
});

// Remove toolbar
map.pm.removeControls();

// Toggle toolbar
map.pm.toggleControls();
```

## Snapping

Snapping helps align shapes precisely:

```javascript
map.pm.setGlobalOptions({
  snappable: true, // Enable snapping
  snapDistance: 20, // Snap within 20 pixels
  snapMiddle: true, // Snap to segment midpoints
  snapSegment: true, // Snap to segments
});
```

## Measurements

Measurements are calculated automatically:

```javascript
// Enable measurements
map.pm.setGlobalOptions({
  measurements: {
    measurement: true,
    showSegmentLength: true,
    displayFormat: 'metric',
  },
});

// Access measurements
const measurements = layer.pm.measurements;
console.log('Area:', measurements.area);
console.log('Perimeter:', measurements.perimeter);
```

## Context Menus

Right-click menus for quick actions:

```javascript
// Enable context menus
map.pm.setGlobalOptions({
  contextMenu: true,
});

// Context menus appear on right-click
// Provide options like: Edit, Delete, Copy, etc.
```

## Keyboard Shortcuts

Keyboard shortcuts are enabled by default:

- **ESC**: Finish/cancel drawing or exit mode
- **ENTER**: Finish drawing
- **BACKSPACE**: Remove last vertex
- **CTRL+Z**: Undo last vertex

```javascript
// Disable shortcuts
map.pm.disableKeyboardShortcuts();

// Enable shortcuts
map.pm.enableKeyboardShortcuts();
```

## Best Practices

### 1. Initialize After Map is Ready

```javascript
map.whenReady(() => {
  map.pm.addControls();
});
```

### 2. Clean Up Event Listeners

```javascript
// Add listener
const handler = (e) => console.log(e);
map.on('pm:create', handler);

// Remove when done
map.off('pm:create', handler);
```

### 3. Use Global Options for Consistency

```javascript
// Set once, applies to all shapes
map.pm.setGlobalOptions({
  pathOptions: {
    color: '#3388ff',
    weight: 3,
  },
});
```

### 4. Check Layer Type Before Operations

```javascript
map.on('pm:create', (e) => {
  if (e.layer instanceof L.Polygon) {
    console.log('Area:', e.layer.pm.measurements.area);
  }
});
```

## Common Patterns

### Creating and Editing Workflow

```javascript
// 1. User draws shape
map.pm.enableDraw('Polygon');

// 2. Shape is created
map.on('pm:create', (e) => {
  const layer = e.layer;

  // 3. Automatically enable editing
  layer.pm.enable();

  // 4. Save when editing is done
  layer.on('pm:edit', () => {
    saveToDatabase(layer.toGeoJSON());
  });
});
```

### Loading Existing Shapes

```javascript
// Load GeoJSON data
const geojsonLayer = L.geoJSON(geojsonData, {
  onEachFeature: (feature, layer) => {
    // PM is automatically available
    layer.pm.enable();

    // Add event listeners
    layer.on('pm:edit', () => {
      console.log('Layer edited');
    });
  },
}).addTo(map);
```

### Validation

```javascript
map.on('pm:create', (e) => {
  const layer = e.layer;

  // Check for self-intersection
  if (layer.pm.hasSelfIntersection()) {
    alert('Shape has self-intersection!');
    layer.remove();
    return;
  }

  // Check minimum area
  if (layer.pm.measurements.area < 100) {
    alert('Shape is too small!');
    layer.remove();
    return;
  }

  // Valid shape
  console.log('Shape is valid');
});
```

## Next Steps

- [Drawing Tools](../features/drawing-tools.md) - Learn about all drawing tools
- [Editing Features](../features/editing.md) - Explore editing capabilities
- [Events API](../api/events.md) - Complete event reference
- [Options Reference](../api/options.md) - All configuration options
