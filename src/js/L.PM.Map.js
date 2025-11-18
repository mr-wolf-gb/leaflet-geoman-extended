import merge from 'lodash/merge';
import translations from '../assets/translations';
import GlobalEditMode from './Mixins/Modes/Mode.Edit';
import GlobalDragMode from './Mixins/Modes/Mode.Drag';
import GlobalRemovalMode from './Mixins/Modes/Mode.Removal';
import GlobalRotateMode from './Mixins/Modes/Mode.Rotate';
import GlobalCopyLayerMode from './Mixins/Modes/Mode.Copy';
import EventMixin from './Mixins/Events';
import createKeyboardMixins from './Mixins/Keyboard';
import { getRenderer } from './helpers';
import Library from './Library/L.PM.Library.js';

const Map = L.Class.extend({
  includes: [
    GlobalEditMode,
    GlobalDragMode,
    GlobalRemovalMode,
    GlobalRotateMode,
    GlobalCopyLayerMode,
    EventMixin,
  ],
  initialize(map) {
    this.map = map;
    this.Draw = new L.PM.Draw(map);
    this.Toolbar = new L.PM.Toolbar(map);
    this.Library = new Library(map);
    this.Keyboard = createKeyboardMixins();

    this.globalOptions = {
      snappable: true,
      layerGroup: undefined,
      snappingOrder: [
        'Marker',
        'CircleMarker',
        'Circle',
        'Line',
        'Arrow',
        'Polygon',
        'Rectangle',
      ],
      panes: {
        vertexPane: 'markerPane',
        layerPane: 'overlayPane',
        markerPane: 'markerPane',
      },
      draggable: true,
      measurements: {
        measurement: false,
        showTooltip: true,
        showTooltipOnHover: true,
        displayFormat: 'metric',
        totalLength: true,
        segmentLength: true,
        area: true,
        radius: true,
        perimeter: true,
        height: true,
        width: true,
        coordinates: true,
      },
      library: {
        enabled: false,
        json: null,
        url: null,
        autoLoad: true,
        panelPosition: 'topright', // 'topleft', 'topright', 'bottomleft', 'bottomright'
        urlOptions: {
          cache: true,
          timeout: 10000,
          method: 'GET',
          mode: 'cors',
          credentials: 'same-origin',
          redirect: 'follow',
          referrerPolicy: 'no-referrer-when-downgrade',
          headers: {},
          auth: null,
          tls: {
            rejectUnauthorized: true,
          },
        },
      },
    };

    this.Keyboard._initKeyListener(map);

    // Initialize library from global options
    this._initLibraryFromGlobalOptions();
  },

  setLang(lang = 'en', override, fallback = 'en', options = {}) {
    // Normalize the language code to lowercase and trim any whitespace
    lang = lang.trim().toLowerCase();

    // Extract RTL option from options parameter
    // options can be: { rtl: true/false } or just a boolean for backward compatibility
    let rtlOption = null;
    if (typeof options === 'object' && options !== null) {
      rtlOption = options.rtl;
    } else if (
      typeof override === 'object' &&
      override !== null &&
      typeof override.rtl !== 'undefined'
    ) {
      // Support passing rtl in override object for backward compatibility
      rtlOption = override.rtl;
    }

    // First, check if the input is already in the expected format (e.g., 'fr')
    if (/^[a-z]{2}$/.test(lang)) {
      // No further processing needed for single-letter codes
    } else {
      // Handle formats like 'fr-FR', 'FR', 'fr-fr', 'fr_FR'
      const normalizedLang = lang
        .replace(/[-_\s]/g, '-')
        .replace(/^(\w{2})$/, '$1-');
      const match = normalizedLang.match(/([a-z]{2})-?([a-z]{2})?/);

      if (match) {
        // Construct potential keys to search for in the translations object
        const potentialKeys = [
          `${match[1]}_${match[2]}`, // e.g., 'fr_BR'
          `${match[1]}`, // e.g., 'fr'
        ];

        // Search through the translations object for a matching key
        for (const key of potentialKeys) {
          if (translations[key]) {
            lang = key; // Set lang to the matching key
            break; // Exit the loop once a match is found
          }
        }
      }
    }

    const oldLang = L.PM.activeLang;
    if (override) {
      translations[lang] = merge(translations[fallback], override);
    }

    L.PM.activeLang = lang;

    // Determine RTL mode
    // Priority: 1. Explicit rtl option, 2. Auto-detect from language, 3. Current state
    const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
    const mapContainer = this.map.getContainer();

    let isRTL;
    if (rtlOption !== null && rtlOption !== undefined) {
      // Explicit RTL option provided
      isRTL = Boolean(rtlOption);
    } else {
      // Auto-detect based on language
      isRTL = rtlLanguages.includes(lang);
    }

    // Apply RTL settings
    this.setRTL(isRTL);

    this.map.pm.Toolbar.reinit();
    this._fireLangChange(oldLang, lang, fallback, translations[lang]);
  },

  /**
   * Set RTL (Right-to-Left) mode
   * @param {boolean} enabled - Enable or disable RTL mode
   */
  setRTL(enabled) {
    const mapContainer = this.map.getContainer();
    const isRTL = Boolean(enabled);

    if (isRTL) {
      // Enable RTL mode
      mapContainer.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('dir', 'rtl');

      // Store RTL state globally
      L.PM.isRTL = true;

      // Patch Leaflet's Tooltip to handle RTL positioning
      // This ensures tooltips follow the cursor correctly in RTL mode
      if (!L.Tooltip.prototype._pmRTLPatched) {
        const originalSetLatLng = L.Tooltip.prototype.setLatLng;

        L.Tooltip.prototype.setLatLng = function (latlng) {
          // Call original method
          const result = originalSetLatLng.call(this, latlng);

          // In RTL mode, Leaflet's positioning is already correct
          // We just need to ensure the tooltip pane direction doesn't interfere
          if (L.PM.isRTL && this._container) {
            // Ensure tooltip content is RTL but positioning is LTR
            this._container.style.direction = 'rtl';
          }

          return result;
        };

        L.Tooltip.prototype._pmRTLPatched = true;
      }
    } else {
      // Disable RTL mode
      mapContainer.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('dir', 'ltr');
      L.PM.isRTL = false;
    }

    // Fire RTL change event
    this.map.fire('pm:langchange', {
      rtl: isRTL,
      activeLang: L.PM.activeLang,
    });

    return isRTL;
  },

  /**
   * Get current RTL state
   * @returns {boolean} - Current RTL state
   */
  getRTL() {
    return Boolean(L.PM.isRTL);
  },

  addControls(options) {
    this.Toolbar.addControls(options);
  },
  removeControls() {
    this.Toolbar.removeControls();
  },
  toggleControls() {
    this.Toolbar.toggleControls();
  },
  controlsVisible() {
    return this.Toolbar.isVisible;
  },

  enableDraw(shape = 'Polygon', options) {
    // backwards compatible, remove after 3.0
    if (shape === 'Poly') {
      shape = 'Polygon';
    }

    this.Draw.enable(shape, options);
  },
  disableDraw(shape = 'Polygon') {
    // backwards compatible, remove after 3.0
    if (shape === 'Poly') {
      shape = 'Polygon';
    }

    this.Draw.disable(shape);
  },
  // optionsModifier for special options like ignoreShapes or merge
  setPathOptions(options, optionsModifier = {}) {
    const ignore = optionsModifier.ignoreShapes || [];
    const mergeOptions = optionsModifier.merge || false;

    this.map.pm.Draw.shapes.forEach((shape) => {
      if (ignore.indexOf(shape) === -1) {
        this.map.pm.Draw[shape].setPathOptions(options, mergeOptions);
      }
    });
  },

  getGlobalOptions() {
    return this.globalOptions;
  },
  setGlobalOptions(o) {
    // merge passed and existing options
    const options = merge(this.globalOptions, o);

    // TODO: remove with next major release
    if (options.editable) {
      options.resizeableCircleMarker = options.editable;
      delete options.editable;
    }

    // check if switched the editable mode for CircleMarker while drawing
    let reenableCircleMarker = false;
    if (
      this.map.pm.Draw.CircleMarker.enabled() &&
      !!this.map.pm.Draw.CircleMarker.options.resizeableCircleMarker !==
        !!options.resizeableCircleMarker
    ) {
      this.map.pm.Draw.CircleMarker.disable();
      reenableCircleMarker = true;
    }
    // check if switched the editable mode for Circle while drawing
    let reenableCircle = false;
    if (
      this.map.pm.Draw.Circle.enabled() &&
      !!this.map.pm.Draw.Circle.options.resizeableCircle !==
        !!options.resizeableCircle
    ) {
      this.map.pm.Draw.Circle.disable();
      reenableCircle = true;
    }

    // enable options for Drawing Shapes
    this.map.pm.Draw.shapes.forEach((shape) => {
      this.map.pm.Draw[shape].setOptions(options);
    });

    if (reenableCircleMarker) {
      this.map.pm.Draw.CircleMarker.enable();
    }

    if (reenableCircle) {
      this.map.pm.Draw.Circle.enable();
    }

    // enable options for Editing
    const layers = L.PM.Utils.findLayers(this.map);
    layers.forEach((layer) => {
      layer.pm.setOptions(options);
    });

    this.map.fire('pm:globaloptionschanged');

    // store options
    this.globalOptions = options;

    // apply the options (actually trigger the functionality)
    this.applyGlobalOptions();

    // handle library options changes
    this._handleLibraryOptionsChange(o);
  },
  applyGlobalOptions() {
    const layers = L.PM.Utils.findLayers(this.map);
    layers.forEach((layer) => {
      if (layer.pm.enabled()) {
        layer.pm.applyOptions();
      }
    });
  },
  globalDrawModeEnabled() {
    return !!this.Draw.getActiveShape();
  },
  globalCutModeEnabled() {
    return !!this.Draw.Cut.enabled();
  },
  enableGlobalCutMode(options) {
    return this.Draw.Cut.enable(options);
  },
  toggleGlobalCutMode(options) {
    return this.Draw.Cut.toggle(options);
  },
  disableGlobalCutMode() {
    return this.Draw.Cut.disable();
  },
  getGeomanLayers(asGroup = false) {
    const layers = L.PM.Utils.findLayers(this.map);
    if (!asGroup) {
      return layers;
    }
    const group = L.featureGroup();
    group._pmTempLayer = true;
    layers.forEach((layer) => {
      group.addLayer(layer);
    });
    return group;
  },
  getGeomanDrawLayers(asGroup = false) {
    const layers = L.PM.Utils.findLayers(this.map).filter(
      (l) => l._drawnByGeoman === true
    );
    if (!asGroup) {
      return layers;
    }
    const group = L.featureGroup();
    group._pmTempLayer = true;
    layers.forEach((layer) => {
      group.addLayer(layer);
    });
    return group;
  },
  /**
   * Export all Geoman layers as GeoJSON
   * @param {Object} options - Export options
   * @param {boolean} options.onlyDrawn - Export only layers drawn by Geoman (default: false)
   * @returns {Object} GeoJSON FeatureCollection
   */
  exportGeoJSON(options = {}) {
    const { onlyDrawn = false } = options;

    // Get layers based on filter
    let layers = onlyDrawn
      ? this.getGeomanDrawLayers()
      : this.getGeomanLayers();

    // Also find LayerGroups/FeatureGroups (like DangerousGoodsZones) which aren't included in findLayers
    const layerGroups = [];
    this.map.eachLayer((layer) => {
      if (
        (layer instanceof L.LayerGroup || layer instanceof L.FeatureGroup) &&
        layer._drawnByGeoman &&
        !layer._pmTempLayer &&
        layer._dangerousGoodsZones // Only include dangerous goods zones or other special groups
      ) {
        if (!onlyDrawn || layer._drawnByGeoman === true) {
          layerGroups.push(layer);
        }
      }
    });

    // Combine regular layers and layer groups
    layers = [...layers, ...layerGroups];

    // Build GeoJSON manually to preserve all special properties
    const features = [];

    layers.forEach((layer) => {
      // Skip temp layers
      if (layer._pmTempLayer) {
        return;
      }

      // Handle LayerGroups/FeatureGroups (like DangerousGoodsZones)
      if (
        (layer instanceof L.LayerGroup || layer instanceof L.FeatureGroup) &&
        layer._dangerousGoodsZones
      ) {
        // Export each layer in the group
        layer.eachLayer((subLayer) => {
          const subFeature = this._exportLayer(subLayer);
          if (subFeature) {
            // Mark as part of a layer group
            subFeature.properties = subFeature.properties || {};
            subFeature.properties._partOfLayerGroup = true;
            if (layer._dangerousGoodsZones) {
              subFeature.properties._dangerousGoodsZone = true;
            }
            features.push(subFeature);
          }
        });
        return;
      }

      const feature = this._exportLayer(layer);
      if (feature) {
        features.push(feature);
      }
    });

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    // Fire export event
    this.map.fire('pm:export', { geojson, layers });

    return geojson;
  },

  /**
   * Export a single layer to GeoJSON feature
   * @private
   */
  _exportLayer(layer) {
    if (!layer.toGeoJSON) {
      return null;
    }

    const feature = layer.toGeoJSON();
    feature.properties = feature.properties || {};

    // Preserve circle radius
    if (layer instanceof L.Circle) {
      feature.properties.radius = layer.getRadius();
      feature.properties._layerType = 'Circle';
    } else if (
      layer instanceof L.CircleMarker &&
      !(layer instanceof L.Circle)
    ) {
      feature.properties.radius = layer.getRadius();
      feature.properties._layerType = 'CircleMarker';
    }

    // Preserve text marker content
    if (layer.options && layer.options.textMarker && layer.pm) {
      feature.properties._layerType = 'Text';
      feature.properties._textMarker = true;

      // Get text content
      if (layer.pm.isRichText && layer.pm.textArea) {
        feature.properties._text = layer.pm.textArea.innerHTML;
        feature.properties._isRichText = true;
      } else if (layer.pm.textArea) {
        feature.properties._text = layer.pm.getText();
        feature.properties._isRichText = false;
      }

      // Get text styling
      if (layer.pm.options) {
        feature.properties._backgroundColor = layer.pm.options.backgroundColor;
        feature.properties._fontSize = layer.pm.options.fontSize;
      }

      // Get CSS classes
      if (layer.pm.textArea && layer.pm.textArea.className) {
        feature.properties._textClassName = layer.pm.textArea.className;
      }
    }
    // Preserve marker icon data
    else if (layer instanceof L.Marker) {
      const icon = layer.options.icon;

      // Check if marker has an icon
      if (icon) {
        // L.Icon (image-based)
        if (icon instanceof L.Icon && icon.options && icon.options.iconUrl) {
          feature.properties._layerType = 'Marker';
          feature.properties._iconType = 'image';
          feature.properties._iconUrl = icon.options.iconUrl;
          feature.properties._iconSize = icon.options.iconSize;
          feature.properties._iconAnchor = icon.options.iconAnchor;
          feature.properties._popupAnchor = icon.options.popupAnchor;
          feature.properties._shadowUrl = icon.options.shadowUrl;
          feature.properties._shadowSize = icon.options.shadowSize;
          feature.properties._shadowAnchor = icon.options.shadowAnchor;
        }
        // L.DivIcon (HTML/SVG-based)
        else if (icon instanceof L.DivIcon) {
          feature.properties._layerType = 'Marker';
          feature.properties._iconType = 'divIcon';
          feature.properties._iconHtml = icon.options.html;
          feature.properties._iconClassName = icon.options.className;
          feature.properties._iconSize = icon.options.iconSize;
          feature.properties._iconAnchor = icon.options.iconAnchor;
        }
      }
    }

    // Preserve distance line data
    if (layer._distanceLabels && layer._distanceLabels.length > 0) {
      feature.properties._layerType = 'DistanceLine';
      feature.properties._distanceInterval = layer._distanceInterval;
      feature.properties._distanceUnit = layer._distanceUnit;

      // Export distance label positions and info
      feature.properties._distanceLabels = layer._distanceLabels.map(
        (label) => ({
          latlng: [label.getLatLng().lat, label.getLatLng().lng],
          distanceInfo: label._distanceInfo,
        })
      );
    }

    // Preserve layer options/style
    if (layer.options) {
      const styleProps = [
        'color',
        'fillColor',
        'fillOpacity',
        'weight',
        'opacity',
        'dashArray',
        'lineCap',
        'lineJoin',
      ];
      styleProps.forEach((prop) => {
        if (layer.options[prop] !== undefined) {
          feature.properties[prop] = layer.options[prop];
        }
      });
    }

    return feature;
  },
  /**
   * Import GeoJSON and add layers to the map
   * @param {Object} geojson - GeoJSON object to import
   * @param {Object} options - Import options
   * @param {boolean} options.clearExisting - Clear existing Geoman layers before import (default: false)
   * @param {boolean} options.markAsDrawn - Mark imported layers as drawn by Geoman (default: true)
   * @param {Object} options.layerOptions - Options to apply to imported layers
   * @returns {Array} Array of imported layers
   */
  importGeoJSON(geojson, options = {}) {
    const {
      clearExisting = false,
      markAsDrawn = true,
      layerOptions = {},
    } = options;

    // Clear existing layers if requested
    if (clearExisting) {
      const existingLayers = this.getGeomanLayers();
      existingLayers.forEach((layer) => {
        layer.remove();
      });
    }

    const importedLayers = [];
    const container = this._getContainingLayer();

    // Process each feature
    if (geojson.type === 'FeatureCollection') {
      geojson.features.forEach((feature) => {
        const layer = this._importFeature(feature, layerOptions, markAsDrawn);
        if (layer) {
          importedLayers.push(layer);
        }
      });
    } else if (geojson.type === 'Feature') {
      const layer = this._importFeature(geojson, layerOptions, markAsDrawn);
      if (layer) {
        importedLayers.push(layer);
      }
    }

    // Fire import event
    this.map.fire('pm:import', {
      geojson,
      layers: importedLayers,
      clearExisting,
    });

    return importedLayers;
  },

  /**
   * Import a single GeoJSON feature
   * @private
   */
  _importFeature(feature, layerOptions, markAsDrawn) {
    const props = feature.properties || {};
    const container = this._getContainingLayer();

    // Extract style properties from saved feature
    const savedStyles = {};
    const styleProps = [
      'color',
      'fillColor',
      'fillOpacity',
      'weight',
      'opacity',
      'dashArray',
      'lineCap',
      'lineJoin',
    ];

    styleProps.forEach((prop) => {
      if (props[prop] !== undefined) {
        savedStyles[prop] = props[prop];
      }
    });

    // Merge: layerOptions as base, then saved styles override
    const styleOptions = {
      ...layerOptions,
      ...savedStyles,
    };

    let layer = null;

    // Handle Text Markers
    if (props._layerType === 'Text' && props._textMarker) {
      layer = this._importTextMarker(feature, styleOptions);
    }
    // Handle Markers (including Library Items for backward compatibility)
    else if (props._layerType === 'Marker' || props._layerType === 'LibraryItem') {
      layer = this._importMarker(feature, styleOptions);
    }
    // Handle Distance Lines
    else if (props._layerType === 'DistanceLine') {
      layer = this._importDistanceLine(feature, styleOptions);
    }
    // Handle Circles
    else if (props._layerType === 'Circle' && props.radius !== undefined) {
      const latlng = L.GeoJSON.coordsToLatLng(feature.geometry.coordinates);
      layer = L.circle(latlng, {
        radius: props.radius,
        ...styleOptions,
      });
    }
    // Handle CircleMarkers
    else if (
      props._layerType === 'CircleMarker' &&
      props.radius !== undefined
    ) {
      const latlng = L.GeoJSON.coordsToLatLng(feature.geometry.coordinates);
      layer = L.circleMarker(latlng, {
        radius: props.radius,
        ...styleOptions,
      });
    }
    // Handle regular GeoJSON
    else {
      layer = L.geoJSON(feature, {
        style: styleOptions,
        pointToLayer: (feat, latlng) => {
          return L.marker(latlng, layerOptions);
        },
      });

      // Extract the actual layer from the GeoJSON layer
      if (layer.getLayers) {
        const layers = layer.getLayers();
        if (layers.length > 0) {
          layer = layers[0];
        }
      }
    }

    if (!layer) {
      return null;
    }

    // Mark as drawn by Geoman
    if (markAsDrawn) {
      layer._drawnByGeoman = true;
    }

    // Add to map
    layer.addTo(container);

    // Initialize PM
    if (layer.pm) {
      layer.pm.setOptions(this.globalOptions);
    } else {
      L.PM.reInitLayer(layer);
      if (layer.pm) {
        layer.pm.setOptions(this.globalOptions);
      }
    }

    return layer;
  },

  /**
   * Import a text marker
   * @private
   */
  _importTextMarker(feature, styleOptions) {
    const props = feature.properties;
    const latlng = L.GeoJSON.coordsToLatLng(feature.geometry.coordinates);

    // Create text area element
    const textArea = document.createElement('div');
    textArea.className = props._textClassName || 'pm-textarea pm-disabled';
    textArea.contentEditable = false;

    // Set text content
    if (props._text) {
      if (props._isRichText) {
        textArea.innerHTML = props._text;
      } else {
        textArea.textContent = props._text;
      }
    }

    // Apply styling
    if (props._backgroundColor) {
      textArea.style.backgroundColor = props._backgroundColor;
    }
    if (props._fontSize) {
      textArea.style.fontSize = `${props._fontSize}px`;
    }

    // Create icon
    const textAreaIcon = L.divIcon({
      className: 'pm-text-marker',
      html: textArea,
    });

    // Create marker
    const marker = L.marker(latlng, {
      textMarker: true,
      _textMarkerOverPM: true,
      icon: textAreaIcon,
      ...styleOptions,
    });

    // Store text properties
    marker.options.text = props._text;

    // After adding to map, initialize PM
    marker.once('add', () => {
      if (marker.pm) {
        marker.pm.textArea = textArea;
        marker.pm.isRichText = props._isRichText || false;
        L.setOptions(marker.pm, {
          removeIfEmpty: true,
          backgroundColor: props._backgroundColor,
          fontSize: props._fontSize,
        });
        marker.pm._createTextMarker(false);
      }
    });

    return marker;
  },

  /**
   * Import a distance line
   * @private
   */
  _importDistanceLine(feature, styleOptions) {
    const props = feature.properties;
    const coords = L.GeoJSON.coordsToLatLngs(
      feature.geometry.coordinates,
      feature.geometry.type === 'LineString' ? 0 : 1
    );

    // Create polyline
    const polyline = L.polyline(coords, styleOptions);

    // Store distance configuration
    polyline._distanceInterval = props._distanceInterval;
    polyline._distanceUnit = props._distanceUnit;
    polyline._distanceLabels = [];
    polyline._distanceBullets = [];

    // Recreate distance labels and bullets
    if (props._distanceLabels && props._distanceLabels.length > 0) {
      polyline.once('add', () => {
        props._distanceLabels.forEach((labelData) => {
          const latlng = L.latLng(labelData.latlng[0], labelData.latlng[1]);

          // Create bullet marker
          const bulletMarker = L.circleMarker(latlng, {
            radius: 5,
            fillColor: '#ffffff',
            fillOpacity: 1,
            color: '#3388ff',
            weight: 3,
            interactive: false,
          });
          bulletMarker.addTo(polyline._map);
          polyline._distanceBullets.push(bulletMarker);

          // Calculate label width
          const textLength = labelData.distanceInfo.label.length;
          const estimatedWidth = textLength * 6 + 6;
          const horizontalAnchor = estimatedWidth / 2;

          // Create label marker
          const label = L.marker(latlng, {
            icon: L.divIcon({
              className: 'geoman-distance-label',
              html: `<div class="geoman-distance-label-content">${labelData.distanceInfo.label}</div>`,
              iconSize: 'auto',
              iconAnchor: [horizontalAnchor, 24],
            }),
            interactive: false,
          });
          label._distanceInfo = labelData.distanceInfo;
          label.addTo(polyline._map);
          polyline._distanceLabels.push(label);
        });
      });
    }

    return polyline;
  },

  /**
   * Import a marker (including library items)
   * @private
   */
  _importMarker(feature, styleOptions) {
    const props = feature.properties;
    const latlng = L.GeoJSON.coordsToLatLng(feature.geometry.coordinates);

    let icon = null;

    // Recreate icon based on type
    if (props._iconType === 'image' && props._iconUrl) {
      // Check if this is the default Leaflet marker icon
      const isDefaultIcon =
        props._iconUrl === 'marker-icon.png' ||
        props._iconUrl.includes('marker-icon') ||
        (props._shadowUrl &&
          (props._shadowUrl === 'marker-shadow.png' ||
            props._shadowUrl.includes('marker-shadow')));

      if (isDefaultIcon) {
        // Use Leaflet's default icon which has the correct paths
        icon = new L.Icon.Default();
      } else {
        // Custom image icon
        const iconOptions = {
          iconUrl: props._iconUrl,
          iconSize: props._iconSize || [25, 41],
          iconAnchor: props._iconAnchor || [12, 41],
          popupAnchor: props._popupAnchor || [1, -34],
        };

        // Add shadow properties if available
        if (props._shadowUrl) {
          iconOptions.shadowUrl = props._shadowUrl;
          iconOptions.shadowSize = props._shadowSize;
          iconOptions.shadowAnchor = props._shadowAnchor;
        }

        icon = L.icon(iconOptions);
      }
    } else if (props._iconType === 'divIcon') {
      // HTML/SVG-based icon (L.DivIcon)
      icon = L.divIcon({
        html: props._iconHtml || '',
        className: props._iconClassName || '',
        iconSize: props._iconSize || [32, 32],
        iconAnchor: props._iconAnchor || [16, 16],
      });
    }

    // Create marker with icon (or default if no icon data)
    const marker = L.marker(latlng, {
      icon: icon || new L.Icon.Default(),
      ...styleOptions,
    });

    return marker;
  },

  enableKeyboardShortcuts() {
    this.Keyboard.enableKeyboardShortcuts();
  },
  disableKeyboardShortcuts() {
    this.Keyboard.disableKeyboardShortcuts();
  },
  keyboardShortcutsEnabled() {
    return this.Keyboard.areKeyboardShortcutsEnabled();
  },
  // returns the map instance by default or a layergroup is set through global options
  _getContainingLayer() {
    return this.globalOptions.layerGroup &&
      this.globalOptions.layerGroup instanceof L.LayerGroup
      ? this.globalOptions.layerGroup
      : this.map;
  },
  _isCRSSimple() {
    return this.map.options.crs === L.CRS.Simple;
  },
  // in Canvas mode we need to convert touch- and pointerevents (IE) to mouseevents, because Leaflet don't support them.
  _touchEventCounter: 0,
  _addTouchEvents(elm) {
    if (this._touchEventCounter === 0) {
      L.DomEvent.on(elm, 'touchmove', this._canvasTouchMove, this);
      L.DomEvent.on(
        elm,
        'touchstart touchend touchcancel',
        this._canvasTouchClick,
        this
      );
    }
    this._touchEventCounter += 1;
  },
  _removeTouchEvents(elm) {
    if (this._touchEventCounter === 1) {
      L.DomEvent.off(elm, 'touchmove', this._canvasTouchMove, this);
      L.DomEvent.off(
        elm,
        'touchstart touchend touchcancel',
        this._canvasTouchClick,
        this
      );
    }
    this._touchEventCounter =
      this._touchEventCounter <= 1 ? 0 : this._touchEventCounter - 1;
  },
  _canvasTouchMove(e) {
    getRenderer(this.map)._onMouseMove(this._createMouseEvent('mousemove', e));
  },
  _canvasTouchClick(e) {
    let type = '';
    if (e.type === 'touchstart' || e.type === 'pointerdown') {
      type = 'mousedown';
    } else if (e.type === 'touchend' || e.type === 'pointerup') {
      type = 'mouseup';
    } else if (e.type === 'touchcancel' || e.type === 'pointercancel') {
      type = 'mouseup';
    }
    if (!type) {
      return;
    }
    getRenderer(this.map)._onClick(this._createMouseEvent(type, e));
  },
  _createMouseEvent(type, e) {
    let mouseEvent;
    const touchEvt = e.touches[0] || e.changedTouches[0];
    try {
      mouseEvent = new MouseEvent(type, {
        bubbles: e.bubbles,
        cancelable: e.cancelable,
        view: e.view,
        detail: touchEvt.detail,
        screenX: touchEvt.screenX,
        screenY: touchEvt.screenY,
        clientX: touchEvt.clientX,
        clientY: touchEvt.clientY,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        button: e.button,
        relatedTarget: e.relatedTarget,
      });
    } catch (ex) {
      mouseEvent = document.createEvent('MouseEvents');
      mouseEvent.initMouseEvent(
        type,
        e.bubbles,
        e.cancelable,
        e.view,
        touchEvt.detail,
        touchEvt.screenX,
        touchEvt.screenY,
        touchEvt.clientX,
        touchEvt.clientY,
        e.ctrlKey,
        e.altKey,
        e.shiftKey,
        e.metaKey,
        e.button,
        e.relatedTarget
      );
    }
    return mouseEvent;
  },

  /**
   * Initialize library from global options
   * @private
   */
  _initLibraryFromGlobalOptions() {
    const libraryOptions = this.globalOptions.library;
    if (libraryOptions && libraryOptions.enabled && libraryOptions.autoLoad) {
      // Auto-load library data if available
      if (libraryOptions.url) {
        this.Library.loadCategoriesJsonFromUrl(
          libraryOptions.url,
          libraryOptions.urlOptions
        );
      } else if (libraryOptions.json) {
        this.Library.loadCategoriesJson(libraryOptions.json);
      }
    }
  },

  /**
   * Handle library options changes
   * @param {Object} newOptions - New options that were set
   * @private
   */
  _handleLibraryOptionsChange(newOptions) {
    if (!newOptions || !newOptions.library) {
      return;
    }

    const libraryOptions = this.globalOptions.library;
    const newLibraryOptions = newOptions.library;

    // If library was enabled and has data, load it
    if (newLibraryOptions.enabled && libraryOptions.autoLoad) {
      if (newLibraryOptions.url) {
        this.Library.loadCategoriesJsonFromUrl(
          newLibraryOptions.url,
          libraryOptions.urlOptions
        );
      } else if (newLibraryOptions.json) {
        this.Library.loadCategoriesJson(newLibraryOptions.json);
      }
    }

    // Update library with new options
    this.Library.updateFromGlobalOptions(libraryOptions);
  },
});

export default Map;
