import re
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.codeword import Codeword


class CodewordMatcher:
    def __init__(
        self,
        distress_codeword: str = "Silver Willow",
        cancellation_phrase: str = "Status Clear Blue",
        allow_cancellation: bool = True,
    ):
        self.distress_codeword = distress_codeword.strip()
        self.cancellation_phrase = cancellation_phrase.strip()
        self.allow_cancellation = allow_cancellation

    def check_text(self, text: str) -> Optional[str]:
        """
        Scans spoken transcript for distress codeword or cancellation phrase.
        Returns 'distress', 'cancellation', or None.
        """
        if not text:
            return None

        clean_text = text.lower().strip()
        normalized_text = re.sub(r'[^a-z0-9]', '', clean_text)

        if self.allow_cancellation and self.cancellation_phrase:
            norm_cancel = re.sub(r'[^a-z0-9]', '', self.cancellation_phrase.lower())
            cancel_parts = [p.strip().lower() for p in self.cancellation_phrase.split() if len(p.strip()) > 2]
            if (
                self.cancellation_phrase.lower() in clean_text
                or (norm_cancel and norm_cancel in normalized_text)
                or (cancel_parts and all(p in clean_text for p in cancel_parts))
            ):
                return "cancellation"

        if self.distress_codeword:
            norm_distress = re.sub(r'[^a-z0-9]', '', self.distress_codeword.lower())
            distress_parts = [p.strip().lower() for p in self.distress_codeword.split() if len(p.strip()) > 2]
            if (
                self.distress_codeword.lower() in clean_text
                or (norm_distress and norm_distress in normalized_text)
                or (distress_parts and all(p in clean_text for p in distress_parts))
            ):
                return "distress"

        return None


def get_active_codeword_matcher(db: Optional[Session] = None) -> CodewordMatcher:
    if db:
        record = db.query(Codeword).order_by(Codeword.id.desc()).first()
        if record:
            return CodewordMatcher(
                distress_codeword=record.distress_codeword,
                cancellation_phrase=record.cancellation_phrase,
                allow_cancellation=record.allow_cancellation,
            )
    return CodewordMatcher()
