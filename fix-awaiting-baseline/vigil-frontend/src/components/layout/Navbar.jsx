import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCall } from '../../context/CallContext';
import { useTheme } from '../../context/ThemeContext';
import { Shield, Phone, Activity, Clock, Settings, Radio, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { callState, isDemoMode, setIsDemoMode, alertStatus } = useCall();
  const { toggleTheme, isDark } = useTheme();
  const isCallActive = callState === 'calibrating' || callState === 'monitoring';

  const nav = [
    ['/', Phone, 'Start'],
    ['/call', Radio, 'Call'],
    ['/dashboard', Activity, 'Explainability'],
    ['/history', Clock, 'History'],
    ['/settings', Settings, 'Settings'],
  ];

  return (
    <header className="vigil-nav">
      <div className="vigil-nav__inner">
        <NavLink to="/" className="vigil-brand">
          <span className="vigil-brand__mark"><Shield size={17} /></span>
          <span><strong>VIGIL</strong><small>NON-VERBAL DISTRESS MONITOR</small></span>
        </NavLink>

        <nav className="vigil-nav__links">
          {nav.map(([to, Icon, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'is-active' : ''}>
              <Icon size={15} />
              <span>{label}</span>
              {to === '/call' && isCallActive && <i />}
            </NavLink>
          ))}
        </nav>

        <div className="vigil-nav__actions"><span className="vigil-nav__context">AUTHORIZED MONITOR</span>
          {alertStatus === 'alert_dispatched' && <span className="vigil-nav__alert">ALERT SENT</span>}
          <button onClick={() => setIsDemoMode(!isDemoMode)} className={`vigil-nav__mode ${isDemoMode ? 'is-demo' : 'is-live'}`}>
            <span /> {isDemoMode ? 'DEMO' : 'LIVE'}
          </button>
          <button onClick={toggleTheme} className="vigil-nav__theme" aria-label="Toggle theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
};
