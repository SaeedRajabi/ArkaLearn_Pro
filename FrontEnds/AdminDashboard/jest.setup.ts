import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

global.MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn().mockReturnValue([]),
  getAudioTracks: jest.fn().mockReturnValue([]),
  getVideoTracks: jest.fn().mockReturnValue([]),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
})) as any;

// Mock WebRTC and MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(new global.MediaStream()),
    getDisplayMedia: jest.fn().mockResolvedValue(new global.MediaStream()),
    enumerateDevices: jest.fn().mockResolvedValue([]),
  },
});

global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  addTrack: jest.fn(),
  createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
  close: jest.fn(),
  onicecandidate: null,
  ontrack: null,
  onnegotiationneeded: null,
})) as any;
