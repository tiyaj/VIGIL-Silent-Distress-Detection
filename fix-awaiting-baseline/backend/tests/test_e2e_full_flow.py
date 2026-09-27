import asyncio
import base64
import json
import urllib.request
import websockets

BACKEND_HTTP = "http://127.0.0.1:8000"
BACKEND_WS = "ws://127.0.0.1:8000/ws/telemetry"


def request_json(url, data=None):
    if data:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode(),
            headers={"Content-Type": "application/json"}
        )
    else:
        req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


async def test_full_e2e():
    print("\n============================================================")
    print("      RUNNING END-TO-END FRONTEND <-> BACKEND TEST RUN       ")
    print("============================================================")

    # 1. Test REST Settings Persistence (matching Settings.jsx)
    print("\n[E2E 1] Configuring Settings via REST API...")
    contact_payload = {
        "name": "Sarah Connor",
        "phone": "+1 (555) 382-9011",
        "relationship": "Family Member",
        "autoSms": True,
        "pushNotification": True
    }
    contact_res = request_json(f"{BACKEND_HTTP}/api/v1/settings/trusted-contact", contact_payload)
    assert contact_res["success"] is True
    print(f"✓ Saved Trusted Contact: {contact_res['trustedContact']['name']}")

    codeword_payload = {
        "distressCodeword": "Silver Willow",
        "cancellationPhrase": "Status Clear Blue",
        "allowCancellation": True
    }
    cw_res = request_json(f"{BACKEND_HTTP}/api/v1/settings/codewords", codeword_payload)
    assert cw_res["success"] is True
    print(f"✓ Saved Codewords: '{cw_res['codewords']['distressCodeword']}' / '{cw_res['codewords']['cancellationPhrase']}'")

    # 2. Test Live Call Session via WebSocket (matching useVigilConnection.js)
    call_id = f"e2e_call_{int(asyncio.get_event_loop().time())}"
    print(f"\n[E2E 2] Connecting to live session '{call_id}' over WebSocket...")
    
    async with websockets.connect(f"{BACKEND_WS}?call_id={call_id}") as ws:
        # Calibration Progress
        c_msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
        assert c_msg["type"] == "calibration_progress"
        print(f"✓ Backend initiated calibration countdown: {c_msg['payload']['secondsRemaining']}s remaining ({c_msg['payload']['progress']}%)")

        # Audio Chunk Upload
        print("\n[E2E 3] Streaming live audio chunks (WebRTC / MediaRecorder)...")
        fake_chunk = base64.b64encode(b"simulated_opus_audio_frame").decode()
        await ws.send(json.dumps({
            "type": "audio_chunk",
            "payload": {
                "chunk": fake_chunk,
                "mimeType": "audio/webm;codecs=opus"
            }
        }))
        
        # Risk Update
        for _ in range(3):
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
            if msg.get("type") == "risk_update":
                print(f"✓ Received live Risk Meter update: Score={msg['payload']['score']}, Tier={msg['payload']['level']}")
                break

        # Spoken Transcript with Codeword (Web Speech API)
        print("\n[E2E 4] Relaying speech transcript: 'I see that Silver Willow tree'...")
        await ws.send(json.dumps({
            "type": "transcript",
            "payload": {"text": "I see that Silver Willow tree", "timestamp": 12345678}
        }))

        # Collect distress triggers
        cw_detected = False
        alert_dispatched = False
        for _ in range(6):
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
            if msg.get("type") == "codeword_detected":
                cw_detected = True
                print(f"✓ Backend acoustic spotter detected codeword: '{msg['payload']['codeword']}'")
            elif msg.get("type") == "alert_status" and msg["payload"]["status"] == "alert_dispatched":
                alert_dispatched = True
                print(f"✓ Escalation state machine triggered: ALERT DISPATCHED at {msg['payload']['timestamp']}")
            if cw_detected and alert_dispatched:
                break
        assert cw_detected and alert_dispatched, "Codeword alert not received"

        # Safety Cancellation Phrase (Spoken or Button)
        print("\n[E2E 5] Relaying cancellation phrase: 'Status Clear Blue'...")
        await ws.send(json.dumps({
            "type": "transcript",
            "payload": {"text": "Stand down, Status Clear Blue", "timestamp": 12345690}
        }))

        cancelled = False
        for _ in range(6):
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=3.0))
            if msg.get("type") == "alert_status" and msg["payload"]["status"] == "cancelled_by_user":
                cancelled = True
                print("✓ Alert neutralized: Status transitioned to 'cancelled_by_user'")
                break
        assert cancelled, "Cancellation event not received"

    # Allow session cleanup in DB
    await asyncio.sleep(0.5)

    # 3. Test Alert History UI data retrieval (matching AlertHistory.jsx)
    print("\n[E2E 6] Querying Alert History for dispatched records...")
    history = request_json(f"{BACKEND_HTTP}/api/v1/alerts")
    assert isinstance(history, list)
    matching_alert = next((a for a in history if a["callWith"] == "Emergency Channel"), None)
    assert matching_alert is not None, "Dispatched alert not found in alert history"
    print(f"✓ Found persisted audit record in history: ID={matching_alert['id']}, RiskLevel={matching_alert['riskLevel']}, PeakScore={matching_alert['peakScore']}")

    print("\n" + "="*60)
    print("      ALL END-TO-END INTEGRATION CHECKS PASSED (100%)       ")
    print("============================================================\n")


if __name__ == "__main__":
    asyncio.run(test_full_e2e())
