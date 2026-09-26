import React from 'react';
import { useCall } from '../../context/CallContext';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle, Activity } from 'lucide-react';

export const RiskMeter = () => {
  const { callState, riskScore, hasValidRiskData, lastRiskUpdate } = useCall();

  const isCalibrating = callState === 'calibrating';
  const isPreCall = callState === 'idle' || callState === 'connecting' || callState === 'dialing';

  // Do not show a live score before valid data arrives
  if (isPreCall || isCalibrating || !hasValidRiskData || riskScore === null) {
    return (
      <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center min-h-[220px] transition-colors duration-200">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 dark:border-slate-700/60">
          <HelpCircle className="w-6 h-6 animate-pulse text-slate-500 dark:text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">
          {isCalibrating ? 'Calibrating Baseline Parameters...' : 'Risk Telemetry Inactive'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          {isCalibrating
            ? 'Score calculations remain suppressed during the initial 15-second acoustic baseline phase to avoid false positives.'
            : 'Live distress fusion metrics will populate once call audio streaming and baseline calibration are verified.'}
        </p>
        <div className="mt-4 px-3 py-1 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/40 text-[11px] font-mono text-slate-600 dark:text-slate-400">
          {isCalibrating ? 'STATUS: CALIBRATING_AUDIO' : 'STATUS: AWAITING_CONNECTION'}
        </div>
      </div>
    );
  }

  // Configuration for risk tiers
  const getRiskConfig = () => {
    if (riskScore >= 70) {
      return {
        label: 'CRITICAL DISTRESS',
        textColor: 'text-rose-600 dark:text-rose-400',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-600/50 text-rose-800 dark:text-rose-300',
        ringColor: 'stroke-rose-500',
        glowBg: 'bg-rose-500/5 dark:bg-rose-500/10',
        description: 'Multiple non-verbal distress indicators exceed calibrated safety threshold.',
        icon: AlertOctagon,
      };
    }
    if (riskScore >= 40) {
      return {
        label: 'ELEVATED TENSION',
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-600/50 text-amber-800 dark:text-amber-300',
        ringColor: 'stroke-amber-500',
        glowBg: 'bg-amber-500/5 dark:bg-amber-500/10',
        description: 'Moderate vocal tremor and rhythm divergence observed; continuous sampling.',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'NORMAL / CALM',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-600/50 text-emerald-800 dark:text-emerald-300',
      ringColor: 'stroke-emerald-500',
      glowBg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
      description: 'Voice cadence and acoustic parameters conform within baseline boundaries.',
      icon: ShieldCheck,
    };
  };

  const config = getRiskConfig();
  const IconComponent = config.icon;

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * (circumference * 0.75); // 270 deg arc

  return (
    <div className={`bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm relative overflow-hidden transition-colors duration-200 ${config.glowBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Live Distress Risk Fusion
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Updated {lastRiskUpdate || 'now'}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
        {/* Radial Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-36 h-36 transform -rotate-135" viewBox="0 0 160 160">
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
            {/* Value fill */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className={`${config.ringColor} transition-all duration-700 ease-out`}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Score Output */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${config.textColor}`}>
              {riskScore}
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
              Index / 100
            </span>
          </div>
        </div>

        {/* Level Badges & Descriptions */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badgeBg}`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{config.label}</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {config.description}
          </p>

          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-center sm:justify-start gap-3">
            <span>Threshold: &gt;70</span>
            <span>Confidence: 94.2%</span>
            <span>Sensor: Mic 48kHz</span>
          </div>
        </div>
      </div>
    </div>
  );
};
