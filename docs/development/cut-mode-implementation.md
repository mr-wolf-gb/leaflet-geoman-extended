# Cut Mode Improvements

## Overview

The Cut mode has been completely rewritten to fix critical issues and add new features. All cut pieces are now fully independent with proper context menu support and the ability to cut with a simple line.

## Issues Fixed

### 1. Independent Cut Pieces

**Problem**: After cutting a shape, all pieces moved and rotated together as if they were still one object.

**Solution**: Complete rewrite following proper Leaflet-Geoman patterns. Each piece is now created as an independent layer using standard Leaflet constructors, which automatically handle option cloning and PM initialization.

### 2. Context Menu Support

**Problem**: Cut pieces had no right-click context menu.

**Solution**: Context menus are now properly attached to each cut piece using `attachLayerContextMenu()`.

### 3. Circle Cutting

**Problem**: Circles (all 3 types) could not be cut.

**Solution**:

- Added circle support to the intersection filter
- Circles are converted to 64-point polygon approximations for cutting
- Result is polygon pieces (since cut circles are no longer circular)

### 4. MultiPolygon Handling

**Problem**: The `difference()` operation sometimes created a single polygon with multiple rings instead of separate polygons.

**Solution**: Added detection and handling for:

- MultiPolygon GeoJSON types
- MultiLineString GeoJSON types
- GeometryCollection
- FeatureCollection
- Polygons with multiple rings

## New Features

### Line Cutting

You can now cut shapes with just a line (2 points) instead of requiring a closed polygon:

- **2 points**: Creates a polyline for cutting
- **3+ points**: Creates a polygon for cutting (original behavior)

This makes cutting faster and more intuitive for simple horizontal or vertical cuts.

## Technical Implementation

### Key Changes

1. **Standard Layer Creation**

   ```javascript
   const newLayer = L.polygon(latlngs, originalLayer.options);
   ```

   - Leaflet automatically clones options internally
   - PM is initialized through `addInitHook`
   - No manual cloning or JSON serialization needed

2. **MultiPolygon Detection**

   ```javascript
   if (cutResult.type === 'MultiPolygon') {
     cutResult.coordinates.forEach((polyCoords) => {
       const latlngs = this._geoJsonCoordsToLatLngs(polyCoords);
       const newLayer = L.polygon(latlngs, originalLayer.options);
       layers.push(newLayer);
     });
   }
   ```

3. **Circle to Polygon Conversion**

   ```javascript
   const points = 64; // Number of points to approximate circle
   for (let i = 0; i < points; i++) {
     const angle = (i * 360) / points;
     const point = this._computeDestinationPoint(center, radius, angle);
     circlePoints.push(point);
   }
   const circlePolygon = L.polygon(circlePoints);
   ```

4. **Context Menu Attachment**
   ```javascript
   if (this._map.pm.Toolbar && this._map.pm.Toolbar._contextMenu) {
     this._map.pm.Toolbar._contextMenu.attachLayerContextMenu(newLayer);
   }
   ```

## Supported Shapes

| Shape Type       | Can Cut? | Result Type    | Independent Pieces? | Context Menu? |
| ---------------- | -------- | -------------- | ------------------- | ------------- |
| Polygon          | ✅ Yes   | Polygons       | ✅ Yes              | ✅ Yes        |
| Rectangle        | ✅ Yes   | Polygons       | ✅ Yes              | ✅ Yes        |
| Circle           | ✅ Yes   | Polygons       | ✅ Yes              | ✅ Yes        |
| Circle (2-Point) | ✅ Yes   | Polygons       | ✅ Yes              | ✅ Yes        |
| Circle (3-Point) | ✅ Yes   | Polygons       | ✅ Yes              | ✅ Yes        |
| Line             | ✅ Yes   | Lines          | ✅ Yes              | ✅ Yes        |
| Freehand         | ✅ Yes   | Polygons/Lines | ✅ Yes              | ✅ Yes        |

## Testing

A comprehensive test file is included: `demo/cut-mode-demo.html`

### Test Instructions:

1. Open the demo file in a browser
2. Click the Cut tool (scissors icon)
3. Draw a line across any shape
4. Double-click to finish cutting
5. Right-click each piece → Select "Move" or "Rotate"
6. Verify each piece moves/rotates independently

### Expected Results:

- ✅ Each piece moves independently
- ✅ Each piece rotates independently
- ✅ Each piece has a context menu
- ✅ All PM features work on each piece
- ✅ No shared references between pieces

## Code Structure

```javascript
Draw.Cut = Draw.Polygon.extend({
  _finishShape() {
    // Supports 2+ points (line or polygon cutting)
    // Creates cutting layer
    // Performs cut operation
  },

  cut(cuttingLayer) {
    // Finds all layers that can be cut
    // Filters by type, intersection, and options
    // Cuts each layer independently
  },

  _cutSingleLayer(cuttingLayer, layerToCut, _latlngInfos) {
    // Prepares layer for cutting
    // Performs cut operation
    // Converts result to independent layers
    // Adds layers to map with PM and context menu
    // Fires events
  },

  _performCut(cuttingLayer, layerToCut) {
    // Handles Circle → Polygon conversion
    // Handles Polygon cutting with turf.js difference()
    // Handles Polyline cutting with turf.js lineSplit()
    // Returns GeoJSON result
  },

  _convertCutResultToLayers(cutResult, originalLayer) {
    // Detects and handles MultiPolygon
    // Detects and handles MultiLineString
    // Handles GeometryCollection and FeatureCollection
    // Splits multiple rings into separate layers
    // Creates new independent layers
  },

  _computeDestinationPoint(latlng, distance, bearing) {
    // Calculates point at distance and bearing from center
    // Used for circle to polygon conversion
  },
});
```

## Breaking Changes

None. The API remains the same, all changes are internal improvements.

## Migration Guide

No migration needed. Existing code will work without changes and benefit from the improvements automatically.

## Performance

- Circle cutting uses 64-point polygon approximation (good balance of accuracy and performance)
- MultiPolygon detection is efficient with early returns
- No unnecessary layer cloning or serialization

## Future Enhancements

Possible future improvements:

- Configurable circle approximation point count
- Support for cutting ImageOverlay layers
- Undo/redo support for cut operations
- Cut preview before finalizing

## Credits

Complete rewrite of the Cut mode following Leaflet-Geoman best practices and patterns from other drawing tools.
