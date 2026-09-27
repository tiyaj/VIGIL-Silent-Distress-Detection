import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { useVigilConnection } from '../hooks/useVigilConnection';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  LockKeyhole,
  Mic,
  Phone,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
} from 'lucide-react';

export const Landing = () => {
  const navigate = useNavigate();
  const { startCall, isDemoMode, setIsDemoMode } = useCall();
  const { startRealCall } = useVigilConnection();

  const [recipientType, setRecipientType] = useState('preset');
  const [selectedPreset, setSelectedPreset] = useState('1');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const presets = [
    {
      id: '1',
      name: 'Priya Sharma',
      number: '+91 98765 43210',
      role: 'Peer contact',
      avatar: 'https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?auto=format&fit=crop&w=320&h=320&q=82',
      tag: 'PERSONAL',
    },
    {
      id: '2',
      name: 'Local PCR Helpline',
      number: '+91 78901 23456',
      role: 'Workplace operations',
      avatar: 'https://images.unsplash.com/photo-1649433658557-54cf58577c68?auto=format&fit=crop&w=320&h=320&q=82',
      tag: 'OPERATIONS',
    },
    {
      id: '3',
      name: 'Auto Rickshaw Stand',
      number: '+91 88990 12345',
      role: 'Transit service',
      avatar: 'https://images.unsplash.com/photo-1546886392-83ca77425060?auto=format&fit=crop&w=320&h=320&q=82',
      tag: 'TRANSIT',
    },
  ];

  const selected = presets.find((p) => p.id === selectedPreset);

  const handleStartCall = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let dest;
    if (recipientType === 'preset') {
      dest = selected;
    } else {
      if (!customNumber.trim()) {
        setErrorMsg('Enter a destination number or SIP address to continue.');
        return;
      }
      dest = {
        name: customName.trim() || 'Direct Dial Recipient',
        number: customNumber.trim(),
        role: 'Manual dial',
        avatar: 'https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?auto=format&fit=crop&w=320&h=320&q=82',
      };
    }

    try {
      if (isDemoMode) startCall(dest, true);
      else startRealCall(dest, dest.id);
    } catch (err) {
      console.warn('Call start error:', err);
    }
    navigate('/call');
  };

  return (
    <div className="vigil-home">
      <section className="vigil-hero">
        <div className="vigil-hero__copy">
          <div className="vigil-kicker">
            NON-VERBAL DISTRESS MONITOR
            <span className="vigil-kicker__version">01 / ALPHA</span>
          </div>

          <h1>
            Start a monitored
            <span>voice session.</span>
          </h1>
          <p>
            A quiet safety layer for authorized calls. VIGIL listens for acoustic
            distress signals without turning the conversation into a transcript.
          </p>

          <div className="vigil-hero__meta">
            <span><LockKeyhole size={13} /> Consent-first</span>
            <span><Wifi size={13} /> WebRTC ready</span>
            <span><ShieldCheck size={13} /> Encrypted dispatch</span>
          </div>
        </div>

        <div className="vigil-signal vigil-signal--quiet" aria-label="Acoustic engine status">
          <div className="vigil-signal__quiet-line"><Radio size={15} /> ACOUSTIC ENGINE</div>
          <strong>STANDING BY</strong>
          <p>Monitoring begins only after an authorized call is connected.</p>
        </div>
      </section>

      <section className="vigil-command">
        <div className="vigil-command__main">
          <div className="vigil-section-head">
            <div>
              <span className="vigil-eyebrow">01 / DESTINATION</span>
              <h2>Who are you calling?</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`vigil-mode ${isDemoMode ? 'is-demo' : 'is-live'}`}
            >
              <span>{isDemoMode ? 'DEMO' : 'LIVE'}</span>
              <span>{isDemoMode ? 'SIMULATED STREAM' : 'FASTAPI GATEWAY'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="vigil-switch" role="tablist" aria-label="Call destination mode">
            <button
              type="button"
              className={recipientType === 'preset' ? 'is-active' : ''}
              onClick={() => setRecipientType('preset')}
            >
              <UserRound size={15} /> Configured contacts
            </button>
            <button
              type="button"
              className={recipientType === 'custom' ? 'is-active' : ''}
              onClick={() => setRecipientType('custom')}
            >
              <Phone size={15} /> Direct dial
            </button>
          </div>

          <form onSubmit={handleStartCall}>
            {recipientType === 'preset' ? (
              <div className="vigil-contacts">
                {presets.map((preset, index) => (
                  <label
                    key={preset.id}
                    className={`vigil-contact ${selectedPreset === preset.id ? 'is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="preset"
                      checked={selectedPreset === preset.id}
                      onChange={() => setSelectedPreset(preset.id)}
                    />
                    <span className="vigil-contact__index">0{index + 1}</span>
                    <img src={preset.avatar} alt="" />
                    <span className="vigil-contact__body">
                      <strong>{preset.name}</strong>
                      <small>{preset.number} · {preset.role}</small>
                    </span>
                    <span className="vigil-contact__tag">{preset.tag}</span>
                    <span className="vigil-contact__check"><Check size={14} /></span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="vigil-direct">
                <label>
                  <span>LABEL <em>OPTIONAL</em></span>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Delivery partner"
                  />
                </label>
                <label>
                  <span>DESTINATION</span>
                  <input
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    placeholder="+91 98765 00000"
                    required
                  />
                </label>
              </div>
            )}

            {errorMsg && <div className="vigil-error">{errorMsg}</div>}

            <div className="vigil-launch">
              <div>
                <span className="vigil-launch__status"><span /> READY TO CONNECT</span>
                <small>{recipientType === 'preset' ? `${selected?.name} · ${selected?.number}` : customNumber || 'Awaiting destination'}</small>
              </div>
              <button type="submit">
                <span>Start monitored call</span>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </form>
        </div>

        <aside className="vigil-command__rail">
          <div className="vigil-rail-head">
            <span className="vigil-eyebrow">02 / PROTOCOL</span>
            <Sparkles size={15} />
          </div>

          <div className="vigil-protocol">
            <div className="vigil-protocol__item">
              <span>01</span>
              <div><strong>Baseline</strong><p>15 sec acoustic calibration establishes your normal vocal pattern.</p></div>
            </div>
            <div className="vigil-protocol__item">
              <span>02</span>
              <div><strong>Passive extraction</strong><p>Tremor, micro-jitter and hesitation are monitored without transcription.</p></div>
            </div>
            <div className="vigil-protocol__item">
              <span>03</span>
              <div><strong>Silent escalation</strong><p>If anomaly metrics breach threshold, the authorized contact is notified.</p></div>
            </div>
          </div>

          <div className="vigil-rail-status">
            <div><Mic size={15} /><span>Microphone</span><strong>READY</strong></div>
            <div><Server size={15} /><span>Gateway</span><strong>{isDemoMode ? 'SANDBOX' : 'ONLINE'}</strong></div>
            <div><ShieldCheck size={15} /><span>Permission</span><strong>REQUIRED</strong></div>
          </div>
        </aside>
      </section>

      <footer className="vigil-home__footer">
        <span>VIGIL / AUTHORIZED ACOUSTIC SAFETY SYSTEM</span>
        <span>Risk scores are acoustic indicators, not medical certainty.</span>
      </footer>
    </div>
  );
};
