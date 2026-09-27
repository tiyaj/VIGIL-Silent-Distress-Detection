import React from 'react';
import { useCall } from '../../context/CallContext';
import { useVigilConnection } from '../../hooks/useVigilConnection';
import { Mic, MicOff, PhoneOff, Volume2, ShieldAlert, Radio } from 'lucide-react';

export const CallControls = () => {
  const {
    isMuted,
    toggleMute,
    endCall,
    callState,
    alertStatus,
    triggerCancellationPhrase,
    triggerCodewordDetected,
    codewords,
  } = useCall();
  const { endRealCall, triggerLiveCancellation, triggerLiveDistress } = useVigilConnection();

  const handleEnd = () => {
    endRealCall();
    endCall();
  };

  const handleCancelAlert = () => {
    triggerLiveCancellation();
    triggerCancellationPhrase();
  };

  const handleTriggerCodeword = () => {
    triggerLiveDistress();
    triggerCodewordDetected();
  };

  const isCallActive = callState === 'calibrating' || callState === 'monitoring';

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 backdrop-blur-md shadow-md dark:shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-colors duration-200">
      {/* Device & Status Indicator */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
          <Volume2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Default System Audio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Acoustic Telemetry Stream: <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">Active</span>
          </p>
        </div>
      </div>

      {/* Main Call Action Buttons */}
      <div className="flex items-center gap-3 mx-auto sm:mx-0">
        {/* Mute Control */}
        <button
          onClick={toggleMute}
          disabled={!isCallActive}
          className={`px-4 py-2.5 rounded-xl border font-medium text-sm flex items-center gap-2 transition-all ${
            isMuted
              ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/30'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white'
          } disabled:opacity-40 shadow-sm`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4 text-rose-600 dark:text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
        </button>

        {/* Quick trigger distress codeword button */}
        {alertStatus !== 'alert_dispatched' && (
          <button
            onClick={handleTriggerCodeword}
            disabled={!isCallActive}
            className="px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-500/50 bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/20 font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
            title={`Trigger spoken codeword match: "${codewords.distressCodeword}"`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Say "{codewords.distressCodeword}"</span>
          </button>
        )}

        {/* Cancellation button if alert is active */}
        {alertStatus === 'alert_dispatched' && (
          <button
            onClick={handleCancelAlert}
            className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 font-medium text-sm flex items-center gap-2 transition shadow-sm"
            title={`Neutralize alert with phrase: ${codewords.cancellationPhrase}`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cancel Alert</span>
          </button>
        )}

        {/* End Call Control */}
        <button
          onClick={handleEnd}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium text-sm flex items-center gap-2 transition shadow-md shadow-rose-600/30"
          title="Disconnect call and terminate acoustic monitoring"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};
