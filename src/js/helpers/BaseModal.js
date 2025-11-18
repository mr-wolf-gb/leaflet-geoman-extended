import { getTranslation } from './index';

/**
 * BaseModal - Unified modal system for Leaflet-Geoman
 * Provides common modal functionality to eliminate code duplication
 */
export default class BaseModal {
  constructor(options = {}) {
    this.options = {
      title: options.title || '',
      width: options.width || 'fit-content',
      maxWidth: options.maxWidth || '600px',
      closeOnOverlay: options.closeOnOverlay !== false,
      closeOnEscape: options.closeOnEscape !== false,
      showCloseButton: options.showCloseButton !== false,
      className: options.className || '',
      onOpen: options.onOpen || (() => {}),
      onClose: options.onClose || (() => {}),
    };

    this._isOpen = false;
    this._escapeHandler = null;
    this._createModal();
  }

  /**
   * Create modal DOM structure
   * @private
   */
  _createModal() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'pm-modal-overlay';

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = `pm-modal ${this.options.className}`;
    this.modal.style.width = this.options.width;
    this.modal.style.maxWidth = this.options.maxWidth;

    // Create modal content wrapper
    const content = document.createElement('div');
    content.className = 'pm-modal-content';

    // Create header
    this.header = document.createElement('div');
    this.header.className = 'pm-modal-header';

    this.titleElement = document.createElement('h3');
    this.titleElement.className = 'pm-modal-title';
    this.titleElement.textContent = this.options.title;

    this.header.appendChild(this.titleElement);

    // Create close button if enabled
    if (this.options.showCloseButton) {
      this.closeButton = document.createElement('button');
      this.closeButton.className = 'pm-modal-close';
      this.closeButton.innerHTML = '&times;';
      this.closeButton.setAttribute('aria-label', 'Close');
      this.header.appendChild(this.closeButton);
    }

    // Create body
    this.body = document.createElement('div');
    this.body.className = 'pm-modal-body';

    // Create footer
    this.footer = document.createElement('div');
    this.footer.className = 'pm-modal-footer';

    // Assemble modal
    content.appendChild(this.header);
    content.appendChild(this.body);
    content.appendChild(this.footer);
    this.modal.appendChild(content);
    this.overlay.appendChild(this.modal);

    // Attach event listeners
    this._attachEventListeners();
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    // Close button click
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.close());
    }

    // Close on overlay click
    if (this.options.closeOnOverlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Prevent modal clicks from closing
    this.modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Set modal title
   * @param {string} title - New title
   */
  setTitle(title) {
    this.titleElement.textContent = title;
  }

  /**
   * Set modal body content
   * @param {string|HTMLElement} content - Content to set
   */
  setContent(content) {
    if (typeof content === 'string') {
      this.body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.body.innerHTML = '';
      this.body.appendChild(content);
    }
  }

  /**
   * Add button to footer
   * @param {Object} options - Button options
   * @param {string} options.text - Button text
   * @param {string} options.className - Additional CSS class
   * @param {Function} options.onClick - Click handler
   * @returns {HTMLButtonElement} - Created button
   */
  addButton(options = {}) {
    const button = document.createElement('button');
    button.className = `pm-modal-button ${options.className || ''}`;
    button.textContent = options.text || '';

    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }

    this.footer.appendChild(button);
    return button;
  }

  /**
   * Clear all footer buttons
   */
  clearButtons() {
    this.footer.innerHTML = '';
  }

  /**
   * Open the modal
   */
  open() {
    if (this._isOpen) {
      return;
    }

    document.body.appendChild(this.overlay);
    this._isOpen = true;

    // Setup escape key handler
    if (this.options.closeOnEscape) {
      this._escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', this._escapeHandler);
    }

    // Call onOpen callback
    this.options.onOpen();
  }

  /**
   * Close the modal
   */
  close() {
    if (!this._isOpen) {
      return;
    }

    // Remove escape key handler
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }

    // Remove from DOM
    if (this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }

    this._isOpen = false;

    // Call onClose callback
    this.options.onClose();
  }

  /**
   * Check if modal is open
   * @returns {boolean}
   */
  isOpen() {
    return this._isOpen;
  }

  /**
   * Destroy the modal and clean up resources
   */
  destroy() {
    this.close();
    this.overlay = null;
    this.modal = null;
    this.header = null;
    this.body = null;
    this.footer = null;
    this.titleElement = null;
    this.closeButton = null;
  }
}
