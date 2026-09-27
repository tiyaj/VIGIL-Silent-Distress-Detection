// src/services/websocket.js
//
// Single WebSocket connection to the backend (Sanskar's FastAPI server).
// Handles both WebRTC signaling (offer/answer/ice) AND the live telemetry
// (calibration progress, risk score, alerts) coming from the ML side.
//
// Message shape assumed (CONFIRM WITH SANSKAR AT THE MEET, then just edit
// the "type" strings below if his names differ):
//
// Client -> Server: { type: "offer" | "answer" | "ice_candidate" | "audio_chunk", payload }
// Server -> Client: { type: "offer" | "answer" | "ice_candidate"
//                            | "calibration_progress" | "risk_update"
//                            | "codeword_detected" | "alert_status" | "error", payload }

const WS_URL = import.meta.env.VITE_WS_ANALYSIS_URL || 'ws://localhost:8000/ws/telemetry';

export function createVigilSocket(callId) {
  let ws = null;
  const listeners = {};

  function connect() {
    return new Promise((resolve, reject) => {
      const targetUrl = callId ? `${WS_URL}?call_id=${encodeURIComponent(callId)}` : WS_URL;
      ws = new WebSocket(targetUrl);
      ws.onopen = () => resolve();
      ws.onerror = (err) => reject(err);
      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          (listeners[type] || []).forEach((cb) => cb(payload));
        } catch (err) {
          console.warn('[VigilSocket] Malformed message:', event.data);
        }
      };
      ws.onclose = () => {
        (listeners['disconnected'] || []).forEach((cb) => cb());
      };
    });
  }

  function on(type, callback) {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(callback);
  }

  function off(type, callback) {
    if (!listeners[type]) return;
    listeners[type] = listeners[type].filter((cb) => cb !== callback);
  }

  function send(type, payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn(`[VigilSocket] Cannot send "${type}" - socket not open`);
    }
  }

  function disconnect() {
    ws?.close();
    ws = null;
  }

  return { connect, on, off, send, disconnect };
}
