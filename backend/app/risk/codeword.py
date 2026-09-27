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

        clean_text = text.lower()

        if self.allow_cancellation and self.cancellation_phrase:
            if self.cancellation_phrase.lower() in clean_text:
                return "cancellation"

        if self.distress_codeword and self.distress_codeword.lower() in clean_text:
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
