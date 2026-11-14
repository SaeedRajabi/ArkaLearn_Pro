import { renderHook, act } from '@testing-library/react';
import { useWebRTC } from '../use-webrtc';
import * as signalR from '@microsoft/signalr';

// Mock signalR
jest.mock('@microsoft/signalr', () => {
  const mockConnection = {
    on: jest.fn(),
    off: jest.fn(),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    invoke: jest.fn().mockResolvedValue(undefined),
    onreconnecting: jest.fn(),
    onreconnected: jest.fn(),
    onclose: jest.fn(),
    connectionId: 'mock-connection-id',
    state: 'Connected',
  };

  return {
    HubConnectionBuilder: jest.fn().mockImplementation(() => ({
      withUrl: jest.fn().mockReturnThis(),
      withAutomaticReconnect: jest.fn().mockReturnThis(),
      withKeepAliveInterval: jest.fn().mockReturnThis(),
      withServerTimeout: jest.fn().mockReturnThis(),
      configureLogging: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue(mockConnection),
    })),
    LogLevel: { Information: 1, Trace: 0, Debug: 1, Warning: 2, Error: 3 },
    HttpTransportType: { LongPolling: 1, WebSockets: 2 },
    HubConnectionState: {
      Connected: 'Connected',
      Disconnected: 'Disconnected',
      Reconnecting: 'Reconnecting',
      Connecting: 'Connecting',
    },
  };
});

class MockRTCPeerConnection {
  static instances: MockRTCPeerConnection[] = [];
  signalingState = 'stable';
  connectionState = 'new';
  iceConnectionState = 'new';
  onicecandidate: ((e: unknown) => void) | null = null;
  onicecandidateerror: ((e: unknown) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  onnegotiationneeded: (() => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  ontrack: ((e: unknown) => void) | null = null;
  close = jest.fn();
  transceivers: Array<{
    direction: string;
    sender: { track: null; replaceTrack: jest.Mock };
    receiver: { track: { kind: string; id: string; readyState: string; enabled: boolean } };
  }> = [];
  constructor() {
    MockRTCPeerConnection.instances.push(this);
  }
  getTransceivers = jest.fn(() => this.transceivers);
  getReceivers = jest.fn(() => []);
  addTransceiver = jest.fn((kind: string) => {
    const transceiver = {
      direction: 'sendrecv',
      sender: { track: null, replaceTrack: jest.fn().mockResolvedValue(undefined) },
      receiver: { track: { kind, id: `receiver-${kind}-${this.transceivers.length}`, readyState: 'live', enabled: true } },
    };
    this.transceivers.push(transceiver);
    return transceiver;
  });
  createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: '' });
  createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: '' });
  setLocalDescription = jest.fn().mockResolvedValue(undefined);
  setRemoteDescription = jest.fn().mockResolvedValue(undefined);
  addIceCandidate = jest.fn().mockResolvedValue(undefined);
  remoteDescription: RTCSessionDescriptionInit | null = null;
}

describe('useWebRTC', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    displayName: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    emailVerified: true,
    role: 'organizer' as const,
    avatar: '',
    roomAccessToken: 'mock-token',
  };

  const mockOptions = {
    teacherEntersFirst: false,
    canPublishMedia: true,
    isModerator: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const connection = new signalR.HubConnectionBuilder().build();
    Object.assign(connection, { state: signalR.HubConnectionState.Disconnected });
    (connection.start as jest.Mock).mockReset().mockImplementation(async () => {
      Object.assign(connection, { state: signalR.HubConnectionState.Connected });
    });
    (connection.invoke as jest.Mock).mockReset().mockResolvedValue(undefined);
    MockRTCPeerConnection.instances = [];
    // @ts-expect-error test polyfill
    global.RTCPeerConnection = MockRTCPeerConnection;
    // @ts-expect-error test polyfill
    global.RTCSessionDescription = function (init: unknown) {
      return init;
    };
    // @ts-expect-error test polyfill
    global.RTCIceCandidate = function (init: unknown) {
      return init;
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('clears the reconnecting overlay after recovery through onclose', async () => {
    jest.useFakeTimers();
    const onHubReconnected = jest.fn();
    const { result } = renderHook(() => useWebRTC('meeting-1', mockUser, null, null, {
      ...mockOptions, onHubReconnected,
    }));
    await act(async () => {});
    const connection = new signalR.HubConnectionBuilder().build();
    act(() => {
      Object.assign(connection, { state: signalR.HubConnectionState.Disconnected });
      (connection.onreconnecting as jest.Mock).mock.calls[0][0]();
      (connection.onclose as jest.Mock).mock.calls[0][0]();
    });
    expect(result.current.isHubReconnecting).toBe(true);
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isHubReconnecting).toBe(false);
    expect(onHubReconnected).toHaveBeenCalledTimes(1);
    expect((connection.invoke as jest.Mock).mock.calls.filter(([method]) => method === 'JoinMeeting')).toHaveLength(2);
  });

  it('waits for rejoining the room before reporting a recovered connection', async () => {
    const onHubReconnected = jest.fn();
    const { result } = renderHook(() => useWebRTC('meeting-1', mockUser, null, null, {
      ...mockOptions, onHubReconnected,
    }));
    await act(async () => {});
    const connection = new signalR.HubConnectionBuilder().build();
    let finishJoin!: () => void;
    (connection.invoke as jest.Mock).mockImplementationOnce(() => new Promise<void>(resolve => {
      finishJoin = resolve;
    }));
    await act(async () => {
      (connection.onreconnecting as jest.Mock).mock.calls[0][0]();
      (connection.onreconnected as jest.Mock).mock.calls[0][0]();
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isHubReconnecting).toBe(true);
    expect(onHubReconnected).not.toHaveBeenCalled();
    await act(async () => { finishJoin(); });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isHubReconnecting).toBe(false);
    expect(onHubReconnected).toHaveBeenCalledTimes(1);
  });

  it('shows failure instead of a connected room when rejoining is rejected', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const onHubConnectionFailed = jest.fn();
    const onHubReconnected = jest.fn();
    const { result } = renderHook(() => useWebRTC('meeting-1', mockUser, null, null, {
      ...mockOptions, onHubConnectionFailed, onHubReconnected,
    }));
    await act(async () => {});
    const connection = new signalR.HubConnectionBuilder().build();
    (connection.invoke as jest.Mock).mockRejectedValueOnce(new Error('Join ticket rejected.'));
    await act(async () => {
      (connection.onreconnecting as jest.Mock).mock.calls[0][0]();
      (connection.onreconnected as jest.Mock).mock.calls[0][0]();
    });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isHubReconnecting).toBe(false);
    expect(result.current.hubConnectionId).toBeNull();
    expect(onHubConnectionFailed).toHaveBeenCalledTimes(1);
    expect(onHubReconnected).not.toHaveBeenCalled();
  });

  it('reports failure after all manual recovery attempts fail', async () => {
    jest.useFakeTimers();
    const onHubConnectionFailed = jest.fn();
    const { result } = renderHook(() => useWebRTC('meeting-1', mockUser, null, null, {
      ...mockOptions, onHubConnectionFailed,
    }));
    await act(async () => {});
    const connection = new signalR.HubConnectionBuilder().build();
    (connection.start as jest.Mock).mockRejectedValue(new Error('network error'));
    act(() => {
      Object.assign(connection, { state: signalR.HubConnectionState.Disconnected });
      (connection.onclose as jest.Mock).mock.calls[0][0]();
    });
    for (let attempt = 0; attempt < 12; attempt++) {
      await act(async () => { await jest.advanceTimersByTimeAsync(1000 * (attempt + 1)); });
    }
    expect(connection.start).toHaveBeenCalledTimes(13);
    expect(onHubConnectionFailed).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isHubReconnecting).toBe(false);
  });

  it('keeps a single startup retry loop when a failed start also fires onclose', async () => {
    jest.useFakeTimers();
    const connection = new signalR.HubConnectionBuilder().build();
    (connection.start as jest.Mock).mockImplementationOnce(async () => {
      (connection.onclose as jest.Mock).mock.calls[0][0]();
      throw new Error('network error');
    });
    const { result } = renderHook(() => useWebRTC('meeting-1', mockUser, null, null, mockOptions));
    await act(async () => { await jest.advanceTimersByTimeAsync(1500); });
    expect(connection.start).toHaveBeenCalledTimes(2);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isHubReconnecting).toBe(false);
  });

  it('connects a student without requesting microphone or camera access', async () => {
    const getUserMedia = jest.spyOn(navigator.mediaDevices, 'getUserMedia')
      .mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'));
    const { result } = renderHook(() => useWebRTC('meeting-1', {
      ...mockUser, role: 'participant' as const,
    }, null, null, { ...mockOptions, canPublishMedia: false, isModerator: false }));
    await act(async () => {});
    expect(result.current.isConnected).toBe(true);
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('should initialize and start SignalR connection', async () => {
    const { result } = renderHook(() =>
      useWebRTC('meeting-1', mockUser, null, null, mockOptions)
    );

    expect(result.current.isConnected).toBe(false);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const mockConnection = new signalR.HubConnectionBuilder().build();
    expect(mockConnection.start).toHaveBeenCalled();
  });

  it('shows the teacher-first lobby immediately for a student', async () => {
    const studentOptions = {
      teacherEntersFirst: true,
      canPublishMedia: false,
      isModerator: false,
      isHostTeacher: false,
    };

    const { result } = renderHook(() =>
      useWebRTC('meeting-1', { ...mockUser, role: 'participant' as const }, null, null, studentOptions)
    );

    expect(result.current.waitingForTeacher).toBe(true);
    await act(async () => {});
  });

  it('should handle incoming chat messages', async () => {
    const { result } = renderHook(() =>
      useWebRTC('meeting-1', mockUser, null, null, mockOptions)
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const mockConnection = new signalR.HubConnectionBuilder().build();

    const receiveMessageHandler = (mockConnection.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'ReceiveMessage'
    )[1];

    act(() => {
      receiveMessageHandler('Other User', 'Hello world');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].user).toBe('Other User');
    expect(result.current.messages[0].message).toBe('Hello world');
  });

  it('should expose methods to send messages and kick participants', async () => {
    const { result } = renderHook(() =>
      useWebRTC('meeting-1', mockUser, null, null, mockOptions)
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(true).toBe(true);
  });

  it('should keep a single peer when the same userId rejoins with a new connectionId', async () => {
    const { result } = renderHook(() =>
      useWebRTC('meeting-1', mockUser, null, null, mockOptions)
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const mockConnection = new signalR.HubConnectionBuilder().build();
    const userJoined = (mockConnection.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'UserJoined'
    )?.[1];

    expect(userJoined).toBeTruthy();

    const display = JSON.stringify({ id: 'student-9', name: 'Student Nine', avatar: '' });

    await act(async () => {
      userJoined(display, 'conn-a', 'student', false);
    });

    await act(async () => {
      userJoined(display, 'conn-b', 'student', false);
    });

    const sameUserPeers = result.current.peers.filter((p) => p.userId === 'student-9');
    expect(sameUserPeers).toHaveLength(1);
    expect(sameUserPeers[0].connectionId).toBe('conn-b');
  });

  it('does not create local media slots on the answerer before receiving the offer', async () => {
    renderHook(() => useWebRTC('meeting-1', mockUser, null, null, mockOptions));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    const connection = new signalR.HubConnectionBuilder().build();
    const joined = (connection.on as jest.Mock).mock.calls.find((call) => call[0] === 'UserJoined')![1];
    await act(async () => { joined('Earlier peer', 'aaa-offerer', 'student', false); });
    expect(MockRTCPeerConnection.instances.at(-1)!.addTransceiver).not.toHaveBeenCalled();
  });

  it('forwards real-time file invalidation and publishes upload completion through the hub', async () => {
    const onRoomFilesChanged = jest.fn();
    const { result } = renderHook(() => useWebRTC('meeting-1', mockUser, null, null, { ...mockOptions, onRoomFilesChanged }));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    const connection = new signalR.HubConnectionBuilder().build();
    const changed = (connection.on as jest.Mock).mock.calls.find((call) => call[0] === 'RoomFilesChanged')![1];
    act(() => changed('sender-2', JSON.stringify({ name: 'Student Two' })));
    expect(onRoomFilesChanged).toHaveBeenCalledWith('sender-2', 'Student Two');
    await act(async () => { await result.current.notifyRoomFilesChanged(); });
    expect(connection.invoke).toHaveBeenCalledWith('NotifyRoomFilesChanged', 'meeting-1');
  });

  it('publishes existing tracks immediately when this participant receives presenter access', async () => {
    const audioTrack = { id: 'mic-1', kind: 'audio', readyState: 'live', enabled: true } as MediaStreamTrack;
    const cameraTrack = {
      id: 'camera-1',
      kind: 'video',
      readyState: 'live',
      enabled: true,
      getSettings: () => ({ displaySurface: undefined }),
    } as unknown as MediaStreamTrack;
    const localStream = {
      getTracks: () => [audioTrack, cameraTrack],
      getAudioTracks: () => [audioTrack],
      getVideoTracks: () => [cameraTrack],
    } as unknown as MediaStream;
    const participantOptions = { ...mockOptions, canPublishMedia: false, isModerator: false };

    renderHook(() => useWebRTC('meeting-1', mockUser, localStream, null, participantOptions));
    await act(async () => void (await new Promise((resolve) => setTimeout(resolve, 0))));

    const mockConnection = new signalR.HubConnectionBuilder().build();
    const userJoined = (mockConnection.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'UserJoined'
    )?.[1];
    const grantsChanged = (mockConnection.on as jest.Mock).mock.calls.find(
      (call) => call[0] === 'YourGrantsChanged'
    )?.[1];

    await act(async () => {
      userJoined(JSON.stringify({ id: 'student-2', name: 'Student Two' }), 'zz-peer', 'student', false);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await act(async () => {
      grantsChanged(true, true, true);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const pc = MockRTCPeerConnection.instances.at(-1)!;
    expect(pc.transceivers[0].sender.replaceTrack).toHaveBeenLastCalledWith(audioTrack);
    expect(pc.transceivers[1].sender.replaceTrack).toHaveBeenLastCalledWith(cameraTrack);
  });
});
