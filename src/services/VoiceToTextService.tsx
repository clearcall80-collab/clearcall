interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

class VoiceToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private isSupported: boolean = false;
  private language: string = 'en-US';
  
  // Event callbacks
  private onResultCallback?: (transcript: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: SpeechRecognitionErrorEvent) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;
  private onSpeechStartCallback?: () => void;
  private onSpeechEndCallback?: () => void;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    // Check if Speech Recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();

    if (this.recognition) {
      // Configure speech recognition
      this.recognition.continuous = true; // Keep listening
      this.recognition.interimResults = true; // Get partial results
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 1;

      // Set up event handlers
      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStartCallback?.();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEndCallback?.();
      };

      this.recognition.onspeechstart = () => {
        this.onSpeechStartCallback?.();
      };

      this.recognition.onspeechend = () => {
        this.onSpeechEndCallback?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            this.onResultCallback?.(transcript, true);
          } else {
            interimTranscript += transcript;
            this.onResultCallback?.(transcript, false);
          }
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        this.onErrorCallback?.(event);

        // Handle specific errors
        switch (event.error) {
          case 'network':
            break;
          case 'not-allowed':
            break;
          case 'service-not-allowed':
            break;
          case 'bad-grammar':
            break;
          case 'language-not-supported':
            break;
          case 'no-speech':
            break;
          case 'audio-capture':
            break;
          default:
        }
      };

      this.recognition.onnomatch = () => {
      };
    }
  }

  // Start voice recognition
  startListening(): boolean {
    if (!this.isSupported) {
      return false;
    }

    if (!this.recognition) {
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Stop voice recognition
  stopListening() {
    if (!this.recognition || !this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
    } catch (error) {
    }
  }

  // Abort voice recognition immediately
  abortListening() {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.abort();
      this.isListening = false;
    } catch (error) {
    }
  }

  // Set language
  setLanguage(language: string) {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // Set continuous mode
  setContinuous(continuous: boolean) {
    if (this.recognition) {
      this.recognition.continuous = continuous;
    }
  }

  // Set interim results
  setInterimResults(interimResults: boolean) {
    if (this.recognition) {
      this.recognition.interimResults = interimResults;
    }
  }

  // Get supported languages (common ones)
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish (Spain)' },
      { code: 'es-MX', name: 'Spanish (Mexico)' },
      { code: 'fr-FR', name: 'French (France)' },
      { code: 'de-DE', name: 'German (Germany)' },
      { code: 'it-IT', name: 'Italian (Italy)' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ru-RU', name: 'Russian (Russia)' },
      { code: 'ja-JP', name: 'Japanese (Japan)' },
      { code: 'ko-KR', name: 'Korean (South Korea)' },
      { code: 'zh-CN', name: 'Chinese (Mandarin, China)' },
      { code: 'hi-IN', name: 'Hindi (India)' },
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
      { code: 'te-IN', name: 'Telugu (India)' }
    ];
  }

  // Event handlers
  onResult(callback: (transcript: string, isFinal: boolean) => void) {
    this.onResultCallback = callback;
  }

  onError(callback: (error: SpeechRecognitionErrorEvent) => void) {
    this.onErrorCallback = callback;
  }

  onStart(callback: () => void) {
    this.onStartCallback = callback;
  }

  onEnd(callback: () => void) {
    this.onEndCallback = callback;
  }

  onSpeechStart(callback: () => void) {
    this.onSpeechStartCallback = callback;
  }

  onSpeechEnd(callback: () => void) {
    this.onSpeechEndCallback = callback;
  }

  // Getters
  get supported(): boolean {
    return this.isSupported;
  }

  get listening(): boolean {
    return this.isListening;
  }

  get currentLanguage(): string {
    return this.language;
  }

  // Test microphone access
  async testMicrophoneAccess(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      return true;
    } catch (error) {
      console.error('❌ Microphone access test failed:', error);
      return false;
    }
  }

  // Static method to check browser support
  static isSupported(): boolean {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }

  // Cleanup
  cleanup() {
    this.stopListening();
    this.recognition = null;
    this.onResultCallback = undefined;
    this.onErrorCallback = undefined;
    this.onStartCallback = undefined;
    this.onEndCallback = undefined;
    this.onSpeechStartCallback = undefined;
    this.onSpeechEndCallback = undefined;
  }
}

export const voiceToTextService = new VoiceToTextService();
export { VoiceToTextService };