// src/services/speechRecognition.js
//
// Uses the browser's built-in Web Speech API (Chrome / WebKit) to transcribe
// the local user's mic and relay recognized text to the backend over the
// existing VigilSocket. Matching against configured codewords/cancel
// phrases happens server-side.

export function createTranscriptStream({ socket }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[VigilTranscript] SpeechRecognition (Web Speech API) not supported in this browser. Please use Chrome.');
    return { start: () => {}, stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true; // Emit interim speech for immediate keyword detection without waiting for silence
  recognition.lang = navigator.language || 'en-US';

  // Track recently sent transcripts to avoid duplicate WebSocket spam on interim slices
  let lastSentText = '';
  let lastSentTime = 0;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const text = event.results[i][0].transcript.trim();
      const now = Date.now();
      // Send if text is non-empty and has changed or 1.5s has elapsed
      if (text && (text.toLowerCase() !== lastSentText.toLowerCase() || now - lastSentTime > 1500)) {
        lastSentText = text;
        lastSentTime = now;
        console.log(`[VigilTranscript] Speech recognized: "${text}" (isFinal: ${event.results[i].isFinal})`);
        socket.send('transcript', { text, timestamp: now });
      }
    }
  };

  recognition.onerror = (err) => {
    if (err.error !== 'no-speech') {
      console.warn('[VigilTranscript] SpeechRecognition error:', err.error);
    }
  };

  recognition.onend = () => {
    if (recognition._shouldRestart) {
      try {
        recognition.start();
      } catch (e) {
        // Recognition might already be starting
      }
    }
  };

  return {
    start() {
      recognition._shouldRestart = true;
      try {
        recognition.start();
        console.log('[VigilTranscript] Live speech recognition listening for codewords...');
      } catch (e) {
        console.warn('[VigilTranscript] Could not start speech recognition:', e);
      }
    },
    stop() {
      recognition._shouldRestart = false;
      try {
        recognition.stop();
      } catch (e) {}
    },
  };
}
