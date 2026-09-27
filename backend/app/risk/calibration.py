import asyncio
import logging
from typing import Callable, Coroutine, Any, Optional

from app.config import CALIBRATION_SECONDS

logger = logging.getLogger("vigil.calibration")


class CalibrationTimer:
    def __init__(
        self,
        call_id: str,
        total_seconds: int = CALIBRATION_SECONDS,
        step_seconds: int = 4,
        on_progress: Optional[Callable[[dict], Coroutine[Any, Any, None]]] = None,
        on_complete: Optional[Callable[[], Coroutine[Any, Any, None]]] = None,
    ):
        self.call_id = call_id
        self.total_seconds = total_seconds
        self.step_seconds = step_seconds
        self.on_progress = on_progress
        self.on_complete = on_complete
        self.task: Optional[asyncio.Task] = None
        self.is_complete = False

    async def _run(self):
        try:
            elapsed = 0
            while elapsed < self.total_seconds:
                remaining = self.total_seconds - elapsed
                progress = int((elapsed / max(self.total_seconds, 1)) * 100)
                event = {
                    "type": "calibration_progress",
                    "payload": {
                        "secondsRemaining": remaining,
                        "progress": progress,
                    },
                }
                if self.on_progress:
                    await self.on_progress(event)

                step = min(self.step_seconds, self.total_seconds - elapsed)
                await asyncio.sleep(step)
                elapsed += step

            self.is_complete = True
            complete_event = {
                "type": "calibration_progress",
                "payload": {
                    "secondsRemaining": 0,
                    "progress": 100,
                },
            }
            if self.on_progress:
                await self.on_progress(complete_event)
            if self.on_complete:
                await self.on_complete()

        except asyncio.CancelledError:
            logger.debug(f"Calibration timer cancelled for call '{self.call_id}'")

    def start(self):
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self._run())

    def stop(self):
        if self.task and not self.task.done():
            self.task.cancel()
