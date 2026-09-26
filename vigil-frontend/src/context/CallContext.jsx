import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  // Navigation / Mode
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Settings: Contact & Codewords
  const [trustedContact, setTrustedContact] = useState({
    name: 'Sarah Connor',
    phone: '+1 (555) 382-9011',
    relationship: 'Family Member',
    autoSms: true,
    pushNotification: true,
  });

  const [codewords, setCodewords] = useState({
    distressCodeword: 'Silver Willow',
    cancellationPhrase: 'Status Clear Blue',
    allowCancellation: true,
  });

  // Call Lifecycle: 'idle' | 'dialing' | 'permission_prompt' | 'permission_denied' | 'connecting' | 'calibrating' | 'monitoring' | 'ended'
  const [callState, setCallState] = useState('idle');
  const [participant, setParticipant] = useState({
    name: 'Family Contact - Jane',
    number: '+1 (555) 728-1920',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt' | 'granted' | 'denied'

  // Calibration state (First 15 seconds)
  const CALIBRATION_DURATION = 15; // 15s requirement
  const [calibrationSecondsRemaining, setCalibrationSecondsRemaining] = useState(15);
  const [calibrationProgress, setCalibrationProgress] = useState(0); // 0 to 100%

  // Risk & Telemetry
  // Risk Score: 0 - 100
  // Levels: 'NORMAL' (0-39), 'ELEVATED' (40-69), 'CRITICAL DISTRESS' (70-100)
  const [riskScore, setRiskScore] = useState(null); // null until calibrated & valid data
  const [riskLevel, setRiskLevel] = useState('NORMAL');
  const [hasValidRiskData, setHasValidRiskData] = useState(false);
  const [lastRiskUpdate, setLastRiskUpdate] = useState(null);

  // Signals that contributed to distress
  const [contributingSignals, setContributingSignals] = useState([]);

  // Event Timeline
  const [eventTimeline, setEventTimeline] = useState([]);

  // Alert State: 'idle' | 'alert_pending' | 'alert_dispatched' | 'cancelled_by_user'
  const [alertStatus, setAlertStatus] = useState('idle');
  const [alertSentTimestamp, setAlertSentTimestamp] = useState(null);

  // Alert History data
  const [alertHistory, setAlertHistory] = useState([
    {
      id: 'alt-8921',
      date: '2026-09-24T18:42:10Z',
      callWith: 'Office Line (Dispatch)',
      duration: '4m 12s',
      peakScore: 78,
      riskLevel: 'CRITICAL DISTRESS',
      status: 'Delivered to Sarah Connor',
      codewordTriggered: false,
      topSignals: ['High Pitch Modulation (82%)', 'Extended Pause Latency (64%)', 'Voice Tremor Detection (71%)'],
    },
    {
      id: 'alt-8742',
      date: '2026-09-20T11:15:30Z',
      callWith: 'Support Desk',
      duration: '2m 45s',
      peakScore: 52,
      riskLevel: 'ELEVATED',
      status: 'Cancelled via Phrase',
      codewordTriggered: true,
      topSignals: ['Codeword "Silver Willow" detected', 'Micro-tremor variance'],
    },
  ]);

  // Audio Visualizer data stream
  const [audioFrequencies, setAudioFrequencies] = useState(new Array(24).fill(12));
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Call timer effect
  useEffect(() => {
    let timer;
    if (callState === 'calibrating' || callState === 'monitoring') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callState === 'idle' || callState === 'ended') {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Calibration countdown effect
  useEffect(() => {
    let interval;
    if (callState === 'calibrating') {
      interval = setInterval(() => {
        setCalibrationSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Calibration complete! Transition to monitoring
            setCallState('monitoring');
            setHasValidRiskData(true);
            setRiskScore(14);
            setRiskLevel('NORMAL');
            setLastRiskUpdate(new Date().toLocaleTimeString());
            addEvent('Baseline vocal calibration complete. Live monitoring active.', 'info');
            return 0;
          }
          const nextSec = prev - 1;
          setCalibrationProgress(Math.round(((CALIBRATION_DURATION - nextSec) / CALIBRATION_DURATION) * 100));
          return nextSec;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Audio frequency simulation or live analyser loop
  useEffect(() => {
    if (callState === 'calibrating' || callState === 'monitoring') {
      const updateWaveform = () => {
        if (!isMuted) {
          // Generate realistic acoustic jitter & wave patterns
          const baseHeight = callState === 'calibrating' ? 25 : (riskScore && riskScore > 50 ? 55 : 30);
          const newFrequencies = Array.from({ length: 24 }, (_, i) => {
            const harmonic = Math.sin(Date.now() / 200 + i * 0.4);
            const noise = (Math.random() - 0.5) * 20;
            return Math.max(8, Math.min(95, Math.floor(baseHeight + harmonic * 25 + noise)));
          });
          setAudioFrequencies(newFrequencies);
        } else {
          setAudioFrequencies(new Array(24).fill(6));
        }
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } else {
      setAudioFrequencies(new Array(24).fill(8));
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [callState, isMuted, riskScore]);

  // Helper to append events to the timeline
  const addEvent = (description, type = 'info', metadata = null) => {
    const newEvent = {
      id: 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      description,
      type, // 'info' | 'warning' | 'alert' | 'success'
      metadata,
    };
    setEventTimeline((prev) => [newEvent, ...prev]);
  };

  // Start Call action
  const startCall = async (destParticipant, demoSimulation = true) => {
    if (destParticipant) {
      setParticipant(destParticipant);
    }
    setCallDuration(0);
    setEventTimeline([]);
    setContributingSignals([]);
    setAlertStatus('idle');
    setAlertSentTimestamp(null);
    setRiskScore(null);
    setHasValidRiskData(false);

    // Request Mic permission
    setCallState('requesting_permission');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !demoSimulation) {
        // Attempt live mic stream
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermission('granted');
      } else {
        // Safe fallback / mock granted for demo rehearsal
        setMicPermission('granted');
      }

      setCallState('connecting');
      addEvent(`Initiating call with ${destParticipant?.name || participant.name}`, 'info');

      // Brief simulated connection latency
      setTimeout(() => {
        setCallState('calibrating');
        setCalibrationSecondsRemaining(CALIBRATION_DURATION);
        setCalibrationProgress(0);
        addEvent('Call connected. Commencing 15s vocal baseline calibration.', 'info');
      }, 1500);
    } catch (err) {
      console.warn('Microphone permission or connection rejected:', err);
      setMicPermission('denied');
      setCallState('permission_denied');
      addEvent('Microphone access denied. Voice pattern analysis cannot monitor live audio without access.', 'warning');
    }
  };

  // End Call action
  const endCall = () => {
    setCallState('ended');
    addEvent('Call ended by user.', 'info');
  };

  // Mute / Unmute
  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      addEvent(next ? 'Microphone muted locally' : 'Microphone unmuted', 'info');
      return next;
    });
  };

  // Demo Distress Trigger (For rehearsal / demonstration)
  const triggerSimulatedDistress = () => {
    if (callState !== 'monitoring') return;

    const newScore = 84;
    setRiskScore(newScore);
    setRiskLevel('CRITICAL DISTRESS');
    setLastRiskUpdate(new Date().toLocaleTimeString());

    const signals = [
      { name: 'Vocal Tremor & Jitter Anomaly', contribution: '+38%', level: 'High', details: 'F0 perturbation exceeds baseline by 2.8x' },
      { name: 'Respiratory Hesitation Latency', contribution: '+26%', level: 'High', details: 'Uncharacteristic 3.4s inhalation pauses' },
      { name: 'Prosodic Pitch Flattening', contribution: '+20%', level: 'Medium', details: 'Suppression of normal tonal variation' },
    ];
    setContributingSignals(signals);

    addEvent('CRITICAL DISTRESS: Acoustic pattern anomaly detected (Score: 84).', 'alert');
    setAlertStatus('alert_pending');

    // Simulate automatic alert dispatch after 3s countdown
    setTimeout(() => {
      setAlertStatus('alert_dispatched');
      const time = new Date().toLocaleTimeString();
      setAlertSentTimestamp(time);
      addEvent(`Distress alert automatically dispatched via encrypted SMS to ${trustedContact.name} (${trustedContact.phone}).`, 'alert');

      // Add to alert history
      setAlertHistory((prev) => [
        {
          id: 'alt-' + Math.floor(1000 + Math.random() * 9000),
          date: new Date().toISOString(),
          callWith: participant.name,
          duration: `${Math.floor(callDuration / 60)}m ${callDuration % 60}s`,
          peakScore: 84,
          riskLevel: 'CRITICAL DISTRESS',
          status: `Delivered to ${trustedContact.name}`,
          codewordTriggered: false,
          topSignals: ['Vocal Tremor & Jitter (+38%)', 'Hesitation Latency (+26%)', 'Prosodic Flattening (+20%)'],
        },
        ...prev,
      ]);
    }, 3000);
  };

  // Simulate Codeword Detection
  const triggerCodewordDetected = () => {
    if (callState !== 'monitoring') return;

    setRiskScore(92);
    setRiskLevel('CRITICAL DISTRESS');
    setLastRiskUpdate(new Date().toLocaleTimeString());

    const signals = [
      { name: `Distress Codeword: "${codewords.distressCodeword}"`, contribution: '+60%', level: 'Critical', details: 'Exact acoustic phrase match confirmed' },
      { name: 'Acoustic Stress Elevation', contribution: '+32%', level: 'High', details: 'Elevated tension profile during phrase utterance' },
    ];
    setContributingSignals(signals);

    addEvent(`Codeword Triggered: "${codewords.distressCodeword}" identified in voice stream.`, 'alert');
    setAlertStatus('alert_dispatched');
    setAlertSentTimestamp(new Date().toLocaleTimeString());
  };

  // Trigger Cancellation Phrase
  const triggerCancellationPhrase = () => {
    if (alertStatus === 'idle') return;

    setAlertStatus('cancelled_by_user');
    setRiskScore(22);
    setRiskLevel('NORMAL');
    setLastRiskUpdate(new Date().toLocaleTimeString());
    setContributingSignals([]);
    addEvent(`Cancellation phrase "${codewords.cancellationPhrase}" spoken. Alert neutralized and notification sent to ${trustedContact.name}.`, 'success');
  };

  // Reset to Baseline
  const resetToBaseline = () => {
    setRiskScore(12);
    setRiskLevel('NORMAL');
    setContributingSignals([]);
    setAlertStatus('idle');
    setAlertSentTimestamp(null);
    addEvent('Risk score recalibrated to normal baseline.', 'info');
  };

  return (
    <CallContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        trustedContact,
        setTrustedContact,
        codewords,
        setCodewords,
        callState,
        setCallState,
        participant,
        setParticipant,
        callDuration,
        isMuted,
        toggleMute,
        micPermission,
        setMicPermission,
        calibrationSecondsRemaining,
        calibrationProgress,
        riskScore,
        riskLevel,
        hasValidRiskData,
        lastRiskUpdate,
        contributingSignals,
        eventTimeline,
        alertStatus,
        alertSentTimestamp,
        alertHistory,
        audioFrequencies,
        startCall,
        endCall,
        triggerSimulatedDistress,
        triggerCodewordDetected,
        triggerCancellationPhrase,
        resetToBaseline,
        addEvent,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
