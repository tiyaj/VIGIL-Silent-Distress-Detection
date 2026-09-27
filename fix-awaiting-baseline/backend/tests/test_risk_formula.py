"""
Unit test verifying compute_risk() per the team's exact specifications:
- INPUT chunk (every ~4 sec of audio):
    pitch_mean, pitch_std, rms_energy, pause_ratio
    words_in_chunk (speaking rate)
    codeword_detected: bool
- INPUT baseline (first 15s calibration):
    pitch_mean, energy_mean, speaking_rate_wpm, avg_pause_sec
- FORMULA:
    raw_score = 0.3*pitch_dev + 0.3*rate_dev + 0.2*pause_dev + 0.2*energy_dev
    if codeword_detected, force raw_score = max(raw_score, 75)
- LEVELS:
    0–25 (level 0: normal)
    26–50 (level 1: suspicious)
    51–75 (level 2: high risk)
    76–100 (level 3: emergency)
- OUTPUT:
    risk_score: 0–100
    level: 0 / 1 / 2 / 3
    signals: { pitch_deviation_pct, rate_deviation_pct, pause_deviation_pct, codeword_detected }
"""

from app.risk.engine import compute_risk

def test_team_risk_formula():
    baseline = {
        "pitch_mean": 160.0,
        "energy_mean": 0.70,
        "speaking_rate_wpm": 150.0,
        "avg_pause_sec": 0.40,
    }

    # Case 1: Identical to baseline (0% deviation) -> raw_score = 0, level = 0
    chunk_normal = {
        "pitch_mean": 160.0,
        "pitch_std": 12.0,
        "rms_energy": 0.70,
        "pause_ratio": 0.40,
        "words_in_chunk": 10,  # 10 words in 4s = 150 WPM (matches baseline 150)
        "codeword_detected": False,
    }
    out1 = compute_risk(chunk_normal, baseline)
    assert out1["risk_score"] == 0, f"Expected 0, got {out1['risk_score']}"
    assert out1["level_code"] == 0
    assert out1["signals"]["pitch_deviation_pct"] == 0.0
    assert out1["signals"]["rate_deviation_pct"] == 0.0
    assert out1["signals"]["pause_deviation_pct"] == 0.0
    assert out1["signals"]["energy_deviation_pct"] == 0.0
    assert out1["signals"]["codeword_detected"] is False
    print("PASS Case 1: Baseline chunk -> risk_score=0, level=0 (normal)")

    # Case 2: Level 1 (Suspicious, 26–50)
    # E.g. pitch_dev=40%, rate_dev=40%, pause_dev=30%, energy_dev=30%
    # raw_score = 0.3(40) + 0.3(40) + 0.2(30) + 0.2(30) = 12 + 12 + 6 + 6 = 36
    chunk_suspicious = {
        "pitch_deviation_pct": 40.0,
        "rate_deviation_pct": 40.0,
        "pause_deviation_pct": 30.0,
        "energy_deviation_pct": 30.0,
        "codeword_detected": False,
    }
    out2 = compute_risk(chunk_suspicious, baseline)
    assert out2["risk_score"] == 36
    assert out2["level_code"] == 1
    print(f"PASS Case 2: Suspicious chunk -> risk_score={out2['risk_score']}, level={out2['level_code']} (suspicious)")

    # Case 3: Level 2 (High Risk, 51–75)
    # E.g. pitch_dev=70%, rate_dev=70%, pause_dev=60%, energy_dev=60%
    # raw_score = 0.3(70) + 0.3(70) + 0.2(60) + 0.2(60) = 21 + 21 + 12 + 12 = 66
    chunk_high_risk = {
        "pitch_deviation_pct": 70.0,
        "rate_deviation_pct": 70.0,
        "pause_deviation_pct": 60.0,
        "energy_deviation_pct": 60.0,
        "codeword_detected": False,
    }
    out3 = compute_risk(chunk_high_risk, baseline)
    assert out3["risk_score"] == 66
    assert out3["level_code"] == 2
    print(f"PASS Case 3: High Risk chunk -> risk_score={out3['risk_score']}, level={out3['level_code']} (high risk)")

    # Case 4: Level 3 (Emergency, 76–100)
    # E.g. pitch_dev=90%, rate_dev=90%, pause_dev=80%, energy_dev=80%
    # raw_score = 0.3(90) + 0.3(90) + 0.2(80) + 0.2(80) = 27 + 27 + 16 + 16 = 86
    chunk_emergency = {
        "pitch_deviation_pct": 90.0,
        "rate_deviation_pct": 90.0,
        "pause_deviation_pct": 80.0,
        "energy_deviation_pct": 80.0,
        "codeword_detected": False,
    }
    out4 = compute_risk(chunk_emergency, baseline)
    assert out4["risk_score"] == 86
    assert out4["level_code"] == 3
    print(f"PASS Case 4: Emergency chunk -> risk_score={out4['risk_score']}, level={out4['level_code']} (emergency)")

    # Case 5: Codeword override on baseline audio (raw_score=0 -> forced to max(0, 75) = 75)
    out5 = compute_risk(chunk_normal, baseline, codeword_detected=True)
    assert out5["risk_score"] >= 75
    assert out5["signals"]["codeword_detected"] is True
    print(f"PASS Case 5: Codeword detected on calm audio -> forced risk_score={out5['risk_score']} >= 75")

    # Case 6: Speaking rate from words_in_chunk
    # 4s chunk with 16 words -> (16 / 4) * 60 = 240 WPM. Baseline is 150 WPM.
    # rate_dev = (240 - 150) / 150 = 90 / 150 = 60%
    chunk_words = {
        "pitch_mean": 160.0,
        "rms_energy": 0.70,
        "pause_ratio": 0.40,
        "words_in_chunk": 16,
        "codeword_detected": False,
    }
    out6 = compute_risk(chunk_words, baseline)
    assert abs(out6["signals"]["rate_deviation_pct"] - 60.0) < 0.1
    # raw_score = 0.3(0) + 0.3(60) + 0.2(0) + 0.2(0) = 18
    assert out6["risk_score"] == 18
    print(f"PASS Case 6: words_in_chunk (16 words -> 240 WPM) -> rate_dev={out6['signals']['rate_deviation_pct']}%, score={out6['risk_score']}")

    print("\n============================================================")
    print("      ALL TEAM RISK FORMULA UNIT TESTS PASSED (100%)       ")
    print("============================================================\n")

if __name__ == "__main__":
    test_team_risk_formula()
