import json
import urllib.request
from app.database import SessionLocal, init_db
from app.models import TrustedContact, Codeword, Call, RiskEvent, Alert


def test_http_root():
    req = urllib.request.Request("http://127.0.0.1:8000/")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        body = json.loads(resp.read().decode())
        assert body == {"status": "ok"}, f"Unexpected body: {body}"
        print(f"✓ HTTP GET / returned 200 OK: {body}")


def test_cors():
    req = urllib.request.Request("http://127.0.0.1:8000/", method="OPTIONS")
    req.add_header("Origin", "http://localhost:5173")
    req.add_header("Access-Control-Request-Method", "GET")
    with urllib.request.urlopen(req) as resp:
        origin_header = resp.headers.get("access-control-allow-origin")
        assert origin_header == "http://localhost:5173", f"Wrong origin header: {origin_header}"
        print(f"✓ CORS preflight accepted for origin: {origin_header}")


def test_db_crud():
    init_db()
    db = SessionLocal()
    try:
        # 1. TrustedContact
        tc = TrustedContact(
            name="Alice Walker",
            phone="+14155552671",
            relationship="Sister",
            auto_sms=True,
            push_notification=True,
        )
        db.add(tc)
        db.commit()
        db.refresh(tc)
        assert tc.id is not None
        print(f"✓ TrustedContact model inserted and read back: id={tc.id}, name={tc.name}")

        # 2. Codeword
        cw = Codeword(
            distress_codeword="weather is freezing",
            cancellation_phrase="clear skies",
            allow_cancellation=True,
        )
        db.add(cw)
        db.commit()
        db.refresh(cw)
        assert cw.id is not None
        print(f"✓ Codeword model inserted and read back: id={cw.id}, codeword='{cw.distress_codeword}'")

        # 3. Call
        call = Call(
            id="call_test_001",
            participant_name="Ishan",
            participant_number="+14155551234",
            final_risk_level="NORMAL",
        )
        db.add(call)
        db.commit()
        db.refresh(call)
        assert call.id == "call_test_001"
        print(f"✓ Call model inserted and read back: id={call.id}, participant={call.participant_name}")

        # 4. RiskEvent
        re = RiskEvent(
            call_id=call.id,
            score=52.5,
            level="ELEVATED",
            signals={"pitch_deviation": 1.4, "speaking_rate": 0.8},
        )
        db.add(re)
        db.commit()
        db.refresh(re)
        assert re.id is not None
        print(f"✓ RiskEvent model inserted and linked to call: id={re.id}, score={re.score}")

        # 5. Alert
        alert = Alert(
            call_id=call.id,
            peak_score=78,
            risk_level="CRITICAL DISTRESS",
            status="alert_dispatched",
            codeword_triggered=False,
            top_signals=[{"name": "Pitch deviation", "contribution": "High"}],
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        assert alert.id.startswith("ALT-")
        print(f"✓ Alert model inserted and verified: id={alert.id}, peak_score={alert.peak_score}")

        # Cleanup
        db.delete(alert)
        db.delete(re)
        db.delete(call)
        db.delete(cw)
        db.delete(tc)
        db.commit()
        print("✓ Database cleanup completed.")
    finally:
        db.close()


if __name__ == "__main__":
    print("--- Running Verification for Steps 1 - 3 ---")
    test_http_root()
    test_cors()
    test_db_crud()
    print("--- ALL VERIFICATION CHECKS PASSED ---")
