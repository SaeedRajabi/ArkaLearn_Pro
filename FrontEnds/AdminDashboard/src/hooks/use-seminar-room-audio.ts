'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PeerConnectionState } from '@/hooks/use-webrtc';
import {
  applyAudioOutputDevice,
  bindAudioElement,
  resolvePeerAudioTracks,
} from '@/lib/seminar-room-audio';

type UseSeminarRoomAudioOptions = {
  /** Teacher / host peer whose voice students should hear. */
  teacherPeer: PeerConnectionState | null;
  /** All remote peers (student mics, etc.). */
  peers: PeerConnectionState[];
  /** When true, route teacher audio to the dedicated element. */
  playTeacherAudio: boolean;
  /** Connection ids to skip for peer audio (e.g. teacher shown on stage). */
  excludePeerAudioIds?: ReadonlySet<string>;
  /** Preferred audio output device id (speaker / headset). */
  speakerDeviceId?: string | null;
};

/**
 * Manages hidden HTMLAudioElement playback for WebRTC remote audio.
 * Keeps video elements video-only so screen/webcam routing stays unchanged.
 */
export function useSeminarRoomAudio({
  teacherPeer,
  peers,
  playTeacherAudio,
  excludePeerAudioIds,
  speakerDeviceId,
}: UseSeminarRoomAudioOptions) {
  const teacherAudioRef = useRef<HTMLAudioElement>(null);
  const peerAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const registerPeerAudioRef = (connectionId: string, el: HTMLAudioElement | null) => {
    if (el) {
      peerAudioRefs.current.set(connectionId, el);
      const peer = peers.find((item) => item.connectionId === connectionId);
      bindAudioElement(el, excludePeerAudioIds?.has(connectionId) ? [] : resolvePeerAudioTracks(peer));
      void applyAudioOutputDevice(el, speakerDeviceId);
    } else {
      peerAudioRefs.current.delete(connectionId);
    }
  };

  useEffect(() => {
    if (!playTeacherAudio) {
      bindAudioElement(teacherAudioRef.current, []);
      return;
    }
    bindAudioElement(teacherAudioRef.current, resolvePeerAudioTracks(teacherPeer));
  }, [teacherPeer, playTeacherAudio, teacherPeer?.stream, teacherPeer?.pc]);

  useEffect(() => {
    peers.forEach((peer) => {
      const el = peerAudioRefs.current.get(peer.connectionId);
      if (!el) return;
      if (excludePeerAudioIds?.has(peer.connectionId)) {
        bindAudioElement(el, []);
        return;
      }
      bindAudioElement(el, resolvePeerAudioTracks(peer));
    });
  }, [peers, excludePeerAudioIds]);

  useEffect(() => {
    void applyAudioOutputDevice(teacherAudioRef.current, speakerDeviceId);
    peerAudioRefs.current.forEach((el) => {
      void applyAudioOutputDevice(el, speakerDeviceId);
    });
  }, [speakerDeviceId, peers, playTeacherAudio]);

  const unlockAllAudio = useCallback(async () => {
    const elements = [teacherAudioRef.current, ...peerAudioRefs.current.values()].filter(
      (el): el is HTMLAudioElement => !!el && !!el.srcObject
    );
    const results = await Promise.all(
      elements.map(async (el) => {
        try {
          el.muted = false;
          await el.play();
          return true;
        } catch {
          return false;
        }
      })
    );
    const ok = results.every(Boolean);
    setNeedsAudioUnlock(!ok);
    return ok;
  }, []);

  useEffect(() => {
    void unlockAllAudio();
    const retry = () => { void unlockAllAudio(); };
    window.addEventListener('pointerdown', retry);
    window.addEventListener('keydown', retry);
    return () => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('keydown', retry);
    };
  }, [peers, unlockAllAudio]);

  return { teacherAudioRef, registerPeerAudioRef, unlockAllAudio, needsAudioUnlock };
}
