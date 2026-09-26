import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { DemoModeBanner } from '../common/DemoModeBanner';
import { ShieldCheck, Info } from 'lucide-react';

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <DemoModeBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#090d16]/70 py-6 mt-12 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>VIGIL System Architecture — Non-Verbal Voice Distress Monitor</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-center sm:text-right">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Risk scores are acoustic indicators, not medical certainty. Operates strictly under authorized call permission.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
