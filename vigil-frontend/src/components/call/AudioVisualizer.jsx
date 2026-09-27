import React from 'react';
import { useCall } from '../../context/CallContext';
import { Mic, MicOff } from 'lucide-react';

export const AudioVisualizer = () => {
  const { audioFrequencies, isMuted, callState, riskLevel } = useCall();

  const isCalibrating = callState === 'calibrating';

  // Accent color based on risk level or calibrating state
  let barColor = 'bg-sky-500';
  let glowColor = 'shadow-sky-500/20';

  if (isCalibrating) {
    barColor = 'bg-amber-500';
    glowColor = 'shadow-amber-500/20';
  } else if (riskLevel === 'CRITICAL DISTRESS') {
    barColor = 'bg-rose-500';
    glowColor = 'shadow-rose-500/30';
  } else if (riskLevel === 'ELEVATED') {
    barColor = 'bg-amber-500';
    glowColor = 'shadow-amber-500/25';
  } else if (riskLevel === 'NORMAL') {
    barColor = 'bg-emerald-500';
    glowColor = 'shadow-emerald-500/20';
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md shadow-sm transition-colors duration-200">
      {/* Background radial glow */}
      <div
        className={`absolute inset-0 opacity-10 dark:opacity-15 pointer-events-none transition-all duration-700 ${
          riskLevel === 'CRITICAL DISTRESS'
            ? 'bg-rose-600'
            : isCalibrating
            ? 'bg-amber-500'
            : 'bg-sky-600'
        } blur-3xl`}
      />

      <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 px-1">
        <div className="flex items-center gap-2">
          {isMuted ? (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
              <MicOff className="w-3.5 h-3.5" /> Mic Muted
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Mic className="w-3.5 h-3.5 animate-pulse" /> Live Acoustic Capture (8 kHz Frame)
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {isMuted
            ? 'Input Inactive'
            : isCalibrating
            ? 'Sampling Baseline Harmonics'
            : 'Continuous Feature Extraction'}
        </span>
      </div>

      {/* Visualizer Bars */}
      <div className="h-28 w-full flex items-center justify-center gap-1 sm:gap-2 px-2">
        {audioFrequencies.map((val, idx) => (
          <div
            key={idx}
            className="flex-1 max-w-[12px] bg-slate-100 dark:bg-slate-800/80 rounded-full h-full flex items-center justify-center p-0.5 overflow-hidden"
          >
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                isMuted ? 'bg-slate-400 dark:bg-slate-600' : barColor
              } ${glowColor} shadow-md`}
              style={{
                height: `${Math.max(6, isMuted ? 6 : val)}%`,
                opacity: isMuted ? 0.3 : 0.95,
              }}
            />
          </div>
        ))}
      </div>

      {/* Sub-label description */}
      <div className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <span>Acoustic feature extractor: F0 Pitch, Jitter, Vocal Shimmer</span>
        <span className="font-mono">Zero Cloud Audio Storage (Local DSP)</span>
      </div>
    </div>
  );
};
