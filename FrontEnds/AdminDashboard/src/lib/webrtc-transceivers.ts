/** Shared by the room transport and real-browser media regression tests. */
export function ensureMeshTransceivers(pc: RTCPeerConnection, isOfferer: boolean) {
  if (!isOfferer && !pc.remoteDescription) return null;
  const transceivers = pc.getTransceivers();
  const audio = transceivers.find((item) => item.receiver.track.kind === 'audio') ??
    pc.addTransceiver('audio', { direction: 'sendrecv' });
  const videos = transceivers.filter((item) => item.receiver.track.kind === 'video');
  const camera = videos[0] ?? pc.addTransceiver('video', { direction: 'sendrecv' });
  const screen = videos[1] ?? pc.addTransceiver('video', { direction: 'sendrecv' });
  for (const transceiver of [audio, camera, screen]) transceiver.direction = 'sendrecv';
  return { audio, camera, screen };
}
