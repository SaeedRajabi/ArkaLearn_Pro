'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ScreenShare,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessagesSquare,
  Send,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Maximize,
  Minimize2,
  ChevronDown,
  ScreenShareOff,
  MoreVertical,
  UserCog,
  PersonStanding,
  Trash2,
  Ban,
  Pin,
  PinOff,
  Ticket,
  Presentation,
  Circle,
  Pause,
  Download,
  Settings,
  Upload,
  X,
  Loader,
  Hand,
  FolderOpen,
  FileText,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/seminar/logo';
import { useSeminar } from '@/contexts/seminar-context';
import type {RecordedItem, SeminarRoom, SeminarRoomRole, SeminarUser } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { LeaveRoomDialog } from './leave-room-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {FileSharingSettings, ImageSettings, RecordingSettings, SeminarSettings,
  SeminarSettingsDialog, WebcamOverlaySettings } from "./seminar-settings-dialog";
import {FileUploadDialog, SharedFile } from "./file-upload-dialog";
import { generateSummaryFromVideo } from "@/app/dashboard/summary/video-actions";
import { Progress } from "@radix-ui/react-progress";
import { AudioVisualizer } from "./audio-visualizer";
import { useLanguage } from '@/components/language-provider';
import { useWebRTC, type WebRtcRoomOptions, isScreenShareVideoTrack, listVideoTransceiverSlots } from '@/hooks/use-webrtc';
import { useLiveKitRoom } from '@/hooks/use-livekit-room';
import { getLiveMediaRuntimeConfig } from '@/services/live-media-transport-settings-api.service';
import { setRuntimeIceServers } from '@/lib/webrtc-ice-config';
import {
  canShareScreen as grantCanShareScreen,
  canUseCamera as grantCanUseCamera,
  canUseMic as grantCanUseMic,
  isHostRole,
  revokedMedia,
  type ParticipantGrants,
} from '@/lib/seminar/room-permissions';
import { gridTemplateColumns } from '@/lib/seminar/room-grid';
import { useSeminarRoomAudio } from '@/hooks/use-seminar-room-audio';
import { useActiveSpeakers } from '@/hooks/use-active-speaker';
import { buildMediaStreamConstraints, getUserMediaWithFallback } from '@/lib/media-constraints';
import {
  collectRecordingAudioTracks,
  SeminarRecordingAudioMixer,
} from '@/lib/seminar-recording-audio-mix';
import {
  clampPixelRect,
  defaultPipPixelRect,
  getDisplayPipRect,
  isIosSafari,
  isMobileViewport,
  pixelsToNormalized,
  MAX_CONCURRENT_SCREEN_SHARES,
} from '@/lib/seminar-room-layout';
import {
  loadSeminarAvSettings,
  saveSeminarAvSettings,
} from '@/lib/seminar-settings-storage';
import { isUsableAudioTrack, isUsableVideoTrack } from '@/lib/seminar-media-tracks';
import {
  parseWebcamOverlayStyle,
  serializeWebcamOverlayStyle,
  type WebcamOverlayStylePayload,
} from '@/lib/seminar-webcam-overlay';
import {
  ensureChatNotificationPermission,
  showSeminarChatNotification,
} from '@/lib/seminar-chat-notifications';
import { playNotificationSound, prepareNotificationSound } from '@/lib/notification-sound';
import { MultiPresenterStage, type StageTileMedia } from './multi-presenter-stage';
import {
  clearMicApprovalForPeer,
  isMicApprovedForPeer,
  markMicApprovedForPeer,
} from '@/lib/room-mic-approval';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';
import { resolveStaticAssetUrl } from '@/lib/api-config';
import { isBenignSignalTransportError } from '@/lib/meeting-hub-transport';
import {
  getRoomFiles,
  RoomFileType,
  releaseRoomSeatSession,
  logoutRoomSeat,
} from '@/services/room-service';

interface ChatMessage {
  id: string;
  user: SeminarUser;
  message: string;
  timestamp: string;
}
interface ParticipantState {
  isMicOn: boolean;
  isSharingScreen: boolean;
  isCameraOn?: boolean;
}

type ParticipantRow = {
  key: string;
  id: string;
  label: string;
  avatar: string;
  role: SeminarRoomRole | string;
  connectionId?: string;
  isLocal: boolean;
};

/** Assign srcObject only when the set of live track ids actually changed (avoids flicker). */
function assignVideoSrcObject(
  el: HTMLVideoElement | null | undefined,
  tracks: MediaStreamTrack[] | MediaStream | null | undefined,
  options?: { muted?: boolean; play?: boolean }
): void {
  if (!el) return;
  // Keep muted remote tracks attached — they unmute when the first frames arrive.
  const live =
    !tracks
      ? []
      : tracks instanceof MediaStream
        ? tracks.getTracks().filter((t) => t.readyState === 'live' && t.enabled !== false)
        : tracks.filter((t) => t.readyState === 'live' && t.enabled !== false);

  const nextSig = live
    .map((t) => `${t.kind}:${t.id}`)
    .sort()
    .join('|');
  const cur = el.srcObject;
  const curSig =
    cur instanceof MediaStream
      ? cur
          .getTracks()
          .filter((t) => t.readyState === 'live' && t.enabled !== false)
          .map((t) => `${t.kind}:${t.id}`)
          .sort()
          .join('|')
      : '';

  if (!live.length) {
    if (el.srcObject) {
      el.srcObject = null;
      el.load();
    }
    return;
  }

  if (nextSig !== curSig) {
    el.srcObject = new MediaStream(live);
  }
  if (options?.muted !== undefined) el.muted = options.muted;
  el.playsInline = true;
  if (options?.play !== false) {
    void el.play().catch(() => undefined);
  }
}

export interface UserMediaState {
  isMicOn: boolean;
  isCameraOn: boolean;
  videoDeviceId: string | null;
  audioDeviceId: string | null;
  speakerDeviceId: string | null;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
  audioQuality: 'speech' | 'music' | 'studio';
  videoQuality: 'high' | 'medium' | 'low';
}
interface SeminarRoomProps {
  room: SeminarRoom;
  initialMicOn: boolean;
  initialCameraOn: boolean;
}

export function SeminarRoomComponent({
  room,
  initialMicOn,
  initialCameraOn,
}: SeminarRoomProps) {
  const { user, addRecording, updateRoomUser } = useSeminar();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { logoutFromRoom } = useSeminar();
  const { toast } = useToast();

  const userRole = user
    ? user.id === room.organizerId
      ? 'organizer'
      : (user.role as 'participant' | 'guest' | 'admin' | 'presenter') || 'guest' || 'admin'
    : 'guest';
  const isOrganizer = userRole === 'organizer';
  const isAdmin = userRole === 'admin';
  const isPresenter = userRole === 'presenter';
  const isModerator = isOrganizer || isAdmin;
  /** Organizer, admin, or assigned presenter (teacher) may mute students and change roles. */
  const canModerateParticipants = isOrganizer || isAdmin || isPresenter;
  const canPublishMedia = isModerator || isPresenter;
  // Granular host-to-student grants (students only; hosts/presenters are implicit).
  const [myGrants, setMyGrants] = useState<ParticipantGrants>({
    voice: false,
    video: false,
    presenter: false,
  });
  const isHostTeacher = canPublishMedia;
  const isStrictStudent = userRole === 'participant';
  /** Students and presenters watch the stage; only organizer/admin publish as host. */
  const isAudienceMember = isStrictStudent || isPresenter;
  const params = useParams();
  const roomUrlSegment = (params?.slug as string) || room.slug || room.id;
  const canControlMic =
    userRole !== 'participant' || (isStrictStudent && myGrants.voice);
  const canControlCamera =
    userRole !== 'participant' || (isStrictStudent && myGrants.video);

  const [useLiveKitSfu, setUseLiveKitSfu] = useState(false);
  const [mediaConfigReady, setMediaConfigReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getLiveMediaRuntimeConfig().then((cfg) => {
      if (cancelled) return;
      // Admin-managed TURN/STUN must land BEFORE any RTCPeerConnection is created,
      // otherwise mesh media fails across NATs (public STUN alone is not enough).
      setRuntimeIceServers({
        turnUrls: cfg.turnUrls,
        turnUsername: cfg.turnUsername,
        turnPassword: cfg.turnPassword,
        stunUrls: cfg.stunUrls,
      });
      setUseLiveKitSfu(cfg.transportMode === 'LiveKit' && cfg.isLiveKitReady);
      setMediaConfigReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);


  const [mediaState, setMediaState] = useState<UserMediaState>({
    isMicOn: initialMicOn && canControlMic,
    isCameraOn: initialCameraOn && canControlCamera,
    videoDeviceId: null,
    audioDeviceId: null,
    speakerDeviceId: null,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    voiceIsolation: false,
    audioQuality: 'speech',
    videoQuality: 'high',
  });

  const [isMicOn, setIsMicOn] = useState(initialMicOn && canControlMic);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn && canControlCamera);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  useEffect(() => {
    isSharingScreenRef.current = isSharingScreen;
  }, [isSharingScreen]);
  const [adminSeatRemoval, setAdminSeatRemoval] = useState<{ action: string; wasBlocked: boolean } | null>(
    null
  );
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [liveParticipantRoles, setLiveParticipantRoles] = useState<Record<string, SeminarRoomRole | string>>({});
  const [presenterBadgeVisible, setPresenterBadgeVisible] = useState(false);
  const [micPermissionRequest, setMicPermissionRequest] = useState<{
    requesterConnectionId: string;
    requesterName: string;
  } | null>(null);
  const [pendingMicRequests, setPendingMicRequests] = useState<Record<string, boolean>>({});
  const [micApprovedStudents, setMicApprovedStudents] = useState<Record<string, boolean>>({});
  const [studentMicApproved, setStudentMicApproved] = useState(false);
  const [hubConnectionFailed, setHubConnectionFailed] = useState(false);
  const studentMicPublishingRef = useRef(false);
  const publisherMicSyncedRef = useRef(false);
  const mediaStateRef = useRef(mediaState);
  // Late-bound handlers for the host revocation enforcement (declared before the
  // handlers themselves because webRtcRoomOptions needs them during mount).
  const isSharingScreenRef = useRef(false);
  const handleToggleMicRef = useRef<() => void | Promise<void>>(() => {});
  const handleToggleCameraRef = useRef<() => void | Promise<void>>(() => {});
  const handleStopScreenShareRef = useRef<() => void | Promise<void>>(() => {});
  mediaStateRef.current = mediaState;

  const teacherVideoRef = useRef<HTMLVideoElement>(null);
  const remoteTeacherStageRef = useRef<HTMLVideoElement>(null);
  const remoteTeacherPipRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const stageScreenContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const screenShareBusyRef = useRef(false);
  const broadcastWebcamOverlayRef = useRef<
    ((
      x: number,
      y: number,
      width: number,
      height: number,
      styleJson?: string | null
    ) => Promise<void>) | null
  >(null);
  const stopScreenShareRef = useRef<(() => void) | null>(null);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [participantStates, setParticipantStates] = useState<Record<string, ParticipantState>>({});


  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingAudioMixerRef = useRef<SeminarRecordingAudioMixer | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [hasUnsavedRecording, setHasUnsavedRecording] = useState(false);
  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings>({
    format: 'video/webm;codecs=vp9',
    quality: 'high',
    resolution: '1080p',
    saveLocation: 'download',
    liveProcessing: 'none',
    includeParticipantAudio: true,
  });
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);




  // Image settings
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    brightness: 100,
    contrast: 100,
    touchUp: false,
    backgroundEffect: 'none',
    backgroundImage: '',
  });

  const [webcamOverlaySettings, setWebcamOverlaySettings] = useState<WebcamOverlaySettings>({
    shape: 'square',
    cornerRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadow: true,
    shadowColor: '#00000080',
  });

  // File sharing state
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [panelTab, setPanelTab] = useState<'people' | 'chat' | 'files' | null>('people');
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadFiles, setUnreadFiles] = useState(0);
  const knownFileUrlsRef = useRef(new Set<string>());
  const fileRefreshChainRef = useRef(Promise.resolve());

  useEffect(() => {
    const markVisibleRead = () => {
      if (document.visibilityState !== 'visible') return;
      if (panelTab === 'chat') setUnreadChat(0);
      if (panelTab === 'files') setUnreadFiles(0);
    };
    markVisibleRead();
    document.addEventListener('visibilitychange', markVisibleRead);
    return () => document.removeEventListener('visibilitychange', markVisibleRead);
  }, [panelTab]);

  useEffect(() => {
    const unlockNotificationAudio = () => {
      void prepareNotificationSound();
    };
    void prepareNotificationSound();
    window.addEventListener('pointerdown', unlockNotificationAudio, { capture: true });
    window.addEventListener('keydown', unlockNotificationAudio, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlockNotificationAudio, { capture: true });
      window.removeEventListener('keydown', unlockNotificationAudio, { capture: true });
    };
  }, []);
  const [fileSharingSettings, setFileSharingSettings] = useState<FileSharingSettings>({
    allowFileSharing: true,
    maxFileSize: 10,
    allowedFileTypes: '.pdf,.doc,.docx,.png,.jpg',
  });

  useEffect(() => {
    const saved = loadSeminarAvSettings(user?.id);
    if (!saved) return;
    setMediaState((prev) => ({
      ...prev,
      videoDeviceId: saved.videoDeviceId ?? prev.videoDeviceId,
      audioDeviceId: saved.audioDeviceId ?? prev.audioDeviceId,
      speakerDeviceId: saved.speakerDeviceId ?? prev.speakerDeviceId,
      echoCancellation: saved.echoCancellation ?? prev.echoCancellation,
      noiseSuppression: saved.noiseSuppression ?? prev.noiseSuppression,
      autoGainControl: saved.autoGainControl ?? prev.autoGainControl,
      voiceIsolation: saved.voiceIsolation ?? prev.voiceIsolation,
      audioQuality: saved.audioQuality ?? prev.audioQuality,
      videoQuality: saved.videoQuality ?? prev.videoQuality,
    }));
    if (saved.recording) {
      setRecordingSettings({
        ...saved.recording,
        includeParticipantAudio: saved.recording.includeParticipantAudio !== false,
      });
    }
    if (saved.image) setImageSettings(saved.image);
    if (saved.webcamOverlay) setWebcamOverlaySettings(saved.webcamOverlay);
    if (saved.fileSharing) setFileSharingSettings(saved.fileSharing);
  }, [user?.id]);

  const refreshRoomFiles = useCallback((senderName?: string) => {
    const fetchFiles = async () => {
      try {
        const files = await getRoomFiles(Number(room.id));
        const mapped: SharedFile[] = files
          .filter(f => f.fileType === RoomFileType.SharedFile)
          .map(f => ({
            id: String(f.id),
            name: f.fileName,
            size: f.fileSize,
            type: 'application/octet-stream', // We don't have mime type, fallback
            uploader: f.uploadedByUserId || 'Unknown',
            url: resolveStaticAssetUrl(f.fileUrl),
          }));
        const added = mapped.filter((file) => !knownFileUrlsRef.current.has(file.url));
        knownFileUrlsRef.current = new Set(mapped.map((file) => file.url));
        setSharedFiles(mapped);
        if (senderName && added.length) {
          if (panelTab !== 'files' || document.visibilityState !== 'visible') {
            setUnreadFiles((count) => count + added.length);
          }
          toast({
            title: t('seminar_new_shared_file'),
            description: t('seminar_file_shared_by', { name: senderName, fileName: added.map((file) => file.name).join('، ') }),
          });
        }
      } catch (error) {
        console.error("Failed to fetch room files", error);
      }
    };
    fileRefreshChainRef.current = fileRefreshChainRef.current.then(fetchFiles, fetchFiles);
    return fileRefreshChainRef.current;
  }, [room.id, panelTab, t, toast]);

  const refreshRoomFilesRef = useRef(refreshRoomFiles);
  refreshRoomFilesRef.current = refreshRoomFiles;
  useEffect(() => { void refreshRoomFilesRef.current(); }, [room.id]);

  // Leave room state
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSaveSettings = (newSettings: SeminarSettings) => {
    setMediaState(prev => ({
      ...prev,
      videoDeviceId: newSettings.media.videoDeviceId,
      audioDeviceId: newSettings.media.audioDeviceId,
      speakerDeviceId: newSettings.media.speakerDeviceId,
      echoCancellation: newSettings.media.echoCancellation !== false,
      noiseSuppression: newSettings.media.noiseSuppression !== false,
      autoGainControl: newSettings.media.autoGainControl !== false,
      voiceIsolation: Boolean(newSettings.media.voiceIsolation),
      audioQuality: newSettings.media.audioQuality || 'speech',
      videoQuality: newSettings.media.videoQuality || 'high',
    }));
    setRecordingSettings({
      ...newSettings.recording,
      includeParticipantAudio: newSettings.recording.includeParticipantAudio !== false,
    });
    setImageSettings(newSettings.image);
    setWebcamOverlaySettings(newSettings.webcamOverlay);
    setFileSharingSettings(newSettings.fileSharing);
    saveSeminarAvSettings(
      {
        videoDeviceId: newSettings.media.videoDeviceId,
        audioDeviceId: newSettings.media.audioDeviceId,
        speakerDeviceId: newSettings.media.speakerDeviceId,
        echoCancellation: newSettings.media.echoCancellation !== false,
        noiseSuppression: newSettings.media.noiseSuppression !== false,
        autoGainControl: newSettings.media.autoGainControl !== false,
        voiceIsolation: Boolean(newSettings.media.voiceIsolation),
        audioQuality: newSettings.media.audioQuality || 'speech',
        videoQuality: newSettings.media.videoQuality || 'high',
        recording: {
          ...newSettings.recording,
          includeParticipantAudio: newSettings.recording.includeParticipantAudio !== false,
        },
        image: newSettings.image,
        webcamOverlay: newSettings.webcamOverlay,
        fileSharing: newSettings.fileSharing,
      },
      user?.id
    );

    if (canPublishMedia && containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        const normalized = pixelsToNormalized(
          { x: videoPos.x, y: videoPos.y, width: videoSize.width, height: videoSize.height },
          offsetWidth,
          offsetHeight
        );
        const styleJson = serializeWebcamOverlayStyle({
          ...newSettings.webcamOverlay,
          brightness: newSettings.image.brightness,
          contrast: newSettings.image.contrast,
          touchUp: newSettings.image.touchUp,
        });
        void broadcastWebcamOverlayRef.current?.(
          normalized.x,
          normalized.y,
          normalized.width,
          normalized.height,
          styleJson
        );
      }
    }
  };


  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => (prev ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      handleLeave();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const isStudentRole = userRole === 'participant' || userRole === 'guest' || userRole === 'presenter';
      if (hasUnsavedRecording || isStudentRole) {
        event.preventDefault();
        event.returnValue = ''; // Required for legacy browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedRecording, userRole]);


  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleSetLeaveTimer = (minutes: number) => {
    setCountdown(minutes * 60);
    setIsLeaveDialogOpen(false);
    toast({
      title: t('seminar_room_closure_scheduled_title'),
      description: t('seminar_room_closure_scheduled_description', { minutes }),
    });
  };

  const cancelLeaveTimer = () => {
    setCountdown(null);
    toast({
      title: t('seminar_room_closure_canceled_title'),
      description: t('seminar_room_closure_canceled_description'),
    });
  };

  const handleDeleteFile = (fileId: string) => {
    setSharedFiles(prev => {
      const fileToDelete = prev.find(f => f.id === fileId);
      if (fileToDelete) {
        URL.revokeObjectURL(fileToDelete.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
    toast({
      title: t('seminar_file_deleted_title'),
      description: t('seminar_file_deleted_description'),
    });
  };

  // State for draggable and resizable video
  const defaultVideoSize = { width: 150, height: 112.5 };
  const [videoPos, setVideoPos] = useState({ x: 0, y: 0 });
  const [videoSize, setVideoSize] = useState(defaultVideoSize);
  const [remotePipPos, setRemotePipPos] = useState({ x: 0, y: 0 });
  const [remotePipSize, setRemotePipSize] = useState(defaultVideoSize);
  const [remotePipPinned, setRemotePipPinned] = useState(false);
  const [remotePipEnlarged, setRemotePipEnlarged] = useState(false);
  const [remoteWebcamOverlayByPeer, setRemoteWebcamOverlayByPeer] = useState<
    Record<string, WebcamOverlayStylePayload>
  >({});
  const [remotePipByPeer, setRemotePipByPeer] = useState<
    Record<string, { pos: { x: number; y: number }; size: { width: number; height: number } }>
  >({});
  const [handRaisedLocal, setHandRaisedLocal] = useState(false);
  const [isRemotePipDragging, setIsRemotePipDragging] = useState(false);
  const [isRemotePipResizing, setIsRemotePipResizing] = useState<string | null>(null);
  const remotePipDragStartRef = useRef({ x: 0, y: 0 });
  const remotePipInitialPosRef = useRef({ x: 0, y: 0 });
  const remotePipInitialSizeRef = useRef({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const initialSizeRef = useRef({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const resetVideoState = () => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      const pip = defaultPipPixelRect(offsetWidth, offsetHeight);
      setVideoSize({ width: pip.width, height: pip.height });
      setVideoPos({ x: pip.x, y: pip.y });
    }
  };

  const resetRemotePipState = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      const pip = defaultPipPixelRect(offsetWidth, offsetHeight);
      setRemotePipSize({ width: pip.width, height: pip.height });
      setRemotePipPos({ x: pip.x, y: pip.y });
      setRemotePipEnlarged(false);
    }
  }, []);


  useEffect(() => {
    resetVideoState();
    resetRemotePipState();

    const handleResize = () => {
      resetVideoState();
      resetRemotePipState();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setStageSize({ width: el.offsetWidth, height: el.offsetHeight });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const remotePipDisplay = useMemo(() => {
    if (stageSize.width <= 0 || stageSize.height <= 0) {
      return {
        x: remotePipPos.x,
        y: remotePipPos.y,
        width: remotePipSize.width,
        height: remotePipSize.height,
      };
    }
    const base = {
      x: remotePipPos.x,
      y: remotePipPos.y,
      width: remotePipSize.width,
      height: remotePipSize.height,
    };
    if (isRemotePipDragging || isRemotePipResizing) {
      return clampPixelRect(base, stageSize.width, stageSize.height);
    }
    return getDisplayPipRect(base, stageSize.width, stageSize.height, remotePipEnlarged);
  }, [
    remotePipPos,
    remotePipSize,
    remotePipEnlarged,
    stageSize,
    isRemotePipDragging,
    isRemotePipResizing,
  ]);

  useEffect(() => {
    if (isRemotePipDragging || isRemotePipResizing) return;
    if (stageSize.width <= 0 || stageSize.height <= 0) return;
    const clamped = clampPixelRect(
      {
        x: remotePipPos.x,
        y: remotePipPos.y,
        width: remotePipSize.width,
        height: remotePipSize.height,
      },
      stageSize.width,
      stageSize.height
    );
    if (
      clamped.x !== remotePipPos.x ||
      clamped.y !== remotePipPos.y ||
      clamped.width !== remotePipSize.width ||
      clamped.height !== remotePipSize.height
    ) {
      setRemotePipPos({ x: clamped.x, y: clamped.y });
      setRemotePipSize({ width: clamped.width, height: clamped.height });
    }
  }, [
    isRemotePipDragging,
    isRemotePipResizing,
    remotePipPos,
    remotePipSize,
    stageSize,
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const stageEl = stageScreenContainerRef.current;
      const videoEl = screenShareVideoRef.current;
      const fsEl = document.fullscreenElement;
      const onStage = !!(stageEl && fsEl && (fsEl === stageEl || stageEl.contains(fsEl)));
      const onVideo = !!(videoEl && fsEl === videoEl);
      setIsStageFullscreen(onStage || onVideo);
      if (!fsEl && canControlCamera) {
        resetVideoState();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canControlCamera]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const newX = initialPosRef.current.x + dx;
        const newY = initialPosRef.current.y + dy;

        setVideoPos({
          x: newX,
          y: newY,
        });
      }
      if (isResizing && containerRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        let newWidth = initialSizeRef.current.width;
        let newHeight = initialSizeRef.current.height;
        let newX = videoPos.x;
        let newY = videoPos.y;

        if (isResizing.includes('r')) newWidth += dx;
        if (isResizing.includes('l')) {
          newWidth -= dx;
          newX = initialPosRef.current.x + dx;
        }
        if (isResizing.includes('b')) newHeight += dy;
        if (isResizing.includes('t')) {
          newHeight -= dy;
          newY = initialPosRef.current.y + dy;
        }

        if (newWidth > 100 && newHeight > 75) {
          setVideoSize({ width: newWidth, height: newHeight });
          setVideoPos({x: newX, y: newY});
        }
      }
    };

    const handleMouseUp = () => {
      const wasDragging = isDragging || isResizing;
      setIsDragging(false);
      setIsResizing(null);
      if (wasDragging && canPublishMedia && containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        const normalized = pixelsToNormalized(
          { x: videoPos.x, y: videoPos.y, width: videoSize.width, height: videoSize.height },
          offsetWidth,
          offsetHeight
        );
        void broadcastWebcamOverlayRef.current?.(
          normalized.x,
          normalized.y,
          normalized.width,
          normalized.height,
          serializeWebcamOverlayStyle({
            ...webcamOverlaySettings,
            brightness: imageSettings.brightness,
            contrast: imageSettings.contrast,
            touchUp: imageSettings.touchUp,
          })
        );
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, videoPos.x, videoPos.y, videoSize.width, videoSize.height, canPublishMedia, webcamOverlaySettings, imageSettings]);

  useEffect(() => {
    const handleRemotePipMove = (e: MouseEvent) => {
      if (remotePipPinned) return;
      if (isRemotePipDragging && containerRef.current) {
        const dx = e.clientX - remotePipDragStartRef.current.x;
        const dy = e.clientY - remotePipDragStartRef.current.y;
        setRemotePipPos({
          x: remotePipInitialPosRef.current.x + dx,
          y: remotePipInitialPosRef.current.y + dy,
        });
      }
      if (isRemotePipResizing && containerRef.current) {
        const dx = e.clientX - remotePipDragStartRef.current.x;
        const dy = e.clientY - remotePipDragStartRef.current.y;
        let newWidth = remotePipInitialSizeRef.current.width;
        let newHeight = remotePipInitialSizeRef.current.height;
        let newX = remotePipPos.x;
        let newY = remotePipPos.y;
        if (isRemotePipResizing.includes('r')) newWidth += dx;
        if (isRemotePipResizing.includes('l')) {
          newWidth -= dx;
          newX = remotePipInitialPosRef.current.x + dx;
        }
        if (isRemotePipResizing.includes('b')) newHeight += dy;
        if (isRemotePipResizing.includes('t')) {
          newHeight -= dy;
          newY = remotePipInitialPosRef.current.y + dy;
        }
        if (newWidth > 100 && newHeight > 75) {
          setRemotePipSize({ width: newWidth, height: newHeight });
          setRemotePipPos({ x: newX, y: newY });
        }
      }
    };
    const handleRemotePipUp = () => {
      setIsRemotePipDragging(false);
      setIsRemotePipResizing(null);
    };
    window.addEventListener('mousemove', handleRemotePipMove);
    window.addEventListener('mouseup', handleRemotePipUp);
    window.addEventListener('pointermove', handleRemotePipMove);
    window.addEventListener('pointerup', handleRemotePipUp);
    return () => {
      window.removeEventListener('mousemove', handleRemotePipMove);
      window.removeEventListener('mouseup', handleRemotePipUp);
      window.removeEventListener('pointermove', handleRemotePipMove);
      window.removeEventListener('pointerup', handleRemotePipUp);
    };
  }, [isRemotePipDragging, isRemotePipResizing, remotePipPinned, remotePipPos.x, remotePipPos.y]);
  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPosRef.current = videoPos;
  };

  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(corner);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialSizeRef.current = videoSize;
    initialPosRef.current = videoPos;
  };

  useEffect(() => {
    if (teacherVideoRef.current) {
      if (localStream && mediaState.isCameraOn) {
        teacherVideoRef.current.srcObject = localStream;
      } else {
        teacherVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, mediaState.isCameraOn]);


  const mapHubRoleToLiveRole = useCallback((hubRole: string) => {
    switch (hubRole.toLowerCase()) {
      case 'teacher':
        return 'organizer';
      case 'moderator':
        return 'admin';
      default:
        return hubRole.toLowerCase();
    }
  }, []);

  const applyLivePeerRole = useCallback(
    (connectionId: string, hubRole: string | undefined) => {
      if (!connectionId || !hubRole) return;
      const mapped = mapHubRoleToLiveRole(hubRole);
      setLiveParticipantRoles((prev) => ({ ...prev, [connectionId]: mapped }));
    },
    [mapHubRoleToLiveRole]
  );

  const webRtcExtraHandlersRef = useRef<Partial<WebRtcRoomOptions>>({});
  const waitingForTeacherRef = useRef(false);
  const finalizeRoomExitRef = useRef<(options?: { redirect?: boolean; kicked?: boolean }) => Promise<void>>(() =>
    Promise.resolve(),
  );

  const webRtcRoomOptions = useMemo<WebRtcRoomOptions>(
    () => ({
      teacherEntersFirst: !!room.teacherEntersFirst,
      canPublishMedia,
      isModerator,
      isHostTeacher,
      skipMeshMedia: useLiveKitSfu,
      onOwnGrantsChanged: (grants) => {
        setMyGrants(grants);
        // Immediate revocation enforcement: stop any local media the host revoked.
        const active = {
          mic: mediaStateRef.current.isMicOn,
          camera: mediaStateRef.current.isCameraOn,
          screen: isSharingScreenRef.current,
        };
        const toStop = revokedMedia(userRole, grants, active);
        if (toStop.includes('mic') && mediaStateRef.current.isMicOn) {
          void handleToggleMicRef.current();
        }
        if (toStop.includes('camera') && mediaStateRef.current.isCameraOn) {
          void handleToggleCameraRef.current();
        }
        if (toStop.includes('screen') && isSharingScreenRef.current) {
          void handleStopScreenShareRef.current();
        }
      },
    }),
    [room.teacherEntersFirst, canPublishMedia, isModerator, isHostTeacher, useLiveKitSfu, userRole]
  );

  const {
    peers: meshPeers,
    messages: rtcMessages,
    sendMessage: rtcSendMessage,
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
  } = useWebRTC(
    String(room.id),
    mediaConfigReady ? user : null,
    useLiveKitSfu ? null : localStream,
    useLiveKitSfu ? null : screenStream,
    webRtcRoomOptions,
    webRtcExtraHandlersRef,
    studentMicPublishingRef,
  );

  const liveKitCanPublish = canPublishMedia || studentMicApproved;
  const handleFileUploaded = useCallback((file: SharedFile) => {
    knownFileUrlsRef.current.add(file.url);
    setSharedFiles((prev) => [...prev.filter((item) => item.url !== file.url), file]);
    void notifyRoomFilesChanged().catch(() => {
      toast({ variant: 'destructive', title: t('seminar_file_notification_failed') });
    });
  }, [notifyRoomFilesChanged, toast, t]);
  useEffect(() => {
    if (isConnected && !isHubReconnecting) void refreshRoomFilesRef.current();
  }, [isConnected, isHubReconnecting]);
  const { peers: liveKitPeers } = useLiveKitRoom({
    enabled: useLiveKitSfu && !!hubConnectionId && isConnected && !waitingForTeacher,
    meetingId: String(room.id),
    identity: hubConnectionId,
    displayName: user?.displayName || user?.name || 'User',
    userId: user?.id,
    canPublish: liveKitCanPublish,
    localStream,
    screenStream,
  });

  const peers = useLiveKitSfu ? liveKitPeers : meshPeers;

  const activeSpeakerSources = useMemo(
    () => [
      {
        id: '__self__',
        stream: localStream,
        enabled: mediaState.isMicOn,
      },
      ...peers.map((peer) => ({
        id: peer.connectionId,
        stream: peer.stream,
        enabled: participantStates[peer.connectionId]?.isMicOn === true,
      })),
    ],
    [localStream, mediaState.isMicOn, peers, participantStates]
  );
  const activeSpeakers = useActiveSpeakers(activeSpeakerSources);

  const syncPublisherMediaStateToRoom = useCallback(
    async (state: UserMediaState = mediaStateRef.current) => {
      await broadcastMediaState(!state.isMicOn, state.isCameraOn);
    },
    [broadcastMediaState]
  );

  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [rtcMessages]);

  useEffect(() => {
    if (!studentMicApproved || !localStream) return;
    refreshStudentMicPublishing();
  }, [studentMicApproved, localStream, refreshStudentMicPublishing]);

  useEffect(() => {
    if (!isStrictStudent || !isConnected || waitingForTeacher) return;
    void broadcastSelfMicMuted(true);
  }, [isStrictStudent, isConnected, waitingForTeacher, broadcastSelfMicMuted]);

  useEffect(() => {
    if (!canPublishMedia || !isConnected || waitingForTeacher || hubConnectionFailed) return;
    if (publisherMicSyncedRef.current) return;
    publisherMicSyncedRef.current = true;
    void syncPublisherMediaStateToRoom();
  }, [
    canPublishMedia,
    isConnected,
    waitingForTeacher,
    hubConnectionFailed,
    syncPublisherMediaStateToRoom,
  ]);

  const acceptMicPermission = useCallback(async () => {
    if (!micPermissionRequest) return;
    const { requesterConnectionId } = micPermissionRequest;
    try {
      const audioConstraints: MediaTrackConstraints = mediaState.audioDeviceId
        ? { deviceId: { ideal: mediaState.audioDeviceId } }
        : {};
      const stream = await getUserMediaWithFallback(
        buildMediaStreamConstraints({
          wantAudio: true,
          wantVideo: false,
          audioDeviceId: mediaState.audioDeviceId,
          mobile: isMobileViewport(),
          processing: {
            echoCancellation: mediaState.echoCancellation,
            noiseSuppression: mediaState.noiseSuppression,
            autoGainControl: mediaState.autoGainControl,
            voiceIsolation: mediaState.voiceIsolation,
            audioQuality: mediaState.audioQuality,
            videoQuality: mediaState.videoQuality,
          },
        })
      );
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => track.stop());
      }
      setLocalStream(stream);
      studentMicPublishingRef.current = true;
      setStudentMicApproved(true);
      setMediaState((prev) => ({
        ...prev,
        isMicOn: true,
        audioDeviceId: stream.getAudioTracks()[0]?.getSettings().deviceId || prev.audioDeviceId,
      }));
      setIsMicOn(true);
      await respondMicPermission(requesterConnectionId, true);
      await broadcastMediaState(false, mediaState.isCameraOn);
      refreshStudentMicPublishing();
      if (hubConnectionId) {
        setMicApprovedStudents((prev) =>
          markMicApprovedForPeer(prev, user?.id, hubConnectionId)
        );
      }
      toast({
        title: t('seminar_mic_permission_granted_title'),
        description: t('seminar_mic_permission_granted_description'),
      });
    } catch {
      studentMicPublishingRef.current = false;
      setStudentMicApproved(false);
      setMediaState((prev) => ({ ...prev, isMicOn: false }));
      setIsMicOn(false);
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_mic_permission_failed_description'),
      });
    } finally {
      setMicPermissionRequest(null);
    }
  }, [
    micPermissionRequest,
    mediaState.audioDeviceId,
    localStream,
    respondMicPermission,
    broadcastSelfMicMuted,
    refreshStudentMicPublishing,
    hubConnectionId,
    t,
    toast,
  ]);

  const declineMicPermission = useCallback(async () => {
    if (!micPermissionRequest) return;
    try {
      await respondMicPermission(micPermissionRequest.requesterConnectionId, false);
    } catch {
      /* ignore */
    } finally {
      setMicPermissionRequest(null);
    }
  }, [micPermissionRequest, respondMicPermission]);

  const endLiveSessionRef = useRef(false);
  waitingForTeacherRef.current = waitingForTeacher;

  const finalizeRoomExit = useCallback(
    async (options?: { redirect?: boolean; kicked?: boolean }) => {
      if (endLiveSessionRef.current) return;
      endLiveSessionRef.current = true;

      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      localStream?.getTracks().forEach((track) => track.stop());

      try {
        await leaveLiveMeeting();
      } catch {
        /* ignore */
      }

      const roomIdNum = Number(room.id);
      const userIdNum = user ? Number(user.id) : NaN;
      if (user?.isRoomSeatLogin && Number.isFinite(roomIdNum) && Number.isFinite(userIdNum)) {
        await releaseRoomSeatSession(roomIdNum, userIdNum);
        await logoutRoomSeat(roomIdNum, userIdNum);
        logoutFromRoom();
        if (options?.redirect !== false) {
          router.replace(`/room/${encodeURIComponent(roomUrlSegment)}`);
        }
        return;
      }

      logoutFromRoom();
      if (options?.redirect !== false) {
        router.replace(`/room/${encodeURIComponent(roomUrlSegment)}`);
      }
    },
    [
      screenStream,
      localStream,
      leaveLiveMeeting,
      room.id,
      user,
      logoutFromRoom,
      router,
      roomUrlSegment,
    ]
  );

  finalizeRoomExitRef.current = finalizeRoomExit;

  useEffect(() => {
    const onPageHide = () => {
      void finalizeRoomExitRef.current({ redirect: false });
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
    };
  }, []);

  broadcastWebcamOverlayRef.current = broadcastWebcamOverlay;

  webRtcExtraHandlersRef.current = {
    onTeacherEndedSession: () => {
      if (canPublishMedia) return;
      toast({
        title: t('seminar_teacher_left_title'),
        description: t('seminar_teacher_left_description'),
      });
      void finalizeRoomExitRef.current();
    },
    onRemoteMicSet: (muted) => {
      if (!muted) {
        localStream?.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setMediaState((prev) => ({ ...prev, isMicOn: true }));
        setIsMicOn(true);
        if (studentMicPublishingRef.current) {
          refreshStudentMicPublishing();
        }
        return;
      }
      localStream?.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setMediaState((prev) => ({ ...prev, isMicOn: false }));
      setIsMicOn(false);
    },
    onMicPermissionRequested: (requesterConnectionId, requesterName) => {
      if (
        studentMicApproved &&
        localStream?.getAudioTracks().some((t) => t.readyState !== 'ended')
      ) {
        void (async () => {
          try {
            await respondMicPermission(requesterConnectionId, true);
            localStream?.getAudioTracks().forEach((track) => {
              track.enabled = true;
            });
            setMediaState((prev) => ({ ...prev, isMicOn: true }));
            setIsMicOn(true);
            refreshStudentMicPublishing();
          } catch {
            /* ignore */
          }
        })();
        return;
      }
      let teacherLabel = requesterName;
      try {
        const parsed = JSON.parse(requesterName) as { name?: string };
        if (parsed.name) teacherLabel = parsed.name;
      } catch {
        /* plain name */
      }
      setMicPermissionRequest({ requesterConnectionId, requesterName: teacherLabel });
    },
    onMicPermissionResponded: (studentConnectionId, accepted) => {
      setPendingMicRequests((prev) => {
        const next = { ...prev };
        delete next[studentConnectionId];
        return next;
      });
      if (accepted) {
        const peer = peers.find((p) => p.connectionId === studentConnectionId);
        setMicApprovedStudents((prev) =>
          markMicApprovedForPeer(prev, peer?.userId, studentConnectionId)
        );
        return;
      }
      toast({
        title: t('seminar_mic_permission_declined_title'),
        description: t('seminar_mic_permission_declined_description'),
      });
    },
    onKickedFromMeeting: (_meetingId, wasBlocked) => {
      toast({
        variant: 'destructive',
        title: t('seminar_kicked_from_room_title'),
        description: wasBlocked
          ? t('seminar_kicked_blocked_description')
          : t('seminar_kicked_description'),
      });
      void finalizeRoomExitRef.current({ kicked: true, redirect: true });
    },
    onHubReconnected: () => {
      setHubConnectionFailed(false);
    },
    onHubConnectionFailed: () => {
      setHubConnectionFailed(true);
      toast({
        variant: 'destructive',
        title: t('seminar_hub_connection_failed_title'),
        description: t('seminar_hub_connection_failed_description'),
      });
    },
    onUserLeft: (connectionId) => {
      setParticipantStates((prev) => {
        if (!prev[connectionId]) return prev;
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
      setLiveParticipantRoles((prev) => {
        if (!prev[connectionId]) return prev;
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
      setPendingMicRequests((prev) => {
        if (!prev[connectionId]) return prev;
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
      setMicApprovedStudents((prev) => {
        const peer = peers.find((p) => p.connectionId === connectionId);
        return clearMicApprovalForPeer(prev, peer?.userId, connectionId);
      });
    },
    onAdminSeatRemoved: (_meetingId, action, wasBlocked) => {
      setAdminSeatRemoval({ action, wasBlocked });
    },
    onJoinDeniedBlocked: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_join_blocked_title'),
        description: t('seminar_join_blocked_description'),
      });
      logoutFromRoom();
      router.push(`/room/${encodeURIComponent(roomUrlSegment)}`);
    },
    onJoinDeniedRoomFull: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_room_login_generic'),
      });
      logoutFromRoom();
      router.push(`/room/${encodeURIComponent(roomUrlSegment)}`);
    },
    onJoinDeniedGuestCapacityFull: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_guest_capacity_full'),
      });
      logoutFromRoom();
      router.push(`/room/${encodeURIComponent(roomUrlSegment)}`);
    },
    onJoinDeniedGuestsDisabled: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_room_login_generic'),
      });
      logoutFromRoom();
      router.push(`/room/${encodeURIComponent(roomUrlSegment)}`);
    },
    onJoinDeniedNotInRoom: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_join_not_in_room_title'),
        description: t('seminar_join_not_in_room_description'),
      });
      logoutFromRoom();
      router.push(`/room/${encodeURIComponent(roomUrlSegment)}`);
    },
    onJoinDeniedAlreadyLoggedIn: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_room_login_already_logged_in'),
      });
      void finalizeRoomExitRef.current();
    },
    onSupersededByNewSession: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_room_login_already_logged_in'),
      });
      void finalizeRoomExitRef.current();
    },
    onJoinDeniedInvalidTicket: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_room_login_failed_title'),
        description: t('seminar_room_login_generic'),
      });
      void finalizeRoomExitRef.current();
    },
    onMeetingEnded: () => {
      toast({
        title: t('seminar_teacher_left_title'),
        description: t('seminar_teacher_left_description'),
      });
      void finalizeRoomExitRef.current();
    },
    onParticipantVideoToggled: (connectionId, isVideoOn) => {
      if (!isVideoOn) {
        if (isAudienceMember) {
          if (remoteTeacherStageRef.current) {
            remoteTeacherStageRef.current.srcObject = null;
            remoteTeacherStageRef.current.load();
          }
          if (remoteTeacherPipRef.current) {
            remoteTeacherPipRef.current.srcObject = null;
            remoteTeacherPipRef.current.load();
          }
        }
      }
      setParticipantStates((prev) => {
        const defaults: ParticipantState = { isMicOn: false, isSharingScreen: false };
        const cur = prev[connectionId] ?? defaults;
        return { ...prev, [connectionId]: { ...cur, isCameraOn: !!isVideoOn } };
      });
    },
    onYourRoleChanged: (role) => {
      if (!user) return;
      const nextRole = role === 'presenter' ? 'presenter' : 'participant';
      updateRoomUser({ ...user, role: nextRole });
      if (hubConnectionId) {
        setLiveParticipantRoles((prev) => ({ ...prev, [hubConnectionId]: nextRole }));
      }
      if (nextRole === 'presenter') {
        setPresenterBadgeVisible(true);
        toast({
          title: t('seminar_presenter_role_granted_title'),
          description: t('seminar_presenter_role_granted_description'),
        });
      } else {
        setPresenterBadgeVisible(false);
        studentMicPublishingRef.current = false;
        setStudentMicApproved(false);
        if (screenStream) stopScreenShareRef.current?.();
        setLocalStream((prev) => {
          if (!prev) return null;
          prev.getVideoTracks().forEach((track) => track.stop());
          prev.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          const audioTracks = prev
            .getAudioTracks()
            .filter((track) => track.readyState !== 'ended');
          return audioTracks.length > 0 ? new MediaStream([...audioTracks]) : null;
        });
        setMediaState((prev) => ({ ...prev, isCameraOn: false, isMicOn: false }));
        setIsCameraOn(false);
        setIsMicOn(false);
        void broadcastMediaState(true, false);
      }
      void syncPublisherMediaStateToRoom();
    },
    onParticipantMuted: (connectionId, isMuted) => {
      const micOn = !isMuted;
      const defaults: ParticipantState = { isMicOn: false, isSharingScreen: false };
      setParticipantStates((prev) => {
        const next = {
          ...prev,
          [connectionId]: { ...(prev[connectionId] ?? defaults), isMicOn: micOn },
        };
        if (user && hubConnectionId && connectionId === hubConnectionId) {
          next[user.id] = { ...(prev[user.id] ?? defaults), isMicOn: micOn };
        }
        return next;
      });
    },
    onParticipantRoleChanged: (connectionId, role) => {
      setLiveParticipantRoles((prev) => ({ ...prev, [connectionId]: role }));
      if (role === 'presenter') {
        toast({
          title: t('seminar_participant_now_presenter_title'),
          description: t('seminar_participant_now_presenter_description'),
        });
      }
    },
    onParticipantScreenShared: (connectionId) => {
      setParticipantStates((prev) => ({
        ...prev,
        [connectionId]: { ...(prev[connectionId] ?? { isMicOn: false, isSharingScreen: false }), isSharingScreen: true },
      }));
    },
    onParticipantScreenShareStopped: (_connectionId) => {
      setParticipantStates((prev) => ({
        ...prev,
        [_connectionId]: {
          ...(prev[_connectionId] ?? { isMicOn: false, isSharingScreen: false }),
          isSharingScreen: false,
        },
      }));
      const el = screenShareVideoRef.current;
      if (el) {
        el.srcObject = null;
        el.load();
      }
    },
    onScreenShareDenied: () => {
      toast({
        variant: 'destructive',
        title: t('seminar_screen_share_denied_title'),
        description: t('seminar_screen_share_limit_description'),
      });
    },
    onRemoteScreenShareStop: () => {
      stopScreenShareRef.current?.();
    },
    onWebcamOverlayUpdated: (x, y, width, height, styleJson, publisherConnectionId) => {
      const container = containerRef.current;
      if (!container) return;
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      if (cw <= 0 || ch <= 0) return;

      const normalized =
        width <= 1 && height <= 1 && x <= 1 && y <= 1
          ? { x, y, width, height }
          : pixelsToNormalized({ x, y, width, height }, cw, ch);

      const pip = getDisplayPipRect(
        {
          x: normalized.x * cw,
          y: normalized.y * ch,
          width: normalized.width * cw,
          height: normalized.height * ch,
        },
        cw,
        ch,
        false
      );
      const peerKey = publisherConnectionId || 'default';
      setRemotePipPos({ x: pip.x, y: pip.y });
      setRemotePipSize({ width: pip.width, height: pip.height });
      setRemotePipEnlarged(false);
      setRemotePipByPeer((prev) => ({
        ...prev,
        [peerKey]: { pos: { x: pip.x, y: pip.y }, size: { width: pip.width, height: pip.height } },
      }));
      const parsedStyle = parseWebcamOverlayStyle(styleJson);
      if (parsedStyle) {
        setRemoteWebcamOverlayByPeer((prev) => ({ ...prev, [peerKey]: parsedStyle }));
      }
    },
    onHandRaised: (connectionId) => {
      if (connectionId === hubConnectionId) setHandRaisedLocal(true);
    },
    onHandLowered: (connectionId) => {
      if (connectionId === hubConnectionId) setHandRaisedLocal(false);
    },
    onChatMessageReceived: (senderName, message) => {
      const myName = user?.displayName || user?.name || '';
      if (senderName === myName) return;
      const notificationTitle = t('seminar_new_message_from', { name: senderName });
      if (panelTab !== 'chat' || document.visibilityState !== 'visible') {
        setUnreadChat((count) => count + 1);
      }
      playNotificationSound();
      toast({ title: notificationTitle, description: message });
      void ensureChatNotificationPermission().then(() => {
        showSeminarChatNotification({
          title: notificationTitle,
          senderName,
          message,
          roomName: room.name,
        });
      });
    },
    onRoomFilesChanged: (_connectionId, senderName) => {
      void refreshRoomFilesRef.current(senderName);
    },
    onResyncMediaStateRequested: () => {
      if (!canPublishMedia && !studentMicPublishingRef.current) return;
      void syncPublisherMediaStateToRoom();
      if (canPublishMedia && containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          const normalized = pixelsToNormalized(
            { x: videoPos.x, y: videoPos.y, width: videoSize.width, height: videoSize.height },
            offsetWidth,
            offsetHeight
          );
          void broadcastWebcamOverlayRef.current?.(
            normalized.x,
            normalized.y,
            normalized.width,
            normalized.height,
            serializeWebcamOverlayStyle({
              ...webcamOverlaySettings,
              brightness: imageSettings.brightness,
              contrast: imageSettings.contrast,
              touchUp: imageSettings.touchUp,
            })
          );
        }
      }
    },
    onPeerJoined: (_connectionId, meta) => {
      applyLivePeerRole(_connectionId, meta?.role);
      if (!canPublishMedia && !studentMicPublishingRef.current) return;
      void syncPublisherMediaStateToRoom();
    },
    onPeerRoleDiscovered: (connectionId, role) => {
      if (!connectionId || !role) return;
      setLiveParticipantRoles((prev) => ({ ...prev, [connectionId]: role }));
    },
    onRoomJoinInitialized: (init) => {
      const roleMap: Record<string, string> = {};
      init.peers.forEach((peer) => {
        if (!peer.connectionId) return;
        const mapped =
          peer.role === 'teacher'
            ? 'organizer'
            : peer.role === 'moderator'
              ? 'admin'
              : peer.role;
        roleMap[peer.connectionId] = mapped;
      });
      setLiveParticipantRoles((prev) => ({ ...prev, ...roleMap }));
    },
  };

  const peerHasLiveScreen = (p: (typeof peers)[0]) => {
    if (!roomScreenSharerIds.includes(p.connectionId)) return false;
    if (p.screenStream?.getVideoTracks().some(isUsableVideoTrack)) return true;
    const slotScreen = p.pc ? listVideoTransceiverSlots(p.pc)[1]?.receiver.track : null;
    if (isUsableVideoTrack(slotScreen)) return true;
    return !!p.stream?.getVideoTracks().some(
      (t) => isScreenShareVideoTrack(t) && isUsableVideoTrack(t)
    );
  };

  const peerHasLiveCamera = (p: (typeof peers)[0]) => {
    // A negotiated recvonly placeholder is also a live/enabled MediaStreamTrack. Require
    // the publisher's SignalR media flag so an empty receiver never hides the avatar.
    if (participantStates[p.connectionId]?.isCameraOn !== true) return false;
    const slotCamera = p.pc ? listVideoTransceiverSlots(p.pc)[0]?.receiver.track : null;
    if (isUsableVideoTrack(slotCamera)) return true;
    return !!p.stream?.getVideoTracks().some(
      (t) => !isScreenShareVideoTrack(t) && isUsableVideoTrack(t)
    );
  };

  const peerHasLiveAudio = (p: (typeof peers)[0]) =>
    !!p.stream?.getAudioTracks().some(isUsableAudioTrack);

  const peerRoleFor = useCallback(
    (connectionId: string, userId: string | undefined, userName: string) =>
      String(
        liveParticipantRoles[connectionId] ?? 
        room.participantRoles[userId || userName] ?? 
        room.participantRoles[`client-${userId}`] ?? 
        ''
      ),
    [liveParticipantRoles, room.participantRoles]
  );

  const findHostPublisherPeer = useCallback(() => {
    const hostRoles = ['organizer', 'admin', 'presenter', 'teacher', 'moderator'];
    if (room.organizerId) {
      const byOrganizer = peers.find((p) => p.userId === room.organizerId);
      if (byOrganizer) return byOrganizer;
    }
    const pickByRoles = (roles: string[]) => {
      for (const roleName of roles) {
        const match = peers.find((p) => peerRoleFor(p.connectionId, p.userId, p.userName) === roleName);
        if (match) return match;
      }
      return null;
    };
    return (
      pickByRoles(hostRoles) ??
      peers.find((p) => peerHasLiveCamera(p) || peerHasLiveAudio(p) || peerHasLiveScreen(p)) ??
      (roomScreenSharerId ? peers.find((p) => p.connectionId === roomScreenSharerId) : null) ??
      null
    );
  }, [peers, peerRoleFor, room.organizerId, roomScreenSharerId]);

  const remoteScreenPeer = useMemo(() => {
    if (roomScreenSharerId) {
      const sharer = peers.find((p) => p.connectionId === roomScreenSharerId);
      if (sharer) return sharer;
    }
    for (const p of peers) {
      if (peerHasLiveScreen(p)) return p;
    }
    return null;
  }, [peers, roomScreenSharerId, roomScreenSharerIds]);

  const localScreenLive =
    isSharingScreen &&
    !!screenStream?.getVideoTracks().some((t) => t.readyState === 'live');

  const liveRemoteScreen = !!remoteScreenPeer && peerHasLiveScreen(remoteScreenPeer);

  const hubReportsRemoteScreenShare =
    isAudienceMember &&
    !!roomScreenSharerId &&
    !isSharingScreen &&
    peers.some((p) => p.connectionId === roomScreenSharerId);

  const remoteTeacherPeer = useMemo(() => {
    if (!isAudienceMember) return null;
    if (liveRemoteScreen && roomScreenSharerId) {
      const sharer = peers.find((p) => p.connectionId === roomScreenSharerId);
      if (sharer && peerHasLiveCamera(sharer)) return sharer;
    }
    return findHostPublisherPeer();
  }, [isAudienceMember, liveRemoteScreen, roomScreenSharerId, peers, findHostPublisherPeer]);

  const { registerPeerAudioRef, unlockAllAudio: unlockRoomAudio, needsAudioUnlock } = useSeminarRoomAudio({
    teacherPeer: null,
    peers,
    playTeacherAudio: false,
    speakerDeviceId: mediaState.speakerDeviceId,
  });

  const remoteTeacherCameraLive = !!remoteTeacherPeer && peerHasLiveCamera(remoteTeacherPeer);

  const showStageScreenShare = localScreenLive || liveRemoteScreen || hubReportsRemoteScreenShare;
  const showStageTeacherCamera =
    isAudienceMember &&
    !showStageScreenShare &&
    remoteTeacherCameraLive;
  const teacherPeerReconnecting =
    isAudienceMember &&
    !!remoteTeacherPeer?.reconnecting &&
    !showStageScreenShare &&
    !remoteTeacherCameraLive;
  const atScreenShareCap =
    roomScreenSharerIds.length >= MAX_CONCURRENT_SCREEN_SHARES && !isSharingScreen;
  const anotherUserSharingScreen = atScreenShareCap;

  const resolveRemoteScreenStream = useCallback((peer: (typeof peers)[0] | null) => {
    if (!peer) return null;
    const dedicated = peer.screenStream?.getVideoTracks().filter(isUsableVideoTrack);
    if (dedicated?.length) return dedicated;
    const slots = peer.pc ? listVideoTransceiverSlots(peer.pc) : [];
    const screenTrack = slots[1]?.receiver.track;
    if (isUsableVideoTrack(screenTrack)) {
      return [screenTrack];
    }
    const misplaced = peer.stream?.getVideoTracks().filter(
      (t) => isScreenShareVideoTrack(t) && isUsableVideoTrack(t)
    );
    if (misplaced?.length) return misplaced;
    return null;
  }, []);

  const defaultOverlayStyle: WebcamOverlayStylePayload = {
    shape: webcamOverlaySettings.shape,
    cornerRadius: webcamOverlaySettings.cornerRadius,
    borderWidth: webcamOverlaySettings.borderWidth,
    borderColor: webcamOverlaySettings.borderColor,
    shadow: webcamOverlaySettings.shadow,
    shadowColor: webcamOverlaySettings.shadowColor,
  };

  const stageTiles: StageTileMedia[] = useMemo(() => {
    const tiles: StageTileMedia[] = [];
    const sharerSet = new Set(roomScreenSharerIds);
    if (isSharingScreen && hubConnectionId) sharerSet.add(hubConnectionId);

    const pushLocal = () => {
      if (!hubConnectionId || !isSharingScreen) return;
      tiles.push({
        connectionId: hubConnectionId,
        userName: user?.displayName || user?.name || t('seminar_you'),
        isLocal: true,
        isTeacher: canPublishMedia,
        hasScreen: true,
        hasCamera: !!(canControlCamera && mediaState.isCameraOn && localStream),
        screenStream: screenStream,
        screenTracks: screenStream?.getVideoTracks().filter(isUsableVideoTrack) ?? null,
        cameraStream: localStream,
        cameraTracks:
          localStream?.getVideoTracks().filter((tr) => !isScreenShareVideoTrack(tr) && isUsableVideoTrack(tr)) ??
          null,
        overlayStyle: defaultOverlayStyle,
        imageFilter: {
          brightness: imageSettings.brightness,
          contrast: imageSettings.contrast,
          touchUp: imageSettings.touchUp,
        },
        pipPos: videoPos,
        pipSize: videoSize,
        isSpeaking: activeSpeakers.has('__self__'),
      });
    };

    pushLocal();

    peers.forEach((peer) => {
      if (!sharerSet.has(peer.connectionId)) return;
      if (peer.connectionId === hubConnectionId) return;
      const role = peerRoleFor(peer.connectionId, peer.userId, peer.userName);
      const isTeacher =
        role === 'organizer' || role === 'admin' || role === 'presenter' || role === 'teacher' || role === 'moderator';
      const screenTracks = resolveRemoteScreenStream(peer);
      const hasScreen = !!screenTracks?.length || peerHasLiveScreen(peer);
      if (!hasScreen) return;
      const overlay =
        remoteWebcamOverlayByPeer[peer.connectionId] ??
        remoteWebcamOverlayByPeer['default'] ??
        defaultOverlayStyle;
      const pip = remotePipByPeer[peer.connectionId];
      tiles.push({
        connectionId: peer.connectionId,
        userName: peer.userName,
        isLocal: false,
        isTeacher,
        hasScreen: true,
        hasCamera: peerHasLiveCamera(peer),
        screenStream: peer.screenStream,
        screenTracks: screenTracks,
        cameraStream: peer.stream,
        cameraTracks:
          peer.stream?.getVideoTracks().filter((tr) => !isScreenShareVideoTrack(tr) && isUsableVideoTrack(tr)) ??
          null,
        overlayStyle: overlay,
        imageFilter: {
          brightness: overlay.brightness ?? 100,
          contrast: overlay.contrast ?? 100,
          touchUp: overlay.touchUp,
        },
        pipPos: pip?.pos,
        pipSize: pip?.size,
        isSpeaking: activeSpeakers.has(peer.connectionId),
      });
    });

    return tiles;
  }, [
    roomScreenSharerIds,
    isSharingScreen,
    hubConnectionId,
    user,
    canPublishMedia,
    canControlCamera,
    mediaState.isCameraOn,
    localStream,
    screenStream,
    peers,
    peerRoleFor,
    remoteWebcamOverlayByPeer,
    remotePipByPeer,
    webcamOverlaySettings,
    imageSettings,
    videoPos,
    videoSize,
    activeSpeakers,
    participantStates,
    t,
  ]);

  const useMultiPresenterStage = stageTiles.length >= 1;

  useEffect(() => {
    const el = screenShareVideoRef.current;
    if (!el) return;
    if (localScreenLive && screenStream) {
      assignVideoSrcObject(el, screenStream, { muted: true });
    } else if ((liveRemoteScreen || hubReportsRemoteScreenShare) && remoteScreenPeer) {
      const remoteTracks = resolveRemoteScreenStream(remoteScreenPeer);
      if (remoteTracks?.length) {
        assignVideoSrcObject(el, remoteTracks, { muted: true });
      } else {
        assignVideoSrcObject(el, null);
      }
    } else {
      assignVideoSrcObject(el, null);
    }
  }, [
    localScreenLive,
    liveRemoteScreen,
    hubReportsRemoteScreenShare,
    screenStream,
    remoteScreenPeer,
    resolveRemoteScreenStream,
  ]);

  useEffect(() => {
    setParticipantStates((prev) => {
      const next = { ...prev };
      let changed = false;
      peers.forEach((peer) => {
        const has = roomScreenSharerIds.includes(peer.connectionId);
        const cur = next[peer.connectionId];
        if (cur && cur.isSharingScreen !== has) {
          next[peer.connectionId] = { ...cur, isSharingScreen: has };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [peers, roomScreenSharerIds]);

  const participantRows = useMemo(() => {
    const rows: ParticipantRow[] = [];
    const seenIdentity = new Set<string>();

    if (user) {
      const localIdentity = String(user.id);
      seenIdentity.add(localIdentity);
      rows.push({
        key: `local-${user.id}`,
        id: user.id,
        label: user.displayName || user.name,
        avatar: resolveUserAvatarUrl(user.avatar),
        role:
          user.id === room.organizerId
            ? 'organizer'
            : (hubConnectionId && liveParticipantRoles[hubConnectionId]) ||
              user.role,
        isLocal: true,
      });
    }
    for (const peer of peers) {
      const identity = peer.userId || peer.connectionId;
      if (!identity || seenIdentity.has(identity)) continue;
      seenIdentity.add(identity);
      rows.push({
        key: `peer-${identity}`,
        id: peer.userId || peer.connectionId,
        label: peer.userName,
        avatar: resolveUserAvatarUrl(peer.avatar || ''),
        role:
          liveParticipantRoles[peer.connectionId] ??
          room.participantRoles[peer.userId || peer.userName] ??
          room.participantRoles[`client-${peer.userId}`] ??
          room.participantRoles[peer.connectionId] ??
          'participant',
        connectionId: peer.connectionId,
        isLocal: false,
      });
    }
    const rank = (r: string) =>
      r === 'organizer' ? 0 : r === 'admin' ? 1 : r === 'presenter' ? 2 : 3;
    return [...rows].sort((a, b) => rank(String(a.role)) - rank(String(b.role)));
  }, [user, peers, room.organizerId, room.participantRoles, liveParticipantRoles, hubConnectionId]);

  useEffect(() => {
    setParticipantStates((prev) => {
      const next: Record<string, ParticipantState> = { ...prev };
      let changed = false;
      participantRows.forEach((row) => {
        const stateKey = row.connectionId ?? row.id;
        if (!next[stateKey]) {
          next[stateKey] = { isMicOn: false, isSharingScreen: false };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [participantRows]);

  const toggleParticipantMic = async (participantConnectionId: string, currentMicOn: boolean) => {
    if (!isOrganizer && !isAdmin && !isPresenter) return;
    const nextMicOn = !currentMicOn;
    const targetPeer = peers.find((p) => p.connectionId === participantConnectionId);
    try {
      if (nextMicOn) {
        // Every 'turn on' click sends a live permission request to the student;
        // the mic icon changes only after the student accepts.
        setPendingMicRequests((prev) => ({ ...prev, [participantConnectionId]: true }));
        await requestMicPermission(participantConnectionId);
      } else {
        await setRemoteMic(participantConnectionId, true);
      }
    } catch {
      setPendingMicRequests((prev) => {
        const next = { ...prev };
        delete next[participantConnectionId];
        return next;
      });
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_mic_toggle_failed_description'),
      });
    }
  };

  const stopParticipantScreenShare = async (participantConnectionId: string) => {
    try {
      await forceStopScreenShare(participantConnectionId);
      toast({
        title: t('seminar_screen_share_stopped_title'),
        description: t('seminar_stopped_screen_share_description'),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_screen_share_stop_failed_description'),
      });
    }
  };

  const handleLeave = async () => {
    if (hasUnsavedRecording && !window.confirm(t('seminar_unsaved_recording_confirm_leave'))) {
      return;
    }

    if (isRecording) {
      handleStopRecording();
    }

    await finalizeRoomExit({ redirect: false });
    router.push(`/room/${encodeURIComponent(roomUrlSegment)}`);
  };



  const stopScreenShare = useCallback(async () => {
    const stream = screenStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsSharingScreen(false);
    try {
      await notifyScreenShare(false);
    } catch {
      /* hub may be reconnecting after a transport blip */
    }
    setScreenStream(null);
    try {
      await broadcastMediaState(!mediaStateRef.current.isMicOn, mediaStateRef.current.isCameraOn);
    } catch {
      /* ignore */
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    resetVideoState();
    const el = screenShareVideoRef.current;
    if (el) {
      el.srcObject = null;
      el.load();
    }
  }, [screenStream, notifyScreenShare, broadcastMediaState]);

  stopScreenShareRef.current = stopScreenShare;

  const handleToggleScreenShare = async () => {
    if (!canPublishMedia || screenShareBusyRef.current) return;

    if (isSharingScreen) {
      screenShareBusyRef.current = true;
      try {
        await stopScreenShare();
      } finally {
        window.setTimeout(() => {
          screenShareBusyRef.current = false;
        }, 600);
      }
      return;
    }

    screenShareBusyRef.current = true;
    try {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
        setScreenStream(null);
        await new Promise<void>((r) => setTimeout(r, 150));
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });

      const videoTrack = displayStream.getVideoTracks()[0];
      if (!videoTrack) {
        displayStream.getTracks().forEach((track) => track.stop());
        throw new Error('No display video track');
      }

      try {
        videoTrack.contentHint = 'detail';
      } catch {
        /* ignore */
      }

      videoTrack.addEventListener('ended', () => {
        stopScreenShare();
        screenShareBusyRef.current = false;
      });

      // Register with the hub BEFORE flipping local state: the server authorizes the share
      // and force-stops the active sharer (single-sharer takeover). On failure we tear the
      // capture down instead of leaving the local UI in a sharing state that never publishes.
      await notifyScreenShare(true);
      setScreenStream(displayStream);
      setIsSharingScreen(true);

      if (anotherUserSharingScreen) {
        toast({
          title: t('seminar_screen_share_takeover_title'),
          description: t('seminar_screen_share_takeover_description'),
        });
      }
    } catch (error) {
      const hubErr = String(error);
      if (hubErr.includes('already sharing')) {
        toast({
          variant: 'destructive',
          title: t('seminar_screen_share_denied_title'),
          description: t('seminar_screen_share_limit_description'),
        });
      } else if (
        (error as DOMException)?.name !== 'NotAllowedError' &&
        !isBenignSignalTransportError(String(error))
      ) {
        console.error('Error sharing screen:', error);
        toast({
          variant: 'destructive',
          title: t('seminar_screen_share_failed_title'),
          description: t('seminar_screen_share_failed_description'),
        });
      }
    } finally {
      window.setTimeout(() => {
        screenShareBusyRef.current = false;
      }, 400);
    }
  };

  const handleToggleStageFullscreen = async () => {
    const container = stageScreenContainerRef.current;
    const screenVideo = screenShareVideoRef.current;
    const teacherVideo = remoteTeacherStageRef.current;
    const activeVideo = showStageTeacherCamera ? teacherVideo : screenVideo;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (isIosSafari() && activeVideo) {
        const videoWithFs = activeVideo as HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        };
        videoWithFs.webkitEnterFullscreen?.();
        setIsStageFullscreen(true);
        return;
      }

      const target = container ?? activeVideo;
      if (!target) return;
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else {
        const videoWithFs = activeVideo as HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        };
        videoWithFs?.webkitEnterFullscreen?.();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast({
        variant: 'destructive',
        title: t('seminar_fullscreen_failed_title'),
        description: t('seminar_fullscreen_failed_description'),
      });
    }
  };

  const handleToggleFullScreen = () => {
    void handleToggleStageFullscreen();
  };

  const handleKickParticipant = async (participantConnectionId: string, participantName?: string) => {
    try {
      await kickParticipant(participantConnectionId, false, participantName);
    } catch {
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_kick_failed_description'),
      });
    }
  };

  const handleKickAndBlockParticipant = async (participantConnectionId: string, participantName?: string) => {
    try {
      await kickParticipant(participantConnectionId, true, participantName);
    } catch {
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_kick_block_failed_description'),
      });
    }
  };

  const handleMakePresenter = async (participantConnectionId: string, participantName?: string) => {
    try {
      await setParticipantRoleRemote(participantConnectionId, 'presenter', participantName);
      setLiveParticipantRoles((prev) => ({ ...prev, [participantConnectionId]: 'presenter' }));
    } catch {
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_role_change_failed_description'),
      });
    }
  };

  const updateParticipantGrants = async (
    participantConnectionId: string,
    participantName: string | undefined,
    grants: { voice: boolean; video: boolean; presenter: boolean }
  ) => {
    try {
      await setParticipantGrantsRemote(participantConnectionId, grants, participantName);
    } catch {
      toast({ variant: 'destructive', title: t('seminar_action_failed_title') });
    }
  };

  const handleMakeParticipant = async (participantConnectionId: string, participantName?: string) => {
    try {
      await setParticipantRoleRemote(participantConnectionId, 'participant', participantName);
      setLiveParticipantRoles((prev) => ({ ...prev, [participantConnectionId]: 'participant' }));
    } catch {
      toast({
        variant: 'destructive',
        title: t('seminar_action_failed_title'),
        description: t('seminar_role_change_failed_description'),
      });
    }
  };

  const bindRemoteTeacherStream = useCallback(
    (el: HTMLVideoElement | null, withAudio: boolean) => {
      if (!el || !remoteTeacherPeer?.stream) {
        assignVideoSrcObject(el, null);
        return;
      }
      if (participantStates[remoteTeacherPeer.connectionId]?.isCameraOn === false && !withAudio) {
        assignVideoSrcObject(el, null);
        return;
      }
      const audio = remoteTeacherPeer.stream
        .getAudioTracks()
        .filter(isUsableAudioTrack);
      const slots = remoteTeacherPeer.pc ? listVideoTransceiverSlots(remoteTeacherPeer.pc) : [];
      const slotCamera = slots[0]?.receiver.track;
      const camera: MediaStreamTrack[] = [];
      if (isUsableVideoTrack(slotCamera)) {
        camera.push(slotCamera!);
      } else {
        remoteTeacherPeer.stream
          .getVideoTracks()
          .filter((t) => !isScreenShareVideoTrack(t) && isUsableVideoTrack(t))
          .forEach((t) => camera.push(t));
      }
      const tracks =
        withAudio && camera.length > 0
          ? [...audio, ...camera]
          : camera.length > 0
            ? [...camera]
            : withAudio
              ? [...audio]
              : [];
      assignVideoSrcObject(el, tracks, { muted: true });
    },
    [remoteTeacherPeer, participantStates]
  );

  useEffect(() => {
    if (isAudienceMember && showStageScreenShare && remoteTeacherCameraLive) {
      resetRemotePipState();
    }
  }, [isAudienceMember, showStageScreenShare, remoteTeacherCameraLive, resetRemotePipState]);

  useEffect(() => {
    if (!isAudienceMember) return;
    if (showStageTeacherCamera) {
      bindRemoteTeacherStream(remoteTeacherStageRef.current, false);
      assignVideoSrcObject(remoteTeacherPipRef.current, null);
    } else if (showStageScreenShare && remoteTeacherCameraLive) {
      bindRemoteTeacherStream(remoteTeacherPipRef.current, false);
      assignVideoSrcObject(remoteTeacherStageRef.current, null);
    } else {
      assignVideoSrcObject(remoteTeacherStageRef.current, null);
      assignVideoSrcObject(remoteTeacherPipRef.current, null);
    }
  }, [
    isAudienceMember,
    showStageTeacherCamera,
    showStageScreenShare,
    remoteTeacherCameraLive,
    bindRemoteTeacherStream,
    remoteTeacherPeer,
    peers,
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (waitingForTeacher) return;
    if (newMessage.trim() && user) {
      rtcSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getFileExtension = (mimeType: string) => {
    const defaultExt = 'webm';
    if (!mimeType) return defaultExt;
    const parts = mimeType.split('/');
    if (parts.length < 2) return defaultExt;
    const subType = parts[1].split(';')[0];
    return subType || defaultExt;
  }

  const handleGenerateVideoSummary = async () => {
    if (isGeneratingSummary) {
      toast({
        variant: 'default',
        title: t('seminar_summary_in_progress_title'),
        description: t('seminar_summary_in_progress_description'),
      });
      return;
    }

    if (recordedChunksRef.current.length === 0) {
      toast({
        variant: 'destructive',
        title: t('seminar_summary_missing_recording_title'),
        description: t('seminar_summary_missing_recording_description'),
      });
      return;
    }

    toast({
      title: t('seminar_generating_summary_title'),
      description: t('seminar_generating_summary_description'),
    });

    setIsGeneratingSummary(true);

    const blob = new Blob(recordedChunksRef.current, { type: recordingSettings.format });

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      try {
        const summary = await generateSummaryFromVideo({ videoDataUri: base64data });
        const summaryParam = encodeURIComponent(JSON.stringify(summary));
        setHasUnsavedRecording(false);
        router.push(`/dashboard/summary?summary=${summaryParam}`);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: t('seminar_summary_generation_failed_title'),
          description: (error as Error).message,
        });
        setIsGeneratingSummary(false); // Reset on failure
      }
    };
    reader.onerror = () => {
      setIsGeneratingSummary(false);
      toast({
        variant: 'destructive',
        title: t('seminar_file_read_error_title'),
        description: t('seminar_file_read_error_description'),
      });
    }
  };


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prevDuration => prevDuration + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused]);

  const handleStartRecording = async () => {
    if (!isSharingScreen || !screenShareVideoRef.current || !canvasRef.current) {
      toast({
        variant: 'destructive',
        title: t('seminar_recording_error_title'),
        description: t('seminar_recording_requires_screen_share'),
      });
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resolutions: { [key: string]: { width: number, height: number } } = {
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
    };

    const bitrates: { [key: string]: number } = {
      'high': 5000000,
      'medium': 2500000,
      'low': 1000000,
    }

    const { width, height } = resolutions[recordingSettings.resolution] || resolutions['1080p'];
    canvas.width = width;
    canvas.height = height;

    const drawToCanvas = () => {
      if (!screenShareVideoRef.current || !canvasRef.current) return;
      const screenVideo = screenShareVideoRef.current;
      const webcamVideo = teacherVideoRef.current;

      // Maintain aspect ratio of the screen share
      const screenAspectRatio = screenVideo.videoWidth / screenVideo.videoHeight;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;

      if (drawWidth / drawHeight > screenAspectRatio) {
        drawWidth = drawHeight * screenAspectRatio;
      } else {
        drawHeight = drawWidth / screenAspectRatio;
      }

      const xOffset = (canvas.width - drawWidth) / 2;
      const yOffset = (canvas.height - drawHeight) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw screen share
      ctx.drawImage(screenVideo, xOffset, yOffset, drawWidth, drawHeight);

      // Draw webcam on top
      if (webcamVideo && mediaState.isCameraOn && localStream && webcamVideo.readyState >= 2) { // Ensure webcam video is ready
        ctx.save();
        const pipWidth = (videoSize.width / containerRef.current!.offsetWidth) * canvas.width;
        const pipHeight = (videoSize.height / containerRef.current!.offsetHeight) * canvas.height;
        const pipX = (videoPos.x / containerRef.current!.offsetWidth) * canvas.width;
        const pipY = (videoPos.y / containerRef.current!.offsetHeight) * canvas.height;

        // Apply shadow if enabled
        if (webcamOverlaySettings.shadow) {
          ctx.shadowColor = webcamOverlaySettings.shadowColor;
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 5;
          ctx.shadowOffsetY = 5;
        }

        // Create clipping path for shape (circle or rounded rect)
        ctx.beginPath();
        if (webcamOverlaySettings.shape === 'circle') {
          ctx.arc(pipX + pipWidth / 2, pipY + pipHeight / 2, Math.min(pipWidth, pipHeight) / 2, 0, Math.PI * 2);
        } else {
          const radius = (webcamOverlaySettings.cornerRadius / defaultVideoSize.width) * pipWidth;
          ctx.moveTo(pipX + radius, pipY);
          ctx.lineTo(pipX + pipWidth - radius, pipY);
          ctx.quadraticCurveTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + radius);
          ctx.lineTo(pipX + pipWidth, pipY + pipHeight - radius);
          ctx.quadraticCurveTo(pipX + pipWidth, pipY + pipHeight, pipX + pipWidth - radius, pipY + pipHeight);
          ctx.lineTo(pipX + radius, pipY + pipHeight);
          ctx.quadraticCurveTo(pipX, pipY + pipHeight, pipX, pipY + pipHeight - radius);
          ctx.lineTo(pipX, pipY + radius);
          ctx.quadraticCurveTo(pipX, pipY, pipX + radius, pipY);
        }
        ctx.closePath();

        // Fill for shadow to appear, then clip
        if (webcamOverlaySettings.shadow) {
          ctx.fillStyle = 'rgba(0,0,0,0)'; // transparent fill
          ctx.fill();
        }
        ctx.clip();

        // Reset shadow for subsequent draws inside clip
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Apply background effect
        if (imageSettings.backgroundEffect === 'blur') {
          // This is a simplified blur. For a true background blur, a segmentation library would be needed.
          // We draw the webcam multiple times with slight offsets.
          ctx.filter = `blur(8px)`;
          ctx.drawImage(webcamVideo, pipX, pipY, pipWidth, pipHeight);
        } else if (imageSettings.backgroundEffect === 'image' && imageSettings.backgroundImage) {
          // Background image logic would go here if implemented
        }

        // Apply image adjustments and draw webcam
        let combinedFilter = `brightness(${imageSettings.brightness}%) contrast(${imageSettings.contrast}%)`;
        if(imageSettings.touchUp){
          combinedFilter += ` blur(1px)`; // slight blur for touch-up
        }
        ctx.filter = combinedFilter;
        ctx.drawImage(webcamVideo, pipX, pipY, pipWidth, pipHeight);
        ctx.filter = 'none';

        // Restore canvas state to remove clipping
        ctx.restore();

        // Draw border on top of the clipped image
        if (webcamOverlaySettings.borderWidth > 0) {
          ctx.save();
          ctx.beginPath();
          if (webcamOverlaySettings.shape === 'circle') {
            ctx.arc(pipX + pipWidth / 2, pipY + pipHeight / 2, Math.min(pipWidth, pipHeight) / 2, 0, Math.PI * 2);
          } else {
            const radius = (webcamOverlaySettings.cornerRadius / defaultVideoSize.width) * pipWidth;
            ctx.moveTo(pipX + radius, pipY);
            ctx.lineTo(pipX + pipWidth - radius, pipY);
            ctx.quadraticCurveTo(pipX + pipWidth, pipY, pipX + pipWidth, pipY + radius);
            ctx.lineTo(pipX + pipWidth, pipY + pipHeight - radius);
            ctx.quadraticCurveTo(pipX + pipWidth, pipY + pipHeight, pipX + pipWidth - radius, pipY + pipHeight);
            ctx.lineTo(pipX + radius, pipY + pipHeight);
            ctx.quadraticCurveTo(pipX, pipY + pipHeight, pipX, pipY + pipHeight - radius);
            ctx.lineTo(pipX, pipY + radius);
            ctx.quadraticCurveTo(pipX, pipY, pipX + radius, pipY);
          }
          ctx.closePath();
          ctx.lineWidth = (webcamOverlaySettings.borderWidth / defaultVideoSize.width) * pipWidth * 2;
          ctx.strokeStyle = webcamOverlaySettings.borderColor;
          ctx.stroke();
          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawToCanvas);
    };

    drawToCanvas();

    const canvasStream = canvas.captureStream();
    recordingAudioMixerRef.current?.dispose();
    const mixer = new SeminarRecordingAudioMixer();
    recordingAudioMixerRef.current = mixer;
    await mixer.resume();
    mixer.sync(
      collectRecordingAudioTracks({
        localStream,
        screenStream,
        peers,
        includeParticipantAudio: recordingSettings.includeParticipantAudio !== false,
      })
    );

    const mixedAudioTrack = mixer.mixedTrack;
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...(mixedAudioTrack ? [mixedAudioTrack] : []),
    ]);

    setRecordedVideoUrl(null);
    recordedChunksRef.current = [];
    setRecordingDuration(0);

    let mimeType = recordingSettings.format;
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const options = {
      mimeType,
      videoBitsPerSecond: bitrates[recordingSettings.quality] || bitrates['high'],
    };

    try {
      const recorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        recordingAudioMixerRef.current?.dispose();
        recordingAudioMixerRef.current = null;
        // Only stop canvas-derived tracks; never stop live mic/screen tracks.
        canvasStream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setHasUnsavedRecording(true);

        const newRecording: Omit<RecordedItem, 'id'> = {
          name: `Recording - ${room.name} - ${new Date().toLocaleString()}`,
          url,
          duration: recordingDuration,
          timestamp: Date.now(),
          size: blob.size,
          fileExtension: getFileExtension(mimeType),
        };
        if (addRecording) {
          addRecording(newRecording);
        }

        setIsRecording(false);
        setIsPaused(false);
        toast({
          title: t('seminar_recording_finished_title'),
          description: t('seminar_recording_finished_description'),
        });
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      toast({ title: t('seminar_recording_started_title') });

    } catch (error) {
      console.error("Recording failed to start:", error);
      recordingAudioMixerRef.current?.dispose();
      recordingAudioMixerRef.current = null;
      canvasStream.getTracks().forEach((track) => track.stop());
      toast({
        variant: 'destructive',
        title: t('seminar_recording_error_title'),
        description: t('seminar_recording_start_failed_description'),
      });
    }
  };
  const handlePauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      toast({ title: t('seminar_recording_resumed_title') });
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      toast({ title: t('seminar_recording_paused_title') });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Keep remote/local audio sources in the recording mix while recording.
  useEffect(() => {
    if (!isRecording || !recordingAudioMixerRef.current) return;
    recordingAudioMixerRef.current.sync(
      collectRecordingAudioTracks({
        localStream,
        screenStream,
        peers,
        includeParticipantAudio: recordingSettings.includeParticipantAudio !== false,
      })
    );
  }, [
    isRecording,
    localStream,
    screenStream,
    peers,
    recordingSettings.includeParticipantAudio,
  ]);

  const standardDownload = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${room.id}.${getFileExtension(recordingSettings.format)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setHasUnsavedRecording(false);

    // Simulate progress for anchor download
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setDownloadProgress(null), 500);
      }
    }, 100);
  }

  const handleDownload = async () => {
    if (!recordedVideoUrl) return;

    setDownloadProgress(0);
    const blob = new Blob(recordedChunksRef.current, { type: recordingSettings.format });

    if (recordingSettings.saveLocation === 'picker' && 'showSaveFilePicker' in window) {
      try {
        const handle : any = await ((window.showSaveFilePicker) as any)({
          suggestedName: `recording-${room.id}.${getFileExtension(recordingSettings.format)}`,
          types: [{
            description: t('seminar_download_file_type_description'),
            accept: { [recordingSettings.format.split(';')[0]]: [`.${getFileExtension(recordingSettings.format)}`] }
          }]
        });
        const writable = await handle.createWritable();

        const totalSize = blob.size;
        const chunkSize = 1024 * 1024;
        for (let i = 0; i < totalSize; i += chunkSize) {
          const chunk = blob.slice(i, i + chunkSize);
          await writable.write(chunk);
          setDownloadProgress(((i + chunk.size) / totalSize) * 100);
        }
        await writable.close();
        setHasUnsavedRecording(false);

        toast({
          title: t('seminar_download_complete_title'),
          description: t('seminar_download_complete_description'),
        });
      } catch (err) {
        // Fallback for cross-origin or abort errors
        if ((err as DOMException).name === 'SecurityError' || (err as DOMException).name === 'AbortError') {
          if ((err as DOMException).name === 'SecurityError') {
            console.warn("showSaveFilePicker failed due to security restrictions, falling back to standard download.");
          }
          standardDownload(recordedVideoUrl);
        } else {
          console.error('Error saving file:', err);
          toast({
            variant: 'destructive',
            title: t('seminar_save_error_title'),
            description: t('seminar_save_error_description'),
          });
        }
      }
    } else {
      standardDownload(recordedVideoUrl);
    }

    setTimeout(() => setDownloadProgress(null), 2000);
  };

  const handleRevealControls = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 4000);
  };

  const handleMouseMove = () => {
    handleRevealControls();
  };


  const handleToggleWithStreamUpdate = async (type: 'mic' | 'camera') => {
    const isMic = type === 'mic';
    const micAllowed = canControlMic || isStrictStudent;
    const allowed = isMic ? micAllowed : canControlCamera;
    if (!allowed) return;

    if (isMic) {
      setMediaState((prevState) => {
        const newIsOn = !prevState.isMicOn;
        if (localStream) {
          localStream.getAudioTracks().forEach((track) => {
            track.enabled = newIsOn;
          });
        }
        queueMicrotask(() => {
          setIsMicOn(newIsOn);
          void broadcastMediaState(!newIsOn, prevState.isCameraOn);
        });
        return { ...prevState, isMicOn: newIsOn };
      });
      return;
    }

    const turningOn = !mediaStateRef.current.isCameraOn;
    if (!turningOn) {
      setMediaState((prevState) => {
        if (localStream) {
          localStream.getVideoTracks().forEach((track) => track.stop());
          const audioTracks = localStream
            .getAudioTracks()
            .filter((track) => track.readyState !== 'ended');
          setLocalStream(audioTracks.length > 0 ? new MediaStream([...audioTracks]) : null);
        }
        if (teacherVideoRef.current) {
          teacherVideoRef.current.srcObject = null;
          teacherVideoRef.current.load();
        }
        queueMicrotask(() => {
          setIsCameraOn(false);
          void broadcastMediaState(!prevState.isMicOn, false);
        });
        return { ...prevState, isCameraOn: false };
      });
      return;
    }

    try {
      const videoConstraints = buildMediaStreamConstraints({
        wantAudio: false,
        wantVideo: true,
        audioDeviceId: null,
        videoDeviceId: mediaStateRef.current.videoDeviceId,
        mobile: isMobileViewport(),
        processing: {
          echoCancellation: mediaStateRef.current.echoCancellation,
          noiseSuppression: mediaStateRef.current.noiseSuppression,
          autoGainControl: mediaStateRef.current.autoGainControl,
          voiceIsolation: mediaStateRef.current.voiceIsolation,
          audioQuality: mediaStateRef.current.audioQuality,
          videoQuality: mediaStateRef.current.videoQuality,
        },
      });
      const videoOnly = await getUserMediaWithFallback(videoConstraints);
      const videoTrack = videoOnly.getVideoTracks().find((t) => t.readyState !== 'ended');
      if (!videoTrack) {
        videoOnly.getTracks().forEach((t) => t.stop());
        throw new Error('No video track');
      }
      setLocalStream((prev) => {
        const audioTracks =
          prev?.getAudioTracks().filter((track) => track.readyState !== 'ended') ?? [];
        prev?.getVideoTracks().forEach((track) => track.stop());
        return new MediaStream([...audioTracks, videoTrack]);
      });
      setMediaState((prev) => ({ ...prev, isCameraOn: true }));
      setIsCameraOn(true);
      void broadcastMediaState(!mediaStateRef.current.isMicOn, true);
    } catch (error) {
      console.error('Failed to enable camera:', error);
      toast({
        variant: 'destructive',
        title: t('seminar_device_error_title'),
        description: t('seminar_device_error_description'),
      });
    }
  };

  const handleToggleMic = () => {
    void handleToggleWithStreamUpdate('mic');
  };

  const handleToggleCamera = () => {
    void handleToggleWithStreamUpdate('camera');
  };

  useEffect(() => {
    handleToggleMicRef.current = handleToggleMic;
    handleToggleCameraRef.current = handleToggleCamera;
  }, [handleToggleMic, handleToggleCamera]);
  useEffect(() => {
    handleStopScreenShareRef.current = async () => {
      if (isSharingScreen) await stopScreenShare();
    };
  }, [isSharingScreen, stopScreenShare]);

  const initializeStream = useCallback(async () => {
    try {
      const wantVideo = canControlCamera && mediaStateRef.current.isCameraOn;
      const wantAudio =
        (canPublishMedia && canControlMic) ||
        (isStrictStudent && studentMicApproved);
      if (!wantAudio && !wantVideo) {
        setLocalStream((prev) => {
          prev?.getTracks().forEach((track) => track.stop());
          return null;
        });
        return;
      }

      const constraints = buildMediaStreamConstraints({
        wantAudio,
        wantVideo,
        audioDeviceId: mediaStateRef.current.audioDeviceId,
        videoDeviceId: mediaStateRef.current.videoDeviceId,
        mobile: isMobileViewport(),
        processing: {
          echoCancellation: mediaStateRef.current.echoCancellation,
          noiseSuppression: mediaStateRef.current.noiseSuppression,
          autoGainControl: mediaStateRef.current.autoGainControl,
          voiceIsolation: mediaStateRef.current.voiceIsolation,
          audioQuality: mediaStateRef.current.audioQuality,
          videoQuality: mediaStateRef.current.videoQuality,
        },
      });

      const stream = await getUserMediaWithFallback(constraints);
      stream.getAudioTracks().forEach((track) => {
        track.enabled = mediaStateRef.current.isMicOn;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = mediaStateRef.current.isCameraOn;
      });

      setLocalStream((prev) => {
        prev?.getTracks().forEach((track) => {
          if (track.readyState !== 'ended') track.stop();
        });
        return stream;
      });

      if (canPublishMedia) {
        void broadcastMediaState(!mediaStateRef.current.isMicOn, mediaStateRef.current.isCameraOn);
      }

      if (!mediaStateRef.current.audioDeviceId && stream.getAudioTracks().length > 0) {
        setMediaState((prev) => ({
          ...prev,
          audioDeviceId: stream.getAudioTracks()[0].getSettings().deviceId || null,
        }));
      }
      if (!mediaStateRef.current.videoDeviceId && stream.getVideoTracks().length > 0) {
        setMediaState((prev) => ({
          ...prev,
          videoDeviceId: stream.getVideoTracks()[0].getSettings().deviceId || null,
        }));
      }
    } catch (error) {
      console.error('Failed to get media devices:', error);
      toast({
        variant: 'destructive',
        title: t('seminar_device_error_title'),
        description: t('seminar_device_error_description'),
      });
    }
  }, [
    canControlCamera,
    canControlMic,
    canPublishMedia,
    isStrictStudent,
    studentMicApproved,
    mediaState.audioDeviceId,
    mediaState.videoDeviceId,
    mediaState.echoCancellation,
    mediaState.noiseSuppression,
    mediaState.autoGainControl,
    mediaState.voiceIsolation,
    mediaState.audioQuality,
    mediaState.videoQuality,
    broadcastMediaState,
    t,
    toast,
  ]);

  useEffect(() => {
    void initializeStream();

    return () => {
      // Tracks are stopped on unmount / leave; avoid stopping on every re-init dep change.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mediaState.videoDeviceId,
    mediaState.audioDeviceId,
    mediaState.echoCancellation,
    mediaState.noiseSuppression,
    mediaState.autoGainControl,
    mediaState.voiceIsolation,
    mediaState.audioQuality,
    mediaState.videoQuality,
    studentMicApproved,
    canPublishMedia,
    canControlMic,
    canControlCamera,
  ]);

  useEffect(() => {
    if (isPresenter) setPresenterBadgeVisible(true);
  }, [isPresenter]);

  // Keep mic enabled flag in sync without re-acquiring devices.
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = mediaState.isMicOn;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream, mediaState.isMicOn]);

  const filterStyle = `brightness(${imageSettings.brightness}%) contrast(${imageSettings.contrast}%)`;

  const viewerWebcamOverlay =
    (remoteTeacherPeer?.connectionId
      ? remoteWebcamOverlayByPeer[remoteTeacherPeer.connectionId]
      : undefined) ??
    remoteWebcamOverlayByPeer['default'] ??
    webcamOverlaySettings;
  const viewerImageFilters = {
    brightness: viewerWebcamOverlay.brightness ?? imageSettings.brightness,
    contrast: viewerWebcamOverlay.contrast ?? imageSettings.contrast,
    touchUp: viewerWebcamOverlay.touchUp ?? imageSettings.touchUp,
  };
  const remotePipFilterStyle = `brightness(${viewerImageFilters.brightness}%) contrast(${viewerImageFilters.contrast}%)`;

  const webcamOverlayStyle: React.CSSProperties = {
    left: `${videoPos.x}px`,
    top: `${videoPos.y}px`,
    width: `${videoSize.width}px`,
    height: `${videoSize.height}px`,
    borderRadius: webcamOverlaySettings.shape === 'circle' ? '9999px' : `${webcamOverlaySettings.cornerRadius}px`,
    border: `${webcamOverlaySettings.borderWidth}px solid ${webcamOverlaySettings.borderColor}`,
    boxShadow: webcamOverlaySettings.shadow ? `0 10px 20px -5px ${webcamOverlaySettings.shadowColor}` : 'none',
    backgroundImage: imageSettings.backgroundEffect === 'image' && imageSettings.backgroundImage ? `url(${imageSettings.backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const webcamVideoStyle: React.CSSProperties = {
    borderRadius: webcamOverlaySettings.shape === 'circle' ? '9999px' : `${Math.max(0, webcamOverlaySettings.cornerRadius - webcamOverlaySettings.borderWidth)}px`,
    filter: filterStyle,
  };

  const webcamBackdropStyle: React.CSSProperties = {
    backdropFilter: imageSettings.backgroundEffect === 'blur' ? 'blur(8px)' : 'none',
    WebkitBackdropFilter: imageSettings.backgroundEffect === 'blur' ? 'blur(8px)' : 'none',
    borderRadius: webcamVideoStyle.borderRadius,
  }

  const webcamVideoClasses = cn("h-full w-full object-cover relative", {
    'blur-sm': imageSettings.touchUp,
  });

  const renderRoleBadge = (role: string) => {
    if (role === 'presenter') {
      return (
        <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-5 shrink-0">
          <Ticket className="h-3 w-3" />
          {t('seminar_role_presenter_badge')}
        </Badge>
      );
    }
    if (role === 'organizer' || role === 'admin') {
      return (
        <Badge variant="default" className="gap-1 text-[10px] px-1.5 py-0 h-5 shrink-0">
          <Presentation className="h-3 w-3" />
          {t('seminar_role_teacher_badge')}
        </Badge>
      );
    }
    return null;
  };

  // ── Meet-style room layout state ──
  const [pinnedConnectionId, setPinnedConnectionId] = useState<string | null>(null);
  const [autoLayout, setAutoLayout] = useState(true);
  const isSidebarOpen = panelTab !== null;
  const handleLeaveNow = () => {
    setIsLeaveDialogOpen(false);
    handleLeave();
  };

  const roomTileFromControl = (control: HTMLElement) =>
    control.closest<HTMLElement>('[data-room-media-tile]');

  const adjustRoomTileZoom = (control: HTMLElement, delta: number) => {
    const tile = roomTileFromControl(control);
    if (!tile) return;
    const current = Number(tile.dataset.zoom || '1');
    const next = Math.min(3, Math.max(1, Math.round((current + delta) * 10) / 10));
    tile.dataset.zoom = String(next);
    tile.style.setProperty('--tile-zoom', String(next));
  };

  const toggleRoomTileFullscreen = async (control: HTMLElement) => {
    const tile = roomTileFromControl(control);
    if (!tile) return;
    if (document.fullscreenElement === tile) await document.exitFullscreen();
    else await tile.requestFullscreen();
  };

  const snapshotRoomTile = (control: HTMLElement, name: string) => {
    const tile = roomTileFromControl(control);
    const video = tile?.querySelector<HTMLVideoElement>('[data-primary-video]');
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.download = `${name || 'participant'}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const renderRoomTile = (opts: {
    connectionId?: string;
    userId?: string;
    name: string;
    avatar?: string;
    isSelf: boolean;
    size: 'rail' | 'grid' | 'focal';
    isPinned?: boolean;
    tileKey?: string;
  }) => {
    const { connectionId, userId, name, avatar, isSelf, size, isPinned } = opts;
    const reactKey = opts.tileKey ?? connectionId ?? (isSelf ? 'self' : name);
    const peer = isSelf ? null : peers.find((p) => p.connectionId === connectionId);
    const pState =
      participantStates[connectionId ?? ''] ?? { isMicOn: false, isSharingScreen: false };
    const camOn = isSelf
      ? mediaState.isCameraOn && !!localStream
      : !!peer && peerHasLiveCamera(peer);
    const isSpeaking = activeSpeakers.has(isSelf ? '__self__' : connectionId ?? '');
    const micOn = isSelf ? mediaState.isMicOn : pState.isMicOn;
    const handRaised = !isSelf && connectionId ? raisedHandIds.includes(connectionId) : false;
    const role = isSelf
      ? String(user?.role ?? 'participant')
      : String(
          liveParticipantRoles[connectionId ?? ''] ??
            peerRoleFor(connectionId ?? '', userId, name) ??
            'participant'
        );
    const youLabel = locale === 'fa' ? 'شما' : 'You';
    const displayName = isSelf ? `${name} (${youLabel})` : name;
    const initials =
      (name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('') || '?';
    const micRequestPending = connectionId ? pendingMicRequests[connectionId] : false;

    return (
      <div
        key={reactKey}
        data-room-media-tile
        data-zoom="1"
        onDoubleClick={(event) => void toggleRoomTileFullscreen(event.currentTarget)}
        className={cn(
          'group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/10 via-background to-background shadow-lg transition-all',
          size === 'focal'
            ? 'h-full w-full border-primary/40 ring-2 ring-primary/50'
            : 'w-full',
          size === 'grid' && 'aspect-video min-h-[150px]',
          size === 'rail' && 'aspect-video w-40 shrink-0 md:w-48',
          isSpeaking && 'scale-[1.01] border-emerald-400 ring-4 ring-emerald-400/50 shadow-emerald-500/30',
          isPinned && 'border-amber-500/50'
        )}
      >
        {/* Every rendered tile owns its media binding. The same participant can exist in
            grid, rail and focal layouts without duplicate DOM ids stealing the stream. */}
        {!isSelf && connectionId && (
          <video
            ref={(el) => {
              if (!el) return;
              const tracks = camOn
                ? peer?.stream
                    ?.getVideoTracks()
                    .filter((track) => !isScreenShareVideoTrack(track) && isUsableVideoTrack(track)) ?? []
                : [];
              assignVideoSrcObject(el, tracks, { muted: true });
            }}
            data-primary-video
            autoPlay
            playsInline
            muted
            className={cn('h-full w-full object-cover transition-all duration-300', !camOn && 'opacity-0')}
            style={{ transform: 'scale(var(--tile-zoom, 1))' }}
          />
        )}
        {/* Local camera layer */}
        {isSelf && (
          <video
            ref={(el) => {
              if (!el) return;
              const tracks = camOn
                ? localStream
                    ?.getVideoTracks()
                    .filter((track) => !isScreenShareVideoTrack(track) && isUsableVideoTrack(track)) ?? []
                : [];
              assignVideoSrcObject(el, tracks, { muted: true });
            }}
            data-primary-video
            muted
            autoPlay
            playsInline
            className={cn('h-full w-full object-cover transition-all duration-300', !camOn && 'opacity-0')}
            style={{ transform: 'scale(var(--tile-zoom, 1))' }}
          />
        )}

        {/* Avatar fallback when camera is off */}
        {!camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3">
            <div className="relative">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full border border-primary/40 bg-primary/20 shadow-[0_0_50px_-8px] shadow-primary/50',
                  size === 'rail' ? 'h-12 w-12' : size === 'focal' ? 'h-28 w-28 md:h-36 md:w-36' : 'h-20 w-20 md:h-24 md:w-24'
                )}
              >
                <span
                  className={cn(
                    'font-bold text-primary-foreground',
                    size === 'rail' ? 'text-sm' : 'text-2xl md:text-3xl'
                  )}
                >
                  {initials}
                </span>
              </div>
              {isSpeaking && (
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-emerald-400/70" />
              )}
            </div>
            <p className={cn('font-semibold', size === 'rail' ? 'text-[11px]' : 'text-sm md:text-base')}>
              {name}
            </p>
            {isSelf && (
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{youLabel}</p>
            )}
          </div>
        )}

        {/* Hand raised badge */}
        {handRaised && (
          <div className="absolute start-2 top-2 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black shadow">
            <Hand className="h-3 w-3" />
            {t('seminar_hand_raised')}
          </div>
        )}

        {/* Remote reconnecting overlay */}
        {peer?.reconnecting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-black/70 text-center">
            <Loader className="h-4 w-4 animate-spin text-white" />
            <span className="px-1 text-[9px] leading-tight text-white/90">
              {t('seminar_peer_reconnecting_title')}
            </span>
          </div>
        )}

        {/* Top-right: pin + mic */}
        <div className="absolute end-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {(connectionId || isSelf) && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
              title={isPinned ? t('seminar_unpin_tile') : t('seminar_pin_tile')}
              onClick={() => setPinnedConnectionId(isPinned ? null : (connectionId ?? '__self__'))}
            >
              {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
            title={t('seminar_enter_fullscreen')}
            onClick={(event) => void toggleRoomTileFullscreen(event.currentTarget)}
          >
            <Maximize className="h-3.5 w-3.5" />
          </Button>
          {isSelf ? (
            canControlMic ? (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
                title={t('seminar_toggle_mic')}
                onClick={handleToggleMic}
              >
                {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white">
                {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              </span>
            )
          ) : canModerateParticipants && connectionId ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
              disabled={micRequestPending}
              title={micRequestPending ? t('seminar_mic_permission_pending_title') : undefined}
              onClick={() => void toggleParticipantMic(connectionId, pState.isMicOn)}
            >
              {micRequestPending ? (
                <Loader className="h-3.5 w-3.5 animate-spin" />
              ) : micOn ? (
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <MicOff className="h-3.5 w-3.5 text-red-400" />
              )}
            </Button>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white">
              {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>

        <div className="absolute bottom-2 end-2 z-10 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
            title={t('seminar_zoom_in')}
            onClick={(event) => adjustRoomTileZoom(event.currentTarget, 0.25)}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
            title={t('seminar_zoom_out')}
            onClick={(event) => adjustRoomTileZoom(event.currentTarget, -0.25)}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 rounded-md bg-black/60 hover:bg-black/80"
            title={t('seminar_take_snapshot')}
            onClick={(event) => snapshotRoomTile(event.currentTarget, name)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Name badge */}
        <div className="absolute bottom-2 start-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {isSpeaking && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />}
          <span className="truncate">{displayName}</span>
          {renderRoleBadge(role)}
        </div>
      </div>
    );
  };

  // ── Focal-view layout decisions ──
  const screenFocal = showStageScreenShare && autoLayout;
  const focalSelf = !screenFocal && pinnedConnectionId === '__self__';
  const pinnedPeer = pinnedConnectionId
    ? peers.find((peer) => peer.connectionId === pinnedConnectionId) ?? null
    : null;
  const focalPeer = screenFocal ? null : pinnedPeer;
  const sharerName = isSharingScreen
    ? user?.displayName || user?.name || ''
    : remoteScreenPeer?.userName ?? '';
  const railPeers = peers.filter((peer) => {
    if (screenFocal && !isSharingScreen && remoteScreenPeer?.connectionId === peer.connectionId) {
      return false;
    }
    if (focalPeer && peer.connectionId === focalPeer.connectionId) {
      return false;
    }
    return true;
  });
  const hasFocal = screenFocal || focalSelf || !!focalPeer;


  return (
      <div className="relative flex h-[100dvh] w-full flex-col bg-background">
        {waitingForTeacher && !hubConnectionFailed && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/95 px-6">
            <div className="max-w-md space-y-3 text-center">
              <Loader className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <h2 className="text-lg font-semibold">{t('seminar_waiting_teacher_title')}</h2>
              <p className="text-sm text-muted-foreground">{t('seminar_waiting_teacher_description')}</p>
            </div>
          </div>
        )}
        {isHubReconnecting && !hubConnectionFailed && !waitingForTeacher && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/80 px-6">
            <div className="max-w-md space-y-3 text-center">
              <Loader className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <h2 className="text-lg font-semibold">{t('seminar_reconnecting_title')}</h2>
              <p className="text-sm text-muted-foreground">{t('seminar_reconnecting_description')}</p>
            </div>
          </div>
        )}
        {hubConnectionFailed && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/95 px-6">
            <div className="max-w-md space-y-4 text-center">
              <h2 className="text-lg font-semibold">{t('seminar_hub_connection_failed_title')}</h2>
              <p className="text-sm text-muted-foreground">{t('seminar_hub_connection_failed_description')}</p>
              <Button type="button" onClick={() => window.location.reload()}>
                {t('seminar_hub_connection_retry')}
              </Button>
            </div>
          </div>
        )}
        {presenterBadgeVisible && isPresenter && (
          <div className="absolute top-16 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-primary/10 px-4 py-2 shadow-md backdrop-blur-sm">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('seminar_presenter_role_banner')}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setPresenterBadgeVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {micPermissionRequest && isStrictStudent && (
          <div className="absolute top-16 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-primary/40 bg-primary/15 px-4 py-2 shadow-md backdrop-blur-sm">
            <Mic className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">{t('seminar_mic_permission_banner')}</span>
          </div>
        )}
        {/* ───────────── Room header ───────────── */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-3 backdrop-blur md:px-5">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <Logo />
            <Separator orientation="vertical" className="hidden h-7 sm:block" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">{room.name}</h1>
                <Badge variant="outline" className="shrink-0 border-primary/40 bg-primary/10 text-[9px] font-bold tracking-wider text-primary">
                  {useLiveKitSfu ? 'LIVEKIT SFU' : 'ACTIVE MESH'}
                </Badge>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                Room ID: <span dir="ltr" className="font-medium">{roomUrlSegment}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium sm:inline-flex',
                isConnected
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-500'
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'animate-pulse bg-emerald-500' : 'bg-amber-500')} />
              {isConnected ? t('seminar_signaling_live') : t('seminar_signaling_off')}
            </span>

            {isModerator && (
              <>
                <Button variant="outline" size="icon" className="h-8 w-8" title={t('seminar_files_upload_title')} onClick={() => setIsFileUploadOpen(true)}>
                  <Upload className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" title={t('seminar_settings')} onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}

            {isModerator && recordedVideoUrl && (
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            )}

            <Separator orientation="vertical" className="h-7" />

            {isModerator && (
              <Button variant="destructive" size="sm" className="gap-1.5 px-3" onClick={() => setIsLeaveDialogOpen(true)}>
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">{t('seminar_exit_call')}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPanelTab((tab) => (tab === null ? 'people' : null))}
            >
              {panelTab !== null ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* ───────────── Main area ───────────── */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <main
            className="relative flex min-w-0 flex-1 flex-col p-2 md:p-3"
            ref={fullscreenRef}
            onMouseMove={handleMouseMove}
            onTouchStart={handleRevealControls}
            onPointerDown={handleRevealControls}
            onMouseLeave={() => setIsControlsVisible(false)}
          >
            {countdown !== null && (
              <div className="absolute left-1/2 top-2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-muted/80 px-4 py-1.5 font-mono text-sm text-muted-foreground backdrop-blur-sm">
                Room closes in {formatCountdown(countdown)}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelLeaveTimer}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-background to-black/60 p-2">
              {/* Hidden canvas for compositing video streams */}
              <canvas ref={canvasRef} className="hidden" />

              {(teacherPeerReconnecting || remoteTeacherPeer?.reconnecting) && isAudienceMember && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/70 px-4 text-center">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm font-medium">{t('seminar_peer_reconnecting_title')}</p>
                  <p className="text-xs text-muted-foreground">{t('seminar_peer_reconnecting_description')}</p>
                </div>
              )}
              {needsAudioUnlock && (
                <div className="absolute inset-x-0 bottom-24 z-40 flex justify-center px-4 pointer-events-none">
                  <Button type="button" size="lg" className="pointer-events-auto gap-2 shadow-lg" onClick={() => void unlockRoomAudio()}>
                    <Mic className="h-5 w-5" />
                    {locale === 'fa' ? 'برای شنیدن صدای استاد ضربه بزنید' : 'Tap to enable teacher audio'}
                  </Button>
                </div>
              )}

              {/* Hidden audio sinks for every peer */}
              {peers.map((peer) => (
                <audio
                  key={`peer-audio-${peer.connectionId}`}
                  ref={(el) => registerPeerAudioRef(peer.connectionId, el)}
                  autoPlay
                  playsInline
                  className="hidden"
                />
              ))}

              <div className="flex min-h-0 flex-1 flex-col gap-2">
                {/* ── Focal view: full width, docked to the top ── */}
                <div className="relative flex w-full min-h-0 flex-1 flex-col">
                  {screenFocal ? (
                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-primary/30 bg-black shadow-[0_0_30px_-10px] shadow-primary/40">
                      {useMultiPresenterStage ? (
                        <div ref={stageScreenContainerRef} className="relative h-full w-full bg-black">
                          <MultiPresenterStage tiles={stageTiles} className="h-full w-full" />
                        </div>
                      ) : (
                        <div ref={stageScreenContainerRef} className="relative h-full w-full bg-black">
                          <video ref={screenShareVideoRef} className="h-full w-full object-contain" autoPlay playsInline />
                          {remoteScreenPeer && !isSharingScreen && (
                            <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(100%,24rem)] rounded-md border border-white/15 bg-black/55 px-3 py-1.5 text-xs text-white shadow-md backdrop-blur-sm">
                              <span className="font-medium">{remoteScreenPeer.userName}</span>
                              <span className="text-white/80"> — {t('seminar_presenter_screen_live')}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-full border border-primary/40 bg-primary/20 px-4 py-1 text-xs font-medium text-primary-foreground shadow-lg backdrop-blur-sm">
                        {t('seminar_focal_view')}: {sharerName} — {t('seminar_presenter_screen_live')}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute right-3 top-3 z-30 gap-1.5 bg-background/90 shadow-md backdrop-blur-sm hover:bg-background"
                        onClick={() => void handleToggleStageFullscreen()}
                        title={isStageFullscreen ? t('seminar_exit_fullscreen') : t('seminar_enter_fullscreen')}
                      >
                        {isStageFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        <span className="hidden text-xs sm:inline">
                          {isStageFullscreen ? t('seminar_exit_fullscreen') : t('seminar_enter_fullscreen')}
                        </span>
                      </Button>

                      {/* Remote teacher webcam PiP inside the shared screen (audience) */}
                      {!useMultiPresenterStage && showStageScreenShare && !isSharingScreen && remoteTeacherCameraLive && (
                        <div
                          className={cn(
                            'absolute z-30 overflow-hidden bg-black touch-none',
                            remotePipPinned ? 'cursor-default' : 'cursor-move'
                          )}
                          style={{
                            left: remotePipDisplay.x,
                            top: remotePipDisplay.y,
                            width: remotePipDisplay.width,
                            height: remotePipDisplay.height,
                            borderRadius:
                              viewerWebcamOverlay.shape === 'circle'
                                ? '9999px'
                                : `${viewerWebcamOverlay.cornerRadius}px`,
                            border: `${viewerWebcamOverlay.borderWidth}px solid ${viewerWebcamOverlay.borderColor}`,
                            boxShadow: viewerWebcamOverlay.shadow
                              ? `0 10px 20px -5px ${viewerWebcamOverlay.shadowColor}`
                              : 'none',
                          }}
                          onPointerDown={(e) => {
                            if (remotePipPinned) return;
                            e.preventDefault();
                            setIsRemotePipDragging(true);
                            remotePipDragStartRef.current = { x: e.clientX, y: e.clientY };
                            remotePipInitialPosRef.current = remotePipPos;
                          }}
                        >
                          <video
                            ref={remoteTeacherPipRef}
                            className={cn('h-full w-full object-cover', viewerImageFilters.touchUp && 'blur-sm')}
                            style={{
                              filter: remotePipFilterStyle,
                              borderRadius:
                                viewerWebcamOverlay.shape === 'circle'
                                  ? '9999px'
                                  : `${Math.max(0, viewerWebcamOverlay.cornerRadius - viewerWebcamOverlay.borderWidth)}px`,
                            }}
                            autoPlay
                            playsInline
                          />
                          <div className="absolute right-1 top-1 flex gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 md:h-6 md:w-6 bg-black/60 hover:bg-black/80"
                              title={remotePipPinned ? t('seminar_pip_unpin') : t('seminar_pip_pin')}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemotePipPinned((v) => !v);
                              }}
                            >
                              {remotePipPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                            </Button>
                          </div>
                          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                            {t('seminar_webcam')}
                          </span>
                        </div>
                      )}

                      {/* Own webcam PiP while sharing this screen */}
                      {!useMultiPresenterStage && isSharingScreen && canControlCamera && mediaState.isCameraOn && localStream && (
                        <div className="absolute bottom-4 right-4 z-30 h-28 w-44 overflow-hidden rounded-xl border-2 border-primary/50 bg-black shadow-2xl md:h-36 md:w-56">
                          <video ref={teacherVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                          <span className="absolute bottom-1.5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            {t('seminar_webcam')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : focalSelf ? (
                    <div className="relative min-h-0 flex-1">
                      {renderRoomTile({
                        isSelf: true,
                        name: user?.displayName || user?.name || '',
                        size: 'focal',
                        isPinned: true,
                      })}
                    </div>
                  ) : focalPeer ? (
                    /* ── Pinned participant, enlarged ── */
                    <div className="relative min-h-0 flex-1">
                      {renderRoomTile({
                        connectionId: focalPeer.connectionId,
                        userId: focalPeer.userId,
                        name: focalPeer.userName,
                        avatar: focalPeer.avatar,
                        isSelf: false,
                        size: 'focal',
                        isPinned: true,
                      })}
                    </div>
                  ) : (
                    /* ── Uniform tile grid ── */
                    <div
                      className="grid min-h-0 flex-1 auto-rows-fr content-start gap-3 overflow-y-auto p-1"
                      style={{ gridTemplateColumns: gridTemplateColumns(1 + peers.length) }}
                    >
                      {renderRoomTile({ isSelf: true, name: user?.displayName || user?.name || '', size: 'grid' })}
                      {peers.map((peer) =>
                        renderRoomTile({
                          connectionId: peer.connectionId,
                          userId: peer.userId,
                          name: peer.userName,
                          avatar: peer.avatar,
                          isSelf: false,
                          size: 'grid',
                          tileKey: `grid-${peer.connectionId}`,
                        })
                      )}
                      {peers.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-center">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-sm font-semibold">{t('seminar_welcome_room', { roomName: room.name })}</p>
                          <p className="text-xs text-muted-foreground">{t('seminar_will_begin_shortly')}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {hasFocal && (
                    <div className="flex shrink-0 flex-row gap-2 overflow-x-auto pb-1">
                      {!focalSelf && !(screenFocal && isSharingScreen) &&
                        renderRoomTile({ isSelf: true, name: user?.displayName || user?.name || '', size: 'rail' })}
                      {railPeers.map((peer) =>
                        renderRoomTile({
                          connectionId: peer.connectionId,
                          userId: peer.userId,
                          name: peer.userName,
                          avatar: peer.avatar,
                          isSelf: false,
                          size: 'rail',
                          tileKey: `rail-${peer.connectionId}`,
                        })
                      )}
                    </div>
                  )}
                </div>

                {downloadProgress !== null && (
                  <div className="absolute bottom-4 left-1/2 z-30 w-1/2 -translate-x-1/2">
                    <Progress value={downloadProgress} />
                    <p className="mt-1 text-center text-xs text-white">
                      {t('seminar_downloading_progress', { progress: Math.round(downloadProgress) })}
                    </p>
                  </div>
                )}
              </div>
              </div>
            </main>

            {/* ───────────── Right panel: People / Chat / Files ───────────── */}
            <aside
              className={cn(
                'absolute inset-0 z-40 flex shrink-0 flex-col border-s border-border/60 bg-background transition-all duration-300 ease-in-out lg:relative lg:z-auto lg:h-full',
                panelTab !== null ? 'w-full lg:w-96' : 'pointer-events-none w-0 overflow-hidden border-0 opacity-0'
              )}
            >
              {panelTab !== null && (
                <>
                  <div className="flex shrink-0 items-center gap-1 border-b border-border/60 p-2">
                    {([
                      { key: 'people' as const, icon: Users, label: t('seminar_participants_title', { count: participantRows.length }) },
                      { key: 'chat' as const, icon: MessagesSquare, label: t('seminar_chat_title') },
                      { key: 'files' as const, icon: FolderOpen, label: t('seminar_files_title') },
                    ]).map((tabDef) => (
                      <button
                        key={tabDef.key}
                        type="button"
                        onClick={() => setPanelTab(panelTab === tabDef.key ? null : tabDef.key)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                          panelTab === tabDef.key
                            ? 'bg-primary/15 text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        <tabDef.icon className="h-4 w-4" />
                        <span className="truncate">{tabDef.label}</span>
                        {((tabDef.key === 'chat' && unreadChat > 0) || (tabDef.key === 'files' && unreadFiles > 0)) && (
                          <span aria-label={t('seminar_unread_count')} className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                            {tabDef.key === 'chat' ? unreadChat : unreadFiles}
                          </span>
                        )}
                      </button>
                    ))}
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 shrink-0" onClick={() => setPanelTab(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {panelTab === 'people' && (
                    <ScrollArea className="min-h-0 flex-1 px-3 py-3">
                      <div className="space-y-1">
                        {participantRows.map((row) => {
                          const isCurrentUser = row.isLocal;
                          const canControlRemote = canModerateParticipants && !isCurrentUser;
                          const pState =
                            participantStates[row.connectionId ?? row.id] ||
                            { isMicOn: false, isSharingScreen: false };
                          const micRequestPending = row.connectionId ? pendingMicRequests[row.connectionId] : false;
                          const isPinnedRow = row.connectionId !== null && row.connectionId === pinnedConnectionId;

                          return (
                            <div key={row.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={row.avatar} />
                                <AvatarFallback>{row.label.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="min-w-0 flex-1 truncate text-xs font-medium">{row.label}</span>
                              {row.connectionId && raisedHandIds.includes(row.connectionId) && (
                                <span title={t('seminar_hand_raised')} className="inline-flex shrink-0">
                                  <Hand className="h-3.5 w-3.5 text-amber-500" />
                                </span>
                              )}
                              {renderRoleBadge(String(row.role))}
                              {canModerateParticipants && row.connectionId && raisedHandIds.includes(row.connectionId) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  title={t('seminar_lower_hand')}
                                  onClick={() => void lowerParticipantHand(row.connectionId!)}
                                >
                                  <Hand className="h-3 w-3" />
                                </Button>
                              )}

                              {isCurrentUser && canControlMic ? (
                                <div className="flex flex-1 justify-end">
                                  {localStream && <AudioVisualizer stream={localStream} isMicOn={mediaState.isMicOn} />}
                                </div>
                              ) : isCurrentUser && isStrictStudent ? (
                                <div className="flex flex-1 justify-end">
                                  {localStream && mediaState.isMicOn ? (
                                    <AudioVisualizer stream={localStream} isMicOn={mediaState.isMicOn} />
                                  ) : (
                                    <MicOff className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  {(() => {
                                    const peer = row.connectionId
                                      ? peers.find((p) => p.connectionId === row.connectionId)
                                      : null;
                                    return peer && peerHasLiveAudio(peer) && peer.stream ? (
                                      <AudioVisualizer stream={peer.stream} isMicOn />
                                    ) : (
                                      <MicOff className="h-3 w-3 text-muted-foreground" />
                                    );
                                  })()}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={!canControlRemote || micRequestPending}
                                    title={micRequestPending ? t('seminar_mic_permission_pending_title') : undefined}
                                    onClick={() =>
                                      row.connectionId && void toggleParticipantMic(row.connectionId, pState.isMicOn)
                                    }
                                  >
                                    {micRequestPending ? (
                                      <Loader className="h-3 w-3 animate-spin" />
                                    ) : pState.isMicOn ? (
                                      <Mic className="h-3 w-3" />
                                    ) : (
                                      <MicOff className="h-3 w-3 text-destructive" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={!canModerateParticipants || !pState.isSharingScreen || !row.connectionId}
                                    onClick={() => row.connectionId && void stopParticipantScreenShare(row.connectionId)}
                                  >
                                    {pState.isSharingScreen ? (
                                      <ScreenShareOff className="h-3 w-3 text-destructive" />
                                    ) : (
                                      <ScreenShare className="h-3 w-3" />
                                    )}
                                  </Button>
                                  {canModerateParticipants && !isCurrentUser && row.connectionId && !isHostRole(String(row.role)) && (() => {
                                    const rowGrants = participantGrants[row.connectionId] ?? { voice: false, video: false, presenter: false };
                                    const toggleGrant = (key: 'voice' | 'video' | 'presenter') => {
                                      void updateParticipantGrants(
                                        row.connectionId!,
                                        row.label,
                                        { ...rowGrants, [key]: !rowGrants[key] }
                                      );
                                    };
                                    return (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn('h-7 w-7', rowGrants.voice && 'text-emerald-500')}
                                          title={t('seminar_grant_voice')}
                                          onClick={() => toggleGrant('voice')}
                                        >
                                          {rowGrants.voice ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn('h-7 w-7', rowGrants.video && 'text-emerald-500')}
                                          title={t('seminar_grant_video')}
                                          onClick={() => toggleGrant('video')}
                                        >
                                          {rowGrants.video ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn('h-7 w-7', rowGrants.presenter && 'text-emerald-500')}
                                          title={t('seminar_grant_presenter')}
                                          onClick={() => toggleGrant('presenter')}
                                        >
                                          <ScreenShare className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    );
                                  })()}
                                  {canModerateParticipants && !isCurrentUser && row.connectionId && !isHostRole(String(row.role)) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => void handleMakePresenter(row.connectionId!, row.label)}
                                        >
                                          <UserCog className="mr-2 h-4 w-4" />
                                          {t('seminar_make_presenter')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => void handleMakeParticipant(row.connectionId!, row.label)}
                                        >
                                          <PersonStanding className="mr-2 h-4 w-4" />
                                          {t('seminar_make_student')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => void handleKickParticipant(row.connectionId!, row.label)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {t('seminar_remove_from_room')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => void handleKickAndBlockParticipant(row.connectionId!, row.label)}
                                        >
                                          <Ban className="mr-2 h-4 w-4" />
                                          {t('seminar_remove_and_block')}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                  {!isCurrentUser && row.connectionId && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      title={isPinnedRow ? t('seminar_unpin_tile') : t('seminar_pin_tile')}
                                      onClick={() =>
                                        setPinnedConnectionId(isPinnedRow ? null : row.connectionId!)
                                      }
                                    >
                                      {isPinnedRow ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}

                  {panelTab === 'chat' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto p-3">
                        {rtcMessages.length === 0 ? (
                          <div className="text-center text-xs text-muted-foreground">{t('seminar_no_messages')}</div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {rtcMessages.map((msg, idx) => {
                              const selfName = user?.displayName || user?.name || '';
                              const isSelf = msg.user === selfName;
                              return (
                                <div
                                  key={`${msg.user}-${idx}-${msg.timestamp.getTime()}`}
                                  className={cn('flex w-full gap-2', isSelf ? 'flex-row-reverse' : 'flex-row')}
                                >
                                  <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={isSelf ? user?.avatar : undefined} />
                                    <AvatarFallback className="text-[10px]">{msg.user.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div
                                    className={cn(
                                      'max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm',
                                      isSelf ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted'
                                    )}
                                  >
                                    {!isSelf && (
                                      <div className="mb-0.5 text-[10px] font-semibold opacity-80">{msg.user}</div>
                                    )}
                                    <p className="whitespace-pre-wrap break-words leading-snug">{msg.message}</p>
                                    <div className={cn('mt-1 text-[10px] opacity-70', isSelf ? 'text-right' : 'text-left')}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 border-t border-border/60 p-3">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                          <Input
                            placeholder={t('seminar_chat_placeholder')}
                            className="flex-1"
                            value={newMessage}
                            disabled={waitingForTeacher}
                            onChange={(e) => setNewMessage(e.target.value)}
                          />
                          <Button type="submit" size="icon" disabled={!newMessage.trim() || waitingForTeacher}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}

                  {panelTab === 'files' && (
                    <ScrollArea className="min-h-0 flex-1 px-3 py-3">
                      {isModerator && (
                        <Button type="button" variant="outline" className="mb-3 w-full gap-2" onClick={() => setIsFileUploadOpen(true)}>
                          <Upload className="h-4 w-4" />
                          {t('seminar_files_upload')}
                        </Button>
                      )}
                      {sharedFiles.length === 0 ? (
                        <p className="py-8 text-center text-xs text-muted-foreground">{t('seminar_files_empty')}</p>
                      ) : (
                        <div className="space-y-2">
                          {sharedFiles.map((file) => (
                            <a
                              key={file.id}
                              href={file.url}
                              download={file.name}
                              className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5 text-xs transition-colors hover:border-primary/40 hover:bg-muted/50"
                            >
                              <FileText className="h-4 w-4 shrink-0 text-primary" />
                              <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
                              <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}
                </>
              )}
            </aside>
          </div>

          {/* ───────────── Bottom control bar ───────────── */}
          <footer className="relative z-40 shrink-0 border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="hidden min-w-0 flex-col md:flex">
                <p className="truncate text-xs font-semibold">
                  {t('seminar_room_label')}: <span dir="ltr">{roomUrlSegment}</span>
                </p>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>
                    {t('seminar_role_label')}: {isModerator ? t('seminar_role_host') : isPresenter ? t('seminar_role_presenter') : t('seminar_role_student')}
                    {isModerator ? ' 👑' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoLayout((v) => !v)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 font-semibold transition-colors',
                      autoLayout
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                        : 'border-border bg-muted/50'
                    )}
                  >
                    {t('seminar_auto_layout')}: {autoLayout ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={mediaState.isMicOn ? 'secondary' : 'outline'}
                  size="icon"
                  className={cn(
                    'h-11 w-11 rounded-full',
                    mediaState.isMicOn && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                  onClick={handleToggleMic}
                  disabled={canControlMic ? false : !localStream?.getAudioTracks().length || !isStrictStudent}
                  title={t('seminar_toggle_mic')}
                >
                  {mediaState.isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  type="button"
                  variant={mediaState.isCameraOn ? 'secondary' : 'outline'}
                  size="icon"
                  className={cn(
                    'h-11 w-11 rounded-full',
                    mediaState.isCameraOn && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                  onClick={handleToggleCamera}
                  disabled={!canControlCamera}
                  title={t('seminar_toggle_camera')}
                >
                  {mediaState.isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  type="button"
                  variant={isSharingScreen ? 'default' : 'outline'}
                  size="icon"
                  className={cn(
                    'h-11 w-11 rounded-full',
                    isSharingScreen && 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:bg-primary/90'
                  )}
                  onClick={handleToggleScreenShare}
                  disabled={isRecording || !canPublishMedia}
                  title={
                    anotherUserSharingScreen && !isSharingScreen
                      ? t('seminar_screen_share_takeover_title')
                      : t('seminar_toggle_screen')
                  }
                >
                  <ScreenShare className="h-5 w-5" />
                </Button>
                {isStrictStudent && (
                  <Button
                    type="button"
                    variant={handRaisedLocal ? 'default' : 'outline'}
                    size="icon"
                    className={cn(
                      'h-11 w-11 rounded-full',
                      handRaisedLocal && 'bg-amber-500 text-black hover:bg-amber-500/90'
                    )}
                    onClick={() => {
                      if (handRaisedLocal) void lowerHand();
                      else void raiseHand();
                    }}
                    title={handRaisedLocal ? t('seminar_lower_hand') : t('seminar_raise_hand')}
                  >
                    <Hand className="h-5 w-5" />
                  </Button>
                )}
                {isModerator && (
                  <Button
                    type="button"
                    variant={isRecording ? 'destructive' : 'outline'}
                    size="icon"
                    className="h-11 w-11 rounded-full"
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={!isRecording && !isSharingScreen}
                    title={isRecording ? t('seminar_stop_recording') : t('seminar_start_recording')}
                  >
                    <Circle className={cn('h-4 w-4', isRecording ? 'animate-pulse fill-current' : 'text-red-500')} />
                  </Button>
                )}
                {isModerator && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 gap-2 rounded-full px-5 font-semibold"
                    onClick={() => setIsLeaveDialogOpen(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    {t('seminar_exit_call')}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {([
                  { key: 'people' as const, icon: Users, label: t('seminar_people_label') },
                  { key: 'chat' as const, icon: MessagesSquare, label: t('seminar_chat_title') },
                  { key: 'files' as const, icon: FolderOpen, label: t('seminar_files_title') },
                ]).map((tabDef) => (
                  <Button
                    key={tabDef.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-10 gap-1.5 rounded-xl px-3',
                      panelTab === tabDef.key && 'border-primary/50 bg-primary/10 text-primary'
                    )}
                    onClick={() => setPanelTab(panelTab === tabDef.key ? null : tabDef.key)}
                  >
                    <tabDef.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{tabDef.label}</span>
                    {((tabDef.key === 'chat' && unreadChat > 0) || (tabDef.key === 'files' && unreadFiles > 0)) && (
                      <span aria-label={t('seminar_unread_count')} className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                        {tabDef.key === 'chat' ? unreadChat : unreadFiles}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </footer>
        <SeminarSettingsDialog
            isOpen={isSettingsOpen}
            onOpenChangeAction={setIsSettingsOpen}
            onSaveAction={handleSaveSettings}
            initialSettings={{
              media: mediaState,
              recording: recordingSettings,
              fileSharing: fileSharingSettings,
              image: imageSettings,
              webcamOverlay: webcamOverlaySettings,
            }}
        />
        <FileUploadDialog
            isOpen={isFileUploadOpen}
            onOpenChangeAction={setIsFileUploadOpen}
            sharedFiles={sharedFiles}
            roomId={Number(room.id)}
            uploadedBy={user?.displayName || user?.name || 'Unknown'}
            onUploadCompletedAction={handleFileUploaded}
            onDeleteAction={handleDeleteFile}
            isOrganizer={isOrganizer}
        />
        <AlertDialog open={micPermissionRequest != null && isStrictStudent} onOpenChange={(open) => !open && void declineMicPermission()}>
          <AlertDialogContent dir={locale === 'fa' ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('seminar_mic_permission_request_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('seminar_mic_permission_request_description', {
                  teacher: micPermissionRequest?.requesterName || t('seminar_role_teacher_badge'),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => void declineMicPermission()}>
                {t('seminar_mic_permission_decline')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => void acceptMicPermission()}>
                {t('seminar_mic_permission_accept')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={adminSeatRemoval != null} onOpenChange={(open) => !open && setAdminSeatRemoval(null)}>
          <AlertDialogContent dir={locale === 'fa' ? 'rtl' : 'ltr'}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('seminar_admin_removed_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {adminSeatRemoval?.action === 'blocked' || adminSeatRemoval?.wasBlocked
                  ? t('seminar_admin_removed_blocked_description')
                  : adminSeatRemoval?.action === 'removed'
                    ? t('seminar_admin_removed_deleted_description')
                    : t('seminar_admin_removed_offline_description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setAdminSeatRemoval(null);
                  void finalizeRoomExitRef.current();
                }}
              >
                {t('seminar_admin_removed_confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {canPublishMedia && (
          <LeaveRoomDialog
            isOpen={isLeaveDialogOpen}
            onOpenChangeAction={setIsLeaveDialogOpen}
            onLeaveNowAction={handleLeaveNow}
            onSetTimerAction={handleSetLeaveTimer}
          />
        )}
      </div>
  );

}
