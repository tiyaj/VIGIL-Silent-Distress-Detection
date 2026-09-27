// src/services/api.js
// Plain REST calls to the backend for anything that isn't real-time.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  getSettings: () => request('/settings'),
  saveTrustedContact: (data) =>
    request('/settings/trusted-contact', { method: 'POST', body: JSON.stringify(data) }),
  saveCodewords: (data) =>
    request('/settings/codewords', { method: 'POST', body: JSON.stringify(data) }),
  getAlertHistory: () => request('/alerts'),
};
