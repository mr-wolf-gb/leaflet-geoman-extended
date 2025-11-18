import Draw from './L.PM.Draw';
import { getTranslation } from '../helpers';

Draw.Freehand = Draw.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'Freehand';
    this.toolbarButtonName = 'drawFreehand';
  },
  enable(options) {
    L.Util.setOptions(this, options);

    this._enabled = true;
    this._isDrawing = false;

    // Determine if we're drawing a polygon or line based on freehandOptions.fill
    this._fillMode = this.options.freehandOptions?.fill ?? false;

    // create a new layergroup
    this._layerGroup = new L.FeatureGroup();
    this._layerGroup._pmTempLayer = true;
    this._layerGroup.addTo(this._map);

    // this is the polyLine that'll make up the freehand drawing
    this._layer = L.polyline([], {
      ...this.options.templineStyle,
      pmIgnore: false,
    });
    this._setPane(this._layer, 'layerPane');
    this._layer._pmTempLayer = true;
    this._layerGroup.addLayer(this._layer);

    // change map cursor
    this._map.getContainer().classList.add('geoman-draw-cursor');

    // bind events
    this._map.on('mousedown', this._onMouseDown, this);
    this._map.on('mousemove', this._onMouseMove, this);
    this._map.on('mouseup', this._onMouseUp, this);

    // toggle the draw button of the Toolbar
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, true);

    // fire drawstart event
    this._fireDrawStart();
    this._setGlobalDrawMode();
  },
  disable() {
    if (!this._enabled) {
      return;
    }

    this._enabled = false;

    // Re-enable map dragging if it was disabled
    if (this._map.dragging && !this._map.dragging.enabled()) {
      this._map.dragging.enable();
    }

    // reset cursor
    this._map.getContainer().classList.remove('geoman-draw-cursor');

    // unbind listeners
    this._map.off('mousedown', this._onMouseDown, this);
    this._map.off('mousemove', this._onMouseMove, this);
    this._map.off('mouseup', this._onMouseUp, this);

    // remove layer
    this._map.removeLayer(this._layerGroup);

    // Remove measurement tooltip marker
    if (this._measurementMarker) {
      this._map.removeLayer(this._measurementMarker);
      this._measurementMarker = null;
    }

    // toggle the draw button of the Toolbar
    this._map.pm.Toolbar.toggleButton(this.toolbarButtonName, false);

    // fire drawend event
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
  _onMouseDown(e) {
    if (!this._enabled) {
      return;
    }

    // Disable map dragging while drawing
    if (this._map.dragging) {
      this._map.dragging.disable();
    }

    this._isDrawing = true;
    this._layer._latlngInfo = [];

    // Create measurement tooltip marker when drawing starts
    if (
      this.options.measurements &&
      this.options.measurements.measurement &&
      this.options.measurements.showTooltip &&
      !this._measurementMarker
    ) {
      this._measurementMarker = L.marker(e.latlng, {
        icon: L.divIcon({
          className: 'leaflet-geoman-measurement-marker',
          iconSize: [0, 0],
        }),
        interactive: false,
        pmIgnore: true,
      });
      this._measurementMarker.addTo(this._map);

      this._measurementMarker.bindTooltip('', {
        permanent: true,
        sticky: false,
        className: 'geoman-measurement-tooltip',
        direction: 'top',
        offset: L.point(0, -10),
      });
      this._measurementMarker.openTooltip();
    }

    // start the line
    const latlng = e.latlng;
    this._layer.addLatLng(latlng);
    this._layer._latlngInfo.push({
      latlng,
      snapInfo: null,
    });

    this._change(this._layer.getLatLngs());
  },
  _onMouseMove(e) {
    if (!this._enabled || !this._isDrawing) {
      return;
    }

    // add point to the line
    const latlng = e.latlng;
    this._layer.addLatLng(latlng);
    this._layer._latlngInfo.push({
      latlng,
      snapInfo: null,
    });

    this._change(this._layer.getLatLngs());

    // Update measurements during drawing
    this._updateMeasurements(latlng);
  },
  _onMouseUp() {
    if (!this._enabled || !this._isDrawing) {
      return;
    }

    this._isDrawing = false;

    // Re-enable map dragging
    if (this._map.dragging) {
      this._map.dragging.enable();
    }

    // Remove measurement tooltip marker when drawing ends
    if (this._measurementMarker) {
      this._map.removeLayer(this._measurementMarker);
      this._measurementMarker = null;
    }

    // finish the shape
    this._finishShape();
  },
  _finishShape() {
    const coords = this._layer.getLatLngs();

    // if there are not enough points, don't finish
    if (coords.length < 2) {
      this.disable();
      return;
    }

    // create the leaflet shape based on fill mode
    let resultLayer;
    if (this._fillMode) {
      // Create polygon when fill is true
      resultLayer = L.polygon(coords, this.options.pathOptions);
    } else {
      // Create polyline when fill is false
      resultLayer = L.polyline(coords, this.options.pathOptions);
    }

    this._setPane(resultLayer, 'layerPane');
    this._finishLayer(resultLayer);
    resultLayer.addTo(this._map.pm._getContainingLayer());

    // Save measurements to the layer
    if (this.options.measurements && this.options.measurements.measurement) {
      this._updateLayerMeasurements(resultLayer);
      // Bind hover tooltip
      if (this.options.measurements.showTooltipOnHover !== false) {
        this._bindMeasurementTooltip(resultLayer);
      }
    }

    // fire the pm:create event and pass shape and layer
    this._fireCreate(resultLayer);

    const lastLatLng = coords[coords.length - 1];

    // disable drawing
    this.disable();
    if (this.options.continueDrawing) {
      this.enable();
      // trigger a mousedown at the last position to start a new line
      this._map.fire('mousedown', { latlng: lastLatLng });
    }
  },
  _change(latlngs) {
    this._fireChange(latlngs, 'Draw');
  },
  setStyle() {
    this._layer?.setStyle(this.options.templineStyle);
  },
  _updateMeasurements(cursorPosition) {
    if (
      !this.options.measurements ||
      !this.options.measurements.measurement ||
      !this.options.measurements.showTooltip ||
      !this._measurementMarker ||
      !this._layer
    ) {
      return;
    }

    const coords = this._layer.getLatLngs();
    if (coords.length < 2) {
      return;
    }

    // Create temporary layer for measurement calculation
    let tempLayer;
    if (this._fillMode) {
      tempLayer = L.polygon(coords);
    } else {
      tempLayer = L.polyline(coords);
    }

    // Calculate measurements
    const displayFormat = this.options.measurements.displayFormat || 'metric';
    const measurements = L.PM.Utils.getMeasurements(
      tempLayer,
      this._map,
      displayFormat
    );

    if (measurements) {
      const content = this._formatMeasurementTooltip(
        measurements,
        cursorPosition
      );
      if (content) {
        // Update marker position and tooltip content
        this._measurementMarker.setLatLng(cursorPosition);
        const tooltip = this._measurementMarker.getTooltip();
        if (tooltip) {
          tooltip.setContent(content);
        }
      }
    }
  },
  _formatMeasurementTooltip(measurements, cursorPosition) {
    if (!measurements) {
      return '';
    }

    const options = this.options.measurements || {};
    const lines = [];

    // Total Length (for Line)
    if (options.totalLength !== false && measurements.totalLength) {
      lines.push(`Length: ${measurements.totalLength}`);
    }

    // Area (for Polygon)
    if (options.area !== false && measurements.area) {
      lines.push(`Area: ${measurements.area}`);
    }

    // Perimeter (for Polygon)
    if (options.perimeter !== false && measurements.perimeter) {
      lines.push(`Perimeter: ${measurements.perimeter}`);
    }

    return lines.join('<br>');
  },
  _calculateMeasurements(layer) {
    if (!this.options.measurements || !this.options.measurements.measurement) {
      return null;
    }

    const displayFormat = this.options.measurements.displayFormat || 'metric';
    return L.PM.Utils.getMeasurements(layer, this._map, displayFormat);
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
});
