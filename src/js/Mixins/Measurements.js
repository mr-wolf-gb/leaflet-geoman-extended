// Measurement Mixin for Leaflet-Geoman
// Provides measurement calculations for layers during draw and edit

import { getTranslation } from '../helpers';

const Measurements = {
  _initMeasurements() {
    // Initialize measurement tracking if enabled
    if (this.options.measurements && this.options.measurements.measurement) {
      this._measurements = {};
      this._measurementEnabled = true;
    }
  },

  _updateHintTooltipWithMeasurements() {
    // Update the existing hint marker tooltip with measurements during drawing
    if (
      !this._hintMarker ||
      !this.options.measurements ||
      !this.options.measurements.measurement
    ) {
      return;
    }

    if (!this.options.measurements.showTooltip) {
      return;
    }

    // Calculate current measurements
    const measurements = this._calculateMeasurements(this._layer);
    if (!measurements) {
      return;
    }

    // Format tooltip content with measurements
    const content = this._formatMeasurementTooltip(measurements);

    // Get the current tooltip content (e.g., "Click to continue")
    const tooltip = this._hintMarker.getTooltip();
    if (tooltip && content) {
      // Prepend or append measurements to existing tooltip
      const currentContent = tooltip.getContent();
      const newContent = currentContent + '<br>' + content;
      tooltip.setContent(newContent);
    }
  },

  _calculateMeasurements(layer) {
    if (!this.options.measurements || !this.options.measurements.measurement) {
      return null;
    }

    const displayFormat = this.options.measurements.displayFormat || 'metric';
    return L.PM.Utils.getMeasurements(layer, this._map, displayFormat);
  },

  _formatMeasurementTooltip(measurements, cursorPosition) {
    if (!measurements) {
      return '';
    }

    const options = this.options.measurements || {};
    const lines = [];

    // Coordinates (for Marker, CircleMarker)
    if (options.coordinates !== false && measurements.coordinates) {
      lines.push(
        `${getTranslation('measurements.coordinates')}: ${measurements.coordinates}`
      );
    }

    // Total Length (for Line)
    if (options.totalLength !== false && measurements.totalLength) {
      lines.push(
        `${getTranslation('measurements.totalLength')}: ${measurements.totalLength}`
      );
    }

    // Segment Length (for Line, Polygon)
    if (options.segmentLength !== false && measurements.segmentLength) {
      lines.push(
        `${getTranslation('measurements.segmentLength')}: ${measurements.segmentLength}`
      );
    }

    // Area (for Polygon, Rectangle, Circle, CircleMarker)
    if (options.area !== false && measurements.area) {
      lines.push(
        `${getTranslation('measurements.area')}: ${measurements.area}`
      );
    }

    // Perimeter (for Polygon, Rectangle, Circle, CircleMarker)
    if (options.perimeter !== false && measurements.perimeter) {
      lines.push(
        `${getTranslation('measurements.perimeter')}: ${measurements.perimeter}`
      );
    }

    // Radius (for Circle, CircleMarker)
    if (options.radius !== false && measurements.radius) {
      lines.push(
        `${getTranslation('measurements.radius')}: ${measurements.radius}`
      );
    }

    // Width and Height (for Rectangle)
    if (options.width !== false && measurements.width) {
      lines.push(
        `${getTranslation('measurements.width')}: ${measurements.width}`
      );
    }
    if (options.height !== false && measurements.height) {
      lines.push(
        `${getTranslation('measurements.height')}: ${measurements.height}`
      );
    }

    // Position Marker (cursor position during drawing)
    if (cursorPosition && options.coordinates !== false) {
      lines.push(
        `${getTranslation('measurements.coordinatesMarker')}: Lat: ${cursorPosition.lat.toFixed(6)}, Lon: ${cursorPosition.lng.toFixed(6)}`
      );
    }

    return lines.join('<br>');
  },

  _enableMeasurementMode() {
    if (!this.options.measurements || !this.options.measurements.measurement) {
      return;
    }

    // Add hover listener for finished layers
    if (this.options.measurements.showTooltipOnHover !== false && this._layer) {
      this._layer.on('mouseover', this._showMeasurementOnHover, this);
      this._layer.on('mouseout', this._hideMeasurementOnHover, this);

      // Bind tooltip to layer for hover display
      this._bindMeasurementTooltipToLayer();
    }
  },

  _disableMeasurementMode() {
    if (this._layer) {
      this._layer.off('mouseover', this._showMeasurementOnHover, this);
      this._layer.off('mouseout', this._hideMeasurementOnHover, this);

      // Unbind measurement tooltip
      if (this._layer.getTooltip && this._layer.getTooltip()) {
        this._layer.unbindTooltip();
      }
    }
  },

  _bindMeasurementTooltipToLayer() {
    if (!this._layer || !this._layer.pm || !this._layer.pm.measurements) {
      return;
    }

    const content = this._formatMeasurementTooltip(this._layer.pm.measurements);
    if (content) {
      this._layer.bindTooltip(content, {
        permanent: false,
        sticky: false,
        className: 'geoman-measurement-tooltip',
        direction: 'top',
        offset: L.point(0, -10),
      });
    }
  },

  _showMeasurementOnHover(e) {
    if (!this._layer || !this._layer.pm || !this._layer.pm.measurements) {
      return;
    }

    // Update tooltip content
    const content = this._formatMeasurementTooltip(this._layer.pm.measurements);
    if (content && this._layer.getTooltip()) {
      this._layer.getTooltip().setContent(content);
    }
  },

  _hideMeasurementOnHover() {
    // Tooltip will hide automatically on mouseout
  },

  _updateLayerMeasurements(layer) {
    if (!layer || !layer.pm) {
      return;
    }

    const measurements = this._calculateMeasurements(layer);
    if (measurements) {
      layer.pm.measurements = measurements;
    }
  },

  _bindMeasurementTooltip(layer) {
    if (!layer || !layer.pm || !layer.pm.measurements) {
      return;
    }

    const content = this._formatMeasurementTooltip(layer.pm.measurements);
    if (content) {
      layer.bindTooltip(content, {
        permanent: false,
        sticky: false,
        className: 'geoman-measurement-tooltip',
        direction: 'top',
        offset: L.point(0, -10),
      });
    }
  },
};

export default Measurements;
