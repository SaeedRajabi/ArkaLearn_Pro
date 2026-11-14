namespace ArkaSoftwarePro.Src.Core.Contracts.Caching;

public sealed class CacheWarmupProgress
{
    public string JobId { get; init; } = string.Empty;
    public string Status { get; set; } = "Idle"; // Idle | Running | Completed | Failed
    public int Percent { get; set; }
    public int CompletedItems { get; set; }
    public int TotalItems { get; set; }
    public string CurrentStep { get; set; } = string.Empty;
    public string? Error { get; set; }
    public DateTimeOffset? StartedAtUtc { get; set; }
    public DateTimeOffset? FinishedAtUtc { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
}

public interface ICacheWarmupService
{
    Task<CacheWarmupProgress> StartAsync(CancellationToken cancellationToken = default);
    CacheWarmupProgress GetStatus(string? jobId = null);
}
