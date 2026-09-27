import base64
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("vigil.ml_bridge")


class AudioBufferManager:
    """
    Maintains per-session accumulated raw audio buffer to resolve the
    MediaRecorder WebM header-fragment issue.

    Browser's MediaRecorder (with recorder.start(4000)) emits EBML container
    headers ONLY in Chunk 0. Subsequent periodic timeslices are raw Cluster fragments.
    If a decoder attempts to decode an isolated fragment, it fails with missing EBML header.
    
    By accumulating raw chunks into a continuous growing buffer starting with Chunk 0's
    EBML header, the buffer at all times represents a valid, playable WebM container
    that can be decoded by any standard DSP / ML pipeline (librosa, soundfile, ffmpeg, PyAV).
    """

    def __init__(self):
        self._buffers: Dict[str, bytearray] = {}
        self._chunk_counts: Dict[str, int] = {}

    def append_chunk(self, call_id: str, chunk_bytes: bytes) -> bytes:
        if call_id not in self._buffers:
            self._buffers[call_id] = bytearray()
            self._chunk_counts[call_id] = 0

        self._buffers[call_id].extend(chunk_bytes)
        self._chunk_counts[call_id] += 1
        return bytes(self._buffers[call_id])

    def get_buffer(self, call_id: str) -> bytes:
        return bytes(self._buffers.get(call_id, bytearray()))

    def get_chunk_count(self, call_id: str) -> int:
        return self._chunk_counts.get(call_id, 0)

    def clear(self, call_id: str):
        self._buffers.pop(call_id, None)
        self._chunk_counts.pop(call_id, None)


audio_buffer_manager = AudioBufferManager()


def analyze_audio_chunk(
    audio_bytes: bytes,
    accumulated_buffer: Optional[bytes] = None,
    call_id: Optional[str] = None,
    chunk_index: int = 1,
) -> Dict[str, Any]:
    """
    ML bridge entrypoint conforming to Krishna's ML module contract (Section J).
    Receives both the raw incoming chunk and the accumulated growing buffer
    (with the valid EBML header intact at offset 0).
    """
    # When Krishna's ML engine is connected, it decodes the growing buffer or extracts
    # the latest 4s window from accumulated_buffer.
    # Default vocal acoustic features stub matching baseline calibration:
    return {
        "pitch": 165.2,
        "energy": 0.72,
        "speaking_rate": 3.9,
        "pause_duration": 0.45,
        "pitch_deviation": 0.08,
        "speech_rate_deviation": 0.05,
        "pause_deviation": 0.04,
        "chunk_index": chunk_index,
        "buffer_size_bytes": len(accumulated_buffer) if accumulated_buffer else len(audio_bytes),
    }


def process_audio_chunk(
    chunk_base64: str,
    mime_type: str = "audio/webm;codecs=opus",
    call_id: Optional[str] = None,
    accumulated_buffer: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Decodes incoming base64 chunk from WebSocket, appends to the session's
    growing raw buffer (guaranteeing the EBML header at byte 0), and passes
    both to analyze_audio_chunk.
    """
    try:
        chunk_bytes = base64.b64decode(chunk_base64)
        if call_id:
            full_buffer = audio_buffer_manager.append_chunk(call_id, chunk_bytes)
            chunk_idx = audio_buffer_manager.get_chunk_count(call_id)
        elif accumulated_buffer is not None:
            full_buffer = accumulated_buffer
            chunk_idx = 1
        else:
            full_buffer = chunk_bytes
            chunk_idx = 1

        logger.debug(
            f"Call '{call_id}': Chunk #{chunk_idx} received ({len(chunk_bytes)} bytes, growing buffer: {len(full_buffer)} bytes)"
        )
        return analyze_audio_chunk(
            audio_bytes=chunk_bytes,
            accumulated_buffer=full_buffer,
            call_id=call_id,
            chunk_index=chunk_idx,
        )
    except Exception as e:
        logger.warning(f"Failed to decode audio chunk: {e}")
        return {}
