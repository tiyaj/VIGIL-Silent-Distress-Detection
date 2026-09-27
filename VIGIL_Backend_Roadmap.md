# VIGIL Backend Roadmap
**Audited branch:** `ishan-frontend` @ `tiyaj/VIGIL-Silent-Distress-Detection` (folder: `vigil-frontend/`)
**Audited by:** Claude, direct inspection of source files (not assumptions)
**Owner of this backend:** Sanskar

---

## 0. Ground truth vs. the original spec (read this first)

The original planning doc assumed some things that **do not match the real frontend**. Build against reality, not the assumption:

| Assumption in original spec | What's actually in the code |
|---|---|
| Frontend uses Web Speech API for codeword/transcript detection | **Not present anywhere.** `grep` for `SpeechRecognition` / `webkitSpeechRecognition` returns nothing. Codeword detection today is 100% simulated client-side (`triggerCodewordDetected()` in `CallContext.jsx` just sets fake state). |
| REST calls already wired for settings/history | `src/services/api.js` exists (`getSettings`, `saveTrustedContact`, `saveCodewords`, `getAlertHistory`) but **is never imported or called** by any page. `Settings.jsx`, `CodewordForm.jsx`, `TrustedContactForm.jsx` all read/write only to local `CallContext` state — nothing persists. |
| Real WebRTC + WebSocket already driving the Call page | A full real implementation exists (`src/services/webrtc.js`, `src/services/websocket.js`, `src/hooks/useVigilConnection.js`) — but **it is not wired into any page**. `Landing.jsx` and `Call.jsx` both call `useCall()` from `CallContext.jsx`, whose `startCall()` is a **local setTimeout-driven simulation**, not `useVigilConnection().startRealCall()`. |

**Bottom line:** There are two parallel worlds in this codebase today:
1. **The demo world** (`CallContext.jsx`) — fully wired into every page, drives 100% of what you see when you click around the app right now. All state (risk score, calibration, alerts) is faked with timers.
2. **The real-integration world** (`webrtc.js` + `websocket.js` + `useVigilConnection.js` + `api.js`) — fully written, well-commented, **ready to be dropped in**, but currently orphaned/unused.

Your job as backend engineer is to build the FastAPI server that the **real-integration world** expects, then coordinate with Ishan/Tiya to swap `Call.jsx`/`Landing.jsx` over from `useCall()`'s demo methods to `useVigilConnection()`'s real methods. This is a huge advantage: the frontend contract is already fully specified in code comments by whoever wrote `websocket.js` — you don't have to guess the message shape.

---

## A. Frontend Audit

**Stack:** React 19, Vite 8, Tailwind 3, JavaScript (no TypeScript — despite `@types/react` in devDependencies, no `.ts`/`.tsx` files exist), React Router 7, `lucide-react` for icons. No axios, no socket.io-client, no external WebRTC wrapper — everything is done with native `fetch`, native `WebSocket`, and native `RTCPeerConnection`/`getUserMedia`/`MediaRecorder`.

**Folder structure (`vigil-frontend/src/`):**
```
src/
├── App.jsx                 # Router: /, /call, /dashboard, /history, /settings
├── main.jsx
├── context/
│   ├── CallContext.jsx     # 369 lines — THE demo state machine (currently drives everything)
│   └── ThemeContext.jsx    # light/dark, localStorage only, no backend relevance
├── hooks/
│   └── useVigilConnection.js  # Real bridge: webrtc.js + websocket.js -> CallContext. UNUSED currently.
├── services/
│   ├── api.js               # REST client. Defined, UNUSED currently.
│   ├── webrtc.js            # Real RTCPeerConnection + MediaRecorder audio chunking. UNUSED currently.
│   └── websocket.js         # Real single WebSocket for signaling + telemetry. UNUSED currently.
├── pages/
│   ├── Landing.jsx           # Dial screen. Calls useCall().startCall() (demo)
│   ├── Call.jsx              # Active call UI. Reads useCall() state only
│   ├── Dashboard.jsx         # Explainability + timeline. Reads useCall() state only
│   ├── AlertHistory.jsx      # Reads useCall().alertHistory (hardcoded array)
│   └── Settings.jsx          # Hosts TrustedContactForm + CodewordForm
└── components/
    ├── call/                 # AudioVisualizer, CalibrationIndicator, CallControls, MicPermissionPrompt, RiskMeter
    ├── common/                # DemoModeBanner (has manual "Simulate Distress" / "Trigger Codeword" buttons), PageHeader
    ├── dashboard/             # EventTimeline, ExplainabilityPanel
    ├── layout/                # AppLayout, Navbar
    └── settings/              # CodewordForm, TrustedContactForm
```

**`.env.example` (already defines your target endpoints):**
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_ANALYSIS_URL=ws://localhost:8000/ws/telemetry
VITE_WEBRTC_ICE_SERVERS=stun:stun.l.google.com:19302
VITE_DEFAULT_DEMO_MODE=true
```
This tells you exactly what host/port/path your FastAPI app must serve: **`http://localhost:8000/api/v1`** for REST, **`ws://localhost:8000/ws/telemetry`** for the single combined WebSocket. Note: `CallContext.jsx`'s `isDemoMode` state is hardcoded to `true` and does **not** actually read `VITE_DEFAULT_DEMO_MODE` — flag this to Ishan/Tiya as a small frontend fix needed later, not your job to fix.

**Already complete / no backend needed:** Theming, routing, all visual components, the entire demo simulation, alert history UI (once wired to real data).

**Waiting on backend integration:** Everything under `services/` and `hooks/useVigilConnection.js` — these files are your literal spec.

---

## B. Existing "backend assumptions" found in code

1. `src/services/api.js` — REST base `VITE_API_BASE_URL`, calls:
   - `GET /settings`
   - `POST /settings/trusted-contact` (body: `{ name, phone, relationship, autoSms, pushNotification }`)
   - `POST /settings/codewords` (body: `{ distressCodeword, cancellationPhrase, allowCancellation }`)
   - `GET /alerts`
2. `src/services/websocket.js` — single WS at `VITE_WS_ANALYSIS_URL`, message envelope **always** `{ type, payload }`, both directions.
3. `src/services/webrtc.js` — real `RTCPeerConnection`, ICE servers from `VITE_WEBRTC_ICE_SERVERS`, signaling messages sent via the *same* websocket instance using `socket.send('offer'|'answer'|'ice_candidate', payload)`.
4. Audio chunk capture: `MediaRecorder(localStream, {mimeType:'audio/webm;codecs=opus'})`, fires every **250ms**, base64-encodes the blob, sends over the WebSocket as `{"type":"audio_chunk","payload":{"chunk":"<base64>","mimeType":"audio/webm;codecs=opus"}}`. **This answers Section 10 of the original spec directly: yes, the frontend already sends chunked audio to the backend over the WebSocket, separate from the WebRTC peer audio path.**

---

## C. Missing backend pieces (what you must build)

1. FastAPI app skeleton + CORS + config from env
2. One WebSocket endpoint: `/ws/telemetry` handling both signaling and telemetry message types
3. WebRTC signaling relay logic (`offer`/`answer`/`ice_candidate` passthrough to the other peer in the same call room)
4. Audio chunk receiver: decode base64 webm/opus chunks, buffer per-call, hand off to Krishna's ML module
5. Calibration timer/state machine: first 15s of a call → `calibration_progress` events → `calibration_progress: 100` → switch to monitoring
6. Risk fusion engine (deterministic, rule-based) combining ML output + codeword signal → `risk_update` events
7. Escalation state machine (0→1→2→3, with recovery) driving `alert_status` events
8. Codeword/cancel-phrase handling — **NOTE:** since the frontend has no real speech-to-text (see Section 0), you need to decide with Tiya/Ishan whether codeword detection happens (a) via a lightweight backend acoustic/keyword-spotting pass on the audio chunks, or (b) frontend adds Web Speech API later and sends a `codeword_detected` client→server event directly. Until that's decided, build the backend to **accept** a `codeword_detected` message type from the client (cheapest path) and treat it as authoritative — this unblocks you today regardless of which team implements detection.
9. REST endpoints matching `api.js` exactly: `/api/v1/settings`, `/api/v1/settings/trusted-contact`, `/api/v1/settings/codewords`, `/api/v1/alerts`
10. PostgreSQL models + persistence for calls, alerts, settings
11. Demo/mock mode support (`DEMO_MODE` env) — lower priority since the frontend's own `CallContext.jsx` already fully self-simulates without any backend; your demo mode is a safety net for the *live* path, not a replacement for it

---

## D. REST API Contract

Base path: `/api/v1` (per `.env.example`)

| Endpoint | Method | Purpose | Request | Response | Errors |
|---|---|---|---|---|---|
| `/settings` | GET | Fetch current trusted contact + codewords | — | `{ trustedContact: {...}, codewords: {...} }` | 404 if no user/session |
| `/settings/trusted-contact` | POST | Save trusted contact | `{ name, phone, relationship, autoSms, pushNotification }` | `{ success: true, trustedContact: {...} }` | 422 invalid phone/name |
| `/settings/codewords` | POST | Save codewords | `{ distressCodeword, cancellationPhrase, allowCancellation }` | `{ success: true, codewords: {...} }` | 422 empty phrase |
| `/alerts` | GET | Alert history list | — | `[{ id, date, callWith, duration, peakScore, riskLevel, status, codewordTriggered, topSignals }]` | 500 db error |

Match field names **exactly** — the frontend does no field-name translation.

---

## E. WebSocket Contract (`/ws/telemetry`)

Single connection per call, envelope always `{"type": "...", "payload": {...}}`.

**Client → Server** (confirmed from `webrtc.js`/`websocket.js`):
| type | payload | meaning |
|---|---|---|
| `offer` | `{ sdp }` | WebRTC offer to relay to the other peer in the call |
| `answer` | `{ sdp }` | WebRTC answer to relay back |
| `ice_candidate` | `{ candidate }` | ICE candidate to relay |
| `audio_chunk` | `{ chunk (base64), mimeType }` | ~250ms webm/opus audio chunk for ML analysis |
| `codeword_detected` *(new — you add this)* | `{ codeword }` | Only if frontend adds real speech detection; safe to support now |

**Server → Client** (confirmed from `useVigilConnection.js`):
| type | payload | meaning |
|---|---|---|
| `offer` / `answer` / `ice_candidate` | same as above | relayed to the other peer |
| `calibration_progress` | `{ secondsRemaining, progress }` | during first 15s |
| `risk_update` | `{ score, level, signals }` | fusion engine output |
| `codeword_detected` | `{ codeword }` | echoed to UI for event log |
| `alert_status` | `{ status, timestamp }` | `alert_pending` \| `alert_dispatched` \| `cancelled_by_user` |
| `error` | `{ message }` | any backend-side failure |

**Room behavior:** Each call needs a `call_id` — currently **not present** in any client message. You must decide with Ishan how a call room ID is generated/passed (e.g. query param on the WS URL: `/ws/telemetry?call_id=abc123`, or a first `join_call` message). Flag this as an open question for the Sept sync with Ishan/Tiya — it's the one real gap in an otherwise fully-specified contract.

---

## F. WebRTC Signaling → FastAPI Relay Map

```
Caller's webrtc.js                    FastAPI /ws/telemetry              Callee's webrtc.js
  createOffer() -----> {type:"offer"} --------> look up call_id room --------> forward {type:"offer"}
  (ICE candidates as they trickle) <---------------------------------------->  (same, bidirectional)
  onRemoteStream <----- {type:"answer"} <-------- room lookup <-------------- createAnswer()
```
Media itself (audio) stays peer-to-peer via `RTCPeerConnection` — FastAPI **only** relays signaling messages between the two sockets in the same room. Separately, each client also streams its own `audio_chunk` messages to the backend for ML analysis (this is NOT part of the peer connection — it's a parallel upload channel over the same WebSocket).

---

## G. Database Schema (Postgres + SQLAlchemy)

Build only what's needed for what the frontend actually persists or displays:

- **`trusted_contacts`** — id (PK), user_id (FK, nullable for single-user demo), name, phone, relationship, auto_sms (bool), push_notification (bool)
- **`codewords`** — id (PK), user_id (FK), distress_codeword, cancellation_phrase, allow_cancellation (bool)
- **`calls`** — id (PK, this is your `call_id`), participant_name, participant_number, started_at, ended_at, duration_seconds, final_risk_level
- **`risk_events`** — id (PK), call_id (FK), score, level, signals (JSONB), created_at — needed to reconstruct `ExplainabilityPanel` history
- **`alerts`** — id (PK), call_id (FK), peak_score, risk_level, status, codeword_triggered (bool), top_signals (JSONB), dispatched_at — this is exactly what `AlertHistory.jsx` renders

Skip `users`, `calibration_sessions`, `call_participants`, `user_security_settings` as separate tables for the hackathon — fold that into the four tables above unless multi-user auth becomes a real requirement.

---

## H. Risk Fusion Engine

Rule-based, deterministic, in `risk/engine.py`:
```python
def fuse_risk(features: dict, codeword_detected: bool, baseline: dict) -> dict:
    pitch_dev = deviation(features["pitch"], baseline["pitch"])
    rate_dev = deviation(features["speaking_rate"], baseline["speaking_rate"])
    pause_dev = deviation(features["pause_duration"], baseline["pause_duration"])
    score = weighted_sum(pitch_dev, rate_dev, pause_dev, codeword_detected)
    level = 3 if codeword_detected else (2 if score>=70 else 1 if score>=40 else 0)
    return {"score": score, "level": level, "signals": {...}}
```
Weights and the 40/70 thresholds should live in `config.py` / env vars — the frontend already hardcodes 40/70 as its own display thresholds (`RiskMeter.jsx`), so **keep those exact numbers** unless you coordinate a change with the frontend team.

---

## I. Escalation State Machine

```
LEVEL 0 (NORMAL, score <40) → LEVEL 1 (score 40-69) → LEVEL 2/3 (score ≥70, or codeword)
```
The frontend only visually distinguishes 3 tiers (NORMAL / ELEVATED / CRITICAL), not 4 — reconcile your 0-3 levels to their `NORMAL`/`ELEVATED TENSION`/`CRITICAL DISTRESS` labels so `RiskMeter.jsx`'s `getRiskConfig()` (score ≥70 → critical, ≥40 → elevated, else normal) lines up with what you send.

Cancellation: on `codeword_detected`-style cancel event, set `alert_status: cancelled_by_user`, reset score to a low baseline value, emit one `risk_update` — matches `triggerCancellationPhrase()` in `CallContext.jsx` exactly.

---

## J. Krishna's ML Module Contract

```python
result = analyze_audio_chunk(pcm_or_webm_bytes) -> {
    "pitch": float, "energy": float, "speaking_rate": float, "pause_duration": float,
    "pitch_deviation": float, "speech_rate_deviation": float, "pause_deviation": float,
}
```
Your FastAPI decodes the base64 `audio_chunk` payload → passes bytes to `services/ml_bridge.py` → that module calls Krishna's function → result goes to `risk/engine.py`. Keep librosa/torch entirely inside Krishna's module; FastAPI never imports them directly.

---

## K. NLP / Codeword Integration

Per Section 0: **no Web Speech API exists in the frontend today.** Two paths, pick one with the team:
- **(A) Backend keyword-spotting on audio_chunk stream** — simplest to ship without depending on Ishan/Tiya's changes; low accuracy but fine for a demo.
- **(B) Frontend adds Web Speech API later, sends `codeword_detected` directly** — cleaner long-term, zero backend NLP needed. Your backend already supports this input shape (Section E).

Recommendation: build backend to accept **(B)**'s message shape now (it's nearly free), and only build **(A)**'s audio-based detection if Tiya/Ishan confirm they won't add speech recognition before the demo.

---

## L. Backend Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router mounting
│   ├── config.py            # env vars, thresholds
│   ├── database.py          # SQLAlchemy engine/session
│   ├── models/               # trusted_contact.py, codeword.py, call.py, risk_event.py, alert.py
│   ├── schemas/               # Pydantic request/response models matching Section D exactly
│   ├── api/
│   │   └── settings.py, alerts.py
│   ├── websocket/
│   │   └── telemetry.py     # /ws/telemetry endpoint, room manager
│   ├── services/
│   │   └── ml_bridge.py     # calls Krishna's module
│   ├── risk/
│   │   └── engine.py, state_machine.py
│   └── integrations/
│       └── (future: SMS dispatch, etc.)
├── tests/
├── requirements.txt
├── .env.example
└── README.md
```

---

## M. Environment Variables

```
DATABASE_URL=postgresql://user:pass@host/dbname   # Neon/Supabase
CORS_ORIGINS=http://localhost:5173
RISK_THRESHOLD_ELEVATED=40
RISK_THRESHOLD_CRITICAL=70
CALIBRATION_SECONDS=15
DEMO_MODE=true
```

---

## N. Installation Commands

```bash
mkdir backend && cd backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv pydantic
uvicorn app.main:app --reload --port 8000
```

---

## O. Implementation Order (Day 1 → integrated backend)

1. **`app/main.py`** — bare FastAPI app + CORS, confirm it boots on port 8000
2. **`app/config.py` + `.env`** — load env vars
3. **`app/database.py` + `models/`** — Postgres connection + the 5 tables (Section G)
4. **`app/api/settings.py`** — implement the 4 REST endpoints (Section D), test with `curl` against `.env.example`'s `VITE_API_BASE_URL`
5. **`app/websocket/telemetry.py`** — bare WebSocket echo server first, confirm frontend's `websocket.js` can `connect()` successfully
6. **WebRTC relay logic** in the same websocket handler — room manager keyed by `call_id`, relay `offer`/`answer`/`ice_candidate`
7. **Audio chunk handling** — decode base64, buffer, stub `analyze_audio_chunk()` returning fake numbers
8. **`risk/engine.py`** — real fusion logic once Krishna's module is ready; stub until then
9. **`risk/state_machine.py`** — escalation transitions + `alert_status` emission
10. **Calibration timer** — 15s countdown emitting `calibration_progress`
11. **Codeword/cancel handling** — accept `codeword_detected` from client (Section K, path B)
12. **Persist to DB** — write `risk_events` and `alerts` rows as they're generated
13. **Wire frontend** — coordinate with Ishan/Tiya to swap `Call.jsx`/`Landing.jsx` from `useCall()` to `useVigilConnection()`
14. **End-to-end test** — two browser tabs, real mic, real WebRTC call, real risk updates

---

## P. Integration Checklist

```
[ ] FastAPI running on :8000
[ ] PostgreSQL connected
[ ] GET/POST /api/v1/settings* match frontend api.js exactly
[ ] WebSocket /ws/telemetry accepts connection from websocket.js
[ ] call_id / room scheme agreed with Ishan
[ ] WebRTC offer/answer/ice relay working between two tabs
[ ] audio_chunk received and decoded
[ ] Krishna's ML module wired via ml_bridge.py
[ ] Calibration 15s countdown → calibration_progress events
[ ] Risk fusion producing risk_update events
[ ] Escalation 0→1→2→3 transitions correct
[ ] Codeword path (A or B) decided and implemented
[ ] Cancel phrase resets alert_status correctly
[ ] alerts table populated, GET /alerts matches AlertHistory.jsx shape
[ ] Frontend swapped from useCall() demo to useVigilConnection() real calls
[ ] Two real browser tabs complete a full monitored call end-to-end
```

---

## Q. First Task — start here right now

**File to create:** `backend/app/main.py`
**Responsibility:** Bare FastAPI app with CORS enabled for `http://localhost:5173` (Vite's default dev port), nothing else yet.
**Dependencies:** `pip install fastapi uvicorn[standard]`
**Command:**
```bash
uvicorn app.main:app --reload --port 8000
```
**Expected output:** Uvicorn log showing `Application startup complete` on `http://127.0.0.1:8000`.
**How to test:** `curl http://localhost:8000/` should return something (even a 404 JSON is fine) without a connection error. Then open the frontend (`npm run dev` in `vigil-frontend/`) and confirm no CORS errors appear in the browser console when the app loads.

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VIGIL Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}
```

Once this boots cleanly, move to Step 2 in Section O.
