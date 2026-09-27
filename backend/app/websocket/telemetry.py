import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

logger = logging.getLogger("vigil.websocket")
router = APIRouter()


@router.websocket("/ws/telemetry")
async def websocket_telemetry(
    websocket: WebSocket,
    call_id: Optional[str] = Query(None),
):
    await websocket.accept()
    effective_call_id = call_id or "default_call"
    logger.info(f"WebSocket client connected with call_id: {effective_call_id}")

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
                msg_type = message.get("type", "echo")
                payload = message.get("payload", {})

                # Echo back envelope for initial echo server verification
                response = {"type": msg_type, "payload": payload}
                await websocket.send_text(json.dumps(response))
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "payload": {"message": "Invalid JSON envelope"},
                }
                await websocket.send_text(json.dumps(error_response))
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {effective_call_id}")
