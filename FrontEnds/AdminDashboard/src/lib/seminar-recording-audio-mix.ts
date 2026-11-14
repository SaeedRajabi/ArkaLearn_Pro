import type { PeerConnectionState } from '@/hooks/use-webrtc';
import { resolvePeerAudioTracks } from '@/lib/seminar-room-audio';

type NamedTrack = { id: string; track: MediaStreamTrack };

/**
 * Mixes local mic, optional screen-share audio, and remote peer mics into one
 * MediaStreamTrack suitable for MediaRecorder (browsers do not mix multiple
 * audio tracks when passed directly to MediaRecorder).
 */
export class SeminarRecordingAudioMixer {
  private readonly ctx: AudioContext;
  private readonly destination: MediaStreamAudioDestinationNode;
  private readonly sources = new Map<string, MediaStreamAudioSourceNode>();
  private disposed = false;

  constructor() {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx!();
    this.destination = this.ctx.createMediaStreamDestination();
  }

  get mixedTrack(): MediaStreamTrack | null {
    return this.destination.stream.getAudioTracks()[0] ?? null;
  }

  async resume(): Promise<void> {
    if (this.disposed) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => undefined);
    }
  }

  sync(namedTracks: NamedTrack[]): void {
    if (this.disposed) return;

    const nextIds = new Set(namedTracks.map((t) => t.id));
    for (const [id, node] of this.sources) {
      if (!nextIds.has(id)) {
        try {
          node.disconnect();
        } catch {
          /* ignore */
        }
        this.sources.delete(id);
      }
    }

    for (const { id, track } of namedTracks) {
      if (this.sources.has(id)) continue;
      if (track.readyState === 'ended' || track.kind !== 'audio') continue;
      try {
        const source = this.ctx.createMediaStreamSource(new MediaStream([track]));
        source.connect(this.destination);
        this.sources.set(id, source);
      } catch {
        // Track may already be ended or unsupported.
      }
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const node of this.sources.values()) {
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.sources.clear();
    void this.ctx.close().catch(() => undefined);
  }
}

export function collectRecordingAudioTracks(options: {
  localStream?: MediaStream | null;
  screenStream?: MediaStream | null;
  peers?: PeerConnectionState[];
  includeParticipantAudio?: boolean;
}): NamedTrack[] {
  const tracks: NamedTrack[] = [];
  const seen = new Set<string>();

  const add = (id: string, track: MediaStreamTrack | null | undefined) => {
    if (!track || track.kind !== 'audio' || track.readyState === 'ended' || seen.has(track.id)) return;
    seen.add(track.id);
    tracks.push({ id, track });
  };

  options.localStream?.getAudioTracks().forEach((t, i) => add(`local-${t.id || i}`, t));
  options.screenStream?.getAudioTracks().forEach((t, i) => add(`screen-${t.id || i}`, t));

  if (options.includeParticipantAudio !== false && options.peers) {
    for (const peer of options.peers) {
      const peerTracks = resolvePeerAudioTracks(peer);
      peerTracks.forEach((t, i) =>
        add(`peer-${peer.connectionId || peer.userId || 'x'}-${t.id || i}`, t)
      );
    }
  }

  return tracks;
}
