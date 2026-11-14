describe('WebRTC ICE configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_TURN_URL;
    delete process.env.NEXT_PUBLIC_TURN_USERNAME;
    delete process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  });

  afterAll(() => { process.env = originalEnv; });

  it('retains a complete TURN fallback when runtime config only supplies STUN', () => {
    process.env.NEXT_PUBLIC_TURN_URL = 'turn:relay.example:3478?transport=tcp';
    process.env.NEXT_PUBLIC_TURN_USERNAME = 'test-user';
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL = 'test-password';
    const config = require('../webrtc-ice-config') as typeof import('../webrtc-ice-config');
    config.setRuntimeIceServers({ stunUrls: 'stun:stun.example:3478' });
    expect(config.getWebRtcIceServers()).toEqual([
      { urls: 'stun:stun.example:3478' },
      { urls: 'turn:relay.example:3478?transport=tcp', username: 'test-user', credential: 'test-password' },
    ]);
    expect(config.isTurnConfigured()).toBe(true);
  });

  it('does not claim an incomplete TURN configuration is usable', () => {
    process.env.NEXT_PUBLIC_TURN_URL = 'turn:relay.example:3478';
    const config = require('../webrtc-ice-config') as typeof import('../webrtc-ice-config');
    config.setRuntimeIceServers({ stunUrls: 'stun:stun.example:3478' });
    expect(config.isTurnConfigured()).toBe(false);
  });
});
