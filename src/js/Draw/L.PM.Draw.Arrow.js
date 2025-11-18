import Draw from './L.PM.Draw';
import { getTranslation } from '../helpers';
import '../Shapes/L.Arrow';

Draw.Arrow = Draw.Line.extend({
  initialize(map) {
    this._map = map;
    this._shape = 'Arrow';
    this.toolbarButtonName = 'drawArrow';
  },

  _finishShape() {
    // if self intersection is not allowed, do not finish the shape!
    if (!this.options.allowSelfIntersection) {
      this._handleSelfIntersection(false);

      if (this._doesSelfIntersect) {
        return;
      }
    }

    // If snap finish is required but the last marker wasn't snapped, do not finish the shape!
    if (
      this.options.requireSnapToFinish &&
      !this._hintMarker._snapped &&
      !this._isFirstLayer()
    ) {
      return;
    }

    // get coordinates
    const coords = this._layer.getLatLngs();

    // if there is only one coords, don't finish the shape!
    if (coords.length <= 1) {
      return;
    }

    // Create the custom Arrow layer
    const arrowLayer = new L.Arrow(coords, {
      ...this.options.pathOptions,
      arrowheadSize: this.options.arrowheadSize || 12,
      arrowheadAngle: this.options.arrowheadAngle || 60,
    });

    // Mark as Arrow shape for PM
    arrowLayer.pm = arrowLayer.pm || {};
    arrowLayer.pm._shape = 'Arrow';

    this._setPane(arrowLayer, 'layerPane');
    this._finishLayer(arrowLayer);
    arrowLayer.addTo(this._map.pm._getContainingLayer());

    // Save measurements to the layer
    if (this.options.measurements && this.options.measurements.measurement) {
      this._updateLayerMeasurements(arrowLayer);
      // Bind hover tooltip
      if (this.options.measurements.showTooltipOnHover !== false) {
        this._bindMeasurementTooltip(arrowLayer);
      }
    }

    // fire the pm:create event and pass shape and layer
    this._fireCreate(arrowLayer);

    if (this.options.snappable) {
      this._cleanupSnapping();
    }

    const hintMarkerLatLng = this._hintMarker.getLatLng();

    // disable drawing
    this.disable();
    if (this.options.continueDrawing) {
      this.enable();
      this._hintMarker.setLatLng(hintMarkerLatLng);
    }
  },

  _setTooltipText() {
    const { length } = this._layer.getLatLngs().flat();
    let text = '';

    // handle tooltip text
    if (length <= 1) {
      text = getTranslation('tooltips.continueArrow');
    } else {
      text = getTranslation('tooltips.finishArrow');
    }

    // Add measurements if enabled
    if (
      this.options.measurements &&
      this.options.measurements.measurement &&
      this.options.measurements.showTooltip
    ) {
      const measurements = this._calculateMeasurements(this._layer);
      if (measurements) {
        // Get cursor position from hint marker
        const cursorPosition = this._hintMarker.getLatLng();
        const measurementText = this._formatMeasurementTooltip(
          measurements,
          cursorPosition
        );
        if (measurementText) {
          text += '<br>' + measurementText;
        }
      }
    }

    this._hintMarker.setTooltipContent(text);
  },
});
