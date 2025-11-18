import { getTranslation } from './index';
import BaseModal from './BaseModal';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default class TextModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: getTranslation('labels.text'),
      width: 'fit-content',
      maxWidth: '600px',
      className: 'pm-text-modal',
      showCloseButton: false, // We'll use custom buttons
      onOpen: () => {
        // Focus the Quill editor after modal opens
        setTimeout(() => {
          if (this.quill) {
            this.quill.focus();
          }
        }, 100);
      },
    });

    this.textOptions = {
      text: options.text || '',
      backgroundColor: options.backgroundColor || '#ffffff',
      fontSize: options.fontSize || 14,
      onSave: options.onSave || (() => {}),
      onCancel: options.onCancel || (() => {}),
    };

    this._createTextModalContent();
    this._initQuillEditor();
    this._attachTextEventListeners();
  }

  _createTextModalContent() {
    // Quill editor container
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'pm-text-modal-editor-container';

    const textContainer = document.createElement('div');
    textContainer.className = 'pm-text-modal-text-container';
    textContainer.appendChild(this.editorContainer);

    // Background color field
    const bgColorContainer = document.createElement('div');
    bgColorContainer.className = 'pm-modal-field';

    const bgColorLabel = document.createElement('label');
    bgColorLabel.textContent = getTranslation('labels.backgroundColor');

    this.bgColorInput = document.createElement('input');
    this.bgColorInput.type = 'color';
    this.bgColorInput.value = this.textOptions.backgroundColor;

    bgColorContainer.appendChild(bgColorLabel);
    bgColorContainer.appendChild(this.bgColorInput);

    // Font size field
    const fontSizeContainer = document.createElement('div');
    fontSizeContainer.className = 'pm-modal-field';

    const fontSizeLabel = document.createElement('label');
    fontSizeLabel.textContent = getTranslation('labels.fontSize');

    this.fontSizeInput = document.createElement('input');
    this.fontSizeInput.type = 'number';
    this.fontSizeInput.value = this.textOptions.fontSize;
    this.fontSizeInput.min = 8;
    this.fontSizeInput.max = 72;

    fontSizeContainer.appendChild(fontSizeLabel);
    fontSizeContainer.appendChild(this.fontSizeInput);

    // Add content to modal body
    this.body.appendChild(textContainer);
    this.body.appendChild(bgColorContainer);
    this.body.appendChild(fontSizeContainer);

    // Add buttons to footer
    this.addButton({
      text: getTranslation('modals.cancel'),
      className: 'pm-modal-button-cancel',
      onClick: () => {
        this.textOptions.onCancel();
        this.close();
      },
    });

    this.addButton({
      text: getTranslation('modals.ok'),
      className: 'pm-modal-button-primary',
      onClick: () => {
        const result = {
          text: this.quill.root.innerHTML,
          backgroundColor: this.bgColorInput.value,
          fontSize: parseInt(this.fontSizeInput.value, 10),
        };
        this.textOptions.onSave(result);
        this.close();
      },
    });
  }

  _initQuillEditor() {
    // Quill toolbar configuration
    const toolbarOptions = [
      ['bold', 'italic', 'underline', 'strike'],
      [{ direction: 'rtl' }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
    ];

    this.quill = new Quill(this.editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions,
      },
      placeholder: getTranslation('placeholders.enterTextHere'),
    });

    // Set initial content
    if (this.textOptions.text) {
      // Try to parse as HTML first, fallback to plain text
      try {
        this.quill.root.innerHTML = this.textOptions.text;
      } catch (e) {
        this.quill.setText(this.textOptions.text);
      }
    }

    // Set font size
    if (this.textOptions.fontSize) {
      this.quill.root.style.fontSize = `${this.textOptions.fontSize}px`;
    }
  }

  _attachTextEventListeners() {
    // Update font size when changed
    this.fontSizeInput.addEventListener('input', () => {
      const fontSize = parseInt(this.fontSizeInput.value, 10);
      if (fontSize >= 8 && fontSize <= 72) {
        this.quill.root.style.fontSize = `${fontSize}px`;
      }
    });
  }
}
