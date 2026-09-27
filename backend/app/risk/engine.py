from typing import Dict, Any, Optional

DEFAULT_BASELINE = {
    "pitch_mean": 160.0,
    "energy_mean": 0.70,
    "speaking_rate_wpm": 140.0,
    "avg_pause_sec": 0.40,
    # Legacy aliases
    "pitch": 160.0,
    "energy": 0.70,
    "speaking_rate": 3.8,
    "pause_duration": 0.40,
}


def _calc_dev_pct(current: float, baseline: float) -> float:
    base = max(abs(baseline), 1e-4)
    ratio = abs(current - baseline) / base
    return min(ratio * 100.0, 100.0)


def compute_risk(
    chunk: Dict[str, Any],
    baseline: Optional[Dict[str, Any]] = None,
    codeword_detected: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Computes vocal distress risk score per team specification:

    INPUT chunk (every ~4 sec of audio):
      pitch_mean, pitch_std, rms_energy, pause_ratio (from librosa)
      words_in_chunk (for speaking rate) or speaking_rate_wpm
      codeword_detected: bool (from transcript match)

    INPUT baseline (computed once, from first 15s calibration):
      pitch_mean, energy_mean, speaking_rate_wpm, avg_pause_sec

    FORMULA:
      raw_score = 0.3*pitch_dev + 0.3*rate_dev + 0.2*pause_dev + 0.2*energy_dev
      if codeword_detected:
          raw_score = max(raw_score, 75)

    LEVELS:
      0: 0–25 (normal)
      1: 26–50 (suspicious)
      2: 51–75 (high risk)
      3: 76–100 (emergency)

    OUTPUT:
      risk_score: 0–100
      level: 0 | 1 | 2 | 3
      signals: { pitch_deviation_pct, rate_deviation_pct, pause_deviation_pct, energy_deviation_pct, codeword_detected }
    """
    base = baseline or DEFAULT_BASELINE

    # Resolve codeword_detected flag
    cw_flag = codeword_detected
    if cw_flag is None:
        cw_flag = bool(chunk.get("codeword_detected", False))

    # 1. Pitch
    pitch_curr = chunk.get("pitch_mean", chunk.get("pitch", base.get("pitch_mean", 160.0)))
    pitch_base = base.get("pitch_mean", base.get("pitch", 160.0))
    if "pitch_deviation_pct" in chunk:
        pitch_dev = float(chunk["pitch_deviation_pct"])
    elif "pitch_deviation" in chunk:
        d = float(chunk["pitch_deviation"])
        pitch_dev = d * 100.0 if d <= 1.0 else d
    else:
        pitch_dev = _calc_dev_pct(pitch_curr, pitch_base)

    # 2. Speaking Rate (words_in_chunk -> speaking_rate_wpm for ~4s chunk)
    rate_base = base.get("speaking_rate_wpm", base.get("speaking_rate", 140.0))
    if "speaking_rate_wpm" in chunk:
        rate_curr = float(chunk["speaking_rate_wpm"])
    elif "words_in_chunk" in chunk:
        chunk_duration = float(chunk.get("chunk_duration", 4.0))
        words = float(chunk["words_in_chunk"])
        rate_curr = (words / chunk_duration) * 60.0
    elif "speaking_rate" in chunk:
        rate_curr = float(chunk["speaking_rate"])
    else:
        rate_curr = float(rate_base)

    if "rate_deviation_pct" in chunk:
        rate_dev = float(chunk["rate_deviation_pct"])
    elif "speech_rate_deviation" in chunk:
        d = float(chunk["speech_rate_deviation"])
        rate_dev = d * 100.0 if d <= 1.0 else d
    else:
        rate_dev = _calc_dev_pct(rate_curr, rate_base)

    # 3. Pause
    pause_curr = chunk.get("pause_ratio", chunk.get("pause_duration", base.get("avg_pause_sec", 0.40)))
    pause_base = base.get("avg_pause_sec", base.get("pause_duration", 0.40))
    if "pause_deviation_pct" in chunk:
        pause_dev = float(chunk["pause_deviation_pct"])
    elif "pause_deviation" in chunk:
        d = float(chunk["pause_deviation"])
        pause_dev = d * 100.0 if d <= 1.0 else d
    else:
        pause_dev = _calc_dev_pct(pause_curr, pause_base)

    # 4. Energy (rms_energy)
    energy_curr = chunk.get("rms_energy", chunk.get("energy", base.get("energy_mean", 0.70)))
    energy_base = base.get("energy_mean", base.get("energy", 0.70))
    if "energy_deviation_pct" in chunk:
        energy_dev = float(chunk["energy_deviation_pct"])
    elif "energy_deviation" in chunk:
        d = float(chunk["energy_deviation"])
        energy_dev = d * 100.0 if d <= 1.0 else d
    else:
        energy_dev = _calc_dev_pct(energy_curr, energy_base)

    # Clamp all deviations to 0.0 - 100.0
    pitch_dev = max(0.0, min(100.0, pitch_dev))
    rate_dev = max(0.0, min(100.0, rate_dev))
    pause_dev = max(0.0, min(100.0, pause_dev))
    energy_dev = max(0.0, min(100.0, energy_dev))

    # EXACT TEAM FORMULA:
    # raw_score = 0.3*pitch_dev + 0.3*rate_dev + 0.2*pause_dev + 0.2*energy_dev
    raw_score = (
        (0.3 * pitch_dev) +
        (0.3 * rate_dev) +
        (0.2 * pause_dev) +
        (0.2 * energy_dev)
    )

    # if codeword_detected, force raw_score = max(raw_score, 75)
    if cw_flag:
        raw_score = max(raw_score, 75.0)

    # Clamp to 0-100 range
    risk_score = int(round(min(max(raw_score, 0.0), 100.0)))

    # Levels: 0–25 / 26–50 / 51–75 / 76–100
    # level: 0 (normal) / 1 (suspicious) / 2 (high risk) / 3 (emergency)
    if risk_score <= 25:
        level_code = 0
        level_name = "NORMAL"
    elif risk_score <= 50:
        level_code = 1
        level_name = "ELEVATED TENSION"  # Suspicious tier
    elif risk_score <= 75:
        level_code = 2
        level_name = "CRITICAL DISTRESS"  # High risk tier
    else:
        level_code = 3
        level_name = "CRITICAL DISTRESS"  # Emergency tier

    # Signals dictionary as specified by team:
    # signals: { pitch_deviation_pct, rate_deviation_pct, pause_deviation_pct, codeword_detected }
    signals_dict = {
        "pitch_deviation_pct": round(pitch_dev, 1),
        "rate_deviation_pct": round(rate_dev, 1),
        "pause_deviation_pct": round(pause_dev, 1),
        "energy_deviation_pct": round(energy_dev, 1),
        "codeword_detected": cw_flag,
    }

    # UI Explainability items list for ExplainabilityPanel.jsx
    ui_signals = []
    if cw_flag:
        ui_signals.append({
            "name": "Distress Codeword Match",
            "contribution": "+50%",
            "level": "CRITICAL",
            "details": "Authenticated acoustic/transcript distress codeword verified.",
        })
    if risk_score > 25:
        if pitch_dev > 5.0:
            ui_signals.append({
                "name": "Pitch Volatility & Tremor",
                "contribution": f"+{int(pitch_dev * 0.3)}%",
                "level": "HIGH" if risk_score > 50 else "MODERATE",
                "details": f"Vocal pitch diverged {pitch_dev:.1f}% from baseline.",
            })
        if rate_dev > 4.0:
            ui_signals.append({
                "name": "Speech Rate Perturbation",
                "contribution": f"+{int(rate_dev * 0.3)}%",
                "level": "MODERATE",
                "details": f"Syllabic speaking rate diverged {rate_dev:.1f}%.",
            })
        if pause_dev > 3.0:
            ui_signals.append({
                "name": "Hesitation & Abnormal Pauses",
                "contribution": f"+{int(pause_dev * 0.2)}%",
                "level": "MODERATE",
                "details": f"Inter-word silence length shifted {pause_dev:.1f}%.",
            })
        if energy_dev > 3.0:
            ui_signals.append({
                "name": "RMS Vocal Energy Shift",
                "contribution": f"+{int(energy_dev * 0.2)}%",
                "level": "MODERATE",
                "details": f"Vocal intensity shifted {energy_dev:.1f}%.",
            })

    return {
        "risk_score": risk_score,
        "score": risk_score,  # alias for backward compatibility
        "level": level_name,  # string name for UI badge & state machine
        "level_code": level_code,  # numeric level: 0, 1, 2, 3 per team spec
        "signals": signals_dict,  # exact team dict format
        "contributing_signals": ui_signals,  # UI friendly attribution list
        "ui_signals": ui_signals,
    }


def fuse_risk(
    features: Dict[str, Any],
    codeword_detected: bool = False,
    baseline: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Compatibility alias mapping to compute_risk."""
    return compute_risk(features, baseline=baseline, codeword_detected=codeword_detected)
