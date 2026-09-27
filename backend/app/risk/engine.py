from typing import Dict, Any, Optional
from app.config import RISK_THRESHOLD_ELEVATED, RISK_THRESHOLD_CRITICAL

DEFAULT_BASELINE = {
    "pitch": 160.0,
    "speaking_rate": 3.8,
    "pause_duration": 0.4,
}


def deviation(current: float, baseline: float) -> float:
    base = max(abs(baseline), 1e-4)
    return abs(current - baseline) / base


def fuse_risk(
    features: Dict[str, Any],
    codeword_detected: bool = False,
    baseline: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Deterministic rule-based risk fusion engine (Section H).
    Keeps 40/70 thresholds and maps to frontend tiers (NORMAL / ELEVATED TENSION / CRITICAL DISTRESS).
    """
    base = baseline or DEFAULT_BASELINE

    pitch_val = features.get("pitch", base["pitch"])
    rate_val = features.get("speaking_rate", base["speaking_rate"])
    pause_val = features.get("pause_duration", base["pause_duration"])

    pitch_dev = features.get("pitch_deviation", deviation(pitch_val, base["pitch"]))
    rate_dev = features.get("speech_rate_deviation", deviation(rate_val, base["speaking_rate"]))
    pause_dev = features.get("pause_deviation", deviation(pause_val, base["pause_duration"]))

    signals = []

    if codeword_detected:
        score = 95
        level_code = 3
        level = "CRITICAL DISTRESS"
        signals.append({
            "name": "Distress Codeword Match",
            "contribution": "+50%",
            "level": "CRITICAL",
            "details": "Authenticated acoustic/transcript distress codeword verified.",
        })
        signals.append({
            "name": "Pitch Shift & Vocal Tension",
            "contribution": "+25%",
            "level": "HIGH",
            "details": f"Fundamental frequency deviated by {pitch_dev * 100:.1f}%.",
        })
    else:
        # Weighted sum: pitch (40%), speech rate (30%), pause (30%)
        weighted_score = (pitch_dev * 0.40) + (rate_dev * 0.30) + (pause_dev * 0.30)
        # Scale to 0-100 score
        score = int(min(max(weighted_score * 100, 10), 100))

        if score >= RISK_THRESHOLD_CRITICAL:
            level_code = 2
            level = "CRITICAL DISTRESS"
        elif score >= RISK_THRESHOLD_ELEVATED:
            level_code = 1
            level = "ELEVATED TENSION"
        else:
            level_code = 0
            level = "NORMAL"

        if score >= RISK_THRESHOLD_ELEVATED:
            if pitch_dev > 0.05:
                signals.append({
                    "name": "Pitch Volatility & Tremor",
                    "contribution": f"+{int(pitch_dev * 50)}%",
                    "level": "HIGH" if score >= RISK_THRESHOLD_CRITICAL else "MODERATE",
                    "details": f"Vocal pitch diverged {pitch_dev * 100:.1f}% from baseline.",
                })
            if rate_dev > 0.04:
                signals.append({
                    "name": "Speech Rate Perturbation",
                    "contribution": f"+{int(rate_dev * 40)}%",
                    "level": "MODERATE",
                    "details": f"Syllabic speaking rate diverged {rate_dev * 100:.1f}%.",
                })
            if pause_dev > 0.03:
                signals.append({
                    "name": "Hesitation & Abnormal Pauses",
                    "contribution": f"+{int(pause_dev * 30)}%",
                    "level": "MODERATE",
                    "details": f"Inter-word silence length shifted {pause_dev * 100:.1f}%.",
                })

    return {
        "score": score,
        "level": level,
        "level_code": level_code,
        "signals": signals,
    }
