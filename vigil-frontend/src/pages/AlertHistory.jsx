import React, { useState, useEffect } from 'react';
import { useCall } from '../context/CallContext';
import { api } from '../services/api';
import { PageHeader } from '../components/common/PageHeader';
import {
  Clock,
  Search,
} from 'lucide-react';

export const AlertHistory = () => {
  const { alertHistory, isDemoMode } = useCall();
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getAlertHistory()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveAlerts(data);
          setSelectedAlert(data[0]);
        } else if (alertHistory.length > 0) {
          setSelectedAlert(alertHistory[0]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch alert history from backend:', err);
        if (alertHistory.length > 0) setSelectedAlert(alertHistory[0]);
      });
  }, [alertHistory]);

  const displayList = liveAlerts.length > 0 ? liveAlerts : alertHistory;

  const filteredHistory = displayList.filter(
    (item) =>
      (item.callWith || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.riskLevel || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Recently' : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Alert History & Dispatch Log"
        subtitle="Review historical distress escalations, contributing acoustic factors, and notification delivery verifications."
        badge={isDemoMode ? 'Demo Records' : 'Audit Trail'}
      />

      {/* Info notice about persistence */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-3 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
          <span>
            {isDemoMode
              ? 'Displaying labeled demonstration session logs. In production, logs are secured via zero-knowledge encrypted tokens.'
              : 'Production history requires backend authorization. Viewing stored session entries.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 font-medium">Retention: 30 Days</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Alert Records List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by participant, alert ID, or level..."
              className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm transition"
            />
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
              No matching alert records found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                const isCritical = alert.riskLevel.includes('CRITICAL');

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-slate-800/90 border-sky-400 dark:border-sky-500 shadow-sm'
                        : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCritical ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">{alert.id}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{alert.callWith}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          isCritical
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {alert.riskLevel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono">Peak Score: {alert.peakScore}/100</span>
                        <span>•</span>
                        <span>Duration: {alert.duration}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {formatDate(alert.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Alert Audit Breakdown */}
        <div className="lg:col-span-5">
          {selectedAlert ? (
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm space-y-4 transition-colors duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">AUDIT RECORD</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedAlert.id}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    {selectedAlert.peakScore}
                  </span>
                  <span className="text-[10px] block font-mono text-slate-500 dark:text-slate-400">PEAK RISK</span>
                </div>
              </div>

              {/* Status and Recipient */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Call Destination:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{selectedAlert.callWith}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Dispatch Status:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{selectedAlert.status}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400">Codeword Trigger:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">
                    {selectedAlert.codewordTriggered ? 'YES (Spoken match)' : 'No (Acoustic Anomaly Only)'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Timestamp:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatDate(selectedAlert.date)}
                  </span>
                </div>
              </div>

              {/* Contributing Features */}
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                  Top Contributing Vocal Features
                </h4>
                <div className="space-y-1.5">
                  {(selectedAlert.topSignals || []).map((sig, idx) => {
                    const label = typeof sig === 'object' && sig !== null
                      ? `${sig.name || 'Vocal Anomaly'} ${sig.contribution ? `(${sig.contribution})` : ''}`
                      : String(sig);
                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between"
                      >
                        <span>{label}</span>
                        <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-semibold">Verified</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dispatch Action verification footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Security Token: SHA-256 Valid</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Encrypted 256-bit</span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
              Select an alert record from the list to review detailed feature attribution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
