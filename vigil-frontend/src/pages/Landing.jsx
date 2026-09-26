import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { PageHeader } from '../components/common/PageHeader';
import { Phone, Mic, ShieldAlert, PhoneCall } from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();
  const { startCall, isDemoMode } = useCall();

  const [recipientType, setRecipientType] = useState('preset');
  const [selectedPreset, setSelectedPreset] = useState('1');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const presets = [
    {
      id: '1',
      name: 'Elena Rostova (Peer Contact)',
      number: '+1 (555) 304-9812',
      role: 'Family / Personal Contact',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      name: 'Dispatch Liaison Desk',
      number: '+1 (555) 880-1124',
      role: 'Workplace Operations',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      name: 'SafeRide Driver Partner',
      number: '+1 (555) 419-7603',
      role: 'Transit Service',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const handleStartCall = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let dest;
    if (recipientType === 'preset') {
      dest = presets.find((p) => p.id === selectedPreset);
    } else {
      if (!customNumber.trim()) {
        setErrorMsg('Please enter a destination phone number or SIP address.');
        return;
      }
      dest = {
        name: customName.trim() || 'Direct Dial Recipient',
        number: customNumber.trim(),
        role: 'Manual Dial',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      };
    }

    await startCall(dest, isDemoMode);
    navigate('/call');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Start Monitored Voice Session"
        subtitle="Initiate an authorized two-way call with non-verbal acoustic distress monitoring and baseline calibration."
        badge={isDemoMode ? 'Demo Sandbox' : 'Live Gateway'}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Dial Form */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 backdrop-blur-md shadow-sm dark:shadow-xl transition-colors duration-200">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Choose Call Destination
            </h2>

            {/* Recipient Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => setRecipientType('preset')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  recipientType === 'preset'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Configured Contacts
              </button>
              <button
                type="button"
                onClick={() => setRecipientType('custom')}
                className={`py-2 text-xs font-semibold rounded-lg transition ${
                  recipientType === 'custom'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Direct Number / Dial
              </button>
            </div>

            <form onSubmit={handleStartCall} className="space-y-4">
              {recipientType === 'preset' ? (
                <div className="space-y-2.5">
                  {presets.map((preset) => (
                    <label
                      key={preset.id}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedPreset === preset.id
                          ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500/50 shadow-sm'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preset"
                        checked={selectedPreset === preset.id}
                        onChange={() => setSelectedPreset(preset.id)}
                        className="text-sky-600 dark:text-sky-500 focus:ring-0 rounded-full"
                      />
                      <img
                        src={preset.avatar}
                        alt={preset.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {preset.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {preset.number}
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                        {preset.role}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Participant Label / Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Delivery Partner"
                      className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Destination Phone Number or Peer ID
                    </label>
                    <input
                      type="tel"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono transition"
                      required
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 mt-4"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Start Monitored Call</span>
              </button>
            </form>
          </div>
        </div>

        {/* Operational Scope & Permission Checklist */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 backdrop-blur-md shadow-sm transition-colors duration-200">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Session Safety Protocol
            </h3>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0 text-[11px] font-bold">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">15s Baseline Calibration</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    The first 15 seconds map your natural vocal frequency and cadence under nominal conditions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0 text-[11px] font-bold">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Passive Acoustic Extraction</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Monitors voice tremor, micro-jitter, and hesitation pauses without transcribing conversations to text.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0 text-[11px] font-bold">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Silent Distress Escalation</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    If anomaly metrics breach threshold (&gt;70), an encrypted dispatch notification is routed to your designated contact.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 text-xs space-y-3 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-300">Microphone Status</span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-mono">
                <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Browser Ready
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              Microphone permission is requested upon initiating the call. If microphone access is denied or unavailable, you will have the option to engage the rehearsal playback fallback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
