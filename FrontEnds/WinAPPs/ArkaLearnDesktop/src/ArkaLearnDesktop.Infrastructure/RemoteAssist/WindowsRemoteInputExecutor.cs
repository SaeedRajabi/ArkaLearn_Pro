using System.Runtime.InteropServices;
using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.RemoteAssist;

public sealed class WindowsRemoteInputExecutor : IRemoteInputExecutor
{
    private const int InputMouse = 0;
    private const int InputKeyboard = 1;
    private const uint MouseEventMove = 0x0001;
    private const uint MouseEventLeftDown = 0x0002;
    private const uint MouseEventLeftUp = 0x0004;
    private const uint MouseEventRightDown = 0x0008;
    private const uint MouseEventRightUp = 0x0010;
    private const uint MouseEventAbsolute = 0x8000;
    private const uint MouseEventVirtualDesk = 0x4000;
    private const uint KeyEventKeyUp = 0x0002;
    private const int SmXVirtualScreen = 76;
    private const int SmYVirtualScreen = 77;
    private const int SmCxVirtualScreen = 78;
    private const int SmCyVirtualScreen = 79;

    private int _boundsX;
    private int _boundsY;
    private int _boundsWidth;
    private int _boundsHeight;
    private bool _hasTarget;

    public event Action<int, int>? CursorMoved;

    public void SetTargetScreen(int boundsX, int boundsY, int width, int height)
    {
        _boundsX = boundsX;
        _boundsY = boundsY;
        _boundsWidth = Math.Max(1, width);
        _boundsHeight = Math.Max(1, height);
        _hasTarget = true;
    }

    public void ClearTargetScreen() => _hasTarget = false;

    public void Apply(string payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson)) return;

        try
        {
            using var doc = JsonDocument.Parse(payloadJson);
            var root = doc.RootElement;
            if (!root.TryGetProperty("kind", out var kindProp)) return;

            var kind = kindProp.GetString();
            switch (kind)
            {
                case "mouseMove":
                    MoveMouse(ReadPercent(root, "x"), ReadPercent(root, "y"));
                    break;
                case "mouseButton":
                    MoveMouse(ReadPercent(root, "x"), ReadPercent(root, "y"));
                    ClickMouse(root.GetProperty("button").GetInt32(), root.GetProperty("down").GetBoolean());
                    break;
                case "key":
                    SendKey(root.GetProperty("vk").GetInt32(), root.GetProperty("down").GetBoolean());
                    break;
            }
        }
        catch
        {
            // ignore malformed payloads
        }
    }

    private static double ReadPercent(JsonElement root, string name) =>
        root.TryGetProperty(name, out var value) ? Math.Clamp(value.GetDouble(), 0, 1) : 0;

    private void MoveMouse(double percentX, double percentY)
    {
        int absoluteX;
        int absoluteY;
        int screenX;
        int screenY;
        uint flags = MouseEventMove | MouseEventAbsolute;

        if (_hasTarget)
        {
            var virtualLeft = GetSystemMetrics(SmXVirtualScreen);
            var virtualTop = GetSystemMetrics(SmYVirtualScreen);
            var virtualWidth = Math.Max(1, GetSystemMetrics(SmCxVirtualScreen));
            var virtualHeight = Math.Max(1, GetSystemMetrics(SmCyVirtualScreen));

            screenX = _boundsX + (int)Math.Round(percentX * Math.Max(0, _boundsWidth - 1));
            screenY = _boundsY + (int)Math.Round(percentY * Math.Max(0, _boundsHeight - 1));
            absoluteX = NormalizeAbsolute(screenX - virtualLeft, virtualWidth);
            absoluteY = NormalizeAbsolute(screenY - virtualTop, virtualHeight);
            flags |= MouseEventVirtualDesk;
        }
        else
        {
            var width = Math.Max(1, GetSystemMetrics(0));
            var height = Math.Max(1, GetSystemMetrics(1));
            screenX = (int)Math.Round(percentX * Math.Max(0, width - 1));
            screenY = (int)Math.Round(percentY * Math.Max(0, height - 1));
            absoluteX = (int)Math.Round(Math.Clamp(percentX, 0, 1) * 65535.0);
            absoluteY = (int)Math.Round(Math.Clamp(percentY, 0, 1) * 65535.0);
        }

        var input = new Input
        {
            Type = InputMouse,
            U = new InputUnion
            {
                Mi = new MouseInput
                {
                    Dx = absoluteX,
                    Dy = absoluteY,
                    MouseData = 0,
                    Flags = flags,
                    Time = 0,
                    ExtraInfo = IntPtr.Zero,
                },
            },
        };

        if (SendInput(1, [input], Marshal.SizeOf<Input>()) > 0)
            CursorMoved?.Invoke(screenX, screenY);
    }

    private static int NormalizeAbsolute(int coordinate, int dimension) =>
        (int)Math.Round(Math.Clamp(coordinate / (double)Math.Max(1, dimension - 1), 0, 1) * 65535.0);

    private static void ClickMouse(int button, bool down)
    {
        var flags = button switch
        {
            2 => down ? MouseEventRightDown : MouseEventRightUp,
            _ => down ? MouseEventLeftDown : MouseEventLeftUp,
        };

        var input = new Input
        {
            Type = InputMouse,
            U = new InputUnion
            {
                Mi = new MouseInput
                {
                    Flags = flags,
                    ExtraInfo = IntPtr.Zero,
                },
            },
        };

        SendInput(1, [input], Marshal.SizeOf<Input>());
    }

    private static void SendKey(int virtualKey, bool down)
    {
        var input = new Input
        {
            Type = InputKeyboard,
            U = new InputUnion
            {
                Ki = new KeyboardInput
                {
                    VirtualKey = (ushort)virtualKey,
                    ScanCode = 0,
                    Flags = down ? 0u : KeyEventKeyUp,
                    Time = 0,
                    ExtraInfo = IntPtr.Zero,
                },
            },
        };

        SendInput(1, [input], Marshal.SizeOf<Input>());
    }

    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int index);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint inputCount, Input[] inputs, int size);

    [StructLayout(LayoutKind.Sequential)]
    private struct Input
    {
        public int Type;
        public InputUnion U;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion
    {
        [FieldOffset(0)] public MouseInput Mi;
        [FieldOffset(0)] public KeyboardInput Ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MouseInput
    {
        public int Dx;
        public int Dy;
        public uint MouseData;
        public uint Flags;
        public uint Time;
        public IntPtr ExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KeyboardInput
    {
        public ushort VirtualKey;
        public ushort ScanCode;
        public uint Flags;
        public uint Time;
        public IntPtr ExtraInfo;
    }
}
