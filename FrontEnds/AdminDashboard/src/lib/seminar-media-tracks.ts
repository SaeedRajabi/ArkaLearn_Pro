/**
 * Tracks that should be attached to video/audio elements.
 * Do NOT require `track.muted === false`: remote WebRTC tracks often stay muted
 * until the first media frames arrive (common on mobile cameras after replaceTrack).
 */
export function isUsableVideoTrack(track: MediaStreamTrack | null | undefined): boolean {
  return !!track && track.kind === 'video' && track.readyState === 'live' && track.enabled !== false;
}

/** True when an audio track can be attached (may still be muted until first packets). */
export function isUsableAudioTrack(track: MediaStreamTrack | null | undefined): boolean {
  return !!track && track.kind === 'audio' && track.readyState === 'live' && track.enabled !== false;
}

export function filterUsableVideoTracks(tracks: MediaStreamTrack[]): MediaStreamTrack[] {
  return tracks.filter(isUsableVideoTrack);
}
