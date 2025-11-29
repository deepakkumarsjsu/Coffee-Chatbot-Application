import { useState, useEffect, useRef } from 'react';

interface UseVoiceRecognitionProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecognition = ({ onTranscript, onError }: UseVoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const isManualStopRef = useRef<boolean>(false);
  const allResultsRef = useRef<any[]>([]);
  const isStoppingRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep recording until manually stopped
      recognition.interimResults = true; // Get real-time results
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        transcriptRef.current = '';
        allResultsRef.current = [];
        isManualStopRef.current = false;
        isStoppingRef.current = false;
      };

      recognition.onresult = (event: any) => {
        // Store all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          allResultsRef.current[event.resultIndex + (i - event.resultIndex)] = event.results[i];
        }

        // Build transcript from all results
        let fullTranscript = '';
        for (let i = 0; i < allResultsRef.current.length; i++) {
          if (allResultsRef.current[i]) {
            fullTranscript += allResultsRef.current[i][0].transcript + ' ';
          }
        }
        transcriptRef.current = fullTranscript.trim();
      };

      recognition.onerror = (event: any) => {
        // Don't stop on 'no-speech' error, let user control when to stop
        if (event.error === 'no-speech') {
          return;
        }
        // Don't process on abort (manual stop)
        if (event.error === 'aborted') {
          return;
        }
        setIsListening(false);
        if (onError) {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        isStoppingRef.current = false;
        
        // Reset for next recording
        transcriptRef.current = '';
        allResultsRef.current = [];
        isManualStopRef.current = false;
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      if (onError) {
        onError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onError]);

  const createRecognitionInstance = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      transcriptRef.current = '';
      allResultsRef.current = [];
      isManualStopRef.current = false;
      isStoppingRef.current = false;
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        allResultsRef.current[event.resultIndex + (i - event.resultIndex)] = event.results[i];
      }
      let fullTranscript = '';
      for (let i = 0; i < allResultsRef.current.length; i++) {
        if (allResultsRef.current[i]) {
          fullTranscript += allResultsRef.current[i][0].transcript + ' ';
        }
      }
      transcriptRef.current = fullTranscript.trim();
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      setIsListening(false);
      if (onError && event.error !== 'aborted') {
        onError(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isStoppingRef.current = false;
      transcriptRef.current = '';
      allResultsRef.current = [];
      isManualStopRef.current = false;
    };

    return recognition;
  };

  const startListening = () => {
    // If already listening, don't start again
    if (isListening) {
      return;
    }
    
    // Stop any existing recognition first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Wait a bit for any existing recognition to fully stop
    setTimeout(() => {
      // Always create a fresh instance to avoid state issues
      const newRecognition = createRecognitionInstance();
      if (newRecognition) {
        recognitionRef.current = newRecognition;
        try {
          recognitionRef.current.start();
        } catch (error: any) {
          setIsListening(false);
        }
      }
    }, 200);
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    // Immediately update state to show button is no longer recording
    setIsListening(false);
    isStoppingRef.current = true;
    isManualStopRef.current = true;
    
    // Build final transcript from all accumulated results
    let finalTranscript = '';
    for (let i = 0; i < allResultsRef.current.length; i++) {
      if (allResultsRef.current[i]) {
        finalTranscript += allResultsRef.current[i][0].transcript + ' ';
      }
    }
    
    // Use the accumulated transcript or the current one
    if (finalTranscript.trim()) {
      transcriptRef.current = finalTranscript.trim();
    }
    
    // Process the transcript
    if (transcriptRef.current.trim()) {
      onTranscript(transcriptRef.current.trim());
    }
    
    // Stop recognition
    try {
      recognitionRef.current.stop();
    } catch (error) {
      isStoppingRef.current = false;
    }
  };

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};

