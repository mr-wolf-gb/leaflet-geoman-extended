const GlobalCopyLayerMode = {
  _globalCopyLayerModeEnabled: false,
  _sourceLayer: null,
  _copyLayer: null,
  _sourceCenter: null,

  enableGlobalCopyLayerMode() {
    this._globalCopyLayerModeEnabled = true;
    this._sourceLayer = null;
    this._copyLayer = null;
    this._sourceCenter = null;

    // Add cursor style
    L.DomUtil.addClass(this.map._container, 'geoman-copy-cursor');

    // Add layer click handlers to select source
    const layers = L.PM.Utils.findLayers(this.map);
    layers.forEach((layer) => {
      if (this._isRelevantForCopy(layer)) {
        this._addLayerClickHandler(layer);
      }
    });

    // Handle new layers
    this.map.on('layeradd', this._handleLayerAddForCopy, this);

    // Toggle the button in the toolbar
    this.Toolbar.toggleButton(
      'copyLayerMode',
      this.globalCopyLayerModeEnabled()
    );

    this._fireGlobalCopyLayerModeToggled(true);
  },

  disableGlobalCopyLayerMode() {
    this._globalCopyLayerModeEnabled = false;

    // Remove cursor style
    L.DomUtil.removeClass(this.map._container, 'geoman-copy-cursor');

    // Remove handlers
    this.map.off('click', this._placeCopyLayer, this);
    this.map.off('mousemove', this._updateCopyLayerPosition, this);
    this.map.off('layeradd', this._handleLayerAddForCopy, this);

    // Remove layer click handlers
    const layers = L.PM.Utils.findLayers(this.map);
    layers.forEach((layer) => {
      this._removeLayerClickHandler(layer);
    });

    // Clean up temporary copy layer
    if (this._copyLayer && this.map.hasLayer(this._copyLayer)) {
      this.map.removeLayer(this._copyLayer);
    }

    this._sourceLayer = null;
    this._copyLayer = null;
    this._sourceCenter = null;

    // Toggle the button in the toolbar
    this.Toolbar.toggleButton(
      'copyLayerMode',
      this.globalCopyLayerModeEnabled()
    );

    this._fireGlobalCopyLayerModeToggled(false);
  },

  globalCopyLayerModeEnabled() {
    return !!this._globalCopyLayerModeEnabled;
  },

  toggleGlobalCopyLayerMode() {
    if (this.globalCopyLayerModeEnabled()) {
      this.disableGlobalCopyLayerMode();
    } else {
      this.enableGlobalCopyLayerMode();
    }
  },

  resetCopyLayerMode() {
    if (this._copyLayer && this.map.hasLayer(this._copyLayer)) {
      this.map.removeLayer(this._copyLayer);
    }
    this._sourceLayer = null;
    this._copyLayer = null;
    this._sourceCenter = null;

    // Remove map click handler for placing
    this.map.off('click', this._placeCopyLayer, this);
    this.map.off('mousemove', this._updateCopyLayerPosition, this);
  },

  _onLayerClick(e) {
    // Stop propagation to prevent map click
    L.DomEvent.stopPropagation(e);

    if (!this._globalCopyLayerModeEnabled) {
      return;
    }

    // Get the layer that was clicked
    const layer = e.target;

    // If we already have this layer selected, ignore
    if (this._sourceLayer === layer) {
      return;
    }

    // Clean up previous copy if exists
    if (this._copyLayer && this.map.hasLayer(this._copyLayer)) {
      this.map.removeLayer(this._copyLayer);
    }

    // Set new source layer
    this._sourceLayer = layer;

    // Calculate and store the source center for offset calculations
    this._sourceCenter = this._calculateSourceCenter();

    this._createCopyLayer();

    // Remove old handlers and add new ones
    this.map.off('click', this._placeCopyLayer, this);
    this.map.off('mousemove', this._updateCopyLayerPosition, this);

    this.map.on('click', this._placeCopyLayer, this);
    this.map.on('mousemove', this._updateCopyLayerPosition, this);
  },

  _createCopyLayer() {
    if (!this._sourceLayer) {
      return;
    }

    const sourceLayer = this._sourceLayer;
    let copyLayer;

    // Create a copy based on layer type
    if (sourceLayer instanceof L.Marker) {
      copyLayer = L.marker(sourceLayer.getLatLng(), {
        ...sourceLayer.options,
      });
      if (sourceLayer.getIcon()) {
        copyLayer.setIcon(sourceLayer.getIcon());
      }

      // Handle text markers in preview
      if (sourceLayer.pm && sourceLayer.pm.textArea) {
        const sourceTextArea = sourceLayer.pm.textArea;
        const newTextArea = sourceTextArea.cloneNode(true);
        const textAreaIcon = L.divIcon({
          className: 'pm-text-marker',
          html: newTextArea,
        });
        copyLayer.setIcon(textAreaIcon);
      }
    } else if (sourceLayer instanceof L.Circle) {
      copyLayer = L.circle(sourceLayer.getLatLng(), {
        ...sourceLayer.options,
        radius: sourceLayer.getRadius(),
      });
    } else if (
      sourceLayer instanceof L.CircleMarker &&
      !(sourceLayer instanceof L.Circle)
    ) {
      copyLayer = L.circleMarker(sourceLayer.getLatLng(), {
        ...sourceLayer.options,
      });
    } else if (sourceLayer instanceof L.Rectangle) {
      copyLayer = L.rectangle(sourceLayer.getBounds(), {
        ...sourceLayer.options,
      });
    } else if (sourceLayer instanceof L.Polygon) {
      copyLayer = L.polygon(sourceLayer.getLatLngs(), {
        ...sourceLayer.options,
      });
    } else if (
      sourceLayer instanceof L.Arrow ||
      (sourceLayer.pm && sourceLayer.pm._shape === 'Arrow')
    ) {
      // Create Arrow preview with arrowhead
      copyLayer = new L.Arrow(sourceLayer.getLatLngs(), {
        ...sourceLayer.options,
        arrowheadSize: sourceLayer.getArrowheadSize
          ? sourceLayer.getArrowheadSize()
          : sourceLayer.options.arrowheadSize || 12,
        arrowheadAngle: sourceLayer.getArrowheadAngle
          ? sourceLayer.getArrowheadAngle()
          : sourceLayer.options.arrowheadAngle || 60,
      });
    } else if (sourceLayer instanceof L.Polyline) {
      copyLayer = L.polyline(sourceLayer.getLatLngs(), {
        ...sourceLayer.options,
      });
    }

    if (copyLayer) {
      // Mark as temporary
      copyLayer._pmTempLayer = true;
      copyLayer.options.opacity = 0.5;
      if (copyLayer.setStyle) {
        copyLayer.setStyle({ opacity: 0.5, fillOpacity: 0.3 });
      }

      this._copyLayer = copyLayer;
      this._copyLayer.addTo(this.map);
    }
  },

  _updateCopyLayerPosition(e) {
    if (!this._copyLayer || !this._sourceCenter) {
      return;
    }

    if (
      this._copyLayer instanceof L.Marker ||
      this._copyLayer instanceof L.CircleMarker
    ) {
      this._copyLayer.setLatLng(e.latlng);
    } else if (this._copyLayer instanceof L.Circle) {
      this._copyLayer.setLatLng(e.latlng);
    } else if (this._copyLayer.getLatLngs) {
      // For polylines and polygons, offset all coordinates
      const newLatLngs = this._offsetLatLngs(
        this._sourceLayer.getLatLngs(),
        this._sourceCenter,
        e.latlng
      );
      this._copyLayer.setLatLngs(newLatLngs);
    }
  },

  _calculateSourceCenter() {
    if (!this._sourceLayer) {
      return null;
    }

    let sourceCenter;
    if (this._sourceLayer.getLatLng) {
      sourceCenter = this._sourceLayer.getLatLng();
    } else if (this._sourceLayer.getBounds) {
      sourceCenter = this._sourceLayer.getBounds().getCenter();
    } else if (this._sourceLayer.getLatLngs) {
      const latlngs = this._flattenLatLngs(this._sourceLayer.getLatLngs());
      const bounds = L.latLngBounds(latlngs);
      sourceCenter = bounds.getCenter();
    }

    return sourceCenter;
  },

  _offsetLatLngs(latlngs, sourceCenter, targetCenter) {
    const offsetLat = targetCenter.lat - sourceCenter.lat;
    const offsetLng = targetCenter.lng - sourceCenter.lng;

    const offset = (coords) => {
      // Handle nested arrays (for polygons with holes)
      if (Array.isArray(coords)) {
        // Check if first element is an array or LatLng
        if (
          coords.length > 0 &&
          (Array.isArray(coords[0]) || coords[0].lat !== undefined)
        ) {
          return coords.map(offset);
        }
      }

      // Handle LatLng object
      if (coords && coords.lat !== undefined && coords.lng !== undefined) {
        return L.latLng(coords.lat + offsetLat, coords.lng + offsetLng);
      }

      return coords;
    };

    return offset(latlngs);
  },

  _placeCopyLayer(e) {
    // Stop propagation to prevent triggering layer clicks
    L.DomEvent.stopPropagation(e);

    if (!this._copyLayer || !this._sourceCenter) {
      return;
    }

    // Create the final copy
    const sourceLayer = this._sourceLayer;
    let newLayer;
    const shape = this._getShapeType(sourceLayer);

    if (sourceLayer instanceof L.Marker) {
      newLayer = L.marker(e.latlng, {
        ...sourceLayer.options,
      });
      if (sourceLayer.getIcon()) {
        newLayer.setIcon(sourceLayer.getIcon());
      }

      // Handle text markers specially
      if (sourceLayer.pm && sourceLayer.pm.textArea) {
        // Clone the text area
        const sourceTextArea = sourceLayer.pm.textArea;
        const newTextArea = sourceTextArea.cloneNode(true);

        // Create new icon with cloned text area
        const textAreaIcon = L.divIcon({
          className: 'pm-text-marker',
          html: newTextArea,
        });
        newLayer.setIcon(textAreaIcon);

        // Mark as text marker
        newLayer.options.textMarker = true;
        newLayer.options._textMarkerOverPM = true;
      }
    } else if (sourceLayer instanceof L.Circle) {
      newLayer = L.circle(e.latlng, {
        ...sourceLayer.options,
        radius: sourceLayer.getRadius(),
      });
    } else if (
      sourceLayer instanceof L.CircleMarker &&
      !(sourceLayer instanceof L.Circle)
    ) {
      newLayer = L.circleMarker(e.latlng, {
        ...sourceLayer.options,
      });
    } else if (sourceLayer instanceof L.Rectangle) {
      const offsetLat = e.latlng.lat - this._sourceCenter.lat;
      const offsetLng = e.latlng.lng - this._sourceCenter.lng;
      const bounds = sourceLayer.getBounds();
      const newBounds = L.latLngBounds(
        L.latLng(bounds.getSouth() + offsetLat, bounds.getWest() + offsetLng),
        L.latLng(bounds.getNorth() + offsetLat, bounds.getEast() + offsetLng)
      );
      newLayer = L.rectangle(newBounds, {
        ...sourceLayer.options,
      });
    } else if (sourceLayer instanceof L.Polygon) {
      const newLatLngs = this._offsetLatLngs(
        sourceLayer.getLatLngs(),
        this._sourceCenter,
        e.latlng
      );
      newLayer = L.polygon(newLatLngs, {
        ...sourceLayer.options,
      });
    } else if (
      sourceLayer instanceof L.Arrow ||
      (sourceLayer.pm && sourceLayer.pm._shape === 'Arrow')
    ) {
      // Handle Arrow specially to preserve arrowhead
      const newLatLngs = this._offsetLatLngs(
        sourceLayer.getLatLngs(),
        this._sourceCenter,
        e.latlng
      );
      newLayer = new L.Arrow(newLatLngs, {
        ...sourceLayer.options,
        arrowheadSize: sourceLayer.getArrowheadSize
          ? sourceLayer.getArrowheadSize()
          : sourceLayer.options.arrowheadSize || 12,
        arrowheadAngle: sourceLayer.getArrowheadAngle
          ? sourceLayer.getArrowheadAngle()
          : sourceLayer.options.arrowheadAngle || 60,
      });
      // Mark as Arrow for PM
      if (newLayer.pm) {
        newLayer.pm._shape = 'Arrow';
      }
    } else if (sourceLayer instanceof L.Polyline) {
      const newLatLngs = this._offsetLatLngs(
        sourceLayer.getLatLngs(),
        this._sourceCenter,
        e.latlng
      );
      newLayer = L.polyline(newLatLngs, {
        ...sourceLayer.options,
      });
    }

    if (newLayer) {
      // Restore full opacity
      delete newLayer._pmTempLayer;
      newLayer.options.opacity = sourceLayer.options.opacity || 1;
      if (newLayer.setStyle) {
        newLayer.setStyle({
          opacity: sourceLayer.options.opacity || 1,
          fillOpacity: sourceLayer.options.fillOpacity || 0.2,
        });
      }

      // Add to map
      const containingLayer = this._getContainingLayer();
      newLayer.addTo(containingLayer);

      // Initialize PM on the new layer with global options
      if (newLayer.pm) {
        // First set global options
        newLayer.pm.setOptions(this.globalOptions);

        // Copy all PM options from source layer including measurements
        if (sourceLayer.pm && sourceLayer.pm.options) {
          const sourceOptions = { ...sourceLayer.pm.options };
          newLayer.pm.setOptions(sourceOptions);
        }

        // Initialize measurements if the method exists
        if (typeof newLayer.pm._initMeasurements === 'function') {
          newLayer.pm._initMeasurements();
        }

        // Special handling for text markers
        if (sourceLayer.pm && sourceLayer.pm.textArea && newLayer.pm) {
          // Get the text area from the icon
          const iconElement = newLayer.getElement();
          if (iconElement) {
            const textArea = iconElement.querySelector('.pm-textarea');
            if (textArea) {
              newLayer.pm.textArea = textArea;
              newLayer.pm.isRichText = sourceLayer.pm.isRichText;

              // Copy text-specific options
              if (sourceLayer.pm.options) {
                newLayer.pm.setOptions({
                  backgroundColor: sourceLayer.pm.options.backgroundColor,
                  fontSize: sourceLayer.pm.options.fontSize,
                  removeIfEmpty: sourceLayer.pm.options.removeIfEmpty,
                });
              }

              // Initialize text marker functionality
              if (typeof newLayer.pm._createTextMarker === 'function') {
                newLayer.pm._createTextMarker(false);
              }
            }
          }
        }

        // Don't enable PM (that would put it in edit mode)
        // Measurements should show on hover with the options set above
      }

      // Attach context menu to the new layer
      if (this.Toolbar._contextMenu) {
        this.Toolbar._contextMenu.attachLayerContextMenu(newLayer);
      }

      // Add click handler for copy mode if still enabled
      if (
        this._globalCopyLayerModeEnabled &&
        this._isRelevantForCopy(newLayer)
      ) {
        this._addLayerClickHandler(newLayer);
      }

      // Fire copy event
      this.map.fire('pm:copylayer', {
        sourceLayer,
        newLayer,
        shape,
      });
    }

    // Keep the preview for making more copies
    // User can click finish button or select a different layer
  },

  _getShapeType(layer) {
    // Check for text marker first (it's a special marker)
    if (layer instanceof L.Marker && layer.pm && layer.pm.textArea) {
      return 'Text';
    }
    if (layer instanceof L.Marker) {
      return 'Marker';
    }
    if (layer instanceof L.Circle && !(layer instanceof L.CircleMarker)) {
      return 'Circle';
    }
    if (layer instanceof L.CircleMarker) {
      return 'CircleMarker';
    }
    if (layer instanceof L.Rectangle) {
      return 'Rectangle';
    }
    if (layer instanceof L.Polygon) {
      return 'Polygon';
    }
    // Check if it's an Arrow before checking Polyline (Arrow extends Polyline)
    if (layer instanceof L.Arrow || (layer.pm && layer.pm._shape === 'Arrow')) {
      return 'Arrow';
    }
    if (layer instanceof L.Polyline) {
      return 'Line';
    }
    return 'Unknown';
  },

  _layerContainsPoint(layer, latlng) {
    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
      const layerPoint = this.map.latLngToLayerPoint(layer.getLatLng());
      const clickPoint = this.map.latLngToLayerPoint(latlng);
      const distance = layerPoint.distanceTo(clickPoint);
      return distance < 10; // 10 pixel tolerance
    }

    if (layer instanceof L.Circle) {
      const distance = layer.getLatLng().distanceTo(latlng);
      return distance <= layer.getRadius();
    }

    if (layer.getBounds) {
      return layer.getBounds().contains(latlng);
    }

    return false;
  },

  _flattenLatLngs(latlngs) {
    const flat = [];
    const flatten = (coords) => {
      if (Array.isArray(coords)) {
        coords.forEach((coord) => {
          if (coord.lat !== undefined) {
            flat.push(coord);
          } else {
            flatten(coord);
          }
        });
      }
    };
    flatten(latlngs);
    return flat;
  },

  _addLayerClickHandler(layer) {
    if (!layer._pmCopyClickHandler) {
      layer._pmCopyClickHandler = this._onLayerClick.bind(this);
      layer.on('click', layer._pmCopyClickHandler);
    }
  },

  _removeLayerClickHandler(layer) {
    if (layer._pmCopyClickHandler) {
      layer.off('click', layer._pmCopyClickHandler);
      delete layer._pmCopyClickHandler;
    }
  },

  _handleLayerAddForCopy({ layer }) {
    if (this.globalCopyLayerModeEnabled() && this._isRelevantForCopy(layer)) {
      this._addLayerClickHandler(layer);
    }
  },

  _isRelevantForCopy(layer) {
    return (
      layer.pm &&
      !(layer instanceof L.LayerGroup) &&
      ((!L.PM.optIn && !layer.options.pmIgnore) ||
        (L.PM.optIn && layer.options.pmIgnore === false)) &&
      !layer._pmTempLayer
    );
  },
};

export default GlobalCopyLayerMode;
