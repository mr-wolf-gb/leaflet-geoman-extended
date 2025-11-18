import Draw from './L.PM.Draw';
import { getTranslation } from '../helpers';

Draw.DistanceLine = Draw.Line.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'DistanceLine';
    this.toolbarButtonName = 'drawDistanceLine';
    this._doesSelfIntersect = false;
    this._distanceInterval = null;
    this._distanceUnit = 'km';
    this._distanceLabels = [];
    this._distanceBullets = [];
  },

  enable(options) {
    L.Util.setOptions(this, options);

    // Show distance input modal before enabling drawing
    this._showDistanceInputModal();
  },

  _showDistanceInputModal() {
    // Import BaseModal dynamically
    const BaseModal = require('../helpers/BaseModal').default;

    // Create modal
    const modal = new BaseModal({
      title: getTranslation('distanceLine.enterDistanceInterval'),
      width: '400px',
      className: 'geoman-distance-modal',
      onClose: () => {
        this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);
      },
    });

    // Create modal content
    const description = document.createElement('p');
    description.textContent = getTranslation(
      'distanceLine.distanceIntervalDescription'
    );

    const inputGroup = document.createElement('div');
    inputGroup.className = 'pm-modal-field';

    const valueInput = document.createElement('input');
    valueInput.type = 'number';
    valueInput.placeholder = getTranslation('placeholders.distanceValue');
    valueInput.step = '0.1';
    valueInput.min = '0.1';
    valueInput.style.flex = '1';

    const unitSelect = document.createElement('select');
    const kmOption = document.createElement('option');
    kmOption.value = 'km';
    kmOption.textContent = 'km';
    const mOption = document.createElement('option');
    mOption.value = 'm';
    mOption.textContent = 'm';
    unitSelect.appendChild(kmOption);
    unitSelect.appendChild(mOption);

    inputGroup.appendChild(valueInput);
    inputGroup.appendChild(unitSelect);

    const hint = document.createElement('p');
    hint.textContent = getTranslation('distanceLine.labelsWillShow');
    hint.style.fontSize = '12px';
    hint.style.color = '#666';
    hint.style.marginTop = '8px';

    // Add content to modal
    modal.body.appendChild(description);
    modal.body.appendChild(inputGroup);
    modal.body.appendChild(hint);

    // Add buttons
    modal.addButton({
      text: getTranslation('modals.cancel'),
      className: 'pm-modal-button-cancel',
      onClick: () => {
        modal.close();
      },
    });

    modal.addButton({
      text: getTranslation('modals.startDrawing'),
      className: 'pm-modal-button-primary',
      onClick: () => {
        const value = parseFloat(valueInput.value);
        const unit = unitSelect.value;

        if (!value || value <= 0) {
          alert(getTranslation('distanceLine.invalidDistanceValue'));
          return;
        }

        this._distanceInterval = value;
        this._distanceUnit = unit;

        modal.close();
        this._startDrawing();
      },
    });

    // Open modal and focus input
    modal.open();
    setTimeout(() => valueInput.focus(), 100);
  },

  _calculateCumulativeDistance(segmentIndex) {
    // Calculate cumulative distance: (segmentIndex + 1) * interval
    const multiplier = segmentIndex + 1;
    const distance = this._distanceInterval * multiplier;
    return {
      value: distance,
      unit: this._distanceUnit,
      label: `${distance}${this._distanceUnit}`,
    };
  },

  _startDrawing() {
    // Call parent enable method
    Draw.Line.prototype.enable.call(this, this.options);

    // Override tooltip text
    this._updateTooltipForDistanceLine();
  },

  _createVertex(e) {
    // Call parent method
    Draw.Line.prototype._createVertex.call(this, e);

    // Update all distance labels based on actual measurements
    if (this._layer.getLatLngs().length >= 2) {
      this._updateDistanceLabels();
    }

    this._updateTooltipForDistanceLine();
  },

  _updateDistanceLabels() {
    // Remove existing bullets
    this._distanceBullets.forEach((bullet) => {
      this._layerGroup.removeLayer(bullet);
    });
    this._distanceBullets = [];

    // Remove existing labels
    this._distanceLabels.forEach((label) => {
      this._layerGroup.removeLayer(label);
    });
    this._distanceLabels = [];

    const latlngs = this._layer.getLatLngs();
    if (latlngs.length < 2) return;

    // Calculate positions for labels based on actual distance measurements
    const intervalMeters = this._getIntervalInMeters();
    let cumulativeDistance = 0;
    let labelIndex = 0;

    // Walk through the line and place labels at exact distance intervals
    for (let i = 0; i < latlngs.length - 1; i++) {
      const segmentStart = latlngs[i];
      const segmentEnd = latlngs[i + 1];
      const segmentDistance = this._map.distance(segmentStart, segmentEnd);

      // Check if we need to place label(s) in this segment
      while (
        cumulativeDistance + segmentDistance >=
        (labelIndex + 1) * intervalMeters
      ) {
        const targetDistance = (labelIndex + 1) * intervalMeters;
        const distanceIntoSegment = targetDistance - cumulativeDistance;
        const ratio = distanceIntoSegment / segmentDistance;

        // Calculate the exact position along the segment using geodesic interpolation
        const labelPosition = this._interpolatePositionAlongGreatCircle(
          segmentStart,
          segmentEnd,
          ratio
        );

        // Create label
        const distanceInfo = this._calculateCumulativeDistance(labelIndex);

        // Calculate approximate width based on text length
        // Rough estimate: 6px per character + 4px padding + 2px borders
        const textLength = distanceInfo.label.length;
        const estimatedWidth = textLength * 6 + 6;
        const horizontalAnchor = estimatedWidth / 2;

        // Create bullet point marker at the exact distance point
        const bulletMarker = L.circleMarker(labelPosition, {
          radius: 5,
          fillColor: '#ffffff',
          fillOpacity: 1,
          color: '#3388ff',
          weight: 3,
          interactive: false,
        });
        bulletMarker._pmTempLayer = true;
        this._setPane(bulletMarker, 'overlayPane');

        // Add to layer group to ensure it's managed properly
        this._layerGroup.addLayer(bulletMarker);
        this._distanceBullets.push(bulletMarker);

        // Create label
        const label = L.marker(labelPosition, {
          icon: L.divIcon({
            className: 'geoman-distance-label',
            html: `<div class="geoman-distance-label-content">${distanceInfo.label}</div>`,
            iconSize: 'auto',
            iconAnchor: [horizontalAnchor, 24], // Anchor at the bottom center (pointer tip)
          }),
          interactive: false,
        });

        label._pmTempLayer = true;
        label._distanceInfo = distanceInfo;
        label._bulletMarker = bulletMarker; // Store reference to bullet
        this._layerGroup.addLayer(label);
        this._distanceLabels.push(label);

        labelIndex++;
      }

      cumulativeDistance += segmentDistance;
    }
  },

  _getIntervalInMeters() {
    // Convert interval to meters
    if (this._distanceUnit === 'km') {
      return this._distanceInterval * 1000;
    }
    return this._distanceInterval;
  },

  _interpolatePosition(start, end, ratio) {
    // Linear interpolation between two points
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    return L.latLng(lat, lng);
  },

  _interpolatePositionAlongGreatCircle(start, end, ratio) {
    // Geodesic interpolation along great circle
    // This ensures the point is actually on the path between start and end
    // accounting for Earth's curvature

    // Convert to radians
    const lat1 = (start.lat * Math.PI) / 180;
    const lng1 = (start.lng * Math.PI) / 180;
    const lat2 = (end.lat * Math.PI) / 180;
    const lng2 = (end.lng * Math.PI) / 180;

    // Calculate angular distance
    const d = Math.acos(
      Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
    );

    // Handle case where points are very close
    if (d < 0.000001) {
      return this._interpolatePosition(start, end, ratio);
    }

    const a = Math.sin((1 - ratio) * d) / Math.sin(d);
    const b = Math.sin(ratio * d) / Math.sin(d);

    const x =
      a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
    const y =
      a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);

    // Convert back to degrees
    return L.latLng((lat * 180) / Math.PI, (lng * 180) / Math.PI);
  },

  _updateTooltipForDistanceLine() {
    if (!this._hintMarker) return;

    let text = '';
    const numLabels = this._distanceLabels.length;

    if (numLabels === 0) {
      text = getTranslation('tooltips.distanceLineStart')
        .replace('{interval}', this._distanceInterval)
        .replace('{unit}', this._distanceUnit);
    } else {
      const nextDistance = this._calculateCumulativeDistance(numLabels);
      text = getTranslation('tooltips.distanceLineNext').replace(
        '{label}',
        nextDistance.label
      );
    }

    this._hintMarker.setTooltipContent(text);
  },

  _finishShape() {
    // Get coordinates
    const coords = this._layer.getLatLngs();

    if (coords.length <= 1) {
      return;
    }

    // Create the polyline
    const polylineLayer = L.polyline(coords, this.options.pathOptions);
    this._setPane(polylineLayer, 'layerPane');
    this._finishLayer(polylineLayer);
    polylineLayer.addTo(this._map.pm._getContainingLayer());

    // Add permanent distance labels and bullets to the finished layer
    polylineLayer._distanceLabels = [];
    polylineLayer._distanceBullets = [];
    this._distanceLabels.forEach((label) => {
      // Create permanent bullet marker
      const permanentBullet = L.circleMarker(label.getLatLng(), {
        radius: 5,
        fillColor: '#ffffff',
        fillOpacity: 1,
        color: '#3388ff',
        weight: 3,
        interactive: false,
      });
      this._setPane(permanentBullet, 'overlayPane');
      permanentBullet.addTo(this._map);
      polylineLayer._distanceBullets.push(permanentBullet);

      // Create permanent label
      const permanentLabel = L.marker(label.getLatLng(), {
        icon: label.options.icon,
        interactive: false,
      });
      permanentLabel._distanceInfo = label._distanceInfo;
      permanentLabel.addTo(this._map);
      polylineLayer._distanceLabels.push(permanentLabel);
    });

    // Store distance configuration in layer
    polylineLayer._distanceInterval = this._distanceInterval;
    polylineLayer._distanceUnit = this._distanceUnit;

    // Fire create event
    this._fireCreate(polylineLayer);

    if (this.options.snappable) {
      this._cleanupSnapping();
    }

    // Reset for next drawing
    this._currentSegmentIndex = 0;
    this._distanceLabels = [];
    this._distanceBullets = [];

    // Disable drawing
    this.disable();
  },

  disable() {
    // Call parent disable
    Draw.Line.prototype.disable.call(this);

    // Reset state
    this._distanceLabels = [];
    this._distanceBullets = [];
  },
});
