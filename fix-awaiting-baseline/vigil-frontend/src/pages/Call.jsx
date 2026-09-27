import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCall } from '../context/CallContext';
import { AudioVisualizer } from '../components/call/AudioVisualizer';
import { CalibrationIndicator } from '../components/call/CalibrationIndicator';
import { RiskMeter } from '../components/call/RiskMeter';
import { CallControls } from '../components/call/CallControls';
import { MicPermissionPrompt } from '../components/call/MicPermissionPrompt';
import { Phone, ArrowRight, ShieldAlert, Activity, Clock3 } from 'lucide-react';

export const Call = () => {
  const {
    callState, participant, callDuration, micPermission, alertStatus,
    alertSentTimestamp, trustedContact, eventTimeline, isDemoMode,
  } = useCall();

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState === 'idle' || callState === 'ended') {
    return (
      <div className="vigil-work">
        <div className="vigil-work__head">
          <div className="vigil-work__kicker">03 / CALL ROOM</div>
          <h1 className="vigil-work__title">{callState === 'ended' ? 'Session closed.' : 'No active session.'}</h1>
          <p className="vigil-work__sub">
            {callState === 'ended'
              ? 'The acoustic monitor has stopped. Session telemetry remains available for review in Explainability.'
              : 'Start an authorized monitored call from the destination screen. Nothing is sampled before the call begins.'}
          </p>
        </div>
        <div className="vigil-section">
          <div className="vigil-flat">
            <div className="vigil-flat__row"><small>STATE</small><div><strong>{callState === 'ended' ? 'TERMINATED' : 'AWAITING CONNECTION'}</strong><p>Acoustic processing is offline.</p></div><div className="vigil-flat__right">LOCAL</div></div>
            <div className="vigil-flat__row"><small>PRIVACY</small><div><strong>NO AUDIO RETENTION</strong><p>Feature vectors are used for monitoring; conversational audio is not logged.</p></div><div className="vigil-flat__right">ENABLED</div></div>
          </div>
          <div style={{display:'flex', gap:10, marginTop:22, flexWrap:'wrap'}}>
            <NavLink to="/" className="vigil-btn"><Phone size={14}/> Start a call <ArrowRight size={14}/></NavLink>
            <NavLink to="/dashboard" className="vigil-btn vigil-btn--ghost">Review explainability <ArrowRight size={14}/></NavLink>
          </div>
        </div>
      </div>
    );
  }

  if (callState === 'permission_denied' || micPermission === 'denied') return <MicPermissionPrompt />;

  return (
    <div className="vigil-call">
      <header className="vigil-call__head">
        <div>
          <div className="vigil-work__kicker">03 / CALL ROOM · {isDemoMode ? 'REHEARSAL' : 'LIVE GATEWAY'}</div>
          <div className="vigil-call__identity" style={{marginTop:10}}>
            <img src={participant.avatar} alt="" />
            <div>
              <h1>{participant.name}</h1>
              <p>{participant.number} · {callState.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
        </div>
        <div className="vigil-call__timer">
          <strong>{formatDuration(callDuration)}</strong>
          <span>SESSION TIME</span>
        </div>
      </header>

      <section className="vigil-call__signal">
        <div className="vigil-section__head">
          <h2>Acoustic stream</h2>
          <span><Activity size={11} style={{verticalAlign:'-2px'}}/> LIVE SAMPLING</span>
        </div>
        <AudioVisualizer />
      </section>

      <section className="vigil-call__telemetry">
        <CalibrationIndicator />
        <RiskMeter />
        <div className="vigil-flat" style={{borderTop:0}}>
          <div className="vigil-section__head" style={{marginBottom:8}}><h2>Session state</h2><span>NOW</span></div>
          <div className="vigil-flat__row" style={{gridTemplateColumns:'1fr auto', minHeight:52}}><div><strong>{callState === 'calibrating' ? 'BASELINE CALIBRATION' : 'MONITORING ACTIVE'}</strong><p>Deviation checks are running against the session baseline.</p></div><div className="vigil-status"><i/> LIVE</div></div>
          <div className="vigil-flat__row" style={{gridTemplateColumns:'1fr auto', minHeight:52}}><div><strong>GATEWAY</strong><p>{isDemoMode ? 'Sandbox rehearsal stream' : 'FastAPI / WebRTC stream'}</p></div><div className="vigil-flat__right">{isDemoMode ? 'SANDBOX' : 'ONLINE'}</div></div>
        </div>
      </section>

      {alertStatus === 'alert_dispatched' && (
        <section className="vigil-call__alert">
          <div style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}>
            <div><div className="vigil-status is-alert"><i/> DISTRESS ESCALATION ACTIVE</div><p style={{margin:'8px 0 0',fontSize:11}}>Encrypted alert delivered to <strong>{trustedContact.name}</strong> ({trustedContact.phone}).</p></div>
            <div className="vigil-mono" style={{fontSize:9}}>{alertSentTimestamp}</div>
          </div>
        </section>
      )}

      <section className="vigil-call__log">
        <div className="vigil-section__head"><h2>Recent telemetry</h2><span><Clock3 size={11}/> {eventTimeline.length} EVENTS</span></div>
        <div className="vigil-flat">
          {eventTimeline.length ? eventTimeline.slice(0,5).map((evt) => (
            <div className="vigil-flat__row" key={evt.id}>
              <small>{evt.timestamp}</small>
              <div><strong>{evt.description}</strong><p>{evt.type === 'alert' ? 'Safety escalation event' : 'Session telemetry event'}</p></div>
              <div className={`vigil-flat__right ${evt.type === 'alert' ? 'vigil-status is-alert' : ''}`}>{evt.type.toUpperCase()}</div>
            </div>
          )) : <div style={{padding:'20px 0',color:'var(--vh-muted)',fontSize:11}}>Waiting for the first session event.</div>}
        </div>
      </section>

      <section className="vigil-call__controls"><div><div className="vigil-work__kicker">CONTROL SURFACE</div><div style={{marginTop:6,fontSize:11,color:'var(--vh-muted)'}}>Microphone and escalation controls remain available while the session is active.</div></div><CallControls /></section>
    </div>
  );
};
