'use client';

import { useEffect, useMemo, useState } from 'react';

export type SpeakerMediaSource = {
  id: string;
  stream: MediaStream | null;
  enabled: boolean;
};

export function rmsFromTimeDomain(samples: Uint8Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / samples.length);
}

/** Voice-activity detection used only for the Meet-style speaking indicator. */
export function useActiveSpeakers(sources: SpeakerMediaSource[]): ReadonlySet<string> {
  const [active, setActive] = useState<ReadonlySet<string>>(() => new Set());
  const signature = useMemo(
    () =>
      sources
        .map((source) =>
          [
            source.id,
            source.enabled ? '1' : '0',
            source.stream?.getAudioTracks().map((track) => `${track.id}:${track.readyState}:${track.enabled}`).join(','),
          ].join(':')
        )
        .join('|'),
    [sources]
  );

  useEffect(() => {
    const AudioContextCtor = window.AudioContext;
    const eligible = sources.filter(
      (source) =>
        source.enabled &&
        source.stream?.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled)
    );
    if (!AudioContextCtor || eligible.length === 0) {
      setActive(new Set());
      return;
    }

    const context = new AudioContextCtor();
    const meters = eligible.map((source) => {
      const stream = new MediaStream(
        source.stream!.getAudioTracks().filter((track) => track.readyState === 'live')
      );
      const input = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.65;
      input.connect(analyser);
      return { id: source.id, input, analyser, samples: new Uint8Array(analyser.fftSize), lastVoiceAt: 0 };
    });

    let frame = 0;
    let stopped = false;
    let previous = '';
    const resume = () => void context.resume().catch(() => undefined);
    window.addEventListener('pointerdown', resume, { passive: true });

    const sample = (now: number) => {
      if (stopped) return;
      const speaking: string[] = [];
      meters.forEach((meter) => {
        meter.analyser.getByteTimeDomainData(meter.samples);
        const rms = rmsFromTimeDomain(meter.samples);
        if (rms >= 0.035) meter.lastVoiceAt = now;
        if (now - meter.lastVoiceAt < 360) speaking.push(meter.id);
      });
      speaking.sort();
      const next = speaking.join('|');
      if (next !== previous) {
        previous = next;
        setActive(new Set(speaking));
      }
      frame = window.requestAnimationFrame(sample);
    };
    frame = window.requestAnimationFrame(sample);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointerdown', resume);
      meters.forEach(({ input }) => input.disconnect());
      void context.close();
    };
    // Track identity/state is intentionally represented by signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return active;
}
