'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrack,
  type Participant,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RoomOptions,
} from 'livekit-client';
import type { PeerConnectionState } from '@/hooks/use-webrtc';
import { createLiveKitToken } from '@/services/live-media-transport-settings-api.service';

/** ورودی پل رسانه SFU؛ identity از اتصال SignalR می‌آید و با اتصال مجدد آن تغییر می‌کند. */
type UseLiveKitRoomArgs = {
  enabled: boolean;
  meetingId: string;
  identity: string | null;
  displayName: string;
  userId?: string;
  canPublish: boolean;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
};

/** متادیتای نمایشی شرکت‌کننده را می‌خواند؛ JSON نامعتبر مانع نمایش سایر شرکت‌کنندگان نمی‌شود. */
function parseMeta(participant: Participant): { userId?: string; avatar?: string } {
  try {
    const raw = participant.metadata;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { id?: string; avatar?: string };
    return { userId: parsed.id, avatar: parsed.avatar };
  } catch {
    return {};
  }
}

/** قالب مشترک نمایش همتا را برای SFU می‌سازد؛ RTCPeerConnection در این حالت در اختیار SDK است. */
function emptyPeer(
  connectionId: string,
  userName: string,
  userId?: string,
  avatar?: string
): PeerConnectionState {
  return {
    connectionId,
    userId,
    userName,
    avatar,
    pc: null,
    stream: null,
    screenStream: null,
  };
}

/**
 * اتصال به LiveKit، نگاشت trackهای دریافتی به مدل نمایش کلاس و انتشار رسانه محلی.
 * کنترل حضور و مجوزهای رابط همچنان از SignalR می‌آید؛ این Hook جایگزین MeetingHub نیست.
 * isConnected فعلی فقط پس از connect و cleanup/خطای اولیه تنظیم می‌شود و وضعیت رویدادهای
 * Reconnecting، Reconnected و Disconnected سرور LiveKit را دنبال نمی‌کند.
 */
export function useLiveKitRoom({
  enabled,
  meetingId,
  identity,
  displayName,
  userId,
  canPublish,
  localStream,
  screenStream,
}: UseLiveKitRoomArgs) {
  const [peers, setPeers] = useState<Record<string, PeerConnectionState>>({});
  const [isConnected, setIsConnected] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const publishedCameraRef = useRef<LocalTrack | null>(null);
  const publishedMicRef = useRef<LocalTrack | null>(null);
  const publishedScreenRef = useRef<LocalTrack | null>(null);
  const publishedScreenAudioRef = useRef<LocalTrack | null>(null);

  /** trackهای زنده را جمع می‌کند؛ صدای دریافتی در stream اصلی و تصویر اشتراک صفحه جدا قرار می‌گیرد. */
  const upsertPeerTracks = useCallback((participant: Participant) => {
    const connectionId = participant.identity;
    if (!connectionId) return;
    const meta = parseMeta(participant);
    setPeers((prev) => {
      const existing = prev[connectionId] ?? emptyPeer(
        connectionId,
        participant.name || connectionId,
        meta.userId,
        meta.avatar
      );
      let cam: MediaStream | null = existing.stream;
      let screen: MediaStream | null = existing.screenStream;

      const camTracks: MediaStreamTrack[] = [];
      const screenTracks: MediaStreamTrack[] = [];
      const audioTracks: MediaStreamTrack[] = [];

      participant.trackPublications.forEach((pub) => {
        const track = pub.track;
        if (!track || (track.kind !== 'audio' && track.kind !== 'video')) return;
        const media = track.mediaStreamTrack;
        if (!media || media.readyState === 'ended') return;
        if (track.kind === 'audio') {
          audioTracks.push(media);
          return;
        }
        if (pub.source === Track.Source.ScreenShare) {
          screenTracks.push(media);
        } else {
          camTracks.push(media);
        }
      });

      if (camTracks.length || audioTracks.length) {
        cam = new MediaStream([...camTracks, ...audioTracks]);
      } else {
        cam = null;
      }
      screen = screenTracks.length ? new MediaStream(screenTracks) : null;

      return {
        ...prev,
        [connectionId]: {
          ...existing,
          userName: participant.name || existing.userName,
          userId: meta.userId ?? existing.userId,
          avatar: meta.avatar ?? existing.avatar,
          stream: cam,
          screenStream: screen,
        },
      };
    });
  }, []);

  /** شرکت‌کننده خارج‌شده را از فهرست قابل نمایش حذف می‌کند. */
  const removePeer = useCallback((connectionId: string) => {
    setPeers((prev) => {
      if (!prev[connectionId]) return prev;
      const next = { ...prev };
      delete next[connectionId];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !meetingId || !identity) {
      setIsConnected(false);
      setPeers({});
      return;
    }

    // هر تغییر هویت یا وابستگی این effect، اتاق قبلی را می‌بندد و توکن/اتصال جدید می‌سازد.
    let cancelled = false;
    const roomOptions: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
    };
    const room = new Room(roomOptions);
    roomRef.current = room;

    const onTrackSubscribed = (
      _track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: Participant
    ) => {
      upsertPeerTracks(participant);
    };
    const onTrackUnsubscribed = (
      _track: RemoteTrack,
      _publication: RemoteTrackPublication,
      participant: Participant
    ) => {
      upsertPeerTracks(participant);
    };
    const onParticipantConnected = (participant: Participant) => {
      upsertPeerTracks(participant);
    };
    const onParticipantDisconnected = (participant: Participant) => {
      removePeer(participant.identity);
    };

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.TrackMuted, (_pub, participant) => upsertPeerTracks(participant));
    room.on(RoomEvent.TrackUnmuted, (_pub, participant) => upsertPeerTracks(participant));

    void (async () => {
      try {
        const tokenRes = await createLiveKitToken({
          roomName: meetingId,
          identity,
          displayName,
          // Token always allows publish; UI/hub still gate which tracks are sent.
          canPublish: true,
        });
        if (cancelled) return;
        if (!tokenRes.token || !tokenRes.url) {
          console.error('[LiveKit] token endpoint returned empty credentials');
          return;
        }
        // آدرس مستقیماً از API می‌آید؛ مسیر پروتکل سیگنالینگ را SDK به آن اضافه می‌کند.
        // تنظیمات TURN مربوط به Mesh به این فراخوانی تزریق نشده‌اند؛ ICE این اتصال را LiveKit مدیریت می‌کند.
        await room.connect(tokenRes.url, tokenRes.token);
        if (cancelled) {
          await room.disconnect();
          return;
        }
        await room.localParticipant.setName(displayName);
        if (userId) {
          await room.localParticipant.setMetadata(JSON.stringify({ id: userId }));
        }
        setIsConnected(true);
        room.remoteParticipants.forEach((p) => upsertPeerTracks(p));
      } catch (err) {
        // این لایه برای شکست اتصال اولیه دکمه retry یا تلاش مجدد مستقل ندارد؛ خطا فقط ثبت می‌شود.
        console.error('[LiveKit] connect failed', err);
        setIsConnected(false);
      }
    })();

    return () => {
      cancelled = true;
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      void room.disconnect();
      roomRef.current = null;
      publishedCameraRef.current = null;
      publishedMicRef.current = null;
      publishedScreenRef.current = null;
      publishedScreenAudioRef.current = null;
      setIsConnected(false);
      setPeers({});
    };
  }, [
    enabled,
    meetingId,
    identity,
    displayName,
    userId,
    upsertPeerTracks,
    removePeer,
  ]);

  // Publish / unpublish camera + mic from localStream
  // canPublish فقط gate محلی است. false شدن آن در این effect باعث return می‌شود، نه لغو انتشار trackهای قبلی.
  useEffect(() => {
    const room = roomRef.current;
    if (!enabled || !room || !isConnected || !canPublish) return;

    let cancelled = false;
    void (async () => {
      const lp = room.localParticipant;
      const video = localStream?.getVideoTracks().find((t) => t.readyState === 'live') ?? null;
      const audio = localStream?.getAudioTracks().find((t) => t.readyState === 'live') ?? null;

      try {
        if (video && publishedCameraRef.current?.mediaStreamTrack !== video) {
          if (publishedCameraRef.current) {
            await lp.unpublishTrack(publishedCameraRef.current);
            publishedCameraRef.current = null;
          }
          const pubs = await lp.publishTrack(video, { source: Track.Source.Camera });
          if (!cancelled) publishedCameraRef.current = pubs.track ?? null;
        } else if (!video && publishedCameraRef.current) {
          await lp.unpublishTrack(publishedCameraRef.current);
          publishedCameraRef.current = null;
        }

        if (audio && publishedMicRef.current?.mediaStreamTrack !== audio) {
          if (publishedMicRef.current) {
            await lp.unpublishTrack(publishedMicRef.current);
            publishedMicRef.current = null;
          }
          const pubs = await lp.publishTrack(audio, { source: Track.Source.Microphone });
          if (!cancelled) publishedMicRef.current = pubs.track ?? null;
        } else if (!audio && publishedMicRef.current) {
          await lp.unpublishTrack(publishedMicRef.current);
          publishedMicRef.current = null;
        }
      } catch (err) {
        console.error('[LiveKit] publish AV failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, isConnected, canPublish, localStream]);

  // Publish / unpublish screen share
  // تصویر و صدای اشتراک صفحه publicationهای جدا با source مشخص دارند و مستقل نگهداری می‌شوند.
  useEffect(() => {
    const room = roomRef.current;
    if (!enabled || !room || !isConnected || !canPublish) return;

    let cancelled = false;
    void (async () => {
      const lp = room.localParticipant;
      const video = screenStream?.getVideoTracks().find((t) => t.readyState === 'live') ?? null;
      const audio = screenStream?.getAudioTracks().find((t) => t.readyState === 'live') ?? null;

      try {
        if (video && publishedScreenRef.current?.mediaStreamTrack !== video) {
          if (publishedScreenRef.current) {
            await lp.unpublishTrack(publishedScreenRef.current);
            publishedScreenRef.current = null;
          }
          const pubs = await lp.publishTrack(video, { source: Track.Source.ScreenShare });
          if (!cancelled) publishedScreenRef.current = pubs.track ?? null;
        } else if (!video && publishedScreenRef.current) {
          await lp.unpublishTrack(publishedScreenRef.current);
          publishedScreenRef.current = null;
        }

        if (audio && publishedScreenAudioRef.current?.mediaStreamTrack !== audio) {
          if (publishedScreenAudioRef.current) {
            await lp.unpublishTrack(publishedScreenAudioRef.current);
            publishedScreenAudioRef.current = null;
          }
          const pubs = await lp.publishTrack(audio, {
            source: Track.Source.ScreenShareAudio,
          });
          if (!cancelled) publishedScreenAudioRef.current = pubs.track ?? null;
        } else if (!audio && publishedScreenAudioRef.current) {
          await lp.unpublishTrack(publishedScreenAudioRef.current);
          publishedScreenAudioRef.current = null;
        }
      } catch (err) {
        console.error('[LiveKit] publish screen failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, isConnected, canPublish, screenStream]);

  const peersList = useMemo(() => Object.values(peers), [peers]);

  return {
    peers: peersList,
    isConnected,
  };
}
