import Edit from './L.PM.Edit';

Edit.DangerousGoodsZones = Edit.LayerGroup.extend({
  _shape: 'DangerousGoodsZones',

  initialize(layer) {
    this._layer = layer;
    this._enabled = false;
  },

  enable(options) {
    L.Util.setOptions(this, options);

    this._map = this._layer._map;

    if (!this.enabled()) {
      this._enabled = true;

      // Don't enable PM for individual child layers since they have pmIgnore set
      // Instead, enable dragging for the entire group using LayerGroup's built-in functionality

      // Call the parent LayerGroup enable method to handle group dragging
      Edit.LayerGroup.prototype.enable.call(this, options);

      this._fireEdit();
    }

    return this._enabled;
  },

  disable() {
    if (this.enabled()) {
      this._enabled = false;

      // Call the parent LayerGroup disable method to handle group dragging
      Edit.LayerGroup.prototype.disable.call(this);

      this._fireEdit();
    }

    return this._enabled;
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

  _fireEdit() {
    this._layer.fire('pm:edit', {
      layer: this._layer,
      shape: this.getShape(),
    });
  },

  getShape() {
    return this._shape;
  },
});
