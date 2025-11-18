# Library Global Options Implementation

## Overview

This implementation adds comprehensive integration between the Leaflet-Geoman Library feature and the global options system, similar to how measurements are handled. The library can now be enabled/disabled via `pm.addControls()` and configured via `pm.setGlobalOptions()`.

## Key Features Implemented

### 1. Global Options Integration

The library now supports configuration through `map.pm.setGlobalOptions()`:

```javascript
map.pm.setGlobalOptions({
  library: {
    enabled: false, // Enable/disable library functionality
    json: null, // Direct JSON data for categories
    url: null, // URL to fetch JSON data from
    autoLoad: true, // Auto-load data when library is enabled
    urlOptions: {
      // Options for URL loading
      cache: true,
      timeout: 10000,
    },
  },
});
```

### 2. Controls Integration

The library button now respects the `enabled` state from global options:

```javascript
// Library button will only appear if enabled in global options
map.pm.addControls({
  library: true,
});
```

### 3. Auto-Loading

When library is enabled and has data configured, it automatically loads:

- **JSON Data**: Directly from `library.json` option
- **URL Data**: Fetched from `library.url` option
- **Auto-Load Control**: Controlled by `library.autoLoad` option

### 4. Smart Refresh

The `refreshPanel()` method now intelligently detects data source:

1. **Priority 1**: URL from global options
2. **Priority 2**: JSON from global options
3. **Priority 3**: Cached URL (legacy behavior)
4. **Priority 4**: Simple panel refresh

```javascript
// Smart refresh automatically detects and uses the appropriate data source
await map.pm.Library.refreshPanel();
```

## API Changes

### New Methods

#### `Library.isEnabled()`

```javascript
const enabled = map.pm.Library.isEnabled();
```

Returns whether the library is enabled in global options.

#### `Library.updateFromGlobalOptions(options)`

```javascript
map.pm.Library.updateFromGlobalOptions(libraryOptions);
```

Updates library configuration from global options.

#### `Library.loadFromGlobalOptions()`

```javascript
const success = await map.pm.Library.loadFromGlobalOptions();
```

Loads library data from global options (JSON or URL).

#### `Library.hasGlobalData()`

```javascript
const hasData = map.pm.Library.hasGlobalData();
```

Checks if library has data configured in global options.

#### `Library.getGlobalLibraryOptions()`

```javascript
const options = map.pm.Library.getGlobalLibraryOptions();
```

Gets the current library options from global options.

### Enhanced Methods

#### `Library.refreshPanel()` - Now Smart

The refresh method now automatically detects the data source and refreshes accordingly:

```javascript
// Automatically detects whether to refresh from URL, JSON, or cached data
await map.pm.Library.refreshPanel();
```

#### `Library.togglePanel()` - Now Respects Enabled State

```javascript
// Will show warning if library is disabled
map.pm.Library.togglePanel();
```

## Usage Examples

### Basic Setup

```javascript
// Enable library with JSON data
map.pm.setGlobalOptions({
  library: {
    enabled: true,
    json: {
      categories: [
        {
          id: 'markers',
          title: 'Markers',
          items: [
            {
              id: 'hospital',
              type: 'font',
              icon: 'fa-hospital',
              color: '#ff0000',
              title: 'Hospital',
            },
          ],
        },
      ],
    },
    autoLoad: true,
  },
});

// Add controls (library button will appear)
map.pm.addControls({
  library: true,
});
```

### URL-Based Loading

```javascript
// Enable library with URL data source
map.pm.setGlobalOptions({
  library: {
    enabled: true,
    url: 'https://example.com/categories.json',
    urlOptions: {
      cache: true,
      timeout: 15000,
    },
    autoLoad: true,
  },
});
```

### Dynamic Control

```javascript
// Enable library
map.pm.setGlobalOptions({
  library: { enabled: true },
});

// Disable library (button will disappear from toolbar)
map.pm.setGlobalOptions({
  library: { enabled: false },
});

// Check status
if (map.pm.Library.isEnabled()) {
  console.log('Library is enabled');
}
```

## Implementation Details

### Files Modified

1. **`src/js/L.PM.Map.js`**
   - Added library configuration to `globalOptions`
   - Added `_initLibraryFromGlobalOptions()` method
   - Added `_handleLibraryOptionsChange()` method
   - Modified `setGlobalOptions()` to handle library changes

2. **`src/js/Library/L.PM.Library.js`**
   - Added `isEnabled()` method
   - Added `updateFromGlobalOptions()` method
   - Enhanced `refreshPanel()` with smart detection
   - Added `loadFromGlobalOptions()` method
   - Added `hasGlobalData()` method
   - Added `getGlobalLibraryOptions()` method
   - Modified `togglePanel()` to respect enabled state

3. **`src/js/Toolbar/L.PM.Toolbar.js`**
   - Modified library button to check enabled state
   - Enhanced `_showHideButtons()` to respect library enabled state

### Demo Files Created

1. **`demo/library-global-options-demo.html`**
   - Comprehensive demo showcasing all new features
   - Interactive controls for testing functionality
   - Event logging and status monitoring

2. **`demo/library-test-simple.html`**
   - Simple test page for verifying functionality
   - Automated tests for key features
   - Manual test buttons for interactive testing

## Backward Compatibility

All existing library functionality remains unchanged. The new features are additive:

- Existing `loadCategoriesJson()` and `loadCategoriesJsonFromUrl()` methods work as before
- Existing event system remains unchanged
- Existing panel functionality is preserved
- Legacy refresh behavior is maintained as fallback

## Events

The library continues to emit all existing events:

- `pm:library-categories-loaded`
- `pm:library-url-loaded`
- `pm:library-url-error`
- `pm:library-panel-opened`
- `pm:library-panel-closed`

## Testing

The implementation includes comprehensive testing through:

1. **Demo Pages**: Interactive testing of all features
2. **Automated Tests**: Built-in test functions in demo pages
3. **Event Monitoring**: Real-time event logging
4. **Error Handling**: Proper error reporting and logging

## Migration Guide

### For Existing Users

No changes required. Existing code will continue to work as before.

### For New Features

To use the new global options integration:

```javascript
// Old way (still works)
map.pm.Library.loadCategoriesJson(data);
map.pm.addControls({ library: true });

// New way (recommended)
map.pm.setGlobalOptions({
  library: {
    enabled: true,
    json: data,
    autoLoad: true,
  },
});
map.pm.addControls({ library: true });
```

## Benefits

1. **Consistent API**: Library now follows the same pattern as measurements
2. **Centralized Configuration**: All library settings in one place
3. **Auto-Loading**: Automatic data loading when enabled
4. **Smart Refresh**: Intelligent refresh based on data source
5. **Better Integration**: Seamless integration with controls system
6. **Improved UX**: Clear enable/disable states and proper error handling
