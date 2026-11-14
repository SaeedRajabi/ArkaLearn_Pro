let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  audioContext ??= new AudioContext();
  return audioContext;
}

/** Call from a user gesture so later real-time notifications are not blocked by autoplay policy. */
export async function prepareNotificationSound(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx?.state === 'suspended') await ctx.resume();
  } catch {
    /* notification sound is best-effort */
  }
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.connect(ctx.destination);

      // A short two-note chime is easier to notice than the old single oscillator.
      [880, 1174].forEach((frequency, index) => {
        const startsAt = now + index * 0.14;
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startsAt);
        osc.start(startsAt);
        osc.stop(startsAt + 0.18);
      });

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    };

    if (ctx.state === 'suspended') {
      void ctx.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  } catch {
    /* ignore */
  }
}
