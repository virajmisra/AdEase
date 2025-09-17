// Popup script for Ad Volume Reducer extension
class PopupManager {
  constructor() {
    this.state = {
      isEnabled: false,
      detectionStatus: 'idle',
      settings: {
        sensitivity: 70,
        originalVolume: 75,
        reducedVolume: 25,
        autoAdjust: true,
        fadeTransitions: true
      }
    };
    
    this.init();
  }

  async init() {
    // Get current status from background script
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    this.state = { ...this.state, ...response };
    
    this.render();
    this.attachEventListeners();
  }

  async toggleExtension() {
    this.state.isEnabled = !this.state.isEnabled;
    
    const response = await chrome.runtime.sendMessage({
      type: 'TOGGLE_EXTENSION',
      enabled: this.state.isEnabled
    });
    
    if (response.success) {
      this.render();
    }
  }

  async updateSettings(newSettings) {
    this.state.settings = { ...this.state.settings, ...newSettings };
    
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: this.state.settings
    });
    
    if (response.success) {
      this.render();
    }
  }

  render() {
    const root = document.getElementById('root');
    
    root.innerHTML = `
      <div class="popup-container">
        <div class="header">
          <div class="title-section">
            <h1>Ad Volume Reducer</h1>
            <p class="status-text">
              ${this.state.isEnabled 
                ? 'Auto-adjusting volume when ads are detected' 
                : 'Click to enable ad detection'
              }
            </p>
          </div>
          <label class="switch">
            <input type="checkbox" id="enableToggle" ${this.state.isEnabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        ${this.state.isEnabled ? this.renderActiveState() : this.renderDisabledState()}
      </div>
    `;
  }

  renderActiveState() {
    return `
      <div class="content">
        <div class="status-section">
          <h3>Current Status</h3>
          <div class="status-indicator ${this.state.detectionStatus}">
            <div class="status-dot"></div>
            <span>${this.getStatusLabel()}</span>
          </div>
        </div>

        <div class="volume-section">
          <h3>Volume Control</h3>
          
          <div class="volume-display">
            <div class="volume-icon">🔊</div>
            <div class="volume-bar">
              <div class="volume-fill" style="width: ${this.getCurrentVolume()}%"></div>
            </div>
            <span class="volume-percentage">${Math.round(this.getCurrentVolume())}%</span>
          </div>

          <div class="volume-controls">
            <div class="control-group">
              <label>Normal Volume</label>
              <input type="range" id="originalVolume" min="0" max="100" 
                     value="${this.state.settings.originalVolume}">
              <span>${this.state.settings.originalVolume}%</span>
            </div>

            <div class="control-group">
              <label>Ad Volume</label>
              <input type="range" id="reducedVolume" min="0" max="100" 
                     value="${this.state.settings.reducedVolume}">
              <span>${this.state.settings.reducedVolume}%</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <button id="toggleSettings" class="settings-toggle">
            <span>Advanced Settings</span>
            <span class="chevron">▼</span>
          </button>
          
          <div id="advancedSettings" class="advanced-settings collapsed">
            <div class="control-group">
              <label>Detection Sensitivity</label>
              <p class="help-text">How quickly the extension responds to potential ads. Higher values detect ads faster but may have false positives.</p>
              <input type="range" id="sensitivity" min="10" max="100" 
                     value="${this.state.settings.sensitivity}">
              <span>${this.state.settings.sensitivity}%</span>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" id="autoAdjust" ${this.state.settings.autoAdjust ? 'checked' : ''}>
                <span class="checkmark"></span>
                Auto-adjust volume
              </label>
              <p class="help-text">Automatically lower volume when ads are detected and restore when they end.</p>
            </div>

            <div class="checkbox-group">
              <label>
                <input type="checkbox" id="fadeTransitions" ${this.state.settings.fadeTransitions ? 'checked' : ''}>
                <span class="checkmark"></span>
                Smooth transitions
              </label>
              <p class="help-text">Gradually fade volume changes instead of instant adjustments for a smoother experience.</p>
            </div>

            <button id="resetSettings" class="reset-button">
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderDisabledState() {
    return `
      <div class="disabled-state">
        <div class="disabled-message">
          <div class="disabled-icon">🔇</div>
          <p>Enable the extension to start detecting ads</p>
        </div>
      </div>
    `;
  }

  getStatusLabel() {
    switch (this.state.detectionStatus) {
      case 'program': return 'Program Content';
      case 'ad': return 'Ad Detected';
      case 'processing': return 'Processing...';
      default: return 'Idle';
    }
  }

  getCurrentVolume() {
    return this.state.detectionStatus === 'ad' 
      ? this.state.settings.reducedVolume 
      : this.state.settings.originalVolume;
  }

  attachEventListeners() {
    // Extension toggle
    document.getElementById('enableToggle')?.addEventListener('change', (e) => {
      this.toggleExtension();
    });

    // Volume controls
    document.getElementById('originalVolume')?.addEventListener('input', (e) => {
      this.updateSettings({ originalVolume: parseInt(e.target.value) });
    });

    document.getElementById('reducedVolume')?.addEventListener('input', (e) => {
      this.updateSettings({ reducedVolume: parseInt(e.target.value) });
    });

    // Settings controls
    document.getElementById('sensitivity')?.addEventListener('input', (e) => {
      this.updateSettings({ sensitivity: parseInt(e.target.value) });
    });

    document.getElementById('autoAdjust')?.addEventListener('change', (e) => {
      this.updateSettings({ autoAdjust: e.target.checked });
    });

    document.getElementById('fadeTransitions')?.addEventListener('change', (e) => {
      this.updateSettings({ fadeTransitions: e.target.checked });
    });

    // Advanced settings toggle
    document.getElementById('toggleSettings')?.addEventListener('click', () => {
      const settings = document.getElementById('advancedSettings');
      const chevron = document.querySelector('.chevron');
      
      settings.classList.toggle('collapsed');
      chevron.textContent = settings.classList.contains('collapsed') ? '▼' : '▲';
    });

    // Reset button
    document.getElementById('resetSettings')?.addEventListener('click', () => {
      this.updateSettings({
        sensitivity: 50,
        autoAdjust: true,
        fadeTransitions: true
      });
    });
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
  });
} else {
  new PopupManager();
}