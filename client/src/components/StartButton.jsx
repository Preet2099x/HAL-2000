import React, { useState } from 'react';

const StartButton = () => {
  const [transcript, setTranscript] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return <p>Your browser does not support speech recognition.</p>;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  const handleStart = () => {
    setIsListening(true);
    setAiReply('');
    recognition.start();

    recognition.onresult = async (event) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setIsListening(false);
      setIsLoading(true);

      // Generate or reuse a sessionId stored in localStorage
      const sessionId = localStorage.getItem('sessionId') || (() => {
        const newId = crypto.randomUUID();
        localStorage.setItem('sessionId', newId);
        return newId;
      })();


      try {
        const response = await fetch('http://localhost:5678/webhook-test/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: speechToText,
            sessionId: sessionId, // Pass sessionId to backend
          }),
        });

        const data = await response.json();
        setAiReply(data.reply); // assumes n8n returns { "reply": "..." }
      } catch (error) {
        console.error('Error sending to AI:', error);
        setAiReply('Error talking to AI.');
      } finally {
        setIsLoading(false);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div>
      <button onClick={handleStart} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start'}
      </button>

      {transcript && <p><strong>You said:</strong> {transcript}</p>}
      {isLoading && <p>Thinking...</p>}
      {aiReply && <p><strong>AI:</strong> {aiReply}</p>}
    </div>
  );
};

export default StartButton;
