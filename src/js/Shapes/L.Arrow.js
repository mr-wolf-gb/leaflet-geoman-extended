/**
 * L.Arrow - A custom Leaflet layer for drawing arrows
 * Extends L.Polyline to create a unified arrow object with an integrated arrowhead
 */

L.Arrow = L.Polyline.extend({
  options: {
    arrowheadSize: 12,
    arrowheadAngle: 60, // degrees
    fill: false, // Don't fill the line itself, only the arrowhead
    fillOpacity: 0,
  },

  initialize(latlngs, options) {
    L.Polyline.prototype.initialize.call(this, latlngs, options);
    L.Util.setOptions(this, options);
    this._arrowheadSize = this.options.arrowheadSize;
    this._arrowheadAngle = this.options.arrowheadAngle;
  },

  _updatePath() {
    if (!this._renderer) {
      return;
    }

    const latlngs = this.getLatLngs();
    if (latlngs.length < 2) {
      return;
    }

    // Get the last two points to calculate arrowhead direction
    const lastPoint = latlngs[latlngs.length - 1];
    const secondLastPoint = latlngs[latlngs.length - 2];

    // Convert to pixel coordinates
    const p1 = this._map.latLngToLayerPoint(secondLastPoint);
    const p2 = this._map.latLngToLayerPoint(lastPoint);

    // Calculate arrowhead points
    const arrowheadPoints = this._calculateArrowheadPoints(
      p1,
      p2,
      this._arrowheadSize,
      this._arrowheadAngle
    );

    // Update the main line path
    L.Polyline.prototype._updatePath.call(this);

    // Add arrowhead
    this._updateArrowhead(p2, arrowheadPoints);
  },

  _calculateArrowheadPoints(p1, p2, size, angle) {
    // Calculate the angle of the line
    const lineAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

    // Convert angle from degrees to radians
    const halfAngle = (angle * Math.PI) / 360;

    // Calculate the two wing points of the arrowhead
    const wing1Angle = lineAngle + Math.PI - halfAngle;
    const wing2Angle = lineAngle + Math.PI + halfAngle;

    return {
      wing1: {
        x: p2.x + size * Math.cos(wing1Angle),
        y: p2.y + size * Math.sin(wing1Angle),
      },
      wing2: {
        x: p2.x + size * Math.cos(wing2Angle),
        y: p2.y + size * Math.sin(wing2Angle),
      },
    };
  },

  _updateArrowhead(tip, wings) {
    if (!this._arrowheadPath) {
      this._arrowheadPath = L.SVG.create('path');
      this._arrowheadPath.setAttribute('class', 'leaflet-arrow-head');
      this._renderer._container.appendChild(this._arrowheadPath);
    }

    // Create path data for stroked arrowhead (two lines forming a V shape)
    const pathData = `M ${wings.wing1.x} ${wings.wing1.y} L ${tip.x} ${tip.y} L ${wings.wing2.x} ${wings.wing2.y}`;

    this._arrowheadPath.setAttribute('d', pathData);
    this._arrowheadPath.setAttribute('fill', 'none');
    this._arrowheadPath.setAttribute('stroke', this.options.color || '#3388ff');
    this._arrowheadPath.setAttribute('stroke-width', this.options.weight || 3);
    this._arrowheadPath.setAttribute('stroke-linecap', 'round');
    this._arrowheadPath.setAttribute('stroke-linejoin', 'round');
  },

  onRemove(map) {
    if (this._arrowheadPath && this._arrowheadPath.parentNode) {
      this._arrowheadPath.parentNode.removeChild(this._arrowheadPath);
      this._arrowheadPath = null;
    }
    return L.Polyline.prototype.onRemove.call(this, map);
  },

  setArrowheadSize(size) {
    this._arrowheadSize = size;
    this.redraw();
    return this;
  },

  setArrowheadAngle(angle) {
    this._arrowheadAngle = angle;
    this.redraw();
    return this;
  },

  getArrowheadSize() {
    return this._arrowheadSize;
  },

  getArrowheadAngle() {
    return this._arrowheadAngle;
  },

  setStyle(style) {
    L.Polyline.prototype.setStyle.call(this, style);

    // Update arrowhead style if it exists
    if (this._arrowheadPath && style.color) {
      this._arrowheadPath.setAttribute('fill', style.color);
      this._arrowheadPath.setAttribute('stroke', style.color);
    }

    return this;
  },
});

// Factory function
L.arrow = function (latlngs, options) {
  return new L.Arrow(latlngs, options);
};

export default L.Arrow;
