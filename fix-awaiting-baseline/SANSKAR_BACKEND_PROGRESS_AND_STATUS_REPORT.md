# VIGIL — Backend Status & Work Completion Report

**Author / Role:** Sanskar (Backend & Systems Integration Engineer)  
**Project:** VIGIL — Non-Verbal Silent Distress Detection Gateway  
**Date:** September 27, 2026  
**Repository Branch:** `Sanskar-backend`  

---

## 1. Executive Summary & Team Ownership

The VIGIL system is partitioned across three core tracks:
1. **Sanskar (Backend & Architecture):** FastAPI server, WebSockets telemetry gateway, WebRTC signaling relay, risk calculation engine, escalation state machine, database persistence, and end-to-end integration with the frontend.
2. **Krishna (Machine Learning & DSP):** Feature extraction module using `librosa` and `torch` (`pitch_mean`, `pitch_std`, `rms_energy`, `pause_ratio`).
3. **Ishan / Tiya (Frontend & UI/UX):** React UI application, audio visualization, call lifecycle dashboard, and client-side speech recognition.

---

## 2. Work Completed by Sanskar

All 12 backend roadmap milestones and step 13 integration tasks have been implemented and verified with automated test suites:

### A. Core Architecture & Infrastructure (Steps 1–5)
- [x] **FastAPI Application & Routing:** Modular FastAPI service with CORS configuration for `http://localhost:5173`.
- [x] **Configuration & Thresholds:** Type-safe settings loading via `.env` (`PITCH_THRESHOLD`, `SPEECH_RATE_THRESHOLD`, `PAUSE_THRESHOLD`, `ENERGY_THRESHOLD`, `CALIBRATION_SECONDS=15`).
- [x] **Database & ORM Models (5 Tables):**
  - `trusted_contacts`: Emergency contact profile, auto-SMS/push preference flags.
  - `codewords`: Distress codewords (*"Silver Willow"*), safety cancellation phrases (*"Status Clear Blue"*).
  - `calls`: Call sessions, participant details, start/end timestamps, durations, final risk levels.
  - `risk_events`: Time-series risk telemetry snapshots.
  - `alerts`: Emergency dispatch logs, peak scores, feature attribution records, cancellation status.
- [x] **REST API Endpoints:**
  - `GET /api/v1/settings` & `POST /api/v1/settings/*` (Contact & Codewords).
  - `GET /api/v1/alerts` (Full dispatch history and explainability audit log).
- [x] **Real-Time WebSocket Gateway:** High-performance WebSocket endpoint (`/ws/telemetry?call_id=...`) with JSON envelope dispatching (`{type, payload}`).

### B. Live Session & Telemetry Pipeline (Steps 6–12)
- [x] **WebRTC Signaling Relay:** Room-isolated signaling for peer-to-peer audio calls (`offer`, `answer`, `ice_candidate`).
- [x] **WebM Header-Fragment Audio Buffer Manager:**
  - Solved the browser `MediaRecorder` chunk fragmentation bug.
  - Built `AudioBufferManager` in `app/services/ml_bridge.py` that accumulates raw Opus slices into a continuous growing buffer starting with the valid EBML header at byte 0.
- [x] **Team Risk Fusion Engine (`app/risk/engine.py`):**
  - Implemented the exact team mathematical formula:
    $$\text{raw\_score} = 0.3 \times \text{pitch\_dev} + 0.3 \times \text{rate\_dev} + 0.2 \times \text{pause\_dev} + 0.2 \times \text{energy\_dev}$$
  - Forced codeword override: $\text{raw\_score} = \max(\text{raw\_score}, 75)$.
  - Configured 4-tier scaling:
    - **0–25:** Level 0 (`NORMAL`)
    - **26–50:** Level 1 (`SUSPICIOUS` / Elevated Tension)
    - **51–75:** Level 2 (`HIGH RISK` / Critical Distress)
    - **76–100:** Level 3 (`EMERGENCY` / Automatic Alert Dispatch)
  - Automatic conversion of `words_in_chunk` to `speaking_rate_wpm` for ~4s intervals.
- [x] **Escalation State Machine (`app/risk/state_machine.py`):**
  - Escalates immediately to `alert_dispatched` on score $\ge 70$ or codeword trigger.
  - Neutralizes active alerts and restores baseline telemetry upon receiving safety cancellation phrase.
- [x] **Vocal Calibration Timer (`app/risk/calibration.py`):**
  - 15-second baseline countdown in 4-second intervals matching browser `recorder.start(4000)`.
- [x] **Codeword & Cancellation Spotter (`app/risk/codeword.py`):**
  - Dynamic database-driven keyword spotter with fuzzy constituent-word matching (`"silver willow"`, `"silverwillow"`, `"silver-willow"`, `"silver willows"`).
- [x] **Session Orchestrator (`app/websocket/session.py`):**
  - Coordinates calibration, telemetry streaming, audio decoding, and DB writes.
  - Fixed audio chunk overwrite bug: locks risk score at $\ge 75$ until cancelled once a codeword is spotted.

### C. Frontend Wiring & Integration (Step 13)
- [x] **`useVigilConnection.js`:** Bridges WebRTC media streams and telemetry sockets to React `CallContext`.
- [x] **Call Redirection Fix:**
  - Exported missing context setters (`setEventTimeline`, `setHasValidRiskData`, `setLastRiskUpdate`).
  - Added optional chaining to prevent unhandled TypeErrors from blocking navigation to `/call`.
  - Immediate transition to `calibrating` upon socket connection.
- [x] **Alert History Page:** Fixed 500/blank screen crash by normalizing nested signal objects and adding fallback date formatting.
- [x] **Manual Codeword Trigger:** Added quick-action `Say "Silver Willow"` button in `CallControls.jsx`.
- [x] **Speech Recognition Service (`speechRecognition.js`):**
  - Updated to continuous listening loop with 100ms debouncing.
  - Added `en-IN` phonetics and on-screen timeline logging for live speech events.

### D. Automated Test Coverage (100% Pass Rate)
- [x] `tests/run_all_tests.py` — All 12 backend verification steps.
- [x] `tests/test_e2e_full_flow.py` — Full REST $\leftrightarrow$ WebSocket $\leftrightarrow$ State Machine $\leftrightarrow$ SQLite DB test.
- [x] `tests/test_risk_formula.py` — 6 unit test scenarios verifying the exact mathematical formula.
- [x] `tests/test_buffer_manager.py` — Verifies raw audio accumulation and EBML header preservation.

---

## 3. Work Remaining (Assigned to Sanskar)

| Task | Scope | Dependencies | Priority |
| :--- | :--- | :--- | :---: |
| **Drop-in Krishna's ML Model** | Replace acoustic feature stub in `services/ml_bridge.py` with Krishna's PyTorch/Librosa code. | Waiting on Krishna to provide `analyze_audio_chunk()` | **HIGH** |
| **Production Server Hardening** | Add Dockerfile, production ASGI worker config (`gunicorn` / `uvicorn -w 4`), and Postgres connection pooling. | None (can be done anytime) | **MEDIUM** |
| **Two-Party WebRTC Calling Test** | Test end-to-end two-way calling between two distinct physical devices/browsers across LAN/STUN. | Second test client device | **MEDIUM** |
| **Demonstration Deployment** | Deploy FastAPI backend to cloud (Render / Railway / Fly.io / AWS EC2) with HTTPS/WSS for mobile testing. | Domain or cloud provider account | **LOW** |

---

## 4. Current Issues & Technical Blockers

### Issue 1: Browser Web Speech API on `localhost` (Dependency on Ishan/Tiya)
- **Problem:**
  When speaking into the microphone in Chrome, the speech recognizer often fires `no-speech` or silently fails without returning text.
- **Root Cause:**
  1. **Google Cloud Dependency:** Chrome's `webkitSpeechRecognition` does *not* run locally. It streams audio to Google's public cloud speech servers. On macOS `http://localhost`, Chrome frequently throttles or blocks these requests due to origin restrictions or network firewalls.
  2. **Hardware Mic Contention:** `MediaRecorder` takes high-priority 48kHz audio capture for the audio chunks. Chrome's Web Speech API thread frequently starves or drops mic input when running concurrently with `MediaRecorder` on macOS.
- **Current Workaround:**
  The backend codeword engine works 100%. The purple `Say "Silver Willow"` button sends the exact WebSocket message and triggers the full escalation flow.
- **Recommended Permanent Fix:**
  If client-side Web Speech API continues to be flaky, implement **Backend Keyword Spotting (Roadmap Section K, Option A)** by adding an offline speech-to-text library (such as `vosk` or `faster-whisper`) on the FastAPI server to transcribe the incoming `audio_chunk` directly.

---

### Issue 2: Real Acoustic ML Features are Pending (Dependency on Krishna)
- **Problem:**
  Speaking with vocal tremor, stress, or long pauses does not dynamically elevate the risk score; the score stays around `5/100` under normal speech.
- **Root Cause:**
  `backend/app/services/ml_bridge.py` is currently running on the **Section J ML Contract Stub**, which returns baseline acoustic values (`pitch: 165.2`, `deviation: 0.08`). Real acoustic distress detection cannot respond to vocal stress until Krishna delivers his Librosa feature extraction script.
- **Resolution:**
  Once Krishna provides his script, Sanskar only needs to paste Krishna's function into `ml_bridge.py`. The buffer manager and fusion engine are already built to accept it.

---

### Issue 3: Solo WebRTC Testing vs. Two-Peer Calls
- **Problem:**
  When testing alone on a single computer, `pc.connectionState` stays at `new` or `connecting`.
- **Root Cause:**
  WebRTC requires a callee to exchange SDP offers/answers.
- **Resolution:**
  Sanskar decoupled the call calibration and monitoring state from the WebRTC connection state: as soon as the monitoring WebSocket opens, calibration and analysis begin immediately.

---

## 5. Summary Status by Milestone

```
[✓] Step 1:  FastAPI App & Root Endpoint
[✓] Step 2:  Config & Environment Variables
[✓] Step 3:  Database & 5 Models
[✓] Step 4:  REST API Endpoints (/settings & /alerts)
[✓] Step 5:  WebSocket Telemetry Gateway
[✓] Step 6:  WebRTC Signaling Relay
[✓] Step 7:  Audio Chunk Buffer & ML Bridge Stub
[✓] Step 8:  Team Risk Fusion Engine (Exact Formula)
[✓] Step 9:  Escalation State Machine
[✓] Step 10: Vocal Baseline Calibration Timer (15s)
[✓] Step 11: Codeword & Cancellation Phrase Spotter
[✓] Step 12: Session Orchestration & DB Persistence
[✓] Step 13: Frontend Wiring (CallContext, Controls, Alert History)
[⏳] Step 14: Final Integration (Waiting on Krishna's Librosa module)
```
