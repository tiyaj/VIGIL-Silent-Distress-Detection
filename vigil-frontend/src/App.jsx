import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CallProvider } from './context/CallContext';
import { AppLayout } from './components/layout/AppLayout';
import { Landing } from './pages/Landing';
import { Call } from './pages/Call';
import { Dashboard } from './pages/Dashboard';
import { AlertHistory } from './pages/AlertHistory';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <CallProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Landing />} />
              <Route path="call" element={<Call />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="history" element={<AlertHistory />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CallProvider>
    </ThemeProvider>
  );
}
