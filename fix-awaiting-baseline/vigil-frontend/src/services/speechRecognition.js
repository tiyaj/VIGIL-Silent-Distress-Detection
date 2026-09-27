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
  // continuous: true prevents the 8-second silence termination loop in Chrome
  recognition.continuous = true;
  recognition.interimResults = true; // Stream interim words immediately for zero-latency keyword spotting
  recognition.maxAlternatives = 3;   // Check multiple acoustic hypothesis candidates
  // Use browser locale with fallback to en-US / en-IN
  recognition.lang = navigator.language || 'en-US';

  let shouldRestart = false;
  let restartTimer = null;
  let lastDispatchedText = '';
  let lastDispatchTime = 0;
  let consecutiveNoSpeechCount = 0;

  recognition.onstart = () => {
    console.log(`[VigilTranscript] Speech recognition session active. Listening on mic (lang: ${recognition.lang})...`);
    onStatus?.('listening');
  };

  recognition.onspeechstart = () => {
    console.log('[VigilTranscript] Mic voice activity detected! Transcribing speech...');
    onStatus?.('speaking');
  };

  recognition.onspeechend = () => {
    console.log('[VigilTranscript] Speech pause detected.');
    onStatus?.('listening');
  };

  recognition.onresult = (event) => {
    consecutiveNoSpeechCount = 0;
    let bestText = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      if (!res || res.length === 0) continue;

      // Primary hypothesis
      const primary = res[0].transcript.trim();

      // Check if any alternative contains codeword keywords
      let matchedText = primary;
      for (let j = 0; j < res.length; ++j) {
        const altText = res[j].transcript.trim().toLowerCase();
        if (altText.includes('silver') || altText.includes('willow') || altText.includes('clear blue')) {
          matchedText = res[j].transcript.trim();
          break;
        }
      }

      if (matchedText) {
        bestText = matchedText;
      }
    }

    const textToSend = bestText.trim();
    const now = Date.now();

    if (textToSend && (textToSend.toLowerCase() !== lastDispatchedText.toLowerCase() || now - lastDispatchTime > 1000)) {
      lastDispatchedText = textToSend;
      lastDispatchTime = now;
      console.log(`[VigilTranscript] Transcribed: "${textToSend}"`);
      onTranscript?.(textToSend);
      socket.send('transcript', { text: textToSend, timestamp: now });
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') {
      consecutiveNoSpeechCount++;
      console.debug(`[VigilTranscript] No speech detected (streak: ${consecutiveNoSpeechCount}).`);
      if (consecutiveNoSpeechCount === 3) {
        onError?.('Chrome Speech Service is receiving silence from mic. Verify macOS input volume or click "Say Chai".');
      }
      return;
    }

    console.warn('[VigilTranscript] Speech recognition error:', event.error);
    if (event.error === 'network') {
      onError?.('Google Speech Service network error. Check internet connection or click "Say Chai".');
    } else if (event.error === 'not-allowed') {
      onError?.('Microphone access denied for SpeechRecognition. Allow mic permissions in Chrome.');
    } else {
      onError?.(`Speech recognition notice: ${event.error}`);
    }
  };

  recognition.onend = () => {
    onStatus?.('idle');
    if (shouldRestart) {
      clearTimeout(restartTimer);
      // Restart immediately to maintain continuous seamless listening loop
      restartTimer = setTimeout(() => {
        if (shouldRestart) {
          try {
            recognition.start();
          } catch (e) {
            console.debug('[VigilTranscript] Restart deferred:', e);
          }
        }
      }, 100);
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
    setLanguage(newLang) {
      recognition.lang = newLang;
      console.log(`[VigilTranscript] Language switched to: ${newLang}`);
    },
  };
}