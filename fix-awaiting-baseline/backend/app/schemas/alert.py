from typing import Any, List
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: str
    date: str
    callWith: str
    duration: str
    peakScore: int
    riskLevel: str
    status: str
    codewordTriggered: bool
    topSignals: List[Any]
