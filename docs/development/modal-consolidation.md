# Modal Style Consolidation

## Overview

All modal styles in Leaflet-Geoman have been consolidated into a single unified CSS file for better maintainability and consistency.

## Changes Made

### New File Created

- **`src/css/modals.css`** - Unified modal stylesheet containing all modal-related styles

### Files Modified

1. **`src/js/L.PM.js`** - Updated CSS imports to use the new unified modal file
2. **`src/css/rtl.css`** - Removed modal-specific RTL styles (now in modals.css)

### Files Removed from Import

The following files are no longer imported:

- `src/css/text-modal.css` - All styles moved to modals.css
- `src/css/style-modal.css` - All styles moved to modals.css
- `src/css/distance-line.css` - All styles moved to modals.css (including distance labels)

### Files Modified (Partial Migration)

- `src/css/dangerous-goods.css` - Modal styles removed (moved to modals.css), but icon and zone styles remain

## Modals Included

The unified `modals.css` file includes styles for:

1. **Text Modal** (`pm-text-modal`)
   - Rich text editor with Quill integration
   - Color and number inputs
   - Text formatting controls

2. **Style Modal** (`pm-style-modal`)
   - Tabbed interface for style editing
   - Color picker integration
   - Range sliders for opacity, weight, etc.
   - Pattern selection grid
   - Select dropdowns for line styles

3. **Distance Modal** (`geoman-distance-modal`)
   - Distance input fields
   - Unit selection dropdown
   - Start/Cancel actions
   - Distance labels on map

4. **Context Modal** (`leaflet-pm-context-modal`)
   - Context menu modal overlay
   - Data tables and content display
   - Close button functionality

5. **Dangerous Goods Modal** (`leaflet-pm-modal`)
   - Zone configuration modal
   - Header, body, footer structure

## Non-Modal Styles Included

The file also includes related non-modal styles:

- **Distance Labels** (`geoman-distance-label`) - Labels displayed on the map showing distances
- These were included because they're closely related to the distance modal functionality

## RTL Support

All modal RTL (Right-to-Left) styles are included in the unified `modals.css` file:

- Modal direction and text alignment
- Form field layouts (reversed)
- Button positioning (reversed)
- Tab navigation (reversed)
- Input field alignment
- Close button positioning
- Proper handling of LTR elements (numbers, color pickers, pattern grids)

## Benefits

1. **Single Source of Truth** - All modal styles in one place
2. **Consistency** - Shared base styles ensure uniform appearance
3. **Maintainability** - Easier to update modal styles globally
4. **Reduced Duplication** - Common patterns defined once
5. **Better Organization** - Clear structure with comments
6. **Complete RTL Support** - All modal RTL styles consolidated

## Structure

The `modals.css` file is organized into sections:

```
1. Base Modal Overlay Styles
2. Base Modal Container Styles
3. Modal Content Padding
4. Modal Header Styles
5. Modal Title Styles
6. Modal Close Button Styles
7. Modal Tabs (Style Modal)
8. Modal Sections
9. Text Editor Container (Text Modal)
10. Form Field Containers
11. Input Styles (Color, Number, Range, Select)
12. Pattern Grid (Style Modal)
13. Modal Buttons
14. Context Modal Content Styles
15. Responsive Styles
16. RTL (Right-to-Left) Support
17. Distance Label Styles (Non-Modal)
```

## Testing Recommendations

Test the following scenarios to ensure everything works correctly:

1. **Text Modal**
   - Open text editor
   - Test rich text formatting
   - Verify color picker works
   - Test font size controls
   - Check RTL mode

2. **Style Modal**
   - Open style editor
   - Switch between tabs
   - Test color picker
   - Adjust range sliders
   - Select patterns
   - Check RTL mode

3. **Distance Modal**
   - Open distance line tool
   - Enter distance values
   - Change units
   - Check RTL mode

4. **Context Modal**
   - Right-click on layers
   - View context information
   - Check table display
   - Check RTL mode

5. **Dangerous Goods Modal**
   - Create dangerous goods zones
   - Configure zone settings
   - Check RTL mode

6. **Responsive Behavior**
   - Test on mobile viewport (< 640px)
   - Test on tablet viewport (< 768px)
   - Verify modal scaling

7. **RTL Mode**
   - Enable RTL mode
   - Test all modals
   - Verify proper text alignment
   - Check button positioning
   - Verify form field layouts

## Migration Notes

If you need to add new modal styles:

1. Add them to `src/css/modals.css`
2. Follow the existing structure and naming conventions
3. Include RTL support in the RTL section
4. Add responsive styles if needed
5. Document the new modal in this file

## Rollback

If you need to rollback to the old structure:

1. Restore the CSS imports in `src/js/L.PM.js`:

   ```javascript
   import '../css/text-modal.css';
   import '../css/style-modal.css';
   import '../css/distance-line.css';
   import '../css/dangerous-goods.css';
   ```

2. Restore modal RTL styles in `src/css/rtl.css`

3. Remove or comment out the `modals.css` import
