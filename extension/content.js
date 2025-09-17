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

  this.sourceNode = null; // ensure we don't reuse an old one

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
      // Try to load JavaScript model first (faster and lighter)
      const jsModelPath = chrome.runtime.getURL('models/ad_detector_js.json');
      
      try {
        const response = await fetch(jsModelPath);
        if (response.ok) {
          const jsModel = await response.json();
          this.model = new SimpleJSModel(jsModel);
          console.log('Ad Volume Reducer: JavaScript model loaded');
          return;
        }
      } catch (error) {
        console.log('JavaScript model not found, using fallback model');
      }

      // Fallback to a heuristic-based model for demo purposes
      this.model = new HeuristicModel(this.settings);
      
      console.log('Ad Volume Reducer: Heuristic model loaded');
    } catch (error) {
      console.error('Ad Volume Reducer: Failed to load model:', error);
      throw error;
    }
  }

  async setupAudioAnalysis() {
  if (this.videoElements.length === 0) return;

  try {
    // Close any previous AudioContext first
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (e) {
        console.warn('Ad Volume Reducer: Failed to close previous AudioContext', e);
      }
    }

    // Always create a fresh AudioContext and MediaElementSource
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const video = this.videoElements[0];
    this.sourceNode = this.audioContext.createMediaElementSource(video);

    // Create analyser for frequency analysis
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;

    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();

    // Connect: source -> analyser -> gain -> destination
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Reset buffers
    this.featureBuffer = [];
    this.bufferSize = 5;

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
      // Extract comprehensive audio features
      const features = this.extractAudioFeatures();
      
      if (features) {
        // Add features to buffer
        this.featureBuffer.push(features);
        if (this.featureBuffer.length > this.bufferSize) {
          this.featureBuffer.shift();
        }
        
        // Run prediction if we have enough samples
        if (this.featureBuffer.length >= 3) {
          const prediction = this.model.predict(this.featureBuffer);
          
          // Update status and volume based on prediction
          if (prediction === 'ad' && this.detectionStatus !== 'ad') {
            this.updateDetectionStatus('ad');
            this.setAudioVolume(this.settings.reducedVolume / 100);
          } else if (prediction === 'program' && this.detectionStatus !== 'program') {
            this.updateDetectionStatus('program');
            this.setAudioVolume(this.settings.originalVolume / 100);
          }
        }
      }
      
    } catch (error) {
      console.error('Ad Volume Reducer: Detection error:', error);
    }
  }

  extractAudioFeatures() {
    if (!this.analyser) return null;

    try {
      // Get frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(frequencyData);
      
      // Get time domain data
      const timeDomainData = new Uint8Array(bufferLength);
      this.analyser.getByteTimeDomainData(timeDomainData);
      
      // Convert to normalized arrays
      const frequencies = Array.from(frequencyData).map(val => val / 255.0);
      const timeDomain = Array.from(timeDomainData).map(val => (val - 128) / 128.0);
      
      // Extract basic audio features
      const features = {
        // Spectral features
        spectral_centroid: this.calculateSpectralCentroid(frequencies),
        spectral_rolloff: this.calculateSpectralRolloff(frequencies),
        spectral_bandwidth: this.calculateSpectralBandwidth(frequencies),
        spectral_flux: this.calculateSpectralFlux(frequencies),
        
        // Energy features
        energy: this.calculateEnergy(frequencies),
        energy_entropy: this.calculateEnergyEntropy(frequencies),
        
        // Temporal features
        zero_crossing_rate: this.calculateZeroCrossingRate(timeDomain),
        
        // Volume characteristics
        rms: this.calculateRMS(timeDomain),
        peak_volume: Math.max(...frequencies),
        volume_variance: this.calculateVariance(frequencies),
        
        // Harmonic features (simplified)
        harmonic_ratio: this.calculateHarmonicRatio(frequencies),
        
        timestamp: Date.now()
      };
      
      return features;
      
    } catch (error) {
      console.error('Feature extraction error:', error);
      return null;
    }
  }

  // Audio feature calculation methods
  calculateSpectralCentroid(frequencies) {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      weightedSum += i * frequencies[i];
      magnitudeSum += frequencies[i];
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  calculateSpectralRolloff(frequencies) {
    const totalEnergy = frequencies.reduce((sum, val) => sum + val, 0);
    const threshold = totalEnergy * 0.85;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < frequencies.length; i++) {
      cumulativeEnergy += frequencies[i];
      if (cumulativeEnergy >= threshold) {
        return i / frequencies.length;
      }
    }
    return 1.0;
  }

  calculateSpectralBandwidth(frequencies) {
    const centroid = this.calculateSpectralCentroid(frequencies);
    let weightedVariance = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      weightedVariance += Math.pow(i - centroid, 2) * frequencies[i];
      magnitudeSum += frequencies[i];
    }
    
    return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
  }

  calculateSpectralFlux(frequencies) {
    if (!this.previousFrequencies) {
      this.previousFrequencies = frequencies.slice();
      return 0;
    }
    
    let flux = 0;
    for (let i = 0; i < frequencies.length; i++) {
      const diff = frequencies[i] - this.previousFrequencies[i];
      flux += diff * diff;
    }
    
    this.previousFrequencies = frequencies.slice();
    return Math.sqrt(flux);
  }

  calculateEnergy(frequencies) {
    return frequencies.reduce((sum, val) => sum + val * val, 0);
  }

  calculateEnergyEntropy(frequencies) {
    const totalEnergy = this.calculateEnergy(frequencies);
    if (totalEnergy === 0) return 0;
    
    let entropy = 0;
    for (const freq of frequencies) {
      if (freq > 0) {
        const normalizedEnergy = (freq * freq) / totalEnergy;
        entropy -= normalizedEnergy * Math.log2(normalizedEnergy);
      }
    }
    return entropy;
  }

  calculateZeroCrossingRate(timeDomain) {
    let crossings = 0;
    for (let i = 1; i < timeDomain.length; i++) {
      if ((timeDomain[i] >= 0) !== (timeDomain[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (timeDomain.length - 1);
  }

  calculateRMS(timeDomain) {
    const sumSquares = timeDomain.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumSquares / timeDomain.length);
  }

  calculateVariance(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  calculateHarmonicRatio(frequencies) {
    // Simple harmonic detection - look for periodic patterns
    const harmonicBins = [];
    const fundamentalBin = this.findDominantFrequency(frequencies);
    
    for (let harmonic = 2; harmonic <= 5; harmonic++) {
      const harmonicBin = Math.min(fundamentalBin * harmonic, frequencies.length - 1);
      harmonicBins.push(frequencies[harmonicBin]);
    }
    
    const harmonicEnergy = harmonicBins.reduce((sum, val) => sum + val, 0);
    const totalEnergy = frequencies.reduce((sum, val) => sum + val, 0);
    
    return totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0;
  }

  findDominantFrequency(frequencies) {
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      if (frequencies[i] > maxValue) {
        maxValue = frequencies[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
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

  setAudioVolume(volume) {
    if (!this.settings.autoAdjust || !this.gainNode) return;

    if (this.settings.fadeTransitions) {
      // Smooth gain transition using Web Audio API
      const currentTime = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
      this.gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.5);
    } else {
      // Instant gain change
      this.gainNode.gain.value = volume;
    }
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



// Model classes for different types of inference
class SimpleJSModel {
  constructor(modelData) {
    this.type = modelData.type;
    this.featureNames = modelData.feature_names || [];
    this.scalerMean = modelData.scaler_mean || [];
    this.scalerScale = modelData.scaler_scale || [];
    
    if (this.type === 'logistic_regression') {
      this.coefficients = modelData.coefficients;
      this.intercept = modelData.intercept;
    } else if (this.type === 'simple_rules') {
      this.featureImportances = modelData.feature_importances || [];
      this.threshold = modelData.threshold || 0.5;
    }
  }

  predict(featureBuffer) {
    try {
      // Use the most recent features
      const features = featureBuffer[featureBuffer.length - 1];
      
      // Convert features object to array
      const featureVector = this.extractFeatureVector(features);
      
      // Normalize features
      const normalizedFeatures = this.normalizeFeatures(featureVector);
      
      if (this.type === 'logistic_regression') {
        return this.predictLogisticRegression(normalizedFeatures);
      } else if (this.type === 'simple_rules') {
        return this.predictSimpleRules(normalizedFeatures);
      }
      
      return 'program';
    } catch (error) {
      console.error('Prediction error:', error);
      return 'program';
    }
  }

  extractFeatureVector(features) {
    // Extract features in a consistent order
    const featureOrder = [
      'spectral_centroid', 'spectral_rolloff', 'spectral_bandwidth', 'spectral_flux',
      'energy', 'energy_entropy', 'zero_crossing_rate', 'rms', 'peak_volume',
      'volume_variance', 'harmonic_ratio'
    ];
    
    return featureOrder.map(name => features[name] || 0);
  }

  normalizeFeatures(features) {
    return features.map((value, index) => {
      if (index < this.scalerMean.length && this.scalerScale[index] !== 0) {
        return (value - this.scalerMean[index]) / this.scalerScale[index];
      }
      return value;
    });
  }

  predictLogisticRegression(features) {
    let linearCombination = this.intercept;
    
    for (let i = 0; i < Math.min(features.length, this.coefficients.length); i++) {
      linearCombination += features[i] * this.coefficients[i];
    }
    
    const probability = 1 / (1 + Math.exp(-linearCombination));
    return probability > 0.5 ? 'ad' : 'program';
  }

  predictSimpleRules(features) {
    let weightedSum = 0;
    
    for (let i = 0; i < Math.min(features.length, this.featureImportances.length); i++) {
      weightedSum += features[i] * this.featureImportances[i];
    }
    
    return weightedSum > this.threshold ? 'ad' : 'program';
  }
}

class HeuristicModel {
  constructor(settings) {
    this.sensitivity = settings.sensitivity / 100;
    this.previousEnergy = null;
    this.energyBuffer = [];
    this.predictionBuffer = [];
    this.bufferSize = 10;
  }

  predict(featureBuffer) {
    try {
      if (featureBuffer.length < 2) return 'program';
      
      const currentFeatures = featureBuffer[featureBuffer.length - 1];
      const previousFeatures = featureBuffer[featureBuffer.length - 2];
      
      // Calculate energy change
      const energyChange = Math.abs(currentFeatures.energy - previousFeatures.energy);
      const volumeChange = Math.abs(currentFeatures.peak_volume - previousFeatures.peak_volume);
      const spectralChange = Math.abs(currentFeatures.spectral_centroid - previousFeatures.spectral_centroid);
      
      // Ad detection heuristics
      const adScore = this.calculateAdScore(currentFeatures, energyChange, volumeChange, spectralChange);
      
      // Add to prediction buffer for smoothing
      this.predictionBuffer.push(adScore);
      if (this.predictionBuffer.length > this.bufferSize) {
        this.predictionBuffer.shift();
      }
      
      // Smooth prediction
      const avgScore = this.predictionBuffer.reduce((sum, score) => sum + score, 0) / this.predictionBuffer.length;
      
      return avgScore > this.sensitivity ? 'ad' : 'program';
      
    } catch (error) {
      console.error('Heuristic prediction error:', error);
      return 'program';
    }
  }

  calculateAdScore(features, energyChange, volumeChange, spectralChange) {
    let score = 0;
    
    // High volume changes often indicate ad breaks
    if (volumeChange > 0.2) score += 0.3;
    
    // Energy spikes can indicate commercial content
    if (energyChange > 0.1) score += 0.2;
    
    // Spectral changes indicate different audio content
    if (spectralChange > 0.1) score += 0.2;
    
    // High peak volume (loud commercials)
    if (features.peak_volume > 0.7) score += 0.2;
    
    // Low harmonic ratio (non-speech content)
    if (features.harmonic_ratio < 0.3) score += 0.1;
    
    return Math.min(score, 1.0);
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