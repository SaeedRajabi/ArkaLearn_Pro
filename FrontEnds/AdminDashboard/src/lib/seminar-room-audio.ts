import type { PeerConnectionState } from '@/hooks/use-webrtc';

/** Collect live remote audio tracks from a peer connection (stream + audio receiver fallback). */
export function resolvePeerAudioTracks(peer: PeerConnectionState | null | undefined): MediaStreamTrack[] {
  if (!peer) return [];

  const tracks: MediaStreamTrack[] = [];
  const seen = new Set<string>();

  const add = (track: MediaStreamTrack | null | undefined) => {
    if (!track || track.kind !== 'audio' || track.readyState === 'ended' || seen.has(track.id)) return;
    seen.add(track.id);
    tracks.push(track);
  };

  peer.stream?.getAudioTracks().forEach((t) => add(t));

  if (peer.pc) {
    for (const receiver of peer.pc.getReceivers()) {
      add(receiver.track);
    }
  }

  return tracks;
}

export function bindAudioElement(
  el: HTMLAudioElement | null,
  tracks: MediaStreamTrack[],
  options?: { muted?: boolean }
): void {
  if (!el) return;

  if (tracks.length === 0) {
    if (el.srcObject) {
      el.srcObject = null;
      el.load();
    }
    return;
  }

  const current = el.srcObject instanceof MediaStream ? el.srcObject : null;
  const currentIds = current?.getTracks().map((track) => track.id).sort().join('|') ?? '';
  const nextIds = tracks.map((track) => track.id).sort().join('|');
  // Reassigning srcObject on every render interrupts playout and can leave Safari/Chrome
  // behind the autoplay gate. Preserve the same MediaStream while receiver ids are stable.
  if (!current || currentIds !== nextIds) {
    el.srcObject = new MediaStream(tracks);
  }
  el.muted = options?.muted ?? false;
  el.autoplay = true;
  el.volume = 1;
  void el.play().catch(() => undefined);
}

/** Route playback to a specific audio output device when the browser supports it. */
export async function applyAudioOutputDevice(
  el: HTMLAudioElement | null,
  sinkId: string | null | undefined
): Promise<void> {
  if (!el || !sinkId) return;
  const mediaEl = el as HTMLMediaElement & {
    setSinkId?: (deviceId: string) => Promise<void>;
  };
  if (typeof mediaEl.setSinkId !== 'function') return;
  try {
    await mediaEl.setSinkId(sinkId);
  } catch {
    // Device may have been unplugged; keep default output.
  }
}
