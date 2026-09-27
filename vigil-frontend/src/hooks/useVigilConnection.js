// src/hooks/useVigilConnection.js
//
// Bridges the real backend (webrtc.js + websocket.js) into Tiya's existing
// CallContext. Named useVigilConnection (not useCall) because useCall is
// already taken by CallContext.jsx's own hook - don't rename that one.
//
// Usage in Call.jsx or Landing.jsx, alongside the existing useCall():
//   const { startRealCall, endRealCall } = useVigilConnection();
//   ...
//   onClick={() => startRealCall(selectedParticipant)}

import { useRef, useCallback } from 'react';
import { useCall } from '../context/CallContext';
import { createVigilSocket } from '../services/websocket';
import { createVigilCall } from '../services/webrtc';
import { createTranscriptStream } from '../services/speechRecognition';

export function useVigilConnection() {
  const call = useCall();
  const socketRef = useRef(null);
  const rtcRef = useRef(null);
  const transcriptRef = useRef(null);

  const startRealCall = useCallback(async (destParticipant) => {
    if (destParticipant) call.setParticipant(destParticipant);
    call.setCallState('requesting_permission');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      call.setMicPermission('granted');
      call.setCallState('connecting');
      call.addEvent(`Requesting connection to ${destParticipant?.name || 'participant'}`, 'info');

      const socket = createVigilSocket();
      socketRef.current = socket;
      await socket.connect();

      const rtc = createVigilCall({
        socket,
        localStream: stream,
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            call.setCallState('calibrating');
            call.setCalibrationSecondsRemaining(15);
            call.setCalibrationProgress(0);
            call.addEvent('Call connected. Starting 15s baseline calibration.', 'info');
          } else if (state === 'failed' || state === 'disconnected') {
            call.addEvent('Connection lost.', 'warning');
          }
        },
      });
      rtcRef.current = rtc;

      socket.on('calibration_progress', ({ secondsRemaining, progress }) => {
        call.setCalibrationSecondsRemaining(secondsRemaining);
        call.setCalibrationProgress(progress);
        if (progress >= 100) {
          call.setCallState('monitoring');
          call.addEvent('Baseline calibration complete. Live monitoring active.', 'info');
          transcriptRef.current = createTranscriptStream({ socket });
          transcriptRef.current.start();
        }
      });

      socket.on('risk_update', ({ score, level, signals }) => {
        call.setRiskScore(score);
        call.setRiskLevel(level);
        call.setContributingSignals(signals || []);
      });

      socket.on('codeword_detected', ({ codeword }) => {
        call.addEvent(`Codeword "${codeword}" detected in voice stream.`, 'alert');
      });

      socket.on('alert_status', ({ status, timestamp }) => {
        const normalizedStatus = status === 'cancelled' ? 'cancelled_by_user' : status;
        call.setAlertStatus(normalizedStatus);
        if (timestamp) call.setAlertSentTimestamp(timestamp);
        call.addEvent(`Alert status: ${normalizedStatus}`, normalizedStatus === 'alert_dispatched' ? 'alert' : 'info');
      });

      socket.on('error', ({ message }) => {
        call.addEvent(`Backend error: ${message}`, 'warning');
      });

      await rtc.start();
    } catch (err) {
      console.warn('[useVigilConnection] Live call failed:', err);
      call.setMicPermission('denied');
      call.setCallState('permission_denied');
      call.addEvent('Microphone access denied or connection failed.', 'warning');
    }
  }, [call]);

  const endRealCall = useCallback(() => {
    transcriptRef.current?.stop();
    rtcRef.current?.stop();
    socketRef.current?.disconnect();
    call.setCallState('ended');
    call.addEvent('Call ended.', 'info');
  }, [call]);

  return { startRealCall, endRealCall };
}
