import React from 'react';
import { TrustedContactForm } from '../components/settings/TrustedContactForm';
import { CodewordForm } from '../components/settings/CodewordForm';
import { ShieldCheck, Lock, Mic, AlertCircle } from 'lucide-react';

export const Settings = () => (
  <div className="vigil-work vigil-settings">
    <header className="vigil-work__head"><div className="vigil-work__kicker">06 / SETTINGS</div><h1 className="vigil-work__title">Set the rules once.</h1><p className="vigil-work__sub">Trusted contacts, spoken safety phrases and privacy behaviour live here. The page is intentionally quiet: configuration first, decoration last.</p></header>

    <section className="vigil-section vigil-form-sheet"><div className="vigil-section__head"><h2>Trusted contact</h2><span>DISPATCH TARGET</span></div><TrustedContactForm /></section>
    <section className="vigil-section vigil-form-sheet"><div className="vigil-section__head"><h2>Codewords & neutralization</h2><span>VOICE TRIGGERS</span></div><CodewordForm /></section>

    <section className="vigil-privacy"><div className="vigil-section__head"><h2><ShieldCheck size={15} style={{verticalAlign:'-3px'}}/> Privacy architecture</h2><span>OPERATING PRINCIPLES</span></div><div className="vigil-privacy__row"><div className="vigil-privacy__item"><Mic size={15} style={{color:'var(--vh-good)'}}/><h3>Call-scoped microphone</h3><p>Microphone analysis activates only after an authorized call begins and stops when the session ends.</p></div><div className="vigil-privacy__item"><Lock size={15} style={{color:'var(--vh-accent)'}}/><h3>Feature vectors, not recordings</h3><p>Audio is transformed into acoustic features. Raw conversational recordings are not stored.</p></div><div className="vigil-privacy__item"><AlertCircle size={15} style={{color:'var(--vh-warn)'}}/><h3>Indicator, not diagnosis</h3><p>Risk scores are supportive acoustic indicators. Alerts distinguish live calls from rehearsals.</p></div></div></section>
  </div>
);
