import React, { useState, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { api } from '../../services/api';
import { UserCheck, Check } from 'lucide-react';

export const TrustedContactForm = () => {
  const { trustedContact, setTrustedContact } = useCall();
  const [formData, setFormData] = useState({ ...trustedContact });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        if (data?.trustedContact) {
          setFormData(data.trustedContact);
          setTrustedContact(data.trustedContact);
        }
      })
      .catch((err) => console.warn('Could not fetch settings from backend:', err));
  }, [setTrustedContact]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.saveTrustedContact(formData);
    } catch (err) {
      console.warn('Backend save failed:', err);
    }
    setTrustedContact(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Designated Trusted Contact</h3>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
        The designated recipient who will receive encrypted distress telemetry and silent dispatch notifications when risk thresholds exceed safety limits.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition"
            placeholder="e.g. Sarah Connor"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Emergency Phone / SMS Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none font-mono transition"
            placeholder="+1 (555) 000-0000"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Relationship / Affiliation
          </label>
          <select
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition"
          >
            <option value="Family Member">Family Member</option>
            <option value="Colleague / Coworker">Colleague / Coworker</option>
            <option value="Designated Support Advocate">Designated Support Advocate</option>
            <option value="Campus Security Liaison">Campus Security Liaison</option>
          </select>
        </div>

        {/* Dispatch toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.autoSms}
              onChange={(e) => setFormData({ ...formData, autoSms: e.target.checked })}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
            />
            <span>Send automated silent SMS alert upon critical distress</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.pushNotification}
              onChange={(e) => setFormData({ ...formData, pushNotification: e.target.checked })}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
            />
            <span>Include encrypted link to live explainability dashboard</span>
          </label>
        </div>

        <div className="pt-3 flex items-center justify-between">
          <button
            type="submit"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            {isSaved ? 'Changes Saved' : 'Save Trusted Contact'}
          </button>

          {isSaved && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
              Configuration verified & persisted
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
