# Drawing Tools

Leaflet-Geoman provides a comprehensive set of drawing tools for creating various geometric shapes on your map.

## Basic Drawing Tools

### Polygon

Draw closed polygons by clicking to add vertices.

```javascript
// Enable polygon drawing
map.pm.enableDraw('Polygon');

// Configure polygon options
map.pm.setGlobalOptions({
  pathOptions: {
    Polygon: {
      color: '#ff0000',
      fillColor: '#ff0000',
      fillOpacity: 0.3,
    },
  },
});
```

**Usage:**

1. Click the polygon tool
2. Click on the map to add vertices
3. Double-click or press Enter to finish

### Polyline

Create lines and paths by clicking to add points.

```javascript
// Enable polyline drawing
map.pm.enableDraw('Line');

// Configure line options
map.pm.setGlobalOptions({
  pathOptions: {
    Line: {
      color: '#00ff00',
      weight: 4,
    },
  },
});
```

**Usage:**

1. Click the line tool
2. Click to add points along the path
3. Double-click to finish

### Circle

Draw circles by clicking the center and dragging to set radius.

```javascript
// Enable circle drawing
map.pm.enableDraw('Circle');

// Configure circle options
map.pm.setGlobalOptions({
  pathOptions: {
    Circle: {
      color: '#0000ff',
      fillColor: '#0000ff',
      fillOpacity: 0.2,
    },
  },
});
```

**Usage:**

1. Click the circle tool
2. Click and drag from center to edge
3. Release to set the radius

### Rectangle

Create rectangles by clicking and dragging.

```javascript
// Enable rectangle drawing
map.pm.enableDraw('Rectangle');
```

**Usage:**

1. Click the rectangle tool
2. Click and drag from one corner to opposite
3. Release to create rectangle

### Marker

Place point markers on the map.

```javascript
// Enable marker drawing
map.pm.enableDraw('Marker');

// Configure marker options
map.pm.setGlobalOptions({
  markerStyle: {
    draggable: true,
    icon: L.icon({
      iconUrl: 'custom-marker.png',
      iconSize: [25, 41],
    }),
  },
});
```

**Usage:**

1. Click the marker tool
2. Click on the map to place marker

### Circle Marker

Small circular markers with fixed pixel size.

```javascript
// Enable circle marker drawing
map.pm.enableDraw('CircleMarker');

// Configure circle marker options
map.pm.setGlobalOptions({
  pathOptions: {
    CircleMarker: {
      radius: 8,
      color: '#ff0000',
      fillColor: '#ff0000',
    },
  },
});
```

## Advanced Drawing Tools

### Arrow

Create directional arrows with customizable heads.

```javascript
// Enable arrow drawing
map.pm.enableDraw('Arrow');

// Configure arrow options
map.pm.setGlobalOptions({
  pathOptions: {
    Arrow: {
      color: '#ff8800',
      weight: 4,
      arrowheadLength: 15,
      arrowheadAngle: 30,
    },
  },
});
```

**Usage:**

1. Click the arrow tool
2. Click start point
3. Click end point to create arrow

### Text

Add text labels with rich formatting.

```javascript
// Enable text drawing
map.pm.enableDraw('Text');

// Configure text options
map.pm.setGlobalOptions({
  textOptions: {
    fontSize: 16,
    fontColor: '#000000',
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
  },
});
```

**Usage:**

1. Click the text tool
2. Click on map to place text
3. Enter text in the modal dialog

### Freehand

Draw smooth, organic shapes by dragging.

```javascript
// Enable freehand drawing
map.pm.enableDraw('Freehand');

// Configure freehand options
map.pm.setGlobalOptions({
  freehand: {
    smoothFactor: 10,
    simplifyTolerance: 0.0001,
  },
});
```

**Usage:**

1. Click the freehand tool
2. Click and drag to draw
3. Release to finish shape

### Distance Line

Create lines with predefined segment distances.

```javascript
// Enable distance line drawing
map.pm.enableDraw('DistanceLine');

// Configure distance options
map.pm.setGlobalOptions({
  distanceLine: {
    distances: ['1km', '500m', '2km'],
    showLabels: true,
  },
});
```

**Usage:**

1. Click the distance line tool
2. Enter distances in the modal
3. Click points to create segments

### Dangerous Goods Zones

Create multi-circle hazard areas.

```javascript
// Enable dangerous goods zones
map.pm.enableDraw('DangerousGoodsZones');

// Configure zone options
map.pm.setGlobalOptions({
  dangerousGoodsZones: {
    zones: [
      { radius: 100, label: 'Danger', color: '#ff0000' },
      { radius: 200, label: 'Warning', color: '#ff8800' },
      { radius: 300, label: 'Safety', color: '#ffff00' },
    ],
  },
});
```

### Circle Variations

#### 2-Point Circle

Create circle by defining diameter endpoints.

```javascript
// Enable 2-point circle
map.pm.enableDraw('Circle2Points');
```

**Usage:**

1. Click first point (diameter start)
2. Click second point (diameter end)

#### 3-Point Circle

Create circle passing through three points.

```javascript
// Enable 3-point circle
map.pm.enableDraw('Circle3Points');
```

**Usage:**

1. Click first point on circumference
2. Click second point on circumference
3. Click third point to complete circle

## Tool Configuration

### Adding Controls

```javascript
map.pm.addControls({
  position: 'topleft',

  // Basic tools
  drawPolygon: true,
  drawPolyline: true,
  drawCircle: true,
  drawRectangle: true,
  drawMarker: true,
  drawCircleMarker: true,

  // Advanced tools
  drawArrow: true,
  drawText: true,
  drawFreehand: true,
  drawDistanceLine: true,
  drawDangerousGoodsZones: true,

  // Circle variations
  drawCircle2Points: true,
  drawCircle3Points: true,

  // Editing tools
  editMode: true,
  dragMode: true,
  cutPolygon: true,
  removalMode: true,
  rotateMode: true,
  scaleMode: true,
});
```

### Custom Tool Order

```javascript
map.pm.addControls({
  drawControls: true,
  editControls: true,
  optionsControls: true,
  customControls: true,
  oneBlock: false, // Separate tool groups
});
```

### Toolbar Position

```javascript
map.pm.addControls({
  position: 'topleft', // 'topleft', 'topright', 'bottomleft', 'bottomright'
});
```

## Global Drawing Options

### Default Styles

```javascript
map.pm.setGlobalOptions({
  pathOptions: {
    color: '#3388ff',
    weight: 3,
    opacity: 0.8,
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    dashArray: null,
    lineCap: 'round',
    lineJoin: 'round',
  },
});
```

### Shape-Specific Styles

```javascript
map.pm.setGlobalOptions({
  pathOptions: {
    Polygon: {
      color: '#ff0000',
      fillOpacity: 0.3,
    },
    Line: {
      color: '#00ff00',
      weight: 4,
    },
    Circle: {
      color: '#0000ff',
      fillOpacity: 0.2,
    },
  },
});
```

### Drawing Behavior

```javascript
map.pm.setGlobalOptions({
  // Snapping
  snappable: true,
  snapDistance: 20,

  // Finishing
  finishOn: 'dblclick', // 'dblclick', 'click', null
  allowSelfIntersection: false,

  // Helpers
  templineStyle: {
    color: '#ff0000',
    dashArray: '5,5',
  },
  hintlineStyle: {
    color: '#888888',
    dashArray: '5,5',
  },
});
```

## Event Handling

### Drawing Events

```javascript
// Drawing started
map.on('pm:drawstart', (e) => {
  console.log('Started drawing:', e.shape);
  console.log('Working layer:', e.workingLayer);
});

// Drawing ended
map.on('pm:drawend', (e) => {
  console.log('Finished drawing:', e.shape);
});

// Shape created
map.on('pm:create', (e) => {
  console.log('Shape created:', e.shape, e.layer);

  // Access shape-specific properties
  if (e.shape === 'Circle') {
    console.log('Radius:', e.layer.getRadius());
  }

  if (e.shape === 'Polygon') {
    console.log('Area:', L.GeometryUtil.geodesicArea(e.layer.getLatLngs()[0]));
  }
});

// Vertex added during drawing
map.on('pm:vertexadded', (e) => {
  console.log('Vertex added:', e.latlng);
  console.log('Working layer:', e.workingLayer);
});
```

### Tool State Events

```javascript
// Tool enabled
map.on('pm:buttonclick', (e) => {
  console.log('Tool clicked:', e.btnName);
});

// Global draw mode enabled
map.on('pm:globaldrawmodetoggled', (e) => {
  console.log('Draw mode:', e.enabled ? 'enabled' : 'disabled');
  console.log('Shape:', e.shape);
});
```

## Programmatic Control

### Enable/Disable Drawing

```javascript
// Enable specific tool
map.pm.enableDraw('Polygon');

// Disable current drawing
map.pm.disableDraw();

// Check if drawing is enabled
if (map.pm.globalDrawModeEnabled()) {
  console.log('Currently drawing:', map.pm.getActiveTool());
}
```

### Tool Management

```javascript
// Get available shapes
const shapes = map.pm.Draw.getShapes();
console.log('Available shapes:', shapes);

// Check if tool exists
if (map.pm.Draw.hasOwnProperty('Polygon')) {
  console.log('Polygon tool is available');
}

// Get current tool
const currentTool = map.pm.getActiveTool();
```

### Custom Drawing Options

```javascript
// Enable drawing with custom options
map.pm.enableDraw('Polygon', {
  snappable: false,
  allowSelfIntersection: true,
  finishOn: 'click',
  pathOptions: {
    color: '#ff0000',
  },
});
```

## Best Practices

### Performance

- Disable unused tools to reduce toolbar clutter
- Use appropriate simplification for freehand drawing
- Limit the number of vertices for complex polygons

### User Experience

- Provide clear instructions for each tool
- Use consistent styling across shapes
- Enable snapping for precise drawing
- Show measurements for spatial awareness

### Accessibility

- Ensure sufficient color contrast
- Provide keyboard shortcuts
- Add ARIA labels for screen readers
- Support high contrast modes

## Troubleshooting

### Common Issues

**Tool not appearing in toolbar:**

```javascript
// Make sure the tool is enabled
map.pm.addControls({
  drawPolygon: true, // Explicitly enable
});
```

**Drawing not working:**

```javascript
// Check if another tool is active
map.pm.disableDraw(); // Disable current tool first
map.pm.enableDraw('Polygon'); // Then enable desired tool
```

**Styles not applied:**

```javascript
// Set options before enabling drawing
map.pm.setGlobalOptions({
  pathOptions: { color: '#ff0000' },
});
map.pm.enableDraw('Polygon');
```

**Events not firing:**

```javascript
// Ensure map is ready
map.whenReady(() => {
  map.on('pm:create', (e) => {
    console.log('Shape created');
  });
});
```

For more troubleshooting help, see the [troubleshooting guide](troubleshooting.md).
