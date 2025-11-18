import { getTranslation } from '../helpers';
import StyleModal from '../helpers/StyleModal';
import InfoModal from '../helpers/InfoModal';
import { patternRenderer } from '../helpers/PatternRenderer';

const ContextMenu = L.Class.extend({
  initialize(map) {
    this.map = map;
    this._contextMenu = null;
    this._currentButton = null;
    this._infoModal = new InfoModal();
    this._mapClickListenerAttached = false;
    this._markerZIndexCounter = 1000; // Track z-index for markers

    // Delay enableAutoFinishEditing to ensure map is fully initialized
    setTimeout(() => {
      this.enableAutoFinishEditing();
    }, 0);
  },

  _showModal(title, content) {
    this._infoModal.show(title, content);
  },

  show(e, button, buttonName) {
    e.preventDefault();
    e.stopPropagation();

    this._currentButton = button;
    this._currentButtonName = buttonName;

    // Remove existing context menu if any
    this.hide();

    // Create context menu
    this._contextMenu = L.DomUtil.create('div', 'leaflet-pm-context-menu');

    // Get menu items based on button type
    const menuItems = this._getMenuItems(buttonName, button);

    // Create menu items
    menuItems.forEach((item) => {
      if (item.separator) {
        const separator = L.DomUtil.create(
          'div',
          'leaflet-pm-context-menu-separator',
          this._contextMenu
        );
      } else {
        const menuItem = L.DomUtil.create(
          'div',
          'leaflet-pm-context-menu-item',
          this._contextMenu
        );
        menuItem.textContent = item.text;

        if (item.disabled) {
          L.DomUtil.addClass(menuItem, 'disabled');
        } else {
          L.DomEvent.on(menuItem, 'click', (evt) => {
            evt.stopPropagation();
            item.onClick.call(this, button, buttonName);
            this.hide();
          });
        }
      }
    });

    // Position the context menu
    this._contextMenu.style.position = 'fixed';
    this._contextMenu.style.left = e.clientX + 'px';
    this._contextMenu.style.top = e.clientY + 'px';

    document.body.appendChild(this._contextMenu);

    // Adjust position if menu goes off screen
    const rect = this._contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this._contextMenu.style.left = window.innerWidth - rect.width - 10 + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      this._contextMenu.style.top =
        window.innerHeight - rect.height - 10 + 'px';
    }

    // Close menu when clicking outside
    setTimeout(() => {
      L.DomEvent.on(document, 'click', this._onDocumentClick, this);
      L.DomEvent.on(document, 'contextmenu', this._onDocumentClick, this);
    }, 0);
  },

  hide() {
    if (this._contextMenu) {
      L.DomEvent.off(document, 'click', this._onDocumentClick, this);
      L.DomEvent.off(document, 'contextmenu', this._onDocumentClick, this);
      this._contextMenu.remove();
      this._contextMenu = null;
    }
  },

  _onDocumentClick() {
    this.hide();
  },

  // Layer context menu methods
  showLayerContextMenu(e, layer) {
    e.originalEvent.preventDefault();
    e.originalEvent.stopPropagation();

    this._currentLayer = layer;

    // Remove existing context menu if any
    this.hide();

    // Create context menu
    this._contextMenu = L.DomUtil.create('div', 'leaflet-pm-context-menu');

    // Get menu items based on layer type
    const menuItems = this._getLayerMenuItems(layer);

    // Create menu items
    menuItems.forEach((item) => {
      if (item.separator) {
        L.DomUtil.create(
          'div',
          'leaflet-pm-context-menu-separator',
          this._contextMenu
        );
      } else {
        const menuItem = L.DomUtil.create(
          'div',
          'leaflet-pm-context-menu-item',
          this._contextMenu
        );
        menuItem.textContent = item.text;

        if (item.disabled) {
          L.DomUtil.addClass(menuItem, 'disabled');
        } else {
          L.DomEvent.on(menuItem, 'click', (evt) => {
            evt.stopPropagation();
            item.onClick.call(this, layer);
            this.hide();
          });
        }
      }
    });

    // Position the context menu
    this._contextMenu.style.position = 'fixed';
    this._contextMenu.style.left = e.originalEvent.clientX + 'px';
    this._contextMenu.style.top = e.originalEvent.clientY + 'px';

    document.body.appendChild(this._contextMenu);

    // Adjust position if menu goes off screen
    const rect = this._contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this._contextMenu.style.left = window.innerWidth - rect.width - 10 + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      this._contextMenu.style.top =
        window.innerHeight - rect.height - 10 + 'px';
    }

    // Close menu when clicking outside
    setTimeout(() => {
      L.DomEvent.on(document, 'click', this._onDocumentClick, this);
      L.DomEvent.on(document, 'contextmenu', this._onDocumentClick, this);
    }, 0);
  },

  _getLayerMenuItems(layer) {
    const items = [];
    const layerType = this._getLayerType(layer);

    // Check if layer is currently being edited
    const isEditing = layer.pm && layer.pm.enabled();

    // Check if this is a Text layer
    const isTextLayer = layer.pm && layer.pm._shape === 'Text';

    // Common actions for all layers
    if (isTextLayer) {
      // Special handling for Text layers - show edit modal
      items.push({
        text: getTranslation('contextMenu.editText'),
        onClick: (lyr) => {
          // Trigger the text edit modal
          if (lyr.pm && lyr.pm._shape === 'Text' && lyr.pm._showEditModal) {
            // Disable any current editing first
            this._disableAllLayerEditing();
            // Show the text edit modal
            lyr.pm._showEditModal();
          }
        },
      });
    } else {
      // Regular edit for non-text layers
      items.push({
        text: isEditing
          ? getTranslation('contextMenu.finishEditing')
          : getTranslation('contextMenu.edit'),
        onClick: (lyr) => {
          if (lyr.pm) {
            if (lyr.pm.enabled()) {
              lyr.pm.disable();
            } else {
              // Disable editing on all other layers first
              this._disableAllLayerEditing();
              lyr.pm.enable();
            }
          }
        },
      });
    }

    // Move action
    items.push({
      text: getTranslation('contextMenu.move'),
      onClick: (lyr) => {
        // Disable any current editing
        this._disableAllLayerEditing();

        // Enable dragging for the layer
        if (lyr.pm && lyr.pm.enableLayerDrag) {
          lyr.pm.enableLayerDrag();
        } else if (lyr.dragging) {
          lyr.dragging.enable();
        }

        // For markers, just enable dragging
        if (lyr instanceof L.Marker) {
          lyr.dragging.enable();
        }
      },
    });

    // Rotate action (for shapes that support it)
    if (
      !isTextLayer &&
      layerType !== 'Marker' &&
      layerType !== 'CircleMarker' &&
      layerType !== 'Circle'
    ) {
      items.push({
        text: getTranslation('contextMenu.rotate'),
        onClick: (lyr) => {
          // Disable any current editing
          this._disableAllLayerEditing();

          // Enable rotation
          if (lyr.pm && lyr.pm.enableRotate) {
            lyr.pm.enableRotate();
          }
        },
      });
    }

    // Edit Style action (for shapes that have style properties)
    if (this._layerHasStyle(layer)) {
      items.push({
        text: getTranslation('contextMenu.editStyle'),
        onClick: (lyr) => {
          this._showStyleEditor(lyr);
        },
      });
    }

    items.push({ separator: true });

    items.push({
      text: getTranslation('contextMenu.delete'),
      onClick: (lyr) => {
        if (
          confirm(
            getTranslation('confirmations.deleteLayer').replace(
              '{layerType}',
              layerType
            )
          )
        ) {
          this.map.removeLayer(lyr);
        }
      },
    });

    items.push({ separator: true });

    items.push({
      text: getTranslation('contextMenu.bringToFront'),
      onClick: (lyr) => {
        this._bringMarkerToFront(lyr);
      },
    });

    items.push({
      text: getTranslation('contextMenu.bringToBack'),
      onClick: (lyr) => {
        this._bringMarkerToBack(lyr);
      },
    });

    items.push({ separator: true });

    items.push({
      text: getTranslation('contextMenu.duplicate'),
      onClick: (lyr) => {
        this._duplicateLayer(lyr);
      },
    });

    // Layer-specific items
    if (layerType === 'Polygon' || layerType === 'Rectangle') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.showArea'),
        onClick: (lyr) => {
          this._showLayerArea(lyr);
        },
      });
    }

    if (layerType === 'Circle') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.showRadius'),
        onClick: (lyr) => {
          this._showCircleRadius(lyr);
        },
      });
    }

    if (layerType === 'Polyline' || layerType === 'Line') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.showLength'),
        onClick: (lyr) => {
          this._showLineLength(lyr);
        },
      });
    }

    items.push({ separator: true });

    items.push({
      text: getTranslation('contextMenu.showCoordinates'),
      onClick: (lyr) => {
        this._showLayerCoordinates(lyr);
      },
    });

    items.push({
      text: getTranslation('contextMenu.centerMapHere'),
      onClick: (lyr) => {
        this._centerMapOnLayer(lyr);
      },
    });

    return items;
  },

  _getLayerType(layer) {
    if (layer instanceof L.Marker) {
      return 'Marker';
    } else if (layer instanceof L.Circle) {
      return 'Circle';
    } else if (layer instanceof L.Rectangle) {
      return 'Rectangle';
    } else if (layer instanceof L.Polygon) {
      return 'Polygon';
    } else if (layer instanceof L.Polyline) {
      return 'Polyline';
    } else if (layer instanceof L.CircleMarker) {
      return 'CircleMarker';
    }
    return 'Layer';
  },

  _duplicateLayer(layer) {
    // Store the original layer for duplication
    this._layerToDuplicate = layer;

    // Store original style properties
    this._originalLayerOptions = { ...layer.options };

    // Disable any current editing
    this._disableAllLayerEditing();

    // Check if this is a Text layer
    const isTextLayer = layer.pm && layer.pm._shape === 'Text';

    let hintLayer;

    if (isTextLayer) {
      // Handle Text layer duplication
      const latlng = layer.getLatLng();

      // Clone the text area element
      const originalTextArea = layer.pm.textArea;
      const newTextArea = originalTextArea.cloneNode(true);

      // Create the text icon
      const textAreaIcon = L.divIcon({
        className: 'pm-text-marker',
        html: newTextArea,
      });

      // Create hint marker with text properties
      hintLayer = L.marker(latlng, {
        ...layer.options,
        textMarker: true,
        _textMarkerOverPM: true,
        icon: textAreaIcon,
        opacity: 0.6,
      });

      hintLayer._pmTempLayer = true;
      hintLayer._isDuplicateHint = true;
      hintLayer._duplicateTextArea = newTextArea;
      hintLayer._duplicateIsRichText = layer.pm.isRichText;
      hintLayer._duplicateOptions = {
        removeIfEmpty: layer.pm.options.removeIfEmpty ?? true,
        backgroundColor: layer.pm.options.backgroundColor,
        fontSize: layer.pm.options.fontSize,
      };
    } else if (layer instanceof L.Marker) {
      const latlng = layer.getLatLng();
      hintLayer = L.marker(latlng, {
        ...layer.options,
        opacity: 0.6,
      });
      hintLayer._pmTempLayer = true;
      hintLayer._isDuplicateHint = true;
    } else if (layer instanceof L.Circle) {
      const latlng = layer.getLatLng();
      hintLayer = L.circle(latlng, {
        ...layer.options,
        radius: layer.getRadius(),
        opacity: 0.4,
        fillOpacity: 0.2,
      });
      hintLayer._pmTempLayer = true;
      hintLayer._isDuplicateHint = true;
      hintLayer._duplicateRadius = layer.getRadius();
    } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
      const latlngs = layer.getLatLngs();

      if (layer instanceof L.Polygon) {
        hintLayer = L.polygon(latlngs, {
          ...layer.options,
          opacity: 0.4,
          fillOpacity: 0.2,
        });
      } else {
        hintLayer = L.polyline(latlngs, {
          ...layer.options,
          opacity: 0.4,
        });
      }
      hintLayer._pmTempLayer = true;
      hintLayer._isDuplicateHint = true;
      hintLayer._originalLatLngs = latlngs;
    }

    if (hintLayer) {
      // Add hint layer to map
      hintLayer.addTo(this.map);
      this._duplicateHintLayer = hintLayer;

      // Change cursor
      this.map.getContainer().classList.add('geoman-draw-cursor');

      // Track mouse movement to update hint layer position
      this.map.on('mousemove', this._syncDuplicateHintLayer, this);

      // Place the duplicated layer on click
      this.map.on('click', this._placeDuplicatedLayer, this);

      // Cancel on Escape key
      L.DomEvent.on(document, 'keydown', this._cancelDuplication, this);
    }
  },

  _syncDuplicateHintLayer(e) {
    if (!this._duplicateHintLayer) {
      return;
    }

    const layer = this._duplicateHintLayer;

    if (layer instanceof L.Marker) {
      // Move marker to cursor position
      layer.setLatLng(e.latlng);
    } else if (layer instanceof L.Circle) {
      // Move circle to cursor position
      layer.setLatLng(e.latlng);
    } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
      // Calculate offset from original position
      const originalLatLngs = layer._originalLatLngs;
      const originalCenter = this._getCenter(originalLatLngs);
      const offset = {
        lat: e.latlng.lat - originalCenter.lat,
        lng: e.latlng.lng - originalCenter.lng,
      };

      // Apply offset to all coordinates
      const newLatLngs = this._offsetLatLngs(
        originalLatLngs,
        offset.lat,
        offset.lng
      );
      layer.setLatLngs(newLatLngs);
    }
  },

  _placeDuplicatedLayer(e) {
    if (!this._duplicateHintLayer) {
      return;
    }

    const hintLayer = this._duplicateHintLayer;
    const originalOptions = this._originalLayerOptions;
    let newLayer;

    // Check if this is a Text layer
    const isTextLayer =
      hintLayer._isDuplicateHint && hintLayer.options.textMarker;

    if (isTextLayer) {
      // Create the text icon
      const textAreaIcon = L.divIcon({
        className: 'pm-text-marker',
        html: hintLayer._duplicateTextArea,
      });

      // Create new marker with text properties using original options
      newLayer = L.marker(e.latlng, {
        ...originalOptions,
        textMarker: true,
        _textMarkerOverPM: true,
        icon: textAreaIcon,
      });

      // Add to map first
      newLayer.addTo(this.map);

      // Set up PM properties for the new text layer
      if (newLayer.pm) {
        newLayer.pm.textArea = hintLayer._duplicateTextArea;
        newLayer.pm.isRichText = hintLayer._duplicateIsRichText;

        // Copy text-specific options
        L.setOptions(newLayer.pm, hintLayer._duplicateOptions);

        // Initialize the text marker
        newLayer.pm._createTextMarker(false);

        // Attach context menu
        this._attachLayerContextMenu(newLayer);
      }
    } else if (hintLayer instanceof L.Marker) {
      // Use original options to preserve original opacity
      newLayer = L.marker(e.latlng, originalOptions);

      newLayer.addTo(this.map);
      if (newLayer.pm) {
        this._attachLayerContextMenu(newLayer);
      }
    } else if (hintLayer instanceof L.Circle) {
      // Use original options with original radius
      newLayer = L.circle(e.latlng, {
        ...originalOptions,
        radius: hintLayer._duplicateRadius,
      });

      newLayer.addTo(this.map);
      if (newLayer.pm) {
        this._attachLayerContextMenu(newLayer);
      }
    } else if (
      hintLayer instanceof L.Polygon ||
      hintLayer instanceof L.Polyline
    ) {
      const latlngs = hintLayer.getLatLngs();

      if (hintLayer instanceof L.Polygon) {
        // Use original options to preserve original opacity and fillOpacity
        newLayer = L.polygon(latlngs, originalOptions);
      } else {
        // Use original options to preserve original opacity
        newLayer = L.polyline(latlngs, originalOptions);
      }

      newLayer.addTo(this.map);
      if (newLayer.pm) {
        this._attachLayerContextMenu(newLayer);
      }
    }

    // Clean up duplication mode
    this._cleanupDuplication();
  },

  _cancelDuplication(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      this._cleanupDuplication();
    }
  },

  _cleanupDuplication() {
    // Remove hint layer
    if (this._duplicateHintLayer) {
      this.map.removeLayer(this._duplicateHintLayer);
      this._duplicateHintLayer = null;
    }

    // Remove event listeners
    this.map.off('mousemove', this._syncDuplicateHintLayer, this);
    this.map.off('click', this._placeDuplicatedLayer, this);
    L.DomEvent.off(document, 'keydown', this._cancelDuplication, this);

    // Reset cursor
    this.map.getContainer().classList.remove('geoman-draw-cursor');

    // Clear stored layer and options
    this._layerToDuplicate = null;
    this._originalLayerOptions = null;
  },

  _getCenter(latlngs) {
    // Calculate center of coordinates
    if (Array.isArray(latlngs[0])) {
      // Handle nested arrays (polygons with holes)
      latlngs = latlngs[0];
    }

    let latSum = 0;
    let lngSum = 0;
    let count = 0;

    latlngs.forEach((latlng) => {
      latSum += latlng.lat;
      lngSum += latlng.lng;
      count++;
    });

    return {
      lat: latSum / count,
      lng: lngSum / count,
    };
  },

  _offsetLatLngs(latlngs, latOffset, lngOffset) {
    // Handle both old single offset parameter and new separate lat/lng offsets
    if (lngOffset === undefined) {
      lngOffset = latOffset;
    }

    if (Array.isArray(latlngs[0])) {
      return latlngs.map((ring) =>
        this._offsetLatLngs(ring, latOffset, lngOffset)
      );
    }
    return latlngs.map((latlng) => ({
      lat: latlng.lat + latOffset,
      lng: latlng.lng + lngOffset,
    }));
  },

  _showLayerArea(layer) {
    if (layer.getLatLngs) {
      const area = L.GeometryUtil
        ? L.GeometryUtil.geodesicArea(layer.getLatLngs()[0])
        : 0;
      const areaText =
        area > 1000000
          ? (area / 1000000).toFixed(2) + ' km²'
          : area.toFixed(2) + ' m²';

      let content = '<div class="pm-context-data">';
      content +=
        '<h4>' + getTranslation('modalContent.areaInformation') + '</h4>';
      content +=
        '<p><strong>' +
        getTranslation('modalContent.area') +
        '</strong> ' +
        areaText +
        '</p>';
      content += '</div>';

      this._showModal(getTranslation('contextMenu.showArea'), content);
    }
  },

  _showCircleRadius(layer) {
    if (layer.getRadius) {
      const radius = layer.getRadius();
      const radiusText =
        radius > 1000
          ? (radius / 1000).toFixed(2) + ' km'
          : radius.toFixed(2) + ' m';

      let content = '<div class="pm-context-data">';
      content +=
        '<h4>' + getTranslation('modalContent.circleInformation') + '</h4>';
      content +=
        '<p><strong>' +
        getTranslation('modalContent.radius') +
        '</strong> ' +
        radiusText +
        '</p>';
      content +=
        '<p><strong>' +
        getTranslation('modalContent.center') +
        '</strong> ' +
        layer.getLatLng().toString() +
        '</p>';
      content += '</div>';

      this._showModal(getTranslation('contextMenu.showRadius'), content);
    }
  },

  _showLineLength(layer) {
    if (layer.getLatLngs) {
      // Simple distance calculation
      const latlngs = layer.getLatLngs();
      let totalDistance = 0;

      for (let i = 0; i < latlngs.length - 1; i++) {
        totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
      }

      const distanceText =
        totalDistance > 1000
          ? (totalDistance / 1000).toFixed(2) + ' km'
          : totalDistance.toFixed(2) + ' m';

      let content = '<div class="pm-context-data">';
      content +=
        '<h4>' + getTranslation('modalContent.lineInformation') + '</h4>';
      content +=
        '<p><strong>' +
        getTranslation('modalContent.length') +
        '</strong> ' +
        distanceText +
        '</p>';
      content +=
        '<p><strong>' +
        getTranslation('modalContent.segments') +
        '</strong> ' +
        (latlngs.length - 1) +
        '</p>';
      content += '</div>';

      this._showModal(getTranslation('contextMenu.showLength'), content);
    }
  },

  _showLayerCoordinates(layer) {
    let content = '<div class="pm-context-data">';
    content += '<h4>' + getTranslation('modalContent.coordinates') + '</h4>';

    if (layer.getLatLng) {
      const latlng = layer.getLatLng();
      content +=
        '<p><strong>' +
        getTranslation('modalContent.latitude') +
        '</strong> ' +
        latlng.lat.toFixed(6) +
        '</p>';
      content +=
        '<p><strong>' +
        getTranslation('modalContent.longitude') +
        '</strong> ' +
        latlng.lng.toFixed(6) +
        '</p>';
    } else if (layer.getLatLngs) {
      const latlngs = layer.getLatLngs();
      content +=
        '<p><strong>' +
        getTranslation('modalContent.vertices') +
        '</strong> ' +
        this._countVertices(latlngs) +
        '</p>';
      content +=
        '<details><summary>' +
        getTranslation('modalContent.showAllCoordinates') +
        '</summary>';
      content += '<pre>' + JSON.stringify(latlngs, null, 2) + '</pre>';
      content += '</details>';
    }

    content += '</div>';

    this._showModal(getTranslation('modalContent.coordinates'), content);
  },

  _countVertices(latlngs) {
    if (Array.isArray(latlngs[0])) {
      return latlngs.reduce((sum, ring) => sum + this._countVertices(ring), 0);
    }
    return latlngs.length;
  },

  _centerMapOnLayer(layer) {
    if (layer.getLatLng) {
      this.map.setView(layer.getLatLng(), this.map.getZoom());
    } else if (layer.getBounds) {
      this.map.fitBounds(layer.getBounds());
    }
  },

  attachLayerContextMenu(layer) {
    this._attachLayerContextMenu(layer);
  },

  _attachLayerContextMenu(layer) {
    // Remove any existing context menu listener
    if (layer._pmContextMenuAttached) {
      return;
    }

    // Initialize z-index for markers if not already set
    if (layer instanceof L.Marker && !layer._pmZIndex) {
      layer._pmZIndex = 0;
      layer.setZIndexOffset(0);
    }

    layer.on('contextmenu', (e) => {
      this.showLayerContextMenu(e, layer);
    });

    // Add click listener to disable editing/dragging/rotating on other layers when this layer is clicked
    layer.on('click', (e) => {
      // Disable editing, dragging, and rotating on all other layers
      this.map.eachLayer((otherLayer) => {
        if (otherLayer !== layer && otherLayer.pm) {
          // Disable edit mode
          if (otherLayer.pm.enabled && otherLayer.pm.enabled()) {
            otherLayer.pm.disable();
          }

          // Disable drag mode - check using _layerDragEnabled property
          if (otherLayer.pm._layerDragEnabled) {
            otherLayer.pm.disableLayerDrag();
          }

          // Disable rotate mode - use rotateEnabled() method
          if (otherLayer.pm.rotateEnabled && otherLayer.pm.rotateEnabled()) {
            otherLayer.pm.disableRotate();
          }
        }

        // Also disable dragging for regular markers
        if (
          otherLayer !== layer &&
          otherLayer.dragging &&
          otherLayer.dragging.enabled &&
          otherLayer.dragging.enabled()
        ) {
          otherLayer.dragging.disable();
        }
      });
    });

    layer._pmContextMenuAttached = true;
  },

  _disableAllLayerEditing() {
    // Disable editing, dragging, and rotation on all layers
    this.map.eachLayer((layer) => {
      if (layer.pm) {
        // Disable edit mode
        if (layer.pm.enabled && layer.pm.enabled()) {
          layer.pm.disable();
        }

        // Disable drag mode - check using _layerDragEnabled property
        if (layer.pm._layerDragEnabled) {
          layer.pm.disableLayerDrag();
        }

        // Disable rotate mode - use rotateEnabled() method
        if (layer.pm.rotateEnabled && layer.pm.rotateEnabled()) {
          layer.pm.disableRotate();
        }
      }

      // Also disable dragging for regular markers
      if (
        layer.dragging &&
        layer.dragging.enabled &&
        layer.dragging.enabled()
      ) {
        layer.dragging.disable();
      }
    });
  },

  enableAutoFinishEditing() {
    // Add map click listener to auto-finish editing
    if (
      !this._mapClickListenerAttached &&
      this.map &&
      typeof this.map.on === 'function'
    ) {
      this.map.on('click', (e) => {
        // Check if click was on the map (not on a layer)
        const clickedOnMap =
          e.originalEvent.target.classList.contains('leaflet-container') ||
          e.originalEvent.target.classList.contains('leaflet-tile');

        if (clickedOnMap) {
          this._disableAllLayerEditing();
        }
      });

      this._mapClickListenerAttached = true;
    }
  },

  _getMenuItems(buttonName, button) {
    const items = [];
    const jsClass = button._button.jsClass;

    // Common items for all draw controls
    if (button._button.tool !== 'edit' && button._button.tool !== 'options') {
      items.push({
        text: getTranslation('contextMenu.drawSettings'),
        onClick: (btn, name) => {
          this._showDrawSettings(name, btn);
        },
      });

      items.push({
        text: getTranslation('contextMenu.toolInformation'),
        onClick: (btn, name) => {
          this._showToolInfo(name, btn);
        },
      });
    }

    // Shape-specific items
    if (jsClass === 'Marker') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.markerOptions'),
        onClick: (btn, name) => {
          this._showMarkerOptions(btn);
        },
      });
    } else if (jsClass === 'Polygon' || jsClass === 'Rectangle') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.objectInfo'),
        onClick: (btn, name) => {
          this._showObjectInfo(name, btn);
        },
      });
      items.push({
        text: getTranslation('contextMenu.convertOptions'),
        onClick: (btn, name) => {
          this._showConvertOptions(name, btn);
        },
      });
    } else if (
      jsClass === 'Circle' ||
      jsClass === 'Circle2Points' ||
      jsClass === 'Circle3Points'
    ) {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.circleProperties'),
        onClick: (btn, name) => {
          this._showCircleProperties(name, btn);
        },
      });
    } else if (jsClass === 'Text') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.textOptions'),
        onClick: (btn, name) => {
          this._showTextOptions(btn);
        },
      });
      items.push({
        text: getTranslation('contextMenu.fontSettings'),
        onClick: (btn, name) => {
          this._showFontSettings(btn);
        },
      });
    } else if (jsClass === 'Line' || jsClass === 'Arrow') {
      items.push({ separator: true });
      items.push({
        text: getTranslation('contextMenu.lineProperties'),
        onClick: (btn, name) => {
          this._showLineProperties(name, btn);
        },
      });
    }

    // Edit mode items
    if (button._button.tool === 'edit') {
      items.push({
        text: getTranslation('contextMenu.editModeInfo'),
        onClick: (btn, name) => {
          this._showEditModeInfo(name, btn);
        },
      });

      if (buttonName === 'editMode') {
        items.push({
          text: getTranslation('contextMenu.keyboardShortcuts'),
          onClick: (btn, name) => {
            this._showKeyboardShortcuts();
          },
        });
      }
    }

    // Common actions
    items.push({ separator: true });
    items.push({
      text: getTranslation('contextMenu.resetToDefault'),
      onClick: (btn, name) => {
        this._resetToDefault(name, btn);
      },
    });

    return items;
  },

  _showDrawSettings(buttonName, button) {
    const jsClass = button._button.jsClass;
    const drawInstance = this.map.pm.Draw[jsClass];

    let content = '<div class="pm-context-data">';
    content += '<h4>Current Draw Settings</h4>';

    if (drawInstance && drawInstance.options) {
      content += '<table class="pm-context-table">';
      content += '<tr><th>Setting</th><th>Value</th></tr>';

      const options = drawInstance.options;
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          let value = options[key];
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          content += `<tr><td>${key}</td><td>${value}</td></tr>`;
        }
      }
      content += '</table>';
    } else {
      content += '<p>No settings available</p>';
    }

    content += '</div>';

    this._showModal('Draw Settings - ' + jsClass, content);
  },

  _showToolInfo(buttonName, button) {
    const jsClass = button._button.jsClass;
    const toolInfo = {
      Marker:
        'Place markers on the map by clicking. Markers can be dragged and customized with icons.',
      Polygon:
        'Draw polygons by clicking to add vertices. Double-click or click the first point to finish.',
      Rectangle:
        'Draw rectangles by clicking and dragging. Click once to set the first corner, then click again for the opposite corner.',
      Circle:
        'Draw circles by clicking the center point and dragging to set the radius.',
      Circle2Points:
        'Draw circles using two points - the first click sets the center, the second sets a point on the circumference.',
      Circle3Points: 'Draw circles using three points on the circumference.',
      Line: 'Draw polylines by clicking to add vertices. Double-click to finish.',
      Arrow:
        'Draw arrows similar to polylines. The last segment will have an arrow head.',
      CircleMarker: 'Place circle markers with a fixed pixel radius.',
      Text: 'Add text annotations to the map.',
      Freehand: 'Draw freehand shapes by clicking and dragging.',
    };

    let content = '<div class="pm-context-data">';
    content +=
      '<p>' +
      (toolInfo[jsClass] || 'Drawing tool for creating shapes on the map.') +
      '</p>';
    content += '<h4>Actions Available:</h4>';
    content += '<ul>';

    const actions = button._button.actions || [];
    actions.forEach((action) => {
      const actionName = typeof action === 'string' ? action : action.name;
      content += '<li>' + actionName + '</li>';
    });

    if (actions.length === 0) {
      content += '<li>Click to activate drawing mode</li>';
    }

    content += '</ul>';
    content += '</div>';

    this._showModal('Tool Information - ' + jsClass, content);
  },

  _showObjectInfo(buttonName, button) {
    const jsClass = button._button.jsClass;

    let content = '<div class="pm-context-data">';
    content += '<h4>Object Properties</h4>';
    content += '<p>When you draw a ' + jsClass.toLowerCase() + ', you can:</p>';
    content += '<ul>';
    content += '<li>Edit vertices by dragging them</li>';
    content += '<li>Add new vertices by clicking on edges</li>';
    content += '<li>Remove vertices by right-clicking them</li>';
    content += '<li>Move the entire shape</li>';
    content += '<li>Rotate the shape (if rotation is enabled)</li>';
    content += '</ul>';
    content += '</div>';

    this._showModal('Object Info - ' + jsClass, content);
  },

  _showConvertOptions(buttonName, button) {
    const jsClass = button._button.jsClass;

    let content = '<div class="pm-context-data">';
    content += '<h4>Conversion Options</h4>';

    if (jsClass === 'Rectangle') {
      content += '<p>Rectangles can be converted to:</p>';
      content += '<ul>';
      content +=
        '<li><strong>Polygon:</strong> Convert to a 4-vertex polygon for more flexible editing</li>';
      content += '</ul>';
    } else if (jsClass === 'Polygon') {
      content += '<p>Polygons support various operations:</p>';
      content += '<ul>';
      content +=
        '<li><strong>Simplify:</strong> Reduce the number of vertices</li>';
      content += '<li><strong>Union:</strong> Combine with other polygons</li>';
      content +=
        '<li><strong>Difference:</strong> Subtract other polygons</li>';
      content += '</ul>';
    }

    content += '</div>';

    this._showModal('Convert Options - ' + jsClass, content);
  },

  _showMarkerOptions(button) {
    let content = '<div class="pm-context-data">';
    content += '<h4>Marker Customization</h4>';
    content += '<p>Markers can be customized with:</p>';
    content += '<ul>';
    content += '<li>Custom icons</li>';
    content += '<li>Popup content</li>';
    content += '<li>Tooltip text</li>';
    content += '<li>Draggable property</li>';
    content += '<li>Z-index for layering</li>';
    content += '</ul>';
    content +=
      '<p>Use the marker options in your code to customize appearance.</p>';
    content += '</div>';

    this._showModal('Marker Options', content);
  },

  _showCircleProperties(buttonName, button) {
    const jsClass = button._button.jsClass;

    let content = '<div class="pm-context-data">';
    content += '<h4>Circle Properties</h4>';
    content += '<p>Drawing method: ' + jsClass + '</p>';
    content += '<ul>';

    if (jsClass === 'Circle') {
      content += '<li>Click to set center, drag to set radius</li>';
      content += '<li>Radius is measured in meters</li>';
    } else if (jsClass === 'Circle2Points') {
      content += '<li>First click: center point</li>';
      content += '<li>Second click: point on circumference</li>';
    } else if (jsClass === 'Circle3Points') {
      content += '<li>Three clicks define points on the circumference</li>';
      content +=
        '<li>Circle is calculated to pass through all three points</li>';
    }

    content += '</ul>';
    content +=
      '<p>After drawing, circles can be resized by dragging the edge.</p>';
    content += '</div>';

    this._showModal('Circle Properties - ' + jsClass, content);
  },

  _showTextOptions(button) {
    let content = '<div class="pm-context-data">';
    content += '<h4>Text Tool Options</h4>';
    content +=
      '<p>The text tool allows you to add text annotations to your map.</p>';
    content += '<ul>';
    content += '<li>Click on the map to place text</li>';
    content += '<li>Enter your text in the modal dialog</li>';
    content += '<li>Customize font, size, and color</li>';
    content += '<li>Text can be moved after placement</li>';
    content += '</ul>';
    content += '</div>';

    this._showModal('Text Options', content);
  },

  _showFontSettings(button) {
    let content = '<div class="pm-context-data">';
    content += '<h4>Font Settings</h4>';
    content += '<p>Available font customization options:</p>';
    content += '<table class="pm-context-table">';
    content += '<tr><th>Property</th><th>Options</th></tr>';
    content +=
      '<tr><td>Font Family</td><td>Arial, Times New Roman, Courier, etc.</td></tr>';
    content += '<tr><td>Font Size</td><td>8px - 72px</td></tr>';
    content += '<tr><td>Font Weight</td><td>Normal, Bold</td></tr>';
    content += '<tr><td>Font Style</td><td>Normal, Italic</td></tr>';
    content += '<tr><td>Color</td><td>Any valid CSS color</td></tr>';
    content += '</table>';
    content += '</div>';

    this._showModal('Font Settings', content);
  },

  _showLineProperties(buttonName, button) {
    const jsClass = button._button.jsClass;

    let content = '<div class="pm-context-data">';
    content += '<h4>Line Properties</h4>';

    if (jsClass === 'Arrow') {
      content += '<p>Arrows are polylines with an arrow head at the end.</p>';
      content += '<ul>';
      content += '<li>Arrow head size and style can be customized</li>';
      content += '<li>Arrow direction follows the drawing direction</li>';
      content += '</ul>';
    } else {
      content += '<p>Polylines are multi-segment lines.</p>';
    }

    content += '<h4>Customization Options:</h4>';
    content += '<ul>';
    content += '<li>Line color and opacity</li>';
    content += '<li>Line weight (thickness)</li>';
    content += '<li>Line style (solid, dashed, dotted)</li>';
    content += '<li>Line cap and join styles</li>';
    content += '</ul>';
    content += '</div>';

    this._showModal('Line Properties - ' + jsClass, content);
  },

  _showEditModeInfo(buttonName, button) {
    let content = '<div class="pm-context-data">';
    content += '<h4>Edit Mode</h4>';

    if (buttonName === 'editMode') {
      content += '<p>Edit mode allows you to modify existing shapes:</p>';
      content += '<ul>';
      content += '<li>Click and drag vertices to move them</li>';
      content += '<li>Click on edges to add new vertices</li>';
      content += '<li>Right-click vertices to remove them</li>';
      content += '<li>All shapes on the map become editable</li>';
      content += '</ul>';
    } else if (buttonName === 'dragMode') {
      content += '<p>Drag mode allows you to move entire shapes:</p>';
      content += '<ul>';
      content += '<li>Click and drag any shape to move it</li>';
      content += '<li>Shape geometry is preserved</li>';
      content += '<li>All shapes become draggable</li>';
      content += '</ul>';
    } else if (buttonName === 'removalMode') {
      content += '<p>Removal mode allows you to delete shapes:</p>';
      content += '<ul>';
      content += '<li>Click any shape to remove it from the map</li>';
      content += '<li>Removed shapes cannot be recovered</li>';
      content += '</ul>';
    } else if (buttonName === 'rotateMode') {
      content += '<p>Rotate mode allows you to rotate shapes:</p>';
      content += '<ul>';
      content += '<li>Click and drag to rotate shapes</li>';
      content += '<li>Rotation is around the shape center</li>';
      content += '<li>Works with polygons and markers</li>';
      content += '</ul>';
    } else if (buttonName === 'cutPolygon') {
      content += '<p>Cut mode allows you to split polygons:</p>';
      content += '<ul>';
      content += '<li>Draw a line across a polygon to cut it</li>';
      content += '<li>Creates two separate polygons</li>';
      content += '<li>Original polygon is removed</li>';
      content += '</ul>';
    }

    content += '</div>';

    this._showModal('Edit Mode Information', content);
  },

  _showKeyboardShortcuts() {
    let content = '<div class="pm-context-data">';
    content += '<h4>Keyboard Shortcuts</h4>';
    content += '<table class="pm-context-table">';
    content += '<tr><th>Key</th><th>Action</th></tr>';
    content += '<tr><td>ESC</td><td>Cancel current drawing</td></tr>';
    content += '<tr><td>Enter</td><td>Finish current shape</td></tr>';
    content += '<tr><td>Backspace</td><td>Remove last vertex</td></tr>';
    content += '<tr><td>Delete</td><td>Remove selected shape</td></tr>';
    content += '<tr><td>M</td><td>Toggle move mode</td></tr>';
    content += '<tr><td>B</td><td>Toggle rotate mode</td></tr>';
    content += '</table>';
    content += '</div>';

    this._showModal('Keyboard Shortcuts', content);
  },

  _resetToDefault(buttonName, button) {
    const jsClass = button._button.jsClass;

    let content = '<div class="pm-context-data">';
    content +=
      '<p>Reset ' + (jsClass || buttonName) + ' to default settings?</p>';
    content += '<p>This will restore all default options for this tool.</p>';
    content +=
      '<p><em>Note: This is a demonstration. Implement actual reset logic in your application.</em></p>';
    content += '</div>';

    this._showModal('Reset to Default', content);
  },

  _layerHasStyle(layer) {
    // Check if layer supports style properties
    // Text layers and Markers don't have typical path styles
    if (!layer) return false;

    const layerType = this._getLayerType(layer);

    // Exclude layers that don't have path styles
    if (layerType === 'Marker') return false;

    // Check if layer has setStyle method (most vector layers do)
    return typeof layer.setStyle === 'function';
  },

  _showStyleEditor(layer) {
    // Disable any current editing
    this._disableAllLayerEditing();

    // Create and show style modal
    const styleModal = new StyleModal({
      layer: layer,
      onSave: (style) => {
        // Apply the new style with pattern support
        if (layer.setStyle) {
          patternRenderer.applyPattern(layer, style);
        }

        // Fire event for style change
        layer.fire('pm:stylechange', { style });
      },
      onCancel: () => {
        // Do nothing on cancel
      },
    });

    styleModal.open();
  },

  _bringMarkerToFront(layer) {
    if (layer instanceof L.Marker) {
      // Increment counter and set new z-index
      this._markerZIndexCounter += 10;
      const newZIndex = this._markerZIndexCounter;

      layer.setZIndexOffset(newZIndex);
      layer._pmZIndex = newZIndex;

      // Set z-index on the marker's icon element
      this._setMarkerZIndex(layer, newZIndex);
    } else if (layer.bringToFront) {
      layer.bringToFront();
    }
  },

  _bringMarkerToBack(layer) {
    if (layer instanceof L.Marker) {
      // Get all markers and find the lowest z-index
      let lowestZIndex = 0;
      let hasOtherMarkers = false;

      this.map.eachLayer((lyr) => {
        if (lyr instanceof L.Marker && lyr !== layer) {
          hasOtherMarkers = true;
          const zIndex = lyr._pmZIndex !== undefined ? lyr._pmZIndex : 0;
          lowestZIndex = Math.min(lowestZIndex, zIndex);
        }
      });

      // Set this marker's z-index below the lowest
      const newZIndex = hasOtherMarkers ? lowestZIndex - 10 : -10;

      layer.setZIndexOffset(newZIndex);
      layer._pmZIndex = newZIndex;

      // Set z-index on the marker's icon element
      this._setMarkerZIndex(layer, newZIndex);
    } else if (layer.bringToBack) {
      layer.bringToBack();
    }
  },

  _setMarkerZIndex(layer, zIndex) {
    // Try multiple ways to set the z-index on the marker element
    const setZIndexOnElement = () => {
      // Method 1: Get the marker element directly
      const element = layer.getElement && layer.getElement();
      if (element) {
        element.style.zIndex = zIndex;
        return true;
      }

      // Method 2: Access through _icon property
      if (layer._icon) {
        layer._icon.style.zIndex = zIndex;
        return true;
      }

      return false;
    };

    // Try immediately
    if (!setZIndexOnElement()) {
      // If it fails, try again after a short delay (element might not be rendered yet)
      setTimeout(setZIndexOnElement, 10);
    }
  },
});

export default ContextMenu;
