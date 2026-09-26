import React from 'react';
import { useCall } from '../../context/CallContext';
import { Clock, CheckCircle2 } from 'lucide-react';

export const CalibrationIndicator = () => {
  const { callState, calibrationSecondsRemaining, calibrationProgress } = useCall();

  const isCalibrating = callState === 'calibrating';
  const isComplete = callState === 'monitoring';

  if (!isCalibrating && !isComplete) return null;

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCalibrating ? (
            <div className="w-5 h-5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3 animate-spin" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {isCalibrating ? 'Vocal Baseline Calibration' : 'Vocal Baseline Calibrated'}
          </span>
        </div>

        <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300">
          {isCalibrating ? `${calibrationSecondsRemaining}s remaining` : '15s Baseline Locked'}
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
        {isCalibrating
          ? 'Sampling ambient acoustics and standard speaking cadence to establish normal non-distress parameters.'
          : 'Individual acoustic baseline established. Real-time deviation anomaly monitoring is active.'}
      </p>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isCalibrating ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${isCalibrating ? calibrationProgress : 100}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
        <span>0s (Call start)</span>
        <span>Target: 15.0s</span>
      </div>
    </div>
  );
};
