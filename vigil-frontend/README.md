# VIGIL — Frontend Experience

> **Non-Verbal Distress Detection via Voice Pattern Analysis**  
> Built with **React 19 + Vite + Tailwind CSS v3**

---

## Overview

VIGIL is an acoustic safety and distress monitoring web application designed to identify subtle indicators of non-verbal distress during permitted voice sessions. It processes vocal parameters (micro-tremors, hesitation pauses, pitch flattening) and configured distress codewords to dispatch encrypted alerts to a designated trusted contact.

---

## Project Structure

```
vigil-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── call/
│   │   │   ├── AudioVisualizer.jsx      # Live acoustic waveform and harmonic activity
│   │   │   ├── CalibrationIndicator.jsx # 15-second baseline vocal calibration
│   │   │   ├── CallControls.jsx         # In-call mute, end call, and alert neutralization
│   │   │   ├── MicPermissionPrompt.jsx  # Browser microphone permission & fallback guidance
│   │   │   └── RiskMeter.jsx            # 0–100 fusion gauge & risk level indicators
│   │   ├── common/
│   │   │   ├── DemoModeBanner.jsx       # Demo sandbox banner with rehearsal controls
│   │   │   └── PageHeader.jsx           # Reusable header with badge and actions
│   │   ├── dashboard/
│   │   │   ├── EventTimeline.jsx        # Chronological audit log with milestones
│   │   │   └── ExplainabilityPanel.jsx  # Feature attribution weights & DSP metrics
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx            # Shared application shell & footer
│   │   │   └── Navbar.jsx               # Navigation bar with live call indicator
│   │   └── settings/
│   │       ├── CodewordForm.jsx         # Distress codeword & cancellation phrase setup
│   │       └── TrustedContactForm.jsx   # Emergency contact & dispatch preferences
│   ├── context/
│   │   └── CallContext.jsx              # Centralized call lifecycle & telemetry state
│   ├── pages/
│   │   ├── AlertHistory.jsx             # Historical distress logs & audit detail view
│   │   ├── Call.jsx                     # Live call room, calibration & risk telemetry
│   │   ├── Dashboard.jsx                # Explainability dashboard & DSP telemetry
│   │   ├── Landing.jsx                  # Participant selection & dial initiation
│   │   └── Settings.jsx                 # Safety configuration & privacy disclosures
│   ├── App.jsx                          # Router configuration
│   ├── index.css                        # Tailwind directives & glassmorphism utilities
│   └── main.jsx                         # React root entry
├── .env.example                         # Environment configuration template
├── package.json
├── tailwind.config.js                   # Custom VIGIL palette & typography tokens
└── vite.config.js
```

---

## Getting Started

### 1. Install Dependencies
```bash
cd vigil-frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## Interactive Demo & Rehearsal Flow

1. **Landing Screen (`/`)**: Select a participant or enter a custom number. Click **Start Monitored Call**.
2. **Call Screen (`/call`)**:
   - The first **15 seconds** initiate the vocal baseline calibration countdown.
   - Observe the live 24-bar acoustic waveform visualizer and active call timer.
   - Once calibrated, the live **Risk Meter (0–100)** displays nominal parameters.
3. **Rehearsal Controls** (Top Banner):
   - **Simulate Distress**: Injects non-verbal tremor anomalies, driving risk score to 84 (Critical Distress) and dispatching an encrypted alert.
   - **Trigger Codeword**: Tests spoken phrase recognition (`Silver Willow`).
   - **Say Cancel Phrase**: Neutralizes the alert using the configured safe phrase (`Status Clear Blue`).
   - **Reset Baseline**: Clears anomalies back to nominal baseline.
4. **Explainability Dashboard (`/dashboard`)**: Inspect mathematical signal attribution and event timelines.
5. **Alert History (`/history`)**: Review past session dispatch logs.
6. **Settings (`/settings`)**: Configure trusted contact and custom codewords.
