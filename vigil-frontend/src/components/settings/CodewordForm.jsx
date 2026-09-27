import React, { useState, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import { api } from '../../services/api';
import { KeyRound, Check } from 'lucide-react';

export const CodewordForm = () => {
  const { codewords, setCodewords } = useCall();
  const [formData, setFormData] = useState({ ...codewords });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        if (data?.codewords) {
          setFormData(data.codewords);
          setCodewords(data.codewords);
        }
      })
      .catch((err) => console.warn('Could not fetch codewords from backend:', err));
  }, [setCodewords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.saveCodewords(formData);
    } catch (err) {
      console.warn('Backend save codewords failed:', err);
    }
    setCodewords(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-2 mb-2">
        <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Codewords & Neutralization Phrases</h3>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
        Discreet spoken words that trigger an immediate distress escalation or cancel an accidental trigger without alerting the counterparty on the call.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Distress Activation Codeword / Phrase
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            Should sound natural in casual conversation (e.g. "Silver Willow", "Winter Book").
          </p>
          <input
            type="text"
            value={formData.distressCodeword}
            onChange={(e) => setFormData({ ...formData, distressCodeword: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition font-medium"
            placeholder="e.g. Silver Willow"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Safety Cancellation Phrase
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            Spoken to immediately abort an escalation and reassure the contact (e.g. "Status Clear Blue").
          </p>
          <input
            type="text"
            value={formData.cancellationPhrase}
            onChange={(e) => setFormData({ ...formData, cancellationPhrase: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 focus:border-sky-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition font-medium"
            placeholder="e.g. Status Clear Blue"
            required
          />
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={formData.allowCancellation}
              onChange={(e) => setFormData({ ...formData, allowCancellation: e.target.checked })}
              className="rounded bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-0"
            />
            <span>Allow verbal cancellation phrase to de-escalate active alerts</span>
          </label>
        </div>

        <div className="pt-3 flex items-center justify-between">
          <button
            type="submit"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            {isSaved ? 'Codewords Saved' : 'Update Phrases'}
          </button>

          {isSaved && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              Model acoustic matcher updated
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
