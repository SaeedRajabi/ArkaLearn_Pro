namespace ArkaLearnDesktop.Application.Abstractions;

public sealed record DesktopMonitorInfo(
    int Index,
    string DisplayName,
    int Width,
    int Height,
    bool IsPrimary,
    int BoundsX,
    int BoundsY);

public interface IRemoteScreenShareAdapter
{
    bool IsSharing { get; }

    IReadOnlyList<DesktopMonitorInfo> GetMonitors();

    void Start(
        long sessionId,
        int monitorIndex,
        Func<long, string, Task> framePublisher,
        Action<byte[]?> localPreviewJpeg);

    void Stop();
}
