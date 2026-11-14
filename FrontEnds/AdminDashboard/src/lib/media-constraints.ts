export type LiveAudioQuality = 'speech' | 'music' | 'studio';
export type LiveVideoQuality = 'high' | 'medium' | 'low';

export type MediaProcessingOptions = {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  /** Chromium voiceIsolation when supported. */
  voiceIsolation?: boolean;
  audioQuality?: LiveAudioQuality;
  videoQuality?: LiveVideoQuality;
};

type BuildMediaConstraintsOptions = {
  wantAudio: boolean;
  wantVideo: boolean;
  audioDeviceId?: string | null;
  videoDeviceId?: string | null;
  mobile?: boolean;
  processing?: MediaProcessingOptions;
};

const VIDEO_PRESETS: Record<
  LiveVideoQuality,
  { width: number; height: number; frameRate: number }
> = {
  high: { width: 1280, height: 720, frameRate: 30 },
  medium: { width: 960, height: 540, frameRate: 24 },
  low: { width: 640, height: 360, frameRate: 20 },
};

function audioProcessingBase(processing?: MediaProcessingOptions): MediaTrackConstraints {
  const echoCancellation = processing?.echoCancellation ?? true;
  const noiseSuppression = processing?.noiseSuppression ?? true;
  const autoGainControl = processing?.autoGainControl ?? true;
  const quality = processing?.audioQuality ?? 'speech';

  const base: MediaTrackConstraints = {
    echoCancellation,
    noiseSuppression,
    autoGainControl,
  };

  if (quality === 'studio') {
    base.channelCount = { ideal: 1 };
    base.sampleRate = { ideal: 48000 };
    base.sampleSize = { ideal: 16 };
  } else if (quality === 'music') {
    base.channelCount = { ideal: 2 };
    base.sampleRate = { ideal: 48000 };
  } else {
    // speech — prioritize clarity / lower bandwidth
    base.channelCount = { ideal: 1 };
    base.sampleRate = { ideal: 48000 };
  }

  if (processing?.voiceIsolation) {
    // Not in all TS lib DOM versions; browsers that support it will honor it.
    (base as MediaTrackConstraints & { voiceIsolation?: boolean }).voiceIsolation = true;
  }

  return base;
}

function withDeviceId(
  base: MediaTrackConstraints,
  deviceId?: string | null
): MediaTrackConstraints {
  if (!deviceId) return base;
  return { ...base, deviceId: { ideal: deviceId } };
}

function mobileVideoConstraints(
  deviceId?: string | null,
  videoQuality?: LiveVideoQuality
): MediaTrackConstraints {
  const preset = VIDEO_PRESETS[videoQuality ?? 'medium'];
  const base: MediaTrackConstraints = {
    facingMode: 'user',
    width: { ideal: Math.min(preset.width, 1280), max: 1280 },
    height: { ideal: Math.min(preset.height, 720), max: 720 },
    frameRate: { ideal: Math.min(preset.frameRate, 30), max: 30 },
  };
  return withDeviceId(base, deviceId);
}

function desktopVideoConstraints(
  deviceId?: string | null,
  videoQuality?: LiveVideoQuality
): MediaTrackConstraints {
  const preset = VIDEO_PRESETS[videoQuality ?? 'high'];
  const base: MediaTrackConstraints = {
    width: { ideal: preset.width },
    height: { ideal: preset.height },
    frameRate: { ideal: preset.frameRate, max: 30 },
  };
  return withDeviceId(base, deviceId);
}

export function buildMediaStreamConstraints(options: BuildMediaConstraintsOptions): MediaStreamConstraints {
  const mobile =
    options.mobile ??
    (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);

  const audioBase = audioProcessingBase(options.processing);

  return {
    audio: options.wantAudio ? withDeviceId(audioBase, options.audioDeviceId) : false,
    video: options.wantVideo
      ? mobile
        ? mobileVideoConstraints(options.videoDeviceId, options.processing?.videoQuality)
        : desktopVideoConstraints(options.videoDeviceId, options.processing?.videoQuality)
      : false,
  };
}

export async function getUserMediaWithFallback(
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (name !== 'OverconstrainedError' && name !== 'NotFoundError') {
      throw error;
    }

    const relaxed: MediaStreamConstraints = {
      audio: constraints.audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
      video: constraints.video ? { facingMode: 'user' } : false,
    };
    return navigator.mediaDevices.getUserMedia(relaxed);
  }
}
