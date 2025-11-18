// use function to create a new mixin object for keeping isolation
// to make it work for multiple map instances
const createKeyboardMixins = () => ({
  _lastEvents: { keydown: undefined, keyup: undefined, current: undefined },
  _keyboardShortcutsEnabled: true,
  _initKeyListener(map) {
    this.map = map;
    L.DomEvent.on(document, 'keydown keyup', this._onKeyListener, this);
    L.DomEvent.on(window, 'blur', this._onBlur, this);
    // clean up global listeners when current map instance is destroyed
    map.once('unload', this._unbindKeyListenerEvents, this);
  },
  _unbindKeyListenerEvents() {
    L.DomEvent.off(document, 'keydown keyup', this._onKeyListener, this);
    L.DomEvent.off(window, 'blur', this._onBlur, this);
  },
  _onKeyListener(e) {
    let focusOn = 'document';

    // .contains only supported since IE9, if you want to use Geoman with IE8 or lower you need to implement a polyfill for .contains
    // with focusOn the user can add a check if the key was pressed while the user interacts with the map
    if (this.map.getContainer().contains(e.target)) {
      focusOn = 'map';
    }

    const data = { event: e, eventType: e.type, focusOn };
    this._lastEvents[e.type] = data;
    this._lastEvents.current = data;

    this.map.pm._fireKeyeventEvent(e, e.type, focusOn);

    // Handle keyboard shortcuts on keydown
    if (e.type === 'keydown' && this._keyboardShortcutsEnabled) {
      this._handleKeyboardShortcuts(e, focusOn);
    }
  },
  _handleKeyboardShortcuts(e) {
    // Only handle shortcuts when focus is on map or document (not in input fields)
    const isInputField =
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable;

    if (isInputField) {
      return;
    }

    const key = e.key;
    const activeShape = this.map.pm.Draw.getActiveShape();

    // Escape key - finish or cancel drawing, or disable active modes
    if (key === 'Escape') {
      let handled = false;

      // Handle drawing mode
      if (activeShape) {
        const drawInstance = this.map.pm.Draw[activeShape];

        // Check if shape has been started (has a layer or markers placed)
        const hasStarted =
          drawInstance._layer ||
          (drawInstance._markers && drawInstance._markers.length > 0) ||
          (drawInstance._layerGroup &&
            drawInstance._centerMarker &&
            drawInstance._layerGroup.hasLayer(drawInstance._centerMarker));

        // Try to finish the shape if possible and it has been started
        if (
          hasStarted &&
          drawInstance._finishShape &&
          typeof drawInstance._finishShape === 'function'
        ) {
          // For shapes that can be finished (Polygon, Line, etc.)
          drawInstance._finishShape();
          handled = true;
        } else {
          // For shapes that haven't been started or can't be finished, just disable drawing
          this.map.pm.disableDraw(activeShape);
          handled = true;
        }
      }

      // Handle edit modes if not in drawing mode
      if (!handled) {
        // Check for global edit mode
        if (this.map.pm.globalEditModeEnabled()) {
          this.map.pm.disableGlobalEditMode();
          handled = true;
        }

        // Check for global drag mode
        if (!handled && this.map.pm.globalDragModeEnabled()) {
          this.map.pm.disableGlobalDragMode();
          handled = true;
        }

        // Check for global removal mode
        if (!handled && this.map.pm.globalRemovalModeEnabled()) {
          this.map.pm.disableGlobalRemovalMode();
          handled = true;
        }

        // Check for global cut mode
        if (!handled && this.map.pm.globalCutModeEnabled()) {
          this.map.pm.disableGlobalCutMode();
          handled = true;
        }

        // Check for global rotate mode
        if (!handled && this.map.pm.globalRotateModeEnabled()) {
          this.map.pm.disableGlobalRotateMode();
          handled = true;
        }

        // Check for global copy layer mode
        if (!handled && this.map.pm.globalCopyLayerModeEnabled()) {
          this.map.pm.disableGlobalCopyLayerMode();
          handled = true;
        }
      }

      if (handled) {
        e.preventDefault();
      }
    }

    // Enter key - finish drawing (alternative to Escape)
    if (key === 'Enter') {
      if (activeShape) {
        const drawInstance = this.map.pm.Draw[activeShape];

        if (
          drawInstance._finishShape &&
          typeof drawInstance._finishShape === 'function'
        ) {
          drawInstance._finishShape();
          e.preventDefault();
        }
      }
    }

    // Backspace or Delete key - remove last vertex while drawing
    if (key === 'Backspace' || key === 'Delete') {
      if (activeShape) {
        const drawInstance = this.map.pm.Draw[activeShape];

        // Check if the draw instance has a method to remove the last vertex
        if (
          drawInstance._removeLastVertex &&
          typeof drawInstance._removeLastVertex === 'function'
        ) {
          drawInstance._removeLastVertex();
          e.preventDefault();
        }
      }
    }

    // Ctrl/Cmd + Z - undo last vertex (same as Backspace/Delete)
    if ((e.ctrlKey || e.metaKey) && key === 'z') {
      if (activeShape) {
        const drawInstance = this.map.pm.Draw[activeShape];

        if (
          drawInstance._removeLastVertex &&
          typeof drawInstance._removeLastVertex === 'function'
        ) {
          drawInstance._removeLastVertex();
          e.preventDefault();
        }
      }
    }
  },
  _onBlur(e) {
    e.altKey = false;
    const data = { event: e, eventType: e.type, focusOn: 'document' };
    this._lastEvents[e.type] = data;
    this._lastEvents.current = data;
  },
  getLastKeyEvent(type = 'current') {
    return this._lastEvents[type];
  },
  isShiftKeyPressed() {
    return this._lastEvents.current?.event.shiftKey;
  },
  isAltKeyPressed() {
    return this._lastEvents.current?.event.altKey;
  },
  isCtrlKeyPressed() {
    return this._lastEvents.current?.event.ctrlKey;
  },
  isMetaKeyPressed() {
    return this._lastEvents.current?.event.metaKey;
  },
  getPressedKey() {
    return this._lastEvents.current?.event.key;
  },
  enableKeyboardShortcuts() {
    this._keyboardShortcutsEnabled = true;
  },
  disableKeyboardShortcuts() {
    this._keyboardShortcutsEnabled = false;
  },
  areKeyboardShortcutsEnabled() {
    return this._keyboardShortcutsEnabled;
  },
});

export default createKeyboardMixins;
