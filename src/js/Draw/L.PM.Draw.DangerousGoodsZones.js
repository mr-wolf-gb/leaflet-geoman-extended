import Draw from './L.PM.Draw';
import { getTranslation } from '../helpers';

Draw.DangerousGoodsZones = Draw.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'DangerousGoodsZones';
    this.toolbarButtonName = 'drawDangerousGoodsZones';
    this._layerIsDragging = false;

    // Default zone distances and colors
    this._defaultZones = [
      {
        nameKey: 'dangerousGoods.redCircle',
        distance: 30,
        color: '#ff0000',
        fillOpacity: 0.3,
      },
      {
        nameKey: 'dangerousGoods.orangeCircle',
        distance: 60,
        color: '#ff8800',
        fillOpacity: 0.25,
      },
      {
        nameKey: 'dangerousGoods.yellowCircle',
        distance: 300,
        color: '#ffff00',
        fillOpacity: 0.2,
      },
      {
        nameKey: 'dangerousGoods.greenCircle',
        distance: 1000,
        color: '#4AFB49',
        fillOpacity: 0.15,
      },
    ];

    this._zones = [...this._defaultZones];
  },

  enable(options) {
    L.Util.setOptions(this, options);

    // Show modal to configure zones
    this._showZoneConfigModal();
  },

  _showZoneConfigModal() {
    // Import BaseModal dynamically
    const BaseModal = require('../helpers/BaseModal').default;

    // Create modal
    const modal = new BaseModal({
      title: getTranslation('modals.dangerousGoodsCategory'),
      width: '450px',
      className: 'leaflet-pm-dangerous-goods-modal',
      onClose: () => {
        this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);
      },
    });

    // Create input fields for each zone
    this._zoneInputs = [];
    this._zones.forEach((zone) => {
      const fieldContainer = document.createElement('div');
      fieldContainer.className = 'pm-modal-field';

      const label = document.createElement('label');
      label.textContent = getTranslation(zone.nameKey);

      const input = document.createElement('input');
      input.type = 'number';
      input.value = zone.distance;
      input.min = '0';
      input.step = '10';

      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      modal.body.appendChild(fieldContainer);

      this._zoneInputs.push(input);
    });

    // Add buttons
    modal.addButton({
      text: getTranslation('modals.cancel'),
      className: 'pm-modal-button-cancel',
      onClick: () => {
        modal.close();
      },
    });

    modal.addButton({
      text: getTranslation('modals.ok'),
      className: 'pm-modal-button-primary',
      onClick: () => {
        try {
          // Update zones with input values
          this._zoneInputs.forEach((input, index) => {
            const value = parseFloat(input.value);
            if (!isNaN(value) && value > 0) {
              this._zones[index].distance = value;
            } else {
              this._zones[index].distance = this._defaultZones[index].distance;
            }
          });

          modal.close();
          this._startDrawingMode();
        } catch (error) {
          console.error('Error starting dangerous goods zones drawing:', error);
          modal.close();
        }
      },
    });

    // Open modal
    modal.open();
  },

  _startDrawingMode() {
    // Change enabled state
    this._enabled = true;

    // Toggle the draw button of the Toolbar
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, true);

    // Change map cursor
    this._map.getContainer().classList.add('geoman-draw-cursor');

    // Create hint marker
    this._hintMarker = L.marker(this._map.getCenter(), {
      zIndexOffset: 110,
      icon: L.divIcon({ className: 'marker-icon cursor-marker' }),
    });
    this._setPane(this._hintMarker, 'vertexPane');
    this._hintMarker._pmTempLayer = true;
    this._hintMarker.addTo(this._map);

    // Show cursor marker if option is set
    if (this.options.cursorMarker !== false) {
      L.DomUtil.addClass(this._hintMarker._icon, 'visible');
    }

    // Add tooltip
    if (this.options.tooltips !== false) {
      this._hintMarker
        .bindTooltip(getTranslation('tooltips.placeDangerousGoodsZones'), {
          permanent: true,
          offset: L.point(0, 10),
          direction: 'bottom',
          opacity: 0.8,
        })
        .openTooltip();
    }

    // Set the layer for event firing (use hint marker as temporary layer)
    this._layer = this._hintMarker;

    // Listen for map click to place zones
    this._map.on('click', this._createZones, this);
    this._map.on('mousemove', this._syncHintMarker, this);

    // Initialize snapping arrays
    this._otherSnapLayers = [];
    this._markers = [this._hintMarker];

    // Fire drawstart event
    this._fireDrawStart();
    this._setGlobalDrawMode();
  },

  _syncHintMarker(e) {
    this._hintMarker.setLatLng(e.latlng);

    // Handle snapping if enabled
    if (this.options.snappable) {
      const fakeDragEvent = e;
      fakeDragEvent.target = this._hintMarker;
      this._handleSnapping(fakeDragEvent);
    }

    // Fire change event
    this._fireChange(this._hintMarker.getLatLng(), 'Draw');
  },

  _createZones(e) {
    if (this._layerIsDragging) {
      return;
    }

    // If snap finish is required but the last marker wasn't snapped, do not finish the shape!
    if (
      this.options.requireSnapToFinish &&
      !this._hintMarker._snapped &&
      !this._isFirstLayer()
    ) {
      return;
    }

    // Get center point
    const center = this._hintMarker._snapped
      ? this._hintMarker.getLatLng()
      : e.latlng;

    // Create layer group to hold all zones
    const zoneGroup = L.featureGroup();
    zoneGroup._pmTempLayer = false;
    zoneGroup._dangerousGoodsZones = true;

    // Create circles for each zone (largest to smallest for proper layering)
    const sortedZones = [...this._zones].sort(
      (a, b) => b.distance - a.distance
    );

    sortedZones.forEach((zone) => {
      const circle = L.circle(center, {
        ...this.options.pathOptions,
        radius: zone.distance,
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: zone.fillOpacity,
        weight: 2,
      });

      this._setPane(circle, 'layerPane');
      circle._zoneData = zone;

      // Prevent individual circle from being editable
      circle.options.pmIgnore = true;
      circle._pmIgnore = true;

      zoneGroup.addLayer(circle);

      // Create label for this circle positioned on its perimeter
      const labelPosition = this._calculateLabelPosition(center, zone.distance);
      const label = L.marker(labelPosition, {
        icon: L.divIcon({
          className: 'dangerous-goods-zone-label',
          html: this._createZoneLabelHTML(zone),
          iconSize: 'auto',
          iconAnchor: [20, 10],
        }),
        zIndexOffset: 1000,
      });

      this._setPane(label, 'markerPane');

      // Prevent individual label from being editable
      label.options.pmIgnore = true;
      label._pmIgnore = true;

      zoneGroup.addLayer(label);
    });

    // Add center marker (smaller, just to mark the center)
    const centerMarker = L.marker(center, {
      icon: L.divIcon({
        className: 'dangerous-goods-center-marker',
        html: '<div style="width: 8px; height: 8px; background: #333; border-radius: 50%; border: 2px solid white;"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
      zIndexOffset: 1100,
    });

    this._setPane(centerMarker, 'markerPane');

    // Prevent center marker from being editable
    centerMarker.options.pmIgnore = true;
    centerMarker._pmIgnore = true;

    zoneGroup.addLayer(centerMarker);

    // Make the entire group draggable
    this._finishLayer(zoneGroup);
    zoneGroup.addTo(this._map.pm._getContainingLayer());

    // Note: Edit mode is not automatically enabled - user must enable it manually
    // This allows the drawing tool to finish cleanly without entering edit mode

    // Fire create event
    this._fireCreate(zoneGroup);

    // Clean up and continue or disable
    this._cleanupSnapping();

    if (!this.options.continueDrawing) {
      this.disable();
    } else {
      // Reset for next zones
      const hintMarkerLatLng = this._hintMarker.getLatLng();
      this._hintMarker.setLatLng(hintMarkerLatLng);
    }
  },

  _calculateLabelPosition(center, radius) {
    // Position label at 45 degrees (northeast) from center
    const angle = 45 * (Math.PI / 180); // Convert to radians

    // Calculate the position on the circle's perimeter
    const radiusInPixels =
      (this._map.distance(center, L.latLng(center.lat, center.lng + 0.001)) /
        1000) *
      radius;
    const point = this._map.latLngToContainerPoint(center);

    // Calculate offset based on radius in meters converted to map units
    const earthRadius = 6371000; // Earth's radius in meters
    const latOffset = (radius / earthRadius) * (180 / Math.PI);
    const lngOffset =
      ((radius / earthRadius) * (180 / Math.PI)) /
      Math.cos((center.lat * Math.PI) / 180);

    // Position at 45 degrees (northeast)
    const labelLat = center.lat + latOffset * Math.cos(angle);
    const labelLng = center.lng + lngOffset * Math.sin(angle);

    return L.latLng(labelLat, labelLng);
  },

  _createZoneLabelHTML(zone) {
    return `<div style="
      background: white;
      color: black;
      border: 1px solid black;
      border-radius: 8px;
      padding: 0px 2px;
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.5);
      white-space: nowrap;
    ">${zone.distance}m</div>`;
  },

  _getContrastColor(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  },

  disable() {
    if (!this._enabled) {
      return;
    }

    this._enabled = false;

    // Reset cursor
    this._map.getContainer().classList.remove('geoman-draw-cursor');

    // Remove hint marker
    if (this._hintMarker) {
      this._hintMarker.remove();
    }

    // Remove event listeners
    this._map.off('click', this._createZones, this);
    this._map.off('mousemove', this._syncHintMarker, this);

    // Toggle button
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);

    // Cleanup snapping
    if (this.options.snappable) {
      this._cleanupSnapping();
    }

    // Fire drawend event
    this._fireDrawEnd();
    this._setGlobalDrawMode();
  },

  enabled() {
    return this._enabled;
  },

  toggle(options) {
    if (this.enabled()) {
      this.disable();
    } else {
      this.enable(options);
    }
  },

  setStyle() {
    // Style is handled per zone
  },
});
