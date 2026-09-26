import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { PageHeader } from '../components/common/PageHeader';
import { ExplainabilityPanel } from '../components/dashboard/ExplainabilityPanel';
import { EventTimeline } from '../components/dashboard/EventTimeline';
import {
  Activity,
  Clock,
  Phone,
  ArrowUpRight,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

export const Dashboard = () => {
  const {
    riskScore,
    riskLevel,
    callDuration,
    hasValidRiskData,
    callState,
    participant,
    alertStatus,
    trustedContact,
    isDemoMode,
  } = useCall();

  const isCallActive = callState === 'calibrating' || callState === 'monitoring';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Explainability & Telemetry Dashboard"
        subtitle="Transparent audit trail of non-verbal acoustic signals, fusion risk metrics, and automated alert dispatch states."
        badge={isDemoMode ? 'Simulated Insights' : 'Real-Time Telemetry'}
        action={
          isCallActive ? (
            <NavLink
              to="/call"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <span>Return to Call Room</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </NavLink>
          ) : (
            <NavLink
              to="/"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Start Call</span>
            </NavLink>
          )
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Session Status */}
        <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Call Session</span>
            <Phone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {participant?.name || 'No Active Peer'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 capitalize font-mono">
            State: {callState.replace('_', ' ')}
          </p>
        </div>

        {/* Metric 2: Current Fusion Risk */}
        <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Acoustic Risk Index</span>
            <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                riskScore && riskScore >= 70
                  ? 'text-rose-600 dark:text-rose-400'
                  : riskScore && riskScore >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {hasValidRiskData && riskScore !== null ? `${riskScore}/100` : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {hasValidRiskData ? riskLevel : 'Awaiting baseline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Threshold: &gt;70 trigger
          </p>
        </div>

        {/* Metric 3: Active Duration */}
        <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Monitored Duration</span>
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {Math.floor(callDuration / 60)}m {callDuration % 60}s
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Continuous local sampling
          </p>
        </div>

        {/* Metric 4: Alert Delivery */}
        <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-4 backdrop-blur-md shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Safety Dispatch</span>
            <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {alertStatus === 'alert_dispatched' ? (
              <span className="text-rose-600 dark:text-rose-400">Alert Dispatched</span>
            ) : alertStatus === 'cancelled_by_user' ? (
              <span className="text-emerald-600 dark:text-emerald-400">Cancelled via Phrase</span>
            ) : (
              <span className="text-slate-600 dark:text-slate-300">Standby / Nominal</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Recipient: {trustedContact?.name}
          </p>
        </div>
      </div>

      {/* Main Content: Explainability Breakdown & Event Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <ExplainabilityPanel />

          {/* Model & Architecture Notes */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-xs space-y-3 shadow-sm transition-colors duration-200">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Inference & Explainability Integrity
            </h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              VIGIL decomposes raw 48kHz audio into Mel-frequency cepstral coefficients (MFCCs), spectral centroid variances, and pitch contours (F0).
              Feature weights represent local acoustic perturbation relative to the first 15 seconds of the user's specific baseline calibration.
            </p>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Sampling: 16ms window</span>
              <span>Inference Engine: On-Device ONNX</span>
              <span>Data Retention: 0 bytes audio logged</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <EventTimeline />
        </div>
      </div>
    </div>
  );
};
