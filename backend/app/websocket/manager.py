import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("vigil.room_manager")


class RoomManager:
    def __init__(self):
        # Maps call_id -> set of active WebSockets
        self.rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, call_id: str):
        if call_id not in self.rooms:
            self.rooms[call_id] = set()
        self.rooms[call_id].add(websocket)
        logger.info(f"Socket connected to room '{call_id}'. Peers in room: {len(self.rooms[call_id])}")

    async def disconnect(self, websocket: WebSocket, call_id: str):
        if call_id in self.rooms:
            self.rooms[call_id].discard(websocket)
            if not self.rooms[call_id]:
                del self.rooms[call_id]
        logger.info(f"Socket disconnected from room '{call_id}'.")

    async def relay_to_peers(self, sender: WebSocket, call_id: str, message: dict):
        peers = self.rooms.get(call_id, set())
        relayed_count = 0
        raw_msg = json.dumps(message)
        for peer in list(peers):
            if peer != sender:
                try:
                    await peer.send_text(raw_msg)
                    relayed_count += 1
                except Exception as e:
                    logger.warning(f"Failed to relay message to a peer in room '{call_id}': {e}")
        return relayed_count

    async def broadcast(self, call_id: str, message: dict):
        peers = self.rooms.get(call_id, set())
        raw_msg = json.dumps(message)
        for peer in list(peers):
            try:
                await peer.send_text(raw_msg)
            except Exception as e:
                logger.warning(f"Failed to broadcast in room '{call_id}': {e}")


room_manager = RoomManager()
