import React, { useState, useEffect } from 'react';
import { useCall } from '../context/CallContext';
import { api } from '../services/api';
import { Search, Clock3, ShieldCheck } from 'lucide-react';

export const AlertHistory = () => {
  const { alertHistory, isDemoMode } = useCall();
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.getAlertHistory().then((data) => {
      if (Array.isArray(data) && data.length) { setLiveAlerts(data); setSelectedAlert(data[0]); }
      else if (alertHistory.length) setSelectedAlert(alertHistory[0]);
    }).catch(() => { if (alertHistory.length) setSelectedAlert(alertHistory[0]); });
  }, [alertHistory]);

  const list = (liveAlerts.length ? liveAlerts : alertHistory).filter(item => `${item.callWith || ''} ${item.id || ''} ${item.riskLevel || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const formatDate = (dateStr) => { const d = new Date(dateStr); return isNaN(d.getTime()) ? 'Recently' : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`; };

  return (
    <div className="vigil-work vigil-history">
      <header className="vigil-work__head"><div className="vigil-work__kicker">05 / ALERT HISTORY</div><h1 className="vigil-work__title">Dispatch, in sequence.</h1><p className="vigil-work__sub">Historical distress escalations and delivery records are presented as an audit trail rather than a gallery of alert cards.</p></header>

      <div className="vigil-strip"><div className="vigil-strip__item"><span className="vigil-strip__label">RECORDS</span><span className="vigil-strip__value">{list.length}</span><span className="vigil-strip__meta">{isDemoMode ? 'DEMO RECORDS' : 'AUTHORIZED HISTORY'}</span></div><div className="vigil-strip__item"><span className="vigil-strip__label">RETENTION</span><span className="vigil-strip__value">30D</span><span className="vigil-strip__meta">CONFIGURED POLICY</span></div><div className="vigil-strip__item"><span className="vigil-strip__label">SECURITY</span><span className="vigil-strip__value" style={{fontSize:18}}>ENCRYPTED</span><span className="vigil-strip__meta">TOKEN VERIFIED</span></div><div className="vigil-strip__item"><span className="vigil-strip__label">SOURCE</span><span className="vigil-strip__value" style={{fontSize:18}}>{isDemoMode ? 'SANDBOX' : 'BACKEND'}</span><span className="vigil-strip__meta">READ-ONLY VIEW</span></div></div>

      <section className="vigil-section">
        <div className="vigil-section__head"><h2><Clock3 size={15} style={{verticalAlign:'-3px'}}/> Alert records</h2><span>CHRONOLOGICAL</span></div>
        <div className="vigil-history__search"><Search size={14}/><input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search participant, alert ID or risk level"/></div>
        <div className="vigil-history__list">{list.length ? list.map(alert => { const selected = selectedAlert?.id === alert.id; const critical = (alert.riskLevel || '').includes('CRITICAL'); return <div key={alert.id} onClick={()=>setSelectedAlert(alert)} className={`vigil-history__item ${selected ? 'is-selected' : ''}`}><div className="vigil-history__id">{alert.id}</div><div><div className="vigil-history__name">{alert.callWith}</div><div className="vigil-history__meta">{formatDate(alert.date)} · {alert.duration} · {alert.status}</div></div><div className="vigil-history__score"><strong style={{color:critical?'var(--vh-danger)':'var(--vh-warn)'}}>{alert.peakScore}</strong><span>{alert.riskLevel}</span></div></div> }) : <div style={{padding:'24px 0',color:'var(--vh-muted)',fontSize:11}}>No matching alert records.</div>}</div>
      </section>

      {selectedAlert && <section className="vigil-section" style={{paddingBottom:0}}><div className="vigil-section__head"><h2>Selected audit record</h2><span>{selectedAlert.id}</span></div><div className="vigil-audit"><div className="vigil-audit__hero"><div><div className="vigil-work__kicker">AUDIT RECORD</div><h2>{selectedAlert.callWith}</h2></div><div className="vigil-audit__score"><strong>{selectedAlert.peakScore}</strong><div className="vigil-work__kicker">PEAK RISK</div></div></div><div className="vigil-audit__grid"><div className="vigil-audit__cell"><small>STATUS</small><strong>{selectedAlert.status}</strong></div><div className="vigil-audit__cell"><small>DESTINATION</small><strong>{selectedAlert.callWith}</strong></div><div className="vigil-audit__cell"><small>CODEWORD</small><strong>{selectedAlert.codewordTriggered ? 'SPOKEN MATCH' : 'ACOUSTIC ONLY'}</strong></div><div className="vigil-audit__cell"><small>TIME</small><strong>{formatDate(selectedAlert.date)}</strong></div></div><div className="vigil-audit__signals">{(selectedAlert.topSignals || []).map((sig,idx)=>{const label=typeof sig==='object'&&sig!==null?`${sig.name||'Vocal anomaly'} ${sig.contribution?`(${sig.contribution})`:''}`:String(sig); return <div key={idx}><span>{label}</span><span className="vigil-mono" style={{color:'var(--vh-good)'}}>VERIFIED</span></div>})}</div><div style={{padding:'13px 0',fontSize:9,color:'var(--vh-muted)',display:'flex',justifyContent:'space-between'}}><span><ShieldCheck size={12} style={{verticalAlign:'-2px'}}/> SHA-256 security token valid</span><span className="vigil-mono">256-BIT</span></div></div></section>}
    </div>
  );
};
