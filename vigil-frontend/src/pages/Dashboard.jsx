import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { ArrowUpRight, Phone, Activity, Clock3, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

export const Dashboard = () => {
  const { riskScore, riskLevel, callDuration, hasValidRiskData, callState, participant, alertStatus, trustedContact, isDemoMode, contributingSignals, eventTimeline } = useCall();
  const isCallActive = callState === 'calibrating' || callState === 'monitoring';
  const signals = Array.isArray(contributingSignals) ? contributingSignals : [];

  return (
    <div className="vigil-work vigil-explain">
      <header className="vigil-work__head">
        <div className="vigil-work__headrow">
          <div><div className="vigil-work__kicker">04 / EXPLAINABILITY</div><h1 className="vigil-work__title">What the monitor is seeing.</h1><p className="vigil-work__sub">A readable audit surface for acoustic deviations, session state and automated dispatch. No decorative dashboards — only the signals that matter.</p></div>
          <div className="vigil-work__action"><NavLink to={isCallActive ? '/call' : '/'} className="vigil-btn">{isCallActive ? 'Return to call' : 'Start a call'} <ArrowUpRight size={14}/></NavLink></div>
        </div>
      </header>

      <div className="vigil-strip">
        <div className="vigil-strip__item"><span className="vigil-strip__label">SESSION</span><span className="vigil-strip__value">{participant?.name || '—'}</span><span className="vigil-strip__meta">{callState.replace('_',' ')}</span></div>
        <div className="vigil-strip__item"><span className="vigil-strip__label">RISK INDEX</span><span className="vigil-strip__value">{hasValidRiskData && riskScore !== null ? `${riskScore}` : '—'}</span><span className="vigil-strip__meta">{hasValidRiskData ? riskLevel : 'AWAITING BASELINE'}</span></div>
        <div className="vigil-strip__item"><span className="vigil-strip__label">DURATION</span><span className="vigil-strip__value">{Math.floor(callDuration/60)}:{String(callDuration%60).padStart(2,'0')}</span><span className="vigil-strip__meta">CONTINUOUS SAMPLING</span></div>
        <div className="vigil-strip__item"><span className="vigil-strip__label">DISPATCH</span><span className="vigil-strip__value" style={{fontSize:18}}>{alertStatus === 'alert_dispatched' ? 'ALERT SENT' : alertStatus === 'cancelled_by_user' ? 'CANCELLED' : 'NOMINAL'}</span><span className="vigil-strip__meta">TO {trustedContact?.name || 'DESIGNATED CONTACT'}</span></div>
      </div>

      <section className="vigil-section">
        <div className="vigil-section__head"><h2><Cpu size={15} style={{verticalAlign:'-3px'}}/> Signal attribution</h2><span>{isDemoMode ? 'SIMULATED WEIGHTS' : 'LIVE MODEL OUTPUT'}</span></div>
        {signals.length ? <div className="vigil-signal-list">{signals.map((signal, i) => <div className="vigil-signal-list__row" key={i}><span className="vigil-signal-list__dot"/><div><div className="vigil-signal-list__name">{signal.name}</div><div className="vigil-signal-list__detail">{signal.details}</div></div><div className="vigil-signal-list__value">{signal.contribution} · {signal.level}</div></div>)}</div> : <div className="vigil-flat"><div className="vigil-flat__row"><small>STATUS</small><div><strong><CheckCircle2 size={13} style={{verticalAlign:'-2px',color:'var(--vh-good)'}}/> No anomalous attribution</strong><p>Pitch, rhythm, jitter and ambient parameters remain within the calibrated range.</p></div><div className="vigil-flat__right">NOMINAL</div></div></div>}
      </section>

      <section className="vigil-section">
        <div className="vigil-section__head"><h2><Clock3 size={15} style={{verticalAlign:'-3px'}}/> Session timeline</h2><span>{eventTimeline.length} EVENTS</span></div>
        <div className="vigil-flat">{eventTimeline.length ? eventTimeline.map(evt => <div className="vigil-flat__row" key={evt.id}><small>{evt.timestamp}</small><div><strong>{evt.description}</strong><p>{evt.type === 'alert' ? 'Safety escalation' : 'Session milestone'}</p></div><div className={evt.type === 'alert' ? 'vigil-status is-alert' : 'vigil-flat__right'}>{evt.type === 'alert' ? <><i/> ALERT</> : evt.type.toUpperCase()}</div></div>) : <div style={{padding:'20px 0',color:'var(--vh-muted)',fontSize:11}}>No session events yet.</div>}</div>
      </section>

      <section className="vigil-section">
        <div className="vigil-section__head"><h2><ShieldAlert size={15} style={{verticalAlign:'-3px'}}/> Model integrity</h2><span>IMPLEMENTATION NOTES</span></div>
        <div className="vigil-flat">
          <div className="vigil-flat__row"><small>FEATURES</small><div><strong>MFCC · spectral centroid · F0 contours</strong><p>Feature weights represent local acoustic perturbation relative to the first 15 seconds of the user's baseline.</p></div><div className="vigil-flat__right">16MS WINDOW</div></div>
          <div className="vigil-flat__row"><small>INFERENCE</small><div><strong>On-device feature processing</strong><p>Audio is converted to numeric feature vectors; conversational audio is not retained.</p></div><div className="vigil-flat__right">42MS TARGET</div></div>
        </div>
      </section>
    </div>
  );
};
