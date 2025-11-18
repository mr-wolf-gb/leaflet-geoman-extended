import Edit from './L.PM.Edit';

Edit.Arrow = Edit.Line.extend({
  _shape: 'Arrow',

  initialize(layer) {
    this._layer = layer;
    this._enabled = false;
  },

  // Override to ensure arrowhead updates when vertices are moved
  _onMarkerDrag(e) {
    Edit.Line.prototype._onMarkerDrag.call(this, e);

    // Redraw arrowhead after vertex drag
    if (this._layer && this._layer.redraw) {
      this._layer.redraw();
    }
  },

  _onMarkerDragEnd(e) {
    Edit.Line.prototype._onMarkerDragEnd.call(this, e);

    // Ensure arrowhead is updated
    if (this._layer && this._layer.redraw) {
      this._layer.redraw();
    }
  },

  // Override to update arrowhead when layer is dragged
  _onLayerDrag(e) {
    if (Edit.Line.prototype._onLayerDrag) {
      Edit.Line.prototype._onLayerDrag.call(this, e);
    }

    // Redraw arrowhead during drag
    if (this._layer && this._layer.redraw) {
      this._layer.redraw();
    }
  },

  // Ensure arrowhead updates on style changes
  applyOptions() {
    Edit.Line.prototype.applyOptions.call(this);

    if (this._layer && this._layer.redraw) {
      this._layer.redraw();
    }
  },
});
