// Content script for Ad Volume Reducer - runs on all web pages
class AdVolumeDetector {
  constructor() {
    this.isEnabled = false;
    this.settings = {};
    this.detectionStatus = 'idle';
    this.audioContext = null;
    this.analyser = null;
    this.model = null;
    this.videoElements = [];
    this.detectionInterval = null;
    
    this.init();
  }

  async init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Get initial status from background
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    this.isEnabled = response.isEnabled;
    this.settings = response.settings;
    
    if (this.isEnabled) {
      this.startDetection();
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'EXTENSION_TOGGLED':
        this.isEnabled = message.enabled;
        if (this.isEnabled) {
          this.startDetection();
        } else {
          this.stopDetection();
        }
        sendResponse({ success: true });
        break;

      case 'SETTINGS_UPDATED':
        this.settings = message.settings;
        sendResponse({ success: true });
        break;

      case 'INIT_DETECTION':
        this.settings = message.settings;
        if (this.isEnabled) {
          this.startDetection();
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  async startDetection() {
    if (!this.isEnabled) return;

    try {
      // Find video elements on the page
      this.findVideoElements();
      
      if (this.videoElements.length === 0) {
        // No videos found, check again later
        setTimeout(() => this.startDetection(), 2000);
        return;
      }

      // Load ML model
      await this.loadModel();
      
      // Set up audio analysis
      await this.setupAudioAnalysis();
      
      // Start detection loop
      this.startDetectionLoop();
      
      console.log('Ad Volume Reducer: Detection started');
    } catch (error) {
      console.error('Ad Volume Reducer: Failed to start detection:', error);
    }
  }

  stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Restore original volume
    this.setVideoVolume(this.settings.originalVolume / 100);
    this.updateDetectionStatus('idle');
    
    console.log('Ad Volume Reducer: Detection stopped');
  }

  findVideoElements() {
    this.videoElements = Array.from(document.querySelectorAll('video')).filter(video => {
      // Only consider videos that are playing or can play
      return !video.paused && video.duration > 0;
    });
  }

  async loadModel() {
    if (this.model) return;

    try {
      // Load TensorFlow.js model
      const modelPath = chrome.runtime.getURL('models/ad_detector_model.json');
      
      // For now, simulate model loading since we haven't created the model yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock model for development
      this.model = {
        predict: (features) => {
          // Simple mock prediction based on volume spikes
          const avgVolume = features.reduce((sum, val) => sum + val, 0) / features.length;
          const volumeVariation = Math.max(...features) - Math.min(...features);
          
          // Higher volume variation might indicate ad transitions
          const adProbability = Math.min(volumeVariation * 0.1, 1.0);
          return adProbability > 0.6 ? 'ad' : 'program';
        }
      };
      
      console.log('Ad Volume Reducer: Model loaded');
    } catch (error) {
      console.error('Ad Volume Reducer: Failed to load model:', error);
      throw error;
    }
  }

  async setupAudioAnalysis() {
    if (this.videoElements.length === 0) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Connect to the first video element
      const video = this.videoElements[0];
      const source = this.audioContext.createMediaElementSource(video);
      
      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect audio graph
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      console.log('Ad Volume Reducer: Audio analysis setup complete');
    } catch (error) {
      console.error('Ad Volume Reducer: Failed to setup audio analysis:', error);
      throw error;
    }
  }

  startDetectionLoop() {
    if (this.detectionInterval) return;

    this.detectionInterval = setInterval(() => {
      this.performDetection();
    }, 1000); // Analyze every second
  }

  performDetection() {
    if (!this.analyser || !this.model || !this.isEnabled) return;

    try {
      // Extract audio features
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);
      
      // Convert to normalized features
      const features = Array.from(dataArray).map(val => val / 255.0);
      
      // Run prediction
      const prediction = this.model.predict(features);
      
      // Update status and volume based on prediction
      if (prediction === 'ad' && this.detectionStatus !== 'ad') {
        this.updateDetectionStatus('ad');
        this.setVideoVolume(this.settings.reducedVolume / 100);
      } else if (prediction === 'program' && this.detectionStatus !== 'program') {
        this.updateDetectionStatus('program');
        this.setVideoVolume(this.settings.originalVolume / 100);
      }
      
    } catch (error) {
      console.error('Ad Volume Reducer: Detection error:', error);
    }
  }

  setVideoVolume(volume) {
    if (!this.settings.autoAdjust) return;

    this.videoElements.forEach(video => {
      if (this.settings.fadeTransitions) {
        // Smooth volume transition
        this.animateVolume(video, video.volume, volume, 500);
      } else {
        // Instant volume change
        video.volume = volume;
      }
    });
  }

  animateVolume(video, startVolume, endVolume, duration) {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeProgress = progress * (2 - progress);
      const currentVolume = startVolume + (endVolume - startVolume) * easeProgress;
      
      video.volume = currentVolume;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  updateDetectionStatus(status) {
    this.detectionStatus = status;
    
    // Send status update to background script
    chrome.runtime.sendMessage({
      type: 'DETECTION_STATUS',
      status: status
    });
  }
}

// Initialize detector when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AdVolumeDetector();
  });
} else {
  new AdVolumeDetector();
}