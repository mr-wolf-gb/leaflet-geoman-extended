# Library Panel Position Configuration

## Overview

The library panel position can now be configured via `pm.setGlobalOptions()` and will remain fixed regardless of RTL (Right-to-Left) layout changes. This provides consistent panel positioning across different language modes.

## Configuration

### Setting Panel Position

You can set the panel position using the `panelPosition` option in the library configuration:

```javascript
map.pm.setGlobalOptions({
  library: {
    enabled: true,
    panelPosition: 'topright', // 'topleft', 'topright', 'bottomleft', 'bottomright'
    json: categoriesData, // or url: 'path/to/categories.json'
  },
});
```

### Available Positions

- `'topleft'` - Top left corner of the map
- `'topright'` - Top right corner of the map (default)
- `'bottomleft'` - Bottom left corner of the map
- `'bottomright'` - Bottom right corner of the map

## RTL Support

The panel position is now **fixed** and will not change when RTL mode is enabled. This ensures consistent positioning regardless of the text direction:

```javascript
// Set panel to top-left
map.pm.setGlobalOptions({
  library: {
    panelPosition: 'topleft',
  },
});

// Enable RTL mode - panel stays at top-left
map.pm.setRTL(true);
```

### Previous Behavior

Before this feature, the panel position would automatically flip when RTL mode was enabled:

- LTR mode: Panel at `right: 60px`
- RTL mode: Panel at `left: 60px`

### New Behavior

With the `panelPosition` config, the position is fixed:

- `panelPosition: 'topright'` → Always at top-right, regardless of RTL
- `panelPosition: 'topleft'` → Always at top-left, regardless of RTL

## Dynamic Position Changes

You can change the panel position at runtime:

```javascript
// Change to bottom-right
map.pm.setGlobalOptions({
  library: {
    panelPosition: 'bottomright',
  },
});
```

The panel will immediately update to the new position.

## Example

```javascript
// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13);

// Configure library with fixed position
map.pm.setGlobalOptions({
  library: {
    enabled: true,
    panelPosition: 'topleft', // Fixed at top-left
    json: {
      categories: [
        {
          id: 'markers',
          title: 'Markers',
          items: [
            {
              id: 'marker-1',
              type: 'image',
              src: 'path/to/marker.png',
              width: 32,
              height: 32,
            },
          ],
        },
      ],
    },
  },
});

// Add controls
map.pm.addControls();

// Show library panel
map.pm.Library.togglePanel();

// Enable RTL - panel stays at top-left
map.pm.setRTL(true);
```

## CSS Classes

The panel element receives a position-specific class:

- `.panel-topleft`
- `.panel-topright`
- `.panel-bottomleft`
- `.panel-bottomright`

These classes apply the fixed positioning and are not affected by the `[dir='rtl']` selector.

## Responsive Behavior

On smaller screens (max-width: 480px), the panel maintains its configured position but adjusts margins for better mobile display.

## Migration Guide

If you were relying on the automatic RTL position flip, you may need to update your code:

### Before

```javascript
// Panel automatically flipped in RTL
map.pm.setLang('ar'); // Panel moves to left
```

### After

```javascript
// Explicitly set position for RTL languages
map.pm.setGlobalOptions({
  library: {
    panelPosition: 'topleft', // Choose appropriate position
  },
});
map.pm.setLang('ar');
```

## Demo

See `demo/library-panel-position-demo.html` for a working example with position controls and RTL toggle.
