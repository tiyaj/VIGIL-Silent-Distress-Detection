import React from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { TrustedContactForm } from '../components/settings/TrustedContactForm';
import { CodewordForm } from '../components/settings/CodewordForm';
import { ShieldCheck, Lock, Mic, AlertCircle } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Safety Configuration & Privacy"
        subtitle="Manage your designated emergency contacts, covert vocal triggers, cancellation phrases, and acoustic privacy standards."
        badge="Encrypted Storage"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trusted Contact Form */}
        <TrustedContactForm />

        {/* Codeword Form */}
        <CodewordForm />
      </div>

      {/* Privacy and DSP Architecture Notice */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 backdrop-blur-md shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Vocal Privacy Architecture & Telemetry Principles
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1.5 transition-colors duration-200">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
              <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Voluntary Call Scope</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              VIGIL activates microphone analysis exclusively when a call is dialed or accepted. Monitoring terminates instantly when the call ends.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1.5 transition-colors duration-200">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
              <Lock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Local DSP Vectors</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Audio is converted into numeric frequency vectors (MFCCs and pitch contours). Raw conversational audio recordings are never stored on device or in the cloud.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 space-y-1.5 transition-colors duration-200">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Calm Status Integrity</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Risk scores serve as supportive indicators, not medical or legal diagnoses. Dispatched alerts clearly distinguish live confirmed calls from rehearsals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
