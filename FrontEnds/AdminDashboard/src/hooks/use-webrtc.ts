import { useEffect, useRef, useState, useCallback, useMemo, type MutableRefObject } from 'react';
import * as signalR from '@microsoft/signalr';
import { getMeetingHubUrl, getWebRtcPeerConnectionConfig, isProxiedMeetingHubUrl } from '@/lib/api-config';
import {
  createHubInvokeChain,
  createMeetingHubReconnectDelays,
  enqueueHubInvoke,
  isBenignSignalTransportError,
} from '@/lib/meeting-hub-transport';
import { SeminarUser } from '@/lib/types';
import { getRoomJoinTicket } from '@/lib/room-join-ticket';
import { ensureMeshTransceivers } from '@/lib/webrtc-transceivers';

function isBenignNegotiationAbortMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('stopped during negotiation') ||
    m.includes('connection was stopped during negotiation') ||
    (m.includes('failed to start the connection') && m.includes('stopped'))
  );
}

function isBenignWebRtcSignalError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase();
  return (
    msg.includes('called in wrong state') ||
    msg.includes('wrong state') ||
    msg.includes('error processing ice candidate') ||
    msg.includes('invalidstateerror') ||
    msg.includes('operationerror') ||
    msg.includes('setremotedescription') ||
    msg.includes('addicecandidate') ||
    msg.includes('peer connection is closed')
  );
}

function logWebRtcIce(connectionId: string, message: string, level: 'debug' | 'warn' = 'debug'): void {
  const line = `[WebRTC ICE] peer=${connectionId} ${message}`;
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  if (process.env.NODE_ENV === 'development') {
    console.debug(line);
  }
}

function isEndOfIceCandidates(
  candidate: RTCIceCandidateInit | null | undefined
): candidate is null | undefined {
  return candidate == null;
}

function isUsablePeerConnection(
  pc: RTCPeerConnection | null | undefined
): pc is RTCPeerConnection {
  if (!pc) return false;
  return pc.signalingState !== 'closed' && pc.connectionState !== 'closed';
}

/** Hub host flag: organizer/admin (isModerator) or teacher/presenter (isHostTeacher). Do not use ?? — false is a valid isModerator value. */
function resolveJoinAsMeetingHost(options: WebRtcRoomOptions | null | undefined): boolean {
  if (!options) return false;
  return Boolean(options.isModerator || options.isHostTeacher);
}

function registerHubHandlers(
  connection: signalR.HubConnection,
  handlers: Record<string, (...args: unknown[]) => void>
): void {
  for (const [method, handler] of Object.entries(handlers)) {
    connection.on(method, handler);
    const camel =
      method.length > 0 ? method.charAt(0).toLowerCase() + method.slice(1) : method;
    if (camel !== method) connection.on(camel, handler);
    connection.on(method.toLowerCase(), handler);
  }
}

export function isScreenShareVideoTrack(track: MediaStreamTrack): boolean {
  if (track.kind !== 'video') return false;
  const settings = track.getSettings() as { displaySurface?: string };
  const ds = settings.displaySurface;
  if (ds === 'monitor' || ds === 'window' || ds === 'browser') return true;
  const hint = track.contentHint;
  if (hint === 'detail' || hint === 'text') return true;
  const label = (track.label || '').toLowerCase();
  if (
    label.includes('screen') ||
    label.includes('display') ||
    label.includes('window') ||
    label.includes('entire') ||
    label.includes('tab') ||
    label.includes('monitor')
  ) {
    return true;
  }
  return false;
}

/** Ordered video m-lines: slot 0 = webcam, slot 1 = screen share (matches ensurePeerMediaTransceivers). */
export function listVideoTransceiverSlots(pc: RTCPeerConnection): RTCRtpTransceiver[] {
  const transceivers = pc.getTransceivers();
  let firstVideoIdx = 0;
  for (let i = 0; i < transceivers.length; i++) {
    const kind = transceivers[i].receiver.track?.kind ?? transceivers[i].sender.track?.kind;
    if (kind === 'audio') {
      firstVideoIdx = i + 1;
      break;
    }
  }

  const slots: RTCRtpTransceiver[] = [];
  for (let i = firstVideoIdx; i < transceivers.length && slots.length < 2; i++) {
    const t = transceivers[i];
    const kind = t.receiver.track?.kind ?? t.sender.track?.kind;
    if (kind === 'video' || kind === undefined) {
      slots.push(t);
    }
  }
  return slots;
}

function findTransceiverForReceiver(
  pc: RTCPeerConnection,
  receiver: RTCRtpReceiver
): RTCRtpTransceiver | null {
  return pc.getTransceivers().find((t) => t.receiver === receiver) ?? null;
}

function classifyRemoteVideoTrack(
  pc: RTCPeerConnection,
  track: MediaStreamTrack,
  transceiver?: RTCRtpTransceiver | null
): 'camera' | 'screen' {
  const slots = listVideoTransceiverSlots(pc);

  if (transceiver && slots.length >= 2) {
    const slotIdx = slots.indexOf(transceiver);
    if (slotIdx === 1) return 'screen';
    if (slotIdx === 0) return 'camera';
  }

  for (let i = 0; i < slots.length; i++) {
    if (slots[i].receiver.track?.id === track.id) {
      return i === 1 ? 'screen' : 'camera';
    }
  }

  const trIdx = pc.getTransceivers().findIndex((t) => t.receiver.track?.id === track.id);
  if (trIdx >= 0) {
    const audioBefore = pc.getTransceivers().slice(0, trIdx).some(
      (t) => (t.receiver.track?.kind ?? t.sender.track?.kind) === 'audio'
    );
    const videoBefore = pc
      .getTransceivers()
      .slice(0, trIdx)
      .filter((t) => (t.receiver.track?.kind ?? t.sender.track?.kind) === 'video').length;
    if (audioBefore && videoBefore >= 1) return 'screen';
    if (audioBefore && videoBefore === 0) return 'camera';
  }

  return isScreenShareVideoTrack(track) ? 'screen' : 'camera';
}

function publishedMediaSignature(
  localStream: MediaStream | null,
  screenStream: MediaStream | null
): string {
  const parts: string[] = [];
  if (localStream) {
    for (const t of localStream.getTracks()) {
      if (t.readyState === 'ended') continue;
      if (t.kind === 'video' && isScreenShareVideoTrack(t)) continue;
      parts.push(`l:${t.kind}:${t.id}`);
    }
  }
  if (screenStream) {
    for (const t of screenStream.getVideoTracks()) {
      if (t.readyState !== 'ended') parts.push(`s:${t.id}`);
    }
  }
  return parts.sort().join('|');
}

function trackIdsSignature(tracks: MediaStreamTrack[]): string {
  return tracks
    .filter((t) => t.readyState !== 'ended')
    .map((t) => `${t.kind}:${t.id}`)
    .sort()
    .join('|');
}

function streamTrackIdsSignature(stream: MediaStream | null | undefined): string {
  if (!stream) return '';
  return trackIdsSignature(stream.getTracks());
}

/** Mutate an existing MediaStream to match desired tracks; returns the stream (reused or new). */
function reconcileMediaStream(
  existing: MediaStream | null | undefined,
  desired: MediaStreamTrack[]
): MediaStream | null {
  const live = desired.filter((t) => t.readyState !== 'ended');
  if (live.length === 0) return null;

  if (existing && streamTrackIdsSignature(existing) === trackIdsSignature(live)) {
    return existing;
  }

  const next = existing ?? new MediaStream();
  const desiredIds = new Set(live.map((t) => t.id));
  for (const t of [...next.getTracks()]) {
    if (!desiredIds.has(t.id)) next.removeTrack(t);
  }
  const have = new Set(next.getTracks().map((t) => t.id));
  for (const t of live) {
    if (!have.has(t.id)) next.addTrack(t);
  }
  return next;
}

type PeerSenders = {
  connectionId: string;
  pc: RTCPeerConnection;
  audio: RTCRtpSender;
  camera: RTCRtpSender;
  screen: RTCRtpSender;
  screenTransceiver: RTCRtpTransceiver;
};

const signalRLogger: signalR.ILogger = {
  log(logLevel: signalR.LogLevel, message: string): void {
    if (isBenignNegotiationAbortMessage(message) || isBenignSignalTransportError(message)) return;
    switch (logLevel) {
      case signalR.LogLevel.Trace:
      case signalR.LogLevel.Debug:
        if (process.env.NODE_ENV === 'development') console.debug('[SignalR]', message);
        break;
      case signalR.LogLevel.Information:
        console.info('[SignalR]', message);
        break;
      case signalR.LogLevel.Warning:
        console.warn('[SignalR]', message);
        break;
      case signalR.LogLevel.Error:
      case signalR.LogLevel.Critical:
        if (isBenignWebRtcSignalError(message)) {
          if (process.env.NODE_ENV === 'development') console.debug('[SignalR]', message);
        } else {
          console.error('[SignalR]', message);
        }
        break;
      default:
        break;
    }
  },
};

export interface ParticipantGrants {
  voice: boolean;
  video: boolean;
  presenter: boolean;
}

export interface PeerConnectionState {
  connectionId: string;
  userId?: string;
  userName: string;
  avatar?: string;
  /** Null when media is transported via LiveKit SFU instead of mesh WebRTC. */
  pc: RTCPeerConnection | null;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  /** Soft health for UI (ICE blips); does not remove the peer. */
  reconnecting?: boolean;
  /** Bumped when remote tracks unmute so UI rebinds even if track ids are unchanged. */
  mediaEpoch?: number;
}

export type WebRtcRoomOptions = {
  teacherEntersFirst: boolean;
  /** Organizer/admin/presenter — may publish camera, mic, screen. */
  canPublishMedia: boolean;
  /** Organizer/admin — moderates room (initiates to other publishers, force-stop share). */
  isModerator: boolean;
  /** @deprecated Use canPublishMedia */
  isHostTeacher?: boolean;
  onWaitingForTeacher?: () => void;
  onAdmittedToRoom?: () => void;
  onTeacherEndedSession?: () => void;
  onRemoteMicSet?: (muted: boolean) => void;
  onMicPermissionRequested?: (requesterConnectionId: string, requesterName: string) => void;
  onMicPermissionResponded?: (studentConnectionId: string, accepted: boolean) => void;
  onUserLeft?: (connectionId: string) => void;
  onHubConnectionFailed?: () => void;
  onKickedFromMeeting?: (meetingId: string, wasBlocked: boolean) => void;
  onAdminSeatRemoved?: (meetingId: string, action: string, wasBlocked: boolean) => void;
  onJoinDeniedBlocked?: () => void;
  onJoinDeniedRoomFull?: () => void;
  onJoinDeniedGuestCapacityFull?: () => void;
  onJoinDeniedGuestsDisabled?: () => void;
  onJoinDeniedNotInRoom?: () => void;
  onJoinDeniedAlreadyLoggedIn?: () => void;
  onJoinDeniedInvalidTicket?: () => void;
  /** Fired when this tab's session was replaced by a newer connection for the same identity. */
  onSupersededByNewSession?: (meetingId: string) => void;
  onMeetingEnded?: (meetingId: string, reason?: string) => void;
  onParticipantVideoToggled?: (connectionId: string, isVideoOn: boolean) => void;
  onYourRoleChanged?: (role: 'participant' | 'presenter') => void;
  onParticipantMuted?: (connectionId: string, isMuted: boolean) => void;
  onParticipantRoleChanged?: (connectionId: string, role: string) => void;
  onParticipantScreenShared?: (connectionId: string) => void;
  onParticipantScreenShareStopped?: (connectionId: string) => void;
  onScreenShareDenied?: (activeSharerConnectionId: string) => void;
  onRemoteScreenShareStop?: () => void;
  onWebcamOverlayUpdated?: (
    x: number,
    y: number,
    width: number,
    height: number,
    styleJson?: string | null,
    publisherConnectionId?: string | null
  ) => void;
  /** Existing publisher should rebroadcast mic/cam flags when a new peer joins. */
  onResyncMediaStateRequested?: () => void;
  onPeerJoined?: (connectionId: string, meta?: { role?: string; userId?: string; canModerate?: boolean }) => void;
  onPeerRoleDiscovered?: (connectionId: string, role: string, userId?: string, canModerate?: boolean) => void;
  onRoomJoinInitialized?: (payload: RoomJoinInitializedPayload) => void;
  onHubReconnecting?: () => void;
  onHubReconnected?: () => void;
  onHandRaised?: (connectionId: string) => void;
  onHandLowered?: (connectionId: string) => void;
  onChatMessageReceived?: (userName: string, message: string) => void;
  onRoomFilesChanged?: (connectionId: string, userName: string) => void;
  /** When true, MeetingHub still runs but mesh WebRTC peer connections are skipped (LiveKit SFU). */
  skipMeshMedia?: boolean;
  /** Fires when the host changes THIS client's granular permissions (revocation enforcement). */
  onOwnGrantsChanged?: (grants: ParticipantGrants) => void;
  /** Fires when the host changes ANY participant's grants. */
  onParticipantGrantsChanged?: (connectionId: string, grants: ParticipantGrants) => void;
};

export type RoomJoinInitializedPayload = {
  inWaitingRoom: boolean;
  teacherPresent: boolean;
  hostCount: number;
  peers: Array<{
    connectionId: string;
    userName: string;
    role: string;
    canModerate: boolean;
    isPresenter?: boolean;
  }>;
};

function mapHubRoleToClient(role: string): string {
  switch (role.toLowerCase()) {
    case 'teacher':
      return 'organizer';
    case 'moderator':
      return 'admin';
    default:
      return role.toLowerCase();
  }
}

/** Hub seat role plus the server-side presenter grant flag -> client role. */
function resolveHubPeerRole(hubRole: string | undefined, isPresenter?: boolean): string | undefined {
  if (!hubRole) return isPresenter ? 'presenter' : undefined;
  if (isPresenter && hubRole.toLowerCase() === 'student') return 'presenter';
  return mapHubRoleToClient(hubRole);
}

function parseRoomJoinInitialized(raw: unknown): RoomJoinInitializedPayload {
  const data = (raw ?? {}) as Record<string, unknown>;
  const peersRaw = (data.peers ?? data.Peers) as unknown[] | undefined;
  const peers = Array.isArray(peersRaw)
    ? peersRaw.map((p) => {
        const row = (p ?? {}) as Record<string, unknown>;
        return {
          connectionId: String(row.connectionId ?? row.ConnectionId ?? ''),
          userName: String(row.userName ?? row.UserName ?? ''),
          role: String(row.role ?? row.Role ?? 'student'),
          canModerate: Boolean(row.canModerate ?? row.CanModerate ?? false),
          isPresenter: Boolean(row.isPresenter ?? row.IsPresenter ?? false),
        };
      })
    : [];

  return {
    inWaitingRoom: Boolean(data.inWaitingRoom ?? data.InWaitingRoom ?? false),
    teacherPresent: Boolean(data.teacherPresent ?? data.TeacherPresent ?? false),
    hostCount: Number(data.hostCount ?? data.HostCount ?? 0),
    peers,
  };
}

/**
 * چرخه حضور SignalR، پیام‌ها، مجوزهای کلاس و اتصال‌های رسانه Mesh را مدیریت می‌کند.
 * user=null شروع اتصال را تا آماده شدن تنظیمات یا ورود کاربر به تعویق می‌اندازد.
 * در حالت SFU نیز بخش حضور فعال می‌ماند؛ isConnected این Hook وضعیت ورود Hub است، نه سلامت LiveKit.
 */
export function useWebRTC(
  meetingId: string,
  user: SeminarUser | null,
  localStream: MediaStream | null,
  screenStream: MediaStream | null,
  roomOptions: WebRtcRoomOptions | null,
  extraHandlersRef?: { current: Partial<WebRtcRoomOptions> | null },
  studentMicPublishingRef?: MutableRefObject<boolean>
) {
  const [peers, setPeers] = useState<Record<string, PeerConnectionState>>({});
  const [messages, setMessages] = useState<{ user: string; message: string; timestamp: Date }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isHubReconnecting, setIsHubReconnecting] = useState(false);
  const [waitingForTeacher, setWaitingForTeacher] = useState(
    () => Boolean(roomOptions?.teacherEntersFirst && !resolveJoinAsMeetingHost(roomOptions))
  );
  const [hubConnectionId, setHubConnectionId] = useState<string | null>(null);
  const [roomScreenSharerId, setRoomScreenSharerId] = useState<string | null>(null);
  const [roomScreenSharerIds, setRoomScreenSharerIds] = useState<string[]>([]);
  const [raisedHandIds, setRaisedHandIds] = useState<string[]>([]);
  const [participantGrants, setParticipantGrants] = useState<
    Record<string, ParticipantGrants>
  >({});

  const hubConnectionRef = useRef<signalR.HubConnection | null>(null);
  const hubInvokeChainRef = useRef(createHubInvokeChain());
  const prevScreenStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Record<string, PeerConnectionState>>({});
  const participantGrantsRef = useRef<Record<string, ParticipantGrants>>({});
  // Permission events can arrive before React commits the corresponding room options.
  // These refs make transport publication respond to grants immediately.
  const ownGrantsRef = useRef<ParticipantGrants>({ voice: false, video: false, presenter: false });
  const ownPresenterRoleRef = useRef(false);
  const signalingPcRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const peerSendersRef = useRef<Map<string, PeerSenders>>(new Map());
  const lastPublishedSigRef = useRef('');
  const peerScreenOnEndedRef = useRef<Map<string, { trackId: string; handler: () => void }>>(new Map());
  const peerCameraOnEndedRef = useRef<Map<string, { trackId: string; handler: () => void }>>(new Map());
  const remoteVideoIndexRef = useRef<Map<string, number>>(new Map());
  const peerRolesRef = useRef<Map<string, string>>(new Map());
  const remoteUnmuteHookedRef = useRef<Set<string>>(new Set());
  const iceRecoveryTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const peerInitiatorRef = useRef<Map<string, boolean>>(new Map());
  const negotiationDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const roomOptionsRef = useRef(roomOptions);
  const localStreamRef = useRef(localStream);
  const screenStreamRef = useRef(screenStream);
  roomOptionsRef.current = roomOptions;
  localStreamRef.current = localStream;
  screenStreamRef.current = screenStream;

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    participantGrantsRef.current = participantGrants;
  }, [participantGrants]);

  const canPublish = useCallback(
    () =>
      Boolean(
        roomOptionsRef.current?.canPublishMedia ?? roomOptionsRef.current?.isHostTeacher ?? false
      ) || ownPresenterRoleRef.current || ownGrantsRef.current.presenter,
    []
  );
  const canPublishStudentMic = useCallback(
    () => studentMicPublishingRef?.current === true,
    [studentMicPublishingRef]
  );
  const canAttachPublisherMedia = useCallback(
    () => canPublish() || canPublishStudentMic(),
    [canPublish, canPublishStudentMic]
  );
  const skipMeshMedia = useCallback(
    () => roomOptionsRef.current?.skipMeshMedia === true,
    []
  );

  const isPublisherRole = (role: string | undefined) =>
    role === 'organizer' || role === 'admin' || role === 'presenter';

  /**
   * Deterministic offer initiator: for any pair of peers, the side whose hub connection id
   * sorts first creates the offer, the other answers. Exactly one side initiates for every
   * pair (regardless of role), so offer glare cannot happen and both sides always agree.
   */
  const shouldInitiateToPeer = useCallback(
    (connectionId: string) => {
      const selfId = hubConnectionRef.current?.connectionId;
      if (!selfId) return false;
      if (skipMeshMedia()) return false;
      return selfId < connectionId;
    },
    [skipMeshMedia]
  );

  const addPeer = useCallback((connectionId: string, userId: string, userName: string, avatar: string, pc: RTCPeerConnection | null) => {
    setPeers((prev) => {
      const next = { ...prev };
      if (userId) {
        for (const [cid, peer] of Object.entries(next)) {
          if (cid === connectionId) continue;
          if (peer.userId && peer.userId === userId) {
            try {
              peer.pc?.close();
            } catch {
              /* ignore */
            }
            delete next[cid];
            signalingPcRef.current.delete(cid);
            peerSendersRef.current.delete(cid);
            pendingIceRef.current.delete(cid);
            peerRolesRef.current.delete(cid);
            peerInitiatorRef.current.delete(cid);
          }
        }
      }
      next[connectionId] = {
        connectionId,
        userId,
        userName,
        avatar,
        pc,
        stream: null,
        screenStream: null,
        reconnecting: false,
      };
      return next;
    });
  }, []);

  const removePeer = useCallback((connectionId: string) => {
    const recoveryTimer = iceRecoveryTimersRef.current.get(connectionId);
    if (recoveryTimer) {
      clearTimeout(recoveryTimer);
      iceRecoveryTimersRef.current.delete(connectionId);
    }
    signalingPcRef.current.delete(connectionId);
    pendingIceRef.current.delete(connectionId);
    peerSendersRef.current.delete(connectionId);
    peerScreenOnEndedRef.current.get(connectionId)?.handler();
    peerScreenOnEndedRef.current.delete(connectionId);
    peerCameraOnEndedRef.current.get(connectionId)?.handler();
    peerCameraOnEndedRef.current.delete(connectionId);
    remoteVideoIndexRef.current.delete(connectionId);
    peerRolesRef.current.delete(connectionId);
    peerInitiatorRef.current.delete(connectionId);
    setParticipantGrants((prev) => {
      if (!prev[connectionId]) return prev;
      const next = { ...prev };
      delete next[connectionId];
      return next;
    });
    for (const key of [...remoteUnmuteHookedRef.current]) {
      if (key.startsWith(`${connectionId}:`)) remoteUnmuteHookedRef.current.delete(key);
    }
    const negotiationTimer = negotiationDebounceRef.current.get(connectionId);
    if (negotiationTimer) {
      clearTimeout(negotiationTimer);
      negotiationDebounceRef.current.delete(connectionId);
    }
    setPeers((prev) => {
      const newPeers = { ...prev };
      if (newPeers[connectionId]) {
        newPeers[connectionId].pc?.close();
        delete newPeers[connectionId];
      }
      return newPeers;
    });
  }, []);

  const removePeersByUserId = useCallback(
    (userId: string, exceptConnectionId?: string) => {
      if (!userId) return;
      const staleIds: string[] = [];
      for (const [cid, peer] of Object.entries(peersRef.current)) {
        if (exceptConnectionId && cid === exceptConnectionId) continue;
        if (peer.userId && peer.userId === userId) staleIds.push(cid);
      }
      for (const cid of staleIds) {
        removePeer(cid);
      }
    },
    [removePeer]
  );

  const clearPeerCameraStream = useCallback((connectionId: string) => {
    peerCameraOnEndedRef.current.get(connectionId)?.handler();
    peerCameraOnEndedRef.current.delete(connectionId);
    setPeers((prev) => {
      const p = prev[connectionId];
      if (!p?.stream) return prev;
      const audio = p.stream.getAudioTracks().filter((t) => t.readyState !== 'ended');
      if (audio.length === 0) {
        return { ...prev, [connectionId]: { ...p, stream: null } };
      }
      const next = reconcileMediaStream(p.stream, audio);
      if (next === p.stream && p.stream.getVideoTracks().length === 0) return prev;
      return { ...prev, [connectionId]: { ...p, stream: next } };
    });
  }, []);

  const clearPeerScreenStream = useCallback((connectionId: string) => {
    peerScreenOnEndedRef.current.get(connectionId)?.handler();
    peerScreenOnEndedRef.current.delete(connectionId);
    setPeers((prev) => {
      const p = prev[connectionId];
      if (!p?.screenStream) return prev;
      return { ...prev, [connectionId]: { ...p, screenStream: null } };
    });
  }, []);

  const watchRemoteTrack = useCallback(
    (
      connectionId: string,
      track: MediaStreamTrack,
      kind: 'camera' | 'screen',
      onEnded: () => void
    ) => {
      const mapRef = kind === 'screen' ? peerScreenOnEndedRef : peerCameraOnEndedRef;
      const prev = mapRef.current.get(connectionId);
      if (prev?.trackId === track.id) return;

      prev?.handler();

      const handler = () => onEnded();
      // Remote tracks may emit `mute`/`unmute` before the first frame — do NOT clone peer state.

      track.addEventListener('ended', handler);

      mapRef.current.set(connectionId, {
        trackId: track.id,
        handler: () => {
          track.removeEventListener('ended', handler);
        },
      });
    },
    []
  );

  const setPeerScreenStream = useCallback(
    (connectionId: string, track: MediaStreamTrack) => {
      if (track.readyState === 'ended') {
        clearPeerScreenStream(connectionId);
        return;
      }

      watchRemoteTrack(connectionId, track, 'screen', () => clearPeerScreenStream(connectionId));

      setPeers((prev) => {
        const p = prev[connectionId];
        if (!p) return prev;
        const existing = p.screenStream;
        if (existing && streamTrackIdsSignature(existing) === trackIdsSignature([track])) {
          return prev;
        }
        const next = reconcileMediaStream(existing, [track]);
        if (next === existing) return prev;
        return { ...prev, [connectionId]: { ...p, screenStream: next } };
      });
    },
    [clearPeerScreenStream, watchRemoteTrack]
  );

  const syncRemoteTracksFromReceivers = useCallback(
    (connectionId: string, pc: RTCPeerConnection, opts?: { forceUiRefresh?: boolean }) => {
      if (!isUsablePeerConnection(pc)) return;

      let audioTrack: MediaStreamTrack | null = null;
      let cameraTrack: MediaStreamTrack | null = null;
      let screenTrack: MediaStreamTrack | null = null;

      for (const receiver of pc.getReceivers()) {
        const track = receiver.track;
        if (!track || track.readyState === 'ended') continue;
        const transceiver = findTransceiverForReceiver(pc, receiver);
        if (track.kind === 'audio') {
          audioTrack = track;
          continue;
        }
        if (track.kind === 'video') {
          const role = classifyRemoteVideoTrack(pc, track, transceiver);
          if (role === 'screen') screenTrack = track;
          else cameraTrack = track;
        }
      }

      if (screenTrack) {
        setPeerScreenStream(connectionId, screenTrack);
      } else {
        clearPeerScreenStream(connectionId);
      }

      const mediaTracks: MediaStreamTrack[] = [];
      if (audioTrack) mediaTracks.push(audioTrack);
      if (cameraTrack) mediaTracks.push(cameraTrack);

      if (mediaTracks.length === 0) {
        clearPeerCameraStream(connectionId);
        return;
      }

      const resync = () => syncRemoteTracksFromReceivers(connectionId, pc);
      const forceResync = () => syncRemoteTracksFromReceivers(connectionId, pc, { forceUiRefresh: true });
      const trackToWatch = cameraTrack ?? audioTrack;
      if (trackToWatch) {
        watchRemoteTrack(connectionId, trackToWatch, 'camera', resync);
      }

      // Persist unmute listeners: replaceTrack often reuses the same receiver track id.
      for (const track of mediaTracks) {
        const key = `${connectionId}:${track.id}:unmute`;
        if (!remoteUnmuteHookedRef.current.has(key)) {
          remoteUnmuteHookedRef.current.add(key);
          track.addEventListener('unmute', forceResync);
          track.addEventListener(
            'ended',
            () => {
              remoteUnmuteHookedRef.current.delete(key);
            },
            { once: true }
          );
        }
      }

      setPeers((prev) => {
        const p = prev[connectionId];
        if (!p) return prev;
        const sameIds = streamTrackIdsSignature(p.stream) === trackIdsSignature(mediaTracks);
        if (sameIds && !opts?.forceUiRefresh) {
          return prev;
        }
        if (sameIds && opts?.forceUiRefresh) {
          const refreshed = p.stream
            ? new MediaStream(p.stream.getTracks().filter((t) => t.readyState !== 'ended'))
            : reconcileMediaStream(null, mediaTracks);
          return {
            ...prev,
            [connectionId]: {
              ...p,
              stream: refreshed,
              mediaEpoch: (p.mediaEpoch ?? 0) + 1,
            },
          };
        }
        const next = reconcileMediaStream(p.stream, mediaTracks);
        if (next === p.stream) return prev;
        return { ...prev, [connectionId]: { ...p, stream: next } };
      });
    },
    [
      setPeerScreenStream,
      clearPeerScreenStream,
      clearPeerCameraStream,
      watchRemoteTrack,
    ]
  );

  /**
   * Guarantees the fixed 3-slot m-line layout (audio / webcam / screen) as sendrecv
   * transceivers on EVERY peer connection — teacher, moderator, presenter and pure
   * students alike. With all m-lines present and sendrecv from the start, any role can
   * begin (or stop) publishing later with replaceTrack alone; no SDP renegotiation is
   * ever needed for mic approval, presenter grants, camera or screen toggles.
   */
  const ensurePeerMediaTransceivers = useCallback((connectionId: string, pc: RTCPeerConnection): PeerSenders | null => {
    if (!isUsablePeerConnection(pc)) {
      peerSendersRef.current.delete(connectionId);
      return null;
    }

    // An answerer must adopt the transceivers created by setRemoteDescription.
    // addTransceiver() before the offer creates unassociated local m-lines; media is
    // then attached to those instead of the negotiated receivers (one-way/black video).
    if (!peerInitiatorRef.current.get(connectionId) && !pc.remoteDescription) return null;

    const existing = peerSendersRef.current.get(connectionId);
    if (existing && existing.pc === pc && isUsablePeerConnection(existing.pc)) {
      return existing;
    }
    if (existing) peerSendersRef.current.delete(connectionId);

    const slots = ensureMeshTransceivers(pc, peerInitiatorRef.current.get(connectionId) === true);
    if (!slots) return null;
    const { audio: audioTr, camera: cameraTr, screen: screenTr } = slots;

    const senders: PeerSenders = {
      connectionId,
      pc,
      audio: audioTr.sender,
      camera: cameraTr.sender,
      screen: screenTr.sender,
      screenTransceiver: screenTr,
    };
    peerSendersRef.current.set(connectionId, senders);
    return senders;
  }, []);

  const attachPublisherTracksToSenders = useCallback(async (senders: PeerSenders | null) => {
    if (!senders || !isUsablePeerConnection(senders.pc)) {
      if (senders) peerSendersRef.current.delete(senders.connectionId);
      return;
    }

    const ls = localStreamRef.current;
    const ss = screenStreamRef.current;
    const publishFull = canPublish();
    const publishStudentMic = canPublishStudentMic();
    const audioTrack =
      publishFull || publishStudentMic
        ? ls?.getAudioTracks().find((t) => t.readyState !== 'ended') ?? null
        : null;
    const cameraTrack = publishFull
      ? ls?.getVideoTracks().find((t) => !isScreenShareVideoTrack(t) && t.readyState !== 'ended') ??
        null
      : null;
    const screenTrack = publishFull
      ? ss?.getVideoTracks().find((t) => t.readyState !== 'ended') ?? null
      : null;

    try {
      await senders.audio.replaceTrack(audioTrack);
      await senders.camera.replaceTrack(cameraTrack);
      if (screenTrack) {
        try {
          screenTrack.contentHint = 'detail';
        } catch {
          /* ignore */
        }
      }
      await senders.screen.replaceTrack(screenTrack);
      // Keep screen m-line always sendrecv so attach/detach is replaceTrack-only (no SDP renegotiation storm).
      if (isUsablePeerConnection(senders.pc) && senders.screenTransceiver.direction !== 'sendrecv') {
        senders.screenTransceiver.direction = 'sendrecv';
      }
    } catch (err: unknown) {
      if (!isUsablePeerConnection(senders.pc)) {
        peerSendersRef.current.delete(senders.connectionId);
      }
      if (process.env.NODE_ENV === 'development' && !isBenignWebRtcSignalError(err)) {
        console.debug('[WebRTC] attachPublisherTracks failed', err);
      }
    }
  }, [canPublish, canPublishStudentMic]);

  const invokeHub = useCallback(async (method: string, ...args: unknown[]) => {
    try {
      await enqueueHubInvoke(
        hubInvokeChainRef.current,
        () => hubConnectionRef.current,
        method,
        ...args
      );
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development' && !isBenignSignalTransportError(String(err))) {
        console.debug(`[Hub] ${method} failed`, err);
      }
    }
  }, []);

  const invokeHubOrThrow = useCallback(async (method: string, ...args: unknown[]) => {
    return enqueueHubInvoke(
      hubInvokeChainRef.current,
      () => hubConnectionRef.current,
      method,
      ...args
    );
  }, []);

  const sendOfferToPeer = useCallback(async (connectionId: string, pc: RTCPeerConnection) => {
    const hub = hubConnectionRef.current;
    if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;
    if (!isUsablePeerConnection(pc)) return;

    // Deterministic rule: this side is the only offerer for the pair, so a pending local
    // offer is always our own previous offer already on the wire — never send a duplicate.
    let wait = 0;
    while (pc.signalingState === 'have-local-offer' && wait < 20) {
      await new Promise<void>((r) => setTimeout(r, 100));
      wait++;
    }
    if (pc.signalingState === 'have-local-offer') return;
    if (pc.signalingState === 'have-remote-offer') {
      // Defensive rollback — cannot happen under the deterministic initiator rule.
      try {
        await pc.setLocalDescription({ type: 'rollback' } as RTCLocalSessionDescriptionInit);
      } catch {
        return;
      }
    }
    if (!isUsablePeerConnection(pc) || pc.signalingState !== 'stable') return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      lastPublishedSigRef.current = publishedMediaSignature(
        localStreamRef.current,
        screenStreamRef.current
      );
      await invokeHub(
        'SendSignal',
        connectionId,
        JSON.stringify({ type: 'offer', offer: pc.localDescription })
      );
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development' && !isBenignWebRtcSignalError(err)) {
        console.debug('[WebRTC] sendOffer failed', err);
      }
    }
  }, [invokeHub]);

  const forwardIceCandidate = useCallback(async (connectionId: string, candidate: RTCIceCandidateInit | null) => {
    const hub = hubConnectionRef.current;
    if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;

    try {
      await invokeHub(
        'SendSignal',
        connectionId,
        JSON.stringify({ type: 'candidate', candidate })
      );
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development' && !isBenignWebRtcSignalError(err)) {
        console.debug('[WebRTC] forwardIceCandidate failed', err);
      }
    }
  }, [invokeHub]);

  /** ICE همتای قطع‌شده را restart می‌کند؛ فقط آغازگر تعیین‌شده offer جدید می‌فرستد و TURN جدیدی ایجاد نمی‌شود. */
  const attemptIceRecovery = useCallback(
    async (connectionId: string, pc: RTCPeerConnection) => {
      if (!isUsablePeerConnection(pc)) return;
      const state = pc.iceConnectionState;
      if (state !== 'failed' && state !== 'disconnected') return;

      logWebRtcIce(connectionId, `attempting recovery (state=${state})`, 'warn');

      try {
        if (typeof pc.restartIce === 'function') {
          pc.restartIce();
        }
        // Only the deterministic initiator can carry the ICE restart in a new offer;
        // the answerer picks it up by accepting that offer and re-answering.
        if (peerInitiatorRef.current.get(connectionId)) {
          await sendOfferToPeer(connectionId, pc);
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'development' && !isBenignWebRtcSignalError(err)) {
          console.debug('[WebRTC] ICE recovery failed', err);
        }
      }
    },
    [sendOfferToPeer]
  );

  const scheduleRenegotiationForPeer = useCallback(
    (connectionId: string) => {
      const hub = hubConnectionRef.current;
      if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;

      const existing = negotiationDebounceRef.current.get(connectionId);
      if (existing) clearTimeout(existing);

      negotiationDebounceRef.current.set(
        connectionId,
        setTimeout(() => {
          negotiationDebounceRef.current.delete(connectionId);
          void (async () => {
            const peer = peersRef.current[connectionId];
            const pc = peer?.pc;
            if (!pc || !isUsablePeerConnection(pc)) return;
            // Only the deterministic initiator of the pair may send offers.
            if (!peerInitiatorRef.current.get(connectionId)) return;
            const senders = ensurePeerMediaTransceivers(connectionId, pc);
            await attachPublisherTracksToSenders(senders);
            await sendOfferToPeer(connectionId, pc);
          })();
        }, 120)
      );
    },
    [
      ensurePeerMediaTransceivers,
      attachPublisherTracksToSenders,
      sendOfferToPeer,
    ]
  );

  /**
   * رویدادهای ICE/SDP هر همتای Mesh را متصل می‌کند. reconnecting این بخش مخصوص رسانه همان همتاست؛
   * با isHubReconnecting که قطع کانال کنترل SignalR و نمایش لایه تمام‌صفحه را نشان می‌دهد متفاوت است.
   */
  const attachPeerConnectionSignaling = useCallback(
    (connectionId: string, pc: RTCPeerConnection, isInitiator: boolean) => {
      peerInitiatorRef.current.set(connectionId, isInitiator);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          void forwardIceCandidate(connectionId, event.candidate.toJSON());
          return;
        }
        void forwardIceCandidate(connectionId, null);
      };

      pc.onicecandidateerror = (event) => {
        logWebRtcIce(
          connectionId,
          `candidate error code=${event.errorCode} ${event.errorText ?? ''}`,
          event.errorCode === 701 ? 'debug' : 'warn'
        );
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        logWebRtcIce(connectionId, `iceConnectionState=${state}`);

        if (state === 'connected' || state === 'completed') {
          const timer = iceRecoveryTimersRef.current.get(connectionId);
          if (timer) {
            clearTimeout(timer);
            iceRecoveryTimersRef.current.delete(connectionId);
          }
          setPeers((prev) => {
            const p = prev[connectionId];
            if (!p || !p.reconnecting) return prev;
            return { ...prev, [connectionId]: { ...p, reconnecting: false } };
          });
          syncRemoteTracksFromReceivers(connectionId, pc);
          return;
        }

        if (state === 'disconnected') {
          setPeers((prev) => {
            const p = prev[connectionId];
            if (!p || p.reconnecting) return prev;
            return { ...prev, [connectionId]: { ...p, reconnecting: true } };
          });
          const existing = iceRecoveryTimersRef.current.get(connectionId);
          if (existing) clearTimeout(existing);
          iceRecoveryTimersRef.current.set(
            connectionId,
            setTimeout(() => {
              iceRecoveryTimersRef.current.delete(connectionId);
              if (!isUsablePeerConnection(pc)) return;
              const current = pc.iceConnectionState;
              if (current === 'disconnected' || current === 'failed') {
                void attemptIceRecovery(connectionId, pc);
              }
            }, 4000)
          );
          return;
        }

        if (state === 'failed') {
          setPeers((prev) => {
            const p = prev[connectionId];
            if (!p || p.reconnecting) return prev;
            return { ...prev, [connectionId]: { ...p, reconnecting: true } };
          });
          void attemptIceRecovery(connectionId, pc);
        }
      };

      pc.onnegotiationneeded = () => {
        // Deterministic initiator is the only side that (re)offers. Media toggles ride on
        // the pre-negotiated sendrecv m-lines via replaceTrack and never renegotiate.
        if (!isInitiator) return;
        scheduleRenegotiationForPeer(connectionId);
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        logWebRtcIce(connectionId, `connectionState=${state}`);
        if (state === 'connected') {
          setPeers((prev) => {
            const p = prev[connectionId];
            if (!p || !p.reconnecting) return prev;
            return { ...prev, [connectionId]: { ...p, reconnecting: false } };
          });
          syncRemoteTracksFromReceivers(connectionId, pc);
        }
        if (state === 'failed' || state === 'disconnected') {
          setPeers((prev) => {
            const p = prev[connectionId];
            if (!p || p.reconnecting) return prev;
            return { ...prev, [connectionId]: { ...p, reconnecting: true } };
          });
          if (state === 'failed') {
            void attemptIceRecovery(connectionId, pc);
          }
        }
      };
    },
    [
      forwardIceCandidate,
      attemptIceRecovery,
      canAttachPublisherMedia,
      shouldInitiateToPeer,
      scheduleRenegotiationForPeer,
      syncRemoteTracksFromReceivers,
    ]
  );

  const applyPublishedMediaToAllPeers = useCallback(() => {
    const ls = localStreamRef.current;
    const ss = screenStreamRef.current;
    const publishFull = canPublish();
    const publishStudentMic = canPublishStudentMic();
    const audioTrack =
      publishFull || publishStudentMic
        ? ls?.getAudioTracks().find((t) => t.readyState !== 'ended') ?? null
        : null;
    const cameraTrack = publishFull
      ? ls?.getVideoTracks().find((t) => !isScreenShareVideoTrack(t) && t.readyState !== 'ended') ??
        null
      : null;
    const screenTrack = publishFull
      ? ss?.getVideoTracks().find((t) => t.readyState !== 'ended') ?? null
      : null;

    lastPublishedSigRef.current = publishedMediaSignature(ls, ss);

    const peerList = Object.values(peersRef.current);
    void (async () => {
      for (const peer of peerList) {
        const pc = peer.pc;
        if (!isUsablePeerConnection(pc)) continue;

        const senders = ensurePeerMediaTransceivers(peer.connectionId, pc);
        if (!senders) continue;

        try {
          await senders.audio.replaceTrack(audioTrack);
          await senders.camera.replaceTrack(cameraTrack);
          if (screenTrack) {
            try {
              screenTrack.contentHint = 'detail';
            } catch {
              /* ignore */
            }
          }
          await senders.screen.replaceTrack(screenTrack);
          if (isUsablePeerConnection(senders.pc) && senders.screenTransceiver.direction !== 'sendrecv') {
            senders.screenTransceiver.direction = 'sendrecv';
          }
        } catch (err: unknown) {
          if (process.env.NODE_ENV === 'development' && !isBenignWebRtcSignalError(err)) {
            console.debug('[WebRTC] applyPublishedMedia failed', err);
          }
        }
      }
    })();
  }, [
    canAttachPublisherMedia,
    canPublish,
    canPublishStudentMic,
    ensurePeerMediaTransceivers,
  ]);

  const createPeerConnection = useCallback(
    (connectionId: string, userId: string, userName: string, avatar: string, isInitiator: boolean) => {
      if (skipMeshMedia()) {
        return null;
      }

      const existing = signalingPcRef.current.get(connectionId);
      if (existing && isUsablePeerConnection(existing)) {
        // Refresh display metadata (e.g. PC was created early by an incoming offer) without
        // disturbing the live connection.
        setPeers((prev) => {
          const p = prev[connectionId];
          if (!p) return prev;
          if (
            p.userName === userName &&
            (p.userId ?? '') === (userId ?? '') &&
            (p.avatar ?? '') === (avatar ?? '')
          ) {
            return prev;
          }
          return {
            ...prev,
            [connectionId]: {
              ...p,
              userId: userId || p.userId,
              userName,
              avatar: avatar || p.avatar,
            },
          };
        });
        return existing;
      }
      if (existing) {
        peerSendersRef.current.delete(connectionId);
        signalingPcRef.current.delete(connectionId);
      }

      const pc = new RTCPeerConnection(getWebRtcPeerConnectionConfig());

      signalingPcRef.current.set(connectionId, pc);
      remoteVideoIndexRef.current.set(connectionId, 0);
      addPeer(connectionId, userId, userName, avatar, pc);
      attachPeerConnectionSignaling(connectionId, pc, isInitiator);

      pc.ontrack = (event) => {
        const track = event.track;
        if (!track || (track.kind !== 'audio' && track.kind !== 'video')) return;
        // Single path: classify from transceiver slots and reconcile streams idempotently.
        syncRemoteTracksFromReceivers(connectionId, pc);
        // Unmute hooks are registered inside syncRemoteTracksFromReceivers (persistent).
      };

      // Fixed 3-slot m-line layout (audio / webcam / screen) on every connection, any role,
      // BEFORE any SDP exchange — publishing later is replaceTrack-only.
      if (isInitiator) {
        const senders = ensurePeerMediaTransceivers(connectionId, pc);
        void attachPublisherTracksToSenders(senders);
      }
      // The deterministic initiator's negotiationneeded handler sends the offer.

      return pc;
    },
    [
      addPeer,
      skipMeshMedia,
      setPeerScreenStream,
      syncRemoteTracksFromReceivers,
      ensurePeerMediaTransceivers,
      attachPublisherTracksToSenders,
      attachPeerConnectionSignaling,
    ]
  );

  const createPeerConnectionRef = useRef(createPeerConnection);
  createPeerConnectionRef.current = createPeerConnection;
  const removePeerRef = useRef(removePeer);
  removePeerRef.current = removePeer;
  const removePeersByUserIdRef = useRef(removePeersByUserId);
  removePeersByUserIdRef.current = removePeersByUserId;
  const applyPublishedMediaRef = useRef(applyPublishedMediaToAllPeers);
  applyPublishedMediaRef.current = applyPublishedMediaToAllPeers;

  const refreshPublishingAfterRoleChangeImpl = useCallback(
    async (targetConnectionId: string | null | undefined, role: string) => {
      const hub = hubConnectionRef.current;
      if (!hub || hub.state !== signalR.HubConnectionState.Connected) return;

      const selfId = hub.connectionId ?? undefined;
      if (targetConnectionId) peerRolesRef.current.set(targetConnectionId, role);
      if (selfId && targetConnectionId === selfId) {
        peerRolesRef.current.set(selfId, role);
        ownPresenterRoleRef.current = isPublisherRole(role);
      }

      // Grant/revoke of presenter only changes which local tracks we place on the already
      // negotiated sendrecv m-lines — replaceTrack everywhere, no renegotiation.
      // This must also run on revoke so forbidden senders are replaced with null.
      applyPublishedMediaToAllPeers();
    },
    [applyPublishedMediaToAllPeers]
  );

  const roleRefreshChainRef = useRef(Promise.resolve());
  const refreshPublishingAfterRoleChange = useCallback(
    (targetConnectionId: string | null | undefined, role: string) => {
      const next = roleRefreshChainRef.current
        .catch(() => undefined)
        .then(() => refreshPublishingAfterRoleChangeImpl(targetConnectionId, role));
      roleRefreshChainRef.current = next.catch(() => undefined);
      return next;
    },
    [refreshPublishingAfterRoleChangeImpl]
  );

  const refreshPublishingAfterRoleChangeRef = useRef(refreshPublishingAfterRoleChange);
  refreshPublishingAfterRoleChangeRef.current = refreshPublishingAfterRoleChange;

  const tearDownRoomMedia = useCallback(() => {
    iceRecoveryTimersRef.current.forEach((timer) => clearTimeout(timer));
    iceRecoveryTimersRef.current.clear();
    negotiationDebounceRef.current.forEach((timer) => clearTimeout(timer));
    negotiationDebounceRef.current.clear();
    peerInitiatorRef.current.clear();
    Object.values(peersRef.current).forEach((p) => {
      try {
        p.pc?.close();
      } catch {
        /* ignore */
      }
    });
    signalingPcRef.current.clear();
    peerSendersRef.current.clear();
    pendingIceRef.current.clear();
    peerScreenOnEndedRef.current.clear();
    peerCameraOnEndedRef.current.clear();
    remoteVideoIndexRef.current.clear();
    peerRolesRef.current.clear();
    remoteUnmuteHookedRef.current.clear();
    lastPublishedSigRef.current = '';
    setPeers({});
    setRoomScreenSharerId(null);
  }, []);

  useEffect(() => {
    if (!user || !meetingId) return;

    let cancelled = false;
    let startingHub = true;
    let recoveringHub = false;
    setIsHubReconnecting(false);
    const hubUrl = getMeetingHubUrl();
    const hubBuilder = new signalR.HubConnectionBuilder();
    if (isProxiedMeetingHubUrl(hubUrl)) {
      hubBuilder.withUrl(hubUrl, {
        accessTokenFactory: () => user.roomAccessToken ?? '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.LongPolling,
        timeout: 120_000,
      });
    } else {
      hubBuilder.withUrl(hubUrl, {
        accessTokenFactory: () => user.roomAccessToken ?? '',
      });
    }
    const connection = hubBuilder
      .withAutomaticReconnect(createMeetingHubReconnectDelays())
      .withKeepAliveInterval(20_000)
      .withServerTimeout(120_000)
      .configureLogging(signalRLogger)
      .build();

    hubConnectionRef.current = connection;

    const onReceiveParticipantList = (_participants: unknown) => {
      /* Server broadcasts display-name list; peer sync uses SyncExistingPeers / UserJoined. */
    };
    registerHubHandlers(connection, { ReceiveParticipantList: onReceiveParticipantList });

    const registerPeerRole = (
      connectionId: string,
      hubRole: string | undefined,
      userId: string,
      canModerate?: boolean
    ) => {
      if (!connectionId || !hubRole) return;
      const clientRole = mapHubRoleToClient(hubRole);
      peerRolesRef.current.set(connectionId, clientRole);
      roomOptionsRef.current?.onPeerRoleDiscovered?.(connectionId, clientRole, userId, canModerate);
      extraHandlersRef?.current?.onPeerRoleDiscovered?.(connectionId, clientRole, userId, canModerate);
    };

    const registerGrants = (
      connectionId: string,
      voice?: boolean,
      video?: boolean,
      presenter?: boolean
    ) => {
      if (!connectionId) return;
      setParticipantGrants((prev) => {
        const current: ParticipantGrants =
          prev[connectionId] ?? { voice: false, video: false, presenter: false };
        const next: ParticipantGrants = {
          voice: voice ?? current.voice,
          video: video ?? current.video,
          presenter: presenter ?? current.presenter,
        };
        if (
          next.voice === current.voice &&
          next.video === current.video &&
          next.presenter === current.presenter
        ) {
          return prev;
        }
        return { ...prev, [connectionId]: next };
      });
    };

    connection.on(
      'UserJoined',
      (
        rawUserName: string,
        connectionId: string,
        hubRole?: string,
        canModerate?: boolean,
        isPresenter?: boolean,
        voiceGranted?: boolean,
        videoGranted?: boolean
      ) => {
        if (connectionId === connection.connectionId) return;
        let userName = rawUserName;
        let avatar = '';
        let userId = '';
        try {
          const parsed = JSON.parse(rawUserName);
          userName = parsed.name;
          avatar = parsed.avatar;
          userId = parsed.id;
        } catch { /* ignore */ }
        if (userId) {
          removePeersByUserIdRef.current(userId, connectionId);
        }
        registerGrants(connectionId, voiceGranted ?? isPresenter, videoGranted ?? isPresenter, isPresenter);
        registerPeerRole(
          connectionId,
          resolveHubPeerRole(hubRole, isPresenter),
          userId,
          canModerate
        );
        createPeerConnectionRef.current(connectionId, userId, userName, avatar, shouldInitiateToPeer(connectionId));
        roomOptionsRef.current?.onPeerJoined?.(connectionId, { role: hubRole, userId, canModerate });
        extraHandlersRef?.current?.onPeerJoined?.(connectionId, { role: hubRole, userId, canModerate });
        if (canAttachPublisherMedia()) {
          window.setTimeout(() => applyPublishedMediaRef.current(), 150);
        }
      }
    );

    connection.on(
      'SyncExistingPeers',
      (existing: { connectionId: string; userName: string; role?: string; canModerate?: boolean; isPresenter?: boolean; voiceGranted?: boolean; videoGranted?: boolean }[]) => {
        setWaitingForTeacher(false);
        if (!Array.isArray(existing)) return;
        existing.forEach((p) => {
          if (p.connectionId === connection.connectionId) return;
          let userName = p.userName;
          let avatar = '';
          let userId = '';
          try {
            const parsed = JSON.parse(p.userName);
            userName = parsed.name;
            avatar = parsed.avatar;
            userId = parsed.id;
          } catch { /* ignore */ }
          if (userId) {
            removePeersByUserIdRef.current(userId, p.connectionId);
          }
          registerGrants(p.connectionId, p.voiceGranted ?? p.isPresenter, p.videoGranted ?? p.isPresenter, p.isPresenter);
          registerPeerRole(p.connectionId, resolveHubPeerRole(p.role, p.isPresenter), userId, p.canModerate);
          createPeerConnectionRef.current(p.connectionId, userId, userName, avatar, shouldInitiateToPeer(p.connectionId));
        });
      }
    );

    connection.on(
      'ParticipantGrantsChanged',
      (connectionId: string, voice?: boolean, video?: boolean, presenter?: boolean) => {
        registerGrants(connectionId, voice, video, presenter);
        const grants: ParticipantGrants = {
          voice: Boolean(voice),
          video: Boolean(video),
          presenter: Boolean(presenter),
        };
        if (connectionId === connection.connectionId) {
          ownGrantsRef.current = grants;
          roomOptionsRef.current?.onOwnGrantsChanged?.(grants);
          window.setTimeout(() => applyPublishedMediaRef.current(), 0);
        } else {
          roomOptionsRef.current?.onParticipantGrantsChanged?.(connectionId, grants);
        }
        extraHandlersRef?.current?.onParticipantGrantsChanged?.(connectionId, grants);
      }
    );

    connection.on(
      'YourGrantsChanged',
      (voice?: boolean, video?: boolean, presenter?: boolean) => {
        const grants: ParticipantGrants = {
          voice: Boolean(voice),
          video: Boolean(video),
          presenter: Boolean(presenter),
        };
        if (connection.connectionId) {
          registerGrants(connection.connectionId, voice, video, presenter);
        }
        ownGrantsRef.current = grants;
        roomOptionsRef.current?.onOwnGrantsChanged?.(grants);
        extraHandlersRef?.current?.onOwnGrantsChanged?.(grants);
        window.setTimeout(() => applyPublishedMediaRef.current(), 0);
      }
    );

    connection.on('UserLeft', (_userName: string, connectionId: string) => {
      removePeerRef.current(connectionId);
      setRoomScreenSharerId((cur) => (cur === connectionId ? null : cur));
      roomOptionsRef.current?.onUserLeft?.(connectionId);
      extraHandlersRef?.current?.onUserLeft?.(connectionId);
    });

    const flushPendingIce = async (connectionId: string, pc: RTCPeerConnection) => {
      const queued = pendingIceRef.current.get(connectionId);
      if (!queued?.length) return;
      pendingIceRef.current.delete(connectionId);
      for (const init of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(init));
        } catch {
          /* benign */
        }
      }
    };

    const queueOrAddIceCandidate = async (
      connectionId: string,
      pc: RTCPeerConnection,
      init: RTCIceCandidateInit | null
    ) => {
      if (isEndOfIceCandidates(init)) return;

      if (!pc.remoteDescription) {
        const q = pendingIceRef.current.get(connectionId) ?? [];
        q.push(init);
        pendingIceRef.current.set(connectionId, q);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(init));
      } catch {
        /* benign */
      }
    };

    connection.on('ReceiveSignal', async (fromConnectionId: string, signalStr: string) => {
      if (skipMeshMedia()) return;
      try {
        const signal = JSON.parse(signalStr) as {
          type: string;
          offer?: RTCSessionDescriptionInit;
          answer?: RTCSessionDescriptionInit;
          candidate?: RTCIceCandidateInit | null;
        };

        let pc: RTCPeerConnection | null | undefined =
          signalingPcRef.current.get(fromConnectionId);

        if (signal.type === 'offer') {
          if (!signal.offer) return;
          if (!pc) {
            remoteVideoIndexRef.current.set(fromConnectionId, 0);
            pc = createPeerConnectionRef.current(fromConnectionId, '', 'Unknown', '', false);
          }
          if (!pc || pc.signalingState === 'closed') return;

          if (pc.signalingState === 'have-local-offer') {
            // Defensive: under the deterministic initiator rule we never offer to this peer
            // while they offer to us, so this only guards against legacy peers.
            try {
              await pc.setLocalDescription({ type: 'rollback' } as RTCLocalSessionDescriptionInit);
            } catch {
              return;
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          remoteVideoIndexRef.current.set(fromConnectionId, 0);
          syncRemoteTracksFromReceivers(fromConnectionId, pc);

          // setRemoteDescription associated the offered audio/webcam/screen m-lines with
          // this answerer; attach whatever local media it is currently allowed to publish.
          const senders = ensurePeerMediaTransceivers(fromConnectionId, pc);
          if (senders && canAttachPublisherMedia()) {
            await attachPublisherTracksToSenders(senders);
          }

          await flushPendingIce(fromConnectionId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          syncRemoteTracksFromReceivers(fromConnectionId, pc);
          await invokeHubOrThrow(
            'SendSignal',
            fromConnectionId,
            JSON.stringify({ type: 'answer', answer: pc.localDescription })
          );
        } else if (signal.type === 'answer') {
          if (!pc || !signal.answer) return;
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          await flushPendingIce(fromConnectionId, pc);
          syncRemoteTracksFromReceivers(fromConnectionId, pc);
        } else if (signal.type === 'candidate') {
          if (!pc) return;
          await queueOrAddIceCandidate(fromConnectionId, pc, signal.candidate ?? null);
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'development' && !isBenignWebRtcSignalError(err)) {
          console.debug('[WebRTC ReceiveSignal]', err);
        }
      }
    });

    connection.on('RoomFilesChanged', (connectionId: string, rawUserName: string) => {
      let name = rawUserName;
      try { name = JSON.parse(rawUserName).name || rawUserName; } catch { /* plain name */ }
      roomOptionsRef.current?.onRoomFilesChanged?.(connectionId, name);
      extraHandlersRef?.current?.onRoomFilesChanged?.(connectionId, name);
    });

    connection.on('ReceiveMessage', (rawUserName: string, message: string) => {
      let userName = rawUserName;
      try {
        const parsed = JSON.parse(rawUserName);
        userName = parsed.name;
      } catch { /* ignore */ }
      setMessages((prev) => [...prev, { user: userName, message, timestamp: new Date() }]);
      roomOptionsRef.current?.onChatMessageReceived?.(userName, message);
      extraHandlersRef?.current?.onChatMessageReceived?.(userName, message);
    });

    const onWaitingForTeacher = () => {
      setWaitingForTeacher(true);
      roomOptionsRef.current?.onWaitingForTeacher?.();
    };
    const onAdmittedToRoom = () => {
      setWaitingForTeacher(false);
      roomOptionsRef.current?.onAdmittedToRoom?.();
      void invokeHub('RequestMediaStateSync', meetingId);
    };
    registerHubHandlers(connection, {
      WaitingForTeacher: onWaitingForTeacher,
      AdmittedToRoom: onAdmittedToRoom,
    });

    connection.on('RoomJoinInitialized', (payload: unknown) => {
      const init = parseRoomJoinInitialized(payload);
      setWaitingForTeacher(init.inWaitingRoom);
      init.peers.forEach((peer) => {
        if (!peer.connectionId) return;
        peerRolesRef.current.set(
          peer.connectionId,
          resolveHubPeerRole(peer.role, peer.isPresenter) ?? 'student'
        );
      });
      if (!init.inWaitingRoom) {
        roomOptionsRef.current?.onAdmittedToRoom?.();
      }
      roomOptionsRef.current?.onRoomJoinInitialized?.(init);
      extraHandlersRef?.current?.onRoomJoinInitialized?.(init);
    });

    connection.on('ResyncMediaStateRequested', () => {
      if (canAttachPublisherMedia()) {
        applyPublishedMediaRef.current();
      }
      roomOptionsRef.current?.onResyncMediaStateRequested?.();
      extraHandlersRef?.current?.onResyncMediaStateRequested?.();
    });

    connection.on('TeacherEndedSession', () => {
      setWaitingForTeacher(false);
      roomOptionsRef.current?.onTeacherEndedSession?.();
      extraHandlersRef?.current?.onTeacherEndedSession?.();
    });

    connection.on('JoinDeniedBlocked', () => {
      roomOptionsRef.current?.onJoinDeniedBlocked?.();
      extraHandlersRef?.current?.onJoinDeniedBlocked?.();
    });

    connection.on('JoinDeniedRoomFull', () => {
      roomOptionsRef.current?.onJoinDeniedRoomFull?.();
      extraHandlersRef?.current?.onJoinDeniedRoomFull?.();
    });

    connection.on('JoinDeniedGuestCapacityFull', () => {
      roomOptionsRef.current?.onJoinDeniedGuestCapacityFull?.();
      extraHandlersRef?.current?.onJoinDeniedGuestCapacityFull?.();
    });

    connection.on('JoinDeniedGuestsDisabled', () => {
      roomOptionsRef.current?.onJoinDeniedGuestsDisabled?.();
      extraHandlersRef?.current?.onJoinDeniedGuestsDisabled?.();
    });

    connection.on('JoinDeniedNotInRoom', () => {
      roomOptionsRef.current?.onJoinDeniedNotInRoom?.();
      extraHandlersRef?.current?.onJoinDeniedNotInRoom?.();
    });

    connection.on('JoinDeniedAlreadyLoggedIn', () => {
      roomOptionsRef.current?.onJoinDeniedAlreadyLoggedIn?.();
      extraHandlersRef?.current?.onJoinDeniedAlreadyLoggedIn?.();
    });

    connection.on('SupersededByNewSession', (mid: string) => {
      tearDownRoomMedia();
      void (async () => {
        try {
          await connection.stop();
        } catch {
          /* ignore */
        }
        roomOptionsRef.current?.onSupersededByNewSession?.(mid);
        extraHandlersRef?.current?.onSupersededByNewSession?.(mid);
        roomOptionsRef.current?.onJoinDeniedAlreadyLoggedIn?.();
        extraHandlersRef?.current?.onJoinDeniedAlreadyLoggedIn?.();
      })();
    });

    connection.on('JoinDeniedInvalidTicket', () => {
      roomOptionsRef.current?.onJoinDeniedInvalidTicket?.();
      extraHandlersRef?.current?.onJoinDeniedInvalidTicket?.();
    });

    connection.on('MeetingEnded', (mid: string, reason?: string) => {
      roomOptionsRef.current?.onMeetingEnded?.(mid, reason);
      extraHandlersRef?.current?.onMeetingEnded?.(mid, reason);
    });

    connection.on('ParticipantVideoToggled', (connectionId: string, isVideoOn: boolean) => {
      if (!isVideoOn) {
        clearPeerCameraStream(connectionId);
      } else {
        const pc = signalingPcRef.current.get(connectionId);
        if (pc) syncRemoteTracksFromReceivers(connectionId, pc);
      }
      roomOptionsRef.current?.onParticipantVideoToggled?.(connectionId, !!isVideoOn);
      extraHandlersRef?.current?.onParticipantVideoToggled?.(connectionId, !!isVideoOn);
    });

    connection.on('RemoteMicSet', (muted: boolean) => {
      roomOptionsRef.current?.onRemoteMicSet?.(!!muted);
      extraHandlersRef?.current?.onRemoteMicSet?.(!!muted);
    });

    connection.on('MicPermissionRequested', (requesterConnectionId: string, requesterName: string) => {
      roomOptionsRef.current?.onMicPermissionRequested?.(requesterConnectionId, requesterName);
      extraHandlersRef?.current?.onMicPermissionRequested?.(requesterConnectionId, requesterName);
    });

    connection.on('MicPermissionResponded', (studentConnectionId: string, accepted: boolean) => {
      roomOptionsRef.current?.onMicPermissionResponded?.(studentConnectionId, !!accepted);
      extraHandlersRef?.current?.onMicPermissionResponded?.(studentConnectionId, !!accepted);
    });

    connection.on('KickedFromMeeting', (mid: string, wasBlocked: boolean) => {
      tearDownRoomMedia();
      void (async () => {
        try {
          await connection.stop();
        } catch {
          /* ignore */
        }
        roomOptionsRef.current?.onKickedFromMeeting?.(mid, !!wasBlocked);
        extraHandlersRef?.current?.onKickedFromMeeting?.(mid, !!wasBlocked);
      })();
    });

    connection.on('AdminSeatRemoved', (mid: string, action: string, wasBlocked: boolean) => {
      roomOptionsRef.current?.onAdminSeatRemoved?.(mid, action, !!wasBlocked);
      extraHandlersRef?.current?.onAdminSeatRemoved?.(mid, action, !!wasBlocked);
    });

    connection.on('YourRoleChanged', (role: string) => {
      const r = role === 'presenter' ? 'presenter' : 'participant';
      const cid = connection.connectionId;
      ownPresenterRoleRef.current = r === 'presenter';
      if (cid) peerRolesRef.current.set(cid, r);
      void refreshPublishingAfterRoleChangeRef.current?.(cid, r);
      roomOptionsRef.current?.onYourRoleChanged?.(r);
      extraHandlersRef?.current?.onYourRoleChanged?.(r);
    });

    connection.on('ParticipantRoleChanged', (connectionId: string, role: string) => {
      peerRolesRef.current.set(connectionId, role);
      void refreshPublishingAfterRoleChangeRef.current?.(connectionId, role);
      roomOptionsRef.current?.onParticipantRoleChanged?.(connectionId, role);
      extraHandlersRef?.current?.onParticipantRoleChanged?.(connectionId, role);
    });

    connection.on('ParticipantMuted', (connectionId: string, isMuted: boolean) => {
      roomOptionsRef.current?.onParticipantMuted?.(connectionId, !!isMuted);
      extraHandlersRef?.current?.onParticipantMuted?.(connectionId, !!isMuted);
    });

    connection.on('ParticipantScreenShared', (connectionId: string) => {
      setRoomScreenSharerIds((prev) =>
        prev.includes(connectionId) ? prev : [...prev, connectionId]
      );
      setRoomScreenSharerId(connectionId);
      const pc = signalingPcRef.current.get(connectionId);
      if (pc) syncRemoteTracksFromReceivers(connectionId, pc);
      roomOptionsRef.current?.onParticipantScreenShared?.(connectionId);
      extraHandlersRef?.current?.onParticipantScreenShared?.(connectionId);
    });

    connection.on('ParticipantScreenShareStopped', (connectionId: string) => {
      setRoomScreenSharerIds((prev) => {
        const next = prev.filter((id) => id !== connectionId);
        setRoomScreenSharerId(next[0] ?? null);
        return next;
      });
      clearPeerScreenStream(connectionId);
      roomOptionsRef.current?.onParticipantScreenShareStopped?.(connectionId);
      extraHandlersRef?.current?.onParticipantScreenShareStopped?.(connectionId);
    });

    connection.on('ScreenShareDenied', (activeSharerConnectionId: string) => {
      roomOptionsRef.current?.onScreenShareDenied?.(activeSharerConnectionId);
      extraHandlersRef?.current?.onScreenShareDenied?.(activeSharerConnectionId);
    });

    connection.on('RemoteScreenShareStop', () => {
      roomOptionsRef.current?.onRemoteScreenShareStop?.();
      extraHandlersRef?.current?.onRemoteScreenShareStop?.();
    });

    connection.on('WebcamOverlayUpdated', (
      x: number,
      y: number,
      width: number,
      height: number,
      styleJson?: string | null,
      publisherConnectionId?: string | null
    ) => {
      roomOptionsRef.current?.onWebcamOverlayUpdated?.(
        x,
        y,
        width,
        height,
        styleJson,
        publisherConnectionId
      );
      extraHandlersRef?.current?.onWebcamOverlayUpdated?.(
        x,
        y,
        width,
        height,
        styleJson,
        publisherConnectionId
      );
    });

    connection.on('HandRaised', (connectionId: string) => {
      setRaisedHandIds((prev) =>
        prev.includes(connectionId) ? prev : [...prev, connectionId]
      );
      roomOptionsRef.current?.onHandRaised?.(connectionId);
      extraHandlersRef?.current?.onHandRaised?.(connectionId);
    });

    connection.on('HandLowered', (connectionId: string) => {
      setRaisedHandIds((prev) => prev.filter((id) => id !== connectionId));
      roomOptionsRef.current?.onHandLowered?.(connectionId);
      extraHandlersRef?.current?.onHandLowered?.(connectionId);
    });

    const displayName = JSON.stringify({
      id: user.id,
      name: user.displayName || user.name,
      avatar: user.avatar || '',
      roomSeatLogin: !!user.isRoomSeatLogin,
    });
    const tef = roomOptionsRef.current?.teacherEntersFirst ?? false;
    const joinTicket = user.roomJoinTicket ?? getRoomJoinTicket() ?? '';

    const joinCurrentConnection = async () => {
      await invokeHubOrThrow(
        'JoinMeeting',
        meetingId,
        displayName,
        false,
        tef,
        joinTicket || null,
      );
      await invokeHub('RequestMediaStateSync', meetingId);
      if (canAttachPublisherMedia()) {
        applyPublishedMediaRef.current();
      }
    };

    /** اتصال transport به تنهایی کافی نیست؛ ورود به اتاق باید تمام شود تا لایه اتصال مجدد برداشته شود. */
    const finishConnection = async (reconnected: boolean) => {
      await joinCurrentConnection();
      if (cancelled) return;
      if (connection.state !== signalR.HubConnectionState.Connected) {
        throw new Error('Hub disconnected while joining the room.');
      }
      setIsConnected(true);
      setIsHubReconnecting(false);
      setHubConnectionId(connection.connectionId ?? null);
      if (reconnected) {
        roomOptionsRef.current?.onHubReconnected?.();
        extraHandlersRef?.current?.onHubReconnected?.();
      }
    };

    const reportConnectionFailure = () => {
      if (cancelled) return;
      setIsConnected(false);
      setIsHubReconnecting(false);
      setHubConnectionId(null);
      setWaitingForTeacher(false);
      roomOptionsRef.current?.onHubConnectionFailed?.();
      extraHandlersRef?.current?.onHubConnectionFailed?.();
    };

    // این رویداد از کانال SignalR می‌آید؛ شکست ICE همتا به تنهایی این callback را اجرا نمی‌کند.
    connection.onreconnecting(() => {
      setIsConnected(false);
      setIsHubReconnecting(true);
      roomOptionsRef.current?.onHubReconnecting?.();
      extraHandlersRef?.current?.onHubReconnecting?.();
    });

    connection.onreconnected(() => {
      if (cancelled) return;
      // Drop stale mesh peers from the previous SignalR connection id before rejoin sync.
      tearDownRoomMedia();
      void (async () => {
        try {
          await finishConnection(true);
        } catch (err: unknown) {
          if (cancelled) return;
          console.error('SignalR rejoin failed: ', err);
          reportConnectionFailure();
        }
      })();
    });

    connection.onclose(() => {
      // A failed start can also close the transport. Its retry belongs to startHub.
      if (cancelled || startingHub || recoveringHub) return;
      recoveringHub = true;
      setIsConnected(false);
      setIsHubReconnecting(true);
      setHubConnectionId(null);
      tearDownRoomMedia();
      void (async () => {
        try {
          for (let attempt = 0; attempt < 12 && !cancelled; attempt++) {
            if (connection.state === signalR.HubConnectionState.Reconnecting) return;
            const delayMs = Math.min(1000 * (attempt + 1), 15000);
            await new Promise<void>((r) => setTimeout(r, delayMs));
            if (cancelled) return;
            try {
              if (connection.state !== signalR.HubConnectionState.Connected) {
                await connection.start();
              }
              if (cancelled) return;
              await finishConnection(true);
              return;
            } catch (err: unknown) {
              if (!isBenignSignalTransportError(String(err)) && process.env.NODE_ENV === 'development') {
                console.debug('[SignalR] manual reconnect failed', err);
              }
            }
          }
          reportConnectionFailure();
        } finally {
          recoveringHub = false;
        }
      })();
    });

    const startHub = async (attempt = 0): Promise<void> => {
      if (cancelled) return;
      try {
        if (connection.state !== signalR.HubConnectionState.Connected) {
          await connection.start();
        }
        if (cancelled) return;
        await finishConnection(false);
      } catch (err: unknown) {
        if (cancelled || (err instanceof Error && err.name === 'AbortError')) return;
        const maxAttempts = 6;
        if (attempt + 1 < maxAttempts) {
          const delayMs = Math.min(1500 * (attempt + 1), 8000);
          if (process.env.NODE_ENV === 'development') {
            console.debug(`[SignalR] connect retry ${attempt + 2}/${maxAttempts} in ${delayMs}ms`);
          }
          await new Promise<void>((r) => setTimeout(r, delayMs));
          return startHub(attempt + 1);
        }
        console.error('SignalR Connection Error: ', err);
        reportConnectionFailure();
      }
    };

    void startHub().finally(() => { startingHub = false; });

    return () => {
      cancelled = true;
      setIsConnected(false);
      setIsHubReconnecting(false);
      setHubConnectionId(null);
      setWaitingForTeacher(false);
      setRoomScreenSharerId(null);
      const conn = hubConnectionRef.current;
      hubConnectionRef.current = null;
      tearDownRoomMedia();
      const leaveDisplayName = JSON.stringify({
        id: user.id,
        name: user.displayName || user.name,
        avatar: user.avatar || '',
        roomSeatLogin: !!user.isRoomSeatLogin,
      });
      void (async () => {
        if (conn?.state === signalR.HubConnectionState.Connected && user) {
          try {
            // cleanup مستقل از خروج صریح اجرا می‌شود؛ ممکن است عضویت قبلاً حذف شده باشد.
            // catch پایین فقط خطای کلاینت را می‌پوشاند و جلوی HubException سمت سرور را نمی‌گیرد.
            await conn.invoke('LeaveMeeting', meetingId, leaveDisplayName, false);
          } catch {
            /* ignore */
          }
        }
        try {
          await conn?.stop();
        } catch {
          /* IIS may block DELETE on proxied hub disconnect */
        }
      })();
    };
  }, [meetingId, user?.id, user?.displayName, user?.name, roomOptions?.teacherEntersFirst, clearPeerScreenStream, tearDownRoomMedia, canAttachPublisherMedia]);

  useEffect(() => {
    const stoppingShare = prevScreenStreamRef.current !== null && screenStream === null;
    prevScreenStreamRef.current = screenStream;
    const delay = stoppingShare ? 650 : screenStream ? 150 : 250;
    const timer = window.setTimeout(() => applyPublishedMediaRef.current(), delay);
    return () => window.clearTimeout(timer);
  }, [localStream, screenStream]);

  const sendMessage = useCallback(
    (message: string) => {
      if (waitingForTeacher) return;
      if (hubConnectionRef.current && isConnected && user) {
        const displayName = JSON.stringify({
      id: user.id,
      name: user.displayName || user.name,
      avatar: user.avatar || '',
      roomSeatLogin: !!user.isRoomSeatLogin,
    });
        hubConnectionRef.current.invoke('SendMessage', meetingId, displayName, message).catch(() => undefined);
      }
    },
    [meetingId, user, isConnected, waitingForTeacher]
  );

  /** درخواست خروج صریح؛ اتصال Hub را متوقف نمی‌کند و مانع ارسال خروج دوم توسط cleanup نمی‌شود. */
  const leaveLiveMeeting = useCallback(async () => {
    const conn = hubConnectionRef.current;
    if (!conn || !user) return;
    if (conn.state !== signalR.HubConnectionState.Connected) return;
    try {
      const displayName = JSON.stringify({
      id: user.id,
      name: user.displayName || user.name,
      avatar: user.avatar || '',
      roomSeatLogin: !!user.isRoomSeatLogin,
    });
      await invokeHubOrThrow(
        'LeaveMeeting',
        meetingId,
        displayName,
        resolveJoinAsMeetingHost(roomOptionsRef.current)
      );
    } catch {
      /* ignore */
    }
  }, [meetingId, user, invokeHubOrThrow]);

  const kickParticipant = useCallback(
    async (targetConnectionId: string, block: boolean, targetUserName?: string) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        throw new Error('Meeting hub is not connected');
      }
      if (!targetConnectionId?.trim()) {
        throw new Error('Invalid participant connection id');
      }
      // targetUserName lets the hub resolve the participant when the roster row's
      // connection id was superseded by a reconnect.
      await invokeHubOrThrow('KickParticipant', meetingId, targetConnectionId, targetUserName ?? null, block);
    },
    [meetingId, invokeHubOrThrow]
  );

  const setParticipantRoleRemote = useCallback(
    async (targetConnectionId: string, role: 'participant' | 'presenter', targetUserName?: string) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('SetParticipantRole', meetingId, targetConnectionId, role, targetUserName ?? null);
    },
    [meetingId, invokeHub]
  );

  const setParticipantGrantsRemote = useCallback(
    async (
      targetConnectionId: string,
      grants: { voice: boolean; video: boolean; presenter: boolean },
      targetUserName?: string
    ) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        throw new Error('Meeting hub is not connected');
      }
      await invokeHubOrThrow(
        'SetParticipantGrants',
        meetingId,
        targetConnectionId,
        grants.voice,
        grants.video,
        grants.presenter,
        targetUserName ?? null
      );
    },
    [meetingId, invokeHubOrThrow]
  );

  const getParticipantGrants = useCallback((connectionId: string): ParticipantGrants => {
    return participantGrantsRef.current[connectionId] ?? { voice: false, video: false, presenter: false };
  }, []);

  const setRemoteMic = useCallback(
    async (targetConnectionId: string, muted: boolean) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('SetRemoteMic', meetingId, targetConnectionId, muted);
    },
    [meetingId, invokeHub]
  );

  const requestMicPermission = useCallback(
    async (targetConnectionId: string) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('RequestMicPermission', meetingId, targetConnectionId);
    },
    [meetingId, invokeHub]
  );

  const respondMicPermission = useCallback(
    async (requesterConnectionId: string, accepted: boolean) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('RespondMicPermission', meetingId, requesterConnectionId, accepted);
    },
    [meetingId, invokeHub]
  );

  const refreshStudentMicPublishing = useCallback(() => {
    lastPublishedSigRef.current = '';
    applyPublishedMediaRef.current();
  }, []);

  const broadcastSelfMicMuted = useCallback(
    async (isMuted: boolean) => {
      const conn = hubConnectionRef.current;
      const cid = conn?.connectionId;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected || !cid) return;
      await invokeHub('ToggleMute', meetingId, cid, isMuted);
    },
    [meetingId, invokeHub]
  );

  const broadcastSelfVideoToggled = useCallback(
    async (isVideoOn: boolean) => {
      const conn = hubConnectionRef.current;
      const cid = conn?.connectionId;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected || !cid) return;
      await invokeHub('ToggleVideo', meetingId, cid, isVideoOn);
    },
    [meetingId, invokeHub]
  );

  const notifyScreenShare = useCallback(
    async (active: boolean) => {
      const conn = hubConnectionRef.current;
      const cid = conn?.connectionId;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected || !cid) return;
      if (active) {
        await invokeHubOrThrow('StartScreenShare', meetingId, cid);
      } else {
        await invokeHubOrThrow('StopScreenShare', meetingId, cid);
      }
    },
    [meetingId, invokeHubOrThrow]
  );

  const forceStopScreenShare = useCallback(
    async (targetConnectionId: string) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('ForceStopScreenShare', meetingId, targetConnectionId);
    },
    [meetingId, invokeHub]
  );

  const broadcastMediaState = useCallback(
    async (isMicMuted: boolean, isVideoOn: boolean) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('BroadcastMediaState', meetingId, isMicMuted, isVideoOn);
    },
    [meetingId, invokeHub]
  );

  const requestMediaStateSync = useCallback(async () => {
    const conn = hubConnectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    await invokeHub('RequestMediaStateSync', meetingId);
  }, [meetingId, invokeHub]);

  const broadcastWebcamOverlay = useCallback(
    async (
      x: number,
      y: number,
      width: number,
      height: number,
      styleJson?: string | null
    ) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('UpdateWebcamOverlay', meetingId, x, y, width, height, styleJson ?? null);
    },
    [meetingId, invokeHub]
  );

  const raiseHand = useCallback(async () => {
    const conn = hubConnectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    await invokeHub('RaiseHand', meetingId);
  }, [meetingId, invokeHub]);

  const lowerHand = useCallback(async () => {
    const conn = hubConnectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    await invokeHub('LowerHand', meetingId);
  }, [meetingId, invokeHub]);

  const lowerParticipantHand = useCallback(
    async (targetConnectionId: string) => {
      const conn = hubConnectionRef.current;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
      await invokeHub('LowerParticipantHand', meetingId, targetConnectionId);
    },
    [meetingId, invokeHub]
  );

  const peersList = useMemo(() => Object.values(peers), [peers]);
  const notifyRoomFilesChanged = useCallback(
    () => invokeHubOrThrow('NotifyRoomFilesChanged', meetingId),
    [meetingId, invokeHubOrThrow]
  );

  return {
    peers: peersList,
    messages,
    sendMessage,
    notifyRoomFilesChanged,
    isConnected,
    isHubReconnecting,
    waitingForTeacher,
    leaveLiveMeeting,
    hubConnectionId,
    roomScreenSharerId,
    roomScreenSharerIds,
    raisedHandIds,
    kickParticipant,
    setParticipantRoleRemote,
    setParticipantGrantsRemote,
    getParticipantGrants,
    participantGrants,
    setRemoteMic,
    requestMicPermission,
    respondMicPermission,
    refreshStudentMicPublishing,
    broadcastSelfMicMuted,
    broadcastSelfVideoToggled,
    notifyScreenShare,
    forceStopScreenShare,
    broadcastMediaState,
    requestMediaStateSync,
    broadcastWebcamOverlay,
    raiseHand,
    lowerHand,
    lowerParticipantHand,
    refreshPublishingAfterRoleChange,
  };
}
