from datetime import datetime
from typing import Optional, Dict, Any


class EscalationStateMachine:
    def __init__(self, call_id: str):
        self.call_id = call_id
        self.current_score = 0
        self.current_level = "NORMAL"
        self.alert_status = "idle"  # idle | alert_pending | alert_dispatched | cancelled_by_user
        self.alert_sent_timestamp: Optional[str] = None
        self.peak_score = 0
        self.codeword_triggered = False

    def update(
        self,
        score: int,
        level: str,
        codeword_detected: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Updates state with new risk metrics.
        Returns alert_status payload if an escalation event should be emitted.
        """
        self.current_score = score
        self.current_level = level
        self.peak_score = max(self.peak_score, score)

        if codeword_detected:
            self.codeword_triggered = True

        if (level == "CRITICAL DISTRESS" or codeword_detected) and self.alert_status != "alert_dispatched":
            # Escalate directly to alert_dispatched
            self.alert_status = "alert_dispatched"
            self.alert_sent_timestamp = datetime.utcnow().isoformat()
            return {
                "status": "alert_dispatched",
                "timestamp": self.alert_sent_timestamp,
            }

        return None

    def cancel(self) -> Dict[str, Any]:
        """
        Neutralizes active alert and resets risk score per Section I.
        """
        self.alert_status = "cancelled_by_user"
        self.codeword_triggered = False
        self.current_score = 15
        self.current_level = "NORMAL"
        timestamp = datetime.utcnow().isoformat()
        return {
            "status": "cancelled_by_user",
            "timestamp": timestamp,
        }
