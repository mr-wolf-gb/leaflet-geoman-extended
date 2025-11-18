import BaseModal from './BaseModal';

/**
 * InfoModal - Simple information display modal
 * Used for displaying read-only information to users
 */
export default class InfoModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: options.title || 'Information',
      width: options.width || 'fit-content',
      maxWidth: options.maxWidth || '600px',
      closeOnOverlay: options.closeOnOverlay !== false,
      closeOnEscape: options.closeOnEscape !== false,
      className: 'pm-info-modal',
      ...options,
    });

    // Add default styling to body for info content
    this.body.classList.add('pm-info-modal-body');
  }

  /**
   * Show information with title and content
   * @param {string} title - Modal title
   * @param {string|HTMLElement} content - Content to display
   */
  show(title, content) {
    this.setTitle(title);
    this.setContent(content);
    this.open();
  }
}
