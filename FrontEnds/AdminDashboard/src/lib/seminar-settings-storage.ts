import type {
  FileSharingSettings,
  ImageSettings,
  RecordingSettings,
  WebcamOverlaySettings,
} from '@/components/seminar/seminar-settings-dialog';
import type { LiveAudioQuality, LiveVideoQuality } from '@/lib/media-constraints';

const STORAGE_KEY_PREFIX = 'arka-seminar-av-settings';

export type PersistedSeminarAvSettings = {
  videoDeviceId: string | null;
  audioDeviceId: string | null;
  speakerDeviceId: string | null;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  voiceIsolation?: boolean;
  audioQuality?: LiveAudioQuality;
  videoQuality?: LiveVideoQuality;
  recording: RecordingSettings;
  image: ImageSettings;
  webcamOverlay: WebcamOverlaySettings;
  fileSharing: FileSharingSettings;
};

function storageKey(userId?: string | number | null): string {
  return `${STORAGE_KEY_PREFIX}:${userId ?? 'anonymous'}`;
}

function normalizeRecording(raw: unknown): RecordingSettings {
  const parsed = (raw && typeof raw === 'object' ? raw : {}) as Partial<RecordingSettings>;
  return {
    format: parsed.format || 'video/webm;codecs=vp9',
    quality: parsed.quality || 'high',
    resolution: parsed.resolution || '1080p',
    saveLocation: parsed.saveLocation === 'picker' ? 'picker' : 'download',
    liveProcessing: parsed.liveProcessing || 'none',
    includeParticipantAudio: parsed.includeParticipantAudio !== false,
  };
}

export function loadSeminarAvSettings(
  userId?: string | number | null
): PersistedSeminarAvSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSeminarAvSettings>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      videoDeviceId: parsed.videoDeviceId ?? null,
      audioDeviceId: parsed.audioDeviceId ?? null,
      speakerDeviceId: parsed.speakerDeviceId ?? null,
      echoCancellation: parsed.echoCancellation,
      noiseSuppression: parsed.noiseSuppression,
      autoGainControl: parsed.autoGainControl,
      voiceIsolation: parsed.voiceIsolation,
      audioQuality: parsed.audioQuality,
      videoQuality: parsed.videoQuality,
      recording: normalizeRecording(parsed.recording),
      image: parsed.image as ImageSettings,
      webcamOverlay: parsed.webcamOverlay as WebcamOverlaySettings,
      fileSharing: parsed.fileSharing as FileSharingSettings,
    };
  } catch {
    return null;
  }
}

export function saveSeminarAvSettings(
  settings: PersistedSeminarAvSettings,
  userId?: string | number | null
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(settings));
  } catch {
    // Ignore quota / private-mode failures
  }
}
