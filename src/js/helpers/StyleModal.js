import iro from '@jaames/iro';
import { getTranslation } from './index';
import BaseModal from './BaseModal';

export default class StyleModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: getTranslation('modals.editStyle'),
      width: 'fit-content',
      maxWidth: '500px',
      className: 'pm-style-modal',
      showCloseButton: false, // We'll use custom buttons
      onOpen: () => {
        // Initialize color pickers after modal is in DOM
        setTimeout(() => {
          this._initColorPickers();
        }, 0);
      },
    });

    this.styleOptions = {
      layer: options.layer || null,
      onSave: options.onSave || (() => {}),
      onCancel: options.onCancel || (() => {}),
    };

    this.layer = this.styleOptions.layer;
    this.currentStyle = this._extractCurrentStyle();
    this._isLineShape = this._checkIfLineShape();
    this._createStyleModalContent();
  }

  _checkIfLineShape() {
    if (!this.layer) return false;

    // Check if it's a line-based shape (no fill area)
    const shape = this.layer.pm?._shape;

    // For Freehand, check if it's actually a Polygon or Polyline
    if (shape === 'Freehand') {
      // Freehand can be either polygon or line, check the actual layer type
      return !(this.layer instanceof L.Polygon);
    }

    // Line and Arrow shapes don't have fill
    const isLineShape = shape === 'Line' || shape === 'Arrow';

    // Also check if it's a Polyline but not a Polygon
    const isPolylineNotPolygon =
      this.layer instanceof L.Polyline && !(this.layer instanceof L.Polygon);

    return isLineShape || isPolylineNotPolygon;
  }

  _extractCurrentStyle() {
    if (!this.layer) return {};

    const style = {};
    const layerOptions = this.layer.options || {};

    // Extract common style properties
    style.color = layerOptions.color || '#3388ff';
    style.fillColor = layerOptions.fillColor || layerOptions.color || '#3388ff';
    style.weight = layerOptions.weight !== undefined ? layerOptions.weight : 3;
    style.opacity =
      layerOptions.opacity !== undefined ? layerOptions.opacity : 1;
    style.fillOpacity =
      layerOptions.fillOpacity !== undefined ? layerOptions.fillOpacity : 0.2;
    style.dashArray = layerOptions.dashArray || '';
    style.lineCap = layerOptions.lineCap || 'round';
    style.lineJoin = layerOptions.lineJoin || 'round';
    style.fillPattern = layerOptions.fillPattern || 'solid';

    return style;
  }

  _createStyleModalContent() {
    // Create tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'pm-style-modal-tabs';

    const strokeTab = document.createElement('button');
    strokeTab.className = 'pm-style-modal-tab active';
    strokeTab.textContent = getTranslation('labels.stroke');
    strokeTab.dataset.tab = 'stroke';

    const fillTab = document.createElement('button');
    fillTab.className = 'pm-style-modal-tab';
    fillTab.textContent = getTranslation('labels.fill');
    fillTab.dataset.tab = 'fill';

    tabsContainer.appendChild(strokeTab);

    // Only add fill tab if this is not a line shape
    if (!this._isLineShape) {
      tabsContainer.appendChild(fillTab);
    }

    // Create tab contents
    const tabContents = document.createElement('div');
    tabContents.className = 'pm-style-modal-tab-contents';

    // Stroke tab content
    const strokeContent = this._createStrokeTab();
    strokeContent.className = 'pm-style-modal-tab-content active';
    strokeContent.dataset.tab = 'stroke';

    // Fill tab content (only for non-line shapes)
    if (!this._isLineShape) {
      const fillContent = this._createFillTab();
      fillContent.className = 'pm-style-modal-tab-content';
      fillContent.dataset.tab = 'fill';
      tabContents.appendChild(fillContent);
    }

    tabContents.appendChild(strokeContent);

    // Add tabs and content to body
    this.body.appendChild(tabsContainer);
    this.body.appendChild(tabContents);

    // Add buttons to footer
    this.addButton({
      text: getTranslation('modals.cancel'),
      className: 'pm-modal-button-cancel',
      onClick: () => {
        this.styleOptions.onCancel();
        this.close();
      },
    });

    this.addButton({
      text: getTranslation('modals.apply'),
      className: 'pm-modal-button-primary',
      onClick: () => {
        const style = this._collectStyle();
        this.styleOptions.onSave(style);
        this.close();
      },
    });

    // Event listeners
    this._attachStyleEventListeners();
    this._attachTabListeners();
  }

  _createStrokeTab() {
    const container = document.createElement('div');

    // Stroke Color
    const colorSection = document.createElement('div');
    colorSection.className = 'pm-style-modal-section';

    const colorLabel = document.createElement('label');
    colorLabel.className = 'pm-style-modal-label';
    colorLabel.textContent = getTranslation('labels.strokeColor');

    this.strokeColorPicker = document.createElement('div');
    this.strokeColorPicker.className = 'pm-style-modal-color-picker';

    colorSection.appendChild(colorLabel);
    colorSection.appendChild(this.strokeColorPicker);

    // Line Weight
    const weightSection = document.createElement('div');
    weightSection.className = 'pm-style-modal-field';

    const weightLabel = document.createElement('label');
    weightLabel.textContent = getTranslation('labels.lineWeight');

    this.weightInput = document.createElement('input');
    this.weightInput.type = 'range';
    this.weightInput.className = 'pm-style-modal-range';
    this.weightInput.min = 1;
    this.weightInput.max = 20;
    this.weightInput.value = this.currentStyle.weight;

    this.weightValue = document.createElement('span');
    this.weightValue.className = 'pm-style-modal-value';
    this.weightValue.textContent = this.currentStyle.weight + 'px';

    weightSection.appendChild(weightLabel);
    weightSection.appendChild(this.weightInput);
    weightSection.appendChild(this.weightValue);

    // Opacity
    const opacitySection = document.createElement('div');
    opacitySection.className = 'pm-style-modal-field';

    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = getTranslation('labels.opacity');

    this.opacityInput = document.createElement('input');
    this.opacityInput.type = 'range';
    this.opacityInput.className = 'pm-style-modal-range';
    this.opacityInput.min = 0;
    this.opacityInput.max = 1;
    this.opacityInput.step = 0.1;
    this.opacityInput.value = this.currentStyle.opacity;

    this.opacityValue = document.createElement('span');
    this.opacityValue.className = 'pm-style-modal-value';
    this.opacityValue.textContent = this.currentStyle.opacity * 100 + '%';

    opacitySection.appendChild(opacityLabel);
    opacitySection.appendChild(this.opacityInput);
    opacitySection.appendChild(this.opacityValue);

    // Dash Array (Line Style)
    const dashSection = document.createElement('div');
    dashSection.className = 'pm-style-modal-field';

    const dashLabel = document.createElement('label');
    dashLabel.textContent = getTranslation('labels.lineStyle');

    this.dashSelect = document.createElement('select');
    this.dashSelect.className = 'pm-style-modal-select';

    const dashOptions = [
      { value: '', label: getTranslation('lineStyles.solid') },
      { value: '5, 5', label: getTranslation('lineStyles.dashed') },
      { value: '1, 5', label: getTranslation('lineStyles.dotted') },
      { value: '10, 5, 2, 5', label: getTranslation('lineStyles.dashDot') },
    ];

    dashOptions.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (this.currentStyle.dashArray === opt.value) {
        option.selected = true;
      }
      this.dashSelect.appendChild(option);
    });

    dashSection.appendChild(dashLabel);
    dashSection.appendChild(this.dashSelect);

    // Line Cap
    const capSection = document.createElement('div');
    capSection.className = 'pm-style-modal-field';

    const capLabel = document.createElement('label');
    capLabel.textContent = getTranslation('labels.lineCap');

    this.capSelect = document.createElement('select');
    this.capSelect.className = 'pm-style-modal-select';

    ['butt', 'round', 'square'].forEach((cap) => {
      const option = document.createElement('option');
      option.value = cap;
      option.textContent = getTranslation(`lineCaps.${cap}`);
      if (this.currentStyle.lineCap === cap) {
        option.selected = true;
      }
      this.capSelect.appendChild(option);
    });

    capSection.appendChild(capLabel);
    capSection.appendChild(this.capSelect);

    // Line Join
    const joinSection = document.createElement('div');
    joinSection.className = 'pm-style-modal-field';

    const joinLabel = document.createElement('label');
    joinLabel.textContent = getTranslation('labels.lineJoin');

    this.joinSelect = document.createElement('select');
    this.joinSelect.className = 'pm-style-modal-select';

    ['miter', 'round', 'bevel'].forEach((join) => {
      const option = document.createElement('option');
      option.value = join;
      option.textContent = getTranslation(`lineJoins.${join}`);
      if (this.currentStyle.lineJoin === join) {
        option.selected = true;
      }
      this.joinSelect.appendChild(option);
    });

    joinSection.appendChild(joinLabel);
    joinSection.appendChild(this.joinSelect);

    container.appendChild(colorSection);
    container.appendChild(weightSection);
    container.appendChild(opacitySection);
    container.appendChild(dashSection);
    container.appendChild(capSection);
    container.appendChild(joinSection);

    return container;
  }

  _createFillTab() {
    const container = document.createElement('div');

    // Fill Color
    const colorSection = document.createElement('div');
    colorSection.className = 'pm-style-modal-section';

    const colorLabel = document.createElement('label');
    colorLabel.className = 'pm-style-modal-label';
    colorLabel.textContent = getTranslation('labels.fillColor');

    this.fillColorPicker = document.createElement('div');
    this.fillColorPicker.className = 'pm-style-modal-color-picker';

    colorSection.appendChild(colorLabel);
    colorSection.appendChild(this.fillColorPicker);

    // Fill Opacity
    const opacitySection = document.createElement('div');
    opacitySection.className = 'pm-style-modal-field';

    const opacityLabel = document.createElement('label');
    opacityLabel.textContent = getTranslation('labels.fillOpacity');

    this.fillOpacityInput = document.createElement('input');
    this.fillOpacityInput.type = 'range';
    this.fillOpacityInput.className = 'pm-style-modal-range';
    this.fillOpacityInput.min = 0;
    this.fillOpacityInput.max = 1;
    this.fillOpacityInput.step = 0.1;
    this.fillOpacityInput.value = this.currentStyle.fillOpacity;

    this.fillOpacityValue = document.createElement('span');
    this.fillOpacityValue.className = 'pm-style-modal-value';
    this.fillOpacityValue.textContent =
      this.currentStyle.fillOpacity * 100 + '%';

    opacitySection.appendChild(opacityLabel);
    opacitySection.appendChild(this.fillOpacityInput);
    opacitySection.appendChild(this.fillOpacityValue);

    // Fill Pattern
    const patternSection = document.createElement('div');
    patternSection.className = 'pm-style-modal-section';

    const patternLabel = document.createElement('label');
    patternLabel.className = 'pm-style-modal-label';
    patternLabel.textContent = getTranslation('labels.fillPattern');

    const patternGrid = document.createElement('div');
    patternGrid.className = 'pm-style-modal-pattern-grid';

    const patterns = [
      { name: 'solid', label: getTranslation('patterns.solid') },
      { name: 'none', label: getTranslation('patterns.none') },
      { name: 'vertical', label: getTranslation('patterns.vertical') },
      { name: 'horizontal', label: getTranslation('patterns.horizontal') },
      {
        name: 'diagonal-right',
        label: getTranslation('patterns.diagonalRight'),
      },
      { name: 'diagonal-left', label: getTranslation('patterns.diagonalLeft') },
      { name: 'dots', label: getTranslation('patterns.dots') },
      { name: 'dots-dense', label: getTranslation('patterns.dotsDense') },
      { name: 'cross', label: getTranslation('patterns.cross') },
    ];

    this.patternButtons = [];

    patterns.forEach((pattern) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pm-style-modal-pattern-btn';
      button.dataset.pattern = pattern.name;
      button.title = pattern.label;

      if (this.currentStyle.fillPattern === pattern.name) {
        button.classList.add('active');
      }

      // Create SVG pattern preview
      const svg = this._createPatternSVG(pattern.name);
      button.appendChild(svg);

      button.addEventListener('click', () => {
        this.patternButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
      });

      this.patternButtons.push(button);
      patternGrid.appendChild(button);
    });

    patternSection.appendChild(patternLabel);
    patternSection.appendChild(patternGrid);

    container.appendChild(colorSection);
    container.appendChild(opacitySection);
    container.appendChild(patternSection);

    return container;
  }

  _createPatternSVG(patternName) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 40 40');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const pattern = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'pattern'
    );
    pattern.setAttribute('id', 'pattern-' + patternName + '-' + Date.now());
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '40');
    rect.setAttribute('height', '40');
    rect.setAttribute('fill', '#f0f0f0');
    svg.appendChild(rect);

    switch (patternName) {
      case 'solid':
        rect.setAttribute('fill', '#333');
        break;

      case 'none':
        rect.setAttribute('fill', 'white');
        rect.setAttribute('stroke', '#333');
        rect.setAttribute('stroke-width', '2');
        break;

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
        vLine.setAttribute('stroke', '#333');
        vLine.setAttribute('stroke-width', '2');
        pattern.appendChild(vLine);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const vRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        vRect.setAttribute('width', '40');
        vRect.setAttribute('height', '40');
        vRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(vRect);
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
        hLine.setAttribute('stroke', '#333');
        hLine.setAttribute('stroke-width', '2');
        pattern.appendChild(hLine);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const hRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        hRect.setAttribute('width', '40');
        hRect.setAttribute('height', '40');
        hRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(hRect);
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
        drLine.setAttribute('stroke', '#333');
        drLine.setAttribute('stroke-width', '2');
        pattern.appendChild(drLine);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const drRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        drRect.setAttribute('width', '40');
        drRect.setAttribute('height', '40');
        drRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(drRect);
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
        dlLine.setAttribute('stroke', '#333');
        dlLine.setAttribute('stroke-width', '2');
        pattern.appendChild(dlLine);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const dlRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        dlRect.setAttribute('width', '40');
        dlRect.setAttribute('height', '40');
        dlRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(dlRect);
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
        dot.setAttribute('fill', '#333');
        pattern.appendChild(dot);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const dotRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        dotRect.setAttribute('width', '40');
        dotRect.setAttribute('height', '40');
        dotRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(dotRect);
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
        denseDot.setAttribute('fill', '#333');
        pattern.appendChild(denseDot);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const denseDotRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        denseDotRect.setAttribute('width', '40');
        denseDotRect.setAttribute('height', '40');
        denseDotRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(denseDotRect);
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
        crossV.setAttribute('stroke', '#333');
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
        crossH.setAttribute('stroke', '#333');
        crossH.setAttribute('stroke-width', '1');
        pattern.appendChild(crossH);
        defs.appendChild(pattern);
        svg.appendChild(defs);
        const crossRect = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'rect'
        );
        crossRect.setAttribute('width', '40');
        crossRect.setAttribute('height', '40');
        crossRect.setAttribute('fill', `url(#${pattern.id})`);
        svg.appendChild(crossRect);
        break;
    }

    return svg;
  }

  _attachStyleEventListeners() {
    // Range input updates
    this.weightInput.addEventListener('input', () => {
      this.weightValue.textContent = this.weightInput.value + 'px';
    });

    this.opacityInput.addEventListener('input', () => {
      this.opacityValue.textContent = this.opacityInput.value * 100 + '%';
    });

    // Only add fill opacity listener for non-line shapes
    if (!this._isLineShape) {
      this.fillOpacityInput.addEventListener('input', () => {
        this.fillOpacityValue.textContent =
          this.fillOpacityInput.value * 100 + '%';
      });
    }
  }

  _attachTabListeners() {
    const tabs = this.modal.querySelectorAll('.pm-style-modal-tab');
    const contents = this.modal.querySelectorAll('.pm-style-modal-tab-content');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Remove active class from all tabs and contents
        tabs.forEach((t) => t.classList.remove('active'));
        contents.forEach((c) => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const content = this.modal.querySelector(
          `.pm-style-modal-tab-content[data-tab="${tabName}"]`
        );
        if (content) {
          content.classList.add('active');
        }
      });
    });
  }

  _initColorPickers() {
    // Initialize stroke color picker
    this.strokeColorPickerInstance = new iro.ColorPicker(
      this.strokeColorPicker,
      {
        width: 110,
        boxHeight: 110,
        color: this.currentStyle.color,
        layoutDirection: 'horizontal',
        borderWidth: 1,
        borderColor: '#000',
        layout: [
          {
            component: iro.ui.Wheel,
            options: {},
          },
          {
            component: iro.ui.Slider,
            options: {
              sliderType: 'value',
              sliderSize: 10,
            },
          },
        ],
      }
    );

    // Initialize fill color picker only for non-line shapes
    if (!this._isLineShape) {
      this.fillColorPickerInstance = new iro.ColorPicker(this.fillColorPicker, {
        width: 110,
        boxHeight: 110,
        color: this.currentStyle.fillColor,
        layoutDirection: 'horizontal',
        borderWidth: 1,
        borderColor: '#000',
        layout: [
          {
            component: iro.ui.Wheel,
            options: {},
          },
          {
            component: iro.ui.Slider,
            options: {
              sliderType: 'value',
              sliderSize: 10,
            },
          },
        ],
      });
    }
  }

  _collectStyle() {
    const style = {
      color: this.strokeColorPickerInstance.color.hexString,
      weight: parseFloat(this.weightInput.value),
      opacity: parseFloat(this.opacityInput.value),
      dashArray: this.dashSelect.value,
      lineCap: this.capSelect.value,
      lineJoin: this.joinSelect.value,
    };

    // Only include fill properties for non-line shapes
    if (!this._isLineShape) {
      const activePattern = this.patternButtons.find((btn) =>
        btn.classList.contains('active')
      );
      const fillPattern = activePattern
        ? activePattern.dataset.pattern
        : 'solid';

      style.fillColor = this.fillColorPickerInstance.color.hexString;
      style.fillOpacity = parseFloat(this.fillOpacityInput.value);
      style.fillPattern = fillPattern;
    } else {
      // For line shapes, explicitly set fill to false/transparent
      style.fill = false;
      style.fillOpacity = 0;
    }

    return style;
  }
}
