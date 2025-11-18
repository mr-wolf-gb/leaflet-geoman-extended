import Draw from './L.PM.Draw';
import { getTranslation } from '../helpers';

Draw.Circle2Points = Draw.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'Circle2Points';
    this.toolbarButtonName = 'drawCircle2Points';
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

    this._map.on('click', this._placeFirstPoint, this);
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
    this._map.off('click', this._placeFirstPoint, this);
    this._map.off('click', this._finishShape, this);
    this._map.off('mousemove', this._syncHintMarker, this);
    this._map.removeLayer(this._layerGroup);
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);

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
  _placeFirstPoint(e) {
    if (!this._hintMarker._snapped) {
      this._hintMarker.setLatLng(e.latlng);
    }

    this._firstPoint = this._hintMarker.getLatLng();

    this._firstMarker = L.marker(this._firstPoint, {
      icon: L.divIcon({ className: 'marker-icon' }),
      draggable: false,
      zIndexOffset: 100,
    });
    this._setPane(this._firstMarker, 'vertexPane');
    this._firstMarker._pmTempLayer = true;
    this._layerGroup.addLayer(this._firstMarker);
    this._layerGroup.addLayer(this._layer);

    this._map.off('click', this._placeFirstPoint, this);
    this._map.on('click', this._finishShape, this);

    if (this.options.tooltips) {
      this._hintMarker.setTooltipContent(
        getTranslation('tooltips.finishCircle')
      );
    }

    this._fireChange(this._firstPoint, 'Draw');
  },
  _syncHintMarker(e) {
    this._hintMarker.setLatLng(e.latlng);

    if (this.options.snappable) {
      const fakeDragEvent = e;
      fakeDragEvent.target = this._hintMarker;
      this._handleSnapping(fakeDragEvent);
    }

    if (this._firstPoint) {
      const secondPoint = this._hintMarker.getLatLng();
      this._hintline.setLatLngs([this._firstPoint, secondPoint]);

      const center = L.latLng(
        (this._firstPoint.lat + secondPoint.lat) / 2,
        (this._firstPoint.lng + secondPoint.lng) / 2
      );
      const radius = this._map.distance(this._firstPoint, secondPoint) / 2;

      this._layer.setLatLng(center);
      this._layer.setRadius(radius);

      // Update measurements in tooltip
      this._updateCircle2PointsMeasurements();

      this._fireChange(center, 'Draw');
    }
  },
  _updateCircle2PointsMeasurements() {
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
  _finishShape(e) {
    // Check if first point has been placed yet
    if (!this._firstPoint || !this._firstMarker) {
      // No first point placed yet, just cancel drawing
      this.disable();
      return;
    }

    if (
      this.options.requireSnapToFinish &&
      !this._hintMarker._snapped &&
      !this._isFirstLayer()
    ) {
      return;
    }

    if (e && e.latlng && !this._hintMarker._snapped) {
      this._hintMarker.setLatLng(e.latlng);
    }

    const secondPoint = this._hintMarker.getLatLng();
    const center = L.latLng(
      (this._firstPoint.lat + secondPoint.lat) / 2,
      (this._firstPoint.lng + secondPoint.lng) / 2
    );
    const radius = this._map.distance(this._firstPoint, secondPoint) / 2;

    const circleLayer = L.circle(center, {
      radius,
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
  setStyle() {
    this._layer?.setStyle(this.options.templineStyle);
    this._hintline?.setStyle(this.options.hintlineStyle);
  },
});
