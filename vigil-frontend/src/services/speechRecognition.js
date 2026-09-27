// src/services/speechRecognition.js
//
// Uses the browser's built-in Web Speech API (Chrome only) to transcribe
// the local user's mic and relay recognized text to the backend over the
// existing VigilSocket. Matching against configured codewords/cancel
// phrases happens server-side — this file only captures and sends.

export function createTranscriptStream({ socket }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[VigilTranscript] SpeechRecognition not supported in this browser.');
    return { start: () => {}, stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-IN';

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    if (result.isFinal) {
      const text = result[0].transcript.trim();
      if (text) socket.send('transcript', { text, timestamp: Date.now() });
    }
  };

  recognition.onerror = (err) => console.warn('[VigilTranscript] Recognition error:', err.error);

  recognition.onend = () => {
    if (recognition._shouldRestart) {
      try { recognition.start(); } catch (e) {}
    }
  };

  return {
    start() {
      recognition._shouldRestart = true;
      try { recognition.start(); } catch (e) {}
    },
    stop() {
      recognition._shouldRestart = false;
      recognition.stop();
    },
  };
}
