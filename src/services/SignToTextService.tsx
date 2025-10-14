// Note: This is a simplified demonstration of sign-to-text functionality
// In a production environment, you would use MediaPipe Hands or a dedicated ML model
// For now, we'll simulate hand gesture recognition with basic hand tracking

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandGesture {
  name: string;
  confidence: number;
  landmarks: HandLandmark[];
}

interface SignPrediction {
  sign: string;
  confidence: number;
  timestamp: number;
}

class SignToTextService {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isTracking: boolean = false;
  private animationFrame: number | null = null;
  
  // Callback functions
  private onSignDetectedCallback?: (prediction: SignPrediction) => void;
  private onErrorCallback?: (error: any) => void;
  private onStartTrackingCallback?: () => void;
  private onStopTrackingCallback?: () => void;

  // Simple gesture recognition patterns (in a real implementation, this would be ML-based)
  private gesturePatterns = new Map([
    ['hello', { description: 'Open hand wave', confidence: 0.8 }],
    ['thank_you', { description: 'Hand to chin, then forward', confidence: 0.75 }],
    ['yes', { description: 'Fist up and down motion', confidence: 0.85 }],
    ['no', { description: 'Index finger side to side', confidence: 0.80 }],
    ['please', { description: 'Open hand circular motion on chest', confidence: 0.70 }],
    ['sorry', { description: 'Fist circular motion on chest', confidence: 0.75 }],
    ['good', { description: 'Thumbs up', confidence: 0.90 }],
    ['bad', { description: 'Thumbs down', confidence: 0.90 }],
    ['help', { description: 'Hand on opposite forearm', confidence: 0.70 }],
    ['stop', { description: 'Open hand palm out', confidence: 0.85 }],
    ['love', { description: 'Crossed arms over chest', confidence: 0.80 }],
    ['thank_you_very_much', { description: 'Hand to chin, then forward with emphasis', confidence: 0.75 }],
    ['congratulations', { description: 'Clapping hands', confidence: 0.85 }],
    ['welcome', { description: 'Open hands moving outward', confidence: 0.70 }],
    ['i_love_you', { description: 'Thumb, index, and pinky finger extended', confidence: 0.75 }],
    ['good_morning', { description: 'Open hand wave near face', confidence: 0.75 }],
    ['how_are_you', { description: 'Point to self with questioning expression', confidence: 0.75 }],
    ['fine_thank_you', { description: 'Thumbs up with smile', confidence: 0.75 }],
    ['what_time_is_it', { description: 'Point to wrist as if wearing watch', confidence: 0.75 }],
    ['i_dont_understand', { description: 'Shrug shoulders with palms up', confidence: 0.75 }],
    ['can_you_repeat', { description: 'Circular motion with index finger', confidence: 0.75 }],
    ['nice_to_meet_you', { description: 'Handshake gesture', confidence: 0.75 }],
    ['excuse_me', { description: 'Wave hand in front of face', confidence: 0.75 }],
    ['where_is', { description: 'Look around with questioning expression', confidence: 0.75 }],
    ['bathroom', { description: 'Twist invisible doorknob', confidence: 0.75 }],
    ['hungry', { description: 'Rub stomach in circles', confidence: 0.75 }],
    ['thirsty', { description: 'Tilt head back as if drinking', confidence: 0.75 }],
    ['tired', { description: 'Rest head on hands', confidence: 0.75 }],
    ['sleep', { description: 'Rest head on folded hands', confidence: 0.75 }],
    ['eat', { description: 'Bring hand to mouth', confidence: 0.75 }],
    ['drink', { description: 'Tilt imaginary glass to mouth', confidence: 0.75 }],
    ['friend', { description: 'Hook pinkies together', confidence: 0.75 }],
    ['family', { description: 'Group hands together', confidence: 0.75 }],
    ['home', { description: 'Flat hand with thumb touching roof of mouth', confidence: 0.75 }],
    ['school', { description: 'Open and close fist like writing', confidence: 0.75 }],
    ['work', { description: 'Pretend to hammer with fist', confidence: 0.75 }],
    ['money', { description: 'Rub thumb and fingers together', confidence: 0.75 }],
    ['phone', { description: 'Hand shaped like phone to ear', confidence: 0.75 }],
    ['computer', { description: 'Type on imaginary keyboard', confidence: 0.75 }],
    ['car', { description: 'Pretend to steer wheel', confidence: 0.75 }],
    ['bus', { description: 'Two fists moving forward', confidence: 0.75 }],
    ['train', { description: 'Arm moving like train wheels', confidence: 0.75 }],
    ['plane', { description: 'Arm moving like airplane wing', confidence: 0.75 }],
    ['hot', { description: 'Fan face with hand', confidence: 0.75 }],
    ['cold', { description: 'Shiver with arms crossed', confidence: 0.75 }],
    ['rain', { description: 'Fingers wiggling down like rain', confidence: 0.75 }],
    ['sun', { description: 'Circle above head', confidence: 0.75 }],
    ['moon', { description: 'C shape near face', confidence: 0.75 }],
    ['happy', { description: 'Big smile with open arms', confidence: 0.75 }],
    ['sad', { description: 'Frown with drooping shoulders', confidence: 0.75 }],
    ['angry', { description: 'Frown with clenched fists', confidence: 0.75 }],
    ['surprised', { description: 'Wide eyes with hands on cheeks', confidence: 0.75 }],
    ['scared', { description: 'Arms protecting face', confidence: 0.75 }],
    ['pain', { description: 'Wince with hand on affected area', confidence: 0.75 }],
    ['sick', { description: 'Pretend to cough', confidence: 0.75 }],
    ['doctor', { description: 'Red cross with fingers', confidence: 0.75 }],
    ['medicine', { description: 'Pretend to take pill', confidence: 0.75 }],
    ['food', { description: 'Bring hand to mouth', confidence: 0.75 }],
    ['water', { description: 'Wiggle fingers like flowing water', confidence: 0.75 }],
    ['coffee', { description: 'Pretend to sip from cup', confidence: 0.75 }],
    ['tea', { description: 'Pretend to stir cup', confidence: 0.75 }],
    ['bread', { description: 'Pretend to slice bread', confidence: 0.75 }],
    ['meat', { description: 'Pretend to cut meat', confidence: 0.75 }],
    ['vegetables', { description: 'Pretend to chop vegetables', confidence: 0.75 }],
    ['fruit', { description: 'Round shape with hands', confidence: 0.75 }],
    ['milk', { description: 'Pretend to pour milk', confidence: 0.75 }],
    ['juice', { description: 'Pretend to squeeze fruit', confidence: 0.75 }],
    ['breakfast', { description: 'Sunrise gesture', confidence: 0.75 }],
    ['lunch', { description: 'Midday sun gesture', confidence: 0.75 }],
    ['dinner', { description: 'Sunset gesture', confidence: 0.75 }],
    ['red', { description: 'Point to red object', confidence: 0.75 }],
    ['blue', { description: 'Point to blue object', confidence: 0.75 }],
    ['green', { description: 'Point to green object', confidence: 0.75 }],
    ['yellow', { description: 'Point to yellow object', confidence: 0.75 }],
    ['black', { description: 'Point to black object', confidence: 0.75 }],
    ['white', { description: 'Point to white object', confidence: 0.75 }],
    ['big', { description: 'Hands spread wide apart', confidence: 0.75 }],
    ['small', { description: 'Hands close together', confidence: 0.75 }],
    ['fast', { description: 'Quick hand movement', confidence: 0.75 }],
    ['slow', { description: 'Slow hand movement', confidence: 0.75 }],
    ['new', { description: 'Fresh start gesture', confidence: 0.75 }],
    ['old', { description: 'Worn out gesture', confidence: 0.75 }],
    ['clean', { description: 'Wiping motion', confidence: 0.75 }],
    ['dirty', { description: 'Dirty hands gesture', confidence: 0.75 }],
    ['open', { description: 'Opening motion', confidence: 0.75 }],
    ['close', { description: 'Closing motion', confidence: 0.75 }],
    ['up', { description: 'Point up', confidence: 0.75 }],
    ['down', { description: 'Point down', confidence: 0.75 }],
    ['left', { description: 'Point left', confidence: 0.75 }],
    ['right', { description: 'Point right', confidence: 0.75 }],
    ['inside', { description: 'Point inward', confidence: 0.75 }],
    ['outside', { description: 'Point outward', confidence: 0.75 }],
    ['before', { description: 'Point backward', confidence: 0.75 }],
    ['after', { description: 'Point forward', confidence: 0.75 }],
    ['now', { description: 'Point to present', confidence: 0.75 }],
    ['later', { description: 'Point to future', confidence: 0.75 }],
    ['yesterday', { description: 'Point backward over shoulder', confidence: 0.75 }],
    ['tomorrow', { description: 'Point forward over shoulder', confidence: 0.75 }],
    ['today', { description: 'Point to ground', confidence: 0.75 }],
    ['week', { description: 'Seven finger count', confidence: 0.75 }],
    ['month', { description: 'Circular month gesture', confidence: 0.75 }],
    ['year', { description: 'Full circle gesture', confidence: 0.75 }],
    ['one', { description: 'One finger extended', confidence: 0.75 }],
    ['two', { description: 'Two fingers extended', confidence: 0.75 }],
    ['three', { description: 'Three fingers extended', confidence: 0.75 }],
    ['four', { description: 'Four fingers extended', confidence: 0.75 }],
    ['five', { description: 'Five fingers extended', confidence: 0.75 }],
    ['ten', { description: 'Both hands showing five', confidence: 0.75 }],
    ['twenty', { description: 'Two hands showing ten', confidence: 0.75 }],
    ['hundred', { description: 'C shape for hundred', confidence: 0.75 }],
    ['thousand', { description: 'Complex thousand gesture', confidence: 0.75 }],
    ['first', { description: 'Point to first position', confidence: 0.75 }],
    ['second', { description: 'Point to second position', confidence: 0.75 }],
    ['third', { description: 'Point to third position', confidence: 0.75 }],
    ['last', { description: 'Point to end', confidence: 0.75 }],
    ['more', { description: 'Hands coming together', confidence: 0.75 }],
    ['less', { description: 'Hands moving apart', confidence: 0.75 }],
    ['enough', { description: 'Flat hand cutting motion', confidence: 0.75 }],
    ['all', { description: 'Circle with both hands', confidence: 0.75 }],
    ['some', { description: 'Partial circle gesture', confidence: 0.75 }],
    ['many', { description: 'Multiple finger wiggling', confidence: 0.75 }],
    ['few', { description: 'Few fingers extended', confidence: 0.75 }],
    ['question', { description: 'Raised eyebrows with questioning look', confidence: 0.75 }],
    ['answer', { description: 'Pointing response gesture', confidence: 0.75 }],
    ['yes_please', { description: 'Nod with thumbs up', confidence: 0.75 }],
    ['no_thanks', { description: 'Shake head with thumbs down', confidence: 0.75 }],
    ['maybe', { description: 'Shrug with tilted head', confidence: 0.75 }],
    ['sure', { description: 'Confident thumbs up', confidence: 0.75 }],
    ['okay', { description: 'OK sign with fingers', confidence: 0.75 }],
    ['perfect', { description: 'Perfect circle with fingers', confidence: 0.75 }],
    ['great', { description: 'Big thumbs up with enthusiasm', confidence: 0.75 }],
    ['wonderful', { description: 'Open arms celebrating', confidence: 0.75 }],
    ['amazing', { description: 'Wide eyes with amazement', confidence: 0.75 }],
    ['terrible', { description: 'Frown with disappointment', confidence: 0.75 }],
    ['awful', { description: 'Shake head with disgust', confidence: 0.75 }],
    ['beautiful', { description: 'Hand on heart', confidence: 0.75 }],
    ['ugly', { description: 'Wince with disapproval', confidence: 0.75 }],
    ['easy', { description: 'Smooth flowing motion', confidence: 0.75 }],
    ['difficult', { description: 'Struggling motion', confidence: 0.75 }],
    ['important', { description: 'Emphasize with strong gesture', confidence: 0.75 }],
    ['urgent', { description: 'Quick urgent motion', confidence: 0.75 }],
    ['emergency', { description: 'Panic gesture', confidence: 0.75 }],
    ['danger', { description: 'Warning hand motion', confidence: 0.75 }],
    ['safe', { description: 'Safe gesture with hands', confidence: 0.75 }],
    ['careful', { description: 'Careful walking motion', confidence: 0.75 }]
  ]);

  private recentPredictions: SignPrediction[] = [];
  private lastPrediction: number = 0;

  constructor() {
    this.setupCanvas();
  }

  private setupCanvas() {
    // Create canvas for hand tracking visualization
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.context = this.canvas.getContext('2d');
  }

  // Initialize with existing video stream (from WebRTC)
  async initializeWithStream(videoStream: MediaStream): Promise<boolean> {
    try {
      this.stream = videoStream;

      // Create video element
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true; // Mute to avoid feedback

      await new Promise((resolve) => {
        this.video!.onloadedmetadata = () => resolve(true);
      });

      return true;
    } catch (error: any) {
      console.error('❌ Error initializing with stream:', error);
      this.onErrorCallback?.({
        type: 'stream',
        message: 'Failed to initialize sign detection with video stream',
        originalError: error
      });
      return false;
    }
  }

  // Initialize video stream for hand tracking (fallback method)
  async initializeCamera(): Promise<boolean> {
    try {
      // Check camera permission first
      const hasPermission = await this.checkCameraPermission();
      if (!hasPermission) {
        this.onErrorCallback?.({ type: 'permission', message: 'Camera permission required for sign detection' });
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });

      // Create video element
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.autoplay = true;
      this.video.playsInline = true;

      await new Promise((resolve) => {
        this.video!.onloadedmetadata = () => resolve(true);
      });

      return true;
    } catch (error: any) {
      console.error('❌ Error initializing camera:', error);

      if (error.name === 'NotAllowedError') {
        this.onErrorCallback?.({
          type: 'permission',
          message: 'Camera access denied. Please grant camera permission to use sign-to-text.',
          originalError: error
        });
      } else if (error.name === 'NotFoundError') {
        this.onErrorCallback?.({
          type: 'device',
          message: 'No camera found on this device.',
          originalError: error
        });
      } else {
        this.onErrorCallback?.(error);
      }
      return false;
    }
  }

  // Check camera permission
  async checkCameraPermission(): Promise<boolean> {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state === 'granted';
      } else {
        // Fallback - assume we can request permission
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Could not check camera permission:', error);
      return true; // Assume we can try
    }
  }

  // Request camera permission explicitly
  async requestCameraPermission(): Promise<{ success: boolean; error?: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      // Stop the stream immediately - we just wanted to check permission
      stream.getTracks().forEach(track => track.stop());

      return { success: true };
    } catch (error: any) {
      console.error('❌ Camera permission request failed:', error);
      
      let errorMessage = 'Failed to access camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // Start sign language detection with optional video stream
  async startTracking(videoStream?: MediaStream): Promise<boolean> {
    if (this.isTracking) {
      return true;
    }

    if (!this.video || !this.stream) {
      let initialized = false;

      if (videoStream) {
        // Use provided stream (from WebRTC)
        initialized = await this.initializeWithStream(videoStream);
      } else {
        // Fallback to camera
        initialized = await this.initializeCamera();
      }

      if (!initialized) {
        return false;
      }
    }

    this.isTracking = true;
    this.onStartTrackingCallback?.();
    this.startDetectionLoop();

    console.log('👋 Started sign language tracking');
    return true;
  }

  // Stop sign language detection
  stopTracking() {
    if (!this.isTracking) {
      return;
    }

    this.isTracking = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }

    this.onStopTrackingCallback?.();
    console.log('🛑 Stopped sign language tracking');
  }

  // Main detection loop (simplified - in reality would use MediaPipe or TensorFlow.js)
  private startDetectionLoop() {
    const detect = () => {
      if (!this.isTracking || !this.video || !this.context) {
        return;
      }

      // Simulate gesture detection (in reality, this would analyze video frames)
      this.simulateGestureDetection();

      this.animationFrame = requestAnimationFrame(detect);
    };

    detect();
  }

  // Simulate gesture detection (replace with actual ML model)
  private simulateGestureDetection() {
    const now = Date.now();
    
    // Only predict every 2 seconds to avoid spam
    if (now - this.lastPrediction < 2000) {
      return;
    }

    // Simulate random gesture detection
    const gestureNames = Array.from(this.gesturePatterns.keys());
    const randomGesture = gestureNames[Math.floor(Math.random() * gestureNames.length)];
    const pattern = this.gesturePatterns.get(randomGesture);

    if (pattern && Math.random() > 0.7) { // 30% chance of detection
      const prediction: SignPrediction = {
        sign: this.formatSignForDisplay(randomGesture),
        confidence: pattern.confidence,
        timestamp: now
      };

      // Add to recent predictions
      this.recentPredictions.push(prediction);
      
      // Keep only last 10 predictions
      if (this.recentPredictions.length > 10) {
        this.recentPredictions.shift();
      }

      this.lastPrediction = now;
      this.onSignDetectedCallback?.(prediction);

      console.log('👋 Detected sign:', prediction.sign, 'confidence:', prediction.confidence);
    }
  }

  // Format sign name for display
  private formatSignForDisplay(signName: string): string {
    return signName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get recent predictions
  getRecentPredictions(limit: number = 5): SignPrediction[] {
    return this.recentPredictions.slice(-limit);
  }

  // Get supported signs
  getSupportedSigns(): string[] {
    return Array.from(this.gesturePatterns.keys()).map(sign => this.formatSignForDisplay(sign));
  }

  // Set detection sensitivity (placeholder for ML model configuration)
  setDetectionSensitivity(sensitivity: number) {
    // In a real implementation, this would adjust ML model thresholds
    console.log('🎛️ Detection sensitivity set to:', sensitivity);
  }

  // Get tracking statistics
  getTrackingStats() {
    return {
      isTracking: this.isTracking,
      totalPredictions: this.recentPredictions.length,
      lastPrediction: this.lastPrediction,
      supportedSigns: this.gesturePatterns.size
    };
  }

  // Enable/disable sign vocabulary (for different sign languages)
  setSignLanguage(language: 'ASL' | 'BSL' | 'ISL') {
    console.log('👋 Sign language set to:', language);
    
    // In a real implementation, you would load different gesture patterns
    // For now, we'll just log the change
    switch (language) {
      case 'ASL':
        console.log('🇺🇸 Using American Sign Language');
        break;
      case 'BSL':
        console.log('🇬🇧 Using British Sign Language');
        break;
      case 'ISL':
        console.log('🇮🇳 Using Indian Sign Language');
        break;
    }
  }

  // Mock training mode (in reality, this would retrain the ML model)
  enterTrainingMode(signName: string) {
    console.log('🎓 Entering training mode for sign:', signName);
    // In a real implementation, this would collect training data
    return {
      isTraining: true,
      targetSign: signName,
      samplesNeeded: 10,
      currentSamples: 0
    };
  }

  // Event handlers
  onSignDetected(callback: (prediction: SignPrediction) => void) {
    this.onSignDetectedCallback = callback;
  }

  onError(callback: (error: any) => void) {
    this.onErrorCallback = callback;
  }

  onStartTracking(callback: () => void) {
    this.onStartTrackingCallback = callback;
  }

  onStopTracking(callback: () => void) {
    this.onStopTrackingCallback = callback;
  }

  // Getters
  get tracking(): boolean {
    return this.isTracking;
  }

  get canvasElement(): HTMLCanvasElement | null {
    return this.canvas;
  }

  get videoElement(): HTMLVideoElement | null {
    return this.video;
  }

  // Test camera access
  async testCameraAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('❌ Camera access test failed:', error);
      return false;
    }
  }

  // Static method to check if MediaDevices API is supported
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  // Cleanup
  cleanup() {
    this.stopTracking();
    this.onSignDetectedCallback = undefined;
    this.onErrorCallback = undefined;
    this.onStartTrackingCallback = undefined;
    this.onStopTrackingCallback = undefined;
    this.recentPredictions = [];
  }
}

export const signToTextService = new SignToTextService();
export { SignToTextService };
export type { HandLandmark, HandGesture, SignPrediction };