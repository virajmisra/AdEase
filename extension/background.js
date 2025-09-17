// Background service worker for Ad Volume Reducer extension
class ExtensionManager {
  constructor() {
    this.isEnabled = true;
    this.settings = {
      sensitivity: 70,
      originalVolume: 75,
      reducedVolume: 25,
      autoAdjust: true,
      fadeTransitions: true
    };
    this.init();
  }

  async init() {
    // Load settings from storage
    const stored = await chrome.storage.sync.get(['settings', 'isEnabled']);
    if (stored.settings) {
      this.settings = { ...this.settings, ...stored.settings };
    }
    if (stored.isEnabled !== undefined) {
      this.isEnabled = stored.isEnabled;
    }

    // Set up message listeners
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Set up tab listeners for video detection
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'GET_STATUS':
        sendResponse({
          isEnabled: this.isEnabled,
          settings: this.settings,
          detectionStatus: 'idle'
        });
        break;

      case 'UPDATE_SETTINGS':
        this.settings = { ...this.settings, ...message.settings };
        await chrome.storage.sync.set({ settings: this.settings });
        
        // Broadcast to all content scripts
        this.broadcastToTabs({
          type: 'SETTINGS_UPDATED',
          settings: this.settings
        });
        
        sendResponse({ success: true });
        break;

      case 'TOGGLE_EXTENSION':
        this.isEnabled = message.enabled;
        await chrome.storage.sync.set({ isEnabled: this.isEnabled });
        
        // Broadcast to all content scripts
        this.broadcastToTabs({
          type: 'EXTENSION_TOGGLED',
          enabled: this.isEnabled
        });
        
        sendResponse({ success: true });
        break;

      case 'DETECTION_STATUS':
        // Forward status updates to popup if open
        this.broadcastToTabs({
          type: 'STATUS_UPDATE',
          status: message.status
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // When a tab is updated, check if it has video content
    if (changeInfo.status === 'complete' && this.isEnabled) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'INIT_DETECTION',
          settings: this.settings
        });
      } catch (error) {
        // Tab might not have content script loaded yet
        console.log('Could not initialize detection for tab:', tabId);
      }
    }
  }

  async broadcastToTabs(message) {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Some tabs might not have content script
        }
      }
    } catch (error) {
      console.error('Error broadcasting to tabs:', error);
    }
  }
}

// Initialize extension manager
const extensionManager = new ExtensionManager();