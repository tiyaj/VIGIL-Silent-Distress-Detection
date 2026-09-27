import React from 'react';
import { useCall } from '../../context/CallContext';
import { Zap, ShieldCheck, RefreshCw, Radio } from 'lucide-react';

export const DemoModeBanner = () => {
  const {
    isDemoMode,
    setIsDemoMode,
    callState,
    triggerSimulatedDistress,
    triggerCodewordDetected,
    triggerCancellationPhrase,
    resetToBaseline,
    alertStatus,
  } = useCall();

  if (!isDemoMode) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Demo Rehearsal Mode Active
          </span>
          <span className="hidden sm:inline text-amber-700/80 dark:text-amber-200/70 border-l border-amber-300 dark:border-amber-500/30 pl-2">
            Simulated telemetry & acoustic patterns. No real emergency services or dispatchers are contacted.
          </span>
        </div>

        {/* Quick Demo Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {callState === 'monitoring' && (
            <>
              <button
                onClick={triggerSimulatedDistress}
                disabled={alertStatus === 'alert_dispatched'}
                className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-800/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700/50 flex items-center gap-1.5 transition text-xs font-medium disabled:opacity-40 shadow-sm"
                title="Inject non-verbal vocal distress anomaly"
              >
                <Zap className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                Simulate Distress
              </button>

              <button
                onClick={triggerCodewordDetected}
                disabled={alertStatus === 'alert_dispatched'}
                className="px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800/80 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700/50 flex items-center gap-1.5 transition text-xs font-medium disabled:opacity-40 shadow-sm"
                title="Inject spoken codeword match"
              >
                <Radio className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                Trigger Codeword
              </button>

              {alertStatus === 'alert_dispatched' && (
                <button
                  onClick={triggerCancellationPhrase}
                  className="px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1.5 transition text-xs font-medium shadow-sm"
                  title="Neutralize alert with safe cancellation phrase"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Say Cancel Phrase
                </button>
              )}

              <button
                onClick={resetToBaseline}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-600/50 flex items-center gap-1 transition text-xs font-medium shadow-sm"
                title="Reset risk score to baseline"
              >
                <RefreshCw className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                Reset Baseline
              </button>
            </>
          )}

          <button
            onClick={() => setIsDemoMode(false)}
            className="text-amber-800 dark:text-amber-400/90 hover:text-amber-950 dark:hover:text-amber-200 hover:underline pl-2 text-[11px] font-medium"
          >
            Switch to Live Mode
          </button>
        </div>
      </div>
    </div>
  );
};
