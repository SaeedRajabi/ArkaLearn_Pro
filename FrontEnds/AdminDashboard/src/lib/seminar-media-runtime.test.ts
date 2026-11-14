import { rmsFromTimeDomain } from '@/hooks/use-active-speaker';
import { bindAudioElement } from '@/lib/seminar-room-audio';
import { MAX_CONCURRENT_SCREEN_SHARES } from '@/lib/seminar-room-layout';

describe('seminar media runtime', () => {
  it('keeps a stable audio srcObject when receiver track ids did not change', () => {
    const OriginalMediaStream = global.MediaStream;
    class FakeMediaStream {
      constructor(private readonly tracks: MediaStreamTrack[]) {}
      getTracks() {
        return this.tracks;
      }
    }
    global.MediaStream = FakeMediaStream as unknown as typeof MediaStream;
    const audio = document.createElement('audio');
    Object.defineProperty(audio, 'srcObject', { value: null, writable: true });
    audio.play = jest.fn().mockResolvedValue(undefined);
    const track = { id: 'remote-mic', kind: 'audio', readyState: 'live' } as MediaStreamTrack;

    bindAudioElement(audio, [track]);
    const firstStream = audio.srcObject;
    bindAudioElement(audio, [track]);

    expect(audio.srcObject).toBe(firstStream);
    expect(audio.play).toHaveBeenCalledTimes(2);
    global.MediaStream = OriginalMediaStream;
  });

  it('detects voice energy but not digital silence', () => {
    expect(rmsFromTimeDomain(new Uint8Array(128).fill(128))).toBe(0);
    const voice = new Uint8Array(128).map((_, index) => (index % 2 === 0 ? 92 : 164));
    expect(rmsFromTimeDomain(voice)).toBeGreaterThan(0.2);
  });

  it('allows presenter screen tiles for a small mesh class', () => {
    expect(MAX_CONCURRENT_SCREEN_SHARES).toBe(4);
  });
});
