// src/hooks/useVigilConnection.js
//
// Bridges the real backend (webrtc.js + websocket.js) into CallContext.
// Provides startRealCall, endRealCall, and triggerLiveCancellation.

import { useRef, useCallback } from 'react';
import { useCall } from '../context/CallContext';
import { createVigilSocket } from '../services/websocket';
import { createVigilCall } from '../services/webrtc';
import { createTranscriptStream } from '../services/speechRecognition';

// Shared module-level instances so call lifecycle can be controlled across pages
let activeSocket = null;
let activeRtc = null;
let activeTranscript = null;

export function useVigilConnection() {
  const call = useCall();
  const socketRef = useRef(null);
  const rtcRef = useRef(null);
  const transcriptRef = useRef(null);

  const startRealCall = useCallback(async (destParticipant, callId = null) => {
    if (destParticipant) call.setParticipant(destParticipant);
    call.setCallState('requesting_permission');
    call.setCallDuration?.(0);
    call.setEventTimeline?.([]);
    call.setContributingSignals?.([]);
    call.setAlertStatus?.('idle');
    call.setAlertSentTimestamp?.(null);
    call.setRiskScore?.(null);
    call.setHasValidRiskData?.(false);

    const effectiveCallId = callId || destParticipant?.id || `call_${Date.now()}`;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      call.setAudioStream?.(stream);
      call.setMicPermission('granted');
      call.setCallState('connecting');
      call.addEvent(`Requesting connection to ${destParticipant?.name || 'participant'}`, 'info');

      const socket = createVigilSocket(effectiveCallId);
      socketRef.current = socket;
      activeSocket = socket;
      await socket.connect();

      // Immediately enter calibrating upon connecting to the monitoring socket
      call.setCallState?.('calibrating');
      call.setCalibrationSecondsRemaining?.(15);
      call.setCalibrationProgress?.(0);
      call.addEvent?.('Connected to monitoring server. Commencing 15s baseline calibration.', 'info');

      // Start real-time speech recognition immediately so codewords trigger instantly from second 0
      let hasLoggedListening = false;
      const transcript = createTranscriptStream({
        socket,
        onStatus: (status) => {
          if (status === 'listening' && !hasLoggedListening) {
            hasLoggedListening = true;
            call.addEvent?.('Voice speech recognition active. Say "Silver Willow" to trigger.', 'info');
          }
        },
        onTranscript: (text) => {
          call.addEvent?.(`Speech detected: "${text}"`, 'info');
        },
        onError: (errMessage) => {
          call.addEvent?.(`Speech notice: ${errMessage}`, 'warning');
        },
      });
      transcriptRef.current = transcript;
      activeTranscript = transcript;
      transcript.start();

      const rtc = createVigilCall({
        socket,
        localStream: stream,
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            call.addEvent?.('Peer WebRTC stream connected.', 'info');
          } else if (state === 'failed' || state === 'disconnected') {
            call.addEvent?.('Peer WebRTC disconnected.', 'warning');
          }
        },
      });
      rtcRef.current = rtc;
      activeRtc = rtc;

      socket.on('calibration_progress', ({ secondsRemaining, progress }) => {
        call.setCallState?.('calibrating');
        call.setCalibrationSecondsRemaining?.(secondsRemaining);
        call.setCalibrationProgress?.(progress);
        if (progress >= 100) {
          call.setCallState?.('monitoring');
          call.addEvent?.('Baseline calibration complete. Live monitoring active.', 'info');
        }
      });

      socket.on('risk_update', ({ score, level, signals, contributing_signals }) => {
        call.setRiskScore?.(score);
        call.setRiskLevel?.(level);
        const attribution = contributing_signals || (Array.isArray(signals) ? signals : []);
        call.setContributingSignals?.(attribution);
        call.setHasValidRiskData?.(true);
        call.setLastRiskUpdate?.(new Date().toLocaleTimeString());
      });

      socket.on('codeword_detected', ({ codeword }) => {
        call.addEvent?.(`Codeword "${codeword}" detected in voice stream.`, 'alert');
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
    activeTranscript?.stop();
    activeTranscript = null;

    rtcRef.current?.stop();
    activeRtc?.stop();
    activeRtc = null;

    socketRef.current?.disconnect();
    activeSocket?.disconnect();
    activeSocket = null;

    call.setAudioStream?.(null);
    call.setCallState('ended');
    call.addEvent('Call ended.', 'info');
  }, [call]);

  const triggerLiveCancellation = useCallback((phrase) => {
    const cancelPhrase = phrase || call.codewords?.cancellationPhrase || 'Status Clear Blue';
    if (activeSocket) {
      activeSocket.send('transcript', { text: cancelPhrase, timestamp: Date.now() });
    }
  }, [call.codewords]);

  const triggerLiveDistress = useCallback((codeword) => {
    const distressWord = codeword || call.codewords?.distressCodeword || 'Silver Willow';
    if (activeSocket) {
      activeSocket.send('transcript', { text: distressWord, timestamp: Date.now() });
    }
  }, [call.codewords]);

  return {
    startRealCall,
    endRealCall,
    triggerLiveCancellation,
    triggerLiveDistress,
  };
}
