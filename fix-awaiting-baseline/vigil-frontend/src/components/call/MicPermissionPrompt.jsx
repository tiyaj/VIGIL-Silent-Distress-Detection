import React from 'react';
import { useCall } from '../../context/CallContext';
import { Mic, AlertTriangle, ShieldCheck, PlayCircle } from 'lucide-react';

export const MicPermissionPrompt = () => {
  const { micPermission, setMicPermission, startCall, participant } = useCall();

  if (micPermission === 'granted') return null;

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-amber-300 dark:border-amber-500/30 p-6 backdrop-blur-md shadow-md dark:shadow-2xl max-w-xl mx-auto my-6 text-center transition-colors duration-200">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
        {micPermission === 'denied' ? (
          <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        ) : (
          <Mic className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {micPermission === 'denied'
          ? 'Microphone Permission Denied'
          : 'Microphone Access Required for Acoustic Analysis'}
      </h3>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto mb-5">
        {micPermission === 'denied' ? (
          <span>
            VIGIL cannot analyze vocal tremors, hesitation pauses, or distress codewords without live microphone access.
            Please enable microphone permissions in your browser URL bar or use the simulated demonstration fallback.
          </span>
        ) : (
          <span>
            VIGIL monitors acoustic parameters (pitch variance, jitter, speaking cadence) locally during permitted calls.
            Voice audio is never stored or transmitted to external servers without distress confirmation.
          </span>
        )}
      </p>

      {/* Guidance box */}
      <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 mb-5 space-y-1.5">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Privacy & Permission Integrity:</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
          • Audio stream is processed into mathematical acoustic vectors in-memory.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
          • If permission is denied, live distress monitoring is entirely deactivated.
        </p>
      </div>

      {/* Fallback & retry options */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => startCall(participant, false)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition shadow-sm"
        >
          Prompt Browser Permission Again
        </button>

        <button
          onClick={() => {
            setMicPermission('granted');
            startCall(participant, true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <PlayCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Use Demo Audio Fallback
        </button>
      </div>
    </div>
  );
};
