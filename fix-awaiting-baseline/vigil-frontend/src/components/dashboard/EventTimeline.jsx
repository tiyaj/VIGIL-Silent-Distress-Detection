import React from 'react';
import { useCall } from '../../context/CallContext';
import { Clock, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

export const EventTimeline = () => {
  const { eventTimeline } = useCall();

  const getEventIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
    }
  };

  const getEventBorder = (type) => {
    switch (type) {
      case 'alert':
        return 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10';
      case 'success':
        return 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10';
      case 'warning':
        return 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10';
      default:
        return 'border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Event Log & Session Milestones</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {eventTimeline.length} events logged
        </span>
      </div>

      {eventTimeline.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
          No events recorded yet. Events will log chronologically once a call session begins.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
          {eventTimeline.map((item) => (
            <div key={item.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${getEventBorder(
                  item.type
                )} bg-white dark:bg-slate-900 shadow-sm`}
              >
                {getEventIcon(item.type)}
              </div>

              <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-lg p-2.5 hover:border-slate-300 dark:hover:border-slate-700/80 transition">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {item.timestamp}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
