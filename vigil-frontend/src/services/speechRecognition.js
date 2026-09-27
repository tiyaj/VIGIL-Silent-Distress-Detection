// src/services/speechRecognition.js
//
// Uses the browser's built-in Web Speech API (Chrome / WebKit) to transcribe
// the local user's microphone stream in real-time and relay recognized text
// over the VigilSocket to the backend.

export function createTranscriptStream({ socket, onTranscript, onError, onStatus }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[VigilTranscript] SpeechRecognition (Web Speech API) not supported in this browser. Please use Google Chrome.');
    onError?.('SpeechRecognition API not supported in this browser. Please use Chrome.');
    return { start: () => {}, stop: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true; // Stream interim words immediately for zero-latency keyword spotting
  recognition.maxAlternatives = 3;   // Check multiple acoustic hypothesis candidates
  recognition.lang = navigator.language || 'en-US';

  let shouldRestart = false;
  let restartTimer = null;
  let lastDispatchedText = '';
  let lastDispatchTime = 0;

  recognition.onstart = () => {
    console.log('[VigilTranscript] Speech recognition session started. Listening on mic...');
    onStatus?.('listening');
  };

  recognition.onresult = (event) => {
    let capturedUtterance = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      for (let j = 0; j < res.length; ++j) {
        const text = res[j].transcript.trim();
        if (text) {
          capturedUtterance += (capturedUtterance ? ' ' : '') + text;
        }
      }
    }

    const textToSend = capturedUtterance.trim();
    const now = Date.now();

    // Debounce to prevent flooding socket on same word while keeping response <100ms
    if (textToSend && (textToSend.toLowerCase() !== lastDispatchedText.toLowerCase() || now - lastDispatchTime > 1200)) {
      lastDispatchedText = textToSend;
      lastDispatchTime = now;
      console.log(`[VigilTranscript] Transcribed: "${textToSend}"`);
      onTranscript?.(textToSend);
      socket.send('transcript', { text: textToSend, timestamp: now });
    }
  };

  recognition.onerror = (event) => {
    // 'no-speech' is expected during pauses
    if (event.error === 'no-speech') return;

    console.warn('[VigilTranscript] Speech recognition error:', event.error);
    if (event.error === 'network') {
      onError?.('Google Speech Service network error. Check internet connection or use manual trigger.');
    } else if (event.error === 'not-allowed') {
      onError?.('Microphone access denied for SpeechRecognition. Allow mic permissions in Chrome.');
    } else {
      onError?.(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    onStatus?.('idle');
    if (shouldRestart) {
      clearTimeout(restartTimer);
      // Brief delay before restart to avoid browser InvalidStateError
      restartTimer = setTimeout(() => {
        if (shouldRestart) {
          try {
            recognition.start();
          } catch (e) {
            console.debug('[VigilTranscript] Restart deferred:', e);
          }
        }
      }, 350);
    }
  };

  return {
    start() {
      shouldRestart = true;
      try {
        recognition.start();
      } catch (e) {
        console.warn('[VigilTranscript] Start error:', e);
      }
    },
    stop() {
      shouldRestart = false;
      clearTimeout(restartTimer);
      try {
        recognition.stop();
      } catch (e) {}
    },
  };
}
