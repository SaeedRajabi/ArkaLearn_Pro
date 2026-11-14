namespace ArkaLearnDesktop.Application.Abstractions;

public sealed record ScreenCaptureThreat(string DisplayName, string ProcessName, int ProcessId);

public interface IScreenCaptureGuard
{
    IReadOnlyList<ScreenCaptureThreat> Scan();
    bool HasActiveThreats();
    Task<ScreenCaptureCloseResult> CloseThreatsAsync(CancellationToken cancellationToken = default);
    void StartMonitoring(Action<IReadOnlyList<ScreenCaptureThreat>> onThreatsDetected);
    void StopMonitoring();
    void SetBlockedUiVisible(bool visible);
}

public sealed record ScreenCaptureCloseResult(
    bool AllClosed,
    IReadOnlyList<ScreenCaptureThreat> Remaining,
    IReadOnlyList<string> Errors);
