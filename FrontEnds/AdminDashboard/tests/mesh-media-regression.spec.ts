import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

// Execute the production transceiver allocator in a real browser. No account or live
// classroom is touched; canvas/oscillator tracks exercise actual RTP and video decoding.
const allocator = ts.transpileModule(
  readFileSync(resolve(__dirname, '../src/lib/webrtc-transceivers.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }
).outputText;

test('teacher and promoted student send mic, camera and screen to every other peer', async ({ page }) => {
  test.setTimeout(60000);
  const result = await page.evaluate(async (source) => {
    const exports: { ensureMeshTransceivers?: (pc: RTCPeerConnection, offerer: boolean) => {
      audio: RTCRtpTransceiver; camera: RTCRtpTransceiver; screen: RTCRtpTransceiver;
    } | null } = {};
    new Function('exports', source)(exports);
    const allocate = exports.ensureMeshTransceivers!;
    const pcs: RTCPeerConnection[] = [];
    const media: MediaStreamTrack[] = [];
    const audioContext = new AudioContext();
    await audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const destination = audioContext.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();
    const mic = destination.stream.getAudioTracks()[0];
    media.push(mic);
    const makeVideo = (color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = 90;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color; ctx.fillRect(0, 0, 160, 90);
      const stream = canvas.captureStream(10);
      const track = stream.getVideoTracks()[0];
      media.push(track);
      const timer = setInterval(() => { ctx.fillRect(0, 0, 160, 90); }, 100);
      return { track, timer };
    };
    const camera = makeVideo('#ee1111');
    const screen = makeVideo('#1122ee');
    const endpoints: { owner: number; target: number; pc: RTCPeerConnection; slots: NonNullable<ReturnType<typeof allocate>> }[] = [];
    const publish = async (owner: number) => {
      await Promise.all(endpoints.filter((item) => item.owner === owner).map(async ({ slots }) => {
        await slots.audio.sender.replaceTrack(mic);
        await slots.camera.sender.replaceTrack(camera.track);
        await slots.screen.sender.replaceTrack(screen.track);
      }));
    };
    try {
      for (const [offerer, answerer] of [[1, 0], [0, 2], [2, 1]]) {
        const left = new RTCPeerConnection({ iceServers: [] });
        const right = new RTCPeerConnection({ iceServers: [] });
        pcs.push(left, right);
        const pendingLeft: RTCIceCandidate[] = [], pendingRight: RTCIceCandidate[] = [];
        left.onicecandidate = (event) => {
          if (event.candidate) {
            if (right.remoteDescription) void right.addIceCandidate(event.candidate);
            else pendingRight.push(event.candidate);
          }
        };
        right.onicecandidate = (event) => {
          if (event.candidate) {
            if (left.remoteDescription) void left.addIceCandidate(event.candidate);
            else pendingLeft.push(event.candidate);
          }
        };
        if (allocate(right, false) !== null || right.getTransceivers().length) {
          throw new Error('Answerer created unassociated transceivers before receiving an offer');
        }
        const leftSlots = allocate(left, true)!;
        await left.setLocalDescription(await left.createOffer());
        await right.setRemoteDescription(left.localDescription!);
        const rightSlots = allocate(right, false)!;
        await Promise.all(pendingRight.map((candidate) => right.addIceCandidate(candidate)));
        await right.setLocalDescription(await right.createAnswer());
        await left.setRemoteDescription(right.localDescription!);
        await Promise.all(pendingLeft.map((candidate) => left.addIceCandidate(candidate)));
        endpoints.push({ owner: offerer, target: answerer, pc: left, slots: leftSlots });
        endpoints.push({ owner: answerer, target: offerer, pc: right, slots: rightSlots });
      }
      // Publish only after the initial empty sendrecv negotiation (teacher toggles media).
      await publish(0);
      // The promoted student uses the same already-negotiated channels.
      await publish(1);
      const received = async () => Promise.all(endpoints.filter((item) => item.target <= 1).map(async ({ owner, target, pc }) => {
        const stats = await pc.getStats();
        const inbound: { kind?: string; framesDecoded?: number; totalAudioEnergy?: number; bytesReceived?: number }[] = [];
        stats.forEach((report) => { if (report.type === 'inbound-rtp') inbound.push(report); });
        return { owner, target, slots: pc.getTransceivers().length,
          audio: inbound.some((report) => report.kind === 'audio' &&
            ((report.totalAudioEnergy ?? 0) > 0 || (report.bytesReceived ?? 0) > 100)),
          videos: inbound.filter((report) => report.kind === 'video' && (report.framesDecoded ?? 0) > 0).length };
      }));
      const deadline = Date.now() + 25000;
      let rows = await received();
      while (Date.now() < deadline && rows.some((row) => !row.audio || row.videos !== 2)) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        rows = await received();
      }
      return rows;
    } finally {
      pcs.forEach((pc) => pc.close());
      media.forEach((track) => track.stop());
      clearInterval(camera.timer); clearInterval(screen.timer);
      oscillator.stop(); await audioContext.close();
    }
  }, allocator);
  expect(result).toHaveLength(4);
  for (const row of result) {
    expect(row, `receiver ${row.owner} from publisher ${row.target}`).toMatchObject({ audio: true, videos: 2, slots: 3 });
  }
});
