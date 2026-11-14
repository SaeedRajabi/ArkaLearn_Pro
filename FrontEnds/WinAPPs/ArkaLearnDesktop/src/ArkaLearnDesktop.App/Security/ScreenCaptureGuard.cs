using System.Diagnostics;
using System.Collections.Concurrent;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.Security;

public sealed class ScreenCaptureGuard : IScreenCaptureGuard, IDisposable
{
    private static readonly ThreatDefinition[] Catalog =
    [
        // Remote desktop / support
        new("AnyDesk", "AnyDesk", "anydesk"),
        new("TeamViewer", "TeamViewer", "teamviewer"),
        new("TeamViewer", "TeamViewer_Service", "teamviewer_service"),
        new("TeamViewer", "tv_w32", "tv_w32"),
        new("TeamViewer", "tv_x64", "tv_x64"),
        new("RustDesk", "RustDesk", "rustdesk"),
        new("Chrome Remote Desktop", "remoting_host", "remoting_host"),
        new("Chrome Remote Desktop", "remote_host", "remote_host"),
        new("Chrome Remote Desktop", "chromoting", "chromoting"),
        new("Splashtop", "SplashtopStreamer", "splashtopstreamer"),
        new("Splashtop", "SRServer", "srserver"),
        new("AeroAdmin", "AeroAdmin", "aeroadmin"),
        new("UltraVNC", "winvnc", "winvnc"),
        new("UltraVNC", "winvnc4", "winvnc4"),
        new("TightVNC", "tvnserver", "tvnserver"),
        new("RealVNC", "vncserver", "vncserver"),
        new("RealVNC", "vncviewer", "vncviewer"),
        new("Parsec", "parsecd", "parsecd"),
        new("Parsec", "parsec", "parsec"),
        new("DWService", "dwagent", "dwagent"),
        new("Supremo", "Supremo", "supremo"),
        new("RemotePC", "RemotePC", "remotepc"),
        new("Zoom (remote control host)", "CptHost", "cpthost"),

        // Screen recorders / capture suites
        new("Camtasia", "CamtasiaStudio", "camtasiastudio"),
        new("Camtasia", "Camtasia", "camtasia"),
        new("Camtasia Recorder", "CamRecorder", "camrecorder"),
        new("Camtasia Recorder", "CamtasiaRecorder", "camtasiarecorder"),
        new("OBS Studio", "obs64", "obs64"),
        new("OBS Studio", "obs32", "obs32"),
        new("OBS Studio", "obs", "obs"),
        new("Bandicam", "Bandicam", "bandicam"),
        new("Bandicam", "bdcam", "bdcam"),
        new("ShareX", "ShareX", "sharex"),
        new("Snagit", "Snagit32", "snagit32"),
        new("Snagit", "SnagitEditor", "snagiteditor"),
        new("Snagit", "SnagitCapture", "snagitcapture"),
        new("Screenpresso", "Screenpresso", "screenpresso"),
        new("Loom", "Loom", "loom"),
        new("Fraps", "Fraps", "fraps"),
        new("Action!", "Action!", "action!"),
        new("FlashBack Recorder", "FlashBackRecorder", "flashbackrecorder"),
        new("Debut", "Debut", "debut"),
        new("Icecream Screen Recorder", "icecreamscreenrecorder", "icecreamscreenrecorder"),
        new("Apowersoft Screen Recorder", "screenrecorder", "screenrecorder"),
    ];

    private readonly object _gate = new();
    private readonly ConcurrentDictionary<int, byte> _selfPids = new();
    private System.Threading.Timer? _timer;
    private Action<IReadOnlyList<ScreenCaptureThreat>>? _onThreatsDetected;
    private bool _isBlockedUiVisible;
    private bool _disposed;

    public ScreenCaptureGuard()
    {
        try
        {
            _selfPids[Environment.ProcessId] = 0;
        }
        catch
        {
            // ignore
        }
    }

    public IReadOnlyList<ScreenCaptureThreat> Scan()
    {
        var found = new List<ScreenCaptureThreat>();
        Process[] processes;
        try
        {
            processes = Process.GetProcesses();
        }
        catch
        {
            return found;
        }

        foreach (var process in processes)
        {
            try
            {
                if (_selfPids.ContainsKey(process.Id))
                    continue;

                string name;
                try
                {
                    name = process.ProcessName;
                }
                catch
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(name))
                    continue;

                var normalized = name.Trim().ToLowerInvariant();
                foreach (var def in Catalog)
                {
                    if (!string.Equals(normalized, def.ProcessNameNormalized, StringComparison.Ordinal))
                        continue;

                    found.Add(new ScreenCaptureThreat(def.DisplayName, process.ProcessName, process.Id));
                    break;
                }
            }
            finally
            {
                process.Dispose();
            }
        }

        return found
            .GroupBy(x => (x.DisplayName, x.ProcessId))
            .Select(g => g.First())
            .OrderBy(x => x.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(x => x.ProcessName, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public bool HasActiveThreats() => Scan().Count > 0;

    public async Task<ScreenCaptureCloseResult> CloseThreatsAsync(CancellationToken cancellationToken = default)
    {
        var threats = Scan();
        var errors = new List<string>();

        foreach (var group in threats.GroupBy(t => t.ProcessId))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var sample = group.First();
            try
            {
                using var process = Process.GetProcessById(sample.ProcessId);
                process.Kill(entireProcessTree: true);
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(8));
                try
                {
                    await process.WaitForExitAsync(timeoutCts.Token);
                }
                catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
                {
                    errors.Add($"{sample.DisplayName}: زمان بستن به پایان رسید.");
                }
            }
            catch (ArgumentException)
            {
                // Already exited.
            }
            catch (Exception ex)
            {
                errors.Add($"{sample.DisplayName}: {ex.Message}");
            }
        }

        // Give the OS a moment to release processes.
        await Task.Delay(700, cancellationToken);
        var remaining = Scan();
        return new ScreenCaptureCloseResult(remaining.Count == 0, remaining, errors);
    }

    public void StartMonitoring(Action<IReadOnlyList<ScreenCaptureThreat>> onThreatsDetected)
    {
        lock (_gate)
        {
            _onThreatsDetected = onThreatsDetected;
            _timer?.Dispose();
            _timer = new System.Threading.Timer(OnTick, null, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(2.5));
        }
    }

    public void StopMonitoring()
    {
        lock (_gate)
        {
            _timer?.Dispose();
            _timer = null;
            _onThreatsDetected = null;
        }
    }

    public void SetBlockedUiVisible(bool visible) => _isBlockedUiVisible = visible;

    private void OnTick(object? state)
    {
        if (_disposed || _isBlockedUiVisible) return;

        IReadOnlyList<ScreenCaptureThreat> threats;
        try
        {
            threats = Scan();
        }
        catch
        {
            return;
        }

        if (threats.Count == 0) return;

        Action<IReadOnlyList<ScreenCaptureThreat>>? callback;
        lock (_gate)
            callback = _onThreatsDetected;

        callback?.Invoke(threats);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        StopMonitoring();
    }

    private sealed record ThreatDefinition(string DisplayName, string ProcessName, string ProcessNameNormalized);
}
