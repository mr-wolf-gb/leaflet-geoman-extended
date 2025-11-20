const Panel = L.Class.extend({
  initialize(library) {
    // Store reference to parent Library instance
    this._library = library;
    this._map = library._map;

    // Panel DOM element
    this._panelElement = null;

    // State management
    this._expandedCategories = new Set();
    this._searchTerm = '';

    // Create the panel DOM structure
    this._createPanel();
  },

  /**
   * Create the floating panel DOM structure
   * @private
   */
  _createPanel() {
    // Create main panel container
    this._panelElement = L.DomUtil.create('div', 'leaflet-pm-library-panel');
    this._panelElement.style.display = 'none'; // Initially hidden

    // Apply panel position from config
    this._applyPanelPosition();

    // Create header with close and refresh buttons
    const header = L.DomUtil.create(
      'div',
      'leaflet-pm-library-header',
      this._panelElement
    );

    // Close button
    const closeButton = L.DomUtil.create(
      'button',
      'leaflet-pm-library-close',
      header
    );
    closeButton.innerHTML = '×';
    closeButton.title = this._library._t('library.tooltips.closePanel');

    // Title
    const libraryTitle = L.DomUtil.create(
      'span',
      'leaflet-pm-library-title',
      header
    );
    libraryTitle.innerHTML = this._library._t('library.title');

    // Refresh button
    const refreshButton = L.DomUtil.create(
      'button',
      'leaflet-pm-library-refresh',
      header
    );
    refreshButton.innerHTML = '⟳';
    refreshButton.title = this._library._t('library.tooltips.refreshData');

    // Create search input container
    const searchContainer = L.DomUtil.create(
      'div',
      'leaflet-pm-library-search',
      this._panelElement
    );
    const searchInput = L.DomUtil.create(
      'input',
      'leaflet-pm-library-search-input',
      searchContainer
    );
    searchInput.type = 'text';
    searchInput.placeholder = this._library._t('library.panel.search');

    // Create accordion container
    this._accordionContainer = L.DomUtil.create(
      'div',
      'leaflet-pm-library-accordion',
      this._panelElement
    );

    // Create footer with Done button
    const footer = L.DomUtil.create(
      'div',
      'leaflet-pm-library-footer',
      this._panelElement
    );
    const doneButton = L.DomUtil.create(
      'button',
      'leaflet-pm-library-done',
      footer
    );
    doneButton.innerHTML = this._library._t('library.done');
    doneButton.title = this._library._t('library.multiplePlace');
    doneButton.style.display = 'none'; // Initially hidden

    // Add panel to map container
    this._map.getContainer().appendChild(this._panelElement);

    // Bind event handlers
    this._bindEventHandlers(closeButton, refreshButton, searchInput);

    // Prevent map events when interacting with panel
    this._preventMapEvents();
  },

  /**
   * Bind event handlers for panel controls
   * @param {HTMLElement} closeButton - Close button element
   * @param {HTMLElement} refreshButton - Refresh button element
   * @param {HTMLElement} searchInput - Search input element
   * @private
   */
  _bindEventHandlers(closeButton, refreshButton, searchInput) {
    const doneButton = this._panelElement.querySelector(
      '.leaflet-pm-library-done'
    );
    // Close button handler
    L.DomEvent.on(closeButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this.hide();
    });

    // Refresh button handler
    L.DomEvent.on(refreshButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this._library.refreshPanel();
    });

    // Search input handler
    L.DomEvent.on(searchInput, 'input', (e) => {
      L.DomEvent.stopPropagation(e);
      this._searchTerm = e.target.value;
      this._filterItems(this._searchTerm);
    });

    // Prevent default form submission
    L.DomEvent.on(searchInput, 'keydown', (e) => {
      if (e.key === 'Enter') {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
      }
    });

    // Done button handler
    L.DomEvent.on(doneButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this._onDoneClick();
    });
  },

  /**
   * Prevent map events when interacting with panel
   * @private
   */
  _preventMapEvents() {
    // Disable map dragging and other interactions when mouse is over panel
    L.DomEvent.disableClickPropagation(this._panelElement);
    L.DomEvent.disableScrollPropagation(this._panelElement);

    // Prevent map events
    L.DomEvent.on(this._panelElement, 'mousedown', L.DomEvent.stopPropagation);
    L.DomEvent.on(this._panelElement, 'mousemove', L.DomEvent.stopPropagation);
    L.DomEvent.on(this._panelElement, 'mouseup', L.DomEvent.stopPropagation);
    L.DomEvent.on(this._panelElement, 'click', L.DomEvent.stopPropagation);
    L.DomEvent.on(this._panelElement, 'dblclick', L.DomEvent.stopPropagation);
  },

  /**
   * Show the panel
   */
  show() {
    if (!this._panelElement) {
      return;
    }

    // Ensure panel position is applied (in case it wasn't available during init)
    this._applyPanelPosition();

    this._panelElement.style.display = 'flex';
    this._library._isPanelVisible = true;

    // Trigger refresh when panel is reopened to maintain state
    if (
      this._library._categoriesJson &&
      this._library._categoriesJson.categories
    ) {
      this.refresh();
    }

    // Emit panel opened event
    this._map.fire('pm:library-panel-opened', {
      categoriesCount: this._library._categoriesJson
        ? this._library._categoriesJson.categories.length
        : 0,
      itemsCount: this._library._getTotalItemsCount(),
    });
  },

  /**
   * Hide the panel
   */
  hide() {
    if (!this._panelElement) {
      return;
    }

    this._panelElement.style.display = 'none';
    this._library._isPanelVisible = false;

    // Emit panel closed event
    this._map.fire('pm:library-panel-closed');
  },

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this._library._isPanelVisible) {
      this.hide();
    } else {
      this.show();
    }
  },

  /**
   * Render accordion with categories and items
   * @param {Array} categories - Array of category objects
   */
  _renderAccordion(categories) {
    if (!this._accordionContainer) {
      return;
    }

    // Clear existing content
    this._accordionContainer.innerHTML = '';

    // Render each category
    categories.forEach((category) => {
      this._renderCategory(category);
    });
  },

  /**
   * Render a single category in the accordion
   * @param {Object} category - Category object with id, title, and items
   * @private
   */
  _renderCategory(category) {
    // Create category container
    const categoryElement = L.DomUtil.create(
      'div',
      'leaflet-pm-library-category',
      this._accordionContainer
    );
    categoryElement.setAttribute('data-category-id', category.id);

    // Create category header
    const categoryHeader = L.DomUtil.create(
      'div',
      'leaflet-pm-library-category-header',
      categoryElement
    );

    // Category title
    const categoryTitle = L.DomUtil.create(
      'span',
      'leaflet-pm-library-category-title',
      categoryHeader
    );
    categoryTitle.textContent = category.title;

    // Category toggle icon
    const categoryToggle = L.DomUtil.create(
      'span',
      'leaflet-pm-library-category-toggle',
      categoryHeader
    );
    categoryToggle.innerHTML = '▼';

    // Create category content container
    const categoryContent = L.DomUtil.create(
      'div',
      'leaflet-pm-library-category-content',
      categoryElement
    );

    // Render items in this category
    if (category.items && category.items.length > 0) {
      category.items.forEach((item) => {
        this._renderItem(item, categoryContent);
      });
    }

    // Set initial expanded state
    if (this._expandedCategories.has(category.id)) {
      L.DomUtil.addClass(categoryElement, 'expanded');
      categoryContent.style.display = 'block';
    } else {
      categoryContent.style.display = 'none';
    }

    // Bind click handler for category header
    L.DomEvent.on(categoryHeader, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this._toggleCategory(category.id);
    });
  },

  /**
   * Render a single item within a category
   * @param {Object} item - Item object with id, type, and type-specific properties
   * @param {HTMLElement} container - Container element to append the item to
   * @private
   */
  _renderItem(item, container) {
    // Create item container
    const itemElement = L.DomUtil.create(
      'div',
      'leaflet-pm-library-item',
      container
    );
    itemElement.setAttribute('data-item-id', item.id);

    // Create item preview
    const itemPreview = L.DomUtil.create(
      'div',
      'leaflet-pm-library-item-preview',
      itemElement
    );
    this._renderItemPreview(item, itemPreview);

    // Create item info
    const itemInfo = L.DomUtil.create(
      'div',
      'leaflet-pm-library-item-info',
      itemElement
    );
    const itemName = L.DomUtil.create(
      'span',
      'leaflet-pm-library-item-name',
      itemInfo
    );
    if (item.title === '') {
      itemName.textContent = item.id;
    }
    itemName.textContent = item.title;
    

    // Create item actions
    const itemActions = L.DomUtil.create(
      'div',
      'leaflet-pm-library-item-actions',
      itemElement
    );
    const editButton = L.DomUtil.create(
      'button',
      'leaflet-pm-library-item-edit',
      itemActions
    );
    editButton.innerHTML = '✎';
    editButton.title = this._library._t('library.editItem');

    // Bind click handlers
    L.DomEvent.on(itemElement, 'click', (e) => {
      // Don't trigger if clicking on edit button
      if (e.target === editButton) {
        return;
      }
      L.DomEvent.stopPropagation(e);
      this._onItemClick(item);
    });

    L.DomEvent.on(editButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this._onItemEdit(item, itemElement);
    });
  },

  /**
   * Render item preview based on item type
   * @param {Object} item - Item object
   * @param {HTMLElement} previewContainer - Preview container element
   * @private
   */
  _renderItemPreview(item, previewContainer) {
    switch (item.type) {
      case 'image':
        this._renderImagePreview(item, previewContainer);
        break;
      case 'svg':
        this._renderSvgPreview(item, previewContainer);
        break;
      case 'font':
        this._renderFontPreview(item, previewContainer);
        break;
      default:
        // Fallback for unknown types
        previewContainer.innerHTML = '?';
    }
  },

  /**
   * Render image item preview
   * @param {Object} item - Image item object
   * @param {HTMLElement} container - Preview container
   * @private
   */
  _renderImagePreview(item, container) {
    const img = L.DomUtil.create('img', '', container);
    img.src = item.src;
    img.alt = item.id;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';

    // Handle image load errors
    L.DomEvent.on(img, 'error', () => {
      container.innerHTML = '📷'; // Fallback icon
    });
  },

  /**
   * Render SVG item preview
   * @param {Object} item - SVG item object
   * @param {HTMLElement} container - Preview container
   * @private
   */
  _renderSvgPreview(item, container) {
    try {
      container.innerHTML = item.svg;

      // Ensure SVG fits in preview container
      const svgElement = container.querySelector('svg');
      if (svgElement) {
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '100%';
      }
    } catch (error) {
      console.error('Error rendering SVG preview:', error);
      container.innerHTML = '🖼️'; // Fallback icon
    }
  },

  /**
   * Render font item preview
   * @param {Object} item - Font item object
   * @param {HTMLElement} container - Preview container
   * @private
   */
  _renderFontPreview(item, container) {
    const iconElement = L.DomUtil.create('i', item.icon, container);
    iconElement.style.color = item.color;
    iconElement.style.fontSize = '24px';
    iconElement.style.display = 'flex';
    iconElement.style.alignItems = 'center';
    iconElement.style.justifyContent = 'center';
    iconElement.style.width = '100%';
    iconElement.style.height = '100%';
  },

  /**
   * Toggle category expansion state
   * @param {string} categoryId - ID of the category to toggle
   * @param {boolean} forceExpanded - Force expanded state (optional)
   */
  _toggleCategory(categoryId, forceExpanded = null) {
    const categoryElement = this._accordionContainer.querySelector(
      `[data-category-id="${categoryId}"]`
    );
    if (!categoryElement) {
      return;
    }

    const categoryContent = categoryElement.querySelector(
      '.leaflet-pm-library-category-content'
    );
    const isCurrentlyExpanded = L.DomUtil.hasClass(categoryElement, 'expanded');

    let shouldExpand;
    if (forceExpanded !== null) {
      shouldExpand = forceExpanded;
    } else {
      shouldExpand = !isCurrentlyExpanded;
    }

    if (shouldExpand) {
      // Expand category
      L.DomUtil.addClass(categoryElement, 'expanded');
      categoryContent.style.display = 'block';
      this._expandedCategories.add(categoryId);
    } else {
      // Collapse category
      L.DomUtil.removeClass(categoryElement, 'expanded');
      categoryContent.style.display = 'none';
      this._expandedCategories.delete(categoryId);
    }

    // Update library's expanded categories state
    this._library._expandedCategories = this._expandedCategories;
  },

  /**
   * Filter items based on search term
   * @param {string} searchTerm - Search term to filter by
   * @private
   */
  _filterItems(searchTerm) {
    if (!this._accordionContainer) {
      return;
    }

    const categories = this._accordionContainer.querySelectorAll(
      '.leaflet-pm-library-category'
    );
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    if (!normalizedSearchTerm) {
      // Show all categories and items when search is empty
      categories.forEach((categoryElement) => {
        L.DomUtil.removeClass(categoryElement, 'hidden');
        const items = categoryElement.querySelectorAll(
          '.leaflet-pm-library-item'
        );
        items.forEach((itemElement) => {
          L.DomUtil.removeClass(itemElement, 'hidden');
        });
      });
      return;
    }

    categories.forEach((categoryElement) => {
      const categoryId = categoryElement.getAttribute('data-category-id');
      const categoryTitle = categoryElement
        .querySelector('.leaflet-pm-library-category-title')
        .textContent.toLowerCase();
      const items = categoryElement.querySelectorAll(
        '.leaflet-pm-library-item'
      );

      let hasVisibleItems = false;

      // Check if category title matches search term
      const categoryMatches = categoryTitle.includes(normalizedSearchTerm);

      // Filter items within this category
      items.forEach((itemElement) => {
        const itemId = itemElement.getAttribute('data-item-id').toLowerCase();
        const itemMatches = itemId.includes(normalizedSearchTerm);

        if (categoryMatches || itemMatches) {
          L.DomUtil.removeClass(itemElement, 'hidden');
          hasVisibleItems = true;
        } else {
          L.DomUtil.addClass(itemElement, 'hidden');
        }
      });

      // Show/hide category based on whether it has visible items
      if (hasVisibleItems) {
        L.DomUtil.removeClass(categoryElement, 'hidden');
        // Auto-expand categories with matches
        this._toggleCategory(categoryId, true);
      } else {
        L.DomUtil.addClass(categoryElement, 'hidden');
      }
    });
  },

  /**
   * Handle item click event
   * @param {Object} item - Clicked item object
   * @private
   */
  _onItemClick(item) {
    if (!this._library._itemPlacer) {
      console.error('ItemPlacer not initialized');
      return;
    }

    // Check if clicking on already selected item (toggle behavior)
    const currentlySelected = this._library._itemPlacer.getSelectedItem();
    if (currentlySelected && currentlySelected.id === item.id) {
      // Deselect the item
      this._library._itemPlacer.clearSelection();
      this._updateItemSelection(null);
    } else {
      // Select the item for placement mode
      this._library._itemPlacer.selectItem(item);
      this._updateItemSelection(item);
    }
  },

  /**
   * Handle item edit event
   * @param {Object} item - Item to edit
   * @param {HTMLElement} itemElement - Item DOM element
   * @private
   */
  _onItemEdit(item, itemElement) {
    // Check if edit form already exists for this item
    const existingForm = itemElement.querySelector(
      '.leaflet-pm-library-item-edit-form'
    );
    if (existingForm) {
      return; // Edit form already open
    }

    // Create edit form container
    const editForm = L.DomUtil.create(
      'div',
      'leaflet-pm-library-item-edit-form'
    );

    // Create form content based on item type
    this._createEditFormContent(item, editForm);

    // Insert form after the item content
    itemElement.appendChild(editForm);

    // Bind form event handlers
    this._bindEditFormHandlers(item, itemElement, editForm);

    // Prevent map events on form
    L.DomEvent.disableClickPropagation(editForm);
    L.DomEvent.disableScrollPropagation(editForm);
  },

  /**
   * Create edit form content based on item type
   * @param {Object} item - Item to edit
   * @param {HTMLElement} editForm - Edit form container
   * @private
   */
  _createEditFormContent(item, editForm) {
    let formHTML = '';

    if (item.type === 'image') {
      formHTML = `
        <div class="leaflet-pm-library-edit-field">
          <label>${this._library._t('library.editForm.imageUrl')}:</label>
          <input type="text" name="src" value="${this._escapeHtml(item.src || '')}" placeholder="${this._library._t('library.editForm.placeholders.imageUrl')}" />
        </div>
        <div class="leaflet-pm-library-edit-field">
          <label>${this._library._t('library.editForm.width')}:</label>
          <input type="number" name="width" value="${item.width || 32}" placeholder="${this._library._t('library.editForm.placeholders.width')}" min="1" max="200" />
        </div>
        <div class="leaflet-pm-library-edit-field">
          <label>${this._library._t('library.editForm.height')}:</label>
          <input type="number" name="height" value="${item.height || 32}" placeholder="${this._library._t('library.editForm.placeholders.height')}" min="1" max="200" />
        </div>
      `;
    } else if (item.type === 'svg') {
      formHTML = `
        <div class="leaflet-pm-library-edit-field">
          <label>${this._library._t('library.editForm.svgContent')}:</label>
          <textarea name="svg" placeholder="${this._library._t('library.editForm.placeholders.svgMarkup')}">${this._escapeHtml(item.svg || '')}</textarea>
        </div>
      `;
    } else if (item.type === 'font') {
      formHTML = `
        <div class="leaflet-pm-library-edit-field">
          <label>${this._library._t('library.editForm.iconClass')}:</label>
          <input type="text" name="icon" value="${this._escapeHtml(item.icon || '')}" placeholder="${this._library._t('library.editForm.placeholders.iconClass')}" />
        </div>
        <div class="leaflet-pm-library-edit-field">
          <label>${this._library._t('library.editForm.color')}:</label>
          <input type="color" name="color" value="${item.color || '#000000'}" />
        </div>
      `;
    }

    // Add action buttons
    formHTML += `
      <div class="leaflet-pm-library-edit-actions">
        <button type="button" class="leaflet-pm-library-edit-save">${this._library._t('modals.apply')}</button>
        <button type="button" class="leaflet-pm-library-edit-cancel">${this._library._t('modals.cancel')}</button>
      </div>
    `;

    editForm.innerHTML = formHTML;
  },

  /**
   * Bind event handlers for edit form
   * @param {Object} item - Item being edited
   * @param {HTMLElement} itemElement - Item DOM element
   * @param {HTMLElement} editForm - Edit form element
   * @private
   */
  _bindEditFormHandlers(item, itemElement, editForm) {
    const saveButton = editForm.querySelector('.leaflet-pm-library-edit-save');
    const cancelButton = editForm.querySelector(
      '.leaflet-pm-library-edit-cancel'
    );

    // Save button handler
    L.DomEvent.on(saveButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this._saveItemEdit(item, itemElement, editForm);
    });

    // Cancel button handler
    L.DomEvent.on(cancelButton, 'click', (e) => {
      L.DomEvent.stopPropagation(e);
      this._cancelItemEdit(editForm);
    });

    // Handle Enter key to save
    const inputs = editForm.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      L.DomEvent.on(input, 'keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          this._saveItemEdit(item, itemElement, editForm);
        } else if (e.key === 'Escape') {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          this._cancelItemEdit(editForm);
        }
      });
    });
  },

  /**
   * Save item edit changes
   * @param {Object} item - Item being edited
   * @param {HTMLElement} itemElement - Item DOM element
   * @param {HTMLElement} editForm - Edit form element
   * @private
   */
  _saveItemEdit(item, itemElement, editForm) {
    const inputs = editForm.querySelectorAll('input, textarea');
    const changes = {};
    let hasChanges = false;
    let isValid = true;

    // Collect and validate changes
    inputs.forEach((input) => {
      const fieldName = input.name;
      const newValue = input.value.trim();
      const oldValue = item[fieldName];

      // Validate based on field type
      if (!this._validateEditField(fieldName, newValue, item.type)) {
        isValid = false;
        L.DomUtil.addClass(input, 'leaflet-pm-library-edit-error');
        return;
      } else {
        L.DomUtil.removeClass(input, 'leaflet-pm-library-edit-error');
      }

      // Convert numeric values
      let processedValue = newValue;
      if (fieldName === 'width' || fieldName === 'height') {
        processedValue = parseInt(newValue, 10);
      }

      // Check if value changed
      if (processedValue !== oldValue) {
        changes[fieldName] = processedValue;
        hasChanges = true;
      }
    });

    if (!isValid) {
      // Show validation error (could be enhanced with specific error messages)
      console.warn(
        'Invalid input values. Please check the highlighted fields.'
      );
      return;
    }

    if (hasChanges) {
      // Apply changes to item
      Object.assign(item, changes);

      // Update visual representation
      this._updateItemVisualRepresentation(item, itemElement);

      // Emit update event
      this._map.fire('pm:library-item-updated', {
        item: { ...item }, // Send a copy
        changes: { ...changes },
      });
    }

    // Remove edit form
    this._cancelItemEdit(editForm);
  },

  /**
   * Cancel item edit
   * @param {HTMLElement} editForm - Edit form element
   * @private
   */
  _cancelItemEdit(editForm) {
    if (editForm && editForm.parentNode) {
      editForm.parentNode.removeChild(editForm);
    }
  },

  /**
   * Validate edit field value
   * @param {string} fieldName - Field name
   * @param {string} value - Field value
   * @param {string} itemType - Item type
   * @returns {boolean} - Whether the value is valid
   * @private
   */
  _validateEditField(fieldName, value, itemType) {
    switch (fieldName) {
      case 'src':
        return value.length > 0; // Must have a URL
      case 'width':
      case 'height':
        const numValue = parseInt(value, 10);
        return !isNaN(numValue) && numValue > 0 && numValue <= 200;
      case 'svg':
        return value.length > 0 && value.includes('<svg'); // Basic SVG validation
      case 'icon':
        return value.length > 0; // Must have an icon class
      case 'color':
        return /^#[0-9A-Fa-f]{6}$/.test(value); // Valid hex color
      default:
        return true;
    }
  },

  /**
   * Update item visual representation after edit
   * @param {Object} item - Updated item
   * @param {HTMLElement} itemElement - Item DOM element
   * @private
   */
  _updateItemVisualRepresentation(item, itemElement) {
    // Update preview
    const previewContainer = itemElement.querySelector(
      '.leaflet-pm-library-item-preview'
    );
    if (previewContainer) {
      previewContainer.innerHTML = ''; // Clear existing content
      this._renderItemPreview(item, previewContainer);
    }

    // Update item name if needed (though ID shouldn't change)
    const itemName = itemElement.querySelector('.leaflet-pm-library-item-name');
    if (itemName) {
      itemName.textContent = item.id;
    }
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Refresh the panel content
   */
  refresh() {
    // Update UI text elements for language changes
    this._updateUIText();

    if (
      !this._library._categoriesJson ||
      !this._library._categoriesJson.categories
    ) {
      return;
    }

    // Store current state
    const currentExpandedCategories = new Set(this._expandedCategories);
    const currentSearchTerm = this._searchTerm;

    // Re-render accordion
    this._renderAccordion(this._library._categoriesJson.categories);

    // Restore expanded categories state
    this._expandedCategories = currentExpandedCategories;
    this._library._expandedCategories = this._expandedCategories;

    // Re-apply search filter if there was one
    if (currentSearchTerm) {
      this._searchTerm = currentSearchTerm;
      // Update search input value
      const searchInput = this._panelElement.querySelector(
        '.leaflet-pm-library-search-input'
      );
      if (searchInput) {
        searchInput.value = currentSearchTerm;
      }
      this._filterItems(currentSearchTerm);
    }

    // Re-expand categories that were previously expanded
    currentExpandedCategories.forEach((categoryId) => {
      this._toggleCategory(categoryId, true);
    });
  },

  /**
   * Update UI text elements for language changes
   * @private
   */
  _updateUIText() {
    // Update panel title
    const panelTitle = this._panelElement.querySelector(
      '.leaflet-pm-library-title'
    );
    if (panelTitle) {
      panelTitle.innerHTML = this._library._t('library.panel.title');
    }
    // Update search input placeholder
    const searchInput = this._panelElement.querySelector(
      '.leaflet-pm-library-search-input'
    );
    if (searchInput) {
      searchInput.placeholder = this._library._t('library.panel.search');
    }

    // Update Done button text
    const doneButton = this._panelElement.querySelector(
      '.leaflet-pm-library-done'
    );
    if (doneButton) {
      doneButton.innerHTML = this._library._t('library.done');
      doneButton.title = this._library._t('library.multiplePlace');
    }

    // Update button tooltips
    const closeButton = this._panelElement.querySelector(
      '.leaflet-pm-library-close'
    );
    if (closeButton) {
      closeButton.title = this._library._t('library.tooltips.closePanel');
    }

    const refreshButton = this._panelElement.querySelector(
      '.leaflet-pm-library-refresh'
    );
    if (refreshButton) {
      refreshButton.title = this._library._t('library.tooltips.refreshData');
    }
  },

  /**
   * Update item selection visual state
   * @param {Object|null} selectedItem - The selected item, or null to deselect
   * @private
   */
  _updateItemSelection(selectedItem) {
    // Remove previous selection
    const previousSelected = this._accordionContainer.querySelector(
      '.leaflet-pm-library-item.selected'
    );
    if (previousSelected) {
      L.DomUtil.removeClass(previousSelected, 'selected');
    }

    // Add selection to current item if provided
    if (selectedItem) {
      const itemElement = this._accordionContainer.querySelector(
        `[data-item-id="${selectedItem.id}"]`
      );
      if (itemElement) {
        L.DomUtil.addClass(itemElement, 'selected');
      }
    }

    // Show/hide Done button based on selection state
    const doneButton = this._panelElement.querySelector(
      '.leaflet-pm-library-done'
    );
    if (doneButton) {
      doneButton.style.display = selectedItem ? 'block' : 'none';
    }
  },

  /**
   * Handle Done button click
   * @private
   */
  _onDoneClick() {
    // Clear selection in ItemPlacer
    if (this._library._itemPlacer) {
      this._library._itemPlacer.clearSelection();
    }

    // Update visual state
    this._updateItemSelection(null);
  },

  /**
   * Apply panel position based on config
   * @private
   */
  _applyPanelPosition() {
    if (!this._panelElement) {
      return;
    }

    // Get panel position from global options (with safe access)
    let panelPosition = 'topright'; // Default
    if (
      this._map.pm &&
      this._map.pm.globalOptions &&
      this._map.pm.globalOptions.library &&
      this._map.pm.globalOptions.library.panelPosition
    ) {
      panelPosition = this._map.pm.globalOptions.library.panelPosition;
    }

    // Remove all position classes
    L.DomUtil.removeClass(this._panelElement, 'panel-topleft');
    L.DomUtil.removeClass(this._panelElement, 'panel-topright');
    L.DomUtil.removeClass(this._panelElement, 'panel-bottomleft');
    L.DomUtil.removeClass(this._panelElement, 'panel-bottomright');

    // Add the appropriate position class
    L.DomUtil.addClass(this._panelElement, `panel-${panelPosition}`);
  },

  /**
   * Update panel position from config
   * Called when global options change
   */
  updatePanelPosition() {
    this._applyPanelPosition();
  },

  /**
   * Clean up panel resources
   */
  remove() {
    if (this._panelElement && this._panelElement.parentNode) {
      this._panelElement.parentNode.removeChild(this._panelElement);
    }
    this._panelElement = null;
    this._accordionContainer = null;
  },
});

export default Panel;
