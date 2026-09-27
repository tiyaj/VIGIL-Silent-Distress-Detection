import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCall } from '../../context/CallContext';
import { useTheme } from '../../context/ThemeContext';
import { Shield, Phone, Activity, Clock, Settings, Radio, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { callState, isDemoMode, setIsDemoMode, alertStatus } = useCall();
  const { theme, toggleTheme, isDark } = useTheme();

  const isCallActive = callState === 'calibrating' || callState === 'monitoring';

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#090d16]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:border-sky-500 group-hover:bg-sky-500/20 transition">
            <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-slate-900 dark:text-white">
                VIGIL
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">
                v1.0-alpha
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-none hidden sm:block">
              Non-Verbal Distress Acoustic Monitor
            </p>
          </div>
        </NavLink>

        {/* Primary Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Phone className="w-4 h-4" />
            <span className="hidden md:inline">Dial / Start</span>
          </NavLink>

          <NavLink
            to="/call"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 relative ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Radio className={`w-4 h-4 ${isCallActive ? 'text-sky-600 dark:text-sky-400 animate-pulse' : ''}`} />
            <span>Call</span>
            {isCallActive && (
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            )}
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Activity className="w-4 h-4" />
            <span className="hidden md:inline">Explainability</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Clock className="w-4 h-4" />
            <span className="hidden md:inline">Alert History</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </NavLink>
        </nav>

        {/* Action Controls & Theme Toggle */}
        <div className="flex items-center gap-2">
          {alertStatus === 'alert_dispatched' && (
            <div className="px-2.5 py-1 rounded bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-pulse flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
              Alert Sent
            </div>
          )}

          {/* Demo / Live Pill */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`text-xs px-2.5 py-1 rounded-md font-mono border transition font-semibold ${
              isDemoMode
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
            }`}
          >
            {isDemoMode ? 'DEMO' : 'LIVE'}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
