// Pattern Renderer for Leaflet layers
// Applies SVG patterns to layer fills

export default class PatternRenderer {
  constructor() {
    this.patterns = new Map();
  }

  _getOrCreateDefs(layer) {
    // Get the SVG element that contains this layer's path
    const svg = layer._path.ownerSVGElement;
    if (!svg) return null;

    // Look for existing defs element
    let defs = svg.querySelector('defs');
    if (!defs) {
      // Create defs element at the beginning of SVG
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    return defs;
  }

  _createPattern(defs, patternName, color) {
    const patternId = `pm-pattern-${patternName}-${color.replace('#', '')}`;

    // Check if pattern already exists
    if (defs.querySelector(`#${patternId}`)) {
      return patternId;
    }

    const pattern = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'pattern'
    );
    pattern.id = patternId;
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    switch (patternName) {
      case 'vertical':
        pattern.setAttribute('width', '8');
        pattern.setAttribute('height', '8');
        const vLine = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        vLine.setAttribute('x1', '4');
        vLine.setAttribute('y1', '0');
        vLine.setAttribute('x2', '4');
        vLine.setAttribute('y2', '8');
        vLine.setAttribute('stroke', color);
        vLine.setAttribute('stroke-width', '2');
        pattern.appendChild(vLine);
        break;

      case 'horizontal':
        pattern.setAttribute('width', '8');
        pattern.setAttribute('height', '8');
        const hLine = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        hLine.setAttribute('x1', '0');
        hLine.setAttribute('y1', '4');
        hLine.setAttribute('x2', '8');
        hLine.setAttribute('y2', '4');
        hLine.setAttribute('stroke', color);
        hLine.setAttribute('stroke-width', '2');
        pattern.appendChild(hLine);
        break;

      case 'diagonal-right':
        pattern.setAttribute('width', '8');
        pattern.setAttribute('height', '8');
        const drLine = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        drLine.setAttribute('x1', '0');
        drLine.setAttribute('y1', '8');
        drLine.setAttribute('x2', '8');
        drLine.setAttribute('y2', '0');
        drLine.setAttribute('stroke', color);
        drLine.setAttribute('stroke-width', '2');
        pattern.appendChild(drLine);
        break;

      case 'diagonal-left':
        pattern.setAttribute('width', '8');
        pattern.setAttribute('height', '8');
        const dlLine = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        dlLine.setAttribute('x1', '0');
        dlLine.setAttribute('y1', '0');
        dlLine.setAttribute('x2', '8');
        dlLine.setAttribute('y2', '8');
        dlLine.setAttribute('stroke', color);
        dlLine.setAttribute('stroke-width', '2');
        pattern.appendChild(dlLine);
        break;

      case 'dots':
        pattern.setAttribute('width', '10');
        pattern.setAttribute('height', '10');
        const dot = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        );
        dot.setAttribute('cx', '5');
        dot.setAttribute('cy', '5');
        dot.setAttribute('r', '2');
        dot.setAttribute('fill', color);
        pattern.appendChild(dot);
        break;

      case 'dots-dense':
        pattern.setAttribute('width', '6');
        pattern.setAttribute('height', '6');
        const denseDot = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        );
        denseDot.setAttribute('cx', '3');
        denseDot.setAttribute('cy', '3');
        denseDot.setAttribute('r', '1.5');
        denseDot.setAttribute('fill', color);
        pattern.appendChild(denseDot);
        break;

      case 'cross':
        pattern.setAttribute('width', '10');
        pattern.setAttribute('height', '10');
        const crossV = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        crossV.setAttribute('x1', '5');
        crossV.setAttribute('y1', '0');
        crossV.setAttribute('x2', '5');
        crossV.setAttribute('y2', '10');
        crossV.setAttribute('stroke', color);
        crossV.setAttribute('stroke-width', '1');
        pattern.appendChild(crossV);
        const crossH = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );
        crossH.setAttribute('x1', '0');
        crossH.setAttribute('y1', '5');
        crossH.setAttribute('x2', '10');
        crossH.setAttribute('y2', '5');
        crossH.setAttribute('stroke', color);
        crossH.setAttribute('stroke-width', '1');
        pattern.appendChild(crossH);
        break;

      default:
        return null;
    }

    defs.appendChild(pattern);
    return patternId;
  }

  applyPattern(layer, style) {
    if (!layer || !layer._path) return;

    // Check if this is a line shape (no fill area)
    const shape = layer.pm?._shape;

    // For Freehand, check if it's actually a Polygon or Polyline
    let isLineShape;
    if (shape === 'Freehand') {
      // Freehand can be either polygon or line, check the actual layer type
      isLineShape = !(layer instanceof L.Polygon);
    } else {
      // Line and Arrow shapes don't have fill
      isLineShape = shape === 'Line' || shape === 'Arrow';
    }

    const isPolylineNotPolygon =
      layer instanceof L.Polyline && !(layer instanceof L.Polygon);
    const shouldSkipFill = isLineShape || isPolylineNotPolygon;

    const fillPattern = style.fillPattern || 'solid';
    const fillColor = style.fillColor || '#3388ff';

    // Apply base style
    const baseStyle = {
      color: style.color,
      weight: style.weight,
      opacity: style.opacity,
      dashArray: style.dashArray,
      lineCap: style.lineCap,
      lineJoin: style.lineJoin,
    };

    // Only add fill properties for non-line shapes
    if (!shouldSkipFill) {
      baseStyle.fillColor = fillColor;
      baseStyle.fillOpacity = style.fillOpacity;
    } else {
      // For line shapes, ensure fill is disabled
      baseStyle.fill = false;
      baseStyle.fillOpacity = 0;
    }

    // Apply the base style through Leaflet
    layer.setStyle(baseStyle);

    // Handle pattern-specific modifications only for non-line shapes
    if (!shouldSkipFill) {
      if (fillPattern === 'solid') {
        // Remove pattern attribute to show solid fill
        layer._path.removeAttribute('fill');
        layer._path.removeAttribute('fill-opacity');

        // Force the fill color via inline style to ensure it's applied
        layer._path.style.fill = fillColor;
        layer._path.style.fillOpacity = style.fillOpacity;
      } else if (fillPattern === 'none') {
        // Set transparent fill
        layer.setStyle({
          fillColor: 'transparent',
          fillOpacity: 0,
        });
        layer._path.removeAttribute('fill');
        layer._path.removeAttribute('fill-opacity');

        // Force transparent
        layer._path.style.fill = 'transparent';
        layer._path.style.fillOpacity = '0';
      } else {
        // Apply pattern
        const defs = this._getOrCreateDefs(layer);
        if (defs) {
          const patternId = this._createPattern(defs, fillPattern, fillColor);
          if (patternId) {
            // Clear inline styles so pattern can show
            layer._path.style.fill = '';
            layer._path.style.fillOpacity = '';

            // Set the fill attribute to use the pattern
            layer._path.setAttribute('fill', `url(#${patternId})`);
            layer._path.setAttribute('fill-opacity', style.fillOpacity);
          }
        }
      }

      // Store pattern info on layer
      layer.options.fillPattern = fillPattern;
      layer.options.fillColor = fillColor;
    } else {
      // For line shapes, ensure no fill is applied
      if (layer._path) {
        layer._path.style.fill = 'none';
        layer._path.style.fillOpacity = '0';
        layer._path.removeAttribute('fill');
        layer._path.removeAttribute('fill-opacity');
      }
    }
  }
}

// Create singleton instance
const patternRenderer = new PatternRenderer();
export { patternRenderer };
