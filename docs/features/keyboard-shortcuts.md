# Keyboard Shortcuts

Leaflet-Geoman includes built-in keyboard shortcuts to enhance the drawing experience and improve productivity. These shortcuts work automatically when drawing is enabled and can be toggled on/off as needed.

## Quick Reference

| Shortcut                     | Action                             | Description                                                                                  |
| ---------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `ESC`                        | Finish/Cancel Drawing or Exit Mode | Completes the current shape if possible, cancels drawing mode, or exits any active edit mode |
| `ENTER`                      | Finish Drawing                     | Completes the current shape (alternative to ESC)                                             |
| `BACKSPACE`                  | Remove Last Vertex                 | Removes the last added vertex while drawing lines or polygons                                |
| `DELETE`                     | Remove Last Vertex                 | Same as Backspace - removes the last vertex                                                  |
| `CTRL+Z` (or `CMD+Z` on Mac) | Undo Last Vertex                   | Removes the last vertex (same as Backspace/Delete)                                           |

### ESC Key Works With

- ✅ Drawing modes (Polygon, Line, Circle, etc.)
- ✅ Edit mode
- ✅ Drag mode
- ✅ Cut mode
- ✅ Rotate mode
- ✅ Copy mode
- ✅ Removal mode

## Getting Started

### Basic Usage

Keyboard shortcuts are **enabled by default**. Simply start drawing and use the shortcuts:

```javascript
// Initialize map with Leaflet-Geoman
const map = L.map('map').setView([51.505, -0.09], 13);
map.pm.addControls();

// Start drawing - shortcuts work automatically
map.pm.enableDraw('Polygon');

// User can now:
// - Press ESC or ENTER to finish the polygon
// - Press BACKSPACE/DELETE to remove the last vertex
// - Press CTRL+Z to undo the last vertex
```

### Enable/Disable Shortcuts

```javascript
// Disable keyboard shortcuts
map.pm.disableKeyboardShortcuts();

// Enable keyboard shortcuts
map.pm.enableKeyboardShortcuts();

// Check if shortcuts are enabled
const enabled = map.pm.keyboardShortcutsEnabled();
console.log('Shortcuts enabled:', enabled);
```

### Toggle with a Button

```javascript
const toggleButton = document.getElementById('toggle-shortcuts');

toggleButton.addEventListener('click', () => {
  if (map.pm.keyboardShortcutsEnabled()) {
    map.pm.disableKeyboardShortcuts();
    toggleButton.textContent = 'Enable Shortcuts';
  } else {
    map.pm.enableKeyboardShortcuts();
    toggleButton.textContent = 'Disable Shortcuts';
  }
});
```

## Behavior Details

### Focus Requirements

Keyboard shortcuts work when:

- The map container has focus
- The user is not typing in an input field, textarea, or contenteditable element

This prevents conflicts with form inputs and other interactive elements on the page.

### Shape-Specific Behavior

#### Polygons and Lines

- **ESC/ENTER**: Finishes the shape if there are enough vertices (3+ for polygons, 2+ for lines)
- **BACKSPACE/DELETE/CTRL+Z**: Removes the last vertex. If only one vertex remains, cancels drawing mode

#### Circles, Rectangles, and Markers

- **ESC**: Cancels drawing mode (these shapes don't support vertex removal)
- Other shortcuts may not apply to these simple shapes

### Self-Intersection Handling

When `allowSelfIntersection: false` is set:

- ESC/ENTER will only finish the shape if it doesn't self-intersect
- The shape will remain in drawing mode if finishing would create a self-intersection

### Snap-to-Finish Requirement

When `requireSnapToFinish: true` is set:

- ESC/ENTER will only finish the shape if the last vertex is snapped to another layer
- This ensures precision when required

## Events

Keyboard shortcuts trigger the same events as manual actions:

```javascript
// Fired when a vertex is removed via keyboard shortcut
map.on('pm:vertexremoved', (e) => {
  console.log('Vertex removed:', e.indexPath);
});

// Fired when drawing is finished via keyboard shortcut
map.on('pm:create', (e) => {
  console.log('Shape created:', e.shape, e.layer);
});

// Fired when drawing is cancelled
map.on('pm:drawend', (e) => {
  console.log('Drawing ended:', e.shape);
});

// Monitor all keyboard events
map.on('pm:keyevent', (e) => {
  console.log('Key pressed:', e.event.key, e.eventType, e.focusOn);
});
```

## Advanced Configuration

### Custom Keyboard Handlers

Add custom keyboard handlers by listening to the `pm:keyevent` event:

```javascript
map.on('pm:keyevent', (e) => {
  const key = e.event.key;
  const focusOn = e.focusOn;

  // Only handle when map has focus
  if (focusOn === 'map') {
    // Custom shortcut: 'C' to cancel drawing
    if (key === 'c' || key === 'C') {
      const activeShape = map.pm.Draw.getActiveShape();
      if (activeShape) {
        map.pm.disableDraw(activeShape);
        e.event.preventDefault();
      }
    }

    // Custom shortcut: 'F' to finish drawing
    if (key === 'f' || key === 'F') {
      const activeShape = map.pm.Draw.getActiveShape();
      if (activeShape) {
        const drawInstance = map.pm.Draw[activeShape];
        if (drawInstance._finishShape) {
          drawInstance._finishShape();
          e.event.preventDefault();
        }
      }
    }
  }
});
```

### Disabling Specific Shortcuts

While you can't disable individual shortcuts, you can override their behavior:

```javascript
// Disable all built-in shortcuts
map.pm.disableKeyboardShortcuts();

// Implement only the shortcuts you want
map.on('pm:keyevent', (e) => {
  if (e.eventType === 'keydown' && e.focusOn === 'map') {
    const key = e.event.key;
    const activeShape = map.pm.Draw.getActiveShape();

    if (!activeShape) return;

    // Only implement ESC to finish
    if (key === 'Escape') {
      const drawInstance = map.pm.Draw[activeShape];
      if (drawInstance._finishShape) {
        drawInstance._finishShape();
        e.event.preventDefault();
      }
    }
  }
});
```

## Visual Reference

### Workflow Examples

#### Drawing a Polygon

```
1. Click polygon tool
   ↓
2. Click to add vertices
   ↓
3. Press ESC or ENTER
   ↓
4. Polygon created ✓
```

#### Correcting Mistakes

```
Drawing in progress...
   ↓
Oops! Wrong vertex
   ↓
Press BACKSPACE
   ↓
Continue drawing ✓
```

#### Exit Edit Mode

```
Edit mode active...
   ↓
Done editing
   ↓
Press ESC
   ↓
Edit mode disabled ✓
```

### Platform Differences

**Windows / Linux:**

```
CTRL + Z = Undo last vertex
```

**macOS:**

```
CMD + Z = Undo last vertex
```

## Browser Compatibility

Keyboard shortcuts use the modern `KeyboardEvent.key` property, which is supported in:

- Chrome 51+
- Firefox 23+
- Safari 10.1+
- Edge 79+
- All modern mobile browsers

## Best Practices

1. **Inform Users**: Display available shortcuts in your UI so users know they exist
2. **Visual Feedback**: Show tooltip or status messages when shortcuts are used
3. **Accessibility**: Ensure keyboard shortcuts don't conflict with screen readers or browser shortcuts
4. **Mobile Considerations**: Keyboard shortcuts primarily benefit desktop users; ensure touch controls remain intuitive
5. **Testing**: Test shortcuts with different keyboard layouts and languages

## Troubleshooting

### Shortcuts Not Working

1. **Check if shortcuts are enabled**:

   ```javascript
   console.log('Shortcuts enabled:', map.pm.keyboardShortcutsEnabled());
   ```

2. **Verify map has focus**: Click on the map before using shortcuts

3. **Check for input field focus**: Shortcuts are disabled when typing in input fields

4. **Browser console errors**: Check for JavaScript errors that might prevent shortcuts from working

### Conflicts with Other Libraries

If keyboard shortcuts conflict with other libraries:

```javascript
// Disable Leaflet-Geoman shortcuts
map.pm.disableKeyboardShortcuts();

// Or handle conflicts in your event listeners
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Your custom logic
    e.stopPropagation(); // Prevent other handlers
  }
});
```

## API Reference

### Methods

#### `map.pm.enableKeyboardShortcuts()`

Enables keyboard shortcuts for drawing operations.

**Returns**: `undefined`

#### `map.pm.disableKeyboardShortcuts()`

Disables keyboard shortcuts for drawing operations.

**Returns**: `undefined`

#### `map.pm.keyboardShortcutsEnabled()`

Checks if keyboard shortcuts are currently enabled.

**Returns**: `boolean` - `true` if enabled, `false` otherwise

### Events

#### `pm:keyevent`

Fired when any keyboard event occurs (keydown or keyup).

**Event Data**:

```javascript
{
  event: KeyboardEvent,    // The original keyboard event
  eventType: 'keydown',    // 'keydown' or 'keyup'
  focusOn: 'map',          // 'map' or 'document'
  source: 'Global'         // Event source
}
```

## Complete Example

```html
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.css"
    />
    <style>
      #map {
        height: 500px;
      }
      .shortcuts-info {
        position: absolute;
        top: 10px;
        right: 10px;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        z-index: 1000;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="shortcuts-info">
      <h4>Keyboard Shortcuts</h4>
      <ul>
        <li><strong>ESC/ENTER:</strong> Finish drawing</li>
        <li><strong>BACKSPACE:</strong> Remove last vertex</li>
        <li><strong>CTRL+Z:</strong> Undo last vertex</li>
      </ul>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-geoman-extended@latest/dist/leaflet-geoman.js"></script>

    <script>
      const map = L.map('map').setView([51.505, -0.09], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
        map
      );
      map.pm.addControls();

      // Log keyboard events
      map.on('pm:keyevent', (e) => {
        console.log('Key pressed:', e.event.key);
      });

      // Log shape creation
      map.on('pm:create', (e) => {
        console.log('Created:', e.shape);
      });
    </script>
  </body>
</html>
```

## Related Documentation

- [Drawing Tools](./drawing-tools.md)
- [Events API](../api/events.md)
- [Configuration Options](../api/options.md)
