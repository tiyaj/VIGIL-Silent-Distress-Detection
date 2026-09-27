import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.websocket.manager import room_manager
from app.services.ml_bridge import process_audio_chunk
from app.websocket.session import get_or_create_session, cleanup_session_if_empty

logger = logging.getLogger("vigil.websocket")
router = APIRouter()

SIGNALING_TYPES = {"offer", "answer", "ice_candidate"}


@router.websocket("/ws/telemetry")
async def websocket_telemetry(
    websocket: WebSocket,
    call_id: Optional[str] = Query(None),
):
    await websocket.accept()
    effective_call_id = call_id or "default_call"
    await room_manager.connect(websocket, effective_call_id)
    session = get_or_create_session(effective_call_id)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
                msg_type = message.get("type", "")
                payload = message.get("payload", {})

                if msg_type in SIGNALING_TYPES:
                    await room_manager.relay_to_peers(
                        sender=websocket,
                        call_id=effective_call_id,
                        message={"type": msg_type, "payload": payload},
                    )
                elif msg_type == "audio_chunk":
                    chunk_b64 = payload.get("chunk", "")
                    mime_type = payload.get("mimeType", "audio/webm;codecs=opus")
                    await session.handle_audio_chunk(chunk_b64, mime_type)
                elif msg_type == "codeword_detected":
                    await session.trigger_codeword(payload.get("codeword"))
                elif msg_type == "transcript":
                    text = payload.get("text", "")
                    logger.info(f"Call '{effective_call_id}': Spoken transcript received: '{text}'")
                    await session.handle_transcript(text)
                elif msg_type == "start_calibration":
                    session.start_calibration()
                else:
                    response = {"type": msg_type, "payload": payload}
                    await websocket.send_text(json.dumps(response))

            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "payload": {"message": "Invalid JSON envelope"},
                }
                await websocket.send_text(json.dumps(error_response))
    except (WebSocketDisconnect, Exception) as e:
        logger.info(f"WebSocket closed for call '{effective_call_id}': {e}")
    finally:
        await room_manager.disconnect(websocket, effective_call_id)
        cleanup_session_if_empty(effective_call_id)
