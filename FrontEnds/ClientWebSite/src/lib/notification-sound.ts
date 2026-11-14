let audioContext: AudioContext | null = null;

export type NotificationSoundKey = 'chime' | 'bell' | 'pop' | 'ping' | 'soft';

const SOUND_KEYS: NotificationSoundKey[] = ['chime', 'bell', 'pop', 'ping', 'soft'];

export function normalizeNotificationSoundKey(value?: string | null): NotificationSoundKey {
  const key = (value ?? 'chime').trim().toLowerCase();
  return (SOUND_KEYS.includes(key as NotificationSoundKey) ? key : 'chime') as NotificationSoundKey;
}

function playTone(
  ctx: AudioContext,
  startFreq: number,
  endFreq: number,
  duration: number,
  peakGain: number,
  type: OscillatorType = 'sine'
) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.5);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/** Play notification sound configured by admin (Web Audio API). */
export function playNotificationSound(soundKey?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;
    if (ctx.state === 'suspended') void ctx.resume();

    const key = normalizeNotificationSoundKey(soundKey);
    switch (key) {
      case 'bell':
        playTone(ctx, 660, 880, 0.45, 0.22);
        playTone(ctx, 880, 660, 0.35, 0.15, 'triangle');
        break;
      case 'pop':
        playTone(ctx, 420, 180, 0.12, 0.3, 'square');
        break;
      case 'ping':
        playTone(ctx, 1200, 1600, 0.18, 0.18);
        break;
      case 'soft':
        playTone(ctx, 520, 620, 0.55, 0.12, 'triangle');
        break;
      default:
        playTone(ctx, 880, 660, 0.16, 0.25);
        playTone(ctx, 660, 990, 0.22, 0.18);
        break;
    }
  } catch {
    /* ignore autoplay restrictions */
  }
}
