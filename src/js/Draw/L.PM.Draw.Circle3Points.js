import Draw from './L.PM.Draw';
import { getTranslation } from '../helpers';

Draw.Circle3Points = Draw.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'Circle3Points';
    this.toolbarButtonName = 'drawCircle3Points';
    this._points = [];
  },
  enable(options) {
    L.Util.setOptions(this, options);

    this._enabled = true;
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, true);
    this._map.getContainer().classList.add('geoman-draw-cursor');

    this._layerGroup = new L.FeatureGroup();
    this._layerGroup._pmTempLayer = true;
    this._layerGroup.addTo(this._map);

    this._layer = L.circle(this._map.getCenter(), {
      radius: 0,
      ...this.options.templineStyle,
    });
    this._setPane(this._layer, 'layerPane');
    this._layer._pmTempLayer = true;

    this._hintMarker = L.marker(this._map.getCenter(), {
      zIndexOffset: 110,
      icon: L.divIcon({ className: 'marker-icon cursor-marker' }),
    });
    this._setPane(this._hintMarker, 'vertexPane');
    this._hintMarker._pmTempLayer = true;
    this._layerGroup.addLayer(this._hintMarker);

    if (this.options.cursorMarker) {
      L.DomUtil.addClass(this._hintMarker._icon, 'visible');
    }

    if (this.options.tooltips) {
      this._hintMarker
        .bindTooltip(getTranslation('tooltips.firstVertex'), {
          permanent: true,
          offset: L.point(0, 10),
          direction: 'bottom',
          opacity: 0.8,
        })
        .openTooltip();
    }

    this._hintline = L.polyline([], this.options.hintlineStyle);
    this._setPane(this._hintline, 'layerPane');
    this._hintline._pmTempLayer = true;
    this._layerGroup.addLayer(this._hintline);

    this._markers = [];
    this._points = [];

    this._map.on('click', this._placePoint, this);
    this._map.on('mousemove', this._syncHintMarker, this);

    this._otherSnapLayers = [];
    this._fireDrawStart();
    this._setGlobalDrawMode();
  },
  disable() {
    if (!this._enabled) {
      return;
    }

    this._enabled = false;
    this._map.getContainer().classList.remove('geoman-draw-cursor');
    this._map.off('click', this._placePoint, this);
    this._map.off('mousemove', this._syncHintMarker, this);
    this._map.removeLayer(this._layerGroup);
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);

    this._points = [];
    this._markers = [];

    if (this.options.snappable) {
      this._cleanupSnapping();
    }

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
  _placePoint(e) {
    if (!this._hintMarker._snapped) {
      this._hintMarker.setLatLng(e.latlng);
    }

    const latlng = this._hintMarker.getLatLng();
    this._points.push(latlng);

    const marker = L.marker(latlng, {
      icon: L.divIcon({ className: 'marker-icon' }),
      draggable: false,
      zIndexOffset: 100,
    });
    this._setPane(marker, 'vertexPane');
    marker._pmTempLayer = true;
    this._layerGroup.addLayer(marker);
    this._markers.push(marker);

    if (this._points.length === 1) {
      if (this.options.tooltips) {
        this._hintMarker.setTooltipContent(
          getTranslation('tooltips.continueLine')
        );
      }
    } else if (this._points.length === 2) {
      this._layerGroup.addLayer(this._layer);
      if (this.options.tooltips) {
        this._hintMarker.setTooltipContent(
          getTranslation('tooltips.finishCircle')
        );
      }
    } else if (this._points.length === 3) {
      this._finishShape();
    }

    this._fireChange(latlng, 'Draw');
  },
  _syncHintMarker(e) {
    this._hintMarker.setLatLng(e.latlng);

    if (this.options.snappable) {
      const fakeDragEvent = e;
      fakeDragEvent.target = this._hintMarker;
      this._handleSnapping(fakeDragEvent);
    }

    if (this._points.length > 0) {
      const hintLatLng = this._hintMarker.getLatLng();
      const linePoints = [...this._points, hintLatLng];
      this._hintline.setLatLngs(linePoints);

      if (this._points.length === 2) {
        const circle = this._calculateCircleFrom3Points(
          this._points[0],
          this._points[1],
          hintLatLng
        );
        if (circle) {
          this._layer.setLatLng(circle.center);
          this._layer.setRadius(circle.radius);

          // Update measurements in tooltip
          this._updateCircle3PointsMeasurements();

          this._fireChange(circle.center, 'Draw');
        }
      }
    }
  },
  _updateCircle3PointsMeasurements() {
    if (
      !this.options.measurements ||
      !this.options.measurements.measurement ||
      !this.options.measurements.showTooltip ||
      !this._hintMarker
    ) {
      return;
    }

    const measurements = this._calculateMeasurements(this._layer);
    if (measurements) {
      const cursorPosition = this._hintMarker.getLatLng();
      const measurementText = this._formatMeasurementTooltip(
        measurements,
        cursorPosition
      );
      if (measurementText) {
        const currentText = getTranslation('tooltips.finishCircle');
        this._hintMarker.setTooltipContent(
          currentText + '<br>' + measurementText
        );
      }
    }
  },
  _finishShape() {
    if (
      this.options.requireSnapToFinish &&
      !this._hintMarker._snapped &&
      !this._isFirstLayer()
    ) {
      return;
    }

    const circle = this._calculateCircleFrom3Points(
      this._points[0],
      this._points[1],
      this._points[2]
    );

    if (!circle) {
      this.disable();
      return;
    }

    const circleLayer = L.circle(circle.center, {
      radius: circle.radius,
      ...this.options.pathOptions,
    });
    this._setPane(circleLayer, 'layerPane');
    this._finishLayer(circleLayer);
    circleLayer.addTo(this._map.pm._getContainingLayer());

    if (circleLayer.pm) {
      circleLayer.pm._updateHiddenPolyCircle();
    }

    // Save measurements to the layer
    if (this.options.measurements && this.options.measurements.measurement) {
      this._updateLayerMeasurements(circleLayer);
      // Bind hover tooltip
      if (this.options.measurements.showTooltipOnHover !== false) {
        this._bindMeasurementTooltip(circleLayer);
      }
    }

    this._fireCreate(circleLayer);

    const hintMarkerLatLng = this._hintMarker.getLatLng();
    this.disable();
    if (this.options.continueDrawing) {
      this.enable();
      this._hintMarker.setLatLng(hintMarkerLatLng);
    }
  },
  _calculateCircleFrom3Points(p1, p2, p3) {
    // Convert lat/lng to projected coordinates for calculation
    const point1 = this._map.project(p1);
    const point2 = this._map.project(p2);
    const point3 = this._map.project(p3);

    const ax = point1.x;
    const ay = point1.y;
    const bx = point2.x;
    const by = point2.y;
    const cx = point3.x;
    const cy = point3.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

    if (Math.abs(d) < 1e-10) {
      // Points are collinear
      return null;
    }

    const ux =
      ((ax * ax + ay * ay) * (by - cy) +
        (bx * bx + by * by) * (cy - ay) +
        (cx * cx + cy * cy) * (ay - by)) /
      d;
    const uy =
      ((ax * ax + ay * ay) * (cx - bx) +
        (bx * bx + by * by) * (ax - cx) +
        (cx * cx + cy * cy) * (bx - ax)) /
      d;

    const centerPoint = L.point(ux, uy);
    const center = this._map.unproject(centerPoint);

    const radius = this._map.distance(center, p1);

    return { center, radius };
  },
  setStyle() {
    this._layer?.setStyle(this.options.templineStyle);
    this._hintline?.setStyle(this.options.hintlineStyle);
  },
});
