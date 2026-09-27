import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { AudioVisualizer } from '../components/call/AudioVisualizer';
import { CalibrationIndicator } from '../components/call/CalibrationIndicator';
import { RiskMeter } from '../components/call/RiskMeter';
import { CallControls } from '../components/call/CallControls';
import { MicPermissionPrompt } from '../components/call/MicPermissionPrompt';
import {
  Phone,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const Call = () => {
  const {
    callState,
    participant,
    callDuration,
    micPermission,
    alertStatus,
    alertSentTimestamp,
    trustedContact,
    eventTimeline,
    isDemoMode,
  } = useCall();

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If no call is currently active or starting
  if (callState === 'idle' || callState === 'ended') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto mb-5 shadow-sm dark:shadow-inner">
          <Phone className="w-8 h-8 text-slate-500 dark:text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {callState === 'ended' ? 'Call Session Terminated' : 'No Active Call Session'}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
          {callState === 'ended'
            ? 'Vocal pattern analysis and baseline monitoring have ended. You can review session telemetry on the explainability dashboard.'
            : 'Select a participant or dial a number from the landing interface to initiate an authorized voice monitoring session.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <NavLink
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>Go to Dial Screen</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>View Session Metrics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>
    );
  }

  // If mic permission was denied
  if (callState === 'permission_denied' || micPermission === 'denied') {
    return <MicPermissionPrompt />;
  }

  // Active call view
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Call Header Bar */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 backdrop-blur-md shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors duration-200">
        {/* Participant Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={participant.avatar}
              alt={participant.name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{participant.name}</span>
              <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                ({participant.number})
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(callDuration)}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="capitalize">{callState.replace('_', ' ')}</span>
              {isDemoMode && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">Rehearsal Stream</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Status Tag */}
        <div className="flex items-center gap-2">
          {alertStatus === 'alert_dispatched' ? (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/60 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse shadow-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>DISTRESS ESCALATION ACTIVE</span>
            </div>
          ) : alertStatus === 'cancelled_by_user' ? (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ALERT CANCELLED VIA PHRASE</span>
            </div>
          ) : callState === 'calibrating' ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>CALIBRATING BASELINE (15s)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>MONITORING ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Telemetry & Acoustic Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visualizer & Calibration */}
        <div className="lg:col-span-7 space-y-6">
          <AudioVisualizer />
          <CalibrationIndicator />
        </div>

        {/* Right Column: Risk Gauge & Alert Confirmation */}
        <div className="lg:col-span-5 space-y-6">
          <RiskMeter />

          {/* Alert Confirmation Box if an alert fired */}
          {alertStatus === 'alert_dispatched' && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-600/50 rounded-xl p-4 text-xs space-y-2 backdrop-blur-md shadow-sm transition-colors duration-200">
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Alert Dispatched
                </span>
                <span className="font-mono text-[11px]">{alertSentTimestamp}</span>
              </div>
              <p className="text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
                Emergency alert payload delivered to <span className="font-semibold">{trustedContact.name}</span> ({trustedContact.phone}).
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-rose-700/80 dark:text-rose-300/70 border-t border-rose-200 dark:border-rose-800/40">
                <span>Channel: Encrypted SMS / Webhook</span>
                <span>Delivery: Confirmed 200 OK</span>
              </div>
            </div>
          )}

          {/* Quick Session Event Digest */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-2.5 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-300 font-semibold">
              <span>Latest Telemetry Milestone</span>
              <NavLink to="/dashboard" className="text-sky-600 dark:text-sky-400 hover:underline text-[11px] font-medium">
                Full Log →
              </NavLink>
            </div>
            {eventTimeline.length > 0 ? (
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                {eventTimeline[0].description} ({eventTimeline[0].timestamp})
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">Awaiting initial acoustic milestones...</p>
            )}
          </div>
        </div>
      </div>

      {/* High-visibility In-Call Controls */}
      <CallControls />
    </div>
  );
};
