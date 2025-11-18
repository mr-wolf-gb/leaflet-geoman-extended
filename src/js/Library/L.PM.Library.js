import EventMixin from '../Mixins/Events';
import Panel from './L.PM.Library.Panel';
import ItemPlacer from './L.PM.Library.ItemPlacer';
import { getTranslation } from '../helpers';

const Library = L.Class.extend({
  includes: [EventMixin],

  initialize(map) {
    // Save the map instance
    this._map = map;

    // Initialize internal state properties
    this._categoriesJson = null;
    this._isPanelVisible = false;
    this._expandedCategories = new Set();
    this._searchTerm = '';
    this._placedMarkers = [];
    this._isRefreshing = false;

    // URL loading properties
    this._categoriesUrl = null;
    this._urlOptions = null;

    // Initialize Panel component
    this._panel = new Panel(this);

    // Initialize ItemPlacer component
    this._itemPlacer = new ItemPlacer(map);

    // Initialize global options reference
    this._globalLibraryOptions = null;

    // Listen for language changes (if supported by L.PM)
    this._setupLanguageListener();
  },

  /**
   * Setup listener for global language changes
   * @private
   */
  _setupLanguageListener() {
    // Listen to language change events from the map
    this._map.on('pm:langchange', (e) => {
      this._onLanguageChanged(e.activeLang);
    });
  },

  /**
   * Handle language change
   * @param {string} newLang - New language code
   * @private
   */
  _onLanguageChanged(newLang) {
    // Refresh panel if visible to update text
    if (this._isPanelVisible && this._panel) {
      this.refreshPanel();
    }

    // Emit language change event
    this._map.fire('pm:library-language-changed', {
      language: newLang,
      supported: true, // All languages supported by L.PM are supported
    });
  },

  /**
   * Load categories from JSON structure
   * @param {Object} json - Categories JSON data
   * @returns {boolean} - Success status
   */
  loadCategoriesJson(json) {
    if (!this._validateCategoriesJson(json)) {
      console.error('Invalid categories JSON provided');
      return false;
    }

    this._categoriesJson = json;

    // Emit categories loaded event
    this._map.fire('pm:library-categories-loaded', {
      categories: json.categories,
      source: 'manual',
    });

    // Refresh panel if it's currently visible (but not during a refresh operation)
    if (this._isPanelVisible && this._panel && !this._isRefreshing) {
      this._panel.refresh();
    }

    return true;
  },

  /**
   * Load categories from JSON URL
   * @param {string} url - URL to fetch JSON data from
   * @param {Object} options - Optional configuration
   * @param {boolean} options.cache - Whether to cache the URL for refresh (default: true)
   * @param {number} options.timeout - Request timeout in milliseconds (default: 10000)
   * @param {string} options.method - HTTP method (default: 'GET')
   * @param {Object} options.headers - Custom headers for the request
   * @param {string} options.mode - CORS mode: 'cors', 'no-cors', 'same-origin' (default: 'cors')
   * @param {string} options.credentials - Credentials mode: 'omit', 'same-origin', 'include' (default: 'same-origin')
   * @param {string} options.redirect - Redirect mode: 'follow', 'error', 'manual' (default: 'follow')
   * @param {string} options.referrerPolicy - Referrer policy (default: 'no-referrer-when-downgrade')
   * @param {Object} options.auth - Authentication configuration
   * @param {string} options.auth.type - Auth type: 'basic', 'bearer', 'api-key'
   * @param {string} options.auth.username - Username for basic auth
   * @param {string} options.auth.password - Password for basic auth
   * @param {string} options.auth.token - Token for bearer auth
   * @param {string} options.auth.apiKey - API key value
   * @param {string} options.auth.apiKeyHeader - Header name for API key (default: 'X-API-Key')
   * @param {Object} options.tls - TLS/SSL configuration
   * @param {boolean} options.tls.rejectUnauthorized - Whether to reject unauthorized certificates (default: true)
   * @param {string} options.tls.ca - Custom CA certificate (PEM format)
   * @param {string} options.tls.cert - Client certificate (PEM format)
   * @param {string} options.tls.key - Client private key (PEM format)
   * @returns {Promise<boolean>} - Success status
   */
  async loadCategoriesJsonFromUrl(url, options = {}) {
    const config = {
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
      ...options,
    };

    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided');
      return false;
    }

    try {
      // Store URL for refresh capability if caching is enabled
      if (config.cache) {
        this._categoriesUrl = url;
        this._urlOptions = config;
      }

      // Emit loading started event
      this._map.fire('pm:library-url-loading-started', {
        url: url,
        timestamp: new Date().toISOString(),
      });

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      // Prepare headers
      const headers = {
        Accept: 'application/json',
        ...config.headers,
      };

      // Add Content-Type for non-GET requests
      if (config.method !== 'GET' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Handle authentication
      if (config.auth) {
        switch (config.auth.type) {
          case 'basic':
            if (config.auth.username && config.auth.password) {
              const credentials = btoa(
                `${config.auth.username}:${config.auth.password}`
              );
              headers.Authorization = `Basic ${credentials}`;
            }
            break;
          case 'bearer':
            if (config.auth.token) {
              headers.Authorization = `Bearer ${config.auth.token}`;
            }
            break;
          case 'api-key':
            if (config.auth.apiKey) {
              const headerName = config.auth.apiKeyHeader || 'X-API-Key';
              headers[headerName] = config.auth.apiKey;
            }
            break;
        }
      }

      // Prepare fetch options
      const fetchOptions = {
        method: config.method,
        headers,
        mode: config.mode,
        credentials: config.credentials,
        redirect: config.redirect,
        referrerPolicy: config.referrerPolicy,
        signal: controller.signal,
      };

      // Note: TLS options (rejectUnauthorized, ca, cert, key) are not directly supported
      // in browser fetch API. These would need to be handled at the server/proxy level
      // or using a custom fetch implementation for Node.js environments.
      if (config.tls && !config.tls.rejectUnauthorized) {
        console.warn(
          'TLS certificate validation disabled. This is not recommended for production use.'
        );
        // In browser environments, certificate validation cannot be disabled via fetch API
        // This would need to be handled by the browser's security settings or a proxy
      }

      // Fetch JSON data from URL
      const response = await fetch(url, fetchOptions);

      // Clear timeout
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse JSON
      const json = await response.json();

      // Load the categories
      const success = this.loadCategoriesJson(json);

      if (success) {
        // Emit success event
        this._map.fire('pm:library-url-loaded', {
          url: url,
          categoriesCount: json.categories ? json.categories.length : 0,
          totalItems: this._getTotalItemsCount(),
          timestamp: new Date().toISOString(),
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to load categories from URL:', error);

      // Emit error event
      this._map.fire('pm:library-url-error', {
        url: url,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return false;
    }
  },

  /**
   * Refresh categories from the previously loaded URL
   * @returns {Promise<boolean>} - Success status
   */
  async refreshCategoriesFromUrl() {
    if (!this._categoriesUrl) {
      console.warn(
        'No URL available for refresh. Use loadCategoriesJsonFromUrl first.'
      );
      return false;
    }

    // Emit refresh started event
    this._map.fire('pm:library-url-refresh-started', {
      url: this._categoriesUrl,
      timestamp: new Date().toISOString(),
    });

    const success = await this.loadCategoriesJsonFromUrl(
      this._categoriesUrl,
      this._urlOptions
    );

    if (success) {
      // Emit refresh success event
      this._map.fire('pm:library-url-refreshed', {
        url: this._categoriesUrl,
        timestamp: new Date().toISOString(),
      });
    }

    return success;
  },

  /**
   * Get the currently cached URL
   * @returns {string|null} - The cached URL or null if none
   */
  getCachedUrl() {
    return this._categoriesUrl || null;
  },

  /**
   * Clear the cached URL
   */
  clearCachedUrl() {
    this._categoriesUrl = null;
    this._urlOptions = null;
  },

  /**
   * Get current categories JSON
   * @returns {Object|null} - Copy of current categories JSON
   */
  getCategoriesJson() {
    if (!this._categoriesJson) {
      return null;
    }

    // Return a deep copy to prevent external modifications
    return JSON.parse(JSON.stringify(this._categoriesJson));
  },

  /**
   * Check if library is enabled in global options
   * @returns {boolean} - Whether library is enabled
   */
  isEnabled() {
    const globalOptions = this._map.pm.getGlobalOptions();
    return (
      globalOptions && globalOptions.library && globalOptions.library.enabled
    );
  },

  /**
   * Update library from global options
   * @param {Object} libraryOptions - Library options from global options
   */
  updateFromGlobalOptions(libraryOptions) {
    if (!libraryOptions) {
      return;
    }

    // Store reference to global options for refresh functionality
    this._globalLibraryOptions = libraryOptions;

    // Update panel position if it changed
    if (this._panel && libraryOptions.panelPosition) {
      this._panel.updatePanelPosition();
    }
  },

  /**
   * Toggle panel visibility
   */
  togglePanel() {
    // Check if library is enabled before allowing toggle
    if (!this.isEnabled()) {
      console.warn(
        'Library is disabled in global options. Enable it with map.pm.setGlobalOptions({library: {enabled: true}})'
      );
      return;
    }

    if (this._isPanelVisible) {
      this._hidePanel();
    } else {
      this._showPanel();
    }
  },

  /**
   * Refresh panel content
   * Smart refresh that detects data source and reloads accordingly
   */
  async refreshPanel() {
    if (!this._isPanelVisible || !this._panel) {
      return;
    }

    // Set flag to prevent recursive calls during refresh
    if (this._isRefreshing) {
      return;
    }
    this._isRefreshing = true;

    try {
      // Try to refresh from global options first
      const globalOptions = this._map.pm.getGlobalOptions();
      const libraryOptions = globalOptions && globalOptions.library;

      if (libraryOptions) {
        // Priority 1: URL from global options
        if (libraryOptions.url) {
          const success = await this.loadCategoriesJsonFromUrl(
            libraryOptions.url,
            libraryOptions.urlOptions || {}
          );
          if (success) {
            return; // Successfully refreshed from global options URL
          }
        }

        // Priority 2: JSON from global options
        if (libraryOptions.json) {
          const success = this.loadCategoriesJson(libraryOptions.json);
          if (success) {
            return; // Successfully refreshed from global options JSON
          }
        }
      }

      // Priority 3: Fallback to cached URL (legacy behavior)
      if (this._categoriesUrl) {
        const success = await this.refreshCategoriesFromUrl();
        if (success) {
          return; // Successfully refreshed from cached URL
        }
      }

      // Priority 4: Just refresh the panel display without reloading data
      this._panel.refresh();
    } finally {
      this._isRefreshing = false;
    }
  },

  /**
   * Show the panel
   * @private
   */
  _showPanel() {
    if (!this._categoriesJson) {
      console.warn(
        'No categories loaded. Please load categories first using loadCategoriesJson()'
      );
      return;
    }

    // Delegate to Panel component
    this._panel.show();
  },

  /**
   * Hide the panel
   * @private
   */
  _hidePanel() {
    // Clear any active selection when hiding panel
    if (this._itemPlacer && this._itemPlacer.isPlacementMode()) {
      this._itemPlacer.clearSelection();
    }

    // Delegate to Panel component
    this._panel.hide();
  },

  /**
   * Get total count of items across all categories
   * @private
   */
  _getTotalItemsCount() {
    if (!this._categoriesJson || !this._categoriesJson.categories) {
      return 0;
    }

    return this._categoriesJson.categories.reduce((total, category) => {
      return total + (category.items ? category.items.length : 0);
    }, 0);
  },

  /**
   * Validate categories JSON structure
   * @param {Object} json - JSON to validate
   * @returns {boolean} - Validation result
   * @private
   */
  _validateCategoriesJson(json) {
    // Check if json is an object
    if (!json || typeof json !== 'object') {
      console.error('Invalid JSON: must be an object');
      return false;
    }

    // Check if categories array exists
    if (!Array.isArray(json.categories)) {
      console.error('Invalid JSON: categories must be an array');
      return false;
    }

    // Validate each category
    for (const category of json.categories) {
      if (!this._validateCategory(category)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Validate individual category structure
   * @param {Object} category - Category to validate
   * @returns {boolean} - Validation result
   * @private
   */
  _validateCategory(category) {
    // Check required category fields
    if (!category.id || typeof category.id !== 'string') {
      console.error('Invalid category: missing or invalid id');
      return false;
    }

    if (!category.title || typeof category.title !== 'string') {
      console.error('Invalid category: missing or invalid title');
      return false;
    }

    // Check items array
    if (!Array.isArray(category.items)) {
      console.error(`Invalid category ${category.id}: items must be an array`);
      return false;
    }

    // Validate each item in the category
    for (const item of category.items) {
      if (!this._validateItem(item, category.id)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Validate individual item structure
   * @param {Object} item - Item to validate
   * @param {string} categoryId - Parent category ID for error reporting
   * @returns {boolean} - Validation result
   * @private
   */
  _validateItem(item, categoryId) {
    // Check required item fields
    if (!item.id || typeof item.id !== 'string') {
      console.error(
        `Invalid item in category ${categoryId}: missing or invalid id`
      );
      return false;
    }

    if (!item.type || typeof item.type !== 'string') {
      console.error(
        `Invalid item ${item.id} in category ${categoryId}: missing or invalid type`
      );
      return false;
    }

    // Check if type is valid
    const validTypes = ['image', 'svg', 'font'];
    if (!validTypes.includes(item.type)) {
      console.error(
        `Invalid item ${item.id}: type must be one of: ${validTypes.join(', ')}`
      );
      return false;
    }

    // Type-specific validation
    return this._validateItemByType(item, categoryId);
  },

  /**
   * Validate item based on its type
   * @param {Object} item - Item to validate
   * @param {string} categoryId - Parent category ID for error reporting
   * @returns {boolean} - Validation result
   * @private
   */
  _validateItemByType(item, categoryId) {
    switch (item.type) {
      case 'image':
        return this._validateImageItem(item, categoryId);
      case 'svg':
        return this._validateSvgItem(item, categoryId);
      case 'font':
        return this._validateFontItem(item, categoryId);
      default:
        return false;
    }
  },

  /**
   * Validate image type item
   * @param {Object} item - Item to validate
   * @param {string} categoryId - Parent category ID for error reporting
   * @returns {boolean} - Validation result
   * @private
   */
  _validateImageItem(item, categoryId) {
    if (!item.src || typeof item.src !== 'string') {
      console.error(
        `Invalid image item ${item.id} in category ${categoryId}: missing or invalid src`
      );
      return false;
    }

    if (!item.width || typeof item.width !== 'number' || item.width <= 0) {
      console.error(
        `Invalid image item ${item.id} in category ${categoryId}: missing or invalid width`
      );
      return false;
    }

    if (!item.height || typeof item.height !== 'number' || item.height <= 0) {
      console.error(
        `Invalid image item ${item.id} in category ${categoryId}: missing or invalid height`
      );
      return false;
    }

    return true;
  },

  /**
   * Validate SVG type item
   * @param {Object} item - Item to validate
   * @param {string} categoryId - Parent category ID for error reporting
   * @returns {boolean} - Validation result
   * @private
   */
  _validateSvgItem(item, categoryId) {
    if (!item.svg || typeof item.svg !== 'string') {
      console.error(
        `Invalid svg item ${item.id} in category ${categoryId}: missing or invalid svg`
      );
      return false;
    }

    return true;
  },

  /**
   * Validate font type item
   * @param {Object} item - Item to validate
   * @param {string} categoryId - Parent category ID for error reporting
   * @returns {boolean} - Validation result
   * @private
   */
  _validateFontItem(item, categoryId) {
    if (!item.icon || typeof item.icon !== 'string') {
      console.error(
        `Invalid font item ${item.id} in category ${categoryId}: missing or invalid icon`
      );
      return false;
    }

    if (!item.color || typeof item.color !== 'string') {
      console.error(
        `Invalid font item ${item.id} in category ${categoryId}: missing or invalid color`
      );
      return false;
    }

    // Basic color validation (hex format)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(item.color)) {
      console.error(
        `Invalid font item ${item.id} in category ${categoryId}: color must be in hex format (e.g., #FF0000)`
      );
      return false;
    }

    return true;
  },

  /**
   * Get translated text using the standard Leaflet-Geoman translation system
   * @param {string} key - Translation key (e.g., 'library.panel.title')
   * @returns {string} - Translated text
   */
  _t(key) {
    return getTranslation(key);
  },

  /**
   * Get current language (from global L.PM setting)
   * @returns {string} - Current language code
   */
  getCurrentLanguage() {
    return L.PM.activeLang || 'en';
  },

  /**
   * Get library options from global options
   * @returns {Object|null} - Library options or null if not available
   */
  getGlobalLibraryOptions() {
    const globalOptions = this._map.pm.getGlobalOptions();
    return globalOptions && globalOptions.library
      ? globalOptions.library
      : null;
  },

  /**
   * Load library data from global options if available
   * @returns {Promise<boolean>} - Success status
   */
  async loadFromGlobalOptions() {
    const libraryOptions = this.getGlobalLibraryOptions();

    if (!libraryOptions || !libraryOptions.enabled) {
      return false;
    }

    if (libraryOptions.url) {
      return await this.loadCategoriesJsonFromUrl(
        libraryOptions.url,
        libraryOptions.urlOptions || {}
      );
    } else if (libraryOptions.json) {
      return this.loadCategoriesJson(libraryOptions.json);
    }

    return false;
  },

  /**
   * Check if library has data configured in global options
   * @returns {boolean} - Whether library has data configured
   */
  hasGlobalData() {
    const libraryOptions = this.getGlobalLibraryOptions();
    return libraryOptions && (libraryOptions.url || libraryOptions.json);
  },

  /**
   * Clean up library resources
   */
  remove() {
    // Clean up language listener
    this._map.off('pm:langchange');

    // Clean up ItemPlacer
    if (this._itemPlacer) {
      this._itemPlacer.remove();
    }

    // Clean up Panel
    if (this._panel) {
      this._panel.remove();
    }

    // Clear references
    this._itemPlacer = null;
    this._panel = null;
    this._categoriesJson = null;
    this._placedMarkers = [];
    this._categoriesUrl = null;
    this._urlOptions = null;
  },
});

export default Library;
