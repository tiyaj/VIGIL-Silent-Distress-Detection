// src/services/webrtc.js
//
// Real RTCPeerConnection between two callers, signaled through the
// VigilSocket (websocket.js). Also captures local mic audio in small
// chunks and ships them over the same socket for Krishna's analysis
// pipeline (matches the plan: "MediaRecorder -> chunked upload over WebSocket").

export function createVigilCall({ socket, localStream, onRemoteStream, onConnectionStateChange }) {
  const iceServers = (import.meta.env.VITE_WEBRTC_ICE_SERVERS || 'stun:stun.l.google.com:19302')
    .split(',')
    .map((url) => ({ urls: url.trim() }));

  const pc = new RTCPeerConnection({ iceServers });
  let recorder = null;

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.onicecandidate = (event) => {
    if (event.candidate) socket.send('ice_candidate', { candidate: event.candidate });
  };

  pc.ontrack = (event) => {
    onRemoteStream?.(event.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    onConnectionStateChange?.(pc.connectionState);
  };

  // Incoming signaling messages relayed by the backend
  socket.on('offer', async ({ sdp }) => {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.send('answer', { sdp: pc.localDescription });
  });

  socket.on('answer', async ({ sdp }) => {
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on('ice_candidate', async ({ candidate }) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[VigilCall] Failed to add ICE candidate', err);
    }
  });

  function startAudioChunkCapture() {
    recorder = new MediaRecorder(localStream, { mimeType: 'audio/webm;codecs=opus' });
    recorder.ondataavailable = async (e) => {
      if (e.data.size === 0 || !recorder || recorder.state === 'inactive') return;
      const buffer = await e.data.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      socket.send('audio_chunk', { chunk: base64, mimeType: 'audio/webm;codecs=opus' });
    };
    recorder.start(4000); // send a chunk every 4s — matches the ML pipeline's analysis window
  }

  return {
    pc,
    async start() {
      startAudioChunkCapture();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.send('offer', { sdp: pc.localDescription });
    },
    stop() {
      recorder?.stop();
      pc.getSenders().forEach((s) => s.track && s.track.stop());
      pc.close();
    },
  };
}
