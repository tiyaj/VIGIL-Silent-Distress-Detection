import React from 'react';
import { useCall } from '../../context/CallContext';
import { Cpu, CheckCircle, HelpCircle } from 'lucide-react';

export const ExplainabilityPanel = () => {
  const { contributingSignals, hasValidRiskData, riskScore, isDemoMode } = useCall();

  if (!hasValidRiskData && contributingSignals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm transition-colors duration-200">
        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Explainability Data Unavailable</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Signal attribution is calculated during active calls upon anomalous acoustic detection. No active distress events are registered for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Signal Attribution Breakdown</h3>
        </div>
        {isDemoMode && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-semibold">
            SIMULATED WEIGHTS
          </span>
        )}
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
        Acoustic features identified by the backend deep-learning & DSP pipeline that contributed toward the cumulative risk score ({riskScore || 0}/100).
      </p>

      {contributingSignals.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
          <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold">All Monitored Acoustic Signals Normal</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Voice pitch, frequency jitter, speech rhythm, and ambient acoustics remain within nominal calibrated limits.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contributingSignals.map((signal, idx) => (
            <div
              key={idx}
              className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-lg p-3.5 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{signal.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    {signal.contribution}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60 font-semibold">
                    {signal.level}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal pl-4">
                {signal.details}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Acoustic Engine: PyTorch BiLSTM + DSP Feature Aggregator</span>
        <span className="font-mono">Inference: 42ms Latency</span>
      </div>
    </div>
  );
};
