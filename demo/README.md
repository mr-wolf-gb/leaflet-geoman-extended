# Leaflet-Geoman Demo

Welcome to the Leaflet-Geoman interactive demo!

## 🚀 Quick Start

Open `index.html` in your web browser to access the demo landing page, then click "Launch Complete Demo" to explore all features.

### Serving Locally

For best performance, serve the files through a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000/demo/`

## 📋 Demo Structure

### Main Demo

**[complete-demo.html](complete-demo.html)** - Comprehensive interactive demo with all features

This single demo includes:

- ✅ All 15+ drawing tools
- ✅ All editing modes (edit, drag, rotate, scale, cut, copy, remove)
- ✅ Real-time measurements
- ✅ Keyboard shortcuts
- ✅ Style editor
- ✅ Event logging
- ✅ Statistics dashboard
- ✅ Feature switching
- ✅ Sample shapes
- ✅ Quick actions

### Features Included

#### Drawing Tools

- Polygon, Polyline, Circle, Rectangle
- Marker, CircleMarker
- Text, Arrow, Freehand
- Distance Line, Dangerous Goods Zones
- Circle variations (2-point, 3-point)

#### Editing Tools

- Edit Mode - Modify vertices and properties
- Drag Mode - Move entire shapes
- Rotate Mode - Rotate shapes around center
- Scale Mode - Resize shapes proportionally
- Cut Mode - Split shapes into pieces
- Copy Mode - Duplicate shapes
- Removal Mode - Delete shapes
- Style Editor - Visual styling interface

#### Features

- Real-time measurements (area, perimeter, distance)
- Keyboard shortcuts (ESC, ENTER, BACKSPACE, CTRL+Z)
- Event system with live logging
- Snapping to vertices and edges
- Context menus (right-click)
- Sample shapes for testing
- Statistics tracking
- Feature descriptions

## 🎯 Using the Demo

### Navigation

1. **Sidebar** (left) - Switch between feature categories
2. **Map** (center) - Interactive map with toolbar
3. **Info Panel** (right) - Statistics, shortcuts, event log

### Feature Categories

- **All Features** - Everything enabled
- **Drawing Tools** - Focus on shape creation
- **Editing Tools** - Focus on shape modification
- **Measurements** - Focus on calculations
- **Advanced Features** - Cut mode, distance lines, danger zones
- **Keyboard Shortcuts** - Keyboard-driven workflow
- **Events & API** - Event system demonstration

### Quick Actions

- **Enable All** - Enable all toolbar controls
- **Clear Map** - Remove all shapes
- **Add Samples** - Add example shapes
- **Clear Log** - Clear event log

### Keyboard Shortcuts

- **ESC** - Finish/cancel drawing or exit mode
- **ENTER** - Finish drawing
- **BACKSPACE** - Remove last vertex
- **DELETE** - Remove last vertex
- **CTRL+Z** - Undo last vertex

## 📖 Learning Path

### Beginner

1. Open the complete demo
2. Try the basic drawing tools (polygon, line, circle)
3. Enable edit mode and modify shapes
4. Check the event log to see what's happening

### Intermediate

1. Try advanced shapes (arrow, text, freehand)
2. Use keyboard shortcuts for faster workflow
3. Experiment with measurements
4. Try the style editor

### Advanced

1. Use cut mode to split shapes
2. Create distance lines with predefined segments
3. Set up dangerous goods zones
4. Study the event log for API integration

## 🔧 For Developers

### Implementation Reference

The complete demo serves as a comprehensive implementation reference:

```javascript
// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13);

// Add all controls
map.pm.addControls({
  position: 'topleft',
  drawPolygon: true,
  drawPolyline: true,
  // ... all other tools
});

// Configure global options
map.pm.setGlobalOptions({
  pathOptions: {
    /* styling */
  },
  measurements: {
    /* measurement config */
  },
  snappable: true,
  snapDistance: 20,
});

// Handle events
map.on('pm:create', (e) => {
  console.log('Created:', e.shape, e.layer);
});
```

### Event Logging

The demo includes comprehensive event logging:

- `pm:create` - Shape created
- `pm:edit` - Shape edited
- `pm:remove` - Shape removed
- `pm:cut` - Shape cut
- `pm:drawstart` - Drawing started
- `pm:drawend` - Drawing ended
- `pm:globaleditmodetoggled` - Edit mode toggled
- And many more...

### Code Structure

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Leaflet CSS -->
    <!-- Leaflet-Geoman CSS -->
    <!-- Custom styles -->
  </head>
  <body>
    <!-- UI structure -->
    <div id="map"></div>

    <!-- Leaflet JS -->
    <!-- Leaflet-Geoman JS -->
    <script>
      // Map initialization
      // Control setup
      // Event handlers
      // Helper functions
    </script>
  </body>
</html>
```

## 📱 Mobile Support

The demo is fully responsive and works on:

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet devices
- Mobile phones (with touch support)

## 🗂️ Archive

Old individual demos are preserved in the `archive/` folder for reference:

- `archive/basic-drawing.html`
- `archive/measurement-demo.html`
- `archive/keyboard-shortcuts-demo.html`
- And 23 more...

These are kept for backward compatibility and specific feature testing, but the complete demo is recommended for general use.

## 🐛 Troubleshooting

### Demo not loading?

- Ensure you're serving files through a web server
- Check browser console for errors
- Verify internet connection for CDN resources

### Features not working?

- Make sure JavaScript is enabled
- Check for browser compatibility
- Try refreshing the page
- Clear browser cache

### Styling issues?

- Verify all stylesheets are loading
- Check for CSS conflicts
- Try a different browser

## 📄 License

This demo is part of Leaflet-Geoman and is licensed under the MIT License.

## 🔗 Resources

- [Documentation](../docs/) - Complete documentation
- [GitHub](https://github.com/geoman-io/leaflet-geoman) - Source code
- [NPM](https://www.npmjs.com/package/leaflet-geoman-extended) - Package
- [Website](https://geoman.io) - Official website

---

**Happy mapping with Leaflet-Geoman! 🗺️**
