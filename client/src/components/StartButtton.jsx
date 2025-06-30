import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

const StartButton = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [savedTranscripts, setSavedTranscripts] = useState([]);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript + interimTranscript);

      // Reset silence timer when speech is detected
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Set a new silence timer (3 seconds of silence will stop recording)
      silenceTimerRef.current = setTimeout(() => {
        stopRecording();
      }, 3000);
    };

    recognitionRef.current.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');
      
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // You can save this blob or process it further
        console.log('Audio recorded:', audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

    } catch (err) {
      setError(`Error accessing microphone: ${err.message}`);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    // Stop speech recognition
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    // Stop audio recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Save transcript if there's content
    if (transcript.trim()) {
      const newTranscript = {
        id: Date.now(),
        content: transcript.trim(),
        timestamp: new Date().toLocaleString()
      };
      setSavedTranscripts(prev => [...prev, newTranscript]);
    }
  };

  const clearTranscripts = () => {
    setSavedTranscripts([]);
    setTranscript('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Voice Recorder & Transcriber</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="text-center mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!!error}
          className={`
            inline-flex items-center px-6 py-3 text-lg font-medium rounded-full
            transition-all duration-200 transform hover:scale-105
            ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${error ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isRecording ? (
            <>
              <Square className="mr-2" size={20} />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2" size={20} />
              Start Recording
            </>
          )}
        </button>
      </div>

      {isRecording && (
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">
              {isListening ? 'Listening... (Will stop after 3 seconds of silence)' : 'Preparing to listen...'}
            </span>
          </div>
        </div>
      )}

      {/* Current transcript */}
      {transcript && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Current Transcript:</h3>
          <div className="bg-gray-50 p-4 rounded-lg border min-h-20">
            <p className="text-gray-800">{transcript}</p>
          </div>
        </div>
      )}

      {/* Saved transcripts */}
      {savedTranscripts.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Saved Transcripts ({savedTranscripts.length}):</h3>
            <button
              onClick={clearTranscripts}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {savedTranscripts.map((item) => (
              <div key={item.id} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-800 mb-1">{item.content}</p>
                <p className="text-xs text-gray-500">{item.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Start Recording" to begin</li>
          <li>Speak clearly into your microphone</li>
          <li>Recording will automatically stop after 3 seconds of silence</li>
          <li>Or click "Stop Recording" to end manually</li>
          <li>Transcripts are saved in the component state and displayed below</li>
        </ul>
      </div>
    </div>
  );
};

export default StartButton;