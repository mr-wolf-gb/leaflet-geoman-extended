# Advanced Features

Leaflet-Geoman includes several advanced features for specialized use cases.

## Cut Mode

Cut mode allows you to split existing shapes into multiple independent pieces using a cutting line or polygon.

### Overview

- ✅ Cut polygons, rectangles, circles, and lines
- ✅ Cut with a simple line (2 points) or polygon (3+ points)
- ✅ Each cut piece is fully independent
- ✅ Context menus work on all cut pieces
- ✅ All PM features available on cut pieces

### Basic Usage

```javascript
// Enable cut mode
map.pm.enableDraw('Cut');

// Listen to cut events
map.on('pm:cut', (e) => {
  console.log('Original layer:', e.originalLayer);
  console.log('New piece:', e.layer);
});
```

### Cutting with a Line

You can cut shapes with just 2 points (a line):

```javascript
// Enable cut mode
map.pm.enableDraw('Cut');

// Click 2 points to create a cutting line
// Double-click to finish
// The shape is split along the line
```

### Cutting with a Polygon

For more complex cuts, use 3 or more points:

```javascript
// Enable cut mode
map.pm.enableDraw('Cut');

// Click 3+ points to create a cutting polygon
// Double-click to finish
// The shape is cut by the polygon
```

### Supported Shapes

| Shape Type | Can Cut? | Result Type    | Independent Pieces? |
| ---------- | -------- | -------------- | ------------------- |
| Polygon    | ✅ Yes   | Polygons       | ✅ Yes              |
| Rectangle  | ✅ Yes   | Polygons       | ✅ Yes              |
| Circle     | ✅ Yes   | Polygons       | ✅ Yes              |
| Line       | ✅ Yes   | Lines          | ✅ Yes              |
| Freehand   | ✅ Yes   | Polygons/Lines | ✅ Yes              |

### Configuration

```javascript
map.pm.setGlobalOptions({
  cutPolygon: {
    snappable: true,
    cursorMarker: true,
    allowSelfIntersection: false,
  },
});
```

### Events

```javascript
// Before cut
map.on('pm:drawstart', (e) => {
  if (e.shape === 'Cut') {
    console.log('Started cutting');
  }
});

// After cut
map.on('pm:cut', (e) => {
  console.log('Cut completed');
  console.log('Original:', e.originalLayer);
  console.log('New pieces:', e.layer);

  // Each piece is independent
  e.layer.pm.enable(); // Can edit
  e.layer.pm.enableRotate(); // Can rotate
});
```

## Distance Lines

Distance lines allow you to create lines with predefined segment distances, useful for planning routes or measuring specific distances.

### Basic Usage

```javascript
// Enable distance line drawing
map.pm.enableDraw('DistanceLine');

// Configure predefined distances
map.pm.setGlobalOptions({
  distanceLine: {
    distances: ['1km', '500m', '2km'],
    showLabels: true,
    labelStyle: {
      backgroundColor: 'white',
      borderColor: '#3388ff',
      color: '#333',
    },
  },
});
```

### Configuration Options

```javascript
map.pm.setGlobalOptions({
  distanceLine: {
    // Predefined segment distances
    distances: ['1km', '500m', '2km', '100m'],

    // Display options
    showLabels: true,
    labelPosition: 'middle', // 'middle', 'start', 'end'

    // Label styling
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

    // Line styling
    pathOptions: {
      color: '#3388ff',
      weight: 3,
      opacity: 0.8,
    },
  },
});
```

### Getting Distance Data

```javascript
map.on('pm:create', (e) => {
  if (e.shape === 'DistanceLine') {
    const distances = e.layer.pm.getDistances();
    console.log('Segment distances:', distances);

    const totalDistance = distances.reduce((sum, d) => sum + d, 0);
    console.log('Total distance:', totalDistance + ' m');
  }
});
```

### Events

```javascript
// Distance line created
map.on('pm:create', (e) => {
  if (e.shape === 'DistanceLine') {
    console.log('Distance line created');
    console.log('Distances:', e.layer.pm.getDistances());
  }
});

// Distance line edited
map.on('pm:edit', (e) => {
  if (e.layer.pm._shape === 'DistanceLine') {
    console.log('Distance line edited');
    console.log('New distances:', e.layer.pm.getDistances());
  }
});
```

## Dangerous Goods Zones

Create multi-circle hazard areas for safety planning, emergency response, or risk assessment.

### Basic Usage

```javascript
// Enable dangerous goods zone drawing
map.pm.enableDraw('DangerousGoodsZones');

// Configure zones
map.pm.setGlobalOptions({
  dangerousGoodsZones: {
    zones: [
      { radius: 100, label: 'Danger Zone', color: '#ff0000' },
      { radius: 200, label: 'Warning Zone', color: '#ff8800' },
      { radius: 300, label: 'Safety Zone', color: '#ffff00' },
    ],
    showLabels: true,
    draggable: true,
  },
});
```

### Configuration Options

```javascript
map.pm.setGlobalOptions({
  dangerousGoodsZones: {
    // Zone definitions
    zones: [
      {
        radius: 100, // Radius in meters
        label: 'Danger Zone', // Zone label
        color: '#ff0000', // Zone color
        fillOpacity: 0.2, // Fill opacity
        weight: 2, // Border weight
      },
      {
        radius: 200,
        label: 'Warning Zone',
        color: '#ff8800',
        fillOpacity: 0.15,
        weight: 2,
      },
      {
        radius: 300,
        label: 'Safety Zone',
        color: '#ffff00',
        fillOpacity: 0.1,
        weight: 1,
      },
    ],

    // Display options
    showLabels: true,
    labelPosition: 'top', // 'top', 'bottom', 'center'

    // Interaction options
    draggable: true,
    editable: true,

    // Label styling
    labelStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#333',
      color: '#333',
      fontSize: '12px',
      padding: '4px 8px',
    },
  },
});
```

### Accessing Zone Data

```javascript
map.on('pm:create', (e) => {
  if (e.shape === 'DangerousGoodsZones') {
    const zones = e.layer.pm.getZones();
    console.log('Zones:', zones);

    zones.forEach((zone, index) => {
      console.log(`Zone ${index + 1}:`, {
        radius: zone.radius,
        label: zone.label,
        color: zone.color,
        center: zone.center,
      });
    });
  }
});
```

### Events

```javascript
// Zones created
map.on('pm:create', (e) => {
  if (e.shape === 'DangerousGoodsZones') {
    console.log('Dangerous goods zones created');
    console.log('Center:', e.layer.getLatLng());
    console.log('Zones:', e.layer.pm.getZones());
  }
});

// Zones moved
map.on('pm:drag', (e) => {
  if (e.layer.pm._shape === 'DangerousGoodsZones') {
    console.log('Zones moved to:', e.layer.getLatLng());
  }
});

// Zones edited
map.on('pm:edit', (e) => {
  if (e.layer.pm._shape === 'DangerousGoodsZones') {
    console.log('Zones edited');
    console.log('New zones:', e.layer.pm.getZones());
  }
});
```

## Freehand Drawing

Draw smooth, organic shapes by dragging the mouse or using touch input.

### Basic Usage

```javascript
// Enable freehand drawing
map.pm.enableDraw('Freehand');

// Configure freehand options
map.pm.setGlobalOptions({
  freehand: {
    smoothFactor: 10,
    simplifyTolerance: 0.0001,
    convertToPolygon: true,
  },
});
```

### Configuration Options

```javascript
map.pm.setGlobalOptions({
  freehand: {
    // Smoothing level (1-20)
    smoothFactor: 10,

    // Simplification tolerance (lower = more points)
    simplifyTolerance: 0.0001,

    // Convert closed shapes to polygons
    convertToPolygon: true,

    // Minimum distance between points (pixels)
    minDistance: 5,

    // Path styling
    pathOptions: {
      color: '#3388ff',
      weight: 3,
      opacity: 0.8,
      fillColor: '#3388ff',
      fillOpacity: 0.2,
    },
  },
});
```

### Events

```javascript
// Freehand drawing started
map.on('pm:drawstart', (e) => {
  if (e.shape === 'Freehand') {
    console.log('Started freehand drawing');
  }
});

// Freehand shape created
map.on('pm:create', (e) => {
  if (e.shape === 'Freehand') {
    console.log('Freehand shape created');
    console.log('Points:', e.layer.getLatLngs());
    console.log('Is polygon:', e.layer instanceof L.Polygon);
  }
});
```

## Arrow Tools

Create directional arrows with customizable arrowheads.

### Basic Usage

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

### Configuration Options

```javascript
map.pm.setGlobalOptions({
  pathOptions: {
    Arrow: {
      // Line styling
      color: '#ff8800',
      weight: 4,
      opacity: 0.8,

      // Arrowhead styling
      arrowheadLength: 15, // Length in pixels
      arrowheadAngle: 30, // Angle in degrees
      arrowheadFilled: true, // Fill the arrowhead
      arrowheadColor: '#ff8800',

      // Double-headed arrow
      doubleHeaded: false,
    },
  },
});
```

### Accessing Arrow Data

```javascript
map.on('pm:create', (e) => {
  if (e.shape === 'Arrow') {
    const points = e.layer.getLatLngs();
    console.log('Arrow from:', points[0]);
    console.log('Arrow to:', points[1]);

    // Calculate bearing
    const bearing = L.GeometryUtil.bearing(points[0], points[1]);
    console.log('Bearing:', bearing + '°');
  }
});
```

## Circle Variations

### 2-Point Circle

Create a circle by defining the diameter endpoints.

```javascript
// Enable 2-point circle
map.pm.enableDraw('Circle2Points');

// Usage:
// 1. Click first point (diameter start)
// 2. Click second point (diameter end)
// Circle is created with these points as diameter
```

### 3-Point Circle

Create a circle passing through three points.

```javascript
// Enable 3-point circle
map.pm.enableDraw('Circle3Points');

// Usage:
// 1. Click first point on circumference
// 2. Click second point on circumference
// 3. Click third point to complete circle
```

### Configuration

```javascript
map.pm.setGlobalOptions({
  pathOptions: {
    Circle2Points: {
      color: '#0000ff',
      fillColor: '#0000ff',
      fillOpacity: 0.2,
    },
    Circle3Points: {
      color: '#00ff00',
      fillColor: '#00ff00',
      fillOpacity: 0.2,
    },
  },
});
```

## Text Labels

Add rich text labels with formatting options.

### Basic Usage

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

### Configuration Options

```javascript
map.pm.setGlobalOptions({
  textOptions: {
    // Text styling
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    fontColor: '#000000',
    fontWeight: 'normal', // 'normal', 'bold'
    fontStyle: 'normal', // 'normal', 'italic'

    // Background styling
    backgroundColor: '#ffffff',
    backgroundOpacity: 0.9,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: '8px 12px',

    // Text options
    maxWidth: 300,
    allowHTML: false,
    draggable: true,
  },
});
```

### Accessing Text Content

```javascript
map.on('pm:create', (e) => {
  if (e.shape === 'Text') {
    const text = e.layer.pm.getText();
    console.log('Text content:', text);

    // Update text programmatically
    e.layer.pm.setText('Updated text');
  }
});
```

## Best Practices

### Performance

- Use appropriate simplification for freehand drawing
- Limit the number of zones in dangerous goods areas
- Consider using circle approximations for complex cuts

### User Experience

- Provide clear instructions for each advanced tool
- Show visual feedback during operations
- Enable snapping for precision
- Use consistent styling across features

### Accessibility

- Ensure sufficient color contrast for zones
- Provide keyboard alternatives where possible
- Add ARIA labels for screen readers
- Support high contrast modes

## Troubleshooting

### Cut Mode Issues

**Cut not working:**

- Ensure the cutting line/polygon intersects the target shape
- Check that the target shape is cuttable (see supported shapes)
- Verify cut mode is enabled: `map.pm.Draw.Cut.enabled()`

**Cut pieces not independent:**

- This should not happen in the current version
- If it does, please report as a bug

### Distance Line Issues

**Distances not showing:**

- Ensure `showLabels: true` in configuration
- Check that distances array is properly defined
- Verify CSS is loaded correctly

### Dangerous Goods Issues

**Zones not displaying:**

- Ensure zones array is properly configured
- Check that each zone has required properties (radius, label, color)
- Verify the center point is valid

## Related Documentation

- [Drawing Tools](./drawing-tools.md)
- [Editing Features](./editing.md)
- [Measurements](./measurements.md)
- [Events API](../api/events.md)
