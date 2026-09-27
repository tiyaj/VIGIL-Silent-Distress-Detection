# VIGIL Backend Verification Suite (Steps 1 – 12)

This document details the tests and verification results for every backend component built per `VIGIL_Backend_Roadmap.md` (Section O, Steps 1 through 12).

---

## Quick Run: Complete Automated Test Suite

Run all tests sequentially:
```bash
cd backend
PYTHONPATH=. ./.venv/bin/python tests/run_all_tests.py
```

### Full Test Suite Output
```text
============================================================
   RUNNING COMPLETE VIGIL BACKEND TEST SUITE (STEPS 1-12)   
============================================================

============================================================
[STEP 1] FastAPI App & Root Endpoint (GET /)
============================================================
PASS: GET / returned {'status': 'ok'}

============================================================
[STEP 2] Config & Environment Variables (app/config.py)
============================================================
PASS: Loaded CORS_ORIGINS=['http://localhost:5173']
PASS: Thresholds Elevated=40, Critical=70, CalibrationSeconds=15

============================================================
[STEP 3] Database & Models (5 tables per Section G)
============================================================
PASS: All 5 tables verified in DB: ['alerts', 'calls', 'codewords', 'risk_events', 'trusted_contacts']

============================================================
[STEP 4] REST API Endpoints (/api/v1/settings* & /api/v1/alerts)
============================================================
PASS: GET /api/v1/settings returned valid shape
PASS: POST /api/v1/settings/trusted-contact succeeded
PASS: Validation 422 returned for invalid contact input
PASS: POST /api/v1/settings/codewords succeeded
PASS: GET /api/v1/alerts returned JSON array

============================================================
[STEP 5] WebSocket Connection & Envelope Handling
============================================================
PASS: WebSocket connected and preserved {type, payload} envelope

============================================================
[STEP 6] WebRTC Signaling Relay (offer/answer/ice_candidate)
============================================================
PASS: Relayed 'offer' from Caller to Callee
PASS: Relayed 'answer' from Callee to Caller
PASS: Relayed 'ice_candidate' successfully

============================================================
[STEP 7] Audio Chunk Handling & ML Bridge Stub
============================================================
PASS: process_audio_chunk returned acoustic features: {'pitch': 165.2, 'energy': 0.72, 'speaking_rate': 3.9, 'pause_duration': 0.45, 'pitch_deviation': 0.08, 'speech_rate_deviation': 0.05, 'pause_deviation': 0.04}

============================================================
[STEP 8] Risk Fusion Engine (risk/engine.py)
============================================================
PASS: Normal acoustic tier -> Score=10, Level=NORMAL
PASS: Elevated tension tier -> Score=49, Level=ELEVATED TENSION
PASS: Critical distress tier -> Score=85, Level=CRITICAL DISTRESS
PASS: Codeword override -> Score=95, Level=CRITICAL DISTRESS

============================================================
[STEP 9] Escalation State Machine (risk/state_machine.py)
============================================================
PASS: Transitioned to 'alert_dispatched'
PASS: Transitioned to 'cancelled_by_user' and reset score to 15

============================================================
[STEP 10] Calibration Timer (risk/calibration.py)
============================================================
PASS: Calibration timer completed with 3 events (0% -> 100%)

============================================================
[STEP 11] Codeword & Cancellation Spotter (risk/codeword.py)
============================================================
PASS: Spoken keyword spotter accurately identified distress and cancellation

============================================================
[STEP 12] Full Live Session Orchestration & DB Persistence
============================================================
PASS: Received live calibration_progress from backend
PASS: Received real-time risk_update: score=10, level=NORMAL
PASS: Transcript distress triggered 'codeword_detected' and 'alert_dispatched'
PASS: Transcript cancellation phrase neutralized alert to 'cancelled_by_user'
PASS: Database verified: Call(id=step12_verification_call), RiskEvents(count=2), Alert(id=ALT-324009F7, status=cancelled_by_user)
PASS: Test records cleaned up cleanly

============================================================
  ALL 12 STEPS PASSED VERIFICATION WITH 100% SUCCESS RATE  
============================================================
```

---

## Step-by-Step Individual Test Instructions

### Step 1: FastAPI App & Root Endpoint
- **Target File:** `backend/app/main.py`
- **Manual Test Command:**
  ```bash
  curl -i http://localhost:8000/
  ```
- **Expected Output:**
  ```http
  HTTP/1.1 200 OK
  content-type: application/json

  {"status":"ok"}
  ```

---

### Step 2: Configuration & Environment Variables
- **Target Files:** `backend/app/config.py`, `backend/.env`
- **Manual Test Command:**
  ```bash
  cd backend
  PYTHONPATH=. ./.venv/bin/python -c "from app.config import CORS_ORIGINS, RISK_THRESHOLD_ELEVATED, RISK_THRESHOLD_CRITICAL, CALIBRATION_SECONDS; print(CORS_ORIGINS, RISK_THRESHOLD_ELEVATED, RISK_THRESHOLD_CRITICAL, CALIBRATION_SECONDS)"
  ```
- **Expected Output:**
  ```text
  ['http://localhost:5173'] 40 70 15
  ```

---

### Step 3: Database & Models (5 Tables)
- **Target Files:** `backend/app/database.py`, `backend/app/models/*.py`
- **Manual Test Command:**
  ```bash
  cd backend
  PYTHONPATH=. ./.venv/bin/python -c "from app.database import engine; from sqlalchemy import inspect; print(sorted(inspect(engine).get_table_names()))"
  ```
- **Expected Output:**
  ```text
  ['alerts', 'calls', 'codewords', 'risk_events', 'trusted_contacts']
  ```

---

### Step 4: REST API Endpoints & Validations
- **Target Files:** `backend/app/api/settings.py`, `backend/app/api/alerts.py`, `backend/app/schemas/*.py`
- **Manual Test Commands:**
  1. **Get Settings:**
     ```bash
     curl -s http://localhost:8000/api/v1/settings
     ```
     *Output:* `{"trustedContact":{...},"codewords":{...}}`
  2. **Save Trusted Contact:**
     ```bash
     curl -s -X POST http://localhost:8000/api/v1/settings/trusted-contact \
       -H "Content-Type: application/json" \
       -d '{"name": "Sarah Connor", "phone": "+1 (555) 382-9011", "relationship": "Family", "autoSms": true, "pushNotification": true}'
     ```
     *Output:* `{"success":true,"trustedContact":{...}}`
  3. **Validation Error (422):**
     ```bash
     curl -s -X POST http://localhost:8000/api/v1/settings/trusted-contact \
       -H "Content-Type: application/json" \
       -d '{"name": "", "phone": "+123", "relationship": "Friend"}'
     ```
     *Output:* `{"detail":[{"type":"string_too_short", ...}]}` (HTTP 422)
  4. **Save Codewords:**
     ```bash
     curl -s -X POST http://localhost:8000/api/v1/settings/codewords \
       -H "Content-Type: application/json" \
       -d '{"distressCodeword": "Silver Willow", "cancellationPhrase": "Status Clear Blue", "allowCancellation": true}'
     ```
     *Output:* `{"success":true,"codewords":{...}}`
  5. **Get Alerts List:**
     ```bash
     curl -s http://localhost:8000/api/v1/alerts
     ```
     *Output:* `[...]`

---

### Step 5: WebSocket Connection & Envelope
- **Target File:** `backend/app/websocket/telemetry.py`
- **Manual Test Command:**
  ```bash
  cd backend
  PYTHONPATH=. ./.venv/bin/python -c '
  import asyncio, websockets, json
  async def run():
      async with websockets.connect("ws://localhost:8000/ws/telemetry?call_id=cli_test") as ws:
          await ws.send(json.dumps({"type": "ping", "payload": {"test": True}}))
          print("Echo received:", await ws.recv())
  asyncio.run(run())'
  ```
- **Expected Output:**
  ```text
  Echo received: {"type": "ping", "payload": {"test": true}}
  ```

---

### Step 6: WebRTC Signaling Relay
- **Target Files:** `backend/app/websocket/manager.py`, `backend/app/websocket/telemetry.py`
- **Behavior:** Messages of type `offer`, `answer`, `ice_candidate` are relayed strictly between peers connected to the same `call_id` room. Isolated from different rooms.
- **Verification:** Verified via `test_step_6()` in `tests/run_all_tests.py`.

---

### Step 7: Audio Chunk Handling & ML Bridge Stub
- **Target File:** `backend/app/services/ml_bridge.py`
- **Manual Test Command:**
  ```bash
  cd backend
  PYTHONPATH=. ./.venv/bin/python -c '
  import base64
  from app.services.ml_bridge import process_audio_chunk
  b64 = base64.b64encode(b"dummy_opus").decode()
  print(process_audio_chunk(b64))'
  ```
- **Expected Output:**
  ```text
  {'pitch': 165.2, 'energy': 0.72, 'speaking_rate': 3.9, 'pause_duration': 0.45, 'pitch_deviation': 0.08, 'speech_rate_deviation': 0.05, 'pause_deviation': 0.04}
  ```

---

### Step 8: Risk Fusion Engine
- **Target File:** `backend/app/risk/engine.py`
- **Behavior:** Deterministic rule-based fusion preserving 40/70 thresholds. Maps score to `NORMAL` (<40), `ELEVATED TENSION` (40-69), `CRITICAL DISTRESS` (>=70).
- **Manual Test Command:**
  ```bash
  cd backend
  PYTHONPATH=. ./.venv/bin/python -c '
  from app.risk.engine import fuse_risk
  print("Normal:", fuse_risk({"pitch_deviation": 0.01}))
  print("Elevated:", fuse_risk({"pitch_deviation": 0.55, "speech_rate_deviation": 0.50, "pause_deviation": 0.40}))
  print("Critical:", fuse_risk({"pitch_deviation": 0.90, "speech_rate_deviation": 0.85, "pause_deviation": 0.80}))
  print("Codeword:", fuse_risk({}, codeword_detected=True))'
  ```

---

### Step 9: Escalation State Machine
- **Target File:** `backend/app/risk/state_machine.py`
- **Behavior:** Handles state transitions (`idle` → `alert_dispatched` → `cancelled_by_user`). Cancellation resets score to 15 and status to `cancelled_by_user`.
- **Verification:** Verified via `test_step_9()` in `tests/run_all_tests.py`.

---

### Step 10: Calibration Countdown Timer
- **Target File:** `backend/app/risk/calibration.py`
- **Behavior:** Runs countdown from `CALIBRATION_SECONDS` down to 0, emitting `{type: "calibration_progress", payload: {secondsRemaining, progress}}`. Triggers monitoring mode when `progress == 100`.
- **Verification:** Verified via `test_step_10()` in `tests/run_all_tests.py`.

---

### Step 11: Codeword & Cancellation Spotter
- **Target File:** `backend/app/risk/codeword.py`
- **Behavior:** Case-insensitive phrase detection matching spoken transcripts from Web Speech API against active DB settings.
- **Manual Test Command:**
  ```bash
  cd backend
  PYTHONPATH=. ./.venv/bin/python -c '
  from app.risk.codeword import CodewordMatcher
  cm = CodewordMatcher("Silver Willow", "Status Clear Blue")
  print("Check 1:", cm.check_text("Look at that silver willow tree"))
  print("Check 2:", cm.check_text("All is fine, status clear blue"))'
  ```
- **Expected Output:**
  ```text
  Check 1: distress
  Check 2: cancellation
  ```

---

### Step 12: Live Session Orchestration & Database Persistence
- **Target Files:** `backend/app/websocket/session.py`, `backend/app/websocket/telemetry.py`
- **Behavior:**
  - Upon connection: Creates `Call` record, starts calibration timer.
  - Upon `audio_chunk`: Fuses risk, emits `risk_update`, writes to `risk_events` table.
  - Upon `transcript` / `codeword_detected`: Emits `codeword_detected` + `alert_status: alert_dispatched`, writes to `alerts` table.
  - Upon cancellation phrase: Emits `alert_status: cancelled_by_user`, updates `alerts` table.
  - Upon disconnect: Computes duration, sets `final_risk_level`, finalizes `Call` record in DB.
- **Verification:** Verified via `test_step_12()` in `tests/run_all_tests.py`.

---

## Summary Matrix

| Step | Component | Status | Verified Against Spec |
|:---:|---|:---:|---|
| **1** | FastAPI Skeleton & CORS | **PASS** | Section Q / Step 1 |
| **2** | Config & Env Thresholds (40/70) | **PASS** | Section M / Section H |
| **3** | Database & 5 Models | **PASS** | Section G |
| **4** | REST API Endpoints & 422 Validations | **PASS** | Section D |
| **5** | `/ws/telemetry` Envelope & Echo | **PASS** | Section E |
| **6** | WebRTC Relay (Offer/Answer/ICE) | **PASS** | Section F |
| **7** | Audio Chunk Decode & ML Bridge | **PASS** | Section J |
| **8** | Risk Fusion Engine | **PASS** | Section H |
| **9** | Escalation State Machine | **PASS** | Section I |
| **10** | 15s Calibration Timer | **PASS** | Section C.5 / Section E |
| **11** | Codeword & Cancellation Spotter | **PASS** | Section K / Merged Speech API |
| **12** | Live Session DB Persistence | **PASS** | Section G / Section E |
