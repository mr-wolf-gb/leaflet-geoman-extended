/**
 * ItemPlacer component for handling map placement logic
 * Manages creation and placement of different item types (image, svg, font)
 */
const ItemPlacer = L.Class.extend({
  initialize(map) {
    this._map = map;
    this._placedMarkers = [];
    this._selectedItem = null;
    this._cursorMarker = null;
    this._isPlacementMode = false;

    // Bind event handlers
    this._bindMapEvents();
  },

  /**
   * Place an item on the map at specified coordinates or map center
   * @param {Object} item - Item object with type and properties
   * @param {L.LatLng} latlng - Optional coordinates, defaults to map center
   * @returns {L.Marker} The created marker
   */
  placeItem(item, latlng) {
    // Use map center if no coordinates provided
    if (!latlng) {
      latlng = this._map.getCenter();
    }

    try {
      // Create icon based on item type
      const icon = this._createIcon(item);

      // Create marker with the icon
      const marker = L.marker(latlng, { icon });

      // Mark as drawn by Geoman for export/import
      marker._drawnByGeoman = true;

      // Add marker to map
      marker.addTo(this._map);

      // Store reference to placed marker
      this._placedMarkers.push(marker);

      // Emit event for external consumption
      this._map.fire('pm:library-item-added', {
        item: item,
        marker: marker,
        latlng: latlng,
      });

      return marker;
    } catch (error) {
      console.error('Error placing item:', error);

      // Emit error event
      this._map.fire('pm:library-item-added', {
        item: item,
        marker: null,
        latlng: latlng,
        error: error.message,
      });

      return null;
    }
  },

  /**
   * Create icon based on item type
   * Routes to type-specific icon creators
   * @param {Object} item - Item object with type and properties
   * @returns {L.Icon|L.DivIcon} The created icon
   */
  _createIcon(item) {
    if (!item || !item.type) {
      throw new Error('Invalid item: missing type property');
    }

    switch (item.type) {
      case 'image':
        return this._createImageIcon(item);
      case 'svg':
        return this._createSvgIcon(item);
      case 'font':
        return this._createFontIcon(item);
      default:
        throw new Error(`Unsupported item type: ${item.type}`);
    }
  },

  /**
   * Create PNG icon using L.icon
   * @param {Object} item - Item with src, width, height properties
   * @returns {L.Icon} The created image icon
   */
  _createImageIcon(item) {
    if (!item.src) {
      throw new Error('Image item missing src property');
    }

    if (!item.width || !item.height) {
      throw new Error('Image item missing width or height property');
    }

    return L.icon({
      iconUrl: item.src,
      iconSize: [item.width, item.height],
      iconAnchor: [item.width / 2, item.height / 2],
      popupAnchor: [0, -item.height / 2],
    });
  },

  /**
   * Create SVG icon using data URI encoding
   * @param {Object} item - Item with svg property
   * @returns {L.Icon} The created SVG icon
   */
  _createSvgIcon(item) {
    if (!item.svg) {
      throw new Error('SVG item missing svg property');
    }

    try {
      // Encode SVG as data URI
      const svgUrl = 'data:image/svg+xml;base64,' + btoa(item.svg);

      // Use default size if not specified
      const size = item.size || 32;
      const width = item.width || size;
      const height = item.height || size;

      return L.icon({
        iconUrl: svgUrl,
        iconSize: [width, height],
        iconAnchor: [width / 2, height / 2],
        popupAnchor: [0, -height / 2],
      });
    } catch (error) {
      throw new Error(`Failed to encode SVG: ${error.message}`);
    }
  },

  /**
   * Create font-based icon using L.divIcon
   * @param {Object} item - Item with icon class and color properties
   * @returns {L.DivIcon} The created font icon
   */
  _createFontIcon(item) {
    if (!item.icon) {
      throw new Error('Font item missing icon property');
    }

    if (!item.color) {
      throw new Error('Font item missing color property');
    }

    // Use default size if not specified
    const size = item.size || 32;
    const fontSize = item.fontSize || 24;

    return L.divIcon({
      html: `<i class="${item.icon}" style="color: ${item.color}; font-size: ${fontSize}px;"></i>`,
      className: 'leaflet-pm-library-font-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  },

  /**
   * Get all placed markers
   * @returns {Array} Array of placed marker references
   */
  getPlacedMarkers() {
    return this._placedMarkers.slice(); // Return copy to prevent external modification
  },

  /**
   * Clear all placed markers from map and internal array
   */
  clearPlacedMarkers() {
    this._placedMarkers.forEach((marker) => {
      if (this._map.hasLayer(marker)) {
        this._map.removeLayer(marker);
      }
    });
    this._placedMarkers = [];
  },

  /**
   * Remove a specific marker
   * @param {L.Marker} marker - Marker to remove
   */
  removeMarker(marker) {
    const index = this._placedMarkers.indexOf(marker);
    if (index > -1) {
      this._placedMarkers.splice(index, 1);
      if (this._map.hasLayer(marker)) {
        this._map.removeLayer(marker);
      }
    }
  },

  /**
   * Select an item for placement mode
   * @param {Object} item - Item to select
   */
  selectItem(item) {
    // Remove existing cursor marker if selecting a different item
    if (
      this._cursorMarker &&
      this._selectedItem &&
      this._selectedItem.id !== item.id
    ) {
      this._removeCursorMarker();
    }

    this._selectedItem = item;
    this._isPlacementMode = true;

    // Don't create cursor marker immediately - wait for mouse movement

    // Change map cursor
    this._map.getContainer().style.cursor = 'crosshair';

    // Emit selection event
    this._map.fire('pm:library-item-selected', {
      item: item,
    });
  },

  /**
   * Clear current selection and exit placement mode
   */
  clearSelection() {
    this._selectedItem = null;
    this._isPlacementMode = false;

    // Remove cursor marker
    this._removeCursorMarker();

    // Reset map cursor
    this._map.getContainer().style.cursor = '';

    // Emit deselection event
    this._map.fire('pm:library-item-deselected');
  },

  /**
   * Get currently selected item
   * @returns {Object|null} Selected item or null
   */
  getSelectedItem() {
    return this._selectedItem;
  },

  /**
   * Check if in placement mode
   * @returns {boolean} Whether in placement mode
   */
  isPlacementMode() {
    return this._isPlacementMode;
  },

  /**
   * Bind map event handlers
   * @private
   */
  _bindMapEvents() {
    // Handle mouse move for cursor following
    this._map.on('mousemove', this._onMouseMove, this);

    // Handle map click for placement
    this._map.on('click', this._onMapClick, this);

    // Handle escape key to cancel placement
    L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
  },

  /**
   * Handle mouse move event
   * @param {L.MouseEvent} e - Mouse event
   * @private
   */
  _onMouseMove(e) {
    if (!this._isPlacementMode) {
      return;
    }

    // Create cursor marker on first mouse movement if it doesn't exist
    if (!this._cursorMarker) {
      this._createCursorMarker();
    }

    // Update cursor marker position
    if (this._cursorMarker) {
      this._cursorMarker.setLatLng(e.latlng);
    }
  },

  /**
   * Handle map click event
   * @param {L.MouseEvent} e - Mouse event
   * @private
   */
  _onMapClick(e) {
    if (!this._isPlacementMode || !this._selectedItem) {
      return;
    }

    // Place the item at clicked location
    this.placeItem(this._selectedItem, e.latlng);

    // Note: Don't clear selection - allow multiple placements
  },

  /**
   * Handle key down event
   * @param {KeyboardEvent} e - Keyboard event
   * @private
   */
  _onKeyDown(e) {
    if (e.key === 'Escape' && this._isPlacementMode) {
      this.clearSelection();
    }
  },

  /**
   * Create cursor marker for placement preview
   * @private
   */
  _createCursorMarker() {
    if (!this._selectedItem) {
      return;
    }

    // Remove existing cursor marker if it exists
    if (this._cursorMarker) {
      this._removeCursorMarker();
    }

    try {
      // Create semi-transparent icon for cursor
      const icon = this._createIcon(this._selectedItem);

      // Create cursor marker at map center initially (will be moved by mouse)
      this._cursorMarker = L.marker(this._map.getCenter(), {
        icon: icon,
        interactive: false,
        opacity: 0.7,
      });

      // Add to map
      this._cursorMarker.addTo(this._map);
    } catch (error) {
      console.error('Error creating cursor marker:', error);
    }
  },

  /**
   * Remove cursor marker
   * @private
   */
  _removeCursorMarker() {
    if (this._cursorMarker) {
      this._map.removeLayer(this._cursorMarker);
      this._cursorMarker = null;
    }
  },

  /**
   * Clean up resources
   */
  remove() {
    // Remove event listeners
    this._map.off('mousemove', this._onMouseMove, this);
    this._map.off('click', this._onMapClick, this);
    L.DomEvent.off(document, 'keydown', this._onKeyDown, this);

    // Clear selection
    this.clearSelection();

    // Clear placed markers
    this.clearPlacedMarkers();
  },
});

export default ItemPlacer;
